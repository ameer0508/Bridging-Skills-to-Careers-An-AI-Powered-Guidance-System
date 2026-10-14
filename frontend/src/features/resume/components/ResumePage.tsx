import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Compass, FileText, Sparkles, Target } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { PageHeader, PageSkeleton, Pill } from '../../../design/aurora/kit';
import { Reveal, RevealItem } from '../../../design/aurora/primitives';
import { CardHeader, cardClass } from '../../../design/aurora/ui';
import {
  EvidenceSkills,
  ProcessingNotices,
  ResumeActions,
  SectionsFound,
  Suggestions,
  UploadCard,
  type SectionHealth,
  type SkillChanges,
} from '../aurora/ResumeParts';
import type { ProfileSkill } from '../aurora/skillEvidence';

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
  skillChanges?: SkillChanges | null;
  sectionHealth?: SectionHealth[];
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
    categories?: Record<string, ProfileSkill[]>;
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
    return Object.entries(skillsData.categories).flatMap(([category, items]) => items.map((item) => ({ ...item, category: item.category ?? category })));
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

  if (isResumeLoading) return <PageSkeleton label="Loading your resume" />;

  const candidateName = fieldValue(resume?.personalInfo?.fullName);
  const links = [
    { to: '/careers', label: 'Career matches', icon: <Target className="h-4 w-4" aria-hidden="true" /> },
    { to: '/readiness', label: 'Career readiness', icon: <Compass className="h-4 w-4" aria-hidden="true" /> },
    { to: '/ai', label: 'Ask the assistant', icon: <Sparkles className="h-4 w-4" aria-hidden="true" /> },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      <PageHeader
        eyebrow="Resume Intelligence"
        icon={<FileText className="h-7 w-7" aria-hidden="true" />}
        title={resume ? 'Your resume, read as evidence' : 'Start with your resume'}
        lead={
          resume ? (
            <div className="space-y-1">
              <p>
                Active file: <span className="font-semibold text-aurora-ink">{resume.originalFileName}</span>{' '}
                <Pill tone="violet" className="ml-1 align-middle">Rule-based parser</Pill>
              </p>
              {candidateName && (
                <p>
                  Candidate: <span className="font-semibold text-aurora-ink" data-testid="resume-candidate-name">{candidateName}</span>
                </p>
              )}
            </div>
          ) : (
            'Upload a PDF or Word resume. SkillBridge reads its roles, projects, education and skills, and shows the evidence behind every skill it finds.'
          )
        }
        actions={
          <ResumeActions
            fileName={resume?.originalFileName}
            hasResume={!!resume}
            busy={(isInFlight && !resume?.isStuck) || reprocessMutation.isPending}
            isDeleting={deleteMutation.isPending}
            onRefresh={() => refetch()}
            onReprocess={() => reprocessMutation.mutate()}
            onDownload={handleDownload}
            onDelete={() => deleteMutation.mutate()}
          />
        }
      />

      {(resume || actionError) && (
        <ProcessingNotices
          status={resume?.parsingStatus}
          error={resume?.parsingError}
          isStuck={resume?.isStuck}
          changes={resume?.skillChanges}
          actionError={actionError}
          isReprocessing={reprocessMutation.isPending}
          onReprocess={() => reprocessMutation.mutate()}
        />
      )}

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <UploadCard hasResume={!!resume} uploadProgress={uploadProgress} validationError={validationError} onFileSelect={handleFileSelect} />
          <SectionsFound sections={resume?.sectionHealth} completeness={resume && typeof resume.atsScore === 'number' ? resume.atsScore : null} />
        </div>
        <div className="space-y-6 lg:col-span-7">
          <EvidenceSkills skills={extractedSkills} total={skillsData?.totalSkills} />
        </div>
      </div>

      {resume && (
        <Reveal className="grid gap-6 lg:grid-cols-3">
          <RevealItem className="lg:col-span-2">
            <Suggestions strengths={aiInsights.topStrengths} gaps={[...aiInsights.weakSections, ...aiInsights.missingSections.map((m) => `No ${m.replace(/ Section$/, '').toLowerCase()} section was found.`)]} tips={aiInsights.recommendedImprovements} />
          </RevealItem>
          <RevealItem>
            <section className={cardClass} aria-labelledby="next-heading">
              <CardHeader id="next-heading" icon={<Target className="h-5 w-5" aria-hidden="true" />} title="Where your skills are used" />
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="flex items-center gap-3 rounded-2xl border border-aurora-line px-3 py-2.5 text-sm font-semibold text-aurora-ink transition-colors hover:border-aurora-lavender hover:bg-aurora-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet">
                      <span className="text-aurora-violet">{link.icon}</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </RevealItem>
        </Reveal>
      )}
    </div>
  );
};

export default ResumePage;
