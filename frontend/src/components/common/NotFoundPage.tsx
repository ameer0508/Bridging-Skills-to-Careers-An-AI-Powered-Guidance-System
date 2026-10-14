import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

/** Shown for any URL that does not match a route. */
export const NotFoundPage: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <main className="min-h-screen flex items-center justify-center bg-aurora-canvas px-4" data-testid="not-found-page">
      <div className="max-w-md w-full text-center space-y-5 rounded-3xl border border-aurora-line bg-aurora-canvas/60 p-10">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-aurora-canvas border border-aurora-line flex items-center justify-center text-aurora-violet">
          <Compass className="w-6 h-6" aria-hidden="true" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-aurora-muted">Error 404</p>
        <h1 className="font-display text-2xl font-extrabold text-aurora-ink">Page not found</h1>
        <p className="text-sm text-aurora-muted break-words">
          There is no page at <code className="text-aurora-violet">{location.pathname}</code>. The link may be out of date, or the
          address may have been mistyped.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to={isAuthenticated ? '/home' : '/'}
            className="py-2.5 px-5 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-white text-sm font-bold"
          >
            {isAuthenticated ? 'Go to your home page' : 'Go to the start page'}
          </Link>
          {!isAuthenticated && (
            <Link to="/login" className="py-2.5 px-5 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-ink text-sm font-bold">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </main>
  );
};

export default NotFoundPage;
