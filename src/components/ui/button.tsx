"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary hover:bg-primary-dark text-white hover:shadow-[0_0_30px_rgba(108,99,255,0.4)]",
        neon: "bg-transparent border-2 border-accent text-accent hover:bg-accent/10 hover:shadow-[0_0_30px_rgba(0,245,212,0.3)]",
        ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5",
        danger: "bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20",
        glass: "glass hover:border-primary/40 text-white",
      },
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-5 py-3 text-sm",
        lg: "px-8 py-4 text-base",
        icon: "w-10 h-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
