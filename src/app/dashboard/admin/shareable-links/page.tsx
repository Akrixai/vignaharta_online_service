'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { showToast } from '@/lib/toast';

export default function ShareableLinksPage() {
  const { data: session } = useSession();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    scheme_id: '',
    title: '',
    description: '',
    expires_at: '',
    max_access_count: ''
  });

  useEffect(() => {
    if (session?.user.role === UserRole.ADMIN) {
      fetchLinks();
      fetchSchemes();
    }
  }, [session]);

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/admin/shareable-links');
      const result = await response.json();
      if (response.ok) {
        setLinks(result.links || []);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchemes = async () => {
    try {
      const response = await fetch('/api/schemes?limit=unlimited');
      const result = await response.json();
      if (response.ok) {
        setSchemes(result.schemes || []);
      }
    } catch (error) {
      console.error('Error fetching schemes:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/shareable-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        showToast.success('Shareable link created successfully!');
        setShowCreateModal(false);
        setFormData({ scheme_id: '', title: '', description: '', expires_at: '', max_access_count: '' });
        fetchLinks();
      } else {
        showToast.error(result.error || 'Failed to create link');
      }
    } catch (error) {
      showToast.error('Error creating link');
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/apply/${token}`;
    navigator.clipboard.writeText(link);
    showToast.success('Link copied to clipboard!');
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/shareable-links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        showToast.success(`Link ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchLinks();
      }
    } catch (error) {
      showToast.error('Error updating link');
    }
  };

  if (!session || session.user.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3">Shareable Application Links</h1>
          <p className="text-purple-100 text-xl">Create and manage shareable application links</p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            ➕ Create New Link
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading links...</p>
            </CardContent>
          </Card>
        ) : links.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No shareable links yet</h3>
              <p className="text-gray-600">Create your first shareable application link</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {links.map((link) => (
              <Card key={link.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{link.title}</h3>
                      {link.description && (
                        <p className="text-gray-600 mb-3">{link.description}</p>
                      )}
                      <div className="space-y-2 text-sm">
                        <p><strong>Service:</strong> {link.scheme?.name}</p>
                        <p><strong>Category:</strong> {link.scheme?.category}</p>
                        <p><strong>Access Count:</strong> {link.access_count} {link.max_access_count ? `/ ${link.max_access_count}` : ''}</p>
                        {link.expires_at && (
                          <p><strong>Expires:</strong> {new Date(link.expires_at).toLocaleDateString()}</p>
                        )}
                        <div className="bg-gray-100 rounded p-2 font-mono text-xs break-all">
                          {`${window.location.origin}/apply/${link.link_token}`}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        link.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {link.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <Button
                        onClick={() => copyLink(link.link_token)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        📋 Copy Link
                      </Button>
                      <Button
                        onClick={() => toggleActive(link.id, link.is_active)}
                        className={`text-xs ${
                          link.is_active ? 'bg-gray-600 hover:bg-gray-700' : 'bg-green-600 hover:bg-green-700'
                        } text-white`}
                      >
                        {link.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Create Shareable Link</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                  <select
                    value={formData.scheme_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheme_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select Service</option>
                    {schemes.map((scheme) => (
                      <option key={scheme.id} value={scheme.id}>{scheme.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Access Count (Optional)</label>
                  <input
                    type="number"
                    value={formData.max_access_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_access_count: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="1"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                    Create Link
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ scheme_id: '', title: '', description: '', expires_at: '', max_access_count: '' });
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
