
import requests

from app.core.result import ScanReport, ScanResult
from app.scanners.base import BaseScanner


class BruteForceScanner(BaseScanner):
    """
    Memeriksa indikasi perlindungan rate limiting
    pada endpoint autentikasi.

    Scanner tidak melakukan password guessing,
    credential stuffing, atau percobaan login.
    """

    def __init__(
        self,
        target_url: str,
        config=None,
    ):
        super().__init__(target_url, config)

    def scan(self) -> ScanReport:
        """
        Melakukan satu pemeriksaan pasif terhadap endpoint
        yang disediakan untuk pengujian rate limiting.
        """

        try:
            response = self.request(
                "GET",
                self.target_url,
            )

            self._inspect_response(response)

        except requests.RequestException as error:
            self.add_error(
                f"Authentication rate-limit check error: {error}"
            )

        return self.report

    def _inspect_response(
        self,
        response: requests.Response,
    ) -> None:
        """
        Memeriksa header dan status HTTP terkait rate limiting.
        """

        status_code = response.status_code

        retry_after = response.headers.get(
            "Retry-After"
        )

        rate_limit_headers = {
            key.lower(): value
            for key, value in response.headers.items()
            if key.lower().startswith("x-ratelimit-")
            or key.lower().startswith("ratelimit-")
        }

        if status_code == 429:
            return

        if retry_after or rate_limit_headers:
            return

        self.add_finding(
            ScanResult(
                title="Rate Limit Protection Not Observed",
                vulnerability_type="Brute Force",
                severity="info",
                description=(
                    "Respons endpoint tidak menunjukkan "
                    "indikator rate limiting melalui status "
                    "HTTP maupun header yang diperiksa. "
                    "Pemeriksaan ini bersifat pasif dan "
                    "belum membuktikan bahwa perlindungan "
                    "brute force tidak tersedia."
                ),
                affected_endpoint=self.target_url,
                evidence={
                    "detection_method": "passive_rate_limit_header_check",
                    "http_status": status_code,
                    "retry_after_present": False,
                    "rate_limit_headers_present": False,
                    "credential_attempts": 0,
                },
                recommendation=(
                    "Pastikan endpoint autentikasi memiliki "
                    "rate limiting, progressive delay, "
                    "monitoring percobaan gagal, dan "
                    "perlindungan account lockout yang aman."
                ),
                cvss_score=None,
            )
        )
