import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/**
 * Standard page layout wrapper.
 * Ensures consistent padding, max-width, and spacing across all pages.
 */
const PageLayout = React.forwardRef(({ 
  className, 
  children, 
  noPadding = false,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "min-h-screen bg-background",
        !noPadding && "p-4 md:p-6 lg:p-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
PageLayout.displayName = "PageLayout";

/**
 * Metric card for dashboards and summary sections.
 * Displays a single KPI with label, value, trend, and icon.
 */
const MetricCard = React.forwardRef(({ 
  label, 
  value, 
  trend,
  trendValue,
  icon: Icon,
  className, 
  onClick,
  ...props 
}, ref) => {
  return (
    <motion.div
      ref={ref}
      whileHover={onClick ? { y: -2, boxShadow: "0 8px 24px rgba(74,59,50,0.12)" } : undefined}
      className={cn(
        "bg-card rounded-2xl border border-border/60 p-5 shadow-organic transition-all",
        onClick && "cursor-pointer hover:border-primary/30",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          {trendValue && (
            <p className={cn(
              "text-xs mt-1 font-medium",
              trend === 'up' ? "text-success" : trend === 'down' ? "text-destructive" : "text-muted-foreground"
            )}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
    </motion.div>
  );
});
MetricCard.displayName = "MetricCard";

export { PageLayout, MetricCard };
