import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Grid3x3,
  List,
  Calendar,
  Filter,
  Download,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
// Toaster moved to App.jsx for global fixed positioning
import EntryCard from '../components/journal/EntryCard';
import AddJournalEntryDialog from '../components/journal/AddJournalEntryDialog';
import TimelineView from '../components/journal/TimelineView';
import JournalStats from '../components/journal/JournalStats';
import EntryDetailDialog from '../components/journal/EntryDetailDialog';
import PageHeader from '../components/layout/PageHeader';

export default function Journal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'timeline'
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // Fetch journal entries
  const { data: journalEntries = [], isLoading } = useQuery({
    queryKey: ['journalEntries'],
    queryFn: () => base44.entities.JournalEntry.list('-entry_date', 200),
  });

  // Fetch projects for filtering
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const filteredEntries = journalEntries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesFilter = activeFilter === 'all' || entry.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <PageHeader 
          title="יומן עבודה" 
          subtitle="תיעוד מסודר של כל אירועי הפרויקטים"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowStats(!showStats)}
              className="flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">סטטיסטיקות</span>
              <span className="sm:hidden">סטט׳</span>
            </Button>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 shadow-soft-organic hover:shadow-soft-organic-hover text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>רשומה חדשה</span>
            </Button>
          </div>
        </PageHeader>

        {/* Stats Panel */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <JournalStats entries={journalEntries} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="חפש ביומן..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 sm:pr-12 py-4 sm:py-6 border-border bg-card shadow-soft-organic text-sm sm:text-base"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full sm:flex-1">
              <TabsList className="bg-card border border-border p-1 shadow-soft-organic w-full grid grid-cols-3 sm:flex">
                <TabsTrigger value="all" className="text-xs sm:text-sm">הכל</TabsTrigger>
                <TabsTrigger value="meeting" className="text-xs sm:text-sm">פגישות</TabsTrigger>
                <TabsTrigger value="site_visit" className="text-xs sm:text-sm hidden sm:inline-flex">ביקורי אתר</TabsTrigger>
                <TabsTrigger value="decision" className="text-xs sm:text-sm">החלטות</TabsTrigger>
                <TabsTrigger value="milestone" className="text-xs sm:text-sm hidden md:inline-flex">אבני דרך</TabsTrigger>
                <TabsTrigger value="note" className="text-xs sm:text-sm">הערות</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 shadow-soft-organic w-full sm:w-auto">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`flex-1 sm:flex-none ${viewMode === 'grid' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className={`flex-1 sm:flex-none ${viewMode === 'timeline' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Entries Display */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">טוען רשומות...</p>
          </div>
        ) : filteredEntries.length > 0 ? (
          viewMode === 'grid' ? (
            <motion.div
              key="grid"
              className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
            >
              {filteredEntries.map((entry, index) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  index={index}
                  onClick={() => setSelectedEntry(entry)}
                />
              ))}
            </motion.div>
          ) : (
            <TimelineView 
              entries={filteredEntries} 
              onEntryClick={setSelectedEntry}
            />
          )
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">לא נמצאו רשומות</h3>
            <p className="text-muted-foreground mb-4">נסה לשנות את מסנני החיפוש או צור רשומה חדשה</p>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft-organic hover:shadow-soft-organic-hover"
            >
              <Plus className="w-4 h-4 ml-2" />
              רשומה חדשה
            </Button>
          </motion.div>
        )}

        {/* Dialogs */}
        <AddJournalEntryDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
        />

        <EntryDetailDialog
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onEdit={(entry) => {
            setSelectedEntry(null);
            // TODO: Open edit dialog
          }}
        />
      </motion.div>
    </div>
  );
}