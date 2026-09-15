import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ensureArray } from '@/lib/utils';
import type { GroupDetailItem } from './GroupModal';

interface GroupUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupDetailItem | null;
}

export const GroupUsageModal: React.FC<GroupUsageModalProps> = ({ isOpen, onClose, group }) => {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const { data: usageData, isLoading } = useQuery({
    queryKey: ['groups', group?.id, 'usage', selectedMonth],
    queryFn: () => api.get<any>(`/groups/${group?.id}/usage?month=${selectedMonth}`),
    enabled: Boolean(isOpen && group?.id),
  });

  const cards = ensureArray<any>(usageData, 'cards');

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-surface-container-low border border-outline-variant/30 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">bar_chart</span>
            <h2 className="font-headline text-lg font-bold text-on-surface">
              Monthly Usage Breakdown: {group.name}
            </h2>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex items-center justify-between bg-surface-container p-3 border border-outline-variant/20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-on-surface-variant uppercase font-bold">Billing Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-surface-container-high border border-outline-variant/30 h-8 px-2 text-on-surface font-mono text-xs"
            />
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <span className="text-[10px] text-on-surface-variant font-mono block">Total Energy</span>
              <span className="text-sm font-bold text-primary font-mono">
                {Number(usageData?.total_kwh ?? group.month_kwh ?? 0).toFixed(1)} kWh
              </span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant font-mono block">Cards Active</span>
              <span className="text-sm font-bold text-secondary font-mono">
                {cards.length}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[50vh]">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-surface-container text-on-surface-variant uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-2.5">Card UID</th>
                <th className="p-2.5">Driver Name</th>
                <th className="p-2.5 text-right">Sessions</th>
                <th className="p-2.5 text-right">Energy (kWh)</th>
                <th className="p-2.5 text-right">Estimated Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-on-surface-variant">
                    Loading monthly billing telemetry...
                  </td>
                </tr>
              ) : cards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-on-surface-variant">
                    No charging activity recorded for this corporate group in {selectedMonth}.
                  </td>
                </tr>
              ) : (
                cards.map((c: any) => (
                  <tr key={c.uid || c.card_id || c.id_tag || Math.random()} className="hover:bg-surface-container-high/40">
                    <td className="p-2.5 font-bold text-on-surface">{c.uid || c.card_id || c.id_tag || '—'}</td>
                    <td className="p-2.5 text-on-surface-variant">{c.driver_name || c.driver || '—'}</td>
                    <td className="p-2.5 text-right text-on-surface">{c.sessions ?? c.session_count ?? 0}</td>
                    <td className="p-2.5 text-right text-primary font-bold">
                      {Number(c.kwh ?? c.total_kwh ?? 0).toFixed(2)} kWh
                    </td>
                    <td className="p-2.5 text-right text-secondary font-bold">
                      £{Number(c.cost ?? c.total_cost ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-3 border-t border-outline-variant/20">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-container border border-outline-variant/30 text-on-surface font-mono text-xs hover:bg-surface-container-high transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
