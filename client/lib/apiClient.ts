// client/lib/apiClient.ts
export function authHeaders(extra: HeadersInit = {}): HeadersInit {
  if (typeof window === 'undefined') return extra;
  
  const token = localStorage.getItem('accessToken');
  const activeTenantId = localStorage.getItem('activeTenantId');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  if (activeTenantId) {
    headers['x-tenant-id'] = activeTenantId;
  }

  return headers;
}