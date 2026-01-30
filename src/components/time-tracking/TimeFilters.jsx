import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X, Calendar } from 'lucide-react';

export default function TimeFilters({ 
  filters, 
  onFiltersChange, 
  projects = [], 
  teamMembers = [],
  showUserFilter = false,
}) {
  const hasFilters = filters.project_id || filters.user_email || (filters.dateRange && filters.dateRange !== 'week');

  const clearFilters = () => {
    onFiltersChange({
      project_id: '',
      user_email: '',
      dateRange: 'week',
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="w-4 h-4 text-muted-foreground" />

      {/* Date Range filter */}
      <Select 
        value={filters.dateRange || 'week'} 
        onValueChange={(v) => onFiltersChange({ ...filters, dateRange: v })}
      >
        <SelectTrigger className="w-[120px] h-9">
          <Calendar className="w-3.5 h-3.5 ml-1.5 text-muted-foreground" />
          <SelectValue placeholder="שבוע" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">שבוע</SelectItem>
          <SelectItem value="month">חודש</SelectItem>
          <SelectItem value="all">הכל</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Project filter */}
      <Select 
        value={filters.project_id || 'all'} 
        onValueChange={(v) => onFiltersChange({ ...filters, project_id: v === 'all' ? '' : v })}
      >
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="כל הפרויקטים" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">כל הפרויקטים</SelectItem>
          {projects
            .filter((project) => project.id)
            .map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {/* User filter (only for managers) */}
      {showUserFilter && teamMembers.length > 0 && (
        <Select 
          value={filters.user_email || 'all'} 
          onValueChange={(v) => onFiltersChange({ ...filters, user_email: v === 'all' ? '' : v })}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="כל העובדים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל העובדים</SelectItem>
            {teamMembers
              .filter((member) => member.email || member.id)
              .map((member) => (
                <SelectItem key={member.id} value={member.email || member.id || `member-${member.id}`}>
                  {member.full_name || member.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2">
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}