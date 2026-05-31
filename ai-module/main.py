"""
Main AI Module Entry Point
Complete Resume Parsing and Skill Gap Analysis Engine
"""

import os
import sys
import json
import logging
from typing import Dict, Optional

# Import all modules
from parsers.resume_parser import extract_resume
from preprocess.text_processor import preprocess_text
from extractors.skill_extractor import extract_skills
from analyzers.skill_gap_analyzer import analyze_skill_gap, SkillGapAnalyzer
from utils.json_generator import generate_json_response, save_json_output
from datasets.job_skills import get_all_roles

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_resume(file_path: str) -> Optional[str]:
    """
    Parse resume and extract text
    
    Args:
        file_path (str): Path to resume file (PDF or DOCX)
        
    Returns:
        Optional[str]: Extracted text or None
    """
    logger.info(f"Parsing resume: {file_path}")
    return extract_resume(file_path)


def extract_skills_from_resume(resume_text: str) -> list:
    """
    Extract skills from resume text
    
    Args:
        resume_text (str): Resume text content
        
    Returns:
        list: Extracted skills
    """
    logger.info("Extracting skills from resume")
    return extract_skills(resume_text)


def analyze_skill_gap_for_role(user_skills: list, job_role: str) -> Dict:
    """
    Analyze skill gap for a specific job role
    
    Args:
        user_skills (list): User's skills
        job_role (str): Target job role
        
    Returns:
        Dict: Analysis results
    """
    logger.info(f"Analyzing skill gap for role: {job_role}")
    return analyze_skill_gap(user_skills, job_role)


def process_resume_complete(file_path: str, job_role: str, save_output: bool = True) -> Dict:
    """
    Complete pipeline: Parse resume → Extract skills → Analyze gap → Generate JSON
    
    Args:
        file_path (str): Path to resume file
        job_role (str): Target job role
        save_output (bool): Whether to save output to file
        
    Returns:
        Dict: Complete analysis results in JSON format
    """
    try:
        logger.info("=" * 60)
        logger.info("Starting Complete Resume Analysis Pipeline")
        logger.info("=" * 60)
        
        # Step 1: Parse resume
        logger.info("Step 1: Parsing resume...")
        resume_text = parse_resume(file_path)
        
        if not resume_text:
            return {
                "status": "error",
                "error": "Failed to extract text from resume"
            }
        
        logger.info(f"Extracted {len(resume_text)} characters")
        
        # Step 2: Extract skills
        logger.info("Step 2: Extracting skills...")
        user_skills = extract_skills_from_resume(resume_text)
        
        if not user_skills:
            return {
                "status": "error",
                "error": "No skills found in resume"
            }
        
        logger.info(f"Found {len(user_skills)} skills: {', '.join(user_skills[:10])}...")
        
        # Step 3: Analyze skill gap
        logger.info("Step 3: Analyzing skill gap...")
        analysis_result = analyze_skill_gap_for_role(user_skills, job_role)
        
        if "error" in analysis_result:
            return {
                "status": "error",
                "error": analysis_result["error"],
                "available_roles": get_all_roles()
            }
        
        # Step 4: Generate JSON response
        logger.info("Step 4: Generating JSON response...")
        json_response = generate_json_response(analysis_result)
        
        # Step 5: Save output (optional)
        if save_output:
            filename = f"analysis_{job_role.replace(' ', '_').lower()}.json"
            save_json_output(json_response, filename)
        
        logger.info("=" * 60)
        logger.info("Analysis Complete!")
        logger.info(f"Match Percentage: {json_response['data']['matchPercentage']}%")
        logger.info("=" * 60)
        
        return json_response
    
    except Exception as e:
        logger.error(f"Pipeline error: {str(e)}")
        return {
            "status": "error",
            "error": str(e)
        }


def compare_multiple_roles(file_path: str, roles: list = None) -> Dict:
    """
    Compare resume against multiple job roles
    
    Args:
        file_path (str): Path to resume file
        roles (list, optional): List of roles to compare. Defaults to all roles.
        
    Returns:
        Dict: Comparison results for all roles
    """
    try:
        # Parse resume
        resume_text = parse_resume(file_path)
        if not resume_text:
            return {"status": "error", "error": "Failed to parse resume"}
        
        # Extract skills
        user_skills = extract_skills_from_resume(resume_text)
        if not user_skills:
            return {"status": "error", "error": "No skills found"}
        
        # Analyze multiple roles
        analyzer = SkillGapAnalyzer()
        results = analyzer.compare_multiple_roles(user_skills, roles)
        
        return {
            "status": "success",
            "user_skills": user_skills,
            "total_skills": len(user_skills),
            "roles_analyzed": len(results),
            "results": results
        }
    
    except Exception as e:
        logger.error(f"Multi-role comparison error: {str(e)}")
        return {"status": "error", "error": str(e)}


# Backend Integration Functions
def api_parse_resume(file_path: str) -> Dict:
    """
    API endpoint function: Parse resume
    
    Args:
        file_path (str): Path to resume file
        
    Returns:
        Dict: JSON response with extracted text
    """
    text = parse_resume(file_path)
    if text:
        return {"status": "success", "text": text, "length": len(text)}
    return {"status": "error", "error": "Failed to parse resume"}


def api_extract_skills(resume_text: str) -> Dict:
    """
    API endpoint function: Extract skills
    
    Args:
        resume_text (str): Resume text
        
    Returns:
        Dict: JSON response with extracted skills
    """
    skills = extract_skills_from_resume(resume_text)
    return {"status": "success", "skills": skills, "count": len(skills)}


def api_analyze_skill_gap(user_skills: list, job_role: str) -> Dict:
    """
    API endpoint function: Analyze skill gap
    
    Args:
        user_skills (list): User's skills
        job_role (str): Target job role
        
    Returns:
        Dict: JSON response with analysis results
    """
    result = analyze_skill_gap_for_role(user_skills, job_role)
    return generate_json_response(result)


def main():
    """
    Main function for testing and demonstration
    """
    print("\n" + "=" * 60)
    print("AI-Powered Resume Analysis Engine")
    print("=" * 60)
    
    # Example usage
    print("\nAvailable Job Roles:")
    roles = get_all_roles()
    for i, role in enumerate(roles, 1):
        print(f"{i}. {role}")
    
    print("\n" + "=" * 60)
    print("Usage Examples:")
    print("=" * 60)
    
    print("\n1. Complete Pipeline:")
    print("   result = process_resume_complete('resume.pdf', 'Frontend Developer')")
    
    print("\n2. Step-by-step:")
    print("   text = parse_resume('resume.pdf')")
    print("   skills = extract_skills_from_resume(text)")
    print("   analysis = analyze_skill_gap_for_role(skills, 'Data Scientist')")
    
    print("\n3. Compare Multiple Roles:")
    print("   result = compare_multiple_roles('resume.pdf')")
    
    print("\n4. Backend Integration:")
    print("   # Node.js can call these functions:")
    print("   api_parse_resume(file_path)")
    print("   api_extract_skills(resume_text)")
    print("   api_analyze_skill_gap(skills, role)")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
