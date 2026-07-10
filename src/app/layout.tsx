import { Outlet } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/shared/Sidebar";
import { QuickActionsProvider } from "@/lib/quick-actions";
import { useRealtimeSync } from "@/lib/queries/realtime";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/shared/LoginScreen";
import { Skeleton } from "@/components/ui/skeleton";

export function AppLayout() {
  const { session, loading } = useAuth();
  useRealtimeSync();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  return (
    <QuickActionsProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pt-16 md:pt-0 md:pl-60">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="mx-auto max-w-[1400px] p-4 md:p-8"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </QuickActionsProvider>
  );
}
