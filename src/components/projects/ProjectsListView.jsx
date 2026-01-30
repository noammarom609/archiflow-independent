import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ScrollReveal, FadeIn } from '@/components/animations';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  MapPin,
  FileText,
  DollarSign,
  ArrowLeft,
  Loader2,
  Building2,
  LayoutList,
  Grid3x3
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const statusConfig = {
  first_call: { label: 'שיחה ראשונה', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  proposal: { label: 'הצעת מחיר', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  gantt: { label: 'יצירת גנט', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  sketches: { label: 'סקיצות', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  rendering: { label: 'הדמיות', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  technical: { label: 'תוכניות', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  execution: { label: 'ביצוע', color: 'bg-red-100 text-red-800 border-red-200' },
  completion: { label: 'גמר', color: 'bg-green-100 text-green-800 border-green-200' },
};

export default function ProjectsListView({ projects, onSelectProject, isLoading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedProject, setExpandedProject] = useState(null);

  // Fetch proposals
  const { data: allProposals = [] } = useQuery({
    queryKey: ['allProposals'],
    queryFn: () => base44.entities.Proposal.list('-created_date'),
  });

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get proposals for a specific project
  const getProjectProposals = (projectId) => {
    return allProposals.filter(p => p.project_id === projectId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="חיפוש לפי שם פרויקט, לקוח או מיקום..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="כל הסטטוסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-slate-500">
            מציג {filteredProjects.length} מתוך {projects.length} פרויקטים
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredProjects.map((project, index) => {
            const status = statusConfig[project.status] || statusConfig.first_call;
            const isExpanded = expandedProject === project.id;
            const projectProposals = getProjectProposals(project.id);

            return (
              <ScrollReveal
                key={project.id}
                delay={index * 0.05}
                direction="up"
                distance={20}
              >
                <Collapsible open={isExpanded} onOpenChange={() => setExpandedProject(isExpanded ? null : project.id)}>
                  <Card className={`border-2 transition-all ${isExpanded ? 'border-indigo-300 shadow-lg' : 'border-slate-200 hover:border-slate-300'}`}>
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-4 cursor-pointer">
                        <div className="flex items-center gap-4">
                          {/* Project Image */}
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                            {project.image ? (
                              <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-8 h-8 text-slate-300" />
                              </div>
                            )}
                          </div>

                          {/* Project Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-bold text-slate-900 text-lg">{project.name}</h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" />
                                    {project.client || 'לא צוין'}
                                  </span>
                                  {project.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {project.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge className={`${status.color} border flex-shrink-0`}>
                                {status.label}
                              </Badge>
                            </div>
                          </div>

                          {/* Expand Icon */}
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t border-slate-100 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left Column - Project Details */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-indigo-600" />
                              פרטי הפרויקט
                            </h4>

                            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-slate-500">תאריך יצירה:</span>
                                  <p className="font-medium text-slate-900">{formatDate(project.created_date)}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500">תאריך התחלה:</span>
                                  <p className="font-medium text-slate-900">{formatDate(project.start_date)}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500">לוח זמנים:</span>
                                  <p className="font-medium text-slate-900">{project.timeline || '-'}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500">תקציב:</span>
                                  <p className="font-medium text-indigo-600">{project.budget || '-'}</p>
                                </div>
                              </div>

                              {project.description && (
                                <div className="pt-3 border-t border-slate-200">
                                  <span className="text-slate-500 text-sm">תיאור:</span>
                                  <p className="text-sm text-slate-700 mt-1">{project.description}</p>
                                </div>
                              )}

                              {/* Client Contact */}
                              {(project.client_email || project.client_phone) && (
                                <div className="pt-3 border-t border-slate-200">
                                  <span className="text-slate-500 text-sm">פרטי קשר לקוח:</span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {project.client_email && (
                                      <Badge variant="outline" className="text-xs">
                                        {project.client_email}
                                      </Badge>
                                    )}
                                    {project.client_phone && (
                                      <Badge variant="outline" className="text-xs">
                                        {project.client_phone}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Column - Proposals */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              הצעות מחיר ({projectProposals.length})
                            </h4>

                            <div className="bg-slate-50 rounded-xl p-4">
                              {projectProposals.length > 0 ? (
                                <div className="space-y-2">
                                  {projectProposals.map((proposal) => (
                                    <div
                                      key={proposal.id}
                                      className="bg-white rounded-lg p-3 border border-slate-200"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-medium text-slate-900 text-sm">{proposal.title}</p>
                                          <p className="text-xs text-slate-500 mt-0.5">
                                            {formatDate(proposal.created_date)}
                                          </p>
                                        </div>
                                        <div className="text-left">
                                          <p className="font-bold text-green-600">
                                            ₪{proposal.total_amount?.toLocaleString() || 0}
                                          </p>
                                          <Badge
                                            className={`text-xs ${
                                              proposal.status === 'approved'
                                                ? 'bg-green-100 text-green-700'
                                                : proposal.status === 'sent'
                                                ? 'bg-blue-100 text-blue-700'
                                                : proposal.status === 'rejected'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-slate-100 text-slate-700'
                                            }`}
                                          >
                                            {proposal.status === 'approved' && 'אושרה'}
                                            {proposal.status === 'sent' && 'נשלחה'}
                                            {proposal.status === 'draft' && 'טיוטה'}
                                            {proposal.status === 'rejected' && 'נדחתה'}
                                            {proposal.status === 'viewed' && 'נצפתה'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6 text-slate-500 text-sm">
                                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                  אין הצעות מחיר לפרויקט זה
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-6 flex justify-end">
                          <Button
                            onClick={() => onSelectProject(project.id)}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            <LayoutList className="w-4 h-4 ml-2" />
                            ניהול פרויקט
                            <ArrowLeft className="w-4 h-4 mr-2" />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </ScrollReveal>
            );
          })}
        </AnimatePresence>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              {searchQuery || statusFilter !== 'all' 
                ? 'לא נמצאו פרויקטים תואמים לחיפוש' 
                : 'אין פרויקטים עדיין'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}