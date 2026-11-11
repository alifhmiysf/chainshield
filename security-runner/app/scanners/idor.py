
from urllib.parse import urlsplit

import requests

from app.core.result import ScanReport, ScanResult
from app.scanners.base import BaseScanner


class IDORScanner(BaseScanner):
    """
    Authorization comparison scanner.

    Membandingkan akses dua identitas yang secara eksplisit
    disediakan untuk pengujian pada satu resource yang sama.

    Scanner tidak menebak ID atau melakukan enumerasi resource.
    """

    def __init__(
        self,
        target_url: str,
        resource_path: str,
        owner_token: str,
        comparison_token: str,
        config=None,
    ):
        super().__init__(target_url, config)

        if not resource_path or not resource_path.strip():
            raise ValueError("Resource path tidak boleh kosong.")

        if not owner_token or not comparison_token:
            raise ValueError("Kedua token pengujian wajib disediakan.")

        if owner_token == comparison_token:
            raise ValueError("Token kedua identitas harus berbeda.")

        self.resource_url = self._validate_resource_url(
            resource_path
        )

        self.owner_token = owner_token
        self.comparison_token = comparison_token

    def _validate_resource_url(self, resource_path: str) -> str:
        """
        Memastikan resource masih berada pada origin target.
        """

        if resource_path.startswith("/"):
            resource_url = f"{self.target_url}{resource_path}"
        else:
            resource_url = resource_path

        parsed_target = urlsplit(self.target_url)
        parsed_resource = urlsplit(resource_url)

        target_origin = (
            parsed_target.scheme,
            parsed_target.hostname,
            parsed_target.port,
        )

        resource_origin = (
            parsed_resource.scheme,
            parsed_resource.hostname,
            parsed_resource.port,
        )

        if target_origin != resource_origin:
            raise ValueError(
                "Resource harus berada pada origin target."
            )

        return resource_url

    def _request_as(self, token: str) -> requests.Response:
        """
        Mengakses resource menggunakan identitas pengujian.
        """

        if self.request_count >= self.config.max_requests:
            raise RuntimeError(
                "Batas maksimum request scanner telah tercapai."
            )

        self.request_count += 1

        return self.session.get(
            self.resource_url,
            headers={
                "Authorization": f"Bearer {token}",
            },
            timeout=self.config.request_timeout,
            allow_redirects=False,
        )

    def _inspect_access(
        self,
        owner_response: requests.Response,
        comparison_response: requests.Response,
    ) -> None:
        """
        Membandingkan hasil akses kedua identitas.
        """

        owner_status = owner_response.status_code
        comparison_status = comparison_response.status_code

        owner_can_access = owner_status == 200
        comparison_can_access = comparison_status == 200

        if not owner_can_access or not comparison_can_access:
            return

        owner_body = owner_response.text[:100_000]
        comparison_body = comparison_response.text[:100_000]

        if not owner_body or not comparison_body:
            return

        if owner_body != comparison_body:
            return

        self.add_finding(
            ScanResult(
                title="Potential IDOR / Broken Object Authorization",
                vulnerability_type="IDOR",
                severity="high",
                description=(
                    "Dua identitas pengujian memperoleh respons "
                    "resource yang identik. Jika resource tersebut "
                    "seharusnya hanya dapat diakses pemiliknya, "
                    "kondisi ini mengindikasikan potensi kelemahan "
                    "object-level authorization."
                ),
                affected_endpoint=self.resource_url,
                evidence={
                    "detection_method": "authorization_comparison",
                    "owner_http_status": owner_status,
                    "comparison_http_status": comparison_status,
                    "responses_identical": True,
                    "owner_identity": "authorized_test_identity_a",
                    "comparison_identity": "authorized_test_identity_b",
                },
                recommendation=(
                    "Terapkan object-level authorization pada setiap "
                    "request resource. Pastikan server memverifikasi "
                    "kepemilikan atau izin akses berdasarkan identitas "
                    "yang sedang terautentikasi."
                ),
                cvss_score=7.1,
            )
        )

    def scan(self) -> ScanReport:
        try:
            owner_response = self._request_as(
                self.owner_token
            )

            comparison_response = self._request_as(
                self.comparison_token
            )

            self._inspect_access(
                owner_response,
                comparison_response,
            )

        except requests.RequestException as error:
            self.add_error(
                f"IDOR scanner HTTP error: {error}"
            )

        return self.report
