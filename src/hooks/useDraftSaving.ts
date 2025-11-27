import { useState, useCallback } from 'react';
import { showToast } from '@/lib/toast';

interface DraftData {
  scheme_id: string;
  draft_data: any;
  progress_percentage: number;
  current_step: number;
  total_steps: number;
}

export function useDraftSaving() {
  const [isSaving, setIsSaving] = useState(false);

  const saveDraft = useCallback(async (data: DraftData) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        showToast.success('Draft saved successfully', {
          description: 'You can continue this application later from Draft Applications'
        });
        return true;
      } else {
        showToast.error('Failed to save draft', {
          description: result.error || 'Please try again'
        });
        return false;
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      showToast.error('Failed to save draft', {
        description: 'Please check your connection and try again'
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const loadDraft = useCallback(async (draftId: string) => {
    try {
      const response = await fetch(`/api/drafts?id=${draftId}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  }, []);

  return {
    saveDraft,
    loadDraft,
    isSaving
  };
}
