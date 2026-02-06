import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Clock, TrendingUp } from 'lucide-react';

const CIRCUMFERENCE = 2 * Math.PI * 52;

function GaugeIndicator({ label, value, icon: Icon, colorClass, strokeColor, maxValue = 100 }) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const offset = CIRCUMFERENCE * (1 - percentage / 100);

  return (
    <Card className="overflow-hidden cursor-pointer hover:border-primary/30 transition-colors">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col items-center">
          {/* Icon */}
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${colorClass} flex items-center justify-center mb-4 md:mb-6 shadow-organic`}>
            <Icon className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} />
          </div>

          {/* Circular Progress */}
          <div className="relative w-20 h-20 md:w-28 md:h-28 mb-4 md:mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 112 112">
              {/* Background circle */}
              <circle
                cx="56" cy="56" r="52"
                stroke="hsl(28 12% 90%)"
                strokeWidth="4"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="56" cy="56" r="52"
                stroke={strokeColor}
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                className="transition-[stroke-dashoffset] duration-1000 ease-out"
              />
            </svg>

            {/* Center percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg md:text-2xl font-semibold text-foreground tracking-tight">
                {Math.round(percentage)}%
              </span>
            </div>
          </div>

          {/* Label */}
          <h3 className="text-base md:text-lg font-semibold text-foreground text-center mb-1">
            {label}
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            {typeof value === 'number' && value > 1000 ? value.toLocaleString() : value}
            {' '}מתוך{' '}
            {typeof maxValue === 'number' && maxValue > 1000 ? maxValue.toLocaleString() : maxValue}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BusinessHealthGauges({ onGaugeClick, projects = [], invoices = [], proposals = [] }) {
  // גבייה: כמה כסף נגבה מתוך החשבוניות שנשלחו
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);

  // עמידה בלו"ז: כמה פרויקטים פעילים (לא בעיכוב)
  const activeProjects = projects.filter(p =>
    p.status !== 'completion' && p.status !== 'cancelled'
  ).length;
  const projectsOnSchedule = projects.filter(p => {
    const daysInStage = Math.floor((Date.now() - new Date(p.updated_date).getTime()) / (1000 * 60 * 60 * 24));
    return daysInStage <= 30;
  }).length;

  // המרות: כמה הצעות מחיר אושרו מתוך הנשלחות
  const sentProposals = proposals.filter(p => p.status === 'sent' || p.status === 'approved').length;
  const approvedProposals = proposals.filter(p => p.status === 'approved').length;

  const gauges = [
    {
      label: 'המרות',
      value: approvedProposals,
      maxValue: Math.max(sentProposals, 1),
      icon: TrendingUp,
      colorClass: 'bg-taupe-500',
      strokeColor: '#8C7D70',
    },
    {
      label: 'עמידה בלו״ז',
      value: projectsOnSchedule,
      maxValue: Math.max(activeProjects, 1),
      icon: Clock,
      colorClass: 'bg-forest-700',
      strokeColor: '#354231',
    },
    {
      label: 'גבייה',
      value: totalPaid,
      maxValue: Math.max(totalInvoiced, 1),
      icon: DollarSign,
      colorClass: 'bg-primary',
      strokeColor: '#984E39',
    },
  ];

  return (
    <div className="mb-4 sm:mb-6 md:mb-8">
      <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 tracking-tight">
        מדדי ביצוע
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-6">
        {gauges.map((gauge) => (
          <div
            key={gauge.label}
            onClick={() => onGaugeClick && onGaugeClick(gauge.label)}
          >
            <GaugeIndicator {...gauge} />
          </div>
        ))}
      </div>
    </div>
  );
}
