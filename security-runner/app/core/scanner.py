from urllib.parse import urlsplit
from typing import Any
import json

from app.config import validate_target_url
from app.scanners import get_scanner, get_available_scanners


class ScanOrchestrator:
    """Mengatur pemilihan dan eksekusi security scanner ChainShield."""

    @staticmethod
    def available_scanners() -> list[str]:
        return get_available_scanners()

    @staticmethod
    def execute(
        scanner_type: str,
        target_url: str,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if not isinstance(scanner_type, str) or not scanner_type.strip():
            raise ValueError("Jenis scanner tidak boleh kosong.")

        scanner_type = scanner_type.strip().lower()

        if scanner_type not in get_available_scanners():
            raise ValueError(
                f"Jenis scanner tidak dikenal: {scanner_type}"
            )

        target_url = validate_target_url(target_url)

        parsed_target = urlsplit(target_url)

        if parsed_target.scheme not in {"http", "https"}:
            raise ValueError("Skema URL target tidak diizinkan.")

        if options is None:
            options = {}

        if not isinstance(options, dict):
            raise ValueError(
                "Options scanner harus berupa dictionary."
            )

        allowed_options = {
            "sqli": set(),
            "xss": set(),
            "brute_force": set(),
            "idor": {
                "resource_path",
                "owner_token",
                "comparison_token",
            },
        }

        unknown_options = set(options.keys()) - allowed_options[scanner_type]

        if unknown_options:
            raise ValueError(
                f"Parameter scanner tidak dikenal: {sorted(unknown_options)}"
            )

        if scanner_type == "idor":
            required = {
                "resource_path",
                "owner_token",
                "comparison_token",
            }

            missing = required - set(options.keys())

            if missing:
                raise ValueError(
                    f"Parameter IDOR belum lengkap: {sorted(missing)}"
                )

        scanner_class = get_scanner(scanner_type)
        scanner = scanner_class(
            target_url=target_url,
            **options,
        )

        report = scanner.run()

        # Gunakan identifier scanner sesuai kontrak Laravel.
        report.scan_type = scanner_type

        return report.model_dump(mode="json")

    @staticmethod
    def execute_json(
        scanner_type: str,
        target_url: str,
        options: dict[str, Any] | None = None,
    ) -> str:
        result = ScanOrchestrator.execute(
            scanner_type=scanner_type,
            target_url=target_url,
            options=options,
        )

        return json.dumps(
            result,
            indent=4,
            ensure_ascii=False,
        )
