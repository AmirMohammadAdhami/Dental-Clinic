"""
Dentura — Locust stress test
=============================

Run from the project root (where docker-compose.yml lives):

    locust -f backend/locustfile.py --host http://localhost

Then open http://localhost:8089 in your browser to configure
users / spawn rate and start the test.
"""

import random
import string

from locust import HttpUser, task, between, tag


def _random_phone() -> str:
    """Generate a random Iranian phone number: 09xxxxxxxxx (11 digits)."""
    digits = "".join(random.choices(string.digits, k=9))
    return f"09{digits}"


# ──────────────────────────────────────────────────────────────
#  1.  Public template pages (no login required)
# ──────────────────────────────────────────────────────────────
class PublicPagesUser(HttpUser):
    """Simulates anonymous visitors hitting the public pages."""

    weight = 5  # more weight — most traffic is anonymous
    wait_time = between(1, 3)

    @tag("home")
    @task(3)
    def home(self):
        self.client.get("/", name="/ [home]")

    @tag("doctors")
    @task(3)
    def doctors_list(self):
        self.client.get("/doctors/", name="/doctors/")

    @tag("blog")
    @task(2)
    def blog(self):
        self.client.get("/blog/", name="/blog/")

    @tag("before_after")
    @task(2)
    def before_after(self):
        self.client.get("/blog/before_after/", name="/blog/before_after/")


# ──────────────────────────────────────────────────────────────
#  2.  API-only hits (the endpoints that templates call via JS)
# ──────────────────────────────────────────────────────────────
class ApiUser(HttpUser):
    """Hits the JSON API endpoints directly — useful for measuring
    cache performance and backend throughput under load."""

    weight = 3
    wait_time = between(1, 2)

    @tag("api", "doctors")
    @task(3)
    def api_doctors(self):
        self.client.get("/api/doctors/", name="/api/doctors/")

    @tag("api", "assistants")
    @task(2)
    def api_assistants(self):
        self.client.get("/api/assistants/", name="/api/assistants/")

    @tag("api", "before_afters")
    @task(2)
    def api_before_afters(self):
        self.client.get("/api/before-afters/", name="/api/before-afters/")

    @tag("api", "doctor_reviews")
    @task(2)
    def api_doctor_reviews(self):
        self.client.get("/api/doctor-reviews/", name="/api/doctor-reviews/")

    @tag("api", "home_videos")
    @task(2)
    def api_home_videos(self):
        self.client.get("/api/home-videos/", name="/api/home-videos/")

    @tag("api", "services")
    @task(1)
    def api_services(self):
        self.client.get("/api/services/", name="/api/services/")

    @tag("api", "faqs")
    @task(1)
    def api_faqs(self):
        self.client.get("/api/faqs/", name="/api/faqs/")


# ──────────────────────────────────────────────────────────────
#  3.  OTP / Login flow (session + random phone)
# ──────────────────────────────────────────────────────────────
class OtpFlowUser(HttpUser):
    """Simulates the login → OTP page flow.
    Each virtual user gets a unique random 09xxxxxxxxx phone number
    stored in the session via the login POST."""

    weight = 2
    wait_time = between(2, 5)

    def on_start(self):
        """Called once when the virtual user starts.
        POST to /accounts/login/ with a random phone number so the
        session has phone_number set, then we can hit /accounts/otp/."""
        self._phone = _random_phone()
        self._setup_session()

    def _setup_session(self):
        resp = self.client.get("/accounts/login/", name="/accounts/login/ [GET]")
        if resp.status_code != 200:
            return

        csrf_token = self._extract_csrf(resp.text)

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

    @staticmethod
    def _extract_csrf(html: str) -> str:
        """Pull the CSRF token from the login form HTML."""
        marker = 'name="csrfmiddlewaretoken" value="'
        start = html.find(marker)
        if start == -1:
            return ""
        start += len(marker)
        end = html.find('"', start)
        return html[start:end]

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
        csrf_token = self._extract_csrf(resp.text) if resp.status_code == 200 else ""

        self.client.post(
            "/accounts/resend-otp/",
            data={"csrfmiddlewaretoken": csrf_token},
            headers={"Referer": "/accounts/otp/"},
            name="/accounts/resend-otp/ [POST]",
            allow_redirects=False,
        )


# ──────────────────────────────────────────────────────────────
#  4.  Mixed realistic user (pages + APIs together)
# ──────────────────────────────────────────────────────────────
class MixedUser(HttpUser):
    """Simulates a realistic user who browses pages and triggers
    the background API calls that the frontend JS makes."""

    weight = 4
    wait_time = between(2, 4)

    def on_start(self):
        self._phone = _random_phone()

    @tag("mixed")
    @task(5)
    def browse_home(self):
        """Visit the home page — the frontend JS will call multiple APIs."""
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
    def browse_blog(self):
        self.client.get("/blog/", name="/blog/")

    @tag("mixed")
    @task(3)
    def browse_before_after(self):
        self.client.get("/blog/before_after/", name="/blog/before_after/")

    @tag("mixed")
    @task(1)
    def otp_flow(self):
        """Quick OTP page hit after setting session."""
        resp = self.client.get("/accounts/login/", name="/accounts/login/")
        if resp.status_code == 200:
            csrf = self._extract_csrf(resp.text)
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

    @staticmethod
    def _extract_csrf(html: str) -> str:
        marker = 'name="csrfmiddlewaretoken" value="'
        start = html.find(marker)
        if start == -1:
            return ""
        start += len(marker)
        end = html.find('"', start)
        return html[start:end]
