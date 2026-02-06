import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";

/**
 * Reusable empty state component for modules with no data.
 * Provides clear guidance on what to do next.
 */
const EmptyState = React.forwardRef(({ 
  icon: Icon = Inbox,
  title = "אין נתונים להצגה",
  description,
  action,
  className,
  compact = false,
  ...props 
}, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-16 px-6",
        className
      )}
      {...props}
    >
      <div className={cn(
        "rounded-2xl bg-muted/50 flex items-center justify-center mb-4",
        compact ? "w-12 h-12" : "w-16 h-16"
      )}>
        <Icon className={cn(
          "text-muted-foreground",
          compact ? "w-6 h-6" : "w-8 h-8"
        )} />
      </div>
      
      <h3 className={cn(
        "font-semibold text-foreground mb-1",
        compact ? "text-sm" : "text-lg"
      )}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(
          "text-muted-foreground max-w-sm",
          compact ? "text-xs" : "text-sm"
        )}>
          {description}
        </p>
      )}
      
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </motion.div>
  );
});
EmptyState.displayName = "EmptyState";

export { EmptyState };
