'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  RefreshCcw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Users,
  ChevronRight,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PanCommissionConfig {
  id: string;
  service_type: 'NEW_PAN' | 'PAN_CORRECTION' | 'INCOMPLETE_PAN';
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PanApplication {
  id: string;
  user_id: string;
  service_type: string;
  mobile_number: string;
  mode: string;
  order_id: string;
  amount: number;
  status: string;
  acknowledgement_number?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  processing: number;
  success: number;
  failure: number;
  total_amount: number;
}

export default function PanCommissionPage() {
  const { data: session } = useSession();
  const [configs, setConfigs] = useState<PanCommissionConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PanCommissionConfig | null>(null);
  const [formData, setFormData] = useState({
    service_type: 'NEW_PAN' as 'NEW_PAN' | 'PAN_CORRECTION' | 'INCOMPLETE_PAN',
    price: 0,
    is_active: true
  });

  const [applications, setApplications] = useState<PanApplication[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    processing: 0,
    success: 0,
    failure: 0,
    total_amount: 0
  });
  const [loadingApps, setLoadingApps] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // InsPay Wallet Balance State
  const [inspayBalance, setInspayBalance] = useState<number | null>(null);
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const [balanceFetchedAt, setBalanceFetchedAt] = useState<string | null>(null);

  // Fetch configurations
  const fetchConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const response = await fetch('/api/admin/pan-commission');
      const data = await response.json();

      if (data.success) {
        setConfigs(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch configurations');
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('Failed to fetch configurations');
    } finally {
      setLoadingConfigs(false);
    }
  };

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    try {
      const url = new URL('/api/admin/pan-applications', window.location.origin);
      if (statusFilter !== 'ALL') url.searchParams.append('status', statusFilter);
      if (typeFilter !== 'ALL') url.searchParams.append('service_type', typeFilter);
      url.searchParams.append('limit', '50');

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.success) {
        setApplications(data.data);
        setStats(data.stats);
      } else {
        toast.error(data.message || 'Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoadingApps(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    if (session?.user?.role === UserRole.ADMIN) {
      fetchConfigs();
      fetchApplications();

      // Real-time subscription
      const channel = supabase
        .channel('pan_services_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pan_services'
          },
          (payload) => {
            console.log('Real-time update:', payload);
            fetchApplications(); // Refresh data on change
            toast.success('PAN application updated!', { icon: '🔔' });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session, fetchApplications]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);

    try {
      const method = editingConfig ? 'PUT' : 'POST';
      const body = editingConfig
        ? { ...formData, id: editingConfig.id }
        : formData;

      const response = await fetch('/api/admin/pan-commission', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setEditingConfig(null);
        setFormData({
          service_type: 'NEW_PAN',
          price: 0,
          is_active: true
        });
        fetchConfigs();
      } else {
        toast.error(data.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  // Handle edit
  const handleEdit = (config: PanCommissionConfig) => {
    setEditingConfig(config);
    setFormData({
      service_type: config.service_type,
      price: config.price,
      is_active: config.is_active
    });
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/pan-commission?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchConfigs();
      } else {
        toast.error(data.message || 'Failed to delete configuration');
      }
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Failed to delete configuration');
    }
  };

  const handleCancel = () => {
    setEditingConfig(null);
    setFormData({
      service_type: 'NEW_PAN',
      price: 0,
      is_active: true
    });
  };

  const fetchInspayBalance = async () => {
    setFetchingBalance(true);
    try {
      const response = await fetch('/api/admin/inspay-balance');
      const data = await response.json();

      if (data.success) {
        setInspayBalance(data.data.balance);
        setBalanceFetchedAt(data.data.fetchedAt);
        toast.success('PAN wallet balance fetched successfully');
      } else {
        toast.error(data.message || 'Failed to fetch PAN balance');
      }
    } catch (error) {
      console.error('Error fetching PAN balance:', error);
      toast.error('Failed to fetch PAN balance');
    } finally {
      setFetchingBalance(false);
    }
  };

  if (session?.user?.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 max-w-md">
            You don't have permission to access the administrative PAN configuration and tracking dashboard.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'NEW_PAN': return 'New PAN Application';
      case 'PAN_CORRECTION': return 'PAN Correction';
      case 'INCOMPLETE_PAN': return 'Incomplete PAN Resume';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SUCCESS':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 font-semibold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> SUCCESS</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 font-semibold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> PENDING</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 font-semibold flex items-center gap-1 w-fit"><RefreshCcw className="w-3 h-3 animate-spin-slow" /> PROCESSING</Badge>;
      case 'FAILURE':
      case 'FAILED':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200 font-semibold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> FAILURE</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 font-semibold w-fit">{status}</Badge>;
    }
  };

  const filteredApps = applications.filter(app =>
    app.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.mobile_number?.includes(searchQuery) ||
    app.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">
              PAN Administration
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              Real-time monitoring and configuration of PAN card services
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                fetchConfigs();
                fetchApplications();
              }}
              variant="outline"
              className="hover:bg-gray-50 border-gray-200"
            >
              <RefreshCcw className="w-4 h-4 mr-2" /> Refresh All
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                {loadingApps && <Clock className="w-4 h-4 text-gray-300 animate-spin" />}
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Applications</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.total}</h3>
              <p className="text-xs text-blue-600 font-semibold mt-2 flex items-center gap-1">
                Worth ₹{stats.total_amount.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                  <Clock className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="border-amber-200 text-amber-600">Wait</Badge>
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pending</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.pending + stats.processing}</h3>
              <p className="text-xs text-amber-600 font-semibold mt-2">Requires attention</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="border-emerald-200 text-emerald-600">Live</Badge>
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Successful</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.success}</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-2">Completed properly</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50/50 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-blue-600" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
                  <CreditCard className="w-6 h-6" />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 px-2 h-8"
                  onClick={fetchInspayBalance}
                  disabled={fetchingBalance}
                >
                  <RefreshCcw className={`w-3 h-3 ${fetchingBalance ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-xs font-bold text-blue-100 uppercase tracking-wider">API Wallet Balance</p>
              <h3 className="text-2xl font-black text-white mt-1">
                {inspayBalance !== null ? `₹${inspayBalance.toFixed(2)}` : '---'}
              </h3>
              <p className="text-[10px] text-blue-100/70 mt-3 font-mono">
                {balanceFetchedAt ? `Updated: ${new Date(balanceFetchedAt).toLocaleTimeString()}` : 'Fetch to view balance'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content - Applications List */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="border-none shadow-xl overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Recent Applications</CardTitle>
                    <CardDescription>Real-time stream of PAN service requests</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search order, user, mobile..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 border-gray-200 focus:ring-blue-500"
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-10 border-gray-200">
                          <Filter className="w-4 h-4 mr-2" /> Filter
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Status Filter</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setStatusFilter('ALL')}>All Statuses</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('PENDING')}>Pending</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('SUCCESS')}>Success</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('FAILURE')}>Failure</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Service Type</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setTypeFilter('ALL')}>All Types</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTypeFilter('NEW_PAN')}>New PAN</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTypeFilter('PAN_CORRECTION')}>Correction</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTypeFilter('INCOMPLETE_PAN')}>Incomplete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="font-bold text-gray-600">S.No.</TableHead>
                        <TableHead className="font-bold text-gray-600">Order & User</TableHead>
                        <TableHead className="font-bold text-gray-600">Service Type</TableHead>
                        <TableHead className="font-bold text-gray-600">Details</TableHead>
                        <TableHead className="font-bold text-gray-600">Status</TableHead>
                        <TableHead className="font-bold text-gray-600">Date/Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingApps ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={6} className="h-16 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : filteredApps.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center">
                              <AlertCircle className="w-8 h-8 text-gray-300 mb-2" />
                              <p>No applications found matching your criteria.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredApps.map((app, index) => (
                          <TableRow key={app.id} className="hover:bg-blue-50/30 transition-colors group">
                            <TableCell className="font-medium text-gray-400 group-hover:text-blue-600">
                              #{index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{app.order_id}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Users className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500 truncate max-w-[150px]">
                                    {app.user?.name || 'Unknown User'}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium px-2.5 py-1 bg-gray-100 rounded-lg text-gray-700">
                                {getServiceTypeLabel(app.service_type)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-xs space-y-0.5">
                                <span className="text-gray-900 font-semibold">₹{app.amount}</span>
                                <span className="text-gray-500">{app.mobile_number}</span>
                                {app.acknowledgement_number && (
                                  <span className="text-[10px] text-emerald-600 font-mono mt-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                    <CheckCircle2 className="w-2 h-2" /> {app.acknowledgement_number}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(app.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-[10px] text-gray-500 whitespace-nowrap">
                                <span className="font-bold">{new Date(app.created_at).toLocaleDateString()}</span>
                                <span>{new Date(app.created_at).toLocaleTimeString()}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Config & Management */}
          <div className="space-y-6">
            {/* Pricing Config Card */}
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Service Pricing
                </CardTitle>
                <CardDescription>Set the price for customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <div className="space-y-2">
                    <Label htmlFor="service_type" className="text-xs font-bold uppercase text-gray-500">Service Type</Label>
                    <select
                      id="service_type"
                      value={formData.service_type}
                      onChange={(e) => setFormData({ ...formData, service_type: e.target.value as any })}
                      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                      disabled={!!editingConfig}
                    >
                      <option value="NEW_PAN">New PAN Application</option>
                      <option value="PAN_CORRECTION">PAN Correction</option>
                      <option value="INCOMPLETE_PAN">Incomplete PAN Resume</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-xs font-bold uppercase text-gray-500">Price (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="pl-7 h-10 border-gray-200"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <Label htmlFor="is_active" className="text-xs font-bold uppercase text-gray-500">Service Active</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-md" disabled={savingConfig}>
                      {savingConfig ? '...' : editingConfig ? 'Update' : 'Save'}
                    </Button>
                    {editingConfig && (
                      <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>

                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold uppercase text-gray-400">Current prices</p>
                  {loadingConfigs ? (
                    <div className="h-20 flex items-center justify-center"><Clock className="w-5 h-5 animate-spin text-gray-300" /></div>
                  ) : configs.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No pricing configured yet.</p>
                  ) : (
                    configs.map(config => (
                      <div key={config.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-100 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{getServiceTypeLabel(config.service_type)}</p>
                          <p className="text-sm font-black text-blue-600 mt-0.5">₹{config.price}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(config)}>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(config.id)}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="border-none shadow-lg bg-emerald-50 text-emerald-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Real-time Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 leading-relaxed opacity-80">
                <p>Applications appearing here are updated in real-time. Failed transactions are usually due to insufficient API balance or invalid user data.</p>
                <div className="pt-2">
                  <p className="font-bold border-b border-emerald-200 pb-1 mb-2">Status Key:</p>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending: Payment done, waiting for processing</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Processing: In touch with NSDL API</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Success: Acknowledgement number generated</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
