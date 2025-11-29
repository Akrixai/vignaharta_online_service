'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createPortal } from 'react-dom';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

interface EmployeeDocument {
  id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

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
  branch?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  date_of_birth?: string;
  gender?: string;
  created_at: string;
  documents: EmployeeDocument[];
}

export default function AllEmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchAllEmployees();
    }
  }, [session]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone?.includes(searchTerm) ||
        emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchTerm, employees]);

  const fetchAllEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/employees/all');
      const data = await response.json();
      
      if (data.success) {
        setEmployees(data.employees);
        setFilteredEmployees(data.employees);
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

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
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

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'AADHAR': 'Aadhar Card',
      'PANCARD': 'PAN Card',
      'PHOTO': 'Photo',
      'IMAGE': 'Other Document'
    };
    return labels[type] || type;
  };

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">Access Denied. Admin only.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Employees & Documents</h1>
            <p className="text-gray-600 mt-1">Complete employee database with real-time document access</p>
          </div>
          <Button 
            onClick={fetchAllEmployees}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            🔄 Refresh
          </Button>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by name, email, phone, or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="text-sm text-gray-600">
                {filteredEmployees.length} of {employees.length} employees
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employees List */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
            <CardDescription>All employees with their complete details and documents</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading employees...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{searchTerm ? 'No employees found matching your search.' : 'No employees found.'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name & ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Territory</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{employee.name}</div>
                          {employee.employee_id && (
                            <div className="text-xs text-gray-500">ID: {employee.employee_id}</div>
                          )}
                          {employee.department && (
                            <div className="text-xs text-gray-500">Dept: {employee.department}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{employee.email}</div>
                          {employee.phone && (
                            <div className="text-xs text-gray-500">📞 {employee.phone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDesignationBadgeColor(employee.designation)}`}>
                            {employee.designation?.replace('_', ' ') || 'N/A'}
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
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {employee.documents && employee.documents.length > 0 ? (
                              employee.documents.map((doc) => (
                                <a
                                  key={doc.id}
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                                  title={`View ${getDocumentTypeLabel(doc.document_type)}`}
                                >
                                  📄 {doc.document_type}
                                </a>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">No documents</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Button
                            onClick={() => handleViewDetails(employee)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            View Full Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee Details Modal */}
        {mounted && showDetailsModal && selectedEmployee && createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedEmployee.name}</h2>
                    <p className="text-indigo-100 mt-1">Complete Employee Profile</p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-white hover:text-gray-200 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">👤 Basic Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-base font-semibold">{selectedEmployee.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-base">{selectedEmployee.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-base">{selectedEmployee.phone || '-'}</p>
                    </div>
                    {selectedEmployee.employee_id && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Employee ID</label>
                        <p className="text-base font-mono">{selectedEmployee.employee_id}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Designation</label>
                      <p className="text-base">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDesignationBadgeColor(selectedEmployee.designation)}`}>
                          {selectedEmployee.designation?.replace('_', ' ') || 'N/A'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Role</label>
                      <p className="text-base">{selectedEmployee.role}</p>
                    </div>
                    {selectedEmployee.department && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Department</label>
                        <p className="text-base">{selectedEmployee.department}</p>
                      </div>
                    )}
                    {selectedEmployee.branch && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Branch</label>
                        <p className="text-base">{selectedEmployee.branch}</p>
                      </div>
                    )}
                    {selectedEmployee.gender && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Gender</label>
                        <p className="text-base">{selectedEmployee.gender}</p>
                      </div>
                    )}
                    {selectedEmployee.date_of_birth && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="text-base">{new Date(selectedEmployee.date_of_birth).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Territory Information */}
                {(selectedEmployee.territory_state || selectedEmployee.territory_district || selectedEmployee.territory_area) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">🗺️ Territory Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedEmployee.territory_state && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">State</label>
                          <p className="text-base">{selectedEmployee.territory_state}</p>
                        </div>
                      )}
                      {selectedEmployee.territory_district && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">District</label>
                          <p className="text-base">{selectedEmployee.territory_district}</p>
                        </div>
                      )}
                      {selectedEmployee.territory_area && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Area</label>
                          <p className="text-base">{selectedEmployee.territory_area}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Address Information */}
                {(selectedEmployee.address || selectedEmployee.city || selectedEmployee.state || selectedEmployee.pincode) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">📍 Address Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedEmployee.address && (
                        <div className="col-span-2 md:col-span-3">
                          <label className="text-sm font-medium text-gray-500">Address</label>
                          <p className="text-base">{selectedEmployee.address}</p>
                        </div>
                      )}
                      {selectedEmployee.city && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">City</label>
                          <p className="text-base">{selectedEmployee.city}</p>
                        </div>
                      )}
                      {selectedEmployee.state && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">State</label>
                          <p className="text-base">{selectedEmployee.state}</p>
                        </div>
                      )}
                      {selectedEmployee.pincode && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Pincode</label>
                          <p className="text-base">{selectedEmployee.pincode}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">📄 Employee Documents</h3>
                  {selectedEmployee.documents && selectedEmployee.documents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedEmployee.documents.map((doc) => (
                        <div key={doc.id} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{getDocumentTypeLabel(doc.document_type)}</p>
                              <p className="text-xs text-gray-600 mt-1">{doc.file_name}</p>
                            </div>
                            <span className="text-2xl">📄</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">
                            Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                          >
                            View Document →
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No documents uploaded yet</p>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">ℹ️ System Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created At</label>
                      <p className="text-base">{new Date(selectedEmployee.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">User ID</label>
                      <p className="text-base font-mono text-xs">{selectedEmployee.id}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => setShowDetailsModal(false)} variant="outline">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </DashboardLayout>
  );
}
