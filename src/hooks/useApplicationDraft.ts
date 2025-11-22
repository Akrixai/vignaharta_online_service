import { useState, useEffect, useCallback } from 'react';

interface DraftData {
  [key: string]: any;
}

interface UseDraftOptions {
  schemeId: string;
  autoSaveInterval?: number; // milliseconds
  enableLocalStorage?: boolean;
}

export function useApplicationDraft({ 
  schemeId, 
  autoSaveInterval = 30000, // 30 seconds
  enableLocalStorage = true 
}: UseDraftOptions) {
  const [draftData, setDraftData] = useState<DraftData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const localStorageKey = `draft_${schemeId}`;

  // Load draft from localStorage on mount
  useEffect(() => {
    if (enableLocalStorage) {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setDraftData(parsed.data || {});
          setLastSaved(parsed.timestamp ? new Date(parsed.timestamp) : null);
        } catch (error) {
          console.error('Error loading draft from localStorage:', error);
        }
      }
    }
  }, [schemeId, enableLocalStorage, localStorageKey]);

  // Save to localStorage
  const saveToLocalStorage = useCallback((data: DraftData) => {
    if (enableLocalStorage) {
      try {
        localStorage.setItem(localStorageKey, JSON.stringify({
          data,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [enableLocalStorage, localStorageKey]);

  // Save to server
  const saveToServer = useCallback(async (data: DraftData, progressPercentage?: number) => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/applications/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scheme_id: schemeId,
          draft_data: data,
          progress_percentage: progressPercentage
        })
      });

      if (response.ok) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving draft to server:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [schemeId]);

  // Update draft data
  const updateDraft = useCallback((updates: Partial<DraftData>) => {
    setDraftData(prev => {
      const newData = { ...prev, ...updates };
      saveToLocalStorage(newData);
      setHasUnsavedChanges(true);
      return newData;
    });
  }, [saveToLocalStorage]);

  // Auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges || Object.keys(draftData).length === 0) return;

    const timer = setTimeout(() => {
      saveToServer(draftData);
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [draftData, hasUnsavedChanges, autoSaveInterval, saveToServer]);

  // Manual save
  const saveDraft = useCallback(async (progressPercentage?: number) => {
    return await saveToServer(draftData, progressPercentage);
  }, [draftData, saveToServer]);

  // Clear draft
  const clearDraft = useCallback(() => {
    setDraftData({});
    setLastSaved(null);
    setHasUnsavedChanges(false);
    if (enableLocalStorage) {
      localStorage.removeItem(localStorageKey);
    }
  }, [enableLocalStorage, localStorageKey]);

  return {
    draftData,
    updateDraft,
    saveDraft,
    clearDraft,
    isSaving,
    lastSaved,
    hasUnsavedChanges
  };
}
