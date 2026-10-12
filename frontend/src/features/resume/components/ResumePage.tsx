import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Brain, Target, Compass } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { ResumeStudioHeader } from './ResumeStudioHeader';
import { ResumeDropzoneCard } from './ResumeDropzoneCard';
import { ExtractedSkillMatrix } from './ExtractedSkillMatrix';
import { AIResumeInsightsPanel } from './AIResumeInsightsPanel';
import { SectionHealthCards } from './SectionHealthCards';
import { ExtractionQualityMetrics } from './ExtractionQualityMetrics';
import { ResumeStatusPanel, type ResumeSkillChanges } from './ResumeStatusPanel';

// Design System 2.0 Components
import {
  QuickActionGrid,
  AIStatusBar,
  WorkspaceDivider,
  PremiumSection,
} from '../../../components/experience/workspace';
import { AIThinkingAnimation } from '../../../components/experience';

interface ResumeMetadata {
  id: string;
  originalFileName: string;
  fileExtension: string;
  mimeType: string;
  fileSize: number;
  storageProvider: string;
  uploadStatus: string;
  parsingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  parsingError?: string;
  uploadedAt: string;
  atsScore?: number;
  isStuck?: boolean;
  skillChanges?: ResumeSkillChanges | null;
  sectionHealth?: React.ComponentProps<typeof SectionHealthCards>['sections'];
  personalInfo?: Partial<Record<'fullName' | 'email' | 'phone' | 'linkedin' | 'github', ExtractedField | null>>;
  experience?: unknown[];
  projects?: unknown[];
  certifications?: unknown[];
}

/** The parser returns each personal detail as `{ value, confidence }`. */
interface ExtractedField {
  value?: string | null;
}

const fieldValue = (field?: ExtractedField | null): string | undefined => {
  const value = field?.value;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

export const ResumePage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Complete downstream query invalidation handler
  const invalidateAllDownstreamQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['activeResume'] });
    queryClient.invalidateQueries({ queryKey: ['skills', 'me'] });
    queryClient.invalidateQueries({ queryKey: ['careers', 'matches'] });
    queryClient.invalidateQueries({ queryKey: ['readiness'] });
    queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    queryClient.invalidateQueries({ queryKey: ['roadmap'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    queryClient.invalidateQueries({ queryKey: ['careerSnapshot'] });
    queryClient.invalidateQueries({ queryKey: ['career-snapshot'] });
  }, [queryClient]);

  // Fetch current user's active resume metadata & parsed intelligence
  const {
    data: resume,
    isLoading: isResumeLoading,
    refetch,
  } = useQuery<ResumeMetadata | null>({
    queryKey: ['activeResume'],
    queryFn: async () => {
      const response = await apiClient.get('/resumes/me');
      return response.data.data.resume;
    },
    refetchInterval: (query) => {
      const status = query.state?.data?.parsingStatus;
      if (status === 'pending' || status === 'processing') return 2000;
      return false;
    },
  });

  // Refetch everything derived from the resume once a run ends, whether it succeeded or not
  React.useEffect(() => {
    if (resume?.parsingStatus === 'completed' || resume?.parsingStatus === 'failed') {
      invalidateAllDownstreamQueries();
    }
  }, [resume?.parsingStatus, invalidateAllDownstreamQueries]);

  // Fetch Extracted Skills for skill matrix
  const { data: skillsData } = useQuery<{
    categories?: Record<string, Array<{ id?: string; name: string; category?: string; evidenceScore?: number }>>;
    totalSkills: number;
  }>({
    queryKey: ['skills', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/skills/me');
      return response.data.data;
    },
  });

  const extractedSkills = useMemo(() => {
    if (!skillsData?.categories) return [];
    return Object.values(skillsData.categories).flatMap((items) => items);
  }, [skillsData]);

  // Derive dynamic insights from actual parsed resume
  const aiInsights = useMemo(() => {
    if (!resume) return { topStrengths: [], weakSections: [], missingSections: [], recommendedImprovements: [] };
    const strengths: string[] = [];
    const weak: string[] = [];
    const missing: string[] = [];
    const recs: Array<{ title: string; impact: string; suggestion: string }> = [];

    if (resume.atsScore && resume.atsScore >= 70) {
      strengths.push(`Resume completeness ${resume.atsScore}/100 (sections and details found)`);
    }
    if (extractedSkills.length > 0) {
      strengths.push(`${extractedSkills.length} skills recognised`);
    }
    if (resume.experience && resume.experience.length > 0) {
      strengths.push(`${resume.experience.length} work experience ${resume.experience.length === 1 ? 'entry' : 'entries'} found`);
    }
    if (resume.projects && resume.projects.length > 0) {
      strengths.push(`${resume.projects.length} project${resume.projects.length === 1 ? '' : 's'} found`);
    }

    const info = resume.personalInfo ?? {};
    if (!fieldValue(info.phone)) weak.push('No phone number was found in the contact details.');
    if (!fieldValue(info.linkedin) && !fieldValue(info.github)) weak.push('No LinkedIn or GitHub link was found.');
    if (!resume.certifications || resume.certifications.length === 0) missing.push('Certifications Section');

    if (!fieldValue(info.linkedin)) {
      recs.push({ title: 'Add a LinkedIn URL', impact: 'Completeness', suggestion: 'Include a direct LinkedIn profile link in the header.' });
    }
    if (extractedSkills.length < 10) {
      recs.push({ title: 'List more of your skills', impact: 'Completeness', suggestion: 'Name the tools, frameworks and libraries you have actually used.' });
    }

    return { topStrengths: strengths, weakSections: weak, missingSections: missing, recommendedImprovements: recs };
  }, [resume, extractedSkills]);

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setValidationError(null);
      const formData = new FormData();
      formData.append('resume', file);
      setUploadProgress(0);

      const response = await apiClient.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          const total = event.total || file.size;
          const percent = Math.round((event.loaded * 100) / total);
          setUploadProgress(percent);
        },
      });
      return response.data.data.resume;
    },
    onSuccess: () => {
      invalidateAllDownstreamQueries();
      setUploadProgress(null);
    },
    onError: (err: { message?: string }) => {
      setValidationError(err.message || 'File upload failed. Please try again.');
      setUploadProgress(null);
    },
  });

  // Replace Mutation
  const replaceMutation = useMutation({
    mutationFn: async (file: File) => {
      setValidationError(null);
      setActionError(null);
      const formData = new FormData();
      formData.append('resume', file);
      setUploadProgress(0);

      const response = await apiClient.put('/resumes/replace', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          const total = event.total || file.size;
          const percent = Math.round((event.loaded * 100) / total);
          setUploadProgress(percent);
        },
      });
      return response.data.data.resume;
    },
    onSuccess: () => {
      invalidateAllDownstreamQueries();
      setUploadProgress(null);
    },
    onError: (err: { message?: string }) => {
      setValidationError(err.message || 'File replacement failed. Please try again.');
      setUploadProgress(null);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      setActionError(null);
      await apiClient.delete('/resumes');
    },
    onSuccess: () => {
      invalidateAllDownstreamQueries();
    },
    onError: (err: { message?: string }) => {
      setActionError(err.message || 'The resume could not be deleted. Please try again.');
    },
  });

  // Reprocess Mutation: run extraction again on the stored file
  const reprocessMutation = useMutation({
    mutationFn: async () => {
      setActionError(null);
      await apiClient.post('/resumes/reprocess');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeResume'] });
    },
    onError: (err: { message?: string }) => {
      setActionError(err.message || 'Reprocessing could not be started. Please try again.');
    },
  });

  // Download Trigger
  const handleDownload = async () => {
    try {
      const response = await apiClient.get('/resumes/download', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resume?.originalFileName || 'Resume.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setActionError(null);
    } catch {
      setActionError('The resume file could not be downloaded. Please try again.');
    }
  };

  const handleFileSelect = (file: File) => {
    if (resume) replaceMutation.mutate(file);
    else uploadMutation.mutate(file);
  };

  const isInFlight = resume?.parsingStatus === 'pending' || resume?.parsingStatus === 'processing';

  if (isResumeLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Loading your resume..." />
        </div>
      </div>
    );
  }

  // Quick Action Navigation Shortcuts
  const quickActions = [
    {
      id: 'ai',
      title: 'Ask AI Architect',
      subtitle: 'Analyze resume against target role',
      icon: Brain,
      shortcut: '⌘1',
      color: 'text-cyan-400',
      onClick: () => navigate('/ai'),
    },
    {
      id: 'careers',
      title: 'Career Matches',
      subtitle: 'Vector match leaderboard',
      icon: Target,
      shortcut: '⌘2',
      color: 'text-indigo-400',
      onClick: () => navigate('/careers'),
    },
    {
      id: 'readiness',
      title: 'Career Readiness',
      subtitle: 'Dimensional skill gaps',
      icon: Compass,
      shortcut: '⌘3',
      color: 'text-emerald-400',
      onClick: () => navigate('/readiness'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4">
      {/* SECTION 1 — RESUME STUDIO HEADER */}
      <ResumeStudioHeader
        hasActiveResume={!!resume}
        originalFileName={resume?.originalFileName}
        candidateName={fieldValue(resume?.personalInfo?.fullName)}
        isProcessing={isInFlight && !resume?.isStuck}
        isReprocessing={reprocessMutation.isPending}
        isDeleting={deleteMutation.isPending}
        onDownload={handleDownload}
        onDelete={() => deleteMutation.mutate()}
        onReprocess={() => reprocessMutation.mutate()}
        onRefresh={() => refetch()}
      />

      {(resume || actionError) && (
        <ResumeStatusPanel
          parsingStatus={resume?.parsingStatus}
          parsingError={resume?.parsingError}
          isStuck={resume?.isStuck}
          skillChanges={resume?.skillChanges}
          actionError={actionError}
          isReprocessing={reprocessMutation.isPending}
          onReprocess={() => reprocessMutation.mutate()}
        />
      )}

      {/* SECTION 2 — 2-COLUMN STUDIO WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: DROPZONE & DOCUMENT STATUS */}
        <div className="lg:col-span-5 space-y-6">
          <PremiumSection
            title="Document Studio"
            subtitle="Upload or replace your active resume file"
            badge="Dropzone"
          >
            <ResumeDropzoneCard
              hasActiveResume={!!resume}
              parsingStatus={resume?.parsingStatus}
              uploadProgress={uploadProgress}
              validationError={validationError}
              onFileSelect={handleFileSelect}
            />
          </PremiumSection>

          <ExtractionQualityMetrics
            extractionQualityScore={resume?.atsScore || 0}
          />
        </div>

        {/* RIGHT COLUMN: EXTRACTED INTELLIGENCE & HEALTH */}
        <div className="lg:col-span-7 space-y-6">
          <SectionHealthCards sections={resume?.sectionHealth} />

          <PremiumSection
            title="Skill Extraction Matrix"
            subtitle="Skills recognised in your resume text"
            badge="Taxonomy"
          >
            <ExtractedSkillMatrix
              skills={extractedSkills}
              totalSkills={skillsData?.totalSkills}
            />
          </PremiumSection>
        </div>
      </div>

      <WorkspaceDivider label="AI Insights & Action Shortcuts" />

      {/* SECTION 3 — AI RESUME INSIGHTS */}
      <AIResumeInsightsPanel
        topStrengths={aiInsights.topStrengths}
        weakSections={aiInsights.weakSections}
        missingSections={aiInsights.missingSections}
        recommendedImprovements={aiInsights.recommendedImprovements}
      />

      {/* SECTION 4 — COMMAND CENTER SHORTCUTS */}
      <PremiumSection
        title="Intelligence Shortcuts"
        subtitle="Execute downstream career analysis"
        badge="Actions"
      >
        <QuickActionGrid actions={quickActions} columns={3} />
      </PremiumSection>

      {/* SECTION 5 — LIVE AI STATUS FOOTER */}
      <AIStatusBar
        status={resume?.parsingStatus === 'processing' ? 'thinking' : 'active'}
        lastUpdated="Just now"
      />
    </div>
  );
};

export default ResumePage;
