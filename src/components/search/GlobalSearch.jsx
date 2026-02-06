import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import {
  Search,
  FolderKanban,
  User,
  FileText,
  Briefcase,
  Mic,
  Calendar,
  Loader2,
  ArrowLeft,
  Command
} from 'lucide-react';

const entityIcons = {
  Project: FolderKanban,
  Client: User,
  Document: FileText,
  Task: Briefcase,
  Recording: Mic,
  CalendarEvent: Calendar,
};

const entityColors = {
  Project: 'bg-primary/10 text-primary',
  Client: 'bg-secondary/10 text-secondary',
  Document: 'bg-info/10 text-info',
  Task: 'bg-accent text-accent-foreground',
  Recording: 'bg-warning/10 text-warning',
  CalendarEvent: 'bg-warning/10 text-warning',
};

export default function GlobalSearch({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);

  // Fetch all entities for search
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => archiflow.entities.Project.list('-created_date', 50),
    enabled: isOpen,
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => archiflow.entities.Client.list('-created_date', 50),
    enabled: isOpen,
  });

  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['documents'],
    queryFn: () => archiflow.entities.Document.list('-created_date', 50),
    enabled: isOpen,
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => archiflow.entities.Task.list('-created_date', 50),
    enabled: isOpen,
  });

  const { data: recordings = [], isLoading: loadingRecordings } = useQuery({
    queryKey: ['recordings'],
    queryFn: () => archiflow.entities.Recording.list('-created_date', 30),
    enabled: isOpen,
  });

  const isLoading = loadingProjects || loadingClients || loadingDocs || loadingTasks || loadingRecordings;

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('archiflow_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Fuzzy search function
  const fuzzyMatch = (text, search) => {
    if (!text || !search) return false;
    const lowerText = text.toLowerCase();
    const lowerSearch = search.toLowerCase();
    return lowerText.includes(lowerSearch);
  };

  // Search across all entities
  const searchResults = React.useMemo(() => {
    if (!query || query.length < 2) return [];

    const results = [];

    // Search Projects
    projects.forEach(p => {
      if (fuzzyMatch(p.name, query) || 
          fuzzyMatch(p.client, query) || 
          fuzzyMatch(p.location, query) ||
          fuzzyMatch(p.status, query)) {
        results.push({
          type: 'Project',
          id: p.id,
          title: p.name,
          subtitle: `${p.client} • ${p.location}`,
          meta: p.status,
          action: () => navigate(createPageUrl('Projects') + `?id=${p.id}`),
        });
      }
    });

    // Search Clients
    clients.forEach(c => {
      if (fuzzyMatch(c.full_name, query) || 
          fuzzyMatch(c.email, query) || 
          fuzzyMatch(c.phone, query)) {
        results.push({
          type: 'Client',
          id: c.id,
          title: c.full_name,
          subtitle: c.email || c.phone,
          meta: c.status,
          action: () => {
            navigate(createPageUrl('Clients'));
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('selectClient', { detail: c.id }));
            }, 100);
          },
        });
      }
    });

    // Search Documents
    documents.forEach(d => {
      if (fuzzyMatch(d.title, query) || 
          fuzzyMatch(d.category, query) ||
          fuzzyMatch(d.project_name, query) ||
          d.tags?.some(tag => fuzzyMatch(tag, query))) {
        results.push({
          type: 'Document',
          id: d.id,
          title: d.title,
          subtitle: d.project_name,
          meta: d.category,
          action: () => window.open(d.file_url, '_blank'),
        });
      }
    });

    // Search Tasks
    tasks.forEach(t => {
      if (fuzzyMatch(t.title, query) || 
          fuzzyMatch(t.description, query) ||
          fuzzyMatch(t.project_name, query)) {
        results.push({
          type: 'Task',
          id: t.id,
          title: t.title,
          subtitle: t.project_name,
          meta: t.status,
          action: () => {
            if (t.project_id) {
              navigate(createPageUrl('Projects') + `?id=${t.project_id}`);
            }
          },
        });
      }
    });

    // Search Recordings
    recordings.forEach(r => {
      if (fuzzyMatch(r.title, query) || 
          fuzzyMatch(r.transcription, query)) {
        results.push({
          type: 'Recording',
          id: r.id,
          title: r.title,
          subtitle: r.analysis?.summary || 'הקלטה',
          meta: r.status,
          action: () => navigate(createPageUrl('Recordings')),
        });
      }
    });

    return results.slice(0, 20); // Limit to 20 results
  }, [query, projects, clients, documents, tasks, recordings]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
        e.preventDefault();
        handleSelect(searchResults[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, searchResults]);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = (result) => {
    // Save to recent searches
    const newRecent = [
      { query, result: result.title, timestamp: Date.now() },
      ...recentSearches.filter(r => r.result !== result.title).slice(0, 4)
    ];
    setRecentSearches(newRecent);
    localStorage.setItem('archiflow_recent_searches', JSON.stringify(newRecent));

    // Execute action
    result.action();
    onClose();
  };

  // Group results by type
  const groupedResults = React.useMemo(() => {
    const groups = {};
    searchResults.forEach(result => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });
    return groups;
  }, [searchResults]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 !top-0 !translate-y-0" dir="rtl">
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="חפש פרויקטים, לקוחות, מסמכים, משימות..."
              className="pr-11 py-6 text-lg border-0 focus-visible:ring-0"
              autoFocus
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono text-muted-foreground">Esc</kbd>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : query.length < 2 ? (
            <div className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">חיפושים אחרונים</h3>
              {recentSearches.length > 0 ? (
                <div className="space-y-1">
                  {recentSearches.map((recent, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(recent.query)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 text-right"
                    >
                      <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{recent.result}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  התחל להקליד לחיפוש...
                </p>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">קיצורי מקלדת</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>חיפוש גלובלי</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Cmd+K</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ניווט בתוצאות</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">↑ ↓</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>בחירה</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Enter</kbd>
                  </div>
                </div>
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">לא נמצאו תוצאות</p>
              <p className="text-sm text-muted-foreground/70 mt-1">נסה מילים אחרות</p>
            </div>
          ) : (
            <div className="space-y-4 p-2">
              {Object.entries(groupedResults).map(([type, results]) => {
                const Icon = entityIcons[type];
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 px-2 mb-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                        {type} ({results.length})
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {results.map((result, idx) => {
                        const globalIdx = searchResults.indexOf(result);
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <motion.button
                            key={result.id}
                            onClick={() => handleSelect(result)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-right ${
                              isSelected
                                ? 'bg-primary/10 border-2 border-primary'
                                : 'hover:bg-muted/50 border-2 border-transparent'
                            }`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${entityColors[type]}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{result.title}</p>
                              {result.subtitle && (
                                <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                              )}
                            </div>
                            {result.meta && (
                              <Badge variant="outline" className="text-xs">
                                {result.meta}
                              </Badge>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border">↑↓</kbd>
              לניווט
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border">Enter</kbd>
              לבחירה
            </span>
          </div>
          <span className="text-muted-foreground/70">
            {searchResults.length > 0 && `${searchResults.length} תוצאות`}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
