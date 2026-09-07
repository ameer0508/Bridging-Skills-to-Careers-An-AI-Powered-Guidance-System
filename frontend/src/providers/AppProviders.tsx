import React from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '../theme/ThemeContext';
import { ExperienceProvider } from '../contexts/ExperienceProvider';
import router from '../routes';
import ErrorBoundary from '../components/ErrorBoundary';

const queryClient = new QueryClient();

export const AppProviders: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ExperienceProvider>
            <RouterProvider router={router} future={{ v7_startTransition: true }} />
          </ExperienceProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default AppProviders;

