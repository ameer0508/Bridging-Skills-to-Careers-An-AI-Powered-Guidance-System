/**
 * Routes already redesigned in Aurora Elite (light). Every other route still renders its earlier
 * dark design, inside one isolated dark container (`.sb-legacy-dark`), until its screen group is
 * migrated; the list grows group by group and the container disappears once it covers every route.
 */
export const AURORA_ROUTES: readonly string[] = ['/home', '/resume', '/careers', '/readiness', '/career-lab', '/roadmap', '/portfolio'];

export const isAuroraRoute = (pathname: string): boolean =>
  AURORA_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
