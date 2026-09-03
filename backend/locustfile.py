"""
Dentura — Locust stress test
=============================

Run from the project root (where docker-compose.yml lives):

    locust -f backend/locustfile.py --host http://localhost

Then open http://localhost:8089 in your browser to configure
users / spawn rate and start the test.

What this tests
---------------
• Public SSR pages  — home, team list, doctor detail, blog, articles, before/after
• OTP / Login flow  — login page, OTP entry, resend, logout
• Mixed realistic   — a combination of page browsing + auth flow

Doctor detail pages use real slugs fetched from /api/doctors/ at startup.
"""

import itertools
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


def _fetch_doctor_slugs(client, host: str) -> list[str]:
    """Hit /api/doctors/ once and return a list of real doctor slugs.

    Falls back to an empty list if the endpoint is unreachable.
    """
    try:
        resp = client.get("/api/doctors/", name="/api/doctors/ [seed]")
        if resp.status_code == 200:
            data = resp.json()
            # DRF paginated or plain list — handle both
            results = data if isinstance(data, list) else data.get("results", [])
            slugs = [d["slug"] for d in results if d.get("slug")]
            if slugs:
                return slugs
    except Exception:
        pass
    return []


# Shared slug iterator — populated once per worker via on_start.
# We store it on the module level so all user classes share it
# after the first fetch.
_doctor_slugs: list[str] = []
_slug_cycle = None


def _get_slug_cycle():
    """Return a cycling iterator over real doctor slugs."""
    global _slug_cycle
    if _slug_cycle is None or not _doctor_slugs:
        _slug_cycle = itertools.cycle(_doctor_slugs)
    return _slug_cycle


# ──────────────────────────────────────────────────────────────
#  1.  Public template pages (no login required)
# ──────────────────────────────────────────────────────────────
class PublicPagesUser(HttpUser):
    """Simulates anonymous visitors hitting the public SSR pages."""

    weight = 8  # most traffic is anonymous
    wait_time = between(1, 3)

    def on_start(self):
        global _doctor_slugs
        if not _doctor_slugs:
            _doctor_slugs = _fetch_doctor_slugs(self.client, self.host)
            # Reset the cycle with fresh data
            global _slug_cycle
            _slug_cycle = itertools.cycle(_doctor_slugs) if _doctor_slugs else None

    @tag("home")
    @task(3)
    def home(self):
        self.client.get("/", name="/ [home]")

    @tag("doctors")
    @task(3)
    def team(self):
        self.client.get("/team/", name="/team/")

    @tag("doctors")
    @task(2)
    def doctor_detail(self):
        """Visit a real doctor profile page, cycling through all doctors."""
        cycle = _get_slug_cycle()
        if cycle:
            slug = next(cycle)
            self.client.get(f"/team/{slug}/", name="/team/<slug>/")
        else:
            # No slugs available — still hit the page to measure the 404 / fallback
            self.client.get("/team/unknown-doctor/", name="/team/<slug>/ [fallback]")

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
        global _doctor_slugs
        if not _doctor_slugs:
            _doctor_slugs = _fetch_doctor_slugs(self.client, self.host)
            global _slug_cycle
            _slug_cycle = itertools.cycle(_doctor_slugs) if _doctor_slugs else None

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
    def browse_team(self):
        self.client.get("/team/", name="/team/")

    @tag("mixed")
    @task(3)
    def browse_doctor_detail(self):
        cycle = _get_slug_cycle()
        if cycle:
            slug = next(cycle)
            self.client.get(f"/team/{slug}/", name="/team/<slug>/")

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
