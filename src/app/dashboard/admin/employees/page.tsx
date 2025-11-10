'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
// import { useRealTimeData } from '@/hooks/useRealTimeData';
import { Users, Plus, Edit, Trash2, Mail, Phone, Calendar, Building, Eye } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  employee_id: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
}

interface EmployeeDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
}

export default function EmployeesManagementPage() {
  const { data: session } = useSession();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    employee_id: '',
    department: ''
  });
  const [documentFiles, setDocumentFiles] = useState({
    aadhar: null as File | null,
    pancard: null as File | null,
    photo: null as File | null,
  });
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [employeeDocs, setEmployeeDocs] = useState<EmployeeDocument[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);


  // Fetch employees from backend API
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const refresh = async () => {
    setEmployeesLoading(true);
    try {
      const res = await fetch('/api/admin/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data || []);
      } else {
        setEmployees([]);
      }
    } catch {
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };
  useEffect(() => {
    if (session?.user?.role === UserRole.ADMIN) {
      refresh();
    }
  }, [session?.user?.role]);

  if (!session || session.user.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingEmployee ? `/api/admin/employees/${editingEmployee.id}` : '/api/admin/employees';
      const method = editingEmployee ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save employee');
      }

      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        employee_id: '',
        department: ''
      });
      setShowAddModal(false);
      setEditingEmployee(null);
      refresh();

      if (!editingEmployee && response.ok) {
        const employee = await response.json();
        if (documentFiles.aadhar && documentFiles.pancard && documentFiles.photo) {
          const formData = new FormData();
          formData.append('aadhar', documentFiles.aadhar);
          formData.append('pancard', documentFiles.pancard);
          formData.append('photo', documentFiles.photo);
          const docRes = await fetch(`/api/admin/employees/${employee.id}/documents`, {
            method: 'POST',
            body: formData,
          });
          if (!docRes.ok) {
            showToast.error('Failed to upload employee documents');
          }
        }
      }
    } catch (error) {
      showToast.error('Failed to save employee', {
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      password: '', // Don't pre-fill password
      employee_id: employee.employee_id || '',
      department: employee.department || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (employeeId: string) => {
    // Use custom toast confirmation instead of browser confirm
    showToast.custom('Delete employee?', 'warning', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          await performDelete(employeeId);
        }
      }
    });
  };

  const performDelete = async (employeeId: string) => {

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      refresh();
    } catch (error) {
      showToast.error('Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (employeeId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/employees/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update employee status');
      }

      refresh();
    } catch (error) {
      showToast.error('Failed to update employee status', {
        description: 'Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Add function to fetch employee documents
  const fetchEmployeeDocuments = async (employee: Employee) => {
    setDocsLoading(true);
    setSelectedEmployee(employee);
    setShowDocsModal(true);
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}/documents`);
      const data = await res.json();
      setEmployeeDocs(data.documents || []);
    } catch (err) {
      setEmployeeDocs([]);
    } finally {
      setDocsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-600">Manage employees and their access</p>
          </div>
          <Button
            onClick={() => {
              setEditingEmployee(null);
              setFormData({
                name: '',
                email: '',
                phone: '',
                password: '',
                employee_id: '',
                department: ''
              });
              setShowAddModal(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{employees?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {employees?.filter(e => e.is_active).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {employees?.filter(e => !e.is_active).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employees List */}
        <Card>
          <CardHeader>
            <CardTitle>All Employees</CardTitle>
            <CardDescription>View and manage employee accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {employeesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading employees...</p>
              </div>
            ) : employees && employees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">ID: {employee.employee_id || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {employee.email}
                          </div>
                          {employee.phone && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {employee.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {employee.department || 'Not assigned'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            employee.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            onClick={() => handleEdit(employee)}
                            size="sm"
                            variant="outline"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => toggleStatus(employee.id, employee.is_active)}
                            size="sm"
                            variant="outline"
                            className={employee.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                          >
                            {employee.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            onClick={() => handleDelete(employee.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => fetchEmployeeDocuments(employee)}
                            size="sm"
                            variant="outline"
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <Eye className="w-4 h-4" />
                            View Documents
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No employees found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-xl font-semibold mb-4">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {!editingEmployee && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required={!editingEmployee}
                    minLength={6}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Card (PDF/JPG/PNG)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setDocumentFiles(prev => ({ ...prev, aadhar: e.target.files?.[0] || null }))}
                  required={!editingEmployee}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Card (PDF/JPG/PNG)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setDocumentFiles(prev => ({ ...prev, pancard: e.target.files?.[0] || null }))}
                  required={!editingEmployee}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo (JPG/PNG)</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={e => setDocumentFiles(prev => ({ ...prev, photo: e.target.files?.[0] || null }))}
                  required={!editingEmployee}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? 'Saving...' : (editingEmployee ? 'Update' : 'Add Employee')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Documents Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Employee Documents</h2>
                  <p className="text-blue-100 mt-1">{selectedEmployee?.name}</p>
                </div>
                <button
                  onClick={() => setShowDocsModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {docsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                  <p className="text-gray-600 mt-4 text-lg">Loading documents...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {['AADHAR', 'PANCARD', 'PHOTO', 'IMAGE'].map(type => {
                    const doc = employeeDocs.find(d => d.document_type === type);
                    return (
                      <div key={type} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                doc ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {type === 'AADHAR' && (
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-6 0m6 0a3.001 3.001 0 016 0m6 0v1a2 2 0 01-2 2H9a2 2 0 01-2-2v-1m8-5a2 2 0 100-4 2 2 0 000 4z" />
                                  </svg>
                                )}
                                {type === 'PANCARD' && (
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                )}
                                {(type === 'PHOTO' || type === 'IMAGE') && (
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{type}</h3>
                              {doc ? (
                                <div className="text-sm text-gray-600">
                                  <p>{doc.file_name}</p>
                                  <p className="text-xs">{(doc.file_size / 1024).toFixed(1)} KB • {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400">Not uploaded</p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {doc ? (
                              <>
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View
                                </a>
                                <a
                                  href={doc.file_url}
                                  download={doc.file_name}
                                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Download
                                </a>
                              </>
                            ) : (
                              <span className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Not Available
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {employeeDocs.length > 0 ? (
                    <span>{employeeDocs.length} document{employeeDocs.length !== 1 ? 's' : ''} uploaded</span>
                  ) : (
                    <span>No documents uploaded yet</span>
                  )}
                </div>
                <Button
                  onClick={() => setShowDocsModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
