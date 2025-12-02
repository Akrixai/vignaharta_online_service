'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { UserRole } from '@/types';
import Logo from '@/components/ui/logo';
import AdvertisementCarousel from '@/components/AdvertisementCarousel';
import ReceiptNotifications from '@/components/ReceiptNotifications';
import PopupAdvertisement from '@/components/PopupAdvertisement';
import NotificationBell from '@/components/NotificationBell';
import PopupNotifications from '@/components/notifications/PopupNotifications';
import ScreenNotifications from '@/components/ScreenNotifications';
import { Wallet } from 'lucide-react';
import ChaportChat from '@/components/ChaportChat';
import { env } from '@/lib/env';
// Removed WhatsAppNotificationTrigger to fix chat initialization errors

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  name: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Wallet', href: '/dashboard/wallet', icon: '💰', roles: [UserRole.ADMIN, UserRole.RETAILER, UserRole.CUSTOMER] }, // Admin, Retailer, and Customer can access wallet
  { name: 'Apply Services', href: '/dashboard/services', icon: '📝', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Draft Applications', href: '/dashboard/drafts', icon: '💾', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'My Applications', href: '/dashboard/applications', icon: '📋', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Cashback Earnings', href: '/dashboard/customer/cashback', icon: '🎁', roles: [UserRole.CUSTOMER] },
  { name: 'Commission Earnings', href: '/dashboard/commission', icon: '💸', roles: [UserRole.RETAILER] },
  { name: 'Service Receipts', href: '/dashboard/receipts', icon: '📄', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'My Orders', href: '/dashboard/orders', icon: '📦', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Refunds', href: '/dashboard/retailer/refunds', icon: '🔄', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'My Store', href: '/dashboard/products', icon: '🛍️', roles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Certificates', href: '/dashboard/certificates', icon: '🏆', roles: [UserRole.RETAILER] },
  { name: 'Employee Certificate', href: '/dashboard/employee/certificates', icon: '🏆', roles: [UserRole.EMPLOYEE] },
  { name: 'Free Services', href: '/dashboard/employee/free-services', icon: '🆓', roles: [UserRole.EMPLOYEE] },
  { name: 'Training Videos', href: '/dashboard/training-videos', icon: '🎥', roles: [UserRole.RETAILER, UserRole.EMPLOYEE] },

  // Recharge & Bill Payment Services
  { name: 'Mobile Recharge', href: '/dashboard/recharge/mobile', icon: '📱', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'DTH Recharge', href: '/dashboard/recharge/dth', icon: '📺', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Electricity Bill', href: '/dashboard/recharge/electricity', icon: '⚡', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Recharge History', href: '/dashboard/recharge/transactions', icon: '📊', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  
  // Coming Soon Services
  { name: 'Gas Bill', href: '/dashboard/coming-soon', icon: '🔥', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Water Bill', href: '/dashboard/coming-soon', icon: '💧', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Fastag', href: '/dashboard/coming-soon', icon: '🚗', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Credit Card Bill', href: '/dashboard/coming-soon', icon: '💳', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Broadband', href: '/dashboard/coming-soon', icon: '🌐', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Cibil Report', href: '/dashboard/coming-soon', icon: '📊', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Money Transfer', href: '/dashboard/coming-soon', icon: '💸', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'AEPS Cash Withdrawal', href: '/dashboard/coming-soon', icon: '🏧', roles: [UserRole.RETAILER] },
  { name: 'Aadhar Pay', href: '/dashboard/coming-soon', icon: '💵', roles: [UserRole.RETAILER] },
  { name: 'PAN Card', href: '/dashboard/coming-soon', icon: '🆔', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Bus Ticket', href: '/dashboard/coming-soon', icon: '🚌', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Flight Ticket', href: '/dashboard/coming-soon', icon: '✈️', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Train Ticket', href: '/dashboard/coming-soon', icon: '🚂', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Hotel Booking', href: '/dashboard/coming-soon', icon: '🏨', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Loan Repayment', href: '/dashboard/coming-soon', icon: '🏦', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Cash Deposit', href: '/dashboard/coming-soon', icon: '💰', roles: [UserRole.RETAILER] },

  // Admin Management Section
  { name: 'KWIKAPI Wallet', href: '/dashboard/admin/kwikapi-wallet', icon: '💰', roles: [UserRole.ADMIN] },
  { name: 'Recharge Configuration', href: '/dashboard/admin/recharge-config', icon: '⚙️', roles: [UserRole.ADMIN] },
  { name: 'Blog Management', href: '/dashboard/admin/blog', icon: '📝', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  { name: 'Manage Products', href: '/dashboard/admin/products', icon: '📦', roles: [UserRole.ADMIN] },
  { name: 'Manage Training', href: '/dashboard/admin/training', icon: '🎬', roles: [UserRole.ADMIN] },
  { name: 'Manage Applications', href: '/dashboard/admin/applications', icon: '📋', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  { name: 'Order Management', href: '/dashboard/orders', icon: '📋', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  { name: 'Manage Services', href: '/dashboard/admin/services', icon: '⚙️', roles: [UserRole.ADMIN] },
  { name: 'Manage Free Services', href: '/dashboard/admin/free-services', icon: '🆓', roles: [UserRole.ADMIN] },
  { name: 'Free Services Analytics', href: '/dashboard/admin/free-services-analytics', icon: '📊', roles: [UserRole.ADMIN] },
  { name: 'Website Analytics', href: '/dashboard/admin/analytics', icon: '📈', roles: [UserRole.ADMIN] },
  { name: 'Manage Advertisements', href: '/dashboard/admin/ads', icon: '📢', roles: [UserRole.ADMIN] },
  { name: 'Login Advertisements', href: '/dashboard/admin/advertisements', icon: '🔑', roles: [UserRole.ADMIN] },
  { name: 'All Certificates', href: '/dashboard/admin/certificates', icon: '🏆', roles: [UserRole.ADMIN] },
  { name: 'User Management', href: '/dashboard/admin/users', icon: '👥', roles: [UserRole.ADMIN] },
  { name: 'Employee Management', href: '/dashboard/employees', icon: '🧑‍💼', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  { name: 'All Employees & Documents', href: '/dashboard/admin/employees/all', icon: '📂', roles: [UserRole.ADMIN] },
  { name: 'My Referrals', href: '/dashboard/employee/referrals', icon: '🎁', roles: [UserRole.EMPLOYEE, UserRole.ADMIN] },
  { name: 'Referral Configuration', href: '/dashboard/admin/employee-referral-config', icon: '⚙️', roles: [UserRole.ADMIN] },
  { name: 'Contact Configuration', href: '/dashboard/admin/contact-config', icon: '📞', roles: [UserRole.ADMIN] },
  { name: 'Penalty Management', href: '/dashboard/admin/penalties', icon: '⚠️', roles: [UserRole.ADMIN] },
  { name: 'Leaderboard Emails', href: '/dashboard/admin/leaderboard-emails', icon: '🏆', roles: [UserRole.ADMIN] },
  { name: 'Shareable Service Forms', href: '/dashboard/admin/shareable-service-forms', icon: '🔗', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  { name: 'Organization Hierarchy', href: '/dashboard/organization-hierarchy', icon: '🏢', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  { name: 'Registration Fee', href: '/dashboard/admin/registration-fee', icon: '💵', roles: [UserRole.ADMIN] },
  { name: 'Platform & Yearly Fees', href: '/dashboard/admin/platform-fees', icon: '💰', roles: [UserRole.ADMIN] },
  { name: 'Registration Requests', href: '/dashboard/admin/pending-registrations', icon: '👤', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  { name: 'Database Cleanup', href: '/dashboard/admin/data-cleanup', icon: '🗄️', roles: [UserRole.ADMIN] },
  { name: 'Transactions', href: '/dashboard/transactions', icon: '💳', roles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Wallet Approvals', href: '/dashboard/admin/wallet-approvals', icon: '💰', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  { name: 'Refund Management', href: '/dashboard/admin/refunds', icon: '🔄', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  { name: 'Help & Support', href: '/dashboard/help-support', icon: '🆘', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },

  { name: 'My Profile', href: '/dashboard/profile', icon: '👤', roles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.RETAILER, UserRole.CUSTOMER] },
  { name: 'Change Password', href: '/dashboard/change-password', icon: '🔒', roles: [UserRole.RETAILER, UserRole.CUSTOMER] },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Fetch wallet balance for retailers and customers
  useEffect(() => {
    if (session?.user?.role === UserRole.RETAILER || session?.user?.role === UserRole.CUSTOMER) {
      const fetchWalletBalance = async () => {
        setLoadingWallet(true);
        try {
          const response = await fetch('/api/wallet');
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setWalletBalance(data.data.balance || 0);
            }
          }
        } catch (error) {
          // Silently fail - wallet balance will show 0
        } finally {
          setLoadingWallet(false);
        }
      };

      fetchWalletBalance();

      // Refresh wallet balance every 30 seconds
      const interval = setInterval(fetchWalletBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.role]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Middleware will redirect
  }

  const userRole = session.user.role;
  const userName = session.user.name;
  const userDesignation = (session.user as any).designation;

  // Filter menu items based on role and designation
  const filteredMenuItems = menuItems.filter(item => {
    // First check if user's role is allowed
    if (!item.roles.includes(userRole)) return false;

    // Special handling for Wallet - Admin, Retailer, and Customer
    if (item.name === 'Wallet') {
      return userRole === UserRole.ADMIN || userRole === UserRole.RETAILER || userRole === UserRole.CUSTOMER;
    }

    // Special handling for Employee Management - only show to those who can create employees
    if (item.name === 'Employee Management') {
      // Admin can always see it
      if (userRole === UserRole.ADMIN) return true;

      // Employees with these designations can create subordinates
      // MANAGER, STATE_MANAGER, DISTRICT_MANAGER, SUPERVISOR, DISTRIBUTOR can create employees
      // Regular EMPLOYEE and RETAILER cannot
      const canCreateEmployees = ['MANAGER', 'STATE_MANAGER', 'DISTRICT_MANAGER', 'SUPERVISOR', 'DISTRIBUTOR'];
      return userRole === UserRole.EMPLOYEE && userDesignation && canCreateEmployees.includes(userDesignation);
    }

    // Special handling for Organization Hierarchy - show to all employees with designation and admin
    if (item.name === 'Organization Hierarchy') {
      if (userRole === UserRole.ADMIN) return true;
      // Show to employees with designation (they can see their subordinates)
      return userRole === UserRole.EMPLOYEE && userDesignation;
    }

    // Hide admin-only items from regular employees without proper designation
    if (item.roles.includes(UserRole.ADMIN) && !item.roles.includes(UserRole.EMPLOYEE)) {
      return userRole === UserRole.ADMIN;
    }

    return true;
  });

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-red-600';
      case UserRole.EMPLOYEE: return 'bg-red-500';
      case UserRole.RETAILER: return 'bg-red-700';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex">
      {/* Hide scrollbars for sidebar scroll container (webkit + firefox + ie) */}
      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{scrollbar-width:none;-ms-overflow-style:none;}`}</style>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[5] bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Made sticky with lower z-index */}
      <div className={`fixed inset-y-0 left-0 z-10 w-56 sm:w-64 bg-gradient-to-b from-red-800 to-red-900 shadow-xl transform overflow-hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex lg:flex-col`}>
        <div className="flex items-center justify-center h-14 sm:h-16 px-3 sm:px-4 bg-gradient-to-r from-red-700 to-red-800 border-b border-red-600">
          <Link href="/" className="text-white flex items-center space-x-2">
            <Logo size="md" showText={true} animated={false} />
          </Link>
        </div>

        {/* User Info */}
        <div className="p-3 sm:p-4 border-b border-red-600">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {(session.user as any).profile_photo_url && (session.user as any).profile_photo_url !== 'null' ? (
              <img
                src={(session.user as any).profile_photo_url}
                alt={userName}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-lg ring-2 ring-white flex-shrink-0"
                onError={(e) => {
                  // Fallback to initial if image fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${getRoleColor(userRole)} flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}
              style={{ display: (session.user as any).profile_photo_url && (session.user as any).profile_photo_url !== 'null' ? 'none' : 'flex' }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-[10px] sm:text-xs text-red-200 capitalize truncate">
                {userDesignation ? userDesignation.replace('_', ' ') : userRole.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Make the center area (menu + ad + logout + branding) a single scrollable column so the scrollbar covers all items */}
        <div className="mt-3 sm:mt-4 px-2 flex-1 flex flex-col overflow-y-auto hide-scrollbar">
          <nav className="flex-1">
            <div className="space-y-0.5 sm:space-y-1">
              {/* Main Menu Items */}
              {filteredMenuItems.filter(item => 
                ['Dashboard', 'Wallet', 'My Profile', 'Change Password'].includes(item.name)
              ).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg text-red-100 hover:bg-red-700 hover:text-white transition-all duration-200 hover:shadow-md"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                  <span className="truncate">{item.name}</span>
                </Link>
              ))}

              {/* Services Section */}
              {filteredMenuItems.some(item => 
                ['Apply Services', 'Draft Applications', 'My Applications', 'Service Receipts', 'Cashback Earnings', 'Commission Earnings'].includes(item.name)
              ) && (
                <>
                  <div className="pt-3 pb-1 px-2">
                    <h3 className="text-xs font-semibold text-red-300 uppercase tracking-wider">Services</h3>
                  </div>
                  {filteredMenuItems.filter(item => 
                    ['Apply Services', 'Draft Applications', 'My Applications', 'Service Receipts', 'Cashback Earnings', 'Commission Earnings'].includes(item.name)
                  ).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg text-red-100 hover:bg-red-700 hover:text-white transition-all duration-200 hover:shadow-md"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-2 sm:mr-3 text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}

              {/* Products & Orders Section */}
              {filteredMenuItems.some(item => 
                ['My Store', 'My Orders', 'Refunds'].includes(item.name)
              ) && (
                <>
                  <div className="pt-3 pb-1 px-2">
                    <h3 className="text-xs font-semibold text-red-300 uppercase tracking-wider">Products</h3>
                  </div>
                  {filteredMenuItems.filter(item => 
                    ['My Store', 'My Orders', 'Refunds'].includes(item.name)
                  ).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg text-red-100 hover:bg-red-700 hover:text-white transition-all duration-200 hover:shadow-md"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-2 sm:mr-3 text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}

              {/* Recharge & Bills Section */}
              {filteredMenuItems.some(item => 
                ['Mobile Recharge', 'DTH Recharge', 'Electricity Bill', 'Recharge History'].includes(item.name)
              ) && (
                <>
                  <div className="pt-3 pb-1 px-2">
                    <h3 className="text-xs font-semibold text-red-300 uppercase tracking-wider">Recharge & Bills</h3>
                  </div>
                  {filteredMenuItems.filter(item => 
                    ['Mobile Recharge', 'DTH Recharge', 'Electricity Bill', 'Recharge History'].includes(item.name)
                  ).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg text-red-100 hover:bg-red-700 hover:text-white transition-all duration-200 hover:shadow-md"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-2 sm:mr-3 text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}

              {/* Employee Section */}
              {filteredMenuItems.some(item => 
                ['Employee Management', 'All Employees & Documents', 'Employee Certificate', 'Free Services', 'My Referrals', 'Organization Hierarchy', 'Training Videos'].includes(item.name)
              ) && (
                <>
                  <div className="pt-3 pb-1 px-2">
                    <h3 className="text-xs font-semibold text-red-300 uppercase tracking-wider">Employee</h3>
                  </div>
                  {filteredMenuItems.filter(item => 
                    ['Employee Management', 'All Employees & Documents', 'Employee Certificate', 'Free Services', 'My Referrals', 'Organization Hierarchy', 'Training Videos'].includes(item.name)
                  ).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg text-red-100 hover:bg-red-700 hover:text-white transition-all duration-200 hover:shadow-md"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-2 sm:mr-3 text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}

              {/* Admin Management Section */}
              {userRole === UserRole.ADMIN && filteredMenuItems.some(item => 
                ['Blog Management', 'Manage Products', 'Manage Training', 'Manage Applications', 'Order Management', 'Manage Services', 'User Management', 'All Certificates', 'Transactions', 'Wallet Approvals', 'Refund Management'].includes(item.name)
              ) && (
                <>
                  <div className="pt-3 pb-1 px-2">
                    <h3 className="text-xs font-semibold text-yellow-300 uppercase tracking-wider">Admin - Management</h3>
                  </div>
                  {filteredMenuItems.filter(item => 
                    ['Blog Management', 'Manage Products', 'Manage Training', 'Manage Applications', 'Order Management', 'Manage Services', 'Manage Free Services', 'User Management', 'All Certificates', 'Transactions', 'Wallet Approvals', 'Refund Management'].includes(item.name)
                  ).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg text-yellow-100 hover:bg-yellow-600 hover:text-white transition-all duration-200 hover:shadow-md"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-2 sm:mr-3 text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}

              {/* Admin Configuration Section */}
              {userRole === UserRole.ADMIN && filteredMenuItems.some(item => 
                ['KWIKAPI Wallet', 'Recharge Configuration', 'Referral Configuration', 'Contact Configuration', 'Registration Fee', 'Platform & Yearly Fees', 'Penalty Management', 'Leaderboard Emails', 'Shareable Service Forms'].includes(item.name)
              ) && (
                <>
                  <div className="pt-3 pb-1 px-2">
                    <h3 className="text-xs font-semibold text-yellow-300 uppercase tracking-wider">Admin - Configuration</h3>
                  </div>
                  {filteredMenuItems.filter(item => 
                    ['KWIKAPI Wallet', 'Recharge Configuration', 'Referral Configuration', 'Contact Configuration', 'Registration Fee', 'Platform & Yearly Fees', 'Penalty Management', 'Leaderboard Emails', 'Shareable Service Forms'].includes(item.name)
                  ).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg text-yellow-100 hover:bg-yellow-600 hover:text-white transition-all duration-200 hover:shadow-md"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-2 sm:mr-3 text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}

              {/* Admin Analytics & Ads Section */}
              {userRole === UserRole.ADMIN && filteredMenuItems.some(item => 
                ['Website Analytics', 'Free Services Analytics', 'Manage Advertisements', 'Login Advertisements'].includes(item.name)
              ) && (
                <>
                  <div className="pt-3 pb-1 px-2">
                    <h3 className="text-xs font-semibold text-yellow-300 uppercase tracking-wider">Admin - Analytics</h3>
                  </div>
                  {filteredMenuItems.filter(item => 
                    ['Website Analytics', 'Free Services Analytics', 'Manage Advertisements', 'Login Advertisements'].includes(item.name)
                  ).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg text-yellow-100 hover:bg-yellow-600 hover:text-white transition-all duration-200 hover:shadow-md"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-2 sm:mr-3 text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}

              {/* Admin System Section */}
              {userRole === UserRole.ADMIN && filteredMenuItems.some(item => 
                ['Registration Requests', 'Database Cleanup'].includes(item.name)
              ) && (
                <>
                  <div className="pt-3 pb-1 px-2">
                    <h3 className="text-xs font-semibold text-yellow-300 uppercase tracking-wider">Admin - System</h3>
                  </div>
                  {filteredMenuItems.filter(item => 
                    ['Registration Requests', 'Database Cleanup'].includes(item.name)
                  ).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg text-yellow-100 hover:bg-yellow-600 hover:text-white transition-all duration-200 hover:shadow-md"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-2 sm:mr-3 text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}

              {/* Coming Soon Services */}
              {filteredMenuItems.some(item => item.href === '/dashboard/coming-soon') && (
                <>
                  <div className="pt-3 pb-1 px-2">
                    <h3 className="text-xs font-semibold text-red-300 uppercase tracking-wider">Coming Soon</h3>
                  </div>
                  {filteredMenuItems.filter(item => item.href === '/dashboard/coming-soon').slice(0, 5).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg text-red-100 hover:bg-red-700 hover:text-white transition-all duration-200 hover:shadow-md opacity-60"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-2 sm:mr-3 text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}

              {/* Help & Support */}
              {filteredMenuItems.some(item => item.name === 'Help & Support') && (
                <>
                  <div className="pt-3 pb-1 px-2">
                    <h3 className="text-xs font-semibold text-red-300 uppercase tracking-wider">Support</h3>
                  </div>
                  {filteredMenuItems.filter(item => item.name === 'Help & Support').map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg text-red-100 hover:bg-red-700 hover:text-white transition-all duration-200 hover:shadow-md"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-2 sm:mr-3 text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}

              {/* Certificates Section */}
              {filteredMenuItems.some(item => item.name === 'Certificates') && (
                <>
                  <div className="pt-3 pb-1 px-2">
                    <h3 className="text-xs font-semibold text-red-300 uppercase tracking-wider">Certificates</h3>
                  </div>
                  {filteredMenuItems.filter(item => item.name === 'Certificates').map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg text-red-100 hover:bg-red-700 hover:text-white transition-all duration-200 hover:shadow-md"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-2 sm:mr-3 text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </nav>

          {/* Sidebar Advertisement */}
          <div className="p-3 sm:p-4 border-t border-red-600">
            <AdvertisementCarousel
              position="sidebar"
              height="h-24 sm:h-32"
              className="rounded-lg overflow-hidden"
              autoPlay={true}
              autoPlayInterval={6000}
              showControls={false}
              showIndicators={false}
            />
          </div>

          {/* Logout */}
          <div className="p-3 sm:p-4 border-t border-red-600">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg text-red-200 hover:bg-red-700 hover:text-white transition-all duration-200"
            >
              <span className="mr-2 sm:mr-3 text-base sm:text-lg flex-shrink-0">🚪</span>
              <span>Logout</span>
            </button>
          </div>

          {/* Akrix.ai Branding - compact single-line pill */}
          <div className="p-3 sm:p-4 border-t border-red-600">
            <a
              href="https://akrixsolutions.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 text-white font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm hover:from-pink-500 hover:to-yellow-400 transition-all duration-200 inline-flex items-center justify-center space-x-1 sm:space-x-2 w-full"
              style={{ textShadow: '0 0 6px rgba(255,255,255,0.7)' }}
            >
              <span className="text-xs sm:text-sm">🚀</span>
              <span className="text-[10px] sm:text-sm">Developed by Akrix.ai</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar - Made sticky with medium z-index */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-red-600 to-red-700 shadow-lg border-b border-red-500 flex items-center justify-between h-11 sm:h-12 px-2 sm:px-3 md:px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1 sm:p-2 rounded-md text-red-100 hover:text-white hover:bg-red-700 transition-colors flex-shrink-0"
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Advertisement Space */}
          <div className="hidden lg:block flex-1 max-w-lg mx-2 lg:mx-4">
            <AdvertisementCarousel
              position="header"
              height="h-8 lg:h-10"
              className="rounded-md"
              autoPlay={true}
              autoPlayInterval={8000}
              showControls={false}
              showIndicators={false}
            />
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 min-w-0">
            {/* Wallet Balance for Retailers and Customers */}
            {(session?.user?.role === UserRole.RETAILER || session?.user?.role === UserRole.CUSTOMER) && (
              <div className="flex items-center bg-white/20 rounded-md sm:rounded-lg px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-white flex-shrink-0">
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap">
                  {loadingWallet ? '...' : `₹${walletBalance.toLocaleString()}`}
                </span>
              </div>
            )}

            {/* Notification Bell for Admin/Employee */}
            <div className="flex-shrink-0">
              <NotificationBell
                userRole={session?.user?.role}
                userId={session?.user?.id}
              />
            </div>

            <span className="text-[10px] sm:text-xs md:text-sm text-red-100 whitespace-nowrap hidden md:inline truncate max-w-[80px] lg:max-w-none">
              Welcome, {userName}
            </span>

            {/* Logout Button in Header */}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="bg-red-800 hover:bg-red-900 text-white text-[10px] sm:text-xs md:text-sm font-medium px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-md sm:rounded-lg transition-colors duration-200 flex items-center flex-shrink-0"
            >
              <span className="mr-0.5 sm:mr-1 text-xs sm:text-sm">🚪</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Page content - Made scrollable with proper z-index */}
        <main className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 overflow-y-auto w-full max-w-full relative z-0">
          {children}
        </main>

        {/* Footer Advertisement */}
        <footer className="bg-white border-t border-gray-200 p-2 sm:p-3 md:p-4">
          <div className="max-w-7xl mx-auto">
            <AdvertisementCarousel
              position="footer"
              height="h-20 sm:h-24"
              className="rounded-lg overflow-hidden"
              autoPlay={true}
              autoPlayInterval={7000}
              showControls={false}
              showIndicators={true}
            />
          </div>
        </footer>

      </div>

      {/* Popup Advertisement */}
      <PopupAdvertisement />

      {/* Receipt Notifications */}
      <ReceiptNotifications />

      {/* Popup Notifications - Only for retailers */}
      {session?.user?.role === UserRole.RETAILER && (
        <PopupNotifications />
      )}

      {/* Screen Notifications - Shows notifications as popups on screen for admin/employee */}
      {(session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.EMPLOYEE) && (
        <ScreenNotifications />
      )}

      {/* Chaport Live Chat - Only for Retailers */}
      {session?.user?.role === UserRole.RETAILER && (
        <ChaportChat appId={env.NEXT_PUBLIC_CHAPORT_APP_ID} />
      )}

      {/* WhatsApp Notification Trigger removed to fix chat initialization errors */}
    </div>
  );
}