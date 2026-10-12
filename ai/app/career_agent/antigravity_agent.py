"""
Autonomous Career Intelligence Agent powered by Google Antigravity SDK.
Orchestrates role benchmarking, gap auditing, learning trajectory synthesis,
and market radar queries into high-fidelity Pydantic reports.
"""

import os
import logging
from typing import List, Optional, Dict, Any

from google.antigravity import Agent, LocalAgentConfig
from app.cost_policy import runtime_policy
from app.career_agent.antigravity_schemas import (
    AutonomousCareerIntelligenceReport,
    RoleBenchmarkData,
    SkillGapBreakdown,
    CurriculumPhase,
    CurriculumMilestone,
    MarketIntelligenceSnapshot,
    StrategicDirective,
)
from app.career_agent.antigravity_tools import (
    benchmark_role_prerequisites,
    audit_skill_gaps,
    synthesize_learning_trajectory,
    query_market_opportunity_radar,
)

logger = logging.getLogger("autonomous_career_agent")

SYSTEM_INSTRUCTIONS = """You are an Autonomous Career Intelligence Agent designed by Google DeepMind.
Your role is to guide ambitious professionals through rapid skill acquisition and strategic career acceleration.

Analyze the candidate's target role, current skills, and timeline.
You MUST utilize your available tools:
1. benchmark_role_prerequisites: Retrieve industry prerequisites and seniority tier.
2. audit_skill_gaps: Analyze missing skills and calculate verified match scores.
3. synthesize_learning_trajectory: Generate concrete, milestone-driven curriculum phases with tangible deliverables.
4. query_market_opportunity_radar: Extract compensation bands and hiring velocities.

Formulate an authoritative, executive-level report adhering strictly to the response schema.
Ensure every recommendation is concrete, actionable, and mathematically grounded.
"""

class AutonomousCareerIntelligenceAgent:
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-pro"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = model
        self.tools = [
            benchmark_role_prerequisites,
            audit_skill_gaps,
            synthesize_learning_trajectory,
            query_market_opportunity_radar,
        ]

    def _build_deterministic_report(
        self,
        target_role: str,
        candidate_skills: List[str],
        timeline_months: int
    ) -> AutonomousCareerIntelligenceReport:
        """
        Deterministic, fully-autonomous pipeline execution fallback.
        Executes all tools and produces a validated AutonomousCareerIntelligenceReport.
        Ensures high availability and 100% testability offline or without an active API key.
        """
        # Step 1: Benchmark prerequisites
        bench_dict = benchmark_role_prerequisites(target_role)
        
        # Step 2: Audit gaps
        gap_dict = audit_skill_gaps(candidate_skills, target_role)
        
        # Step 3: Synthesize learning trajectory
        traj_dict = synthesize_learning_trajectory(gap_dict["critical_gaps"], timeline_months)
        
        # Step 4: Query market intelligence
        market_dict = query_market_opportunity_radar(target_role)
        
        # Step 5: Construct structured phases
        phases: List[CurriculumPhase] = []
        for p in traj_dict.get("phases", []):
            milestones = [
                CurriculumMilestone(
                    title=m["title"],
                    description=m["description"],
                    estimated_weeks=m["estimated_weeks"],
                    deliverable=m["deliverable"]
                )
                for m in p.get("milestones", [])
            ]
            phases.append(CurriculumPhase(
                phase_number=p["phase_number"],
                title=p["title"],
                objective=p["objective"],
                milestones=milestones
            ))

        # Next best action directive
        first_gap = gap_dict["critical_gaps"][0] if gap_dict["critical_gaps"] else "Architecture Core"
        directive = StrategicDirective(
            action_key=f"remediate_{first_gap.lower().replace(' ', '_')}",
            title=f"Execute Remediation for {first_gap}",
            rationale=f"{first_gap} represents the highest impact barrier between candidate's current {gap_dict['match_score']}% match score and senior industry benchmarks.",
            recommended_workspace_route="/roadmap",
            priority="Highest" if gap_dict["gap_percentage"] > 40 else "High"
        )

        exec_summary = (
            f"Autonomous Career Audit complete for target role '{target_role}'. "
            f"Current candidate alignment is {gap_dict['match_score']}% with {len(gap_dict['missing_skills'])} prerequisite gaps detected. "
            f"Market demand remains '{bench_dict['market_demand_rating']}' with compensation bands of {market_dict['estimated_salary_range']}. "
            f"A {timeline_months}-month remediation trajectory comprising {len(phases)} phases has been generated to accelerate readiness."
        )

        return AutonomousCareerIntelligenceReport(
            candidate_target_role=target_role,
            executive_summary=exec_summary,
            benchmark=RoleBenchmarkData(
                target_role=target_role,
                match_score=gap_dict["match_score"],
                market_demand_rating=bench_dict["market_demand_rating"],
                prerequisite_skills=bench_dict["prerequisite_skills"],
                recommended_seniority=bench_dict["recommended_seniority"],
            ),
            gap_analysis=SkillGapBreakdown(
                verified_skills=gap_dict["verified_skills"],
                missing_skills=gap_dict["missing_skills"],
                critical_gaps=gap_dict["critical_gaps"],
                gap_percentage=gap_dict["gap_percentage"],
            ),
            remediation_roadmap=phases,
            market_intelligence=MarketIntelligenceSnapshot(
                estimated_salary_range=market_dict["estimated_salary_range"],
                hiring_intensity=market_dict["hiring_intensity"],
                top_employers=market_dict["top_employers"],
                remote_work_availability=market_dict["remote_work_availability"],
            ),
            next_best_action=directive,
            agent_confidence_score=0.95
        )

    async def run_analysis(
        self,
        target_role: str,
        candidate_skills: List[str],
        timeline_months: int = 6
    ) -> AutonomousCareerIntelligenceReport:
        """
        Executes the Autonomous Career Intelligence analysis using Google Antigravity Agent
        when API key is available, falling back seamlessly to deterministic autonomous execution.
        """
        if not self.api_key:
            logger.info("No GEMINI_API_KEY detected. Executing deterministic Antigravity autonomous pipeline.")
            return self._build_deterministic_report(target_role, candidate_skills, timeline_months)

        # The candidate's skills are profile data: the zero-cost policy decides whether Gemini may
        # receive them (on the free tier it may not), and counts the call against the free quota.
        decision = runtime_policy.check("gemini", contains_personal_data=True)
        if not decision.allowed:
            logger.info(f"Gemini not used for the career agent ({decision.reason.value}); executing the deterministic pipeline.")
            return self._build_deterministic_report(target_role, candidate_skills, timeline_months)
        runtime_policy.require("gemini", contains_personal_data=True)

        try:
            config = LocalAgentConfig(
                system_instructions=SYSTEM_INSTRUCTIONS,
                tools=self.tools,
                response_schema=AutonomousCareerIntelligenceReport,
                model=self.model,
                api_key=self.api_key
            )
            agent = Agent(config)

            prompt = (
                f"Candidate Assessment Request:\n"
                f"- Target Role: {target_role}\n"
                f"- Current Verified Skills: {', '.join(candidate_skills) if candidate_skills else 'None declared'}\n"
                f"- Remediation Timeline: {timeline_months} months\n\n"
                f"Please conduct an autonomous evaluation, call the appropriate tools, and synthesize the final report."
            )

            response = agent.chat(prompt)
            await response.resolve()

            if response.structured_output:
                if isinstance(response.structured_output, AutonomousCareerIntelligenceReport):
                    return response.structured_output
                if isinstance(response.structured_output, dict):
                    return AutonomousCareerIntelligenceReport.model_validate(response.structured_output)

            logger.warning("Antigravity SDK did not return structured output directly; falling back to deterministic pipeline.")
            return self._build_deterministic_report(target_role, candidate_skills, timeline_months)

        except Exception as e:
            logger.error(f"Antigravity Agent execution encountered error: {e}. Executing fallback pipeline.", exc_info=True)
            return self._build_deterministic_report(target_role, candidate_skills, timeline_months)

career_intelligence_agent = AutonomousCareerIntelligenceAgent()
