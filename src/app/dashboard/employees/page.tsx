  'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  role: string;
  territory_state?: string;
  territory_district?: string;
  territory_area?: string;
  employee_id?: string;
  department?: string;
  created_at: string;
  employee_hierarchy?: any;
}

const DESIGNATION_HIERARCHY: Record<string, string[]> = {
  'ADMIN': ['MANAGER', 'STATE_MANAGER', 'DISTRICT_MANAGER', 'SUPERVISOR', 'DISTRIBUTOR', 'EMPLOYEE', 'RETAILER'],
  'MANAGER': ['STATE_MANAGER', 'DISTRICT_MANAGER', 'SUPERVISOR', 'DISTRIBUTOR', 'EMPLOYEE', 'RETAILER'],
  'STATE_MANAGER': ['DISTRICT_MANAGER', 'SUPERVISOR', 'DISTRIBUTOR', 'EMPLOYEE', 'RETAILER'],
  'DISTRICT_MANAGER': ['SUPERVISOR', 'DISTRIBUTOR', 'EMPLOYEE', 'RETAILER'],
  'SUPERVISOR': ['EMPLOYEE', 'RETAILER'],
  'DISTRIBUTOR': ['EMPLOYEE', 'RETAILER'],
  'EMPLOYEE': ['RETAILER'],
  'RETAILER': []
};

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    designation: '',
    role: 'EMPLOYEE',
    territory_state: '',
    territory_district: '',
    territory_area: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    date_of_birth: '',
    gender: '',
    employee_id: '',
    department: ''
  });

  const userDesignation = (session?.user as any)?.designation || (session?.user?.role === 'ADMIN' ? 'ADMIN' : null);
  const allowedDesignations = userDesignation ? DESIGNATION_HIERARCHY[userDesignation] || [] : [];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees/list');
      const data = await response.json();
      
      if (data.success) {
        setEmployees(data.employees);
      } else {
        toast.error(data.error || 'Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.designation) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/employees/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Employee created successfully!');
        setShowCreateForm(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          designation: '',
          role: 'EMPLOYEE',
          territory_state: '',
          territory_district: '',
          territory_area: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          date_of_birth: '',
          gender: '',
          employee_id: '',
          department: ''
        });
        fetchEmployees();
      } else {
        toast.error(data.error || 'Failed to create employee');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Failed to create employee');
    } finally {
      setCreating(false);
    }
  };

  const getDesignationBadgeColor = (designation: string) => {
    const colors: Record<string, string> = {
      'MANAGER': 'bg-purple-100 text-purple-800',
      'STATE_MANAGER': 'bg-blue-100 text-blue-800',
      'DISTRICT_MANAGER': 'bg-green-100 text-green-800',
      'SUPERVISOR': 'bg-yellow-100 text-yellow-800',
      'DISTRIBUTOR': 'bg-orange-100 text-orange-800',
      'EMPLOYEE': 'bg-gray-100 text-gray-800',
      'RETAILER': 'bg-red-100 text-red-800'
    };
    return colors[designation] || 'bg-gray-100 text-gray-800';
  };

  if (!session) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-600 mt-1">Manage your team members and hierarchy</p>
            {userDesignation && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-500">Your Position:</span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  {userDesignation.replace('_', ' ')}
                </span>
                {allowedDesignations.length > 0 && (
                  <span className="text-sm text-gray-500">
                    • Can create: {allowedDesignations.length} designation{allowedDesignations.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
          {allowedDesignations.length > 0 && (
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {showCreateForm ? '✕ Cancel' : '+ Create Employee'}
            </Button>
          )}
        </div>

        {/* Hierarchy Info Card */}
        {allowedDesignations.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-900">📊 Your Hierarchy Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-700 font-medium">You can create:</span>
                {allowedDesignations.map((des) => {
                  const colors: Record<string, string> = {
                    'MANAGER': 'bg-purple-100 text-purple-800 border-purple-300',
                    'STATE_MANAGER': 'bg-blue-100 text-blue-800 border-blue-300',
                    'DISTRICT_MANAGER': 'bg-green-100 text-green-800 border-green-300',
                    'SUPERVISOR': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                    'DISTRIBUTOR': 'bg-orange-100 text-orange-800 border-orange-300',
                    'EMPLOYEE': 'bg-gray-100 text-gray-800 border-gray-300',
                    'RETAILER': 'bg-red-100 text-red-800 border-red-300'
                  };
                  const icons: Record<string, string> = {
                    'MANAGER': '👔',
                    'STATE_MANAGER': '🏛️',
                    'DISTRICT_MANAGER': '🏢',
                    'SUPERVISOR': '👨‍💼',
                    'DISTRIBUTOR': '📦',
                    'EMPLOYEE': '👤',
                    'RETAILER': '🏪'
                  };
                  return (
                    <span 
                      key={des}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${colors[des] || 'bg-gray-100 text-gray-800'}`}
                    >
                      <span>{icons[des]}</span>
                      <span>{des.replace('_', ' ')}</span>
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Employee Form */}
        {showCreateForm && (
          <Card className="border-2 border-indigo-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="text-indigo-900">Create New Employee</CardTitle>
              <CardDescription>Add a new team member to your organization</CardDescription>
              {formData.designation && (
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    formData.designation === 'MANAGER' ? 'bg-purple-100 text-purple-800' :
                    formData.designation === 'STATE_MANAGER' ? 'bg-blue-100 text-blue-800' :
                    formData.designation === 'DISTRICT_MANAGER' ? 'bg-green-100 text-green-800' :
                    formData.designation === 'SUPERVISOR' ? 'bg-yellow-100 text-yellow-800' :
                    formData.designation === 'DISTRIBUTOR' ? 'bg-orange-100 text-orange-800' :
                    formData.designation === 'EMPLOYEE' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    <span>Selected:</span>
                    <span className="font-bold">{formData.designation.replace('_', ' ')}</span>
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent className="bg-white">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="designation">Designation *</Label>
                    <Select
                      value={formData.designation}
                      onValueChange={(value) => setFormData({ ...formData, designation: value })}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedDesignations.map((des) => {
                          const colors: Record<string, string> = {
                            'MANAGER': 'bg-purple-50 hover:bg-purple-100 text-purple-900',
                            'STATE_MANAGER': 'bg-blue-50 hover:bg-blue-100 text-blue-900',
                            'DISTRICT_MANAGER': 'bg-green-50 hover:bg-green-100 text-green-900',
                            'SUPERVISOR': 'bg-yellow-50 hover:bg-yellow-100 text-yellow-900',
                            'DISTRIBUTOR': 'bg-orange-50 hover:bg-orange-100 text-orange-900',
                            'EMPLOYEE': 'bg-gray-50 hover:bg-gray-100 text-gray-900',
                            'RETAILER': 'bg-red-50 hover:bg-red-100 text-red-900'
                          };
                          const icons: Record<string, string> = {
                            'MANAGER': '👔',
                            'STATE_MANAGER': '🏛️',
                            'DISTRICT_MANAGER': '🏢',
                            'SUPERVISOR': '👨‍💼',
                            'DISTRIBUTOR': '📦',
                            'EMPLOYEE': '👤',
                            'RETAILER': '🏪'
                          };
                          return (
                            <SelectItem 
                              key={des} 
                              value={des}
                              className={colors[des] || 'bg-gray-50'}
                            >
                              <span className="flex items-center gap-2">
                                <span>{icons[des]}</span>
                                <span>{des.replace('_', ' ')}</span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="employee_id">Employee ID</Label>
                    <Input
                      id="employee_id"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="territory_state">Territory State</Label>
                    <Input
                      id="territory_state"
                      value={formData.territory_state}
                      onChange={(e) => setFormData({ ...formData, territory_state: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="territory_district">Territory District</Label>
                    <Input
                      id="territory_district"
                      value={formData.territory_district}
                      onChange={(e) => setFormData({ ...formData, territory_district: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="territory_area">Territory Area</Label>
                    <Input
                      id="territory_area"
                      value={formData.territory_area}
                      onChange={(e) => setFormData({ ...formData, territory_area: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="6-digit pincode"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Employee'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Employees List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Team Members</CardTitle>
            <CardDescription>Employees you have created</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading employees...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No employees found. Create your first team member!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Territory</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{employee.name}</div>
                          {employee.employee_id && (
                            <div className="text-xs text-gray-500">ID: {employee.employee_id}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {employee.email}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {employee.phone || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDesignationBadgeColor(employee.designation)}`}>
                            {employee.designation.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {employee.territory_state && (
                            <div>{employee.territory_state}</div>
                          )}
                          {employee.territory_district && (
                            <div className="text-xs text-gray-500">{employee.territory_district}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {new Date(employee.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
