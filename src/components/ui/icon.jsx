import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Icon Component - Organic Modernism Style
 * 
 * Wraps Lucide icons with consistent styling:
 * - Outline (1.5px stroke) for inactive/default states
 * - Filled/heavier stroke for active/hover states
 * 
 * Usage:
 * <Icon icon={Home} active={isActive} />
 * <Icon icon={Settings} variant="filled" />
 */

const Icon = React.forwardRef(
  ({ 
    icon: IconComponent,
    className, 
    active = false,
    variant = "outline", // "outline" | "filled" | "soft"
    size = "default", // "sm" | "default" | "lg" | "xl"
    color = "current", // "current" | "primary" | "secondary" | "muted"
    ...props 
  }, ref) => {
    
    const sizeClasses = {
      sm: "w-4 h-4",
      default: "w-5 h-5",
      lg: "w-6 h-6",
      xl: "w-8 h-8",
    };
    
    const colorClasses = {
      current: "text-current",
      primary: "text-primary",
      secondary: "text-secondary",
      muted: "text-muted-foreground",
      foreground: "text-foreground",
    };
    
    // Stroke width based on variant and active state
    const getStrokeWidth = () => {
      if (active || variant === "filled") return 2;
      if (variant === "soft") return 1.25;
      return 1.5; // default outline
    };

    if (!IconComponent) {
      return null;
    }

    return (
      <IconComponent
        ref={ref}
        className={cn(
          sizeClasses[size],
          colorClasses[color],
          "transition-all duration-200",
          active && "scale-105",
          className
        )}
        strokeWidth={getStrokeWidth()}
        {...props}
      />
    );
  }
);

Icon.displayName = "Icon";

/**
 * IconContainer - Container with background for icons
 * 
 * Usage:
 * <IconContainer color="primary">
 *   <Icon icon={Home} />
 * </IconContainer>
 */
const IconContainer = React.forwardRef(
  ({ 
    children,
    className, 
    color = "primary", // "primary" | "secondary" | "muted" | "accent"
    size = "default", // "sm" | "default" | "lg"
    variant = "soft", // "soft" | "solid" | "outline"
    ...props 
  }, ref) => {
    
    const sizeClasses = {
      sm: "w-8 h-8",
      default: "w-10 h-10",
      lg: "w-12 h-12",
      xl: "w-14 h-14",
    };
    
    const colorVariants = {
      primary: {
        soft: "bg-primary/10 text-primary",
        solid: "bg-primary text-primary-foreground",
        outline: "border-2 border-primary text-primary bg-transparent",
      },
      secondary: {
        soft: "bg-secondary/10 text-secondary",
        solid: "bg-secondary text-secondary-foreground",
        outline: "border-2 border-secondary text-secondary bg-transparent",
      },
      muted: {
        soft: "bg-muted text-muted-foreground",
        solid: "bg-muted-foreground text-background",
        outline: "border-2 border-muted-foreground text-muted-foreground bg-transparent",
      },
      accent: {
        soft: "bg-accent text-accent-foreground",
        solid: "bg-accent-foreground text-accent",
        outline: "border-2 border-accent-foreground text-accent-foreground bg-transparent",
      },
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl flex items-center justify-center",
          sizeClasses[size],
          colorVariants[color]?.[variant] || colorVariants.primary.soft,
          "transition-colors duration-200",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

IconContainer.displayName = "IconContainer";

export { Icon, IconContainer };

