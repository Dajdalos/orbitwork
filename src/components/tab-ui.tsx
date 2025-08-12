export function TabMenu({
  tabs,
  activeId,
}: {
  tabs: { id: string; label: string }[];
  activeId?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(t => (
        <span
          key={t.id}
          className={`px-3 py-1 rounded border text-sm ${t.id === activeId ? 'bg-black text-white' : ''}`}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}

export function InvoicesCard({ tabId }: { tabId: string }) {
  return (
    <div className="border rounded p-4">
      <div className="font-medium mb-2">Invoices (Tab {tabId.slice(0, 6)}…)</div>
      <p className="text-sm text-gray-600">Hook up storage & approvals here.</p>
    </div>
  );
}

export function ProofsCard({ tabId }: { tabId: string }) {
  return (
    <div className="border rounded p-4">
      <div className="font-medium mb-2">Photo Proofs (Tab {tabId.slice(0, 6)}…)</div>
      <p className="text-sm text-gray-600">Add your uploads & gallery here.</p>
    </div>
  );
}

export function RolesRatesCard({ tabId }: { tabId: string }) {
  return (
    <div className="border rounded p-4">
      <div className="font-medium mb-2">Roles & Rates (Tab {tabId.slice(0, 6)}…)</div>
      <p className="text-sm text-gray-600">Configure roles/rates per tab.</p>
    </div>
  );
}
