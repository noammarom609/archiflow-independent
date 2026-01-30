import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Loader2 } from 'lucide-react';

/**
 * Consultants page - Redirects to People page with consultants tab
 * 
 * This page now redirects to the unified People page.
 * Kept for backward compatibility with existing URLs and bookmarks.
 * 
 * All consultant management functionality has been moved to:
 * - People.jsx - for listing and filtering consultants
 * - EntityDetailModal.jsx - for viewing/editing consultant details
 */
export default function Consultants() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a specific consultant ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const consultantId = urlParams.get('id');
    
    if (consultantId) {
      // Redirect to People page with consultant selected
      navigate(createPageUrl('People') + `?tab=consultants&consultantId=${consultantId}`, { replace: true });
    } else {
      // Just redirect to People with consultants tab
      navigate(createPageUrl('People') + '?tab=consultants', { replace: true });
    }
  }, [navigate]);

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">מעבר לדף אנשי קשר...</p>
      </div>
    </div>
  );
}

// Export CONSULTANT_TYPES for use in other components
export const CONSULTANT_TYPES = {
  structural: { label: 'קונסטרוקטור' },
  electrical: { label: 'יועץ חשמל' },
  plumbing: { label: 'יועץ אינסטלציה' },
  hvac: { label: 'יועץ מיזוג ואוורור' },
  lighting: { label: 'יועץ תאורה' },
  civil_defense: { label: 'יועץ פיקוד העורף / הג"ה' },
  acoustics: { label: 'יועץ אקוסטיקה' },
  hydrology: { label: 'הידרולוג' },
  surveyor: { label: 'מודד' },
  fire_safety: { label: 'יועץ בטיחות אש' },
  accessibility: { label: 'יועץ נגישות' },
  other: { label: 'אחר' },
};
