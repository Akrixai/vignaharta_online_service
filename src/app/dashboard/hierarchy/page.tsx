'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole, EmployeeDesignation } from '@/types';

interface EmployeeNode {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  compensationType: string;
  territoryState?: string;
  territoryDistrict?: string;
  territoryArea?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  dateOfBirth?: string;
  gender?: string;
  employeeId?: string;
  department?: string;
  createdAt: string;
  isActive: boolean;
  children: EmployeeNode[];
}

export default function HierarchyPage() {
  const { data: session } = useSession();
  const [hierarchyData, setHierarchyData] = useState<EmployeeNode | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch hierarchy data
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/employees/hierarchy');
      const data = await response.json();
      
      if (data.success && data.hierarchy) {
        setHierarchyData(data.hierarchy);
        // Auto-expand the root node
        if (data.hierarchy.id) {
          setExpandedNodes(new Set([data.hierarchy.id]));
        }
      } else {
        console.error('Failed to fetch hierarchy:', data.error);
      }
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getDesignationIcon = (designation: string) => {
    switch (designation) {
      case 'ADMIN': return '👑';
      case 'MANAGER': return '👔';
      case 'STATE_MANAGER': return '🗺️';
      case 'DISTRICT_MANAGER': return '🏛️';
      case 'SUPERVISOR': return '👨‍💼';
      case 'DISTRIBUTOR': return '🏢';
      case 'EMPLOYEE': return '👤';
      case 'RETAILER': return '🏪';
      default: return '👤';
    }
  };

  const getDesignationColor = (designation: string) => {
    switch (designation) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-300';
      case 'MANAGER': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'STATE_MANAGER': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DISTRICT_MANAGER': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'SUPERVISOR': return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'DISTRIBUTOR': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'EMPLOYEE': return 'bg-green-100 text-green-800 border-green-300';
      case 'RETAILER': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const renderEmployeeNode = (node: EmployeeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="relative">
        {/* Connection Line */}
        {level > 0 && (
          <div className="absolute left-0 top-0 w-8 h-8 border-l-2 border-b-2 border-gray-300 rounded-bl-lg" />
        )}

        {/* Employee Card */}
        <div
          className={`ml-${level * 12} mb-4 transition-all duration-200 ${
            level > 0 ? 'ml-12' : ''
          }`}
        >
          <div
            onClick={() => setSelectedEmployee(node)}
            className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer border-2 ${
              selectedEmployee?.id === node.id ? 'border-purple-500 ring-4 ring-purple-200' : 'border-gray-200'
            }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {/* Expand/Collapse Button */}
                  {hasChildren && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNode(node.id);
                      }}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {isExpanded ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Employee Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getDesignationIcon(node.designation)}</span>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{node.name}</h3>
                        <p className="text-sm text-gray-600">{node.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Designation Badge */}
                  <div className={`px-4 py-2 rounded-full border-2 font-bold text-sm ${getDesignationColor(node.designation)}`}>
                    {node.designation.replace(/_/g, ' ')}
                  </div>

                  {/* Children Count */}
                  {hasChildren && (
                    <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                      {node.children.length} {node.children.length === 1 ? 'subordinate' : 'subordinates'}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <div className="mt-3 flex items-center space-x-6 text-sm text-gray-600">
                <span>📞 {node.phone}</span>
                {node.territoryState && <span>🗺️ {node.territoryState}</span>}
                {node.territoryDistrict && <span>🏛️ {node.territoryDistrict}</span>}
                {node.territoryArea && <span>📍 {node.territoryArea}</span>}
                <span className={`px-2 py-1 rounded ${node.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {node.isActive ? '✅ Active' : '❌ Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Children */}
          {hasChildren && isExpanded && (
            <div className="ml-8 mt-4 border-l-2 border-gray-300 pl-4">
              {node.children.map((child) => renderEmployeeNode(child, level + 1))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading hierarchy...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-3xl font-bold mb-2">🏢 Organizational Hierarchy</h1>
          <p className="text-purple-100">View and manage your team structure</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hierarchy Tree */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <CardTitle className="text-xl text-purple-900">Team Structure</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {hierarchyData ? (
                  <div className="space-y-4">
                    {renderEmployeeNode(hierarchyData)}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No hierarchy data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Employee Details Panel */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl sticky top-6">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="text-xl text-indigo-900">Employee Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {selectedEmployee ? (
                  <div className="space-y-4">
                    {/* Profile Header */}
                    <div className="text-center pb-4 border-b-2 border-gray-200">
                      <div className="text-6xl mb-3">{getDesignationIcon(selectedEmployee.designation)}</div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedEmployee.name}</h2>
                      <p className={`inline-block px-4 py-2 rounded-full mt-2 border-2 font-bold ${getDesignationColor(selectedEmployee.designation)}`}>
                        {selectedEmployee.designation.replace(/_/g, ' ')}
                      </p>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-gray-900 text-lg">📞 Contact Information</h3>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{selectedEmployee.email}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{selectedEmployee.phone}</p>
                      </div>
                    </div>

                    {/* Territory Information */}
                    {(selectedEmployee.territoryState || selectedEmployee.territoryDistrict || selectedEmployee.territoryArea) && (
                      <div className="space-y-3">
                        <h3 className="font-bold text-gray-900 text-lg">🗺️ Territory</h3>
                        {selectedEmployee.territoryState && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-blue-600">State</p>
                            <p className="font-medium text-blue-900">{selectedEmployee.territoryState}</p>
                          </div>
                        )}
                        {selectedEmployee.territoryDistrict && (
                          <div className="bg-indigo-50 p-3 rounded-lg">
                            <p className="text-sm text-indigo-600">District</p>
                            <p className="font-medium text-indigo-900">{selectedEmployee.territoryDistrict}</p>
                          </div>
                        )}
                        {selectedEmployee.territoryArea && (
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="text-sm text-purple-600">Area</p>
                            <p className="font-medium text-purple-900">{selectedEmployee.territoryArea}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Compensation */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-gray-900 text-lg">💰 Compensation</h3>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-green-600">Type</p>
                        <p className="font-medium text-green-900">
                          {selectedEmployee.compensationType === 'FIXED_SALARY' ? '💵 Fixed Salary' : '💰 Commission Based'}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-gray-900 text-lg">📊 Status</h3>
                      <div className={`p-3 rounded-lg ${selectedEmployee.isActive ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-sm ${selectedEmployee.isActive ? 'text-green-600' : 'text-red-600'}`}>Account Status</p>
                        <p className={`font-medium ${selectedEmployee.isActive ? 'text-green-900' : 'text-red-900'}`}>
                          {selectedEmployee.isActive ? '✅ Active' : '❌ Inactive'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Joined On</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedEmployee.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 space-y-2">
                      <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg">
                        📝 Edit Details
                      </button>
                      <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">
                        🖨️ Print Profile
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👤</div>
                    <p className="text-gray-500">Select an employee to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
