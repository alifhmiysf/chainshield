
from app.scanners.sqli import SQLInjectionScanner
from app.scanners.xss import XSSScanner
from app.scanners.idor import IDORScanner
from app.scanners.brute_force import BruteForceScanner


SCANNER_REGISTRY = {
    "sqli": SQLInjectionScanner,
    "xss": XSSScanner,
    "idor": IDORScanner,
    "brute_force": BruteForceScanner,
}


def get_scanner(scanner_type: str):
    """
    Mengambil class scanner berdasarkan tipe.
    """

    scanner_class = SCANNER_REGISTRY.get(
        scanner_type.lower()
    )

    if scanner_class is None:
        raise ValueError(
            f"Jenis scanner tidak dikenal: {scanner_type}"
        )

    return scanner_class


def get_available_scanners() -> list[str]:
    """
    Mengembalikan daftar scanner yang tersedia.
    """

    return list(SCANNER_REGISTRY.keys())
