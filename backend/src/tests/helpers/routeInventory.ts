import app from '../../app.js';

/**
 * Every route the Express app serves, read from its router stack, so security checks cover new
 * routes automatically instead of a hand-kept list.
 */
export interface RouteInfo {
  method: string;
  path: string;
}

type Layer = {
  route?: { path: string | string[]; methods: Record<string, boolean> };
  name?: string;
  regexp?: RegExp;
  handle?: { stack?: Layer[] };
};

/** '/api/v1/exams' from the regular expression Express 4 compiles for a mount path. */
function mountPath(layer: Layer): string {
  const source = layer.regexp?.source ?? '';
  if (source === '^\\/?(?=\\/|$)' || source === '^\\/?$') return '';
  return source
    .replace(/^\^/, '')
    .replace(/\\\/\?\(\?=\\\/\|\$\)$/i, '')
    .replace(/\\\//g, '/');
}

export function listRoutes(): RouteInfo[] {
  const routes: RouteInfo[] = [];
  const walk = (stack: Layer[], prefix: string) => {
    for (const layer of stack) {
      if (layer.route) {
        const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
        for (const p of paths) {
          for (const method of Object.keys(layer.route.methods)) {
            if (method !== '_all') routes.push({ method: method.toUpperCase(), path: prefix + p });
          }
        }
      } else if (layer.name === 'router' && layer.handle?.stack) {
        walk(layer.handle.stack, prefix + mountPath(layer));
      }
    }
  };
  walk((app as unknown as { _router: { stack: Layer[] } })._router.stack, '');
  return routes;
}

/** The route path with every :param replaced. */
export const fillParams = (path: string, value: string): string => path.replace(/:[A-Za-z_]+\??/g, encodeURIComponent(value));
