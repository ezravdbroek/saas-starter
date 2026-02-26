import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Inzichten in je recruitment prestaties
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="p-4 bg-gray-100 rounded-full mb-4">
          <BarChart3 className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-base font-medium text-gray-900">Nog geen data</p>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Analytics worden beschikbaar zodra je vacatures en kandidaten hebt
        </p>
      </div>
    </div>
  );
}
