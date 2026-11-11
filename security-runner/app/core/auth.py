import hashlib
import hmac
import json
import os
import time

from typing import Any


MAX_CONFIG_AGE_SECONDS = 120
MAX_FUTURE_SKEW_SECONDS = 30


def canonical_json(data: dict[str, Any]) -> bytes:
    """
    Menghasilkan representasi JSON konsisten untuk proses HMAC.
    """
    return json.dumps(
        data,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")


def verify_signed_config(config: dict[str, Any]) -> None:
    """
    Memverifikasi konfigurasi scan yang ditandatangani Laravel.
    """

    secret_hex = os.getenv("CHAINSHIELD_RUNNER_SECRET")

    if not secret_hex:
        raise PermissionError(
            "Secret autentikasi runner tidak tersedia."
        )

    if len(secret_hex) != 64:
        raise PermissionError(
            "Format secret autentikasi runner tidak valid."
        )

    try:
        secret = bytes.fromhex(secret_hex)
    except ValueError as error:
        raise PermissionError(
            "Secret autentikasi runner tidak valid."
        ) from error

    signature = config.get("signature")
    issued_at = config.get("issued_at")

    if not isinstance(signature, str) or len(signature) != 64:
        raise PermissionError(
            "Tanda tangan konfigurasi tidak valid."
        )

    if isinstance(issued_at, bool) or not isinstance(issued_at, int):
        raise PermissionError(
            "Timestamp konfigurasi tidak valid."
        )

    current_time = int(time.time())
    age = current_time - issued_at

    if age > MAX_CONFIG_AGE_SECONDS:
        raise PermissionError(
            "Konfigurasi scan sudah kedaluwarsa."
        )

    if age < -MAX_FUTURE_SKEW_SECONDS:
        raise PermissionError(
            "Timestamp konfigurasi berada di masa depan."
        )

    signed_data = {
        key: value
        for key, value in config.items()
        if key != "signature"
    }

    try:
        message = canonical_json(signed_data)
    except (TypeError, ValueError) as error:
        raise PermissionError(
            "Format konfigurasi scan tidak valid."
        ) from error

    expected_signature = hmac.new(
        secret,
        message,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(signature, expected_signature):
        raise PermissionError(
            "Tanda tangan konfigurasi tidak cocok."
        )
