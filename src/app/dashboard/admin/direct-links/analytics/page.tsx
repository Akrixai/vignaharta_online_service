'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';
import DashboardLayout from '@/components/dashboard/layout';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Eye,
  Calendar,
  Download,
  Filter
} from 'lucide-react';

interface AccessLog {
  id: string;
  service_id: string;
  user_id: string;
  amount_paid: number;
  commission_earned: number;
  cashback_earned: number;
  status: string;
  accessed_at: string;
  service: {
    name: string;
    category: string;
  };
  user: {
    name: string;
    email: string;
    role: string;
  };
}

interface Analytics {
  totalRevenue: number;
  totalAccess: number;
  popularServices: Array<{
    service_name: string;
    access_count: number;
    revenue: number;
  }>;
  recentActivity: AccessLog[];
}

export default function DirectLinksAnalytics() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7'); // days
  const [selectedService, setSelectedService] = useState('');

  // Check authorization
  if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  useEffect(() => {
    fetchAnalytics();
    fetchAccessLogs();
  }, [dateRange, selectedService]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('days', dateRange);
      if (selectedService) params.append('service_id', selectedService);

      const response = await fetch(`/api/admin/direct-links/analytics?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessLogs = async () => {
    try {
      const params = new URLSearchParams();
      params.append('days', dateRange);
      if (selectedService) params.append('service_id', selectedService);
      params.append('limit', '50');

      const response = await fetch(`/api/admin/direct-links/access-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setAccessLogs(data.data);
      }
    } catch (error) {
      console.error('Error fetching access logs:', error);
    }
  };

  const exportData = async () => {
    try {
      const params = new URLSearchParams();
      params.append('days', dateRange);
      if (selectedService) params.append('service_id', selectedService);
      params.append('format', 'csv');

      const response = await fetch(`/api/admin/direct-links/export?${params}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `direct-links-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Direct Links Analytics</h1>
              <p className="text-gray-600">Monitor service usage and revenue</p>
            </div>
            <button
              onClick={exportData}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">Last 24 Hours</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>

            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Services</option>
              {/* Services will be populated from API */}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{analytics?.totalRevenue?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Access</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.totalAccess || 0}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Services</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.popularServices?.length || 0}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Services */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Popular Services
                </h3>
                <div className="space-y-4">
                  {analytics?.popularServices?.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{service.service_name}</p>
                        <p className="text-sm text-gray-600">{service.access_count} accesses</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{service.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No data available</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recent Activity
                </h3>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {analytics?.recentActivity?.map((log) => (
                    <div key={log.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div>
                        <p className="font-medium text-gray-900">{log.service.name}</p>
                        <p className="text-sm text-gray-600">{log.user.name} • {log.user.role}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.accessed_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{log.amount_paid}</p>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          log.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>

            {/* Access Logs Table */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Access Logs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accessLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.service?.name || 'Unknown Service'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.service?.category}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.user?.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.user?.role}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{log.amount_paid}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            log.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-800' 
                              : log.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.accessed_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}