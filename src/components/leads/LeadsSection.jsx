import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  Phone,
  Calendar,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import LeadCard from './LeadCard';
import { FadeIn, ScrollReveal } from '@/components/animations';
import { ScrollArea } from '@/components/ui/scroll-area';

// Stage filter options
const stageFilterOptions = [
  { value: 'all', label: 'כל השלבים' },
  { value: 'phone_call', label: 'שיחה ראשונה' },
  { value: 'first_meeting', label: 'פגישה פרונטלית' },
  { value: 'client_card', label: 'כרטיס לקוח' },
  { value: 'proposal', label: 'הצעת מחיר' },
];

// Sort options
const sortOptions = [
  { value: 'newest', label: 'חדשים ראשון' },
  { value: 'oldest', label: 'ישנים ראשון' },
  { value: 'followup', label: 'Follow-up קרוב' },
  { value: 'overdue', label: 'באיחור' },
];

export default function LeadsSection({ 
  leads = [], 
  followUps = [],
  onSelectLead, 
  onQuickCall,
  onScheduleFollowUp,
  isLoading = false,
  isCollapsed: initialCollapsed = false,
}) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Get next follow-up for a project
  const getNextFollowUp = (projectId) => {
    const projectFollowUps = followUps
      .filter(f => f.project_id === projectId && !f.completed_at)
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    return projectFollowUps[0] || null;
  };
  
  // Check if follow-up is overdue
  const isFollowUpOverdue = (followUp) => {
    if (!followUp) return false;
    return new Date(followUp.scheduled_at) < new Date();
  };
  
  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lead => 
        lead.client_name?.toLowerCase().includes(query) ||
        lead.client?.toLowerCase().includes(query) ||
        lead.name?.toLowerCase().includes(query) ||
        lead.client_phone?.includes(query) ||
        lead.client_email?.toLowerCase().includes(query)
      );
    }
    
    // Stage filter
    if (stageFilter !== 'all') {
      result = result.filter(lead => {
        if (stageFilter === 'proposal') {
          return lead.current_stage === 'proposal';
        }
        return lead.current_stage === 'first_call' && 
               lead.current_sub_stage === stageFilter;
      });
    }
    
    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        break;
      case 'followup':
        result.sort((a, b) => {
          const aFollowUp = getNextFollowUp(a.id);
          const bFollowUp = getNextFollowUp(b.id);
          if (!aFollowUp && !bFollowUp) return 0;
          if (!aFollowUp) return 1;
          if (!bFollowUp) return -1;
          return new Date(aFollowUp.scheduled_at) - new Date(bFollowUp.scheduled_at);
        });
        break;
      case 'overdue':
        result.sort((a, b) => {
          const aFollowUp = getNextFollowUp(a.id);
          const bFollowUp = getNextFollowUp(b.id);
          const aOverdue = isFollowUpOverdue(aFollowUp);
          const bOverdue = isFollowUpOverdue(bFollowUp);
          if (aOverdue && !bOverdue) return -1;
          if (!aOverdue && bOverdue) return 1;
          return new Date(b.created_date) - new Date(a.created_date);
        });
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
    }
    
    return result;
  }, [leads, searchQuery, stageFilter, sortBy, followUps]);
  
  // Count overdue follow-ups
  const overdueCount = useMemo(() => {
    return leads.filter(lead => {
      const followUp = getNextFollowUp(lead.id);
      return isFollowUpOverdue(followUp);
    }).length;
  }, [leads, followUps]);

  return (
    <FadeIn delay={0.1} direction="up" distance={20}>
      <Card className="overflow-hidden border-2 border-primary/10">
        {/* Header */}
        <CardHeader 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">מתעניינים</h2>
                <p className="text-sm text-muted-foreground font-normal">
                  {leads.length} מתעניינים פעילים
                  {overdueCount > 0 && (
                    <span className="text-red-500 mr-2">
                      • {overdueCount} באיחור
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {overdueCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertCircle className="w-3 h-3 ml-1" />
                  {overdueCount}
                </Badge>
              )}
              <motion.div
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </div>
          </CardTitle>
        </CardHeader>
        
        {/* Collapsible Content */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <CardContent className="pt-0">
                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4 pb-4 border-b border-border">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="חיפוש לפי שם, טלפון או אימייל..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  
                  {/* Stage Filter */}
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <Filter className="w-4 h-4 ml-2" />
                      <SelectValue placeholder="שלב" />
                    </SelectTrigger>
                    <SelectContent>
                      {stageFilterOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="מיון" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Leads Grid */}
                {filteredLeads.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery || stageFilter !== 'all' 
                        ? 'לא נמצאו מתעניינים תואמים' 
                        : 'אין מתעניינים פעילים'}
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      צור ליד חדש כדי להתחיל
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[360px] w-full rounded-md border border-border/50">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-1 pr-3">
                      {filteredLeads.map((lead, index) => (
                        <ScrollReveal
                          key={lead.id}
                          delay={index * 0.05}
                          direction="up"
                          distance={15}
                        >
                          <LeadCard
                            project={lead}
                            nextFollowUp={getNextFollowUp(lead.id)}
                            onSelect={onSelectLead}
                            onQuickCall={onQuickCall}
                            onScheduleFollowUp={onScheduleFollowUp}
                          />
                        </ScrollReveal>
                      ))}
                    </div>
                  </ScrollArea>
                )}
                
                {/* Results count */}
                {filteredLeads.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    מציג {filteredLeads.length} מתוך {leads.length} מתעניינים
                  </p>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </FadeIn>
  );
}
