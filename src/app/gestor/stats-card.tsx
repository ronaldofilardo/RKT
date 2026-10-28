'use client';

interface StatsCardProps {
  label: string;
  value: number | string;
}

export function StatsCard({ label, value }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow border p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
