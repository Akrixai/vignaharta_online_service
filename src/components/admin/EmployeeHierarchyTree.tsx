'use client';

import { useState, useEffect } from 'react';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  role: string;
  is_active: boolean;
}

interface HierarchyNode {
  id: string;
  employee_id: string;
  parent_id: string | null;
  designation: string;
  level: number;
  territory_state: string;
  territory_district: string;
  territory_area: string;
  employee: Employee;
  children: HierarchyNode[];
}

interface EmployeeHierarchyTreeProps {
  showOnlyMyTeam?: boolean;
}

export default function EmployeeHierarchyTree({ showOnlyMyTeam = false }: EmployeeHierarchyTreeProps) {
  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHierarchy();
  }, [showOnlyMyTeam]);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = showOnlyMyTeam 
        ? '/api/employees/hierarchy?my_team=true'
        : '/api/employees/hierarchy';
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setHierarchy(data.hierarchy || []);
      
      // Auto-expand first level
      const firstLevel = new Set(data.hierarchy?.map((n: HierarchyNode) => n.employee_id) || []);
      setExpandedNodes(firstLevel);
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const getDesignationColor = (designation: string) => {
    switch (designation) {
      case 'STATE_MANAGER':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'DISTRICT_MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'SUPERVISOR':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'EMPLOYEE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'RETAILER':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDesignationIcon = (designation: string) => {
    switch (designation) {
      case 'STATE_MANAGER':
        return '👑';
      case 'DISTRICT_MANAGER':
        return '🏛️';
      case 'SUPERVISOR':
        return '👨‍💼';
      case 'EMPLOYEE':
        return '👤';
      case 'RETAILER':
        return '🏪';
      default:
        return '👤';
    }
  };

  const renderNode = (node: HierarchyNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.employee_id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="relative">
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border-2 ${getDesignationColor(node.designation)} hover:shadow-md transition-shadow`}
          style={{ marginLeft: `${depth * 40}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.employee_id)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white border-2 border-current hover:bg-gray-50"
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          {/* Employee Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{getDesignationIcon(node.designation)}</span>
              <h3 className="font-bold text-lg truncate">{node.employee.name}</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-white border border-current">
                {node.designation.replace('_', ' ')}
              </span>
            </div>
            
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span>📧</span>
                <span className="truncate">{node.employee.email}</span>
              </div>
              {node.employee.phone && (
                <div className="flex items-center gap-2">
                  <span>📱</span>
                  <span>{node.employee.phone}</span>
                </div>
              )}
              {node.territory_state && (
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>
                    {node.territory_state}
                    {node.territory_district && `, ${node.territory_district}`}
                    {node.territory_area && `, ${node.territory_area}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          {hasChildren && (
            <div className="flex-shrink-0 text-center">
              <div className="text-2xl font-bold">{node.children.length}</div>
              <div className="text-xs">Subordinates</div>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading employee hierarchy...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Employee Hierarchy</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setExpandedNodes(new Set(getAllNodeIds(hierarchy)))}
              className="text-sm text-orange-600 hover:text-orange-800"
            >
              Expand All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => setExpandedNodes(new Set())}
              className="text-sm text-orange-600 hover:text-orange-800"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Designation Levels:</h3>
          <div className="flex flex-wrap gap-2">
            {['STATE_MANAGER', 'DISTRICT_MANAGER', 'SUPERVISOR', 'EMPLOYEE', 'RETAILER'].map(designation => (
              <div
                key={designation}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border-2 ${getDesignationColor(designation)}`}
              >
                <span>{getDesignationIcon(designation)}</span>
                <span>{designation.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tree */}
        <div className="space-y-4">
          {hierarchy.length > 0 ? (
            hierarchy.map(node => renderNode(node))
          ) : (
            <div className="text-center py-12 text-gray-500">
              No employees found in hierarchy
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getAllNodeIds(nodes: HierarchyNode[]): string[] {
  const ids: string[] = [];
  
  function traverse(node: HierarchyNode) {
    ids.push(node.employee_id);
    if (node.children) {
      node.children.forEach(traverse);
    }
  }
  
  nodes.forEach(traverse);
  return ids;
}
