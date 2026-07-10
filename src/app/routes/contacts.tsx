import { useState } from "react";
import { Users, Plus, FileUp } from "lucide-react";
import { useContacts } from "@/lib/queries/contacts";
import { ContactList } from "@/components/contacts/ContactList";
import { ContactDetail } from "@/components/contacts/ContactDetail";
import { ContactForm } from "@/components/contacts/ContactForm";
import { CsvImport } from "@/components/contacts/CsvImport";
import { SearchBar } from "@/components/shared/SearchBar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/ui/skeleton";
import type { Contact } from "@/types/database";

export function ContactsPage() {
  const { data: contacts, isLoading } = useContacts();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Keep the slide-over in sync with fresh data after edits
  const liveSelected = selected ? (contacts?.find((c) => c.id === selected.id) ?? null) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight">Contacts</h1>
        <div className="flex items-center gap-2">
          <SearchBar
            placeholder="Search name, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72"
          />
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <FileUp className="h-4 w-4" /> <span className="hidden sm:inline">Import</span>
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Contact</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (contacts ?? []).length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Contacts are the raw fuel for the revenue machine. Add your first prospect or bulk-import a CSV list."
          actionLabel="Add First Contact"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <ContactList contacts={contacts ?? []} search={search} onSelect={setSelected} />
      )}

      <ContactDetail contact={liveSelected} onClose={() => setSelected(null)} />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogTitle>New Contact</DialogTitle>
          <ContactForm onDone={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogTitle>Bulk Import (CSV)</DialogTitle>
          <CsvImport onDone={() => setImportOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
