import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, Users, Loader2, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';

const stageLabels = {
  first_call: 'שיחה ראשונה',
  lead: 'התנעה',
  proposal: 'הצעת מחיר',
  gantt: 'יצירת גנט',
  planning: 'תכנון',
  sketches: 'סקיצות',
  sketch: 'סקיצות ועיצוב',
  rendering: 'הדמיות',
  technical: 'תוכניות עבודה',
  execution: 'ביצוע',
  completion: 'סיום',
};

const stageColors = {
  first_call: 'bg-taupe-100 text-taupe-700 border-taupe-200',
  lead: 'bg-muted text-muted-foreground border-border',
  proposal: 'bg-primary/10 text-primary border-primary/20',
  gantt: 'bg-secondary/10 text-secondary border-secondary/20',
  planning: 'bg-secondary/10 text-secondary border-secondary/20',
  sketches: 'bg-primary/15 text-primary border-primary/25',
  sketch: 'bg-primary/15 text-primary border-primary/25',
  rendering: 'bg-primary/20 text-primary border-primary/30',
  technical: 'bg-taupe-100 text-taupe-800 border-taupe-300',
  execution: 'bg-secondary/20 text-secondary border-secondary/30',
  completion: 'bg-forest-100 text-forest-700 border-forest-200',
};

const statusIcons = {
  waiting: AlertCircle,
  approved: CheckCircle2,
  progress: Clock,
};

const COLLAPSED_COUNT = 3;

export default function ProjectStatusMatrix({ onProjectClick, projects: projectsProp = [] }) {
  const isLoading = false;

  const projects = projectsProp.map(p => {
    const createdDate = new Date(p.created_date);
    const daysInStage = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: p.id,
      name: p.name,
      stage: p.status || 'lead',
      status: 'progress',
      statusText: stageLabels[p.status] || 'בתהליך',
      daysInStage,
    };
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const displayedProjects = isExpanded ? projects : projects.slice(0, COLLAPSED_COUNT);
  const hasMore = projects.length > COLLAPSED_COUNT;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          מטריצת פרויקטים
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
          כל הפרויקטים הפעילים והשלב הנוכחי שלהם
        </p>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            אין פרויקטים עדיין
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground">
                    פרויקט
                  </th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground">
                    שלב
                  </th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground hidden sm:table-cell">
                    סטטוס
                  </th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground">
                    ימים
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedProjects.map((project) => {
                  const StatusIcon = statusIcons[project.status] || Clock;

                  return (
                    <tr
                      key={project.id}
                      className="border-b border-border/50 cursor-pointer group hover:bg-muted/50 transition-colors"
                      onClick={() => onProjectClick && onProjectClick(project.id)}
                    >
                      <td className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                            {project.name}
                          </span>
                          <ChevronLeft className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4">
                        <Badge className={`${stageColors[project.stage] || stageColors.lead} font-medium rounded-lg border text-[10px] sm:text-xs`}>
                          {stageLabels[project.stage] || 'התנעה'}
                        </Badge>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{project.statusText}</span>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="flex items-center gap-1">
                          <div className="w-8 sm:w-12 h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-[width] duration-700 ease-out"
                              style={{ width: `${Math.min(project.daysInStage * 3, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs sm:text-sm text-muted-foreground mr-1 sm:mr-2">{project.daysInStage}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Expand/Collapse */}
            {hasMore && (
              <div className="pt-3 border-t border-border/50 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full text-muted-foreground hover:text-foreground gap-2"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      הצג פחות
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      הצג את כל {projects.length} הפרויקטים
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
