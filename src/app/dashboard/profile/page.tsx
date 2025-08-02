'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { Lock, RefreshCw } from 'lucide-react';
import { showToast } from '@/lib/toast';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    dateOfBirth: '',
    gender: '',
    occupation: '',
    // Admin/Employee specific fields
    employeeId: '',
    department: '',
    branch: ''
  });

  useEffect(() => {
    if (session?.user && !loading) {
      fetchFreshProfileData();
    }
  }, [session?.user?.id]);

  if (!session) {
    return <div className="flex items-center justify-center min-h-screen text-gray-600 text-lg">Loading profile...</div>;
  }

  const user = session.user;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to fetch fresh profile data from database
  const fetchFreshProfileData = async (showRefreshingState = false) => {
    if (showRefreshingState) setRefreshing(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        const freshUser = responseData.data;

        //

        // Update session with fresh data
        await update({
          ...session,
          user: {
            ...session.user,
            name: freshUser.name,
            phone: freshUser.phone,
            address: freshUser.address,
            city: freshUser.city,
            state: freshUser.state,
            pincode: freshUser.pincode,
            date_of_birth: freshUser.date_of_birth,
            dateOfBirth: freshUser.date_of_birth,
            gender: freshUser.gender,
            occupation: freshUser.occupation,
            employee_id: freshUser.employee_id,
            department: freshUser.department,
            branch: freshUser.branch
          }
        });

        // Update form data with fresh data
        setFormData({
          name: freshUser.name || '',
          email: freshUser.email || '',
          phone: freshUser.phone || '',
          address: freshUser.address || '',
          city: freshUser.city || '',
          state: freshUser.state || '',
          pincode: freshUser.pincode || '',
          dateOfBirth: freshUser.date_of_birth || '',
          gender: freshUser.gender || '',
          occupation: freshUser.occupation || '',
          employeeId: freshUser.employee_id || '',
          department: freshUser.department || '',
          branch: freshUser.branch || ''
        });

        if (showRefreshingState) {
          showToast.success('Profile data refreshed successfully!');
        }

        return freshUser;
      }
    } catch (error) {
      //
      if (showRefreshingState) {
        showToast.error('Failed to refresh profile data');
      }
    } finally {
      if (showRefreshingState) setRefreshing(false);
    }
    return null;
  };

  const handleRefresh = () => {
    fetchFreshProfileData(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Prepare update data - include all fields for all roles
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        occupation: formData.occupation,
      };

      // Add admin/employee specific fields
      if (user.role === 'EMPLOYEE' || user.role === 'ADMIN') {
        updateData.employee_id = formData.employeeId;
        updateData.department = formData.department;
        updateData.branch = formData.branch;
      }

      //

      // Call API to update profile
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const responseData = await response.json();
      //

      // Wait a moment for database to be consistent
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch fresh data from database to ensure consistency
      const freshUser = await fetchFreshProfileData();

      if (freshUser) {
        setIsEditing(false);
        showToast.success('Profile updated successfully!');
      } else {
        throw new Error('Failed to fetch updated profile data');
      }
    } catch (error) {
      //
      showToast.error('Failed to update profile', {
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    // Fetch fresh data and reset form
    await fetchFreshProfileData();
    setIsEditing(false);
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-red-600';
      case UserRole.EMPLOYEE: return 'bg-red-500';
      case UserRole.RETAILER: return 'bg-red-700';
      default: return 'bg-gray-600';
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-red-100 text-red-600';
      case UserRole.EMPLOYEE: return 'bg-red-100 text-red-500';
      case UserRole.RETAILER: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-full ${getRoleColor(user.role)} flex items-center justify-center text-white text-2xl font-bold`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-indigo-100">{user.email}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getRoleBadgeColor(user.role)}`}>
                {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Manage your personal information and account details</CardDescription>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button
                      onClick={handleRefresh}
                      variant="outline"
                      disabled={refreshing}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button
                      onClick={() => setShowChangePassword(true)}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      ✏️ Edit Profile
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {loading ? 'Saving...' : '💾 Save'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={loading}
                    >
                      ❌ Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-gray-900">{user.name || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-gray-900">{user.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-gray-900">{user.dateOfBirth || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{user.gender || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-gray-900">{user.occupation || 'Not provided'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-gray-900">{user.address || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-gray-900">{user.city || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-gray-900">{user.state || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-gray-900">{user.pincode || 'Not provided'}</p>
                )}
              </div>

              {/* Admin/Employee specific fields */}
              {(user.role === 'ADMIN' || user.role === 'EMPLOYEE') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user.employeeId || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user.department || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="branch"
                        value={formData.branch}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    ) : (
                      <p className="text-gray-900">{(user as any).branch || formData.branch || 'Not provided'}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>View your account details and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <p className="text-gray-900 font-mono">{user.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                  {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                <p className="text-gray-900">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-600">
                  Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Only for Admin */}
        {user.role === UserRole.ADMIN && (
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <Button
                  onClick={() => setShowChangePassword(true)}
                  className="bg-red-600 hover:bg-red-700 text-white w-fit"
                >
                  🔒 Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </DashboardLayout>
  );
}
