from typing import List, Dict, Any
from app.certification_intelligence.provider_interface import CertificationItem

class CertificationPathBuilder:
    """
    Automated Certification Path & Specialization Track Builder.
    Structures certifications into Associate, Professional, Expert, and Specialty tiers.
    """

    @staticmethod
    def build_certification_path(certs: List[CertificationItem]) -> Dict[str, Any]:
        tracks = {
            "Associate": [],
            "Professional": [],
            "Expert": [],
            "Specialty": [],
        }

        for cert in certs:
            lvl = cert.level if cert.level in tracks else "Associate"
            tracks[lvl].append(cert.model_dump())

        total_exam_fees = sum(c.exam_cost_usd for c in certs)
        total_salary_gain = sum(c.salary_boost_usd for c in certs)

        return {
            "total_certifications": len(certs),
            "tracks": tracks,
            "total_exam_fees_usd": round(total_exam_fees, 2),
            "cumulative_salary_boost_usd": round(total_salary_gain, 2),
            "pathway_summary": f"Structured {len(certs)}-certification career advancement track across Associate, Professional, and Expert tiers."
        }
