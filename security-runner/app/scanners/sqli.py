
import re
from urllib.parse import urljoin

import requests

from app.core.result import ScanReport, ScanResult
from app.scanners.base import BaseScanner


class SQLInjectionScanner(BaseScanner):
    """
    Passive SQL Injection indicator scanner.

    Memeriksa indikasi pesan error database pada respons
    endpoint yang telah diizinkan untuk diuji.

    Tidak mengirim payload SQL atau mengubah database.
    """

    DATABASE_ERROR_PATTERNS = {
        "MySQL": [
            r"SQL syntax.*MySQL",
            r"Warning.*mysql_",
            r"MySQL server version",
        ],
        "PostgreSQL": [
            r"PostgreSQL.*ERROR",
            r"pg_query\(\).*error",
            r"syntax error at or near",
        ],
        "SQLite": [
            r"SQLite/JDBCDriver",
            r"SQLite.Exception",
            r"sqlite3\.OperationalError",
        ],
        "Microsoft SQL Server": [
            r"Microsoft SQL Server",
            r"ODBC SQL Server Driver",
            r"SQLServer JDBC Driver",
        ],
        "Oracle": [
            r"ORA-\d{5}",
            r"Oracle error",
            r"quoted string not properly terminated",
        ],
    }

    def __init__(self, target_url: str, config=None):
        super().__init__(target_url, config)

    def scan(self) -> ScanReport:
        """
        Memeriksa halaman utama target untuk indikasi
        kebocoran error database.
        """

        try:
            response = self.request(
                "GET",
                self.target_url,
            )

            self._inspect_response(
                response=response,
                endpoint=self.target_url,
            )

        except requests.RequestException as error:
            self.add_error(
                f"Gagal memeriksa target: {error}"
            )

        return self.report

    def _inspect_response(
        self,
        response: requests.Response,
        endpoint: str,
    ) -> None:
        """
        Mencari pola pesan error database pada respons.
        """

        content_type = response.headers.get(
            "Content-Type",
            "",
        ).lower()

        if (
            "text/html" not in content_type
            and "application/json" not in content_type
            and "text/plain" not in content_type
        ):
            return

        body = response.text[:200_000]

        for database, patterns in self.DATABASE_ERROR_PATTERNS.items():
            matched_pattern = None

            for pattern in patterns:
                if re.search(
                    pattern,
                    body,
                    flags=re.IGNORECASE,
                ):
                    matched_pattern = pattern
                    break

            if matched_pattern:
                self.add_finding(
                    ScanResult(
                        title=f"Potential {database} Error Disclosure",
                        vulnerability_type="SQL Injection",
                        severity="medium",
                        description=(
                            "Respons server mengandung pola pesan "
                            f"error yang berkaitan dengan {database}. "
                            "Temuan ini merupakan indikasi kebocoran "
                            "informasi database dan belum membuktikan "
                            "adanya SQL Injection."
                        ),
                        affected_endpoint=endpoint,
                        evidence={
                            "database": database,
                            "http_status": response.status_code,
                            "matched_pattern": matched_pattern,
                            "detection_method": "passive_error_disclosure",
                        },
                        recommendation=(
                            "Nonaktifkan detail error database pada "
                            "respons publik. Gunakan penanganan error "
                            "terpusat dan parameterized queries."
                        ),
                        cvss_score=5.3,
                    )
                )

                break
