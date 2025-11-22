'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeDesignation, CompensationType } from '@/types';
import { showToast } from '@/lib/toast';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  territory_state?: string;
  territory_district?: string;
  territory_area?: string;
  is_active: boolean;
  created_at: string;
}

export default function EmployeeManagementPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    designation: '',
    territoryState: '',
    territoryDistrict: '',
    territoryArea: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    dateOfBirth: '',
    gender: '',
    employeeId: '',
    department: ''
  });
  
  const [documents, setDocuments] = useState({
    aadhar: null as File | null,
    pancard: null as File | null,
    photo: null as File | null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchEmployees();
    }
  }, [activeTab]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/employees/list');
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (type: 'aadhar' | 'pancard' | 'photo', file: File | null) => {
    setDocuments(prev => ({ ...prev, [type]: file }));
  };

  const uploadDocument = async (file: File, userId: string, documentType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('documentType', documentType);

    const response = await fetch('/api/employees/documents/upload', {
      method: 'POST',
      body: formData
    });

    return response.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create employee
      const response = await fetch('/api/employees/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.id}`
        },
        body: JSON.stringify({
          ...formData,
          role: 'EMPLOYEE',
          territory_state: formData.territoryState,
          territory_district: formData.territoryDistrict,
          territory_area: formData.territoryArea,
          date_of_birth: formData.dateOfBirth,
          employee_id: formData.employeeId
        })
      });

      const data = await response.json();

      if (data.user) {
        // Upload documents
        const uploadPromises = [];
        if (documents.aadhar) {
          uploadPromises.push(uploadDocument(documents.aadhar, data.user.id, 'AADHAR'));
        }
        if (documents.pancard) {
          uploadPromises.push(uploadDocument(documents.pancard, data.user.id, 'PANCARD'));
        }
        if (documents.photo) {
          uploadPromises.push(uploadDocument(documents.photo, data.user.id, 'PHOTO'));
        }

        await Promise.all(uploadPromises);

        showToast.success('Employee created successfully!', {
          description: 'Registration form is ready to print.'
        });
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          designation: '',
          territoryState: '',
          territoryDistrict: '',
          territoryArea: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          dateOfBirth: '',
          gender: '',
          employeeId: '',
          department: ''
        });
        setDocuments({ aadhar: null, pancard: null, photo: null });
      } else {
        showToast.error('Failed to create employee', {
          description: data.error || 'Please try again'
        });
      }
    } catch (error) {
      showToast.error('Error creating employee', {
        description: 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintRegistration = () => {
    window.print();
  };

  const getDesignationBadge = (designation: string) => {
    const badges: Record<string, { icon: string; color: string }> = {
      'MANAGER': { icon: '👔', color: 'bg-purple-100 text-purple-800' },
      'STATE_MANAGER': { icon: '🗺️', color: 'bg-blue-100 text-blue-800' },
      'DISTRICT_MANAGER': { icon: '🏛️', color: 'bg-indigo-100 text-indigo-800' },
      'SUPERVISOR': { icon: '👨‍💼', color: 'bg-teal-100 text-teal-800' },
      'DISTRIBUTOR': { icon: '🏢', color: 'bg-amber-100 text-amber-800' },
      'EMPLOYEE': { icon: '👤', color: 'bg-green-100 text-green-800' }
    };
    const badge = badges[designation] || { icon: '👤', color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-bold ${badge.color}`}>
        {badge.icon} {designation?.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-3xl font-bold mb-2">Employee Management</h1>
          <p className="text-purple-100">Create and manage employees across all hierarchy levels</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'create'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ➕ Create Employee
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'list'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Employee List
          </button>
        </div>

        {/* Create Employee Form */}
        {activeTab === 'create' && (
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
              <CardTitle className="text-2xl text-purple-900">Create New Employee</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Designation Selection */}
                <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                  <h3 className="text-lg font-bold text-purple-900 mb-4">Designation & Hierarchy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Designation <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select Designation</option>
                        <option value="MANAGER">👔 Manager (Company Level)</option>
                        <option value="STATE_MANAGER">🗺️ State Manager</option>
                        <option value="DISTRICT_MANAGER">🏛️ District Manager</option>
                        <option value="SUPERVISOR">👨‍💼 Supervisor</option>
                        <option value="DISTRIBUTOR">🏢 Distributor (Commission-based)</option>
                        <option value="EMPLOYEE">👤 Employee</option>
                        <option value="RETAILER">🏪 Retailer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="10-digit mobile number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Minimum 8 characters"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Documents Upload */}
                <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
                  <h3 className="text-lg font-bold text-yellow-900 mb-4">📄 Documents Upload</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aadhar Card <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        required
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange('aadhar', e.target.files?.[0] || null)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                      {documents.aadhar && (
                        <p className="text-sm text-green-600 mt-1">✓ {documents.aadhar.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Card <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        required
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange('pancard', e.target.files?.[0] || null)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                      {documents.pancard && (
                        <p className="text-sm text-green-600 mt-1">✓ {documents.pancard.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        required
                        accept="image/*"
                        onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                      {documents.photo && (
                        <p className="text-sm text-green-600 mt-1">✓ {documents.photo.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Territory Information - Conditional */}
                {(formData.designation === 'MANAGER' ||
                  formData.designation === 'STATE_MANAGER' ||
                  formData.designation === 'DISTRICT_MANAGER' ||
                  formData.designation === 'SUPERVISOR') && (
                  <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                    <h3 className="text-lg font-bold text-green-900 mb-4">Territory Assignment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {(formData.designation === 'MANAGER' ||
                        formData.designation === 'STATE_MANAGER' ||
                        formData.designation === 'DISTRICT_MANAGER' ||
                        formData.designation === 'SUPERVISOR') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State {formData.designation === 'STATE_MANAGER' && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            required={formData.designation === 'STATE_MANAGER'}
                            value={formData.territoryState}
                            onChange={(e) => setFormData({ ...formData, territoryState: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., Maharashtra"
                          />
                        </div>
                      )}

                      {(formData.designation === 'DISTRICT_MANAGER' ||
                        formData.designation === 'SUPERVISOR') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            District {formData.designation === 'DISTRICT_MANAGER' && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            required={formData.designation === 'DISTRICT_MANAGER'}
                            value={formData.territoryDistrict}
                            onChange={(e) => setFormData({ ...formData, territoryDistrict: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., Pune"
                          />
                        </div>
                      )}

                      {formData.designation === 'SUPERVISOR' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Area <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.territoryArea}
                            onChange={(e) => setFormData({ ...formData, territoryArea: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., Kothrud"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Address Information */}
                <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
                  <h3 className="text-lg font-bold text-orange-900 mb-4">Address Details</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Address
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter complete address"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="City"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="State"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                        <input
                          type="text"
                          pattern="[0-9]{6}"
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="6-digit pincode"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  >
                    {isSubmitting ? 'Creating Employee...' : '✅ Create Employee'}
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintRegistration}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all shadow-lg"
                  >
                    🖨️ Print Form
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Employee List */}
        {activeTab === 'list' && (
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
              <CardTitle className="text-2xl text-purple-900">All Employees ({employees.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading employees...</p>
                </div>
              ) : employees.length > 0 ? (
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{employee.name}</h3>
                              <p className="text-sm text-gray-600">{employee.email}</p>
                              <p className="text-sm text-gray-600">📞 {employee.phone}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center space-x-4">
                            {employee.designation && getDesignationBadge(employee.designation)}
                            {employee.territory_state && (
                              <span className="text-sm text-gray-600">🗺️ {employee.territory_state}</span>
                            )}
                            {employee.territory_district && (
                              <span className="text-sm text-gray-600">🏛️ {employee.territory_district}</span>
                            )}
                            {employee.territory_area && (
                              <span className="text-sm text-gray-600">📍 {employee.territory_area}</span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {employee.is_active ? '✅ Active' : '❌ Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Joined</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(employee.created_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <p className="text-gray-500">No employees found</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
