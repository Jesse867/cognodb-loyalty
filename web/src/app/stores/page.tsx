'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Store, MapPin, ShoppingBag, Users, TrendingUp } from 'lucide-react';

export default function StoresPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.stores.list();
        setStores(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load stores');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <p className="text-red-700 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Stores</h1>
        <p className="text-slate-500 mt-1">Performance across all locations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-3" />
                <div className="h-4 w-48 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-12 bg-slate-200 rounded animate-pulse" />
                  <div className="h-12 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            ))
          : stores.map((store) => (
              <div
                key={store.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Store className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900">{store.name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {store.location}
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" /> Orders
                    </p>
                    <p className="text-lg font-bold text-slate-900">{store.purchaseCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Revenue
                    </p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(store.totalRevenue)}</p>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
