import re
from typing import List, Dict, Any, Optional

class PromptManager:
    """
    Centralized Prompt Manager for SkillBridge AI Intelligence Layer.
    Contains prompt templates, system instructions, and input sanitization to prevent prompt injection.
    """

    @staticmethod
    def sanitize_input(text: str) -> str:
        """
        Sanitizes user input string against prompt injection vectors.
        Removes system prompt overrides and dangerous instructions.
        """
        if not text:
            return ""
        # Remove potential injection patterns
        sanitized = re.sub(r'(?i)(ignore previous instructions|disregard above instructions|system prompt:)', '[redacted_instruction]', text)
        return sanitized.strip()

    # --- 1. RESUME PARSING ---
    RESUME_PARSING_PROMPT = """
You are an expert HR AI Assistant for SkillBridge.
Extract structured information from the provided resume text.
Extract actual values, confidence score (0.0 to 1.0) for entities, skills by category (Programming Languages, Frameworks, Databases, Cloud, DevOps, AI/ML, Cybersecurity, Tools, Soft Skills).
Normalize capitalization, deduplicate skills, and strictly match requested schema.

Resume Text:
---
{resume_text}
---
"""

    # --- 2. SKILL NORMALIZATION ---
    SKILL_NORMALIZATION_PROMPT = """
You are an expert technical taxonomy engine.
Normalize the following raw skills extracted from a resume into standard canonical names, categories, aliases, and relationships.
Allowed Categories: Programming Languages, Frameworks, Libraries, Databases, Cloud, DevOps, Cybersecurity, AI / ML, Data Science, Tools, Operating Systems, Soft Skills.

Raw Skills: {raw_skills}
"""

    # --- 3. CAREER MATCHING ---
    CAREER_MATCHING_PROMPT = """
You are the SkillBridge Lead Career Strategist.
Compare the user's current skill profile against the target role requirements.
Calculate a semantic match score (0 to 100), identify matched skills, missing skills, and provide a 2-sentence executive summary.

User Skills: {user_skills}
Target Role: {target_role}
Years of Experience: {experience_years}
"""

    # --- 4. READINESS SCORE ---
    READINESS_SCORE_PROMPT = """
You are an expert Career Readiness Evaluator.
Analyze user skills against required role skills.
Determine a overall readiness score (0-100), readiness level (High, Moderate, Developing), top strengths, critical skill gaps, and 3 high-impact action items.

User Skills: {user_skills}
Required Skills: {required_skills}
Role Title: {role_title}
"""

    # --- 5. RECOMMENDATION ENGINE ---
    RECOMMENDATION_PROMPT = """
You are the SkillBridge AI Personal Learning Advisor.
Generate 4-5 prioritized recommendations (courses, projects, certifications, skill acquisition) to help the user achieve their career goal based on their current skills.

Current Skills: {user_skills}
Career Goal: {career_goal}
Preferred Learning Style: {learning_style}
"""

    # --- 6. ROADMAP GENERATOR ---
    ROADMAP_GENERATOR_PROMPT = """
You are the SkillBridge AI Curriculum Architect.
Generate a structured, phased learning roadmap to transition a candidate from their current level to their target role within the timeframe.

Current Level: {current_level}
Target Role: {target_role}
Timeframe: {target_months} months
"""

    # --- 7. ANALYTICS ENGINE ---
    ANALYTICS_PROMPT = """
You are the SkillBridge Market Intelligence & Skill Analytics Engine.
Analyze skill trend data for a user to produce an overall growth rate, market relevance index (0-100), and 3 strategic insights with impact rating and actionable tips.

User ID: {user_id}
Skill Trend Data: {skills_trend}
"""

    # --- 8. RESUME INTELLIGENCE ---
    RESUME_INTELLIGENCE_PROMPT = """
You are the SkillBridge Executive Resume Intelligence Auditor.
Analyze the resume text for overall quality (0-100), ATS compatibility score (0-100), formatting critique, bullet-point content improvements, and high-value keyword optimizations.

Resume Text:
---
{resume_text}
---
Target Role (if any): {target_role}
"""

    # --- 9. CAREER ARCHITECT CHAT ---
    CAREER_ARCHITECT_PROMPT = """
You are the SkillBridge Lead AI Career Architect, an expert executive career advisor and technical talent strategist.
Provide a high-impact, actionable, empathetic response to the user's prompt.

Context Prompt:
{prompt}
"""

    @classmethod
    def get_resume_extraction_prompt(cls, resume_text: str) -> str:
        return cls.RESUME_PARSING_PROMPT.format(resume_text=cls.sanitize_input(resume_text))

    @classmethod
    def get_skill_normalization_prompt(cls, raw_skills: List[str]) -> str:
        sanitized = [cls.sanitize_input(s) for s in raw_skills]
        return cls.SKILL_NORMALIZATION_PROMPT.format(raw_skills=sanitized)

    @classmethod
    def get_career_matching_prompt(cls, user_skills: List[str], target_role: str, experience_years: float) -> str:
        return cls.CAREER_MATCHING_PROMPT.format(
            user_skills=[cls.sanitize_input(s) for s in user_skills],
            target_role=cls.sanitize_input(target_role),
            experience_years=experience_years
        )

    @classmethod
    def get_readiness_prompt(cls, user_skills: List[str], required_skills: List[str], role_title: str) -> str:
        return cls.READINESS_SCORE_PROMPT.format(
            user_skills=[cls.sanitize_input(s) for s in user_skills],
            required_skills=[cls.sanitize_input(s) for s in required_skills],
            role_title=cls.sanitize_input(role_title)
        )

    @classmethod
    def get_recommendation_prompt(cls, user_skills: List[str], career_goal: str, learning_style: str = "hands-on") -> str:
        return cls.RECOMMENDATION_PROMPT.format(
            user_skills=[cls.sanitize_input(s) for s in user_skills],
            career_goal=cls.sanitize_input(career_goal),
            learning_style=cls.sanitize_input(learning_style)
        )

    @classmethod
    def get_roadmap_prompt(cls, current_level: str, target_role: str, target_months: int) -> str:
        return cls.ROADMAP_GENERATOR_PROMPT.format(
            current_level=cls.sanitize_input(current_level),
            target_role=cls.sanitize_input(target_role),
            target_months=target_months
        )

    @classmethod
    def get_analytics_prompt(cls, user_id: str, skills_trend: List[Dict[str, Any]]) -> str:
        return cls.ANALYTICS_PROMPT.format(
            user_id=cls.sanitize_input(user_id),
            skills_trend=skills_trend
        )

    @classmethod
    def get_resume_intelligence_prompt(cls, resume_text: str, target_role: Optional[str] = None) -> str:
        return cls.RESUME_INTELLIGENCE_PROMPT.format(
            resume_text=cls.sanitize_input(resume_text),
            target_role=cls.sanitize_input(target_role or "General Tech Role")
        )

    @classmethod
    def get_career_architect_prompt(cls, prompt: str) -> str:
        return cls.CAREER_ARCHITECT_PROMPT.format(prompt=cls.sanitize_input(prompt))
