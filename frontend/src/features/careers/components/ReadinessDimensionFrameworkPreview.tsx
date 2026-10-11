import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Briefcase, FolderGit2, GraduationCap, ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DimensionPreviewItem {
  id: string;
  name: string;
  weight: number;
  weightPercentage: string;
  icon: React.ElementType;
  accentColor: string;
  badgeBg: string;
  borderColor: string;
  sourceType: string;
  description: string;
  sampleEvidence: string[];
  auditFocus: string;
}

const READINESS_DIMENSIONS: DimensionPreviewItem[] = [
  {
    id: 'dim-tech',
    name: 'Technical Skills',
    weight: 0.50,
    weightPercentage: '50% Weight',
    icon: Cpu,
    accentColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    borderColor: 'border-indigo-500/30',
    sourceType: 'Base Skill Graph & Proficiency',
    description: 'Evaluates required and preferred technical competencies against role requirement benchmarks.',
    sampleEvidence: ['Verified skill taxonomy', 'Proficiency evidence score (0-100)', 'Importance tier matching'],
    auditFocus: 'Core engineering capabilities & language mastery',
  },
  {
    id: 'dim-exp',
    name: 'Professional Experience',
    weight: 0.25,
    weightPercentage: '25% Weight',
    icon: Briefcase,
    accentColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    sourceType: 'resume_experience',
    description: 'Verifies applied competency in commercial environments, team workflows, and enterprise scale.',
    sampleEvidence: ['Employment tenure & scope', 'Job title seniority alignment', 'Applied production evidence'],
    auditFocus: 'Commercial practice & demonstrated responsibilities',
  },
  {
    id: 'dim-proj',
    name: 'Project Portfolio',
    weight: 0.15,
    weightPercentage: '15% Weight',
    icon: FolderGit2,
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    sourceType: 'resume_projects',
    description: 'Measures demonstrable hands-on project artifacts, architectural implementations, and capstones.',
    sampleEvidence: ['Full-stack system builds', 'Architecture & tech stack depth', 'GitHub/Live repository validation'],
    auditFocus: 'Independent execution & system building proof',
  },
  {
    id: 'dim-cert',
    name: 'Education & Certifications',
    weight: 0.10,
    weightPercentage: '10% Weight',
    icon: GraduationCap,
    accentColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    borderColor: 'border-amber-500/30',
    sourceType: 'resume_certifications & education',
    description: 'Validates formal degrees, industry-recognized certificates, and domain accreditations.',
    sampleEvidence: ['Accredited University degrees', 'Cloud & Security vendor certs', 'Continuous learning courses'],
    auditFocus: 'Theoretical foundations & recognized credentials',
  },
];

export const ReadinessDimensionFrameworkPreview: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
            Authentic Evaluation Framework
          </span>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            4-Dimension Capability Assessment Pillars
          </h3>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Formula: <span className="text-slate-200 font-bold">Overall = Σ(Score × Weight) × (1 - Penalty)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {READINESS_DIMENSIONS.map((dim) => {
          const Icon = dim.icon;

          return (
            <motion.div
              key={dim.id}
              whileHover={{ y: -3 }}
              className="p-5 rounded-2xl bg-slate-900/40 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4 shadow-lg backdrop-blur-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${dim.borderColor} bg-white/5`}>
                    <Icon className={`w-4 h-4 ${dim.accentColor}`} />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${dim.badgeBg}`}>
                    {dim.weightPercentage}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white tracking-wide">
                    {dim.name}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {dim.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block tracking-wider">
                    Evidence Ingested:
                  </span>
                  <div className="space-y-1">
                    {dim.sampleEvidence.map((sample, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <CheckCircle2 className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                        <span className="truncate">{sample}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>FOCUS:</span>
                <span className="text-slate-300 font-bold truncate max-w-[130px]">{dim.auditFocus}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ReadinessDimensionFrameworkPreview;
