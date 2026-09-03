"""
Dentura — Locust stress test
=============================

Run from the project root (where docker-compose.yml lives):

    locust -f backend/locustfile.py --host http://localhost

Then open http://localhost:8089 in your browser to configure
users / spawn rate and start the test.

What this tests
---------------
• Public SSR pages  — home, doctors list, doctor detail, blog, articles, before/after
• OTP / Login flow  — login page, OTP entry, resend, logout
• Mixed realistic   — a combination of page browsing + auth flow

Doctor detail pages use real slugs scraped from the /doctors/ HTML page
at startup (the API requires auth, so we parse the public page instead).
"""

import itertools
import re
import random
import string

from locust import HttpUser, task, between, tag


# ── Helpers ───────────────────────────────────────────────────

def _random_phone() -> str:
    """Generate a random Iranian phone number: 09xxxxxxxxx (11 digits)."""
    digits = "".join(random.choices(string.digits, k=9))
    return f"09{digits}"


def _extract_csrf(html: str) -> str:
    """Pull the CSRF token from a Django form HTML."""
    marker = 'name="csrfmiddlewaretoken" value="'
    start = html.find(marker)
    if start == -1:
        return ""
    start += len(marker)
    end = html.find('"', start)
    return html[start:end]


# Regex to find doctor slugs from the team page HTML.
# Matches href="/doctors/<slug>/" patterns in the rendered template.
_DOCTOR_SLUG_RE = re.compile(r'href="/doctors/([^"/]+)/"')


def _fetch_doctor_slugs(client) -> list[str]:
    """Scrape real doctor slugs from the public /doctors/ page.

    The API requires authentication, so we parse the rendered HTML instead.
    Falls back to an empty list if the page is unreachable.
    """
    try:
        resp = client.get("/doctors/", name="/doctors/ [seed]")
        if resp.status_code == 200:
            slugs = _DOCTOR_SLUG_RE.findall(resp.text)
            # Deduplicate while preserving order
            seen = set()
            unique = []
            for s in slugs:
                if s not in seen:
                    seen.add(s)
                    unique.append(s)
            if unique:
                return unique
    except Exception:
        pass
    return []


# Shared slug state — populated once per worker via on_start.
_doctor_slugs: list[str] = []
_slug_cycle = None


def _get_slug_cycle():
    """Return a cycling iterator over real doctor slugs.

    Returns None if no slugs are available.
    """
    global _slug_cycle
    if not _doctor_slugs:
        return None
    if _slug_cycle is None:
        _slug_cycle = itertools.cycle(_doctor_slugs)
    return _slug_cycle


def _seed_slugs(client):
    """Fetch doctor slugs once per worker (shared across user classes)."""
    global _doctor_slugs, _slug_cycle
    if not _doctor_slugs:
        _doctor_slugs = _fetch_doctor_slugs(client)
        _slug_cycle = itertools.cycle(_doctor_slugs) if _doctor_slugs else None


# ──────────────────────────────────────────────────────────────
#  1.  Public template pages (no login required)
# ──────────────────────────────────────────────────────────────
class PublicPagesUser(HttpUser):
    """Simulates anonymous visitors hitting the public SSR pages."""

    weight = 8  # most traffic is anonymous
    wait_time = between(1, 3)

    def on_start(self):
        _seed_slugs(self.client)

    @tag("home")
    @task(3)
    def home(self):
        self.client.get("/", name="/ [home]")

    @tag("doctors")
    @task(3)
    def doctors_list(self):
        self.client.get("/doctors/", name="/doctors/")

    @tag("doctors")
    @task(2)
    def doctor_detail(self):
        """Visit a real doctor profile page, cycling through all doctors."""
        cycle = _get_slug_cycle()
        if cycle:
            slug = next(cycle)
            self.client.get(f"/doctors/{slug}/", name="/doctors/<slug>/")

    @tag("blog")
    @task(2)
    def blog(self):
        self.client.get("/blog/", name="/blog/")

    @tag("blog")
    @task(2)
    def blog_articles(self):
        self.client.get("/blog/articles/", name="/blog/articles/")

    @tag("blog")
    @task(2)
    def before_after(self):
        self.client.get("/blog/before_after/", name="/blog/before_after/")


# ──────────────────────────────────────────────────────────────
#  2.  OTP / Login flow (session + random phone)
# ──────────────────────────────────────────────────────────────
class OtpFlowUser(HttpUser):
    """Simulates the login → OTP page flow.

    Each virtual user gets a unique random 09xxxxxxxxx phone number
    stored in the session via the login POST.
    """

    weight = 1
    wait_time = between(2, 5)

    def on_start(self):
        self._phone = _random_phone()
        self._setup_session()

    def _setup_session(self):
        resp = self.client.get("/accounts/login/", name="/accounts/login/ [GET]")
        if resp.status_code != 200:
            return

        csrf_token = _extract_csrf(resp.text)

        with self.client.post(
            "/accounts/login/",
            data={
                "phone_number": self._phone,
                "csrfmiddlewaretoken": csrf_token,
            },
            headers={"Referer": "/accounts/login/"},
            name="/accounts/login/ [POST]",
            allow_redirects=False,
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 302, 429):
                resp.success()
            else:
                resp.failure(f"Unexpected status {resp.status_code}")

    @tag("otp")
    @task(3)
    def otp_page(self):
        """GET /accounts/otp/ — requires phone_number in session."""
        self.client.get("/accounts/otp/", name="/accounts/otp/")

    @tag("otp")
    @task(1)
    def resend_otp(self):
        """Simulate hitting the resend-otp endpoint."""
        resp = self.client.get("/accounts/otp/", name="/accounts/otp/")
        csrf_token = _extract_csrf(resp.text) if resp.status_code == 200 else ""

        self.client.post(
            "/accounts/resend-otp/",
            data={"csrfmiddlewaretoken": csrf_token},
            headers={"Referer": "/accounts/otp/"},
            name="/accounts/resend-otp/ [POST]",
            allow_redirects=False,
        )

    @tag("auth")
    @task(1)
    def logout(self):
        self.client.get("/accounts/logout/", name="/accounts/logout/")


# ──────────────────────────────────────────────────────────────
#  3.  Mixed realistic user (pages + auth flow together)
# ──────────────────────────────────────────────────────────────
class MixedUser(HttpUser):
    """Simulates a realistic user who browses pages and triggers
    the OTP flow — the most common real-world pattern."""

    weight = 4
    wait_time = between(2, 4)

    def on_start(self):
        self._phone = _random_phone()
        _seed_slugs(self.client)

    @tag("mixed")
    @task(5)
    def browse_home(self):
        """Visit the home page — most common entry point."""
        with self.client.get("/", name="/ [home]", catch_response=True) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Home returned {resp.status_code}")

    @tag("mixed")
    @task(4)
    def browse_doctors(self):
        self.client.get("/doctors/", name="/doctors/")

    @tag("mixed")
    @task(3)
    def browse_doctor_detail(self):
        cycle = _get_slug_cycle()
        if cycle:
            slug = next(cycle)
            self.client.get(f"/doctors/{slug}/", name="/doctors/<slug>/")

    @tag("mixed")
    @task(3)
    def browse_blog(self):
        self.client.get("/blog/", name="/blog/")

    @tag("mixed")
    @task(3)
    def browse_before_after(self):
        self.client.get("/blog/before_after/", name="/blog/before_after/")

    @tag("mixed")
    @task(1)
    def otp_flow(self):
        """Quick login → OTP page hit."""
        resp = self.client.get("/accounts/login/", name="/accounts/login/")
        if resp.status_code == 200:
            csrf = _extract_csrf(resp.text)
            self.client.post(
                "/accounts/login/",
                data={
                    "phone_number": self._phone,
                    "csrfmiddlewaretoken": csrf,
                },
                headers={"Referer": "/accounts/login/"},
                name="/accounts/login/ [POST]",
                allow_redirects=False,
            )
        self.client.get("/accounts/otp/", name="/accounts/otp/")
