import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, Users, Loader2, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';

// Animation variants
const tableRowVariants = {
  hidden: { opacity: 0, x: -30, scale: 0.95 },
  visible: (index) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      delay: index * 0.08
    }
  }),
  hover: {
    scale: 1.01,
    x: 5,
    backgroundColor: "rgba(152, 78, 57, 0.05)",
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }
};

const badgeVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 15 }
  },
  hover: { scale: 1.1, transition: { duration: 0.2 } }
};

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

// Organic Modernism color palette for stages
const stageColors = {
  first_call: 'bg-taupe-100 text-taupe-700 border-taupe-200',
  lead: 'bg-muted text-muted-foreground border-border',
  proposal: 'bg-primary/10 text-primary border-primary/20',
  gantt: 'bg-secondary/10 text-secondary border-secondary/20',
  planning: 'bg-secondary/10 text-secondary border-secondary/20',
  sketches: 'bg-amber-50 text-amber-700 border-amber-200',
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
  // Projects are passed as prop (already filtered for multi-tenant)
  const isLoading = false;

  // Transform projects to display format
  const projects = projectsProp.map(p => {
    const createdDate = new Date(p.created_date);
    const daysInStage = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      id: p.id,
      name: p.name,
      stage: p.status || 'lead',
      status: 'progress',
      statusText: stageLabels[p.status] || 'בתהליך',
      daysInStage: daysInStage,
    };
  });

  const [hoveredRow, setHoveredRow] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Show only first 3 when collapsed, all when expanded
  const displayedProjects = isExpanded ? projects : projects.slice(0, COLLAPSED_COUNT);
  const hasMore = projects.length > COLLAPSED_COUNT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
          >
            <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2">
              <motion.div 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </motion.div>
              מטריצת פרויקטים
            </CardTitle>
          </motion.div>
          <motion.p 
            className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            כל הפרויקטים הפעילים והשלב הנוכחי שלהם
          </motion.p>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {isLoading ? (
            <motion.div 
              className="flex justify-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-8 h-8 text-primary" />
              </motion.div>
            </motion.div>
          ) : projects.length === 0 ? (
            <motion.div 
              className="text-center py-8 text-muted-foreground"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              אין פרויקטים עדיין
            </motion.div>
          ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full min-w-[400px]">
              <thead>
                <motion.tr 
                  className="border-b border-border"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
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
                </motion.tr>
              </thead>
              <tbody>
                <AnimatePresence mode="sync">
                  {displayedProjects.map((project, index) => {
                    const StatusIcon = statusIcons[project.status] || Clock;
                    const isHovered = hoveredRow === project.id;
                    
                    return (
                      <motion.tr
                        key={project.id}
                        custom={index}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        className="border-b border-border/50 cursor-pointer group relative"
                        onClick={() => onProjectClick && onProjectClick(project.id)}
                        onMouseEnter={() => setHoveredRow(project.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td className="py-3 sm:py-4 px-2 sm:px-4">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <motion.span 
                              className="font-medium text-foreground group-hover:text-primary transition-colors text-sm sm:text-base truncate max-w-[120px] sm:max-w-none"
                              animate={{ x: isHovered ? 5 : 0 }}
                            >
                              {project.name}
                            </motion.span>
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                              transition={{ duration: 0.2 }}
                              className="hidden sm:block"
                            >
                              <ChevronLeft className="w-4 h-4 text-primary" />
                            </motion.div>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4">
                          <motion.div
                            variants={badgeVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                          >
                            <Badge className={`${stageColors[project.stage] || stageColors.lead} font-medium rounded-lg border text-[10px] sm:text-xs`}>
                              {stageLabels[project.stage] || 'התנעה'}
                            </Badge>
                          </motion.div>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 hidden sm:table-cell">
                          <motion.div 
                            className="flex items-center gap-2"
                            animate={{ scale: isHovered ? 1.05 : 1 }}
                          >
                            <motion.div
                              animate={isHovered ? { rotate: [0, 15, -15, 0] } : {}}
                              transition={{ duration: 0.5 }}
                            >
                              <StatusIcon className="w-4 h-4 text-muted-foreground" />
                            </motion.div>
                            <span className="text-sm text-muted-foreground">{project.statusText}</span>
                          </motion.div>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4">
                          <motion.div
                            className="flex items-center gap-1"
                            animate={{ opacity: isHovered ? 1 : 0.7 }}
                          >
                            {/* Progress indicator */}
                            <div className="w-8 sm:w-12 h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-primary rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(project.daysInStage * 3, 100)}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                              />
                            </div>
                            <span className="text-xs sm:text-sm text-muted-foreground mr-1 sm:mr-2">{project.daysInStage}</span>
                          </motion.div>
                        </td>
                        
                        {/* Hover highlight effect */}
                        <motion.td
                          className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isHovered ? 1 : 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {/* Expand/Collapse Button */}
            {hasMore && (
              <motion.div 
                className="pt-3 border-t border-border/50 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
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
              </motion.div>
            )}
          </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}