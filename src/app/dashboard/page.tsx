'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole, EmployeeDesignation } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useApi } from '@/hooks/useApi';
import AdvertisementCarousel from '@/components/AdvertisementCarousel';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';
import StateManagerDashboard from '@/components/dashboard/StateManagerDashboard';
import DistrictManagerDashboard from '@/components/dashboard/DistrictManagerDashboard';
import SupervisorDashboard from '@/components/dashboard/SupervisorDashboard';
import DistributorDashboard from '@/components/dashboard/DistributorDashboard';

const mockRecentTransactions = [
  { id: '1', type: 'DEPOSIT', amount: 1000, description: 'Wallet top-up', createdAt: new Date('2024-01-15') },
  { id: '2', type: 'SCHEME_PAYMENT', amount: -250, description: '7/12 Extract Application', createdAt: new Date('2024-01-14') },
  { id: '3', type: 'DEPOSIT', amount: 500, description: 'Wallet top-up', createdAt: new Date('2024-01-13') },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const { getDashboardStats } = useApi();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    if (!session) return;

    const fetchStats = async () => {
      setLoading(true);
      const response = await getDashboardStats();
      if (response?.success) {
        setStats(response.data);
      }
      setLoading(false);
    };

    fetchStats();
  }, [getDashboardStats, session]);

  if (!session) {
    return null; // Middleware will redirect
  }

  const user = session.user;
  const designation = (user as any).designation;

  // Get display name for designation
  const getDesignationDisplay = () => {
    if (user.role === UserRole.ADMIN) return 'Administrator';
    if (designation) return designation.replace('_', ' ');
    if (user.role === UserRole.EMPLOYEE) return 'Employee';
    if (user.role === UserRole.RETAILER) return 'Retailer';
    return user.role;
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'text-green-600';
      case 'SCHEME_PAYMENT': return 'text-red-600';
      case 'REFUND': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If user has a designation, show designation-specific dashboard
  if (user.role === UserRole.EMPLOYEE && designation) {
    return (
      <DashboardLayout>
        {designation === 'MANAGER' && <ManagerDashboard stats={stats} />}
        {designation === 'STATE_MANAGER' && (
          <StateManagerDashboard stats={stats} territoryState={(user as any).territoryState || 'N/A'} />
        )}
        {designation === 'DISTRICT_MANAGER' && (
          <DistrictManagerDashboard stats={stats} territoryDistrict={(user as any).territoryDistrict || 'N/A'} />
        )}
        {designation === 'SUPERVISOR' && (
          <SupervisorDashboard stats={stats} territoryArea={(user as any).territoryArea || 'N/A'} />
        )}
        {designation === 'DISTRIBUTOR' && <DistributorDashboard stats={stats} />}
      </DashboardLayout>
    );
  }

  // Default dashboard for Admin, Retailer, Customer, and Employee without designation
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl animate-fade-in border border-red-500">
          <h1 className="text-3xl font-bold mb-3 text-white animate-slide-in-left">
            Welcome back, {user.name}! 👋
          </h1>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-semibold">
              {getDesignationDisplay()}
            </span>
            {(user as any).territory_state && (
              <span className="px-4 py-2 bg-white/20 rounded-full text-sm">
                📍 {(user as any).territory_state}
              </span>
            )}
          </div>
          <p className="text-red-100 text-md animate-slide-in-right">
            {user.role === UserRole.ADMIN && "Manage the entire system, employees, retailers, and monitor all activities."}
            {user.role === UserRole.EMPLOYEE && designation && `Oversee your team and manage ${designation.toLowerCase().replace('_', ' ')} operations.`}
            {user.role === UserRole.EMPLOYEE && !designation && "Process applications, verify documents, and assist retailers."}
            {user.role === UserRole.RETAILER && "Provide government services to customers and earn commissions."}
            {user.role === UserRole.CUSTOMER && "Apply for services and earn cashback rewards on every application!"}
          </p>
        </div>

        {/* Coming Soon Services Teaser */}
        <Link href="/dashboard/coming-soon">
          <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-none shadow-2xl hover:shadow-3xl transform hover:scale-[1.01] transition-all duration-300 cursor-pointer overflow-hidden relative group mb-6">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

            <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-4 text-center md:text-left">
                <div className="inline-block px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-bold tracking-wider mb-2 border border-white/30">
                  LAUNCHING SOON
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight">
                  New Premium Services
                </h3>
                <p className="text-indigo-100 max-w-xl text-lg">
                  Get ready for Mobile Recharge, DTH, Bill Payments, Flight Booking, and much more! Experience the future of digital services.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-4">
                  {['📱 Mobile', '⚡ Electricity', '✈️ Travel', '🏦 Banking'].map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-white/10 rounded-lg text-white/90 text-sm font-medium border border-white/10">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <span className="text-4xl">🚀</span>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
                  Click to View
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Advertisement Carousel */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]">
          <CardContent className="p-1">
            <div className="bg-white rounded-xl shadow-inner">
              <AdvertisementCarousel
                position="dashboard"
                height="h-96"
                className="rounded-xl shadow-lg"
                autoPlay={true}
                autoPlayInterval={4000}
                showControls={true}
                showIndicators={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-white to-red-50 shadow-xl hover-lift animate-scale-in border border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Wallet Balance</CardTitle>
              <span className="text-2xl animate-float">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(stats?.walletBalance || 0)}
              </div>
              <p className="text-xs text-red-500">Available for transactions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-orange-50 shadow-xl hover-lift animate-scale-in border border-orange-200" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Total Applications</CardTitle>
              <span className="text-2xl animate-float" style={{ animationDelay: '0.5s' }}>📋</span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats?.totalApplications || 0}</div>
              <p className="text-xs text-orange-500">All time applications</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-yellow-50 shadow-xl hover-lift animate-scale-in border border-yellow-200" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Pending Applications</CardTitle>
              <span className="text-2xl animate-float" style={{ animationDelay: '1s' }}>⏳</span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats?.pendingApplications || 0}</div>
              <p className="text-xs text-yellow-500">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-green-50 shadow-xl hover-lift animate-scale-in border border-green-200" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Approved Applications</CardTitle>
              <span className="text-2xl animate-float" style={{ animationDelay: '1.5s' }}>✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.approvedApplications || 0}</div>
              <p className="text-xs text-green-500">Successfully processed</p>
            </CardContent>
          </Card>

          {/* Role-specific additional stats */}
          {user.role === UserRole.RETAILER && (
            <>
              <Card className="bg-gradient-to-br from-white to-blue-50 shadow-xl hover-lift animate-scale-in border border-blue-200" style={{ animationDelay: '0.4s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Service Receipts</CardTitle>
                  <span className="text-2xl animate-float" style={{ animationDelay: '2s' }}>📄</span>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats?.totalReceipts || 0}</div>
                  <p className="text-xs text-blue-500">Downloaded receipts</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-purple-50 shadow-xl hover-lift animate-scale-in border border-purple-200" style={{ animationDelay: '0.5s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Pending Wallet Requests</CardTitle>
                  <span className="text-2xl animate-float" style={{ animationDelay: '2.5s' }}>💳</span>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats?.pendingWalletRequests || 0}</div>
                  <p className="text-xs text-purple-500">Awaiting approval</p>
                </CardContent>
              </Card>
            </>
          )}

          {user.role === UserRole.EMPLOYEE && (
            <>
              <Card className="bg-gradient-to-br from-white to-blue-50 shadow-xl hover-lift animate-scale-in border border-blue-200" style={{ animationDelay: '0.4s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Processed Today</CardTitle>
                  <span className="text-2xl animate-float" style={{ animationDelay: '2s' }}>⚡</span>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats?.processedToday || 0}</div>
                  <p className="text-xs text-blue-500">Applications processed</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-purple-50 shadow-xl hover-lift animate-scale-in border border-purple-200" style={{ animationDelay: '0.5s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Wallet Approvals</CardTitle>
                  <span className="text-2xl animate-float" style={{ animationDelay: '2.5s' }}>💳</span>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats?.pendingWalletRequests || 0}</div>
                  <p className="text-xs text-purple-500">Need approval</p>
                </CardContent>
              </Card>
            </>
          )}

          {user.role === UserRole.ADMIN && (
            <>
              <Card className="bg-gradient-to-br from-white to-blue-50 shadow-xl hover-lift animate-scale-in border border-blue-200" style={{ animationDelay: '0.4s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">System Health</CardTitle>
                  <span className="text-2xl animate-float" style={{ animationDelay: '2s' }}>🔧</span>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">100%</div>
                  <p className="text-xs text-blue-500">System uptime</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-purple-50 shadow-xl hover-lift animate-scale-in border border-purple-200" style={{ animationDelay: '0.5s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Pending Approvals</CardTitle>
                  <span className="text-2xl animate-float" style={{ animationDelay: '2.5s' }}>⏰</span>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{(stats?.pendingWalletRequests || 0) + (stats?.pendingTransactions || 0)}</div>
                  <p className="text-xs text-purple-500">Wallet & Transactions</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>



        {/* Advertisement Section */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Featured Services</CardTitle>
            <CardDescription className="text-gray-600">Discover our popular government services</CardDescription>
          </CardHeader>
          <CardContent>
            <AdvertisementCarousel
              position="dashboard"
              height="h-64"
              className="rounded-lg"
              autoPlay={true}
              autoPlayInterval={4000}
              showControls={true}
              showIndicators={true}
            />
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Transactions</CardTitle>
            <CardDescription className="text-gray-600">Your latest wallet activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(stats?.recentTransactions || mockRecentTransactions).map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(transaction.created_at || transaction.createdAt)}
                      {transaction.reference && ` • Ref: ${transaction.reference}`}
                    </p>
                  </div>
                  <div className={`font-bold ${getTransactionColor(transaction.type)}`}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                  </div>
                </div>
              ))}
              <div className="text-center pt-2">
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  View All Transactions →
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div >
    </DashboardLayout >
  );
}
