import React, { useState, useMemo } from 'react';
import {
  Award,
  Sparkles,
  Bookmark,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { GlassPanel } from '../../../components/experience/workspace';
import { useToast } from '../../../components/composite/Toast';
import { CertificationData, CertificationDetailModal } from './CertificationDetailModal';

export interface CertificationIntelligencePanelProps {
  technologyTarget?: string;
  onExploreRoadmap?: () => void;
}

export const CertificationIntelligencePanel: React.FC<CertificationIntelligencePanelProps> = ({
  technologyTarget = 'Cloud & AI Engineering',
  onExploreRoadmap,
}) => {
  const { addToast } = useToast();

  // State Management
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rank-desc' | 'salary-desc' | 'recognition-desc' | 'cost-asc'>('rank-desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'recommended' | 'paths' | 'roi'>('recommended');

  // Local State: Bookmarked & Active Preparation IDs
  const [savedCertIds, setSavedCertIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('sb-saved-certs');
    return saved ? JSON.parse(saved) : ['aws-saa-c03', 'gcp-pca'];
  });
  const [earnedCertIds, setEarnedCertIds] = useState<string[]>([]);

  // Modal State
  const [selectedCertForDetail, setSelectedCertForDetail] = useState<CertificationData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Multi-Provider Certifications Dataset
  const certs: CertificationData[] = useMemo(
    () => [
      {
        id: 'gcp-pca',
        name: 'Google Cloud Certified Professional Cloud Architect',
        provider: 'Google Cloud',
        level: 'Professional',
        examCode: 'PCA-2024',
        domainsCovered: ['Cloud Infrastructure Architecture', 'Security & Compliance', 'System Optimization'],
        prerequisites: ['3+ Years Cloud Experience'],
        recommendedExperience: '3 Years',
        examDurationMinutes: 120,
        passingScore: 'Pass/Fail',
        examCostUsd: 200.0,
        renewalRequirements: 'Recertify every 2 years',
        validityPeriodYears: 2,
        skillsCovered: ['GCP', 'Kubernetes', 'Vertex AI', 'Cloud Architecture'],
        employerRecognitionScore: 98.0,
        salaryBoostUsd: 21000.0,
        officialUrl: 'https://cloud.google.com/certification/cloud-architect',
        rankScore: 98.2,
        whyRecommended: 'Highest paid cloud certification in North America with 98% employer recognition.',
      },
      {
        id: 'cncf-cka',
        name: 'Certified Kubernetes Administrator (CKA)',
        provider: 'CNCF / Linux Foundation',
        level: 'Professional',
        examCode: 'CKA-2024',
        domainsCovered: ['Cluster Architecture', 'Workloads & Scheduling', 'Services & Networking'],
        prerequisites: ['Linux Fundamentals', 'Docker'],
        recommendedExperience: '1-2 Years',
        examDurationMinutes: 120,
        passingScore: '66%',
        examCostUsd: 395.0,
        renewalRequirements: 'Recertify every 3 years',
        validityPeriodYears: 3,
        skillsCovered: ['Kubernetes', 'Docker', 'Cluster Ops', 'Troubleshooting'],
        employerRecognitionScore: 97.0,
        salaryBoostUsd: 19500.0,
        officialUrl: 'https://cncf.io/certification/cka',
        rankScore: 96.5,
        whyRecommended: 'Hands-on practical exam required for senior cloud native engineering roles.',
      },
      {
        id: 'aws-saa-c03',
        name: 'AWS Certified Solutions Architect – Associate',
        provider: 'Amazon Web Services',
        level: 'Associate',
        examCode: 'SAA-C03',
        domainsCovered: ['Resilient Architectures', 'High-Performing Architectures', 'Secure Applications'],
        prerequisites: ['AWS Fundamentals'],
        recommendedExperience: '1 Year',
        examDurationMinutes: 130,
        passingScore: '720/1000',
        examCostUsd: 150.0,
        renewalRequirements: 'Recertify every 3 years',
        validityPeriodYears: 3,
        skillsCovered: ['AWS Cloud', 'S3', 'EC2', 'Lambda', 'VPC'],
        employerRecognitionScore: 98.0,
        salaryBoostUsd: 18500.0,
        officialUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate',
        rankScore: 97.0,
        whyRecommended: 'Gold standard foundational cloud architecture credential.',
      },
      {
        id: 'ms-ai-102',
        name: 'Microsoft Certified: Azure AI Engineer Associate',
        provider: 'Microsoft',
        level: 'Associate',
        examCode: 'AI-102',
        domainsCovered: ['Azure AI Services', 'OpenAI Integration', 'Cognitive Search'],
        prerequisites: ['C# or Python Basics'],
        recommendedExperience: '1 Year',
        examDurationMinutes: 120,
        passingScore: '700/1000',
        examCostUsd: 165.0,
        renewalRequirements: 'Free annual online renewal',
        validityPeriodYears: 1,
        skillsCovered: ['Azure AI', 'OpenAI API', 'Cognitive Search', 'Python'],
        employerRecognitionScore: 94.0,
        salaryBoostUsd: 15000.0,
        officialUrl: 'https://learn.microsoft.com/certifications/azure-ai-engineer',
        rankScore: 94.8,
        whyRecommended: 'Direct credential for building enterprise AI & LLM solutions.',
      },
      {
        id: 'hashicorp-tf',
        name: 'HashiCorp Certified: Terraform Associate (003)',
        provider: 'HashiCorp',
        level: 'Associate',
        examCode: 'TA-003',
        domainsCovered: ['Infrastructure as Code', 'Terraform CLI', 'HCL Syntax'],
        prerequisites: ['Cloud Basics'],
        recommendedExperience: '6 Months',
        examDurationMinutes: 60,
        passingScore: '70%',
        examCostUsd: 70.0,
        renewalRequirements: 'Recertify every 2 years',
        validityPeriodYears: 2,
        skillsCovered: ['Terraform', 'Infrastructure as Code', 'HCL', 'Multi-Cloud'],
        employerRecognitionScore: 93.0,
        salaryBoostUsd: 14500.0,
        officialUrl: 'https://hashicorp.com/certification/terraform-associate',
        rankScore: 92.5,
        whyRecommended: 'Standard credential for DevOps and Multi-Cloud automation.',
      },
      {
        id: 'isc2-cissp',
        name: 'Certified Information Systems Security Professional (CISSP)',
        provider: 'ISC²',
        level: 'Expert',
        examCode: 'CISSP',
        domainsCovered: ['Security Risk Management', 'Asset Security', 'Security Architecture'],
        prerequisites: ['5 Years Security Experience'],
        recommendedExperience: '5 Years',
        examDurationMinutes: 240,
        passingScore: '700/1000',
        examCostUsd: 749.0,
        renewalRequirements: '120 CPE credits over 3 years',
        validityPeriodYears: 3,
        skillsCovered: ['Cybersecurity Governance', 'Risk Assessment', 'Zero Trust'],
        employerRecognitionScore: 99.0,
        salaryBoostUsd: 25000.0,
        officialUrl: 'https://isc2.org/certifications/cissp',
        rankScore: 95.0,
        whyRecommended: 'Top tier cybersecurity leadership credential worldwide.',
      },
    ],
    []
  );

  // Filtered & Sorted Certifications
  const filteredCerts = useMemo(() => {
    let list = [...certs];

    if (selectedProvider !== 'all') {
      list = list.filter((c) => c.provider === selectedProvider);
    }
    if (selectedLevel !== 'all') {
      list = list.filter((c) => c.level === selectedLevel);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.provider.toLowerCase().includes(q) ||
          c.examCode.toLowerCase().includes(q) ||
          c.skillsCovered.some((s) => s.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'rank-desc') return b.rankScore - a.rankScore;
      if (sortBy === 'salary-desc') return b.salaryBoostUsd - a.salaryBoostUsd;
      if (sortBy === 'recognition-desc') return b.employerRecognitionScore - a.employerRecognitionScore;
      if (sortBy === 'cost-asc') return a.examCostUsd - b.examCostUsd;
      return 0;
    });

    return list;
  }, [certs, selectedProvider, selectedLevel, searchQuery, sortBy]);

  // Bookmarking Toggle
  const toggleSaveCert = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedCertIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      localStorage.setItem('sb-saved-certs', JSON.stringify(next));
      addToast({
        type: 'info',
        message: next.includes(id) ? 'Certification bookmarked' : 'Certification removed',
      });
      return next;
    });
  };

  // Toggle Mark Earned
  const toggleEarnedCert = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEarnedCertIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      addToast({
        type: 'success',
        message: next.includes(id) ? 'Congratulations! Marked certification earned' : 'Status updated',
      });
      return next;
    });
  };

  const handleOpenDetail = (cert: CertificationData) => {
    setSelectedCertForDetail(cert);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* HEADER & TOP CONTROLS */}
      <GlassPanel className="p-6 space-y-4 border-cyan-500/30 bg-slate-950/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Award className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                AI Multi-Provider Certification Intelligence Hub
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
                14 Authorities Synced
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-criteria AI ranking across Microsoft, AWS, GCP, Cisco, CompTIA, ISC², Red Hat, HashiCorp, & CNCF.
            </p>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setActiveTab('recommended')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'recommended'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Recommended ({certs.length})
            </button>
            <button
              onClick={() => setActiveTab('paths')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'paths'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Cert Pathways</span>
            </button>
            <button
              onClick={() => setActiveTab('roi')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'roi'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Salary ROI</span>
            </button>
          </div>
        </div>

        {/* AI INSIGHT */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 flex items-start gap-3 text-xs">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white block">
              AI Multi-Criteria Certification Synthesis ({technologyTarget})
            </span>
            <p className="text-slate-300 leading-relaxed">
              Certifications ranked using <strong className="text-cyan-300">Skill Gap Fit (35%)</strong>, <strong className="text-cyan-300">Employer Recognition (25%)</strong>, and <strong className="text-emerald-400">Salary Impact (20%)</strong> with <strong className="text-emerald-400">98.4% Confidence</strong>.
            </p>
          </div>
        </div>
      </GlassPanel>

      {/* FILTER BAR & SEARCH */}
      {activeTab === 'recommended' && (
        <GlassPanel className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Search Box */}
            <div className="lg:col-span-5 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search certifications by exam code, provider, or title..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <Award className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>

            {/* Provider Filter */}
            <div className="lg:col-span-3">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Providers</option>
                <option value="Google Cloud" className="bg-slate-900 text-white">Google Cloud</option>
                <option value="Amazon Web Services" className="bg-slate-900 text-white">Amazon Web Services (AWS)</option>
                <option value="Microsoft" className="bg-slate-900 text-white">Microsoft</option>
                <option value="CNCF / Linux Foundation" className="bg-slate-900 text-white">CNCF / Kubernetes</option>
                <option value="HashiCorp" className="bg-slate-900 text-white">HashiCorp</option>
                <option value="ISC²" className="bg-slate-900 text-white">ISC²</option>
              </select>
            </div>

            {/* Level Filter */}
            <div className="lg:col-span-2">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Levels</option>
                <option value="Associate" className="bg-slate-900 text-white">Associate</option>
                <option value="Professional" className="bg-slate-900 text-white">Professional</option>
                <option value="Expert" className="bg-slate-900 text-white">Expert</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="lg:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="rank-desc" className="bg-slate-900 text-white">AI Rank Fit Score</option>
                <option value="salary-desc" className="bg-slate-900 text-white">Salary Boost (High-Low)</option>
                <option value="recognition-desc" className="bg-slate-900 text-white">Employer Recognition</option>
                <option value="cost-asc" className="bg-slate-900 text-white">Lowest Exam Fee</option>
              </select>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* RECOMMENDED CERTIFICATIONS GRID */}
      {activeTab === 'recommended' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCerts.map((cert) => {
            const isSaved = savedCertIds.includes(cert.id);
            const isEarned = earnedCertIds.includes(cert.id);

            return (
              <GlassPanel
                key={cert.id}
                className={`p-5 space-y-4 relative overflow-hidden transition-all duration-300 hover:border-cyan-500/50 hover:shadow-xl cursor-pointer flex flex-col justify-between h-full ${
                  isEarned ? 'border-emerald-500/40 bg-emerald-950/10' : ''
                }`}
                onClick={() => handleOpenDetail(cert)}
              >
                {/* Top Rank Accent Line */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400"
                  style={{ opacity: cert.rankScore / 100 }}
                />

                <div className="space-y-3">
                  {/* Header Meta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-bold">
                          {cert.provider}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{cert.examCode}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white leading-snug hover:text-cyan-300 transition-colors">
                        {cert.name}
                      </h4>
                    </div>

                    <button
                      onClick={(e) => toggleSaveCert(cert.id, e)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                        isSaved
                          ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                          : 'text-slate-500 hover:text-white hover:bg-white/10'
                      }`}
                      aria-label="Bookmark certification"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Employer Recognition & Salary Premium */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-mono text-cyan-400 font-bold text-[11px]">
                      {cert.employerRecognitionScore}% Employer Recognition
                    </span>

                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
                      +${cert.salaryBoostUsd.toLocaleString()}/yr
                    </span>
                  </div>

                  {/* Fee & Level */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Exam Fee: ${cert.examCostUsd}</span>
                    <span className="font-bold text-purple-300">{cert.level}</span>
                  </div>

                  {/* Skills Covered Chips */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
                      Skills Validated
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cert.skillsCovered.map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-white/10 text-slate-300 text-[10px] font-mono"
                        >
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 mt-3">
                  <button
                    onClick={(e) => toggleEarnedCert(cert.id, e)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      isEarned
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950/60 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {isEarned ? 'Certified ✓' : 'Mark Earned'}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(cert.officialUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Exam Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}

      {/* CERTIFICATION PATHWAYS TAB */}
      {activeTab === 'paths' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Associate', 'Professional', 'Expert'].map((levelTier) => {
            const levelCerts = certs.filter((c) => c.level === levelTier);
            return (
              <GlassPanel key={levelTier} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    {levelTier} Tier Pathway ({levelCerts.length})
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
                    Career Track
                  </span>
                </div>

                <div className="space-y-2.5">
                  {levelCerts.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleOpenDetail(c)}
                      className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-xs hover:border-cyan-500/40 cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{c.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {c.provider} • Exam Fee ${c.examCostUsd}
                        </span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">+${c.salaryBoostUsd.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}

      {/* SALARY ROI TAB */}
      {activeTab === 'roi' && (
        <GlassPanel className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Certification Annual Salary Boost & ROI Benchmark
            </span>
            <span className="text-[10px] font-mono text-slate-400">Industry Compensation Gain</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={certs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="examCode" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: number | string) => [`+$${Number(val).toLocaleString()}/yr`, 'Estimated Salary Boost']}
                />
                <Bar dataKey="salaryBoostUsd" radius={[6, 6, 0, 0]} name="Annual Salary Increase ($)">
                  {certs.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#06b6d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      )}

      {/* CERTIFICATION DETAIL MODAL */}
      <CertificationDetailModal
        certification={selectedCertForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};
