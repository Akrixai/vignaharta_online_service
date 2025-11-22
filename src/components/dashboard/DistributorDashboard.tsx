'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface DistributorDashboardProps {
  stats: any;
}

export default function DistributorDashboard({ stats }: DistributorDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold mb-2">Distributor Dashboard</h2>
        <p className="text-amber-100">Commission-based product distribution</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-amber-50 shadow-xl border border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">My Employees</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats?.totalEmployees || 0}</div>
            <p className="text-xs text-amber-500">Registered employees</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-green-50 shadow-xl border border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Product Sales</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(stats?.totalSales || 0)}</div>
            <p className="text-xs text-green-500">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-purple-50 shadow-xl border border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Commission Earned</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{formatCurrency(stats?.commissionEarned || 0)}</div>
            <p className="text-xs text-purple-500">Total earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-blue-50 shadow-xl border border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Pending Orders</CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.pendingOrders || 0}</div>
            <p className="text-xs text-blue-500">To be fulfilled</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> As a distributor, you have access to Product Purchase and Sale features only. 
              Application Forms and Free Services are not available for your account type.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Team Performance</CardTitle>
            <CardDescription>Employee sales performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.employeePerformance || []).map((employee: any) => (
                <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-xs text-gray-500">Commission-based</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600">{formatCurrency(employee.sales)}</p>
                    <p className="text-xs text-gray-500">{employee.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Product Sales</CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.recentSales || []).map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{sale.product}</p>
                    <p className="text-xs text-gray-500">{sale.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(sale.amount)}</p>
                    <p className="text-xs text-purple-500">+{formatCurrency(sale.commission)} commission</p>
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
