import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Briefcase, FolderGit2, GraduationCap, CheckCircle2 } from 'lucide-react';

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
    accentColor: 'text-aurora-indigo',
    badgeBg: 'bg-aurora-violet/[0.06] text-aurora-indigo border-aurora-violet/25',
    borderColor: 'border-aurora-violet/25',
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
    accentColor: 'text-aurora-violet',
    badgeBg: 'bg-aurora-violet/[0.06] text-aurora-violet border-aurora-violet/25',
    borderColor: 'border-aurora-violet/25',
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
    accentColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    borderColor: 'border-emerald-200',
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
    accentColor: 'text-amber-700',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    borderColor: 'border-amber-200',
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
          <span className="text-[10px] font-bold text-aurora-violet uppercase tracking-widest block">
            Authentic Evaluation Framework
          </span>
          <h3 className="text-sm sm:text-base font-bold text-aurora-ink tracking-tight">
            4-Dimension Capability Assessment Pillars
          </h3>
        </div>
        <div className="text-[11px] text-aurora-muted">
          Formula: <span className="text-aurora-ink font-bold">Overall = Σ(Score × Weight) × (1 - Penalty)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {READINESS_DIMENSIONS.map((dim) => {
          const Icon = dim.icon;

          return (
            <motion.div
              key={dim.id}
              whileHover={{ y: -3 }}
              className="p-5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line hover:border-aurora-line transition-all flex flex-col justify-between space-y-4 shadow-lg backdrop-blur-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${dim.borderColor} bg-aurora-canvas`}>
                    <Icon className={`w-4 h-4 ${dim.accentColor}`} />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${dim.badgeBg}`}>
                    {dim.weightPercentage}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-aurora-ink tracking-wide">
                    {dim.name}
                  </h4>
                  <p className="text-[11px] text-aurora-muted leading-relaxed">
                    {dim.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-aurora-line space-y-1.5">
                  <span className="text-[9px] font-bold text-aurora-muted uppercase block tracking-wider">
                    Evidence Ingested:
                  </span>
                  <div className="space-y-1">
                    {dim.sampleEvidence.map((sample, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-1.5 text-[10px] text-aurora-muted">
                        <CheckCircle2 className="w-2.5 h-2.5 text-aurora-muted shrink-0" />
                        <span className="truncate">{sample}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-aurora-line flex items-center justify-between text-[10px] text-aurora-muted">
                <span>FOCUS:</span>
                <span className="text-aurora-muted font-bold truncate max-w-[130px]">{dim.auditFocus}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ReadinessDimensionFrameworkPreview;
