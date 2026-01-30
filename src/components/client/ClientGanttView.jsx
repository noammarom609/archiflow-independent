import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Clock, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ClientGanttView({ project }) {
  const milestones = project?.gantt_data?.milestones || [];

  if (milestones.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-8 text-center text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>טרם פורסם לוח זמנים לפרויקט זה</p>
        </CardContent>
      </Card>
    );
  }

  // Sort by start date
  const sortedMilestones = [...milestones].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            לוח זמנים ושלבי הפרויקט
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative border-r border-slate-200 mr-3 space-y-8 py-2">
            {sortedMilestones.map((milestone, index) => {
              const startDate = milestone.start_date ? new Date(milestone.start_date) : null;
              const endDate = milestone.end_date ? new Date(milestone.end_date) : null;
              
              if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return null;
              }

              const isPast = new Date() > endDate;
              const isCurrent = new Date() >= startDate && new Date() <= endDate;

              return (
                <div key={index} className="relative pr-8">
                  {/* Timeline Dot */}
                  <div className={`absolute -right-1.5 top-1 w-3 h-3 rounded-full border-2 bg-white ${
                    isPast ? 'border-green-500 bg-green-500' : 
                    isCurrent ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                  }`} />

                  <div className={`p-4 rounded-xl border ${
                    isCurrent ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 
                    isPast ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className={`font-bold ${isCurrent ? 'text-indigo-900' : 'text-slate-900'}`}>
                          {milestone.name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                          <span>{format(startDate, 'dd/MM/yy')}</span>
                          <span>-</span>
                          <span>{format(endDate, 'dd/MM/yy')}</span>
                          <Badge variant="outline" className="mr-2">
                            {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} ימים
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        {isPast ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                            <CheckCircle2 className="w-3 h-3 ml-1" />
                            הושלם
                          </Badge>
                        ) : isCurrent ? (
                          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                            <Clock className="w-3 h-3 ml-1" />
                            בביצוע
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">
                            <Circle className="w-3 h-3 ml-1" />
                            עתידי
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}