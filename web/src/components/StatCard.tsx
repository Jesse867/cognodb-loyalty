import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  loading?: boolean;
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColor = 'text-indigo-600', loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 bg-slate-200 rounded animate-pulse" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          )}
          {subtitle && !loading && (
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-slate-50 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
