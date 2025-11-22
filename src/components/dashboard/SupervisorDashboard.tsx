'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface SupervisorDashboardProps {
  stats: any;
  territoryArea: string;
}

export default function SupervisorDashboard({ stats, territoryArea }: SupervisorDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold mb-2">Supervisor Dashboard</h2>
        <p className="text-teal-100">Managing {territoryArea} area operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-teal-50 shadow-xl border border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-800">Employees</CardTitle>
            <span className="text-2xl">👨‍💼</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-600">{stats?.totalEmployees || 0}</div>
            <p className="text-xs text-teal-500">Under supervision</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-blue-50 shadow-xl border border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Retailers</CardTitle>
            <span className="text-2xl">🏪</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.totalRetailers || 0}</div>
            <p className="text-xs text-blue-500">Active retailers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-green-50 shadow-xl border border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Area Revenue</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(stats?.areaRevenue || 0)}</div>
            <p className="text-xs text-green-500">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-orange-50 shadow-xl border border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Deliveries</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats?.pendingDeliveries || 0}</div>
            <p className="text-xs text-orange-500">Pending deliveries</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Employee Performance</CardTitle>
            <CardDescription>Your team's performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.employeePerformance || []).map((employee: any) => (
                <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-xs text-gray-500">
                      {employee.compensationType === 'COMMISSION_BASED' ? '💰 Commission' : '💵 Fixed Salary'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-teal-600">{employee.applications}</p>
                    <p className="text-xs text-gray-500">Applications</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retailer Connections</CardTitle>
            <CardDescription>Recently connected retailers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.recentRetailers || []).map((retailer: any) => (
                <div key={retailer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{retailer.name}</p>
                    <p className="text-xs text-gray-500">Connected by: {retailer.connectedBy}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{retailer.applications}</p>
                    <p className="text-xs text-gray-500">Applications</p>
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
