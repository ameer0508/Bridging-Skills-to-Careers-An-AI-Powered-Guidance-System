"""
JSON Response Generator
Creates structured JSON outputs for backend integration
"""

import json
import os
from typing import Dict, Any
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_json_response(analysis_result: Dict) -> Dict[str, Any]:
    """
    Generate clean JSON response for backend
    
    Args:
        analysis_result (Dict): Analysis result from skill gap analyzer
        
    Returns:
        Dict[str, Any]: Formatted JSON response
    """
    try:
        # Extract key information
        response = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "jobRole": analysis_result.get("job_role", ""),
                "matchPercentage": analysis_result.get("overall_match_percentage", 0),
                "requiredSkillsMatch": analysis_result.get("required_skills_match", 0),
                "preferredSkillsMatch": analysis_result.get("preferred_skills_match", 0),
                "userSkills": analysis_result.get("user_skills", []),
                "existingSkills": analysis_result.get("existing_skills", {}),
                "missingSkills": analysis_result.get("missing_skills", {}),
                "recommendedSkills": analysis_result.get("recommended_skills", []),
                "skillLevel": analysis_result.get("skill_level", "Unknown"),
                "summary": {
                    "totalUserSkills": analysis_result.get("total_user_skills", 0),
                    "totalRequiredSkills": analysis_result.get("total_required_skills", 0),
                    "totalPreferredSkills": analysis_result.get("total_preferred_skills", 0)
                }
            }
        }
        
        # Add error if present
        if "error" in analysis_result:
            response["status"] = "error"
            response["error"] = analysis_result["error"]
        
        logger.info("JSON response generated successfully")
        return response
    
    except Exception as e:
        logger.error(f"JSON generation error: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


def save_json_output(data: Dict, filename: str, output_dir: str = "output") -> str:
    """
    Save JSON data to file
    
    Args:
        data (Dict): Data to save
        filename (str): Output filename
        output_dir (str): Output directory
        
    Returns:
        str: Path to saved file
    """
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate full path
        filepath = os.path.join(output_dir, filename)
        
        # Save JSON
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"JSON saved to: {filepath}")
        return filepath
    
    except Exception as e:
        logger.error(f"Error saving JSON: {str(e)}")
        return ""


def format_for_api(analysis_result: Dict) -> str:
    """
    Format analysis result as JSON string for API response
    
    Args:
        analysis_result (Dict): Analysis result
        
    Returns:
        str: JSON string
    """
    response = generate_json_response(analysis_result)
    return json.dumps(response, indent=2, ensure_ascii=False)
