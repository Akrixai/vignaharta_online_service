'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/types';
import { formatCurrency } from '@/lib/utils';
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

        {/* Recharge & Bill Payment Services */}
        {(user.role === UserRole.RETAILER || user.role === UserRole.CUSTOMER) && (
          <div className="my-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">💳 Recharge & Bill Payments</h2>
              <p className="text-gray-600">Quick access to all recharge and bill payment services</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Mobile Prepaid */}
              <Link href="/dashboard/recharge/mobile">
                <div className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📱</div>
                  <h3 className="text-white font-bold text-sm mb-1">Mobile</h3>
                  <p className="text-blue-100 text-xs">Prepaid & Postpaid</p>
                </div>
              </Link>

              {/* DTH Recharge */}
              <Link href="/dashboard/recharge/dth">
                <div className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📺</div>
                  <h3 className="text-white font-bold text-sm mb-1">DTH</h3>
                  <p className="text-purple-100 text-xs">TV Recharge</p>
                </div>
              </Link>

              {/* Electricity Bill */}
              <Link href="/dashboard/recharge/electricity">
                <div className="group bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">⚡</div>
                  <h3 className="text-white font-bold text-sm mb-1">Electricity</h3>
                  <p className="text-yellow-100 text-xs">Pay Bill</p>
                </div>
              </Link>

              {/* Recharge History */}
              <Link href="/dashboard/recharge/transactions">
                <div className="group bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📊</div>
                  <h3 className="text-white font-bold text-sm mb-1">Recharge History</h3>
                  <p className="text-gray-100 text-xs">View Transactions</p>
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

              {/* Apply New PAN - Live Service */}
              <Link href="/dashboard/pan-services/new">
                <div className="group bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🆔</div>
                  <h3 className="text-white font-bold text-sm mb-1">Apply New PAN</h3>
                  <p className="text-emerald-100 text-xs">New PAN Card</p>
                </div>
              </Link>

              {/* PAN Correction - Live Service */}
              <Link href="/dashboard/pan-services/correction">
                <div className="group bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">✏️</div>
                  <h3 className="text-white font-bold text-sm mb-1">PAN Correction</h3>
                  <p className="text-amber-100 text-xs">Update Details</p>
                </div>
              </Link>

              {/* Incomplete PAN - Live Service */}
              <Link href="/dashboard/pan-services/incomplete">
                <div className="group bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📋</div>
                  <h3 className="text-white font-bold text-sm mb-1">Incomplete PAN</h3>
                  <p className="text-orange-100 text-xs">Complete Application</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Apply Services */}
        {(user.role === UserRole.RETAILER || user.role === UserRole.CUSTOMER) && (
          <div className="my-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">📝 Apply Services</h2>
                <p className="text-gray-600">Government services and schemes</p>
              </div>
              <Link href="/dashboard/services">
                <button className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2 shadow-lg">
                  <span>View All</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Quick Access to Government Services */}
              <Link href="/dashboard/services">
                <div className="group bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-red-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🏛️</div>
                  <h3 className="text-white font-bold text-sm mb-1">All Services</h3>
                  <p className="text-red-100 text-xs">Browse All</p>
                </div>
              </Link>

              {/* Category-based Services */}
              <Link href="/dashboard/services?category=Identity Documents">
                <div className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-blue-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🆔</div>
                  <h3 className="text-white font-bold text-sm mb-1">Identity</h3>
                  <p className="text-blue-100 text-xs">PAN, Aadhaar</p>
                </div>
              </Link>

              <Link href="/dashboard/services?category=Business Services">
                <div className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-purple-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🏢</div>
                  <h3 className="text-white font-bold text-sm mb-1">Business</h3>
                  <p className="text-purple-100 text-xs">GST, License</p>
                </div>
              </Link>

              <Link href="/dashboard/services?category=Legal Services">
                <div className="group bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-orange-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">⚖️</div>
                  <h3 className="text-white font-bold text-sm mb-1">Legal</h3>
                  <p className="text-orange-100 text-xs">Certificates</p>
                </div>
              </Link>

              <Link href="/dashboard/services?category=Government Schemes">
                <div className="group bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-indigo-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🤝</div>
                  <h3 className="text-white font-bold text-sm mb-1">Schemes</h3>
                  <p className="text-indigo-100 text-xs">Welfare Schemes</p>
                </div>
              </Link>

              <Link href="/dashboard/services?category=Financial Services">
                <div className="group bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-green-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">💰</div>
                  <h3 className="text-white font-bold text-sm mb-1">Financial</h3>
                  <p className="text-green-100 text-xs">Loans, Subsidies</p>
                </div>
              </Link>

              <Link href="/dashboard/services?category=Educational Services">
                <div className="group bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-teal-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🎓</div>
                  <h3 className="text-white font-bold text-sm mb-1">Education</h3>
                  <p className="text-teal-100 text-xs">Certificates, Courses</p>
                </div>
              </Link>

              <Link href="/dashboard/services?category=Healthcare Services">
                <div className="group bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-pink-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🏥</div>
                  <h3 className="text-white font-bold text-sm mb-1">Healthcare</h3>
                  <p className="text-pink-100 text-xs">Medical Services</p>
                </div>
              </Link>

              <Link href="/dashboard/services?category=Employment Services">
                <div className="group bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-yellow-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">💼</div>
                  <h3 className="text-white font-bold text-sm mb-1">Employment</h3>
                  <p className="text-yellow-100 text-xs">Job Services</p>
                </div>
              </Link>

              <Link href="/dashboard/services?category=Certificates">
                <div className="group bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-red-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📜</div>
                  <h3 className="text-white font-bold text-sm mb-1">Certificates</h3>
                  <p className="text-red-100 text-xs">Official Documents</p>
                </div>
              </Link>

              <Link href="/dashboard/services?category=Document Verification">
                <div className="group bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-cyan-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">✅</div>
                  <h3 className="text-white font-bold text-sm mb-1">Verification</h3>
                  <p className="text-cyan-100 text-xs">Document Verify</p>
                </div>
              </Link>

              <Link href="/dashboard/services?category=Information Services">
                <div className="group bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-violet-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">ℹ️</div>
                  <h3 className="text-white font-bold text-sm mb-1">Information</h3>
                  <p className="text-violet-100 text-xs">Info Services</p>
                </div>
              </Link>

              <Link href="/dashboard/services?category=Revenue Services">
                <div className="group bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-amber-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">💸</div>
                  <h3 className="text-white font-bold text-sm mb-1">Revenue</h3>
                  <p className="text-amber-100 text-xs">Tax Services</p>
                </div>
              </Link>

              <Link href="/dashboard/services?category=Other">
                <div className="group bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-slate-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📋</div>
                  <h3 className="text-white font-bold text-sm mb-1">Other</h3>
                  <p className="text-slate-100 text-xs">Misc Services</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Authorized Services */}
        {(user.role === UserRole.RETAILER || user.role === UserRole.CUSTOMER) && (
          <div className="my-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">🔗 Authorized Services</h2>
                <p className="text-gray-600">Quick access to authorized services</p>
              </div>
              <Link href="/dashboard/services?tab=direct">
                <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2 shadow-lg">
                  <span>View All</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Quick Access to Services Page */}
              <Link href="/dashboard/services?tab=direct">
                <div className="group bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-green-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🔗</div>
                  <h3 className="text-white font-bold text-sm mb-1">All Services</h3>
                  <p className="text-green-100 text-xs">Browse All</p>
                </div>
              </Link>

              {/* Featured Services Placeholder - These will be populated from the database */}
              <Link href="/dashboard/services?tab=direct&category=GOVERNMENT">
                <div className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-blue-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">�</div>
                  <h3 className="text-white font-bold text-sm mb-1">Government</h3>
                  <p className="text-blue-100 text-xs">Gov Services</p>
                </div>
              </Link>

              <Link href="/dashboard/services?tab=direct&category=FINANCIAL">
                <div className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-purple-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">💰</div>
                  <h3 className="text-white font-bold text-sm mb-1">Financial</h3>
                  <p className="text-purple-100 text-xs">Banking Services</p>
                </div>
              </Link>

              <Link href="/dashboard/services?tab=direct&category=TRANSPORT">
                <div className="group bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-orange-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🚗</div>
                  <h3 className="text-white font-bold text-sm mb-1">Transport</h3>
                  <p className="text-orange-100 text-xs">Travel Services</p>
                </div>
              </Link>

              <Link href="/dashboard/services?tab=direct&category=EDUCATION">
                <div className="group bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-indigo-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🎓</div>
                  <h3 className="text-white font-bold text-sm mb-1">Education</h3>
                  <p className="text-indigo-100 text-xs">Learning Services</p>
                </div>
              </Link>

              <Link href="/dashboard/services?tab=direct&category=HEALTHCARE">
                <div className="group bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-red-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🏥</div>
                  <h3 className="text-white font-bold text-sm mb-1">Healthcare</h3>
                  <p className="text-red-100 text-xs">Medical Services</p>
                </div>
              </Link>

              <Link href="/dashboard/services?tab=direct&category=UTILITY">
                <div className="group bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-green-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">⚡</div>
                  <h3 className="text-white font-bold text-sm mb-1">Utility</h3>
                  <p className="text-green-100 text-xs">Bills & Services</p>
                </div>
              </Link>

              <Link href="/dashboard/services?tab=direct&category=BUSINESS">
                <div className="group bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-teal-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">💼</div>
                  <h3 className="text-white font-bold text-sm mb-1">Business</h3>
                  <p className="text-teal-100 text-xs">Professional Services</p>
                </div>
              </Link>

              <Link href="/dashboard/services?tab=direct&category=OTHER">
                <div className="group bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-gray-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📋</div>
                  <h3 className="text-white font-bold text-sm mb-1">Other</h3>
                  <p className="text-gray-100 text-xs">Misc Services</p>
                </div>
              </Link>

              <Link href="/dashboard/services?tab=direct&category=Aadhaar Services">
                <div className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-blue-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🏢</div>
                  <h3 className="text-white font-bold text-sm mb-1">Aadhaar</h3>
                  <p className="text-blue-100 text-xs">Aadhaar Services</p>
                </div>
              </Link>

              <Link href="/dashboard/services?tab=direct&category=KNOW STATUS">
                <div className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-white text-purple-600 text-[8px] font-bold px-2 py-1 rounded-full">
                    LIVE
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🏤</div>
                  <h3 className="text-white font-bold text-sm mb-1">Know Status</h3>
                  <p className="text-purple-100 text-xs">Status Check</p>
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
