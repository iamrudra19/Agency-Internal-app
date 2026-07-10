import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/20",
        secondary: "bg-elevated text-text-primary border border-white/10 hover:border-indigo-500/40 hover:bg-white/5",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-white/5",
        danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
        success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-2.5 text-xs rounded-md",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
