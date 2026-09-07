import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Sparkles,
  Clock,
  Star,
  Bookmark,
  Layers,
  ArrowUpRight,
  Building2,
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
import { CourseData, CourseDetailModal } from './CourseDetailModal';

export interface CourseIntelligencePanelProps {
  skillTarget?: string;
  onNavigateToRoadmap?: () => void;
}

export const CourseIntelligencePanel: React.FC<CourseIntelligencePanelProps> = ({
  skillTarget = 'Vector Indexing & Cloud Infrastructure',
  onNavigateToRoadmap,
}) => {
  const { addToast } = useToast();

  // State Management
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedPrice, setSelectedPrice] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rank-desc' | 'rating-desc' | 'duration-asc' | 'price-asc'>('rank-desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'recommended' | 'paths' | 'providers'>('recommended');
  
  // Bookmarks & Completion local state
  const [savedCourseIds, setSavedCourseIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('sb-saved-courses');
    return saved ? JSON.parse(saved) : ['coursera-1', 'mslearn-1'];
  });
  const [completedCourseIds, setCompletedCourseIds] = useState<string[]>([]);

  // Selected Modal State
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<CourseData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Multi-Provider Courses Dataset
  const courses: CourseData[] = useMemo(
    () => [
      {
        id: 'coursera-1',
        title: 'Vector Indexing & Vector Databases Deep Learning Specialization',
        provider: 'Coursera',
        instructor: 'DeepLearning.AI',
        durationHours: 24.0,
        difficulty: 'Intermediate',
        costUsd: 49.0,
        isFree: false,
        certificateAvailable: true,
        rating: 4.9,
        reviewCount: 3200,
        rankScore: 97.4,
        learningOutcomes: [
          'Build high-performance vector search indices',
          'Deploy Milvus & Pinecone clusters in production',
          'Integrate LangChain retrieval chains',
        ],
        prerequisites: ['Python Basics', 'REST APIs'],
        skillsTaught: ['Vector Indexing', 'Milvus', 'Pinecone', 'PyTorch'],
        providerUrl: 'https://coursera.org',
        whyRecommended: 'Highest semantic skill match with your target role gap in vector databases.',
        careerImpact: 'Increases market salary benchmark by +$18,200/yr.',
      },
      {
        id: 'edx-1',
        title: 'Kubernetes Cluster Architecture & Microservices Engine',
        provider: 'edX',
        instructor: 'Linux Foundation',
        durationHours: 30.0,
        difficulty: 'Advanced',
        costUsd: 0.0,
        isFree: true,
        certificateAvailable: true,
        rating: 4.8,
        reviewCount: 1850,
        rankScore: 94.2,
        learningOutcomes: [
          'Architect multi-node Kubernetes clusters',
          'Configure ingress controllers & TLS certificates',
          'Automate Helm deployment charts',
        ],
        prerequisites: ['Linux Fundamentals', 'Docker'],
        skillsTaught: ['Kubernetes', 'Docker', 'DevOps', 'Helm'],
        providerUrl: 'https://edx.org',
        whyRecommended: 'Required in 84% of Senior AI Infrastructure Engineer job listings.',
        careerImpact: 'Unlocks tier 1 cloud architecture shortlist eligibility.',
      },
      {
        id: 'mslearn-1',
        title: 'Microsoft Azure AI Engineer Associate (AI-102)',
        provider: 'Microsoft Learn',
        instructor: 'Microsoft Cloud Team',
        durationHours: 18.0,
        difficulty: 'Intermediate',
        costUsd: 0.0,
        isFree: true,
        certificateAvailable: true,
        rating: 4.8,
        reviewCount: 2400,
        rankScore: 93.8,
        learningOutcomes: [
          'Design Cognitive Search vector indexes',
          'Deploy Azure OpenAI Service endpoints',
        ],
        prerequisites: ['Cloud Fundamentals'],
        skillsTaught: ['Azure AI', 'OpenAI API', 'Cognitive Search'],
        providerUrl: 'https://learn.microsoft.com',
        whyRecommended: 'Top free industry certification for enterprise AI engineering.',
        careerImpact: '+15% average salary premium for certified cloud architects.',
      },
      {
        id: 'udemy-1',
        title: 'FastAPI & Async Python Microservices Masterclass',
        provider: 'Udemy',
        instructor: 'Jose Portilla',
        durationHours: 14.5,
        difficulty: 'Intermediate',
        costUsd: 14.99,
        isFree: false,
        certificateAvailable: true,
        rating: 4.7,
        reviewCount: 4100,
        rankScore: 91.5,
        learningOutcomes: ['Build high throughput REST & GraphQL APIs with FastAPI'],
        prerequisites: ['Python OOP'],
        skillsTaught: ['FastAPI', 'Asyncio', 'PostgreSQL', 'Docker'],
        providerUrl: 'https://udemy.com',
        whyRecommended: 'Essential backend technology for high speed AI inference servers.',
        careerImpact: 'Boosts backend service development speed by 3x.',
      },
      {
        id: 'aws-1',
        title: 'AWS Certified Solutions Architect Knowledge Path',
        provider: 'AWS Skill Builder',
        instructor: 'AWS Technical Team',
        durationHours: 20.0,
        difficulty: 'Intermediate',
        costUsd: 0.0,
        isFree: true,
        certificateAvailable: true,
        rating: 4.9,
        reviewCount: 5600,
        rankScore: 92.0,
        learningOutcomes: ['Architect resilient cloud systems on AWS infrastructure'],
        prerequisites: ['Basic Networking'],
        skillsTaught: ['AWS Cloud', 'S3', 'EC2', 'Lambda'],
        providerUrl: 'https://aws.amazon.com',
        whyRecommended: 'Gold standard cloud architecture training path.',
        careerImpact: 'Unlocks top tier cloud migration responsibilities.',
      },
      {
        id: 'fcc-1',
        title: 'Back End Development & Microservices Certification',
        provider: 'freeCodeCamp',
        instructor: 'freeCodeCamp Community',
        durationHours: 300.0,
        difficulty: 'Beginner',
        costUsd: 0.0,
        isFree: true,
        certificateAvailable: true,
        rating: 4.9,
        reviewCount: 12500,
        rankScore: 89.0,
        learningOutcomes: ['Complete full-stack Node.js & Express API projects'],
        prerequisites: ['HTML & JavaScript'],
        skillsTaught: ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
        providerUrl: 'https://freecodecamp.org',
        whyRecommended: 'Comprehensive hands-on full-stack development foundation.',
        careerImpact: 'Establishes core engineering fundamentals.',
      },
    ],
    []
  );

  // Provider Comparison Summary
  const providerStats = useMemo(
    () => [
      { provider: 'Coursera', avgRating: 4.9, coursesCount: 142, certValue: 95 },
      { provider: 'edX', avgRating: 4.8, coursesCount: 98, certValue: 92 },
      { provider: 'Microsoft Learn', avgRating: 4.8, coursesCount: 210, certValue: 90 },
      { provider: 'AWS Skill Builder', avgRating: 4.9, coursesCount: 180, certValue: 94 },
      { provider: 'Udemy', avgRating: 4.7, coursesCount: 450, certValue: 82 },
    ],
    []
  );

  // Filtered & Sorted Courses
  const filteredCourses = useMemo(() => {
    let list = [...courses];

    if (selectedProvider !== 'all') {
      list = list.filter((c) => c.provider === selectedProvider);
    }
    if (selectedDifficulty !== 'all') {
      list = list.filter((c) => c.difficulty === selectedDifficulty);
    }
    if (selectedPrice === 'free') {
      list = list.filter((c) => c.isFree);
    } else if (selectedPrice === 'paid') {
      list = list.filter((c) => !c.isFree);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.provider.toLowerCase().includes(q) ||
          c.skillsTaught.some((s) => s.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'rank-desc') return b.rankScore - a.rankScore;
      if (sortBy === 'rating-desc') return b.rating - a.rating;
      if (sortBy === 'duration-asc') return a.durationHours - b.durationHours;
      if (sortBy === 'price-asc') return a.costUsd - b.costUsd;
      return 0;
    });

    return list;
  }, [courses, selectedProvider, selectedDifficulty, selectedPrice, searchQuery, sortBy]);

  // Bookmarking Toggle
  const toggleSaveCourse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedCourseIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      localStorage.setItem('sb-saved-courses', JSON.stringify(next));
      addToast({
        type: 'info',
        message: next.includes(id) ? 'Course bookmarked to saved learning' : 'Course removed from bookmarks',
      });
      return next;
    });
  };

  // Toggle Mark Completed
  const toggleCompleteCourse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedCourseIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      addToast({
        type: 'success',
        message: next.includes(id) ? 'Marked course completed!' : 'Status updated',
      });
      return next;
    });
  };

  const handleOpenDetail = (course: CourseData) => {
    setSelectedCourseForDetail(course);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* HEADER & TOP CONTROLS */}
      <GlassPanel className="p-6 space-y-4 border-indigo-500/30 bg-slate-950/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                AI Multi-Provider Course Intelligence Hub
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold">
                12 Providers Synced
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-factor AI discovery ranking top courses across Coursera, edX, Udemy, Microsoft Learn, AWS, GCP, & freeCodeCamp.
            </p>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setActiveTab('recommended')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'recommended'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Recommended ({courses.length})
            </button>
            <button
              onClick={() => setActiveTab('paths')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'paths'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Learning Paths</span>
            </button>
            <button
              onClick={() => setActiveTab('providers')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'providers'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Providers</span>
            </button>
          </div>
        </div>

        {/* AI INSIGHT */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 flex items-start gap-3 text-xs">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white block">
              AI Multi-Criteria Selection Synthesis ({skillTarget})
            </span>
            <p className="text-slate-300 leading-relaxed">
              Courses ranked using <strong className="text-cyan-300">Skill Gap Fit (35%)</strong>, <strong className="text-cyan-300">Rating (25%)</strong>, and <strong className="text-emerald-400">Market Relevance (20%)</strong> with <strong className="text-emerald-400">98.4% Grounding Confidence</strong>.
            </p>
          </div>
        </div>
      </GlassPanel>

      {/* FILTER BAR & SEARCH */}
      {activeTab === 'recommended' && (
        <GlassPanel className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Search Box */}
            <div className="lg:col-span-4 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses by skill, provider, or title..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <BookOpen className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>

            {/* Provider Filter */}
            <div className="lg:col-span-2">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Providers</option>
                <option value="Coursera" className="bg-slate-900 text-white">Coursera</option>
                <option value="edX" className="bg-slate-900 text-white">edX</option>
                <option value="Udemy" className="bg-slate-900 text-white">Udemy</option>
                <option value="Microsoft Learn" className="bg-slate-900 text-white">Microsoft Learn</option>
                <option value="AWS Skill Builder" className="bg-slate-900 text-white">AWS Skill Builder</option>
                <option value="freeCodeCamp" className="bg-slate-900 text-white">freeCodeCamp</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="lg:col-span-2">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Levels</option>
                <option value="Beginner" className="bg-slate-900 text-white">Beginner</option>
                <option value="Intermediate" className="bg-slate-900 text-white">Intermediate</option>
                <option value="Advanced" className="bg-slate-900 text-white">Advanced</option>
              </select>
            </div>

            {/* Price Filter */}
            <div className="lg:col-span-2">
              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Tuition</option>
                <option value="free" className="bg-slate-900 text-white">Free Only</option>
                <option value="paid" className="bg-slate-900 text-white">Paid Courses</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="lg:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="rank-desc" className="bg-slate-900 text-white">AI Rank Fit Score</option>
                <option value="rating-desc" className="bg-slate-900 text-white">User Rating (High-Low)</option>
                <option value="duration-asc" className="bg-slate-900 text-white">Shortest Duration</option>
                <option value="price-asc" className="bg-slate-900 text-white">Lowest Price</option>
              </select>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* RECOMMENDED COURSES GRID */}
      {activeTab === 'recommended' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const isSaved = savedCourseIds.includes(course.id);
            const isCompleted = completedCourseIds.includes(course.id);

            return (
              <GlassPanel
                key={course.id}
                className={`p-5 space-y-4 relative overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:shadow-xl cursor-pointer flex flex-col justify-between h-full ${
                  isCompleted ? 'border-emerald-500/40 bg-emerald-950/10' : ''
                }`}
                onClick={() => handleOpenDetail(course)}
              >
                {/* Top Rank Indicator Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
                  style={{ opacity: course.rankScore / 100 }}
                />

                <div className="space-y-3">
                  {/* Top Meta Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold">
                        {course.provider}
                      </span>
                      <h4 className="text-sm font-bold text-white leading-snug hover:text-indigo-300 transition-colors">
                        {course.title}
                      </h4>
                    </div>

                    <button
                      onClick={(e) => toggleSaveCourse(course.id, e)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                        isSaved
                          ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                          : 'text-slate-500 hover:text-white hover:bg-white/10'
                      }`}
                      aria-label="Bookmark course"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Rating & Rank Score */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="flex items-center gap-1 text-amber-400 font-bold font-mono">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {course.rating} ({course.reviewCount.toLocaleString()})
                    </span>

                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-white/10 text-cyan-400 font-mono text-[10px] font-bold">
                      {course.rankScore} Rank Fit
                    </span>
                  </div>

                  {/* Duration & Tuition */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {course.durationHours} hrs
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {course.isFree ? 'FREE' : `$${course.costUsd}`}
                    </span>
                  </div>

                  {/* Skills Taught Chips */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
                      Skills Taught
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {course.skillsTaught.map((s, i) => (
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
                    onClick={(e) => toggleCompleteCourse(course.id, e)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950/60 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {isCompleted ? 'Completed ✓' : 'Mark Done'}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(course.providerUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>View Course</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}

      {/* LEARNING PATHS MULTI-TRACK TAB */}
      {activeTab === 'paths' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((track) => {
            const trackCourses = courses.filter((c) => c.difficulty === track);
            return (
              <GlassPanel key={track} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    {track} Specialization Track ({trackCourses.length} Courses)
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">
                    Curated Track
                  </span>
                </div>

                <div className="space-y-2.5">
                  {trackCourses.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleOpenDetail(c)}
                      className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-xs hover:border-indigo-500/40 cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{c.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {c.provider} • {c.durationHours} hrs
                        </span>
                      </div>
                      <span className="font-mono text-cyan-400 font-bold">{c.rankScore} Rank</span>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}

      {/* PROVIDERS COMPARISON TAB */}
      {activeTab === 'providers' && (
        <GlassPanel className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Global Provider Certification Value Benchmark
            </span>
            <span className="text-[10px] font-mono text-slate-400">5 Top Providers</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="provider" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="certValue" radius={[6, 6, 0, 0]} name="Certification Value Rating">
                  {providerStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#06b6d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      )}

      {/* COURSE DETAIL MODAL */}
      <CourseDetailModal
        course={selectedCourseForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};
