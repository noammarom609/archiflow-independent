import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, MapPin, CheckCircle2, Calendar } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function JournalStats({ entries }) {
  // Calculate stats
  const totalEntries = entries.length;
  const meetings = entries.filter(e => e.category === 'meeting').length;
  const siteVisits = entries.filter(e => e.category === 'site_visit').length;
  const milestones = entries.filter(e => e.is_milestone).length;

  // Category distribution
  const categoryData = [
    { name: 'פגישות', value: entries.filter(e => e.category === 'meeting').length },
    { name: 'ביקורי אתר', value: entries.filter(e => e.category === 'site_visit').length },
    { name: 'החלטות', value: entries.filter(e => e.category === 'decision').length },
    { name: 'אבני דרך', value: entries.filter(e => e.category === 'milestone').length },
    { name: 'הערות', value: entries.filter(e => e.category === 'note').length },
    { name: 'אחר', value: entries.filter(e => !['meeting', 'site_visit', 'decision', 'milestone', 'note'].includes(e.category)).length },
  ].filter(d => d.value > 0);

  // Monthly activity
  const monthlyData = entries.reduce((acc, entry) => {
    const dateStr = entry.entry_date || entry.created_date;
    if (!dateStr) return acc;
    
    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      if (isNaN(date.getTime())) return acc;
      
      const month = date.toLocaleDateString('he-IL', { month: 'short' });
      const existing = acc.find(d => d.month === month);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ month, count: 1 });
      }
    } catch (e) {
      console.error('Invalid date:', dateStr);
    }
    return acc;
  }, []).slice(-6);

  // Quick stats
  const stats = [
    { label: 'סה״כ רשומות', value: totalEntries, icon: Calendar, color: 'indigo' },
    { label: 'פגישות', value: meetings, icon: Users, color: 'blue' },
    { label: 'ביקורי אתר', value: siteVisits, icon: MapPin, color: 'purple' },
    { label: 'אבני דרך', value: milestones, icon: CheckCircle2, color: 'green' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-600">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">התפלגות לפי קטגוריה</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Activity */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              פעילות חודשית
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}