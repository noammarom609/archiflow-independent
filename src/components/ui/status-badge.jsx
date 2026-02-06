import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle, FileText, XCircle, Loader2, Zap, Send } from "lucide-react";

/**
 * Unified status color & icon mapping for the entire app.
 * Every module (Financials, Projects, Proposals) should use this.
 */
const STATUS_MAP = {
  // Financial statuses
  paid:      { label: 'שולם',    variant: 'success',     icon: CheckCircle2 },
  pending:   { label: 'ממתין',   variant: 'warning',     icon: Clock },
  overdue:   { label: 'באיחור',  variant: 'destructive', icon: AlertCircle },
  draft:     { label: 'טיוטה',   variant: 'muted',       icon: FileText },
  cancelled: { label: 'בוטל',    variant: 'muted',       icon: XCircle },
  sent:      { label: 'נשלח',    variant: 'info',        icon: Send },
  
  // Project statuses
  active:      { label: 'פעיל',      variant: 'success',     icon: Zap },
  in_progress: { label: 'בתהליך',    variant: 'info',        icon: Loader2 },
  completed:   { label: 'הושלם',     variant: 'success',     icon: CheckCircle2 },
  on_hold:     { label: 'מושהה',     variant: 'warning',     icon: Clock },
  archived:    { label: 'בארכיון',   variant: 'muted',       icon: FileText },
  
  // Proposal statuses
  approved:  { label: 'מאושר',   variant: 'success',     icon: CheckCircle2 },
  rejected:  { label: 'נדחה',    variant: 'destructive', icon: XCircle },
  
  // Lead statuses
  new:       { label: 'חדש',     variant: 'info',        icon: Zap },
  contacted: { label: 'נוצר קשר', variant: 'warning',   icon: Clock },
  qualified: { label: 'מתאים',   variant: 'success',     icon: CheckCircle2 },
  lost:      { label: 'אבוד',    variant: 'destructive', icon: XCircle },
};

const VARIANT_STYLES = {
  success:     "bg-success/15 text-success border-success/25",
  warning:     "bg-warning/15 text-warning border-warning/25",
  destructive: "bg-destructive/15 text-destructive border-destructive/25",
  info:        "bg-info/15 text-info border-info/25",
  muted:       "bg-muted text-muted-foreground border-border",
  primary:     "bg-primary/15 text-primary border-primary/25",
};

const StatusBadge = React.forwardRef(({ 
  status, 
  label: customLabel, 
  showIcon = true, 
  size = "default",
  className, 
  ...props 
}, ref) => {
  const config = STATUS_MAP[status] || { label: status, variant: 'muted', icon: FileText };
  const Icon = config.icon;
  const displayLabel = customLabel || config.label;
  const variantStyle = VARIANT_STYLES[config.variant] || VARIANT_STYLES.muted;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    default: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center font-medium rounded-lg border transition-colors",
        variantStyle,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showIcon && <Icon className={cn("shrink-0", size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />}
      {displayLabel}
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";

export { StatusBadge, STATUS_MAP, VARIANT_STYLES };
