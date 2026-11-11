from pathlib import Path
import argparse
import json
import sys

from app.core.auth import verify_signed_config
from app.core.scanner import ScanOrchestrator


MAX_CONFIG_SIZE = 64 * 1024

REQUIRED_CONFIG_KEYS = {
    "scanner_type",
    "target_url",
    "options",
    "issued_at",
    "signature",
}


def load_input(input_path: str) -> dict:
    path = Path(input_path)

    if not path.is_file():
        raise FileNotFoundError(
            f"Input file tidak ditemukan: {input_path}"
        )

    if path.stat().st_size > MAX_CONFIG_SIZE:
        raise ValueError(
            "Ukuran konfigurasi scan melebihi batas."
        )

    with path.open("r", encoding="utf-8-sig") as file:
        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError(
            "Konfigurasi scan harus berupa JSON object."
        )

    return data


def main() -> int:
    parser = argparse.ArgumentParser(
        description="ChainShield Security Runner CLI"
    )

    parser.add_argument(
        "--list-scanners",
        action="store_true",
        help="Menampilkan scanner yang tersedia.",
    )

    parser.add_argument(
        "--input",
        type=str,
        help="Path file JSON konfigurasi scan.",
    )

    args = parser.parse_args()

    try:
        if args.list_scanners:
            print(json.dumps(
                {
                    "available_scanners":
                        ScanOrchestrator.available_scanners()
                },
                indent=4,
                ensure_ascii=False,
            ))
            return 0

        if not args.input:
            raise ValueError(
                "Gunakan --list-scanners atau --input."
            )

        config = load_input(args.input)

        if set(config.keys()) != REQUIRED_CONFIG_KEYS:
            raise ValueError(
                "Struktur konfigurasi scan tidak valid."
            )

        # Verifikasi bahwa konfigurasi ditandatangani Laravel.
        verify_signed_config(config)

        scanner_type = config.get("scanner_type")
        target_url = config.get("target_url")
        options = config.get("options")

        if not isinstance(target_url, str) or not target_url.strip():
            raise ValueError("Target URL wajib diisi.")

        if not isinstance(options, dict):
            raise ValueError(
                "Options scanner harus berupa JSON object."
            )

        report = ScanOrchestrator.execute(
            scanner_type=scanner_type,
            target_url=target_url,
            options=options,
        )

        print(json.dumps(
            report,
            indent=4,
            ensure_ascii=False,
        ))

        return 0

    except Exception as error:
        print(json.dumps({
            "success": False,
            "error": str(error),
        }, ensure_ascii=False), file=sys.stderr)

        return 1


if __name__ == "__main__":
    sys.exit(main())