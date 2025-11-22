'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

interface HierarchyNode {
  id: string;
  name: string;
  email: string;
  phone?: string;
  designation: string;
  role: string;
  territory_state?: string;
  territory_district?: string;
  territory_area?: string;
  employee_id?: string;
  department?: string;
  created_at: string;
  children: HierarchyNode[];
  childCount: number;
  employee_hierarchy?: any;
}

export default function OrganizationHierarchyPage() {
  const { data: session } = useSession();
  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees/hierarchy');
      const data = await response.json();
      
      if (data.success) {
        setHierarchy(data.hierarchy);
        setCurrentUser(data.currentUser);
        setTotalEmployees(data.totalEmployees);
        // Auto-expand first level
        const firstLevelIds = data.hierarchy.map((node: HierarchyNode) => node.id);
        setExpandedNodes(new Set(firstLevelIds));
      } else {
        toast.error(data.error || 'Failed to fetch hierarchy');
      }
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
      toast.error('Failed to fetch hierarchy');
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

  const getDesignationColor = (designation: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
      'MANAGER': { bg: 'bg-gradient-to-br from-purple-500 to-purple-700', border: 'border-purple-400', text: 'text-white', shadow: 'shadow-purple-200' },
      'STATE_MANAGER': { bg: 'bg-gradient-to-br from-blue-500 to-blue-700', border: 'border-blue-400', text: 'text-white', shadow: 'shadow-blue-200' },
      'DISTRICT_MANAGER': { bg: 'bg-gradient-to-br from-green-500 to-green-700', border: 'border-green-400', text: 'text-white', shadow: 'shadow-green-200' },
      'SUPERVISOR': { bg: 'bg-gradient-to-br from-yellow-500 to-yellow-700', border: 'border-yellow-400', text: 'text-white', shadow: 'shadow-yellow-200' },
      'DISTRIBUTOR': { bg: 'bg-gradient-to-br from-orange-500 to-orange-700', border: 'border-orange-400', text: 'text-white', shadow: 'shadow-orange-200' },
      'EMPLOYEE': { bg: 'bg-gradient-to-br from-gray-500 to-gray-700', border: 'border-gray-400', text: 'text-white', shadow: 'shadow-gray-200' },
      'RETAILER': { bg: 'bg-gradient-to-br from-red-500 to-red-700', border: 'border-red-400', text: 'text-white', shadow: 'shadow-red-200' }
    };
    return colors[designation] || colors['EMPLOYEE'];
  };

  const getDesignationIcon = (designation: string) => {
    const icons: Record<string, string> = {
      'MANAGER': '👔',
      'STATE_MANAGER': '🏛️',
      'DISTRICT_MANAGER': '🏢',
      'SUPERVISOR': '👨‍💼',
      'DISTRIBUTOR': '📦',
      'EMPLOYEE': '👤',
      'RETAILER': '🏪'
    };
    return icons[designation] || '👤';
  };

  const renderHierarchyNode = (node: HierarchyNode, level: number = 0, isLast: boolean = false) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const colors = getDesignationColor(node.designation);
    const isHovered = hoveredNode === node.id;

    return (
      <div key={node.id} className="relative">
        {/* Connecting Lines */}
        {level > 0 && (
          <>
            {/* Horizontal line */}
            <div 
              className="absolute left-0 top-1/2 w-8 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400"
              style={{ left: `${(level - 1) * 60 + 30}px` }}
            />
            {/* Vertical line */}
            {!isLast && (
              <div 
                className="absolute top-1/2 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 to-gray-400"
                style={{ left: `${(level - 1) * 60 + 30}px` }}
              />
            )}
          </>
        )}

        {/* Node Card */}
        <div 
          className={`relative transition-all duration-300 ${level > 0 ? 'ml-16' : ''}`}
          style={{ marginLeft: level > 0 ? `${level * 60}px` : '0' }}
        >
          <div
            className={`
              group relative rounded-xl border-2 ${colors.border} ${colors.bg} ${colors.shadow}
              shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer
              transform hover:scale-105 hover:-translate-y-1
              ${isHovered ? 'ring-4 ring-offset-2 ring-indigo-400' : ''}
            `}
            onClick={() => hasChildren && toggleNode(node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Main Content */}
            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* Icon & Expand Button */}
                <div className="flex flex-col items-center gap-2">
                  <div className="text-4xl animate-bounce-slow">
                    {getDesignationIcon(node.designation)}
                  </div>
                  {hasChildren && (
                    <button 
                      className={`
                        w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm
                        flex items-center justify-center text-white font-bold
                        hover:bg-white/30 transition-all duration-200
                        ${isExpanded ? 'rotate-180' : 'rotate-0'}
                      `}
                    >
                      ▼
                    </button>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-lg font-bold ${colors.text} truncate`}>
                      {node.name}
                    </h3>
                    {node.employee_id && (
                      <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                        #{node.employee_id}
                      </span>
                    )}
                  </div>
                  
                  <div className={`text-sm ${colors.text} opacity-90 mb-2`}>
                    {node.email}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800">
                      {node.designation.replace('_', ' ')}
                    </span>
                    
                    {node.department && (
                      <span className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs text-gray-700">
                        🏢 {node.department}
                      </span>
                    )}
                    
                    {hasChildren && (
                      <span className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-indigo-700">
                        👥 {node.childCount} Team Member{node.childCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Hover Details Tooltip */}
            {isHovered && (
              <div className="absolute left-full top-0 ml-4 z-50 w-80 animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b">
                    <div className="text-3xl">{getDesignationIcon(node.designation)}</div>
                    <div>
                      <h4 className="font-bold text-gray-900">{node.name}</h4>
                      <p className="text-xs text-gray-500">{node.designation.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 font-medium min-w-[80px]">📧 Email:</span>
                      <span className="text-gray-900 break-all">{node.email}</span>
                    </div>
                    
                    {node.phone && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">📱 Phone:</span>
                        <span className="text-gray-900">{node.phone}</span>
                      </div>
                    )}
                    
                    {node.employee_id && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">🆔 ID:</span>
                        <span className="text-gray-900">{node.employee_id}</span>
                      </div>
                    )}
                    
                    {node.department && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">🏢 Dept:</span>
                        <span className="text-gray-900">{node.department}</span>
                      </div>
                    )}
                    
                    {node.territory_state && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">📍 Territory:</span>
                        <div className="text-gray-900">
                          <div>{node.territory_state}</div>
                          {node.territory_district && (
                            <div className="text-xs text-gray-600">{node.territory_district}</div>
                          )}
                          {node.territory_area && (
                            <div className="text-xs text-gray-500">{node.territory_area}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 font-medium min-w-[80px]">📅 Joined:</span>
                      <span className="text-gray-900">
                        {new Date(node.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    {hasChildren && (
                      <div className="flex items-start gap-2 pt-2 border-t">
                        <span className="text-gray-500 font-medium min-w-[80px]">👥 Team:</span>
                        <span className="text-indigo-600 font-bold">{node.childCount} Direct Report{node.childCount !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="mt-4 space-y-4 relative">
            {/* Vertical connector line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 via-gray-400 to-transparent"
              style={{ left: `${level * 60 + 30}px` }}
            />
            {node.children.map((child, index) => 
              renderHierarchyNode(child, level + 1, index === node.children.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (!session) return null;

  return (
    <DashboardLayout>
      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
          <h1 className="text-4xl font-bold mb-2">🏢 Organization Hierarchy</h1>
          <p className="text-indigo-100 text-lg">Visual representation of your team structure</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardTitle className="text-sm font-medium text-purple-700">👤 Your Position</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {currentUser?.designation?.replace('_', ' ') || session.user.role}
              </div>
              <p className="text-sm text-gray-600">{currentUser?.name}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardTitle className="text-sm font-medium text-green-700">👥 Total Team</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-green-600 mb-1">{totalEmployees}</div>
              <p className="text-sm text-gray-600">Under your management</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardTitle className="text-sm font-medium text-blue-700">📊 Direct Reports</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-blue-600 mb-1">{hierarchy.length}</div>
              <p className="text-sm text-gray-600">Immediate team members</p>
            </CardContent>
          </Card>
        </div>

        {/* Hierarchy Tree */}
        <Card className="border-2 border-gray-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-gray-900">🌳 Team Hierarchy Tree</CardTitle>
            <CardDescription>
              Click nodes to expand/collapse • Hover for detailed information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-gradient-to-br from-gray-50 to-white">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading hierarchy tree...</p>
              </div>
            ) : hierarchy.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-xl text-gray-600 font-medium">No team members yet</p>
                <p className="text-sm text-gray-500 mt-2">Create employees to build your organization</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current User Root Node */}
                <div className="mb-8">
                  <div className="relative rounded-2xl border-4 border-indigo-400 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-2xl p-6 transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl animate-bounce-slow">👤</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-white">{currentUser?.name}</h3>
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white">
                            YOU
                          </span>
                        </div>
                        <p className="text-indigo-100 mb-3">{session.user.email}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-4 py-2 bg-white rounded-full text-sm font-bold text-indigo-600">
                            {currentUser?.designation?.replace('_', ' ') || session.user.role}
                          </span>
                          {totalEmployees > 0 && (
                            <span className="px-4 py-2 bg-white/90 rounded-full text-sm font-medium text-gray-700">
                              👥 {totalEmployees} Team Member{totalEmployees !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Members Tree */}
                <div className="space-y-6 pl-4">
                  {hierarchy.map((node, index) => 
                    renderHierarchyNode(node, 0, index === hierarchy.length - 1)
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-sm text-gray-900">🎨 Designation Color Guide</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries({
                'MANAGER': '👔 Manager',
                'STATE_MANAGER': '🏛️ State Manager',
                'DISTRICT_MANAGER': '🏢 District Manager',
                'SUPERVISOR': '👨‍💼 Supervisor',
                'DISTRIBUTOR': '📦 Distributor',
                'EMPLOYEE': '👤 Employee',
                'RETAILER': '🏪 Retailer'
              }).map(([key, label]) => {
                const colors = getDesignationColor(key);
                return (
                  <div 
                    key={key} 
                    className={`${colors.bg} ${colors.text} px-4 py-3 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-shadow`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
