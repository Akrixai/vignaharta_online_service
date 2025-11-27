'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { Trash2, Edit, Clock, FileText } from 'lucide-react';
import ServiceApplicationForm from '@/components/ServiceApplicationForm';

interface Draft {
  id: string;
  scheme_id: string;
  draft_data: any;
  progress_percentage: number;
  current_step: number;
  total_steps: number;
  last_saved_at: string;
  expires_at: string;
  schemes: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image_url: string;
  };
}

export default function DraftsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/drafts');
      const result = await response.json();

      if (result.success) {
        setDrafts(result.data);
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    try {
      setDeleting(draftId);
      const response = await fetch(`/api/drafts?id=${draftId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        setDrafts(drafts.filter(d => d.id !== draftId));
      } else {
        alert('Failed to delete draft');
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Failed to delete draft');
    } finally {
      setDeleting(null);
    }
  };

  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleContinue = (draft: Draft) => {
    setSelectedDraft(draft);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedDraft(null);
    fetchDrafts(); // Refresh drafts after closing modal
  };

  const handleSuccess = () => {
    setShowModal(false);
    setSelectedDraft(null);
    fetchDrafts();
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading drafts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3">Draft Applications</h1>
          <p className="text-red-100 text-xl">
            Continue where you left off - Your saved application drafts
          </p>
          <div className="mt-4 flex items-center gap-4 text-red-100">
            <span>📝 {drafts.length} Draft{drafts.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Drafts List */}
        {drafts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Draft Applications</h3>
              <p className="text-gray-600 mb-6">
                You haven't saved any application drafts yet. Start applying for a service and save your progress!
              </p>
              <Button
                onClick={() => router.push('/dashboard/services')}
                className="bg-red-600 hover:bg-red-700"
              >
                Browse Services
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drafts.map((draft) => {
              const daysLeft = getDaysUntilExpiry(draft.expires_at);
              const isExpiringSoon = daysLeft <= 7;

              return (
                <Card key={draft.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    {draft.schemes.image_url && (
                      <img
                        src={draft.schemes.image_url}
                        alt={draft.schemes.name}
                        className="w-full h-32 object-cover rounded-lg mb-4"
                      />
                    )}
                    <CardTitle className="text-lg">{draft.schemes.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {draft.schemes.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-red-600">
                          {draft.progress_percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-red-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${draft.progress_percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Step {draft.current_step} of {draft.total_steps}
                      </p>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Last saved: {formatDateTime(draft.last_saved_at)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">💰</span>
                        <span>Service Fee: {formatCurrency(draft.schemes.price)}</span>
                      </div>
                      {isExpiringSoon && (
                        <div className="flex items-center text-orange-600 font-medium">
                          <span className="mr-2">⚠️</span>
                          <span>Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleContinue(draft)}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Continue
                      </Button>
                      <Button
                        onClick={() => handleDelete(draft.id)}
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        disabled={deleting === draft.id}
                      >
                        {deleting === draft.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Service Application Modal */}
        {selectedDraft && showModal && selectedDraft.schemes && (
          <ServiceApplicationForm
            service={{
              id: selectedDraft.schemes.id,
              name: selectedDraft.schemes.name,
              description: selectedDraft.schemes.description,
              price: selectedDraft.schemes.price,
              category: selectedDraft.schemes.category,
              image_url: selectedDraft.schemes.image_url,
              dynamic_fields: selectedDraft.schemes.dynamic_fields || [],
              required_documents: selectedDraft.schemes.required_documents || [],
              is_free: selectedDraft.schemes.price === 0
            }}
            isOpen={showModal}
            onClose={handleModalClose}
            onSuccess={handleSuccess}
            draftData={selectedDraft.draft_data}
            draftId={selectedDraft.id}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
