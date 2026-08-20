'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ReferralGraph } from '@/components/ReferralGraph';
import { tierBadge, formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, User, Mail, Calendar, Award, ShoppingBag, Users, TrendingUp, GitBranch } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [network, setNetwork] = useState<any[]>([]);
  const [treeRevenue, setTreeRevenue] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [cust, pur, net, tree, graph] = await Promise.all([
          api.customers.get(id),
          api.customers.purchases(id),
          api.customers.network(id, 3),
          api.referrals.treeRevenue(id),
          api.referrals.graphData(id, 3),
        ]);
        setCustomer(cust);
        setPurchases(pur);
        setNetwork(net);
        setTreeRevenue(tree);
        setGraphData(graph);
      } catch (err: any) {
        setError(err.message || 'Failed to load customer');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-40 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-40 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <p className="text-red-700 font-medium">{error || 'Customer not found'}</p>
        <Link
          href="/customers"
          className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back to customers
      </Link>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-700 font-bold text-xl">
                {customer.name.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <Mail className="w-3.5 h-3.5" /> {customer.email}
                </span>
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <Calendar className="w-3.5 h-3.5" /> {formatDate(customer.joinDate)}
                </span>
              </div>
            </div>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${tierBadge(customer.tier)}`}>
            {customer.tier}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Points</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{customer.points?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Spent</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(customer.totalSpent || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Referrals</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{customer.referralCount || 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Referred By</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {customer.referredByName || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Tree Revenue Card */}
      {treeRevenue && treeRevenue.treeSize > 1 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Transitive Referral Value</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            This is why we use a graph database. The entire downstream value of {customer.name}'s referral tree — 
            something that requires recursive CTEs in SQL — is computed in a single Cypher query.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <p className="text-xs text-slate-500">Tree Size</p>
              <p className="text-2xl font-bold text-indigo-700">{treeRevenue.treeSize}</p>
              <p className="text-xs text-slate-400">customers</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <p className="text-xs text-slate-500">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(treeRevenue.totalRevenue)}</p>
              <p className="text-xs text-slate-400">transitive spend</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <p className="text-xs text-slate-500">Purchases</p>
              <p className="text-2xl font-bold text-slate-900">{treeRevenue.totalPurchases}</p>
              <p className="text-xs text-slate-400">orders</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referral Graph */}
        <div className="lg:col-span-2">
          <ReferralGraph data={graphData || { nodes: [], links: [] }} />
        </div>

        {/* Purchase History */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> Purchase History
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {!purchases.length ? (
              <div className="p-8 text-center text-slate-500">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No purchases yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {purchases.map((p: any) => (
                  <div key={p.id} className="px-4 py-3 hover:bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{formatCurrency(p.amount)}</span>
                      <span className="text-xs text-slate-400">{formatDate(p.date)}</span>
                    </div>
                    {p.storeName && (
                      <p className="text-xs text-slate-500 mt-0.5">{p.storeName}</p>
                    )}
                    {p.items && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {JSON.parse(p.items || '[]').join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Network Table */}
      {network.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" /> Referral Network
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left font-medium text-slate-500 px-4 py-3">Name</th>
                    <th className="text-left font-medium text-slate-500 px-4 py-3">Tier</th>
                    <th className="text-left font-medium text-slate-500 px-4 py-3">Depth</th>
                    <th className="text-left font-medium text-slate-500 px-4 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {network.map((n: any) => (
                    <tr key={n.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{n.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${tierBadge(n.tier)}`}>
                          {n.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <GitBranch className="w-3 h-3" /> {n.depth} hop{n.depth > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(n.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
