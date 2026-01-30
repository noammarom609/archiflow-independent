import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Plus, X } from "lucide-react"

/**
 * Floating Action Button - Organic Modernism Style
 * 
 * A material-design inspired FAB with ArchiFlow's warm palette.
 * Supports expandable sub-actions.
 */

const FloatingActionButton = React.forwardRef(
  ({ 
    className, 
    children, 
    icon: Icon = Plus, 
    onClick, 
    actions = [], 
    position = "bottom-left",
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    const positionClasses = {
      "bottom-left": "bottom-6 left-6",
      "bottom-right": "bottom-6 right-6",
      "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
    };

    const hasActions = actions.length > 0;

    return (
      <div 
        className={cn(
          "fixed z-50",
          positionClasses[position],
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Sub-actions */}
        <AnimatePresence>
          {isOpen && hasActions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-16 left-0 flex flex-col-reverse gap-3 mb-2"
            >
              {actions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.8, 
                    y: 10,
                    transition: { delay: (actions.length - index) * 0.03 }
                  }}
                  onClick={() => {
                    action.onClick?.();
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl",
                    "bg-card border border-border shadow-organic-lg",
                    "hover:shadow-organic-xl hover:border-primary",
                    "transition-all duration-200",
                    "group"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    "bg-primary/10 text-primary",
                    "group-hover:bg-primary group-hover:text-primary-foreground",
                    "transition-colors duration-200"
                  )}>
                    {action.icon && <action.icon className="w-5 h-5" />}
                  </div>
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={hasActions ? () => setIsOpen(!isOpen) : onClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "w-14 h-14 rounded-full",
            "bg-primary text-primary-foreground",
            "shadow-organic-lg hover:shadow-organic-xl",
            "flex items-center justify-center",
            "transition-all duration-300",
            "hover:bg-primary/90",
            isOpen && "rotate-45"
          )}
          aria-label={hasActions ? "Toggle actions menu" : "Action button"}
        >
          {hasActions ? (
            <motion.div
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          ) : (
            <Icon className="w-6 h-6" />
          )}
        </motion.button>
      </div>
    );
  }
);

FloatingActionButton.displayName = "FloatingActionButton";

export { FloatingActionButton };

