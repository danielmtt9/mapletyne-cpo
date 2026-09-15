import React, { useState, useEffect } from 'react';

export interface GroupDetailItem {
  id: string;
  name: string;
  billing_email?: string;
  billing_address?: string;
  billing_reference?: string;
  contact_name?: string;
  contact_phone?: string;
  notes?: string;
  token_count?: number;
  active_count?: number;
  month_kwh?: number;
}

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    billing_email?: string;
    billing_address?: string;
    billing_reference?: string;
    contact_name?: string;
    contact_phone?: string;
    notes?: string;
  }) => void;
  initialData?: GroupDetailItem | null;
  isLoading?: boolean;
}

export const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}) => {
  const isEdit = Boolean(initialData);

  const [name, setName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingReference, setBillingReference] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setBillingEmail(initialData.billing_email || '');
      setBillingAddress(initialData.billing_address || '');
      setBillingReference(initialData.billing_reference || '');
      setContactName(initialData.contact_name || '');
      setContactPhone(initialData.contact_phone || '');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setBillingEmail('');
      setBillingAddress('');
      setBillingReference('');
      setContactName('');
      setContactPhone('');
      setNotes('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      billing_email: billingEmail.trim() || undefined,
      billing_address: billingAddress.trim() || undefined,
      billing_reference: billingReference.trim() || undefined,
      contact_name: contactName.trim() || undefined,
      contact_phone: contactPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-surface-container-low border border-outline-variant/30 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">corporate_fare</span>
            <h2 className="font-headline text-lg font-bold text-on-surface">
              {isEdit ? 'Edit Corporate Fleet Group' : 'Create Corporate Fleet Group'}
            </h2>
          </div>
          <button onClick={onClose} type="button" className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-body text-xs">
          <div>
            <label className="block font-mono text-on-surface-variant uppercase mb-1">
              Company / Group Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DHL Express Logistics"
              className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-on-surface-variant uppercase mb-1">
                Billing Email
              </label>
              <input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="invoices@company.com"
                className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
              />
            </div>
            <div>
              <label className="block font-mono text-on-surface-variant uppercase mb-1">
                Billing Reference (VAT / PO)
              </label>
              <input
                type="text"
                value={billingReference}
                onChange={(e) => setBillingReference(e.target.value)}
                placeholder="e.g. NL123456789B01 / PO-9921"
                className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-on-surface-variant uppercase mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
              />
            </div>
            <div>
              <label className="block font-mono text-on-surface-variant uppercase mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+31 20 555 1234"
                className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-on-surface-variant uppercase mb-1">
              Billing Postal Address
            </label>
            <input
              type="text"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="Keizersgracht 100, 1015AA Amsterdam, NL"
              className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
            />
          </div>

          <div>
            <label className="block font-mono text-on-surface-variant uppercase mb-1">
              Notes & Contract Terms
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Commercial terms, fleet discount SLA, special instructions..."
              className="w-full bg-surface-container border border-outline-variant/30 p-2 text-on-surface font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-primary text-on-primary font-bold font-mono hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isEdit ? 'Update Group' : 'Save Corporate Group'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
