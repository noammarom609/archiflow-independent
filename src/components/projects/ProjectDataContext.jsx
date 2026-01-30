import React, { createContext, useContext, useState, useEffect } from 'react';

const ProjectDataContext = createContext();

export function ProjectDataProvider({ children, projectId }) {
  const storageKey = `archiflow_project_${projectId}`;
  
  const [projectData, setProjectData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse project data:', e);
        }
      }
    }
    return {
      lead: { callNotes: '', clientData: { budget: '', style: '', deadline: '' } },
      proposal: { quoteData: { totalAmount: '450000', description: 'שיפוץ מלא דירה 4 חדרים', paymentTerms: '3 תשלומים' }, status: 'draft' },
      planning: { selectedPhases: ['demolition', 'plumbing', 'electrical'], startDate: '', ganttGenerated: false },
      sketch: { selectedImages: [], signed: false, signatureMode: null },
      rendering: { approved: false, digitalSignature: null },
      technical: { qrGenerated: false },
      execution: { selectedBid: 2 },
      completion: { closed: false },
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(projectData));
    }
  }, [projectData, storageKey]);

  const updateStage = (stage, data) => {
    setProjectData(prev => ({
      ...prev,
      [stage]: { ...prev[stage], ...data },
    }));
  };

  return (
    <ProjectDataContext.Provider value={{ projectData, updateStage }}>
      {children}
    </ProjectDataContext.Provider>
  );
}

export function useProjectData() {
  const context = useContext(ProjectDataContext);
  if (!context) {
    throw new Error('useProjectData must be used within ProjectDataProvider');
  }
  return context;
}