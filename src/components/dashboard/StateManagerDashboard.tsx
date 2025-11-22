'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface StateManagerDashboardProps {
  stats: any;
  territoryState: string;
}

export default function StateManagerDashboard({ stats, territoryState }: StateManagerDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold mb-2">State Manager Dashboard</h2>
        <p className="text-blue-100">Managing operations in {territoryState}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-blue-50 shadow-xl border border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">District Managers</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.totalDistrictManagers || 0}</div>
            <p className="text-xs text-blue-500">In your state</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-green-50 shadow-xl border border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">State Revenue</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(stats?.stateRevenue || 0)}</div>
            <p className="text-xs text-green-500">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-purple-50 shadow-xl border border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Active Districts</CardTitle>
            <span className="text-2xl">🏛️</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats?.activeDistricts || 0}</div>
            <p className="text-xs text-purple-500">Districts covered</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-orange-50 shadow-xl border border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Services Provided</CardTitle>
            <span className="text-2xl">📋</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats?.totalServices || 0}</div>
            <p className="text-xs text-orange-500">Active services</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>District-wise Performance</CardTitle>
          <CardDescription>Business breakdown by district in {territoryState}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(stats?.districtPerformance || []).map((district: any) => (
              <div key={district.district} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{district.district}</p>
                  <p className="text-sm text-gray-500">{district.applications} applications</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{formatCurrency(district.revenue)}</p>
                  <p className="text-xs text-gray-500">{district.supervisors} supervisors</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
