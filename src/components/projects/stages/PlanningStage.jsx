import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Sparkles, Download, CalendarDays } from 'lucide-react';
import { useProjectData } from '../ProjectDataContext';
import { showSuccess } from '../../utils/notifications';

const phases = [
  { id: 'demolition', label: 'הריסה', duration: 3 },
  { id: 'plumbing', label: 'אינסטלציה', duration: 5 },
  { id: 'electrical', label: 'חשמל', duration: 4 },
  { id: 'drywall', label: 'גבס', duration: 7 },
  { id: 'flooring', label: 'ריצוף', duration: 10 },
  { id: 'carpentry', label: 'נגרות', duration: 8 },
  { id: 'painting', label: 'צביעה', duration: 4 },
];

export default function PlanningStage() {
  const { projectData, updateStage } = useProjectData();
  const { selectedPhases: saved = ['demolition', 'plumbing', 'electrical'], ganttGenerated: savedGantt = false, startDate: savedDate = '' } = projectData.planning || {};
  
  const [selectedPhases, setSelectedPhases] = useState(saved);
  const [ganttGenerated, setGanttGenerated] = useState(savedGantt);
  const [startDate, setStartDate] = useState(savedDate);

  const togglePhase = (phaseId) => {
    const newPhases = selectedPhases.includes(phaseId)
      ? selectedPhases.filter(id => id !== phaseId)
      : [...selectedPhases, phaseId];
    setSelectedPhases(newPhases);
    updateStage('planning', { selectedPhases: newPhases });
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    updateStage('planning', { startDate: date });
  };

  const handleGenerateGantt = () => {
    setGanttGenerated(true);
    updateStage('planning', { ganttGenerated: true });
    showSuccess('תרשים גנט נוצר בהצלחה! 📊');
  };

  const totalDuration = selectedPhases.reduce((sum, id) => {
    const phase = phases.find(p => p.id === id);
    return sum + (phase?.duration || 0);
  }, 0);

  const calculatePhaseDate = (phaseIndex) => {
    if (!startDate) return '';
    const start = new Date(startDate);
    const daysOffset = selectedPhases.slice(0, phaseIndex).reduce((sum, id) => {
      const phase = phases.find(p => p.id === id);
      return sum + (phase?.duration || 0);
    }, 0);
    const phaseDate = new Date(start);
    phaseDate.setDate(phaseDate.getDate() + daysOffset);
    return phaseDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  };

  const calculateEndDate = () => {
    if (!startDate) return '';
    const start = new Date(startDate);
    start.setDate(start.getDate() + totalDuration);
    return start.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Phase Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              בחירת שלבי הפרויקט
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {phases.map((phase) => (
              <div
                key={phase.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedPhases.includes(phase.id)}
                    onCheckedChange={() => togglePhase(phase.id)}
                  />
                  <span className="font-medium text-slate-900">{phase.label}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {phase.duration} ימים
                </Badge>
              </div>
            ))}

            <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-indigo-900">משך זמן כולל:</span>
                <span className="text-2xl font-bold text-indigo-700">{totalDuration} ימים</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Start Date Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              תאריך התחלת פרויקט
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="start-date">תאריך התחלה</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="mt-2"
              />
            </div>
            {startDate && (
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-indigo-900">משך כולל:</span>
                  <span className="text-xl font-bold text-indigo-700">{totalDuration} ימים</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-900">תאריך סיום משוער:</span>
                  <span className="text-sm font-bold text-indigo-700">{calculateEndDate()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Generate Gantt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-slate-200">
          <CardContent className="p-6">
            {!ganttGenerated ? (
              <Button
                onClick={handleGenerateGantt}
                disabled={!startDate || selectedPhases.length === 0}
                className="w-full bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-14 disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                צור לו״ז גנט אוטומטי
              </Button>
            ) : (
              <div className="space-y-4">
                {/* Gantt Visual */}
                <div className="p-6 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">תרשים גנט</h3>
                  {startDate ? (
                    <div className="space-y-3">
                      {selectedPhases.map((phaseId, index) => {
                        const phase = phases.find(p => p.id === phaseId);
                        const startDay = selectedPhases
                          .slice(0, index)
                          .reduce((sum, id) => {
                            const p = phases.find(ph => ph.id === id);
                            return sum + (p?.duration || 0);
                          }, 0);

                        return (
                          <div key={phaseId} className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-600">
                              <span className="font-medium">{phase.label}</span>
                              <span>{calculatePhaseDate(index)}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1 bg-white rounded-full h-8 overflow-hidden relative">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(phase.duration / totalDuration) * 100}%` }}
                                  transition={{ delay: index * 0.1, duration: 0.5 }}
                                  className="absolute h-full bg-gradient-to-l from-indigo-500 to-purple-500 flex items-center justify-center"
                                  style={{ right: `${(startDay / totalDuration) * 100}%` }}
                                >
                                  <span className="text-xs font-medium text-white px-2">
                                    {phase.duration} ימים
                                  </span>
                                </motion.div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-8">הזן תאריך התחלה כדי לראות תאריכים מדויקים</p>
                  )}
                </div>

                <Button 
                  onClick={() => showSuccess('תרשים גנט הורד בהצלחה! 📄')}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <Download className="w-4 h-4 ml-2" />
                  הורד תרשים גנט (PDF)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}