export function getAppBasePath(): string {
  if (typeof window === 'undefined') return '';
  const p = window.location.pathname;
  if (p === '/cpo' || p.startsWith('/cpo/')) return '/cpo';
  if (p === '/admin' || p.startsWith('/admin/')) return '/admin';
  return '';
}

export function withBasePath(path: string): string {
  const base = getAppBasePath();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

export function getApiBasePath(): string {
  const base = getAppBasePath();
  return base ? `${base}/api/v1` : '/api/v1';
}

export function getCmsApiBasePath(): string {
  const base = getAppBasePath();
  return base ? `${base}/api/cms` : '/api/cms';
}
