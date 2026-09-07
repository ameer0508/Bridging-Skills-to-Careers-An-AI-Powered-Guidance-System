from typing import Dict, Any, List
from app.certification_intelligence.provider_interface import CertificationItem

class RenewalTracker:
    """
    Tracks certification validity periods, CPE credit requirements, and automated renewal reminders.
    """

    @staticmethod
    def get_renewal_metadata(certs: List[CertificationItem]) -> List[Dict[str, Any]]:
        meta = []
        for c in certs:
            meta.append({
                "certification_id": c.id,
                "name": c.name,
                "validity_period_years": c.validity_period_years,
                "renewal_requirements": c.renewal_requirements,
                "recommended_recertification_strategy": (
                    f"Earn annual CPE credits or complete recertification exam every {c.validity_period_years} years."
                )
            })
        return meta
