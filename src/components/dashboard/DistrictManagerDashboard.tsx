'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface DistrictManagerDashboardProps {
  stats: any;
  territoryDistrict: string;
}

export default function DistrictManagerDashboard({ stats, territoryDistrict }: DistrictManagerDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold mb-2">District Manager Dashboard</h2>
        <p className="text-indigo-100">Overseeing {territoryDistrict} district operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-indigo-50 shadow-xl border border-indigo-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Supervisors</CardTitle>
            <span className="text-2xl">👨‍💼</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{stats?.totalSupervisors || 0}</div>
            <p className="text-xs text-indigo-500">Active supervisors</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-purple-50 shadow-xl border border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Distributors</CardTitle>
            <span className="text-2xl">🏢</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats?.totalDistributors || 0}</div>
            <p className="text-xs text-purple-500">Active distributors</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-green-50 shadow-xl border border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">District Revenue</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(stats?.districtRevenue || 0)}</div>
            <p className="text-xs text-green-500">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-orange-50 shadow-xl border border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Performance</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats?.performanceScore || 0}%</div>
            <p className="text-xs text-orange-500">Target achievement</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Supervisor Performance</CardTitle>
            <CardDescription>Top performing supervisors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.topSupervisors || []).map((supervisor: any, index: number) => (
                <div key={supervisor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{supervisor.name}</p>
                      <p className="text-xs text-gray-500">{supervisor.area}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">{formatCurrency(supervisor.revenue)}</p>
                    <p className="text-xs text-gray-500">{supervisor.applications} apps</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distributor Performance</CardTitle>
            <CardDescription>Active distributors in district</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.distributorPerformance || []).map((distributor: any) => (
                <div key={distributor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{distributor.name}</p>
                    <p className="text-xs text-gray-500">{distributor.employees} employees</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">{formatCurrency(distributor.sales)}</p>
                    <p className="text-xs text-gray-500">Product sales</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
