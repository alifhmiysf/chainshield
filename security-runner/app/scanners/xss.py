
import html
import secrets
import string
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import requests

from app.core.result import ScanReport, ScanResult
from app.scanners.base import BaseScanner


class XSSScanner(BaseScanner):
    """
    Reflected input scanner.

    Mendeteksi indikasi input yang dipantulkan ke respons HTML
    tanpa HTML encoding yang sesuai.

    Tidak menjalankan JavaScript atau payload aktif.
    """

    def __init__(self, target_url: str, config=None):
        super().__init__(target_url, config)

    @staticmethod
    def generate_probe() -> str:
        alphabet = string.ascii_lowercase + string.digits

        token = "".join(
            secrets.choice(alphabet)
            for _ in range(16)
        )

        # Karakter khusus digunakan untuk menguji HTML encoding.
        # Tidak mengandung JavaScript atau event handler.
        return f"cs<{token}>probe"

    @staticmethod
    def build_test_url(
        target_url: str,
        probe: str,
    ) -> str:
        parsed = urlsplit(target_url)

        parameters = parse_qsl(
            parsed.query,
            keep_blank_values=True,
        )

        parameters.append(
            ("chainshield_probe", probe)
        )

        return urlunsplit((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            urlencode(parameters),
            "",
        ))

    def _inspect_response(
        self,
        response: requests.Response,
        endpoint: str,
        probe: str,
    ) -> None:
        content_type = response.headers.get(
            "Content-Type",
            "",
        ).lower()

        if "text/html" not in content_type:
            return

        body = response.text[:200_000]

        # Tidak ditemukan pantulan marker.
        if probe not in body:
            return

        escaped_probe = html.escape(probe)

        # Marker ditemukan dalam bentuk HTML encoded.
        if escaped_probe in body:
            return

        self.add_finding(
            ScanResult(
                title="Potential Reflected XSS",
                vulnerability_type="XSS",
                severity="medium",
                description=(
                    "Input marker ditemukan kembali pada respons "
                    "HTML dalam bentuk yang tidak ter-encode. "
                    "Hal ini merupakan indikasi reflected input, "
                    "bukan bukti final eksploitasi XSS."
                ),
                affected_endpoint=endpoint,
                evidence={
                    "parameter": "chainshield_probe",
                    "detection_method": "reflected_input",
                    "http_status": response.status_code,
                    "probe_reflected": True,
                    "html_encoded": False,
                    "probe_contains_executable_code": False,
                },
                recommendation=(
                    "Terapkan context-aware output encoding "
                    "dan validasi input. Hindari memasukkan "
                    "input pengguna secara langsung ke HTML."
                ),
                cvss_score=5.4,
            )
        )

    def scan(self) -> ScanReport:
        probe = self.generate_probe()

        test_url = self.build_test_url(
            self.target_url,
            probe,
        )

        try:
            response = self.request(
                "GET",
                test_url,
            )

            self._inspect_response(
                response=response,
                endpoint=self.target_url,
                probe=probe,
            )

        except requests.RequestException as error:
            self.add_error(
                f"Gagal memeriksa target: {error}"
            )

        return self.report
