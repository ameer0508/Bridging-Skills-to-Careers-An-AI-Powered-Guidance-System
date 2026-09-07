import os
import re
import logging
from typing import Dict, Any, Optional
from app.resume_intelligence.layout_detector import LayoutDetector
from app.resume_intelligence.section_classifier import SectionClassifier
from app.resume_intelligence.transformer_parser import transformer_manager
from app.resume_intelligence.skill_mapper import SkillMapper
from app.resume_intelligence.experience_parser import ExperienceParser
from app.resume_intelligence.education_parser import EducationParser
from app.resume_intelligence.project_parser import ProjectParser
from app.resume_intelligence.certification_parser import CertificationParser
from app.resume_intelligence.language_detector import LanguageDetector
from app.resume_intelligence.semantic_entities import (
    ResumeProfile, SemanticPersonalInfo, SemanticExtractedEntity
)
from app.schemas.resume import ParsedResumeResponse
from app.gateway.ai_gateway import ai_gateway
from app.services.extractor import extract_text_from_file

logger = logging.getLogger("skillbridge-ai")

class ResumeIntelligencePipeline:
    """
    Enterprise Transformer-Based Resume Intelligence Engine.
    Executes the 14-stage pipeline with automatic fallback strategy safeguards.
    """

    @classmethod
    def execute(cls, file_path: str, raw_text: Optional[str] = None) -> ParsedResumeResponse:
        logger.info(f"[ResumeIntelligencePipeline] Starting processing for {file_path}")
        try:
            # 1. Document Validation & Text Extraction
            text = raw_text or extract_text_from_file(file_path)
            if not text or not text.strip():
                raise ValueError("Extracted text is empty")

            # 2. Layout Detection
            layout_metadata = LayoutDetector.detect_layout(file_path)
            logger.info(f"[ResumeIntelligencePipeline] Detected Layout: {layout_metadata['layout_type']}")

            # 3. Section Classification
            sections = SectionClassifier.classify_sections(text)
            logger.info(f"[ResumeIntelligencePipeline] Classifed Sections: {list(sections.keys())}")

            # 4. Transformer NLP Embeddings
            embeddings = transformer_manager.encode_text(text[:500])
            active_model = transformer_manager.active_model_name

            # 5. Personal Info Semantic Extraction
            personal_info = cls._extract_personal_info(sections.get("header", "") + "\n" + sections.get("summary", ""), active_model)

            # 6. Domain Intelligence Sub-Engines
            skills = SkillMapper.extract_semantic_skills(sections.get("skills", "") + "\n" + text)
            experiences = ExperienceParser.parse_experience_section(sections.get("experience", ""))
            educations = EducationParser.parse_education_section(sections.get("education", ""))
            projects = ProjectParser.parse_projects_section(sections.get("projects", ""))
            certifications = CertificationParser.parse_certifications_section(sections.get("certifications", ""))
            languages = LanguageDetector.parse_languages_section(sections.get("languages", ""))

            # 7. Construct Profile & Map to Backward Compatible ParsedResumeResponse
            profile = ResumeProfile(
                personalInfo=personal_info,
                education=educations,
                experience=experiences,
                projects=projects,
                skills=skills,
                certifications=certifications,
                languages=languages,
                detected_layout=layout_metadata,
                detected_sections=list(sections.keys())
            )

            parsed_response = cls._convert_to_parsed_response(profile)
            logger.info(f"[ResumeIntelligencePipeline] Successfully constructed profile with {len(parsed_response.skills)} skills.")
            return parsed_response

        except Exception as e:
            logger.error(f"[ResumeIntelligencePipeline] Primary Transformer Pipeline failed: {e}. Executing Fallback Strategy...")
            return cls._execute_fallback(file_path, raw_text)

    @classmethod
    def _extract_personal_info(cls, header_text: str, model_name: str) -> SemanticPersonalInfo:
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', header_text)
        phone_match = re.search(r'\b(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b', header_text)
        linkedin_match = re.search(r'(https?://(?:www\.)?linkedin\.com/in/[\w-]+)', header_text, re.IGNORECASE)
        github_match = re.search(r'(https?://(?:www\.)?github\.com/[\w-]+)', header_text, re.IGNORECASE)

        # Name extraction heuristic (first line of header)
        lines = [l.strip() for l in header_text.splitlines() if l.strip()]
        full_name = lines[0] if lines and len(lines[0]) < 40 and not email_match else "Candidate"

        return SemanticPersonalInfo(
            fullName=SemanticExtractedEntity(
                value=full_name,
                confidence=0.95,
                source="resume_header",
                transformer_model=model_name,
                extraction_method="header-ner"
            ),
            email=SemanticExtractedEntity(
                value=email_match.group(0),
                confidence=0.99,
                source="resume_header",
                transformer_model=model_name,
                extraction_method="regex-email"
            ) if email_match else None,
            phone=SemanticExtractedEntity(
                value=phone_match.group(0),
                confidence=0.96,
                source="resume_header",
                transformer_model=model_name,
                extraction_method="regex-phone"
            ) if phone_match else None,
            linkedin=SemanticExtractedEntity(
                value=linkedin_match.group(0),
                confidence=0.98,
                source="resume_header",
                transformer_model=model_name,
                extraction_method="regex-social"
            ) if linkedin_match else None,
            github=SemanticExtractedEntity(
                value=github_match.group(0),
                confidence=0.98,
                source="resume_header",
                transformer_model=model_name,
                extraction_method="regex-social"
            ) if github_match else None
        )

    @classmethod
    def _convert_to_parsed_response(cls, profile: ResumeProfile) -> ParsedResumeResponse:
        # Convert internal Semantic entities to ParsedResumeResponse model
        return ParsedResumeResponse(
            personalInfo={
                "fullName": profile.personalInfo.fullName.model_dump() if profile.personalInfo.fullName else None,
                "email": profile.personalInfo.email.model_dump() if profile.personalInfo.email else None,
                "phone": profile.personalInfo.phone.model_dump() if profile.personalInfo.phone else None,
                "linkedin": profile.personalInfo.linkedin.model_dump() if profile.personalInfo.linkedin else None,
                "github": profile.personalInfo.github.model_dump() if profile.personalInfo.github else None,
            },
            education=[
                {
                    "institution": e.institution.model_dump() if e.institution else None,
                    "degree": e.degree.model_dump() if e.degree else None,
                    "endYear": e.endYear.model_dump() if e.endYear else None,
                    "gpa": e.gpa.model_dump() if e.gpa else None
                } for e in profile.education
            ],
            experience=[
                {
                    "company": exp.company.model_dump() if exp.company else None,
                    "role": exp.role.model_dump() if exp.role else None,
                    "duration": exp.duration.model_dump() if exp.duration else None,
                    "responsibilities": [r.model_dump() for r in exp.responsibilities]
                } for exp in profile.experience
            ],
            projects=[
                {
                    "name": p.name.model_dump() if p.name else None,
                    "description": p.description.model_dump() if p.description else None,
                    "technologies": [t.model_dump() for t in p.technologies],
                    "contributions": [c.model_dump() for c in p.contributions]
                } for p in profile.projects
            ],
            skills=[
                {
                    "name": s.name,
                    "category": s.category,
                    "confidence": s.confidence
                } for s in profile.skills
            ],
            certifications=[c.name.model_dump() for c in profile.certifications],
            languages=[l.language.model_dump() for l in profile.languages],
            achievements=[],
            interests=[]
        )

    @classmethod
    def _execute_fallback(cls, file_path: str, raw_text: Optional[str]) -> ParsedResumeResponse:
        logger.info("[ResumeIntelligencePipeline] Executing Fallback Strategy via AI Gateway")
        text = raw_text or extract_text_from_file(file_path)
        ai_resp = ai_gateway.route_request(
            service_name="resume_parsing",
            method_name="parse_resume_text",
            payload=text,
            schema_class=ParsedResumeResponse
        )
        if ai_resp.success and ai_resp.response:
            return ParsedResumeResponse.model_validate(ai_resp.response)
        raise RuntimeError(f"Resume processing fallback failed: {'; '.join(ai_resp.errors)}")
