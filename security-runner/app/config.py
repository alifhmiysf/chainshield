
import os
from dataclasses import dataclass
from urllib.parse import urlsplit


@dataclass(frozen=True)
class ScannerConfig:
    request_timeout: int = 10
    max_requests: int = 20
    max_redirects: int = 3
    user_agent: str = "ChainShield-Security-Runner/1.0"

    @classmethod
    def from_environment(cls):
        return cls(
            request_timeout=int(
                os.getenv("CHAINSHIELD_REQUEST_TIMEOUT", "10")
            ),
            max_requests=int(
                os.getenv("CHAINSHIELD_MAX_REQUESTS", "20")
            ),
            max_redirects=int(
                os.getenv("CHAINSHIELD_MAX_REDIRECTS", "3")
            ),
            user_agent=os.getenv(
                "CHAINSHIELD_USER_AGENT",
                "ChainShield-Security-Runner/1.0",
            ),
        )


def validate_target_url(target_url: str) -> str:
    """
    Memvalidasi format URL target sebelum scanner dijalankan.

    Otorisasi target tetap menjadi tanggung jawab Laravel.
    """

    if not isinstance(target_url, str) or not target_url.strip():
        raise ValueError("Target URL tidak boleh kosong.")

    target_url = target_url.strip()

    try:
        parsed = urlsplit(target_url)

        if parsed.scheme not in ("http", "https"):
            raise ValueError("Target hanya boleh menggunakan HTTP atau HTTPS.")

        if not parsed.hostname:
            raise ValueError("Hostname target tidak valid.")

        if parsed.username or parsed.password:
            raise ValueError("URL target tidak boleh memuat username atau password.")

        if parsed.port is not None and not (1 <= parsed.port <= 65535):
            raise ValueError("Port target tidak valid.")

        if parsed.fragment:
            raise ValueError("URL target tidak boleh menggunakan fragment.")

    except ValueError as error:
        raise ValueError(f"Target URL tidak valid: {error}") from error

    return target_url.rstrip("/")
