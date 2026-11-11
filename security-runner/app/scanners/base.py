
from abc import ABC, abstractmethod
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.config import ScannerConfig, validate_target_url
from app.core.result import ScanReport, ScanResult


class BaseScanner(ABC):
    """
    Fondasi untuk seluruh scanner ChainShield.

    Scanner hanya boleh digunakan pada target yang telah
    mendapatkan otorisasi dari backend Laravel.
    """

    def __init__(
        self,
        target_url: str,
        config: ScannerConfig | None = None,
    ) -> None:
        self.target_url = validate_target_url(target_url)
        self.config = config or ScannerConfig.from_environment()

        if self.config.request_timeout <= 0:
            raise ValueError("Request timeout harus lebih dari 0.")

        if self.config.max_requests <= 0:
            raise ValueError("Maksimum request harus lebih dari 0.")

        if self.config.max_redirects < 0:
            raise ValueError("Maksimum redirect tidak boleh negatif.")

        self.request_count = 0
        self.report = ScanReport(
            target_url=self.target_url,
            scan_type=self.__class__.__name__,
        )

        self.session = requests.Session()

        self.session.headers.update({
            "User-Agent": self.config.user_agent,
            "Accept": "text/html,application/json,*/*",
        })

        retry_policy = Retry(
            total=0,
            connect=0,
            read=0,
            redirect=0,
            status=0,
        )

        adapter = HTTPAdapter(max_retries=retry_policy)

        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def request(
        self,
        method: str,
        url: str,
        **kwargs: Any,
    ) -> requests.Response:
        """
        Mengirim HTTP request dengan batas jumlah request,
        timeout, dan redirect.
        """

        if self.request_count >= self.config.max_requests:
            raise RuntimeError(
                "Batas maksimum request scanner telah tercapai."
            )

        method = method.upper()

        if method not in {"GET", "HEAD", "OPTIONS"}:
            raise ValueError(
                "Metode HTTP tidak diizinkan oleh BaseScanner."
            )

        if kwargs.get("allow_redirects", False):
            raise ValueError(
                "Redirect otomatis tidak diizinkan."
            )

        self.request_count += 1

        kwargs["timeout"] = self.config.request_timeout
        kwargs["allow_redirects"] = False

        return self.session.request(
            method=method,
            url=url,
            **kwargs,
        )

    def add_finding(self, finding: ScanResult) -> None:
        self.report.add_finding(finding)

    def add_error(self, message: str) -> None:
        self.report.errors.append(str(message))

    def get_report(self) -> ScanReport:
        return self.report

    @abstractmethod
    def scan(self) -> ScanReport:
        """
        Setiap scanner wajib mengimplementasikan metode scan().
        """
        raise NotImplementedError

    def run(self) -> ScanReport:
        """
        Menjalankan scanner dan memastikan koneksi ditutup.
        """

        try:
            self.scan()

        except requests.RequestException as error:
            self.add_error(
                f"HTTP request error: {error}"
            )

        except Exception as error:
            self.add_error(
                f"Scanner error: {error}"
            )

        finally:
            self.report.finish()
            self.session.close()

        return self.report
