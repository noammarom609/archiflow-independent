import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Filter } from 'lucide-react';

export default function CalendarFilters({ filters, onFiltersChange, compact = false }) {
  const filterOptions = [
    { key: 'meeting', label: 'פגישות', color: 'bg-blue-500' },
    { key: 'deadline', label: 'דדליינים', color: 'bg-red-500' },
    { key: 'task', label: 'משימות', color: 'bg-purple-500' },
    { key: 'journal', label: 'יומן', color: 'bg-green-500' },
    { key: 'other', label: 'אחר', color: 'bg-slate-500' },
  ];

  const statusFilters = [
    { key: 'approved', label: 'מאושר', color: 'bg-green-500' },
    { key: 'pending', label: 'ממתין לאישור', color: 'bg-yellow-500' },
  ];

  const toggleFilter = (key) => {
    onFiltersChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  // Compact version - just the filter toggles without card wrapper
  if (compact) {
    return (
      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">סוג אירוע</h4>
          <div className="space-y-2">
            {filterOptions.map(option => (
              <div key={option.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${option.color} flex-shrink-0`} />
                  <span className="text-xs text-foreground">{option.label}</span>
                </div>
                <Switch
                  id={`filter-${option.key}`}
                  checked={filters[option.key]}
                  onCheckedChange={() => toggleFilter(option.key)}
                  className="data-[state=checked]:bg-primary scale-75"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t border-border pt-2">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">סטטוס</h4>
          <div className="space-y-2">
            {statusFilters.map(option => (
              <div key={option.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${option.color} flex-shrink-0`} />
                  <span className="text-xs text-foreground">{option.label}</span>
                </div>
                <Switch
                  id={`status-${option.key}`}
                  checked={filters[option.key]}
                  onCheckedChange={() => toggleFilter(option.key)}
                  className="data-[state=checked]:bg-primary scale-75"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Full version with card wrapper
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          סינון
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">סוג אירוע</h4>
          <div className="space-y-3">
            {filterOptions.map(option => (
              <div key={option.key} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${option.color} flex-shrink-0`} />
                  <span className="text-sm text-foreground">{option.label}</span>
                </div>
                <Switch
                  id={`filter-${option.key}`}
                  checked={filters[option.key]}
                  onCheckedChange={() => toggleFilter(option.key)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t border-border pt-3">
          <h4 className="text-sm font-semibold text-foreground mb-3">סטטוס</h4>
          <div className="space-y-3">
            {statusFilters.map(option => (
              <div key={option.key} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${option.color} flex-shrink-0`} />
                  <span className="text-sm text-foreground">{option.label}</span>
                </div>
                <Switch
                  id={`status-${option.key}`}
                  checked={filters[option.key]}
                  onCheckedChange={() => toggleFilter(option.key)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}