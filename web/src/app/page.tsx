'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { CustomerTable } from '@/components/CustomerTable';
import { Users, Trophy, TrendingUp, GitBranch, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    vips: 0,
    totalRevenue: 0,
    longestChain: 0,
  });
  const [topReferrers, setTopReferrers] = useState<any[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [customers, leaderboard, longest] = await Promise.all([
          api.customers.list(),
          api.referrals.leaderboard(5),
          api.referrals.longestChain(),
        ]);

        const vips = customers.filter((c: any) => c.tier === 'VIP').length;

        setStats({
          totalCustomers: customers.length,
          vips,
          totalRevenue: leaderboard.reduce((sum: number, r: any) => sum + (r.generatedRevenue || 0), 0),
          longestChain: longest?.chainLength || 0,
        });

        setTopReferrers(leaderboard);
        setRecentCustomers(customers.slice(0, 5));
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
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
          className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your loyalty and referral network</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          subtitle="Across all tiers"
          icon={Users}
          iconColor="text-blue-600"
          loading={loading}
        />
        <StatCard
          title="VIP Members"
          value={stats.vips}
          subtitle="Top tier customers"
          icon={Trophy}
          iconColor="text-purple-600"
          loading={loading}
        />
        <StatCard
          title="Referral Revenue"
          value={`$${(stats.totalRevenue / 1000).toFixed(1)}k`}
          subtitle="Transitive tree value"
          icon={TrendingUp}
          iconColor="text-emerald-600"
          loading={loading}
        />
        <StatCard
          title="Longest Chain"
          value={stats.longestChain}
          subtitle="Referral hops deep"
          icon={GitBranch}
          iconColor="text-orange-600"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Customers</h2>
            <Link
              href="/customers"
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <CustomerTable customers={recentCustomers} loading={loading} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Referrers</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
                ))}
              </div>
            ) : !topReferrers.length ? (
              <div className="p-8 text-center text-slate-500">
                No referral data yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {topReferrers.map((ref, idx) => (
                  <div key={ref.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{ref.name}</p>
                      <p className="text-xs text-slate-500">{ref.referrals} referrals</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">
                      ${ref.generatedRevenue?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
