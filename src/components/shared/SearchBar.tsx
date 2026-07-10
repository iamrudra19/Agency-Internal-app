import { forwardRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const SearchBar = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <div className={cn("relative", className)}>
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
    <input
      ref={ref}
      data-search-input
      className="h-9 w-full rounded-lg border border-white/10 bg-surface pl-9 pr-12 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
      {...props}
    />
    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
      /
    </kbd>
  </div>
));
SearchBar.displayName = "SearchBar";
