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
import RetailerGamification from '@/components/dashboard/RetailerGamification';

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

        {/* Recharge & Bill Payment Services - For Retailers and Customers */}
        {(user.role === UserRole.RETAILER || user.role === UserRole.CUSTOMER) && (
          <div className="my-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">💳 Recharge & Bill Payments</h2>
              <p className="text-gray-600">Quick access to all recharge and bill payment services</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Mobile Prepaid */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-blue-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📱</div>
                  <h3 className="text-white font-bold text-sm mb-1">Mobile</h3>
                  <p className="text-blue-100 text-xs">Prepaid & Postpaid</p>
                </div>
              </Link>

              {/* DTH Recharge */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-purple-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📺</div>
                  <h3 className="text-white font-bold text-sm mb-1">DTH</h3>
                  <p className="text-purple-100 text-xs">TV Recharge</p>
                </div>
              </Link>

              {/* Electricity Bill */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-yellow-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">⚡</div>
                  <h3 className="text-white font-bold text-sm mb-1">Electricity</h3>
                  <p className="text-yellow-100 text-xs">Pay Bill</p>
                </div>
              </Link>

              {/* Gas Bill - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-orange-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🔥</div>
                  <h3 className="text-white font-bold text-sm mb-1">Gas</h3>
                  <p className="text-orange-100 text-xs">Pay Bill</p>
                </div>
              </Link>

              {/* Water Bill - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-cyan-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">💧</div>
                  <h3 className="text-white font-bold text-sm mb-1">Water</h3>
                  <p className="text-cyan-100 text-xs">Pay Bill</p>
                </div>
              </Link>

              {/* Broadband - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-indigo-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🌐</div>
                  <h3 className="text-white font-bold text-sm mb-1">Broadband</h3>
                  <p className="text-indigo-100 text-xs">Pay Bill</p>
                </div>
              </Link>

              {/* Landline - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-green-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">☎️</div>
                  <h3 className="text-white font-bold text-sm mb-1">Landline</h3>
                  <p className="text-green-100 text-xs">Pay Bill</p>
                </div>
              </Link>

              {/* Fastag - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-red-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🚗</div>
                  <h3 className="text-white font-bold text-sm mb-1">FASTag</h3>
                  <p className="text-red-100 text-xs">Recharge</p>
                </div>
              </Link>

              {/* Insurance - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-pink-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🛡️</div>
                  <h3 className="text-white font-bold text-sm mb-1">Insurance</h3>
                  <p className="text-pink-100 text-xs">Pay Premium</p>
                </div>
              </Link>

              {/* LPG Gas - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-amber-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🔴</div>
                  <h3 className="text-white font-bold text-sm mb-1">LPG Gas</h3>
                  <p className="text-amber-100 text-xs">Book Cylinder</p>
                </div>
              </Link>

              {/* Cable TV - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-violet-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📡</div>
                  <h3 className="text-white font-bold text-sm mb-1">Cable TV</h3>
                  <p className="text-violet-100 text-xs">Pay Bill</p>
                </div>
              </Link>

              {/* Credit Card - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-teal-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">💳</div>
                  <h3 className="text-white font-bold text-sm mb-1">Credit Card</h3>
                  <p className="text-teal-100 text-xs">Pay Bill</p>
                </div>
              </Link>

              {/* Money Transfer - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-emerald-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">💸</div>
                  <h3 className="text-white font-bold text-sm mb-1">Money Transfer</h3>
                  <p className="text-emerald-100 text-xs">DMT Service</p>
                </div>
              </Link>

              {/* AEPS Cash Withdrawal - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-slate-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🏧</div>
                  <h3 className="text-white font-bold text-sm mb-1">AEPS</h3>
                  <p className="text-slate-100 text-xs">Cash Withdrawal</p>
                </div>
              </Link>

              {/* Axis Bank Account Opening - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-rose-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🏦</div>
                  <h3 className="text-white font-bold text-sm mb-1">Axis Bank</h3>
                  <p className="text-rose-100 text-xs">Account Opening</p>
                </div>
              </Link>

              {/* Cash Deposit - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-lime-500 to-lime-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-lime-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">💰</div>
                  <h3 className="text-white font-bold text-sm mb-1">Cash Deposit</h3>
                  <p className="text-lime-100 text-xs">Bank Deposit</p>
                </div>
              </Link>

              {/* Insurance All Types - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-sky-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🛡️</div>
                  <h3 className="text-white font-bold text-sm mb-1">Insurance</h3>
                  <p className="text-sky-100 text-xs">All Types</p>
                </div>
              </Link>

              {/* Bank Mini Statement - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-fuchsia-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📊</div>
                  <h3 className="text-white font-bold text-sm mb-1">Mini Statement</h3>
                  <p className="text-fuchsia-100 text-xs">Bank Statement</p>
                </div>
              </Link>

              {/* PAN Card Creation - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-stone-500 to-stone-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-stone-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🆔</div>
                  <h3 className="text-white font-bold text-sm mb-1">PAN Creation</h3>
                  <p className="text-stone-100 text-xs">New PAN Card</p>
                </div>
              </Link>

              {/* PAN Card Update - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-zinc-500 to-zinc-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-zinc-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🔄</div>
                  <h3 className="text-white font-bold text-sm mb-1">PAN Update</h3>
                  <p className="text-zinc-100 text-xs">Update Details</p>
                </div>
              </Link>

              {/* Find PAN - Coming Soon */}
              <Link href="/dashboard/coming-soon">
                <div className="group bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-neutral-600 text-[8px] font-bold px-2 py-1 rounded-full">SOON</div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🔍</div>
                  <h3 className="text-white font-bold text-sm mb-1">Find PAN</h3>
                  <p className="text-neutral-100 text-xs">Search PAN</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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



        {/* Gamification Dashboard for Retailers */}
        {user.role === UserRole.RETAILER && (
          <RetailerGamification />
        )}

        {/* Advertisement Section */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 text-base sm:text-lg md:text-xl">Featured Services</CardTitle>
            <CardDescription className="text-gray-600 text-xs sm:text-sm">Discover our popular government services</CardDescription>
          </CardHeader>
          <CardContent>
            <AdvertisementCarousel
              position="dashboard"
              height="h-40 sm:h-48 md:h-56 lg:h-64"
              className="rounded-lg"
              autoPlay={true}
              autoPlayInterval={4000}
              showControls={true}
              showIndicators={true}
            />
          </CardContent>
        </Card>
      </div >
    </DashboardLayout >
  );
}
