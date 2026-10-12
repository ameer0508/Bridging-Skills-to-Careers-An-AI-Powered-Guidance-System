/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from 'react-router-dom';
import React, { lazy, Suspense, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { GuestRoute, ProtectedRoute } from '../components/RouteGuards';
import { AppShell } from '../layouts/AppShell';
import { AuthLayout } from '../layouts/AuthLayout';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { NotFoundPage } from '../components/common/NotFoundPage';
import { AIThinkingAnimation } from '../components/experience';

// Lazy-loaded Workspaces for Route Code Splitting
const HomeWorkspace = lazy(() => import('../workspaces/HomeWorkspace/HomeWorkspace'));
const CareerLabWorkspace = lazy(() => import('../workspaces/CareerLabWorkspace/CareerLabWorkspace'));
const PortfolioWorkspace = lazy(() => import('../workspaces/PortfolioWorkspace/PortfolioWorkspace'));
const PublicPortfolioPage = lazy(() => import('../workspaces/PortfolioWorkspace/PublicPortfolioPage'));
const CareerIntelligenceWorkspace = lazy(() => import('../workspaces/CareerIntelligenceWorkspace/CareerIntelligenceWorkspace'));
const LearningJourneyWorkspace = lazy(() => import('../workspaces/LearningJourneyWorkspace/LearningJourneyWorkspace'));
const AnalyticsWorkspace = lazy(() => import('../workspaces/AnalyticsWorkspace/AnalyticsWorkspace'));
const AICareerArchitectWorkspace = lazy(() => import('../workspaces/AICareerArchitectWorkspace/AICareerArchitectWorkspace'));
const SettingsWorkspace = lazy(() => import('../workspaces/SettingsWorkspace/SettingsWorkspace'));
const PlatformDiagnosticsWorkspace = lazy(() => import('../workspaces/PlatformDiagnosticsWorkspace/PlatformDiagnosticsWorkspace'));
const KnowledgeGraphExplorerWorkspace = lazy(() => import('../workspaces/KnowledgeGraphExplorerWorkspace/KnowledgeGraphExplorerWorkspace'));
const EventMonitoringConsoleWorkspace = lazy(() => import('../workspaces/EventMonitoringConsoleWorkspace/EventMonitoringConsoleWorkspace'));
const AIFeatureExplorerWorkspace = lazy(() => import('../workspaces/AIFeatureExplorerWorkspace/AIFeatureExplorerWorkspace'));
const AIOperationsCenterWorkspace = lazy(() => import('../workspaces/AIOperationsCenterWorkspace/AIOperationsCenterWorkspace'));
const GitHubIntelligenceWorkspace = lazy(() => import('../workspaces/GitHubIntelligenceWorkspace/GitHubIntelligenceWorkspace'));
const LinkedInIntelligenceWorkspace = lazy(() => import('../workspaces/LinkedInIntelligenceWorkspace/LinkedInIntelligenceWorkspace'));
const PortfolioIntelligenceWorkspace = lazy(() => import('../workspaces/PortfolioIntelligenceWorkspace/PortfolioIntelligenceWorkspace'));
const CodingIntelligenceWorkspace = lazy(() => import('../workspaces/CodingIntelligenceWorkspace/CodingIntelligenceWorkspace'));
const OpenSourceIntelligenceWorkspace = lazy(() => import('../workspaces/OpenSourceIntelligenceWorkspace/OpenSourceIntelligenceWorkspace'));
const ProfessionalBrandWorkspace = lazy(() => import('../workspaces/ProfessionalBrandWorkspace/ProfessionalBrandWorkspace'));
const ProfessionalDigitalTwinWorkspace = lazy(() => import('../workspaces/ProfessionalDigitalTwinWorkspace/ProfessionalDigitalTwinWorkspace'));
const CareerPlanningAgentWorkspace = lazy(() => import('../workspaces/CareerPlanningAgentWorkspace/CareerPlanningAgentWorkspace'));
const JobSearchAgentWorkspace = lazy(() => import('../workspaces/JobSearchAgentWorkspace/JobSearchAgentWorkspace'));
const LearningAgentWorkspace = lazy(() => import('../workspaces/LearningAgentWorkspace/LearningAgentWorkspace'));
const ResumeOptimizationAgentWorkspace = lazy(() => import('../workspaces/ResumeOptimizationAgentWorkspace/ResumeOptimizationAgentWorkspace'));
const InterviewPrepAgentWorkspace = lazy(() => import('../workspaces/InterviewPrepAgentWorkspace/InterviewPrepAgentWorkspace'));
const NetworkingAgentWorkspace = lazy(() => import('../workspaces/NetworkingAgentWorkspace/NetworkingAgentWorkspace'));
const OpportunityDiscoveryWorkspace = lazy(() => import('../workspaces/OpportunityDiscoveryWorkspace/OpportunityDiscoveryWorkspace'));
const AIOrchestratorDashboard = lazy(() => import('../workspaces/AIOrchestratorDashboard/AIOrchestratorDashboard'));
const PersonalMemoryWorkspace = lazy(() => import('../workspaces/PersonalMemoryWorkspace/PersonalMemoryWorkspace'));
const CareerOSDashboard = lazy(() => import('../workspaces/CareerOSDashboard/CareerOSDashboard'));
const CareerIdentityWorkspace = lazy(() => import('../workspaces/CareerIdentityWorkspace/CareerIdentityWorkspace'));

// Feature Pages
import LoginForm from '../features/auth/components/LoginForm';
import RegisterForm from '../features/auth/components/RegisterForm';
import ResumePage from '../features/resume/components/ResumePage';
import { SkillIntelligencePage } from '../features/skills/components/SkillIntelligencePage';
import { CareerReadinessPage } from '../features/careers/components/CareerReadinessPage';

import { RecommendationPage } from '../features/recommendations/components/RecommendationPage';

// Suspense Fallback Wrapper
const WorkspaceSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <AIThinkingAnimation statusText="Loading Adaptive Workspace..." />
        </div>
      }
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
            element: <RecommendationPage />,
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
            element: <CareerReadinessPage />,
          },
          {
            path: '/skills',
            element: <SkillIntelligencePage />,
          },
          {
            path: '/resume',
            element: <ResumePage />,
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
            path: '/portfolio',
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
