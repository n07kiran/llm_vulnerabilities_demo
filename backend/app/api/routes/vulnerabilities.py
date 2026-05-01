from fastapi import APIRouter, HTTPException

from backend.app.data.scenarios import get_scenario, list_scenarios
from backend.app.schemas.vulnerability import VulnerabilityCard, VulnerabilityDetail


router = APIRouter(prefix="/api/vulnerabilities", tags=["vulnerabilities"])


@router.get("", response_model=list[VulnerabilityCard])
async def get_vulnerability_cards() -> list[VulnerabilityDetail]:
    return list_scenarios()


@router.get("/{slug}", response_model=VulnerabilityDetail)
async def get_vulnerability_detail(slug: str) -> VulnerabilityDetail:
    scenario = get_scenario(slug)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Vulnerability scenario not found.")
    return scenario
