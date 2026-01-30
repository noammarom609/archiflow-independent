import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Clock, Briefcase, Users, TrendingUp } from 'lucide-react';

const COLORS = ['#984E39', '#4A7C59', '#6B8CAE', '#D4A574', '#8B5A6B', '#5D7B6F', '#A67B5B', '#7B8794'];

export default function TimeReports({ entries = [], projects = [] }) {
  // Hours by project
  const hoursByProject = useMemo(() => {
    const map = new Map();
    
    entries.forEach(entry => {
      const key = entry.project_name || 'ללא פרויקט';
      map.set(key, (map.get(key) || 0) + (entry.duration_minutes || 0));
    });

    return Array.from(map.entries())
      .map(([name, minutes]) => ({
        name,
        hours: parseFloat((minutes / 60).toFixed(1)),
        minutes,
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [entries]);

  // Hours by user
  const hoursByUser = useMemo(() => {
    const map = new Map();
    
    entries.forEach(entry => {
      const key = entry.user_name || entry.user_email || 'לא ידוע';
      map.set(key, (map.get(key) || 0) + (entry.duration_minutes || 0));
    });

    return Array.from(map.entries())
      .map(([name, minutes]) => ({
        name,
        hours: parseFloat((minutes / 60).toFixed(1)),
        minutes,
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [entries]);

  // Billable vs Non-billable
  const billableData = useMemo(() => {
    const billable = entries
      .filter(e => e.billable)
      .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const nonBillable = entries
      .filter(e => !e.billable)
      .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

    return [
      { name: 'לחיוב', value: parseFloat((billable / 60).toFixed(1)), color: '#4A7C59' },
      { name: 'לא לחיוב', value: parseFloat((nonBillable / 60).toFixed(1)), color: '#D4A574' },
    ];
  }, [entries]);

  // Hours by stage
  const hoursByStage = useMemo(() => {
    const stageLabels = {
      first_call: 'שיחה ראשונה',
      proposal: 'הצעת מחיר',
      survey: 'מדידות',
      concept: 'קונספט',
      sketches: 'סקיצות',
      rendering: 'הדמיות',
      permits: 'היתרים',
      technical: 'תוכניות עבודה',
      selections: 'בחירת חומרים',
      execution: 'ביצוע',
      completion: 'מסירה',
    };

    const map = new Map();
    
    entries.forEach(entry => {
      if (entry.stage) {
        const key = stageLabels[entry.stage] || entry.stage;
        map.set(key, (map.get(key) || 0) + (entry.duration_minutes || 0));
      }
    });

    return Array.from(map.entries())
      .map(([name, minutes]) => ({
        name,
        hours: parseFloat((minutes / 60).toFixed(1)),
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [entries]);

  const totalHours = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60;

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">אין נתונים להצגה</h3>
          <p className="text-sm text-muted-foreground">התחל לדווח שעות כדי לראות דוחות</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Hours by Project */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            שעות לפי פרויקט
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hoursByProject}
                  dataKey="hours"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, hours }) => `${name}: ${hours}ש׳`}
                  labelLine={false}
                >
                  {hoursByProject.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} שעות`, '']}
                  contentStyle={{ direction: 'rtl' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {hoursByProject.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="truncate max-w-[150px]">{item.name}</span>
                </div>
                <span className="font-mono">{item.hours}ש׳</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billable vs Non-billable */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            שעות לחיוב
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={billableData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {billableData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} שעות`, '']}
                  contentStyle={{ direction: 'rtl' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">סה"כ שעות</div>
          </div>
        </CardContent>
      </Card>

      {/* Hours by User */}
      {hoursByUser.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              שעות לפי עובד
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursByUser} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value) => [`${value} שעות`, '']}
                    contentStyle={{ direction: 'rtl' }}
                  />
                  <Bar dataKey="hours" fill="#984E39" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hours by Stage */}
      {hoursByStage.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              שעות לפי שלב
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursByStage}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} שעות`, '']}
                    contentStyle={{ direction: 'rtl' }}
                  />
                  <Bar dataKey="hours" fill="#4A7C59" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}