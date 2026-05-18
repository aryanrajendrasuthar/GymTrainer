"use client";

import { motion } from "framer-motion";
import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/app/lib/utils";

type CardVariant = "standard" | "elevated" | "glass";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart"> {
  variant?: CardVariant;
  interactive?: boolean;
  noPad?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  standard: "bg-trainer-surface border border-white/8",
  elevated: "bg-trainer-elevated border border-white/10",
  glass: "glass",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "standard", interactive = false, noPad = false, className, children, ...props }, ref) => {
    if (interactive) {
      return (
        <motion.div
          ref={ref as React.Ref<HTMLDivElement>}
          whileHover={{ scale: 1.01, borderColor: "rgba(108, 99, 255, 0.3)" }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "rounded-[16px] transition-colors duration-200 cursor-pointer",
            variantClasses[variant],
            !noPad && "p-4",
            className
          )}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[16px]",
          variantClasses[variant],
          !noPad && "p-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
