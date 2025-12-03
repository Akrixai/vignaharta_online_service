import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    const userId = session.user.id;

    let stats: any = {};

    if (userRole === 'RETAILER' || userRole === 'CUSTOMER') {
      // Customer/Retailer specific stats
      
      // Get wallet balance
      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      // Get application counts
      const { data: applications } = await supabaseAdmin
        .from('applications')
        .select('status')
        .eq('user_id', userId);

      const applicationStats = applications?.reduce((acc: any, app: any) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {}) || {};

      // Get recent transactions
      const { data: recentTransactions } = await supabaseAdmin
        .from('transactions')
        .select(`
          id,
          type,
          amount,
          status,
          description,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get receipts count for retailer
      const { data: receipts, count: receiptsCount } = await supabaseAdmin
        .from('receipts')
        .select('id', { count: 'exact' })
        .eq('retailer_id', userId);

      // Get pending wallet requests
      const { data: walletRequests, count: walletRequestCount } = await supabaseAdmin
        .from('wallet_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'PENDING');

      stats = {
        walletBalance: wallet?.balance || 0,
        totalApplications: applications?.length || 0,
        pendingApplications: applicationStats.PENDING || 0,
        approvedApplications: applicationStats.APPROVED || 0,
        rejectedApplications: applicationStats.REJECTED || 0,
        completedApplications: applicationStats.COMPLETED || 0,
        totalReceipts: receiptsCount || 0,
        pendingWalletRequests: walletRequestCount || 0,
        recentTransactions: recentTransactions || []
      };

    } else if (userRole === 'EMPLOYEE') {
      // Employee specific stats
      const designation = (session.user as any).designation;
      
      // Get pending applications count
      const { data: pendingApps, count: pendingCount } = await supabaseAdmin
        .from('applications')
        .select('id', { count: 'exact' })
        .eq('status', 'PENDING');

      // Get applications approved by this employee
      const { data: approvedApps, count: approvedCount } = await supabaseAdmin
        .from('applications')
        .select('id', { count: 'exact' })
        .eq('approved_by', userId);

      // Get recent applications
      const { data: recentApplications } = await supabaseAdmin
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          schemes (
            name
          ),
          users (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get applications processed today by this employee
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: processedToday, count: processedTodayCount } = await supabaseAdmin
        .from('applications')
        .select('id', { count: 'exact' })
        .eq('approved_by', userId)
        .gte('processed_at', today.toISOString());

      // Get pending wallet requests for approval
      const { data: pendingWalletRequests, count: walletRequestCount } = await supabaseAdmin
        .from('wallet_requests')
        .select('id', { count: 'exact' })
        .eq('status', 'PENDING');

      // Get pending transactions for approval
      const { data: pendingTransactions, count: transactionCount } = await supabaseAdmin
        .from('transactions')
        .select('id', { count: 'exact' })
        .eq('status', 'PENDING');

      stats = {
        pendingApplications: pendingCount || 0,
        approvedByMe: approvedCount || 0,
        processedToday: processedTodayCount || 0,
        pendingWalletRequests: walletRequestCount || 0,
        pendingTransactions: transactionCount || 0,
        recentApplications: recentApplications || []
      };

      // Add designation-specific stats
      if (designation === 'MANAGER') {
        // Manager oversees all state managers and company operations
        const { data: stateManagers, count: stateManagerCount } = await supabaseAdmin
          .from('users')
          .select('id, territory_state', { count: 'exact' })
          .eq('role', 'EMPLOYEE')
          .eq('designation', 'STATE_MANAGER')
          .eq('is_active', true);

        // Get total revenue from all applications
        const { data: allApplications } = await supabaseAdmin
          .from('applications')
          .select('amount, status');

        const totalRevenue = allApplications
          ?.filter(app => app.status === 'APPROVED' || app.status === 'COMPLETED')
          .reduce((sum, app) => sum + (parseFloat(app.amount) || 0), 0) || 0;

        // Get unique active states
        const activeStates = new Set(stateManagers?.map(sm => sm.territory_state).filter(Boolean));

        // Calculate monthly growth
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const { data: lastMonthApps } = await supabaseAdmin
          .from('applications')
          .select('id')
          .gte('created_at', lastMonth.toISOString());

        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const { data: twoMonthsAgoApps } = await supabaseAdmin
          .from('applications')
          .select('id')
          .gte('created_at', twoMonthsAgo.toISOString())
          .lt('created_at', lastMonth.toISOString());

        const currentMonthCount = lastMonthApps?.length || 0;
        const previousMonthCount = twoMonthsAgoApps?.length || 0;
        const monthlyGrowth = previousMonthCount > 0 
          ? Math.round(((currentMonthCount - previousMonthCount) / previousMonthCount) * 100)
          : 0;

        // Get state-wise performance
        const { data: stateApplications } = await supabaseAdmin
          .from('applications')
          .select(`
            amount,
            status,
            users!inner (
              territory_state
            )
          `);

        const statePerformance: Record<string, any> = {};
        stateApplications?.forEach(app => {
          const state = app.users?.territory_state;
          if (state) {
            if (!statePerformance[state]) {
              statePerformance[state] = { state, applications: 0, revenue: 0 };
            }
            statePerformance[state].applications++;
            if (app.status === 'APPROVED' || app.status === 'COMPLETED') {
              statePerformance[state].revenue += parseFloat(app.amount) || 0;
            }
          }
        });

        // Calculate growth for each state
        const statePerformanceArray = Object.values(statePerformance).map((state: any) => ({
          ...state,
          growth: Math.floor(Math.random() * 20) + 5 // Placeholder growth calculation
        }));

        stats.totalStateManagers = stateManagerCount || 0;
        stats.totalRevenue = totalRevenue;
        stats.activeStates = activeStates.size;
        stats.monthlyGrowth = monthlyGrowth;
        stats.statePerformance = statePerformanceArray;
      } else if (designation === 'STATE_MANAGER') {
        // State Manager stats
        const territoryState = (session.user as any).territory_state;
        
        const { data: districtManagers, count: districtManagerCount } = await supabaseAdmin
          .from('users')
          .select('id', { count: 'exact' })
          .eq('role', 'EMPLOYEE')
          .eq('designation', 'DISTRICT_MANAGER')
          .eq('territory_state', territoryState)
          .eq('is_active', true);

        const { data: stateApplications } = await supabaseAdmin
          .from('applications')
          .select(`
            amount,
            status,
            users!inner (
              territory_state
            )
          `)
          .eq('users.territory_state', territoryState);

        const stateRevenue = stateApplications
          ?.filter(app => app.status === 'APPROVED' || app.status === 'COMPLETED')
          .reduce((sum, app) => sum + (parseFloat(app.amount) || 0), 0) || 0;

        stats.totalDistrictManagers = districtManagerCount || 0;
        stats.stateRevenue = stateRevenue;
        stats.stateApplications = stateApplications?.length || 0;
      } else if (designation === 'DISTRICT_MANAGER') {
        // District Manager stats
        const territoryDistrict = (session.user as any).territory_district;
        
        const { data: supervisors, count: supervisorCount } = await supabaseAdmin
          .from('users')
          .select('id', { count: 'exact' })
          .eq('role', 'EMPLOYEE')
          .eq('designation', 'SUPERVISOR')
          .eq('territory_district', territoryDistrict)
          .eq('is_active', true);

        const { data: districtApplications } = await supabaseAdmin
          .from('applications')
          .select(`
            amount,
            status,
            users!inner (
              territory_district
            )
          `)
          .eq('users.territory_district', territoryDistrict);

        const districtRevenue = districtApplications
          ?.filter(app => app.status === 'APPROVED' || app.status === 'COMPLETED')
          .reduce((sum, app) => sum + (parseFloat(app.amount) || 0), 0) || 0;

        stats.totalSupervisors = supervisorCount || 0;
        stats.districtRevenue = districtRevenue;
        stats.districtApplications = districtApplications?.length || 0;
      } else if (designation === 'SUPERVISOR') {
        // Supervisor stats
        const territoryArea = (session.user as any).territory_area;
        
        const { data: retailers, count: retailerCount } = await supabaseAdmin
          .from('users')
          .select('id', { count: 'exact' })
          .eq('role', 'RETAILER')
          .eq('territory_area', territoryArea)
          .eq('is_active', true);

        const { data: areaApplications } = await supabaseAdmin
          .from('applications')
          .select(`
            amount,
            status,
            users!inner (
              territory_area
            )
          `)
          .eq('users.territory_area', territoryArea);

        const areaRevenue = areaApplications
          ?.filter(app => app.status === 'APPROVED' || app.status === 'COMPLETED')
          .reduce((sum, app) => sum + (parseFloat(app.amount) || 0), 0) || 0;

        stats.totalRetailers = retailerCount || 0;
        stats.areaRevenue = areaRevenue;
        stats.areaApplications = areaApplications?.length || 0;
      } else if (designation === 'DISTRIBUTOR') {
        // Distributor stats
        const { data: distributorApplications } = await supabaseAdmin
          .from('applications')
          .select('amount, status')
          .eq('user_id', userId);

        const distributorRevenue = distributorApplications
          ?.filter(app => app.status === 'APPROVED' || app.status === 'COMPLETED')
          .reduce((sum, app) => sum + (parseFloat(app.amount) || 0), 0) || 0;

        stats.distributorRevenue = distributorRevenue;
        stats.distributorApplications = distributorApplications?.length || 0;
      }

    } else if (userRole === 'ADMIN') {
      // Admin specific stats
      
      // Get user counts by role
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('role, is_active');

      const userStats = users?.reduce((acc: any, user: any) => {
        if (user.is_active) {
          acc[user.role] = (acc[user.role] || 0) + 1;
        }
        return acc;
      }, {}) || {};

      // Get total revenue (sum of completed transactions)
      const { data: revenue } = await supabaseAdmin
        .from('transactions')
        .select('amount')
        .eq('type', 'SCHEME_PAYMENT')
        .eq('status', 'COMPLETED');

      const totalRevenue = revenue?.reduce((sum: number, transaction: any) => {
        return sum + Math.abs(parseFloat(transaction.amount));
      }, 0) || 0;

      // Get application counts
      const { data: applications } = await supabaseAdmin
        .from('applications')
        .select('status');

      const applicationStats = applications?.reduce((acc: any, app: any) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {}) || {};

      // Get popular schemes
      const { data: popularSchemes } = await supabaseAdmin
        .from('applications')
        .select(`
          scheme_id,
          schemes (
            name
          )
        `)
        .limit(1000);

      const schemeStats = popularSchemes?.reduce((acc: any, app: any) => {
        const schemeName = app.schemes?.name;
        if (schemeName) {
          acc[schemeName] = (acc[schemeName] || 0) + 1;
        }
        return acc;
      }, {}) || {};

      const topSchemes = Object.entries(schemeStats)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, applications: count }));

      // Get recent transactions
      const { data: recentTransactions } = await supabaseAdmin
        .from('transactions')
        .select(`
          id,
          type,
          amount,
          status,
          description,
          reference,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get receipt statistics
      const { data: totalReceipts, count: totalReceiptsCount } = await supabaseAdmin
        .from('receipts')
        .select('id', { count: 'exact' });

      // Get wallet request statistics
      const { data: walletRequests } = await supabaseAdmin
        .from('wallet_requests')
        .select('status');

      const walletStats = walletRequests?.reduce((acc: any, req: any) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {}) || {};

      // Get pending transactions
      const { data: pendingTransactions, count: pendingTxCount } = await supabaseAdmin
        .from('transactions')
        .select('id', { count: 'exact' })
        .eq('status', 'PENDING');

      stats = {
        totalUsers: users?.filter(u => u.is_active).length || 0,
        totalCustomers: userStats.CUSTOMER || 0,
        totalRetailers: userStats.RETAILER || 0,
        totalEmployees: userStats.EMPLOYEE || 0,
        totalRevenue,
        totalApplications: applications?.length || 0,
        pendingApplications: applicationStats.PENDING || 0,
        approvedApplications: applicationStats.APPROVED || 0,
        rejectedApplications: applicationStats.REJECTED || 0,
        completedApplications: applicationStats.COMPLETED || 0,
        totalReceipts: totalReceiptsCount || 0,
        pendingWalletRequests: walletStats.PENDING || 0,
        approvedWalletRequests: walletStats.APPROVED || 0,
        rejectedWalletRequests: walletStats.REJECTED || 0,
        pendingTransactions: pendingTxCount || 0,
        popularSchemes: topSchemes,
        recentTransactions: recentTransactions || []
      };
    }

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
