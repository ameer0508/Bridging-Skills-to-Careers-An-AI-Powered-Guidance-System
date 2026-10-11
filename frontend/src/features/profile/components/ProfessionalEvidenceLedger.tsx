import React, { useState } from 'react';
import {
  FileText,
  Cpu,
  Code2,
  Award,
  ExternalLink,
  Info,
  Clock,
  ArrowRight,
  Database,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';
import { SourceEvidenceInspectorModal, SourceEvidenceDetail } from './SourceEvidenceInspectorModal';

export interface ProfessionalEvidenceLedgerProps {
  resumeData?: {
    id?: string;
    originalFileName?: string;
    uploadedAt?: string;
    atsScore?: number;
    experience?: Array<unknown>;
    education?: Array<unknown>;
    projects?: Array<unknown>;
    certifications?: Array<unknown>;
    personalInfo?: {
      contactInfo?: {
        github?: string;
        linkedin?: string;
      };
    };
  } | null;
  totalSkills: number;
  skillCategories?: Record<string, Array<unknown>>;
  interviewsCount?: number;
  interviewsAvgScore?: number | null;
  onNavigate: (route: string) => void;
}

export const ProfessionalEvidenceLedger: React.FC<ProfessionalEvidenceLedgerProps> = ({
  resumeData,
  totalSkills,
  skillCategories,
  interviewsCount = 0,
  interviewsAvgScore = null,
  onNavigate,
}) => {
  const [selectedSource, setSelectedSource] = useState<SourceEvidenceDetail | null>(null);

  const hasResume = Boolean(resumeData?.originalFileName);
  const githubUrl = resumeData?.personalInfo?.contactInfo?.github;
  const topCategories = skillCategories ? Object.keys(skillCategories).slice(0, 3) : [];

  const handleInspect = (source: SourceEvidenceDetail) => {
    setSelectedSource(source);
  };

  return (
    <div className="w-full font-mono">
      <GlassPanel className="p-6 sm:p-8 space-y-6 border-indigo-500/30">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              My Professional Evidence • Grounding Infrastructure
            </span>
            <p className="text-[11px] text-slate-400">
              The verifiable telemetry and documents SkillBridge uses to understand your capabilities without hallucination.
            </p>
          </div>

          <span className="text-[10px] text-slate-500 bg-slate-900 px-3 py-1 rounded-xl border border-white/5">
            Click any source to inspect AI grounding
          </span>
        </div>

        {/* Evidence Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Source 1: Resume Foundation */}
          <div
            onClick={() =>
              handleInspect({
                id: 'resume',
                name: 'Resume Document Foundation',
                category: 'Unstructured Career Document',
                status: hasResume ? 'CONNECTED' : 'DISCONNECTED',
                updatedAt: resumeData?.uploadedAt || null,
                itemsCount:
                  (resumeData?.experience?.length || 0) +
                  (resumeData?.education?.length || 0) +
                  (resumeData?.projects?.length || 0),
                whatSkillBridgeUses: [
                  'Full work history, role titles, and company tenures',
                  'Explicit skills, tools, and technology keywords',
                  'Academic background and degree credentials',
                  'Extracted project achievements and impact statements',
                ],
                whyItMatters:
                  'Your resume acts as the baseline ground-truth for all initial skill extraction, career readiness diagnostics, and ATS compatibility checks.',
                targetRoute: '/resume',
                actionLabel: 'Open Resume Intelligence',
              })
            }
            className="p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    hasResume
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border border-white/10'
                  }`}
                >
                  {hasResume ? 'CONNECTED' : 'NOT ATTACHED'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                  Resume Foundation
                </h4>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {hasResume ? resumeData?.originalFileName : 'No file uploaded yet'}
                </p>
              </div>

              {hasResume && (
                <div className="pt-2 border-t border-white/5 space-y-1 text-[10px] text-slate-400">
                  <div className="flex justify-between">
                    <span>ATS Audit:</span>
                    <strong className="text-emerald-400">{resumeData?.atsScore || 'Evaluated'}/100</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Extracted Experience:</span>
                    <strong className="text-white">{resumeData?.experience?.length || 0} Roles</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-indigo-300">
              <span className="group-hover:underline">Inspect Source</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Source 2: Verified Capability Matrix */}
          <div
            onClick={() =>
              handleInspect({
                id: 'skills',
                name: 'Verified Capability Matrix',
                category: 'Normalized Vector Database',
                status: totalSkills > 0 ? 'CONNECTED' : 'DISCONNECTED',
                updatedAt: new Date().toISOString(),
                itemsCount: totalSkills,
                whatSkillBridgeUses: [
                  'Normalized skills across Programming, Cloud, Data, and Architecture',
                  'Demonstrated proficiency tier & confidence weighting',
                  'Cross-skill relational links and prerequisite dependencies',
                ],
                whyItMatters:
                  'Skills are the core currency across SkillBridge. They drive your live match score against employer job requisitions and shape your personalized learning roadmap.',
                targetRoute: '/skills',
                actionLabel: 'Open Skill Intelligence',
              })
            }
            className="p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    totalSkills > 0
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border border-white/10'
                  }`}
                >
                  {totalSkills > 0 ? `${totalSkills} SKILLS` : '0 SKILLS'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                  Verified Skills
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {totalSkills > 0 ? 'Structured capability matrix' : 'Extract skills to verify'}
                </p>
              </div>

              {totalSkills > 0 && topCategories.length > 0 && (
                <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1">
                  {topCategories.map((c) => (
                    <span
                      key={c}
                      className="px-1.5 py-0.5 rounded bg-slate-900 text-[9px] text-slate-300 border border-white/5"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-indigo-300">
              <span className="group-hover:underline">Inspect Source</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Source 3: Developer & Code Evidence */}
          <div
            onClick={() =>
              handleInspect({
                id: 'github',
                name: 'Developer & Code Evidence',
                category: 'Code Intelligence & Repositories',
                status: githubUrl ? 'CONNECTED' : 'PARTIAL',
                updatedAt: null,
                itemsCount: githubUrl ? 1 : 0,
                whatSkillBridgeUses: [
                  'Connected repository architectures and code complexity',
                  'Language distribution and framework commit patterns',
                  'Pull requests, code review habits, and open source contributions',
                ],
                whyItMatters:
                  'Code evidence verifies your applied implementation competence, providing verifiable depth beyond static resume bullet points.',
                targetRoute: '/coding-agent',
                actionLabel: 'Open Code Intelligence',
              })
            }
            className="p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    githubUrl
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border border-white/10'
                  }`}
                >
                  {githubUrl ? 'LINKED' : 'NOT LINKED'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition">
                  Developer Identity
                </h4>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {githubUrl ? githubUrl.replace('https://github.com/', '@') : 'No GitHub link in resume'}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 text-[10px] text-slate-400">
                <span>Code telemetry grounding</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-indigo-300">
              <span className="group-hover:underline">Inspect Source</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Source 4: Interview Simulation Telemetry */}
          <div
            onClick={() =>
              handleInspect({
                id: 'interviews',
                name: 'Interview Simulation Telemetry',
                category: 'Behavioral & Technical Assessments',
                status: interviewsCount > 0 ? 'CONNECTED' : 'DISCONNECTED',
                updatedAt: new Date().toISOString(),
                itemsCount: interviewsCount,
                whatSkillBridgeUses: [
                  'Real-time answer transcripts and STAR framework adherence',
                  'Technical precision scores and response depth metrics',
                  'Identified communication strengths and detected knowledge gaps',
                ],
                whyItMatters:
                  'Evaluation transcripts ground interview performance recommendations, pinpointing specific behavioral and system design adjustments needed before live employer screens.',
                targetRoute: '/interview-agent',
                actionLabel: 'Open Interview Studio',
              })
            }
            className="p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    interviewsCount > 0
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border border-white/10'
                  }`}
                >
                  {interviewsCount > 0 ? `${interviewsCount} SESSIONS` : 'READY'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                  Interview Telemetry
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {interviewsCount > 0 ? 'Simulation transcripts logged' : 'Simulate role scenarios'}
                </p>
              </div>

              {typeof interviewsAvgScore === 'number' && (
                <div className="pt-2 border-t border-white/5 text-[10px] text-slate-400 flex justify-between">
                  <span>Average Performance:</span>
                  <strong className="text-emerald-400">{interviewsAvgScore}% STAR</strong>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-indigo-300">
              <span className="group-hover:underline">Inspect Source</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Detail Modal */}
      {selectedSource && (
        <SourceEvidenceInspectorModal
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
