'use client';

import Link from 'next/link';
import { tierBadge, formatCurrency } from '@/lib/utils';
import { ChevronRight, User } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  tier: string;
  points: number;
  joinDate: string;
}

interface CustomerTableProps {
  customers: Customer[];
  loading?: boolean;
}

export function CustomerTable({ customers, loading }: CustomerTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-48 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!customers.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-slate-900">No customers found</h3>
        <p className="text-slate-500 mt-1">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left font-medium text-slate-500 px-4 py-3">Customer</th>
              <th className="text-left font-medium text-slate-500 px-4 py-3">Tier</th>
              <th className="text-left font-medium text-slate-500 px-4 py-3">Points</th>
              <th className="text-left font-medium text-slate-500 px-4 py-3">Joined</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-700 font-semibold text-sm">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{customer.name}</p>
                      <p className="text-slate-500 text-xs">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${tierBadge(customer.tier)}`}>
                    {customer.tier}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700 font-medium">
                  {customer.points?.toLocaleString() || 0}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(customer.joinDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
