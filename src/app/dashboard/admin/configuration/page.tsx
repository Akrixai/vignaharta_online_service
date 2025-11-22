'use client';

import { useState, useEffect } from 'react';

interface Config {
  id: string;
  config_key: string;
  config_value: string;
  config_type: string;
  category: string;
  description: string;
  is_public: boolean;
  updated_at: string;
}

export default function ConfigurationPage() {
  const [configs, setConfigs] = useState<Record<string, Config[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setConfigs(data.configs || {});
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (config: Config) => {
    setEditingKey(config.config_key);
    setEditValue(config.config_value);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const saveConfig = async (key: string) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config_key: key,
          config_value: editValue
        })
      });

      if (response.ok) {
        await fetchConfigs();
        setEditingKey(null);
        setEditValue('');
      }
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CONTACT':
        return '📞';
      case 'FEES':
        return '💰';
      default:
        return '⚙️';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CONTACT':
        return 'bg-blue-100 text-blue-800';
      case 'FEES':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Site Configuration</h1>
        <p className="text-gray-600 mt-2">
          Manage contact information, fees, and other site-wide settings
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(configs).map(([category, categoryConfigs]) => (
          <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
            <div className={`px-6 py-4 ${getCategoryColor(category)} border-b`}>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>{getCategoryIcon(category)}</span>
                {category}
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {categoryConfigs.map(config => (
                <div key={config.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {config.config_key}
                        </h3>
                        {config.is_public && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Public
                          </span>
                        )}
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {config.config_type}
                        </span>
                      </div>
                      
                      {config.description && (
                        <p className="text-sm text-gray-500 mb-2">
                          {config.description}
                        </p>
                      )}

                      {editingKey === config.config_key ? (
                        <div className="mt-2">
                          {config.config_type === 'BOOLEAN' ? (
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          ) : config.config_type === 'NUMBER' ? (
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          ) : (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          )}
                          
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => saveConfig(config.config_key)}
                              disabled={saving}
                              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 disabled:opacity-50"
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-lg font-semibold text-gray-900">
                            {config.config_value}
                          </div>
                          <button
                            onClick={() => startEdit(config)}
                            className="text-orange-600 hover:text-orange-900 text-sm font-medium"
                          >
                            Edit
                          </button>
                        </div>
                      )}

                      <div className="text-xs text-gray-400 mt-1">
                        Last updated: {new Date(config.updated_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(configs).length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No configurations found
        </div>
      )}
    </div>
  );
}
