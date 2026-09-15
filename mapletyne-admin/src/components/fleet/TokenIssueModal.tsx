import React, { useState, useEffect } from 'react';

export interface TokenItem {
  id: string;
  uid: string;
  type?: string;
  status?: string;
  group_id?: string;
  group_name?: string;
  driver_name?: string;
  driver_email?: string;
  driver_phone?: string;
  label?: string;
  card_number?: string;
  valid_from?: string;
  valid_until?: string;
  last_used?: string;
  created_at?: string;
}

export interface GroupItem {
  id: string;
  name: string;
}

interface TokenIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    uid: string;
    type: string;
    status?: string;
    group_id?: string;
    driver_name?: string;
    driver_email?: string;
    driver_phone?: string;
    label?: string;
    card_number?: string;
    valid_from?: string;
    valid_until?: string;
  }) => void;
  groups: GroupItem[];
  initialData?: TokenItem | null;
  isLoading?: boolean;
}

export const TokenIssueModal: React.FC<TokenIssueModalProps> = ({
  isOpen,
  onClose,
  onSave,
  groups,
  initialData,
  isLoading = false,
}) => {
  const isEdit = Boolean(initialData);

  const [uid, setUid] = useState('');
  const [type, setType] = useState('rfid');
  const [groupId, setGroupId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [label, setLabel] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  useEffect(() => {
    if (initialData) {
      setUid(initialData.uid || initialData.id || '');
      setType(initialData.type || 'rfid');
      setGroupId(initialData.group_id || '');
      setDriverName(initialData.driver_name || '');
      setDriverEmail(initialData.driver_email || '');
      setDriverPhone(initialData.driver_phone || '');
      setLabel(initialData.label || '');
      setCardNumber(initialData.card_number || '');
      setValidFrom(initialData.valid_from ? initialData.valid_from.substring(0, 16) : '');
      setValidUntil(initialData.valid_until ? initialData.valid_until.substring(0, 16) : '');
    } else {
      setUid('');
      setType('rfid');
      setGroupId('');
      setDriverName('');
      setDriverEmail('');
      setDriverPhone('');
      setLabel('');
      setCardNumber('');
      setValidFrom('');
      setValidUntil('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      uid: uid.trim(),
      type,
      group_id: groupId || undefined,
      driver_name: driverName.trim() || undefined,
      driver_email: driverEmail.trim() || undefined,
      driver_phone: driverPhone.trim() || undefined,
      label: label.trim() || undefined,
      card_number: cardNumber.trim() || undefined,
      valid_from: validFrom ? new Date(validFrom).toISOString() : undefined,
      valid_until: validUntil ? new Date(validUntil).toISOString() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-surface-container-low border border-outline-variant/30 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">add_card</span>
            <h2 className="font-headline text-lg font-bold text-on-surface">
              {isEdit ? 'Edit Token Authorization' : 'Issue New RFID / Driver Token'}
            </h2>
          </div>
          <button onClick={onClose} type="button" className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-body text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-on-surface-variant uppercase mb-1">
                Token UID / Card Tag
              </label>
              <input
                type="text"
                required
                disabled={isEdit}
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="e.g. 04A1B2C3D4 or OCPO_TOKEN_1"
                className={`w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono ${
                  isEdit ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div>
              <label className="block font-mono text-on-surface-variant uppercase mb-1">
                Token Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
              >
                <option value="rfid">Physical RFID Badge / Card</option>
                <option value="app_virtual">Mobile App Virtual Token</option>
                <option value="keyfob">Hardware Key Fob</option>
                <option value="iso15118_emaid">ISO 15118 eMAID (PnC)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-on-surface-variant uppercase mb-1">
                Fleet Corporate Group
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
              >
                <option value="">(None - Public Pool)</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-on-surface-variant uppercase mb-1">
                Badge / Card Number (Optional)
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="e.g. #008291"
                className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-on-surface-variant uppercase mb-1">
                Driver Name
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Jean Dupont"
                className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
              />
            </div>
            <div>
              <label className="block font-mono text-on-surface-variant uppercase mb-1">
                Driver Email
              </label>
              <input
                type="email"
                value={driverEmail}
                onChange={(e) => setDriverEmail(e.target.value)}
                placeholder="driver@logistics.com"
                className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
              />
            </div>
            <div>
              <label className="block font-mono text-on-surface-variant uppercase mb-1">
                Driver Phone
              </label>
              <input
                type="tel"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="+31 6 12345678"
                className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-on-surface-variant uppercase mb-1">
              Token Label / Notes
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Delivery Van #44 Priority Card"
              className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-on-surface-variant uppercase mb-1">
                Valid From (Optional)
              </label>
              <input
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-on-surface-variant uppercase mb-1">
                Valid Until (Optional)
              </label>
              <input
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono text-xs"
              />
            </div>
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
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>{isEdit ? 'Update Token' : 'Provision Token'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
