const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchJson(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  customers: {
    list: (params?: { tier?: string; search?: string }) => {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return fetchJson(`/customers${qs}`);
    },
    get: (id: string) => fetchJson(`/customers/${id}`),
    network: (id: string, depth?: number) =>
      fetchJson(`/customers/${id}/network?depth=${depth || 2}`),
    purchases: (id: string) => fetchJson(`/customers/${id}/purchases`),
    create: (data: { name: string; email: string; referredBy?: string; tier?: string }) =>
      fetchJson('/customers', { method: 'POST', body: JSON.stringify(data) }),
  },
  purchases: {
    list: (params?: { customerId?: string; storeId?: string }) => {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return fetchJson(`/purchases${qs}`);
    },
    create: (data: { customerId: string; amount: number; storeId?: string; items?: string[] }) =>
      fetchJson('/purchases', { method: 'POST', body: JSON.stringify(data) }),
  },
  referrals: {
    leaderboard: (limit?: number) => fetchJson(`/referrals/leaderboard?limit=${limit || 10}`),
    longestChain: () => fetchJson('/referrals/longest-chain'),
    vipNetwork: (depth?: number) => fetchJson(`/referrals/vip-network?depth=${depth || 2}`),
    treeRevenue: (id: string) => fetchJson(`/referrals/${id}/tree-revenue`),
    graphData: (id: string, depth?: number) =>
      fetchJson(`/referrals/${id}/graph?depth=${depth || 3}`),
  },
  stores: {
    list: () => fetchJson('/stores'),
    get: (id: string) => fetchJson(`/stores/${id}`),
    analytics: (id: string) => fetchJson(`/stores/${id}/analytics`),
    create: (data: { name: string; location: string }) =>
      fetchJson('/stores', { method: 'POST', body: JSON.stringify(data) }),
  },
};
