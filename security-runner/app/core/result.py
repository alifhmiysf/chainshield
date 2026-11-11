
from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field


Severity = Literal["critical", "high", "medium", "low", "info"]


class ScanResult(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    vulnerability_type: str = Field(min_length=1, max_length=100)

    severity: Severity = "info"

    description: str
    affected_endpoint: str | None = None

    evidence: dict[str, Any] = Field(default_factory=dict)
    recommendation: str | None = None

    cvss_score: float | None = Field(
        default=None,
        ge=0,
        le=10,
    )

    detected_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    status: Literal["open"] = "open"


class ScanReport(BaseModel):
    target_url: str
    scan_type: str

    started_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    completed_at: datetime | None = None

    total_findings: int = 0

    findings: list[ScanResult] = Field(default_factory=list)

    errors: list[str] = Field(default_factory=list)

    def add_finding(self, finding: ScanResult) -> None:
        self.findings.append(finding)
        self.total_findings = len(self.findings)

    def finish(self) -> None:
        self.completed_at = datetime.now(timezone.utc)
        self.total_findings = len(self.findings)
