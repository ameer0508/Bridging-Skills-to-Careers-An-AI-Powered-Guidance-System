"""
Milestone Generator Module for Adaptive AI Learning Roadmap Engine.
Generates granular milestone items across weekly goals, project capstones, certs, and interview prep.
"""

from typing import List, Dict, Any


class MilestoneGenerator:
    """
    Constructs comprehensive milestone structures including weekly focus goals, project capstones,
    certification targets, interview prep items, and GitHub portfolio milestones.
    """

    def generate_milestones_for_phase(
        self,
        phase_title: str,
        focus_skills: List[str],
        target_role: str
    ) -> List[str]:
        """
        Generates 4-6 granular milestone items for a given roadmap phase.
        """
        milestones: List[str] = []
        skills_str = ", ".join(focus_skills[:3]) if focus_skills else "Core Technical Skills"

        # 1. Weekly Knowledge Goal
        milestones.append(f"Master core concepts & syntax for {skills_str}.")

        # 2. Project Capstone Milestone
        milestones.append(f"Build production-grade capstone project integrating {focus_skills[0] if focus_skills else 'core skills'}.")

        # 3. GitHub & Portfolio Milestone
        milestones.append(f"Publish clean, documented code repository with README & architecture diagram to GitHub.")

        # 4. Industry Certification or Assessment Checkpoint
        if any(term in phase_title.lower() for term in ["cloud", "devops", "aws", "architecture"]):
          milestones.append("Complete official Cloud & Architecture certification practice exams.")
        else:
          milestones.append(f"Pass technical skill assessment checkpoint for {focus_skills[0] if focus_skills else 'domain'}.")

        # 5. Interview & Resume Milestone
        milestones.append(f"Update resume & LinkedIn profile to showcase verified {skills_str} project outcomes.")
        milestones.append(f"Complete 5 mock technical interview challenges for {target_role} postings.")

        return milestones
