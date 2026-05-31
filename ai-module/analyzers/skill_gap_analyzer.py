"""
Skill Gap Analysis Engine
Analyzes gaps between user skills and job requirements
"""

from typing import List, Dict
import logging
from ..models.vectorizer import compute_similarity
from ..datasets.job_skills import get_job_skills, get_all_roles

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SkillGapAnalyzer:
    """
    Analyzes skill gaps and provides recommendations
    """
    
    def __init__(self):
        """Initialize skill gap analyzer"""
        self.available_roles = get_all_roles()
    
    def analyze(self, user_skills: List[str], job_role: str) -> Dict:
        """
        Analyze skill gap for a specific job role
        
        Args:
            user_skills (List[str]): Skills extracted from resume
            job_role (str): Target job role
            
        Returns:
            Dict: Analysis results with match percentage, gaps, and recommendations
        """
        try:
            # Get job requirements
            job_data = get_job_skills(job_role)
            
            if not job_data:
                logger.error(f"Job role not found: {job_role}")
                return {
                    "error": f"Job role '{job_role}' not found",
                    "available_roles": self.available_roles
                }
            
            required_skills = job_data.get("required_skills", [])
            preferred_skills = job_data.get("preferred_skills", [])
            beginner_skills = job_data.get("beginner_skills", [])
            advanced_skills = job_data.get("advanced_skills", [])
            
            # Analyze required skills
            req_match, req_existing, req_missing = compute_similarity(
                user_skills, required_skills
            )
            
            # Analyze preferred skills
            pref_match, pref_existing, pref_missing = compute_similarity(
                user_skills, preferred_skills
            )
            
            # Determine skill level
            skill_level = self._determine_skill_level(
                user_skills, beginner_skills, advanced_skills
            )
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                req_missing, pref_missing, skill_level
            )
            
            # Calculate overall match
            overall_match = (req_match * 0.7) + (pref_match * 0.3)
            overall_match = round(overall_match, 2)
            
            result = {
                "job_role": job_role,
                "overall_match_percentage": overall_match,
                "required_skills_match": req_match,
                "preferred_skills_match": pref_match,
                "user_skills": user_skills,
                "existing_skills": {
                    "required": req_existing,
                    "preferred": pref_existing
                },
                "missing_skills": {
                    "required": req_missing,
                    "preferred": pref_missing
                },
                "skill_level": skill_level,
                "recommended_skills": recommendations,
                "total_user_skills": len(user_skills),
                "total_required_skills": len(required_skills),
                "total_preferred_skills": len(preferred_skills)
            }
            
            logger.info(f"Analysis complete for {job_role}: {overall_match}% match")
            return result
        
        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            return {"error": str(e)}
    
    def _determine_skill_level(
        self, 
        user_skills: List[str], 
        beginner_skills: List[str], 
        advanced_skills: List[str]
    ) -> str:
        """
        Determine user's skill level for the role
        
        Args:
            user_skills (List[str]): User's skills
            beginner_skills (List[str]): Beginner level skills
            advanced_skills (List[str]): Advanced level skills
            
        Returns:
            str: Skill level (Beginner, Intermediate, Advanced)
        """
        user_skills_lower = set([s.lower() for s in user_skills])
        beginner_lower = set([s.lower() for s in beginner_skills])
        advanced_lower = set([s.lower() for s in advanced_skills])
        
        beginner_match = len(user_skills_lower.intersection(beginner_lower))
        advanced_match = len(user_skills_lower.intersection(advanced_lower))
        
        beginner_percentage = (beginner_match / len(beginner_lower) * 100) if beginner_lower else 0
        advanced_percentage = (advanced_match / len(advanced_lower) * 100) if advanced_lower else 0
        
        if advanced_percentage >= 60:
            return "Advanced"
        elif beginner_percentage >= 70:
            return "Intermediate"
        else:
            return "Beginner"
    
    def _generate_recommendations(
        self, 
        required_missing: List[str], 
        preferred_missing: List[str],
        skill_level: str
    ) -> List[str]:
        """
        Generate skill recommendations based on gaps
        
        Args:
            required_missing (List[str]): Missing required skills
            preferred_missing (List[str]): Missing preferred skills
            skill_level (str): User's skill level
            
        Returns:
            List[str]: Recommended skills to learn
        """
        recommendations = []
        
        # Prioritize required skills
        if required_missing:
            recommendations.extend(required_missing[:5])  # Top 5 required
        
        # Add preferred skills if space available
        remaining_slots = 10 - len(recommendations)
        if remaining_slots > 0 and preferred_missing:
            recommendations.extend(preferred_missing[:remaining_slots])
        
        return recommendations
    
    def compare_multiple_roles(self, user_skills: List[str], roles: List[str] = None) -> List[Dict]:
        """
        Compare user skills against multiple job roles
        
        Args:
            user_skills (List[str]): User's skills
            roles (List[str], optional): Roles to compare. Defaults to all roles.
            
        Returns:
            List[Dict]: Analysis results for each role, sorted by match percentage
        """
        if roles is None:
            roles = self.available_roles
        
        results = []
        for role in roles:
            analysis = self.analyze(user_skills, role)
            if "error" not in analysis:
                results.append(analysis)
        
        # Sort by overall match percentage (descending)
        results.sort(key=lambda x: x.get("overall_match_percentage", 0), reverse=True)
        
        return results


def analyze_skill_gap(user_skills: List[str], job_role: str) -> Dict:
    """
    Convenience function to analyze skill gap
    
    Args:
        user_skills (List[str]): Skills from user's resume
        job_role (str): Target job role
        
    Returns:
        Dict: Analysis results
        
    Example:
        user_skills = ["HTML", "CSS", "JavaScript"]
        result = analyze_skill_gap(user_skills, "Frontend Developer")
        # Returns: {matchPercentage: 72, existingSkills: [...], missingSkills: [...]}
    """
    analyzer = SkillGapAnalyzer()
    return analyzer.analyze(user_skills, job_role)
