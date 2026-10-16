/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from 'react-router-dom';
import React, { Suspense, useEffect } from 'react';
import { lazyWithRetry } from './lazyWithRetry';
import { useAuthStore } from '../store/authStore';
import { GuestRoute, ProtectedRoute } from '../components/RouteGuards';
import { AppShell } from '../layouts/AppShell';
import { AuthLayout } from '../layouts/AuthLayout';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { NotFoundPage } from '../components/common/NotFoundPage';
import { PageSkeleton } from '../design/aurora/kit';

// Lazy-loaded Workspaces for Route Code Splitting
const HomeWorkspace = lazyWithRetry(() => import('../workspaces/HomeWorkspace/HomeWorkspace'));
const CareerLabWorkspace = lazyWithRetry(() => import('../workspaces/CareerLabWorkspace/CareerLabWorkspace'));
const ActivityWorkspace = lazyWithRetry(() => import('../workspaces/ActivityWorkspace/ActivityWorkspace'));
const PortfolioWorkspace = lazyWithRetry(() => import('../workspaces/PortfolioWorkspace/PortfolioWorkspace'));
const PublicPortfolioPage = lazyWithRetry(() => import('../workspaces/PortfolioWorkspace/PublicPortfolioPage'));
const CareerIntelligenceWorkspace = lazyWithRetry(() => import('../workspaces/CareerIntelligenceWorkspace/CareerIntelligenceWorkspace'));
const LearningJourneyWorkspace = lazyWithRetry(() => import('../workspaces/LearningJourneyWorkspace/LearningJourneyWorkspace'));
const AnalyticsWorkspace = lazyWithRetry(() => import('../workspaces/AnalyticsWorkspace/AnalyticsWorkspace'));
const AICareerArchitectWorkspace = lazyWithRetry(() => import('../workspaces/AICareerArchitectWorkspace/AICareerArchitectWorkspace'));
const SettingsWorkspace = lazyWithRetry(() => import('../workspaces/SettingsWorkspace/SettingsWorkspace'));
const PlatformDiagnosticsWorkspace = lazyWithRetry(() => import('../workspaces/PlatformDiagnosticsWorkspace/PlatformDiagnosticsWorkspace'));
const KnowledgeGraphExplorerWorkspace = lazyWithRetry(() => import('../workspaces/KnowledgeGraphExplorerWorkspace/KnowledgeGraphExplorerWorkspace'));
const EventMonitoringConsoleWorkspace = lazyWithRetry(() => import('../workspaces/EventMonitoringConsoleWorkspace/EventMonitoringConsoleWorkspace'));
const AIFeatureExplorerWorkspace = lazyWithRetry(() => import('../workspaces/AIFeatureExplorerWorkspace/AIFeatureExplorerWorkspace'));
const AIOperationsCenterWorkspace = lazyWithRetry(() => import('../workspaces/AIOperationsCenterWorkspace/AIOperationsCenterWorkspace'));
const GitHubIntelligenceWorkspace = lazyWithRetry(() => import('../workspaces/GitHubIntelligenceWorkspace/GitHubIntelligenceWorkspace'));
const LinkedInIntelligenceWorkspace = lazyWithRetry(() => import('../workspaces/LinkedInIntelligenceWorkspace/LinkedInIntelligenceWorkspace'));
const PortfolioIntelligenceWorkspace = lazyWithRetry(() => import('../workspaces/PortfolioIntelligenceWorkspace/PortfolioIntelligenceWorkspace'));
const CodingIntelligenceWorkspace = lazyWithRetry(() => import('../workspaces/CodingIntelligenceWorkspace/CodingIntelligenceWorkspace'));
const OpenSourceIntelligenceWorkspace = lazyWithRetry(() => import('../workspaces/OpenSourceIntelligenceWorkspace/OpenSourceIntelligenceWorkspace'));
const ProfessionalBrandWorkspace = lazyWithRetry(() => import('../workspaces/ProfessionalBrandWorkspace/ProfessionalBrandWorkspace'));
const ProfessionalDigitalTwinWorkspace = lazyWithRetry(() => import('../workspaces/ProfessionalDigitalTwinWorkspace/ProfessionalDigitalTwinWorkspace'));
const CareerPlanningAgentWorkspace = lazyWithRetry(() => import('../workspaces/CareerPlanningAgentWorkspace/CareerPlanningAgentWorkspace'));
const JobSearchAgentWorkspace = lazyWithRetry(() => import('../workspaces/JobSearchAgentWorkspace/JobSearchAgentWorkspace'));
const LearningAgentWorkspace = lazyWithRetry(() => import('../workspaces/LearningAgentWorkspace/LearningAgentWorkspace'));
const ResumeOptimizationAgentWorkspace = lazyWithRetry(() => import('../workspaces/ResumeOptimizationAgentWorkspace/ResumeOptimizationAgentWorkspace'));
const InterviewPrepAgentWorkspace = lazyWithRetry(() => import('../workspaces/InterviewPrepAgentWorkspace/InterviewPrepAgentWorkspace'));
const NetworkingAgentWorkspace = lazyWithRetry(() => import('../workspaces/NetworkingAgentWorkspace/NetworkingAgentWorkspace'));
const OpportunityDiscoveryWorkspace = lazyWithRetry(() => import('../workspaces/OpportunityDiscoveryWorkspace/OpportunityDiscoveryWorkspace'));
const AIOrchestratorDashboard = lazyWithRetry(() => import('../workspaces/AIOrchestratorDashboard/AIOrchestratorDashboard'));
const PersonalMemoryWorkspace = lazyWithRetry(() => import('../workspaces/PersonalMemoryWorkspace/PersonalMemoryWorkspace'));
const CareerOSDashboard = lazyWithRetry(() => import('../workspaces/CareerOSDashboard/CareerOSDashboard'));
const MarketEvidencePage = lazyWithRetry(() => import('../features/market/components/MarketEvidencePage'));
const SalaryInsightsPage = lazyWithRetry(() => import('../features/market/components/SalaryInsightsPage'));
const ApplicationHistoryPage = lazyWithRetry(() => import('../features/applications/components/ApplicationHistoryPage'));
const TechnicalAssessmentPage = lazyWithRetry(() => import('../features/interview/components/TechnicalAssessmentPage'));
const ExamsHomePage = lazyWithRetry(() => import('../features/exams/components/ExamsHomePage'));
const ExamPage = lazyWithRetry(() => import('../features/exams/components/ExamPage'));
const ResumeLanguagePage = lazyWithRetry(() => import('../features/languages/components/ResumeLanguagePage'));
const EmployerPostingsPage = lazyWithRetry(() => import('../features/employer/components/EmployerPostingsPage'));
const CareerDomainsPage = lazyWithRetry(() => import('../features/careerDomains/components/CareerDomainsPage'));
const AiObservabilityPage = lazyWithRetry(() => import('../features/aiObservability/components/AiObservabilityPage'));
const ApplicationOutcomesPage = lazyWithRetry(() => import('../features/applications/components/ApplicationOutcomesPage'));
const CareerIdentityWorkspace = lazyWithRetry(() => import('../workspaces/CareerIdentityWorkspace/CareerIdentityWorkspace'));

// Feature Pages
import LoginForm from '../features/auth/components/LoginForm';
import RegisterForm from '../features/auth/components/RegisterForm';
const ResumePage = lazyWithRetry(() => import('../features/resume/components/ResumePage'));
const SkillIntelligencePage = lazyWithRetry(() => import('../features/skills/components/SkillIntelligencePage'));
const CareerReadinessPage = lazyWithRetry(() => import('../features/careers/components/CareerReadinessPage'));

const RecommendationPage = lazyWithRetry(() => import('../features/recommendations/components/RecommendationPage'));

// Suspense Fallback Wrapper
const WorkspaceSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense
      fallback={<PageSkeleton label="Loading" />}
    >
      {children}
    </Suspense>
  </ErrorBoundary>
);

import LandingPage from '../features/landing/LandingPage';
import { DemoWorkspace } from '../components/common/IllustrativeNotice';

// Root redirect handler based on authentication status
const RootRedirect: React.FC = () => {
  const accessToken = useAuthStore(state => state.accessToken);
  const fetchCurrentUser = useAuthStore(state => state.fetchCurrentUser);
  const clearSession = useAuthStore(state => state.clearSession);

  useEffect(() => {
    if (accessToken) {
      fetchCurrentUser().catch(() => {
        clearSession();
      });
    }
  }, [accessToken, fetchCurrentUser, clearSession]);

  return <LandingPage />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    // A shared portfolio is public: reachable signed in or not
    path: '/p/:token',
    element: (
      <WorkspaceSuspense>
        <PublicPortfolioPage />
      </WorkspaceSuspense>
    ),
  },
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: <LoginForm />,
          },
          {
            path: '/register',
            element: <RegisterForm />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: '/home',
            element: (
              <WorkspaceSuspense>
                <HomeWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/careers',
            element: (
              <WorkspaceSuspense>
                <CareerIntelligenceWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/career-lab',
            element: (
              <WorkspaceSuspense>
                <CareerLabWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/activity',
            element: (
              <WorkspaceSuspense>
                <ActivityWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/portfolio',
            element: (
              <WorkspaceSuspense>
                <PortfolioWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/roadmap',
            element: (
              <WorkspaceSuspense>
                <LearningJourneyWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/recommendations',
            element: (
              <WorkspaceSuspense>
                <RecommendationPage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/analytics',
            element: (
              <WorkspaceSuspense>
                <AnalyticsWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/ai',
            element: (
              <WorkspaceSuspense>
                <AICareerArchitectWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/profile',
            element: (
              <WorkspaceSuspense>
                <CareerIdentityWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/settings',
            element: (
              <WorkspaceSuspense>
                <SettingsWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/readiness',
            element: (
              <WorkspaceSuspense>
                <CareerReadinessPage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/skills',
            element: (
              <WorkspaceSuspense>
                <SkillIntelligencePage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/resume',
            element: (
              <WorkspaceSuspense>
                <ResumePage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/diagnostics',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <PlatformDiagnosticsWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/graph',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <KnowledgeGraphExplorerWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/events',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <EventMonitoringConsoleWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/features',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <AIFeatureExplorerWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/ops',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <AIOperationsCenterWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/github',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <GitHubIntelligenceWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/linkedin',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <LinkedInIntelligenceWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            // The illustrative mock-up that used to answer /portfolio; the real portfolio has that address now
            path: '/portfolio-demo',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <PortfolioIntelligenceWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/coding',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <CodingIntelligenceWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/opensource',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <OpenSourceIntelligenceWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/brand',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <ProfessionalBrandWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/digital-twin',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <ProfessionalDigitalTwinWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/agent',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <CareerPlanningAgentWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/job-agent',
            element: (
              <WorkspaceSuspense>
                <JobSearchAgentWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/learning-agent',
            element: (
              <WorkspaceSuspense>
                <LearningAgentWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/resume-agent',
            element: (
              <WorkspaceSuspense>
                <ResumeOptimizationAgentWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/interview-agent',
            element: (
              <WorkspaceSuspense>
                <InterviewPrepAgentWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/interviews',
            element: (
              <WorkspaceSuspense>
                <InterviewPrepAgentWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/networking-agent',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <NetworkingAgentWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/opportunity-agent',
            element: (
              <WorkspaceSuspense>
                <OpportunityDiscoveryWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/market',
            element: (
              <WorkspaceSuspense>
                <MarketEvidencePage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/market/salaries',
            element: (
              <WorkspaceSuspense>
                <SalaryInsightsPage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/resume-language',
            element: (
              <WorkspaceSuspense>
                <ResumeLanguagePage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/employer-postings',
            element: (
              <WorkspaceSuspense>
                <EmployerPostingsPage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/ai-observability',
            element: (
              <WorkspaceSuspense>
                <AiObservabilityPage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/career-domains',
            element: (
              <WorkspaceSuspense>
                <CareerDomainsPage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/exams',
            element: (
              <WorkspaceSuspense>
                <ExamsHomePage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/exams/:examId',
            element: (
              <WorkspaceSuspense>
                <ExamPage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/interview-agent/assessments',
            element: (
              <WorkspaceSuspense>
                <TechnicalAssessmentPage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/applications',
            element: (
              <WorkspaceSuspense>
                <ApplicationHistoryPage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/application-outcomes',
            element: (
              <WorkspaceSuspense>
                <ApplicationOutcomesPage />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/opportunities',
            element: (
              <WorkspaceSuspense>
                <OpportunityDiscoveryWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/orchestrator',
            element: (
              <WorkspaceSuspense>
                <AIOrchestratorDashboard />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/memory',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <PersonalMemoryWorkspace />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/career-os',
            element: (
              <WorkspaceSuspense>
                <DemoWorkspace>
                  <CareerOSDashboard />
                </DemoWorkspace>
              </WorkspaceSuspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
], {
  future: {
    v7_relativeSplatPath: true,
  },
});

export default router;
