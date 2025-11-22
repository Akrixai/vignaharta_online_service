'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface ManagerDashboardProps {
  stats: any;
}

export default function ManagerDashboard({ stats }: ManagerDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold mb-2">Manager Dashboard</h2>
        <p className="text-purple-100">Oversee all state managers and company operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-purple-50 shadow-xl border border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">State Managers</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats?.totalStateManagers || 0}</div>
            <p className="text-xs text-purple-500">Active state managers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-blue-50 shadow-xl border border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Revenue</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-blue-500">All-time revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-green-50 shadow-xl border border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Active States</CardTitle>
            <span className="text-2xl">🗺️</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.activeStates || 0}</div>
            <p className="text-xs text-green-500">States with operations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-orange-50 shadow-xl border border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Monthly Growth</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats?.monthlyGrowth || 0}%</div>
            <p className="text-xs text-orange-500">Compared to last month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>State-wise Business Performance</CardTitle>
          <CardDescription>Revenue breakdown by state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(stats?.statePerformance || []).map((state: any) => (
              <div key={state.state} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{state.state}</p>
                  <p className="text-sm text-gray-500">{state.applications} applications</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-600">{formatCurrency(state.revenue)}</p>
                  <p className="text-xs text-gray-500">{state.growth}% growth</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
