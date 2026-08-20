export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function tierColor(tier: string): string {
  switch (tier) {
    case 'Bronze': return 'bg-bronze text-white';
    case 'Silver': return 'bg-silver text-gray-900';
    case 'Gold': return 'bg-gold text-gray-900';
    case 'VIP': return 'bg-vip text-white';
    default: return 'bg-gray-200 text-gray-700';
  }
}

export function tierBadge(tier: string): string {
  switch (tier) {
    case 'Bronze': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Silver': return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'Gold': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'VIP': return 'bg-purple-100 text-purple-800 border-purple-300';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}
