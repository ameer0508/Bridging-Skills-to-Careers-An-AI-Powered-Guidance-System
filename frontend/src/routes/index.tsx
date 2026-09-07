/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';
import { GuestRoute, ProtectedRoute } from '../components/RouteGuards';
import { AppShell } from '../layouts/AppShell';
import { AuthLayout } from '../layouts/AuthLayout';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { AIThinkingAnimation } from '../components/experience';

// Lazy-loaded Workspaces for Route Code Splitting
const HomeWorkspace = lazy(() => import('../workspaces/HomeWorkspace/HomeWorkspace'));
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

// Root redirect handler based on authentication status
const RootRedirect: React.FC = () => {
  return <LandingPage />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
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
                <SettingsWorkspace />
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
                <PlatformDiagnosticsWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/graph',
            element: (
              <WorkspaceSuspense>
                <KnowledgeGraphExplorerWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/events',
            element: (
              <WorkspaceSuspense>
                <EventMonitoringConsoleWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/features',
            element: (
              <WorkspaceSuspense>
                <AIFeatureExplorerWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/ops',
            element: (
              <WorkspaceSuspense>
                <AIOperationsCenterWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/github',
            element: (
              <WorkspaceSuspense>
                <GitHubIntelligenceWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/linkedin',
            element: (
              <WorkspaceSuspense>
                <LinkedInIntelligenceWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/portfolio',
            element: (
              <WorkspaceSuspense>
                <PortfolioIntelligenceWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/coding',
            element: (
              <WorkspaceSuspense>
                <CodingIntelligenceWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/opensource',
            element: (
              <WorkspaceSuspense>
                <OpenSourceIntelligenceWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/brand',
            element: (
              <WorkspaceSuspense>
                <ProfessionalBrandWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/digital-twin',
            element: (
              <WorkspaceSuspense>
                <ProfessionalDigitalTwinWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/agent',
            element: (
              <WorkspaceSuspense>
                <CareerPlanningAgentWorkspace />
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
                <NetworkingAgentWorkspace />
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
                <PersonalMemoryWorkspace />
              </WorkspaceSuspense>
            ),
          },
          {
            path: '/career-os',
            element: (
              <WorkspaceSuspense>
                <CareerOSDashboard />
              </WorkspaceSuspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

export default router;
