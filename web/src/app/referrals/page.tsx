'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, tierBadge } from '@/lib/utils';
import { Trophy, GitBranch, Crown, ArrowRight, Medal } from 'lucide-react';

export default function ReferralsPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [longestChain, setLongestChain] = useState<any>(null);
  const [vipNetwork, setVipNetwork] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [lb, chain, vip] = await Promise.all([
          api.referrals.leaderboard(10),
          api.referrals.longestChain(),
          api.referrals.vipNetwork(2),
        ]);
        setLeaderboard(lb);
        setLongestChain(chain);
        setVipNetwork(vip);
      } catch (err: any) {
        setError(err.message || 'Failed to load referral data');
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Referral Analytics</h1>
        <p className="text-slate-500 mt-1">Insights powered by graph traversals</p>
      </div>

      {/* Longest Chain */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Longest Referral Chain</h2>
        </div>
        {loading ? (
          <div className="h-16 bg-slate-700 rounded animate-pulse" />
        ) : !longestChain ? (
          <p className="text-slate-400">No referral chains found yet.</p>
        ) : (
          <div>
            <p className="text-3xl font-bold text-emerald-400">{longestChain.chainLength} hops</p>
            <p className="text-slate-300 mt-1">
              Started by <span className="font-semibold text-white">{longestChain.rootName}</span>
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {longestChain.chain?.map((node: any, i: number) => (
                <span key={node.id} className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-slate-700/50 rounded-lg text-sm font-medium">
                    {node.name}
                  </span>
                  {i < longestChain.chain.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  )}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              This query uses variable-length path matching — trivial in Cypher, a recursive CTE nightmare in SQL.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Referral ROI Leaderboard
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 bg-slate-200 rounded animate-pulse" />
                ))}
              </div>
            ) : !leaderboard.length ? (
              <div className="p-8 text-center text-slate-500">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No referral data yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {leaderboard.map((ref, idx) => (
                  <div key={ref.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      {idx === 0 ? (
                        <Medal className="w-6 h-6 text-amber-500" />
                      ) : idx === 1 ? (
                        <Medal className="w-6 h-6 text-slate-400" />
                      ) : idx === 2 ? (
                        <Medal className="w-6 h-6 text-orange-600" />
                      ) : (
                        <span className="text-slate-400">{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm">{ref.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${tierBadge(ref.tier)}`}>
                          {ref.tier}
                        </span>
                        <span className="text-xs text-slate-500">{ref.referrals} referrals</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">{formatCurrency(ref.generatedRevenue)}</p>
                      <p className="text-xs text-slate-400">{ref.purchaseCount} purchases</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* VIP Network */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-500" /> VIP Network Reach
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
                ))}
              </div>
            ) : !vipNetwork.length ? (
              <div className="p-8 text-center text-slate-500">
                <Crown className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No VIP network data</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {vipNetwork.map((person: any) => (
                  <div key={person.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Crown className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm">{person.name}</p>
                      <p className="text-xs text-slate-500">{person.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${tierBadge(person.tier)}`}>
                        {person.tier}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">via {person.vipName}</p>
                    </div>
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
