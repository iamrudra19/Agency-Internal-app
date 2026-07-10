import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ContactForm } from "@/components/contacts/ContactForm";
import { DealForm } from "@/components/pipeline/DealForm";
import { TaskForm } from "@/components/shared/TaskForm";

interface QuickActions {
  openNewContact: () => void;
  openNewDeal: () => void;
  openNewTask: () => void;
}

const QuickActionsContext = createContext<QuickActions>({
  openNewContact: () => {},
  openNewDeal: () => {},
  openNewTask: () => {},
});

export function useQuickActions() {
  return useContext(QuickActionsContext);
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

export function QuickActionsProvider({ children }: { children: ReactNode }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const navigate = useNavigate();
  const gPressed = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();

      if (gPressed.current) {
        gPressed.current = false;
        if (gTimer.current) clearTimeout(gTimer.current);
        const routes: Record<string, string> = { d: "/", p: "/pipeline", o: "/outreach", c: "/contacts", a: "/analytics", s: "/settings" };
        if (routes[key]) {
          e.preventDefault();
          navigate({ to: routes[key] });
          return;
        }
      }

      switch (key) {
        case "g":
          gPressed.current = true;
          gTimer.current = setTimeout(() => (gPressed.current = false), 1500);
          break;
        case "n":
          e.preventDefault();
          setContactOpen(true);
          break;
        case "d":
          e.preventDefault();
          setDealOpen(true);
          break;
        case "t":
          e.preventDefault();
          setTaskOpen(true);
          break;
        case "/": {
          e.preventDefault();
          const search = document.querySelector<HTMLInputElement>("[data-search-input]");
          search?.focus();
          break;
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  const openNewContact = useCallback(() => setContactOpen(true), []);
  const openNewDeal = useCallback(() => setDealOpen(true), []);
  const openNewTask = useCallback(() => setTaskOpen(true), []);

  return (
    <QuickActionsContext.Provider value={{ openNewContact, openNewDeal, openNewTask }}>
      {children}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogTitle>New Contact</DialogTitle>
          <DialogDescription>Add a prospect to the machine. Press N anywhere.</DialogDescription>
          <ContactForm onDone={() => setContactOpen(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={dealOpen} onOpenChange={setDealOpen}>
        <DialogContent>
          <DialogTitle>New Deal</DialogTitle>
          <DialogDescription>Track a new opportunity. Press D anywhere.</DialogDescription>
          <DealForm onDone={() => setDealOpen(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>Add a follow-up. Press T anywhere.</DialogDescription>
          <TaskForm onDone={() => setTaskOpen(false)} />
        </DialogContent>
      </Dialog>
    </QuickActionsContext.Provider>
  );
}
