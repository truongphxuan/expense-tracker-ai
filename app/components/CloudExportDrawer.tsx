'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Expense } from '../types/expense';
import {
  TEMPLATES, CLOUD_SERVICES,
  ExportTemplate, CloudConnection, ScheduleConfig, ExportHistoryEntry,
  CloudProvider, ScheduleFrequency,
  loadHistory, addHistoryEntry, clearHistory,
  loadSchedule, saveSchedule,
  loadConnections, saveConnections,
  buildCSV, buildJSON, triggerDownload, estimateFileSize,
} from '../lib/cloudExport';
import { formatCurrency, formatDate } from '../lib/utils';
import { format } from 'date-fns';
import {
  X, LayoutTemplate, Cloud, Clock, History, Share2,
  CheckCircle2, AlertCircle, Loader2, Zap, Download,
  Mail, RefreshCw, Trash2, Copy, Check, Link2,
  ChevronRight, Play, Settings, Wifi, WifiOff,
} from 'lucide-react';

type Tab = 'templates' | 'connections' | 'automations' | 'history' | 'share';

interface Props {
  expenses: Expense[];
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT DRAWER
// ─────────────────────────────────────────────────────────────────────────────

export default function CloudExportDrawer({ expenses, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('templates');
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [schedule, setSchedule] = useState<ScheduleConfig | null>(null);
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);

  useEffect(() => {
    setConnections(loadConnections());
    setSchedule(loadSchedule());
    setHistory(loadHistory());
  }, []);

  const connectedCount = connections.filter((c) => c.connected).length;

  const handleExportRun = useCallback(
    (template: ExportTemplate, destination: string) => {
      const filtered = template.filterFn(expenses);
      const start = Date.now();
      let content = '';
      let ext = template.format;

      if (template.format === 'csv' || template.format === 'sheets') {
        content = buildCSV(filtered);
        ext = 'csv';
      } else {
        content = buildJSON(filtered);
        ext = 'json';
      }

      const filename = `${template.id}-${format(new Date(), 'yyyy-MM-dd')}.${ext}`;
      if (destination === 'download') triggerDownload(content, filename, 'text/plain');

      const entry = addHistoryEntry({
        timestamp: new Date().toISOString(),
        templateName: template.name,
        format: template.format,
        recordCount: filtered.length,
        totalAmount: filtered.reduce((s, e) => s + e.amount, 0),
        destination,
        status: 'success',
        fileSize: estimateFileSize(content),
        duration: Date.now() - start,
      });
      setHistory((prev) => [entry, ...prev]);
    },
    [expenses]
  );

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'connections', label: 'Connections', icon: Cloud, badge: connectedCount || undefined },
    { id: 'automations', label: 'Automations', icon: Zap },
    { id: 'history', label: 'History', icon: History, badge: history.length || undefined },
    { id: 'share', label: 'Share', icon: Share2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-2xl bg-white flex flex-col h-full shadow-2xl animate-slide-in">
        {/* ── Drawer header ── */}
        <div className="bg-gradient-to-r from-violet-700 to-indigo-700 px-6 py-5 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Cloud size={18} className="text-violet-200" />
                <h2 className="text-lg font-bold text-white">Export Hub</h2>
              </div>
              <p className="text-violet-200 text-xs mt-1">
                {expenses.length} expenses · {connectedCount} service{connectedCount !== 1 ? 's' : ''} connected
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mt-4 overflow-x-auto pb-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors relative shrink-0 ${
                    active
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'text-violet-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={12} />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-violet-100 text-violet-700' : 'bg-white/20 text-white'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'templates' && (
            <TemplatesView expenses={expenses} onRun={handleExportRun} />
          )}
          {activeTab === 'connections' && (
            <ConnectionsView
              connections={connections}
              onChange={(c) => { setConnections(c); saveConnections(c); }}
            />
          )}
          {activeTab === 'automations' && (
            <AutomationsView
              schedule={schedule}
              connections={connections}
              onChange={(s) => { setSchedule(s); if (s) saveSchedule(s); }}
            />
          )}
          {activeTab === 'history' && (
            <HistoryView
              history={history}
              onClear={() => { clearHistory(); setHistory([]); }}
            />
          )}
          {activeTab === 'share' && (
            <ShareView expenses={expenses} />
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES VIEW
// ─────────────────────────────────────────────────────────────────────────────

function TemplatesView({
  expenses,
  onRun,
}: {
  expenses: Expense[];
  onRun: (t: ExportTemplate, dest: string) => void;
}) {
  const [running, setRunning] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function run(template: ExportTemplate) {
    setRunning(template.id);
    await new Promise((r) => setTimeout(r, 600));
    onRun(template, 'download');
    setRunning(null);
    setDone(template.id);
    setTimeout(() => setDone(null), 2500);
  }

  return (
    <div className="p-6 space-y-3">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Export Templates</h3>
        <p className="text-xs text-gray-400 mt-0.5">Pre-configured exports for common use cases</p>
      </div>
      {TEMPLATES.map((t) => {
        const count = t.filterFn(expenses).length;
        const isRunning = running === t.id;
        const isDone = done === t.id;
        return (
          <div
            key={t.id}
            className={`flex items-center gap-4 p-4 rounded-xl border ${t.bgColor} transition-all`}
          >
            <span className="text-2xl shrink-0">{t.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/70 ${t.accentColor}`}>
                  {t.tag}
                </span>
                <span className="text-[10px] font-mono text-gray-400 ml-auto">.{t.format === 'sheets' ? 'csv' : t.format}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.description}</p>
              <p className="text-xs text-gray-400 mt-1">{count} record{count !== 1 ? 's' : ''} match</p>
            </div>
            <button
              onClick={() => run(t)}
              disabled={count === 0 || isRunning || isDone}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                isDone
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-sm'
              }`}
            >
              {isRunning ? <Loader2 size={12} className="animate-spin" /> : isDone ? <Check size={12} /> : <Download size={12} />}
              {isRunning ? 'Running…' : isDone ? 'Done!' : 'Run'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONNECTIONS VIEW
// ─────────────────────────────────────────────────────────────────────────────

function ConnectionsView({
  connections,
  onChange,
}: {
  connections: CloudConnection[];
  onChange: (c: CloudConnection[]) => void;
}) {
  const [connecting, setConnecting] = useState<CloudProvider | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailTarget, setEmailTarget] = useState<CloudProvider | null>(null);

  function getConnection(id: CloudProvider) {
    return connections.find((c) => c.provider === id);
  }

  async function toggleConnect(id: CloudProvider) {
    const existing = getConnection(id);
    if (existing?.connected) {
      onChange(connections.filter((c) => c.provider !== id));
      return;
    }
    if (id === 'email') {
      setEmailTarget(id);
      return;
    }
    setConnecting(id);
    await new Promise((r) => setTimeout(r, 1200));
    const updated = connections.filter((c) => c.provider !== id);
    onChange([...updated, { provider: id, connected: true, connectedAt: new Date().toISOString(), accountEmail: `user@${id.replace('-', '')}.com` }]);
    setConnecting(null);
  }

  function connectEmail() {
    if (!emailInput.includes('@')) return;
    const updated = connections.filter((c) => c.provider !== 'email');
    onChange([...updated, { provider: 'email', connected: true, connectedAt: new Date().toISOString(), accountEmail: emailInput }]);
    setEmailTarget(null);
    setEmailInput('');
  }

  return (
    <div className="p-6 space-y-3">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Connected Services</h3>
        <p className="text-xs text-gray-400 mt-0.5">Link your accounts to enable direct export</p>
      </div>

      {CLOUD_SERVICES.map((svc) => {
        const conn = getConnection(svc.id);
        const isConnected = conn?.connected;
        const isConnecting = connecting === svc.id;

        return (
          <div key={svc.id} className={`flex items-center gap-4 p-4 rounded-xl border ${svc.bg} ${svc.border}`}>
            <span className="text-2xl shrink-0">{svc.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                {svc.comingSoon && (
                  <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">Soon</span>
                )}
                {isConnected && (
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                    <Wifi size={9} /> Connected
                  </span>
                )}
              </div>
              {isConnected ? (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{conn?.accountEmail}</p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">{svc.description}</p>
              )}
            </div>

            {!svc.comingSoon && (
              <button
                onClick={() => toggleConnect(svc.id)}
                disabled={isConnecting}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isConnected
                    ? 'bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                {isConnecting ? <Loader2 size={12} className="animate-spin" /> : isConnected ? <WifiOff size={12} /> : <ChevronRight size={12} />}
                {isConnecting ? 'Connecting…' : isConnected ? 'Disconnect' : 'Connect'}
              </button>
            )}
          </div>
        );
      })}

      {/* Email modal */}
      {emailTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-gray-900 mb-1">Connect Email</h3>
            <p className="text-xs text-gray-400 mb-4">Reports will be sent to this address</p>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
              onKeyDown={(e) => e.key === 'Enter' && connectEmail()}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setEmailTarget(null)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">Cancel</button>
              <button onClick={connectEmail} className="flex-1 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-semibold">Connect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATIONS VIEW
// ─────────────────────────────────────────────────────────────────────────────

function AutomationsView({
  schedule,
  connections,
  onChange,
}: {
  schedule: ScheduleConfig | null;
  connections: CloudConnection[];
  onChange: (s: ScheduleConfig) => void;
}) {
  const [local, setLocal] = useState<ScheduleConfig>(
    schedule ?? {
      enabled: false,
      frequency: 'monthly',
      hour: 9,
      templateId: 'monthly-summary',
      destination: 'download',
      createdAt: new Date().toISOString(),
    }
  );
  const [saved, setSaved] = useState(false);

  function update(patch: Partial<ScheduleConfig>) {
    setLocal((prev) => ({ ...prev, ...patch }));
  }

  function save() {
    onChange(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const connectedServices = connections.filter((c) => c.connected);

  const nextRunLabel = () => {
    const freqMap: Record<ScheduleFrequency, string> = {
      daily: 'Tomorrow',
      weekly: 'Next Monday',
      monthly: '1st of next month',
    };
    return `${freqMap[local.frequency]} at ${String(local.hour).padStart(2, '0')}:00`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Automated Exports</h3>
        <p className="text-xs text-gray-400 mt-0.5">Set up recurring exports that run in the background</p>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-800">Enable Automation</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {local.enabled ? `Next run: ${nextRunLabel()}` : 'Automation is paused'}
          </p>
        </div>
        <button
          onClick={() => update({ enabled: !local.enabled })}
          className={`relative w-11 h-6 rounded-full transition-colors ${local.enabled ? 'bg-violet-600' : 'bg-gray-200'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${local.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Frequency */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Frequency</label>
        <div className="grid grid-cols-3 gap-2">
          {(['daily', 'weekly', 'monthly'] as ScheduleFrequency[]).map((f) => (
            <button
              key={f}
              onClick={() => update({ frequency: f })}
              className={`py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                local.frequency === f
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Time */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Time of Day</label>
        <select
          value={local.hour}
          onChange={(e) => update({ hour: Number(e.target.value) })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {[6, 7, 8, 9, 10, 12, 17, 18, 20, 22].map((h) => (
            <option key={h} value={h}>{String(h).padStart(2, '0')}:00 — {h < 12 ? 'AM' : 'PM'}</option>
          ))}
        </select>
      </div>

      {/* Template */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Template</label>
        <select
          value={local.templateId}
          onChange={(e) => update({ templateId: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>
          ))}
        </select>
      </div>

      {/* Destination */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Send To</label>
        <select
          value={local.destination}
          onChange={(e) => update({ destination: e.target.value as any })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="download">⬇️ Download to device</option>
          {connectedServices.map((c) => {
            const svc = CLOUD_SERVICES.find((s) => s.id === c.provider);
            return (
              <option key={c.provider} value={c.provider}>
                {svc?.emoji} {svc?.name} — {c.accountEmail}
              </option>
            );
          })}
        </select>
        {connectedServices.length === 0 && (
          <p className="text-xs text-amber-600 mt-1.5">Connect a service in the Connections tab to send there automatically.</p>
        )}
      </div>

      <button
        onClick={save}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
          saved ? 'bg-emerald-500 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'
        }`}
      >
        {saved ? '✓ Saved!' : 'Save Automation'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY VIEW
// ─────────────────────────────────────────────────────────────────────────────

function HistoryView({
  history,
  onClear,
}: {
  history: ExportHistoryEntry[];
  onClear: () => void;
}) {
  const statusIcon = (s: ExportHistoryEntry['status']) => {
    if (s === 'success') return <CheckCircle2 size={14} className="text-emerald-500" />;
    if (s === 'failed') return <AlertCircle size={14} className="text-red-500" />;
    return <Loader2 size={14} className="text-blue-500 animate-spin" />;
  };

  const destLabel = (dest: string) => {
    const svc = CLOUD_SERVICES.find((s) => s.id === dest);
    return svc ? `${svc.emoji} ${svc.name}` : '⬇️ Download';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Export History</h3>
          <p className="text-xs text-gray-400 mt-0.5">{history.length} export{history.length !== 1 ? 's' : ''} recorded</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <History size={32} className="text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">No exports yet</p>
          <p className="text-xs text-gray-300 mt-1">Run a template to see history here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white transition-colors">
              <div className="mt-0.5">{statusIcon(entry.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800 truncate">{entry.templateName}</p>
                  <span className="text-[10px] font-mono text-gray-400 shrink-0">.{entry.format === 'sheets' ? 'csv' : entry.format}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400">{entry.recordCount} records</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{formatCurrency(entry.totalAmount)}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{entry.fileSize}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">{destLabel(entry.destination)}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARE VIEW
// ─────────────────────────────────────────────────────────────────────────────

function ShareView({ expenses }: { expenses: Expense[] }) {
  const [shareUrl] = useState(
    () => `https://expense-tracker.app/share/${Math.random().toString(36).slice(2, 10)}`
  );
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [emailTo, setEmailTo] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('monthly-summary');

  useEffect(() => {
    let cancelled = false;
    import('qrcode').then((QRCode) => {
      QRCode.default.toDataURL(shareUrl, { width: 180, margin: 2, color: { dark: '#4c1d95', light: '#faf5ff' } })
        .then((url) => { if (!cancelled) { setQrDataUrl(url); setQrLoading(false); } });
    });
    return () => { cancelled = true; };
  }, [shareUrl]);

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendEmail() {
    if (!emailTo.includes('@')) return;
    setSendingEmail(true);
    await new Promise((r) => setTimeout(r, 1400));
    setSendingEmail(false);
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  }

  const tmpl = TEMPLATES.find((t) => t.id === activeTemplate)!;
  const previewCount = tmpl.filterFn(expenses).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Share & Collaborate</h3>
        <p className="text-xs text-gray-400 mt-0.5">Generate shareable links or send reports by email</p>
      </div>

      {/* Template picker */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Report Template</label>
        <select
          value={activeTemplate}
          onChange={(e) => setActiveTemplate(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-1.5">{previewCount} record{previewCount !== 1 ? 's' : ''} will be included</p>
      </div>

      {/* Share link + QR */}
      <div className="bg-violet-50 border border-violet-100 rounded-xl p-5">
        <div className="flex items-start gap-5">
          <div className="flex-1">
            <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Link2 size={11} /> Shareable Link
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 rounded-lg bg-white border border-violet-200 px-3 py-2 text-xs text-violet-800 focus:outline-none font-mono overflow-ellipsis"
              />
              <button
                onClick={copyLink}
                className={`shrink-0 p-2 rounded-lg border transition-all ${copied ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-violet-200 text-violet-600 hover:bg-violet-100'}`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[10px] text-violet-400 mt-2">
              Link expires in 7 days · View-only access
            </p>
          </div>

          <div className="shrink-0">
            {qrLoading ? (
              <div className="w-[90px] h-[90px] bg-violet-100 rounded-lg flex items-center justify-center">
                <Loader2 size={18} className="text-violet-400 animate-spin" />
              </div>
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-[90px] h-[90px] rounded-lg" />
            ) : null}
            <p className="text-[10px] text-violet-400 text-center mt-1">Scan to open</p>
          </div>
        </div>
      </div>

      {/* Email send */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Mail size={11} /> Send by Email
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            placeholder="recipient@example.com"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
            onKeyDown={(e) => e.key === 'Enter' && sendEmail()}
          />
          <button
            onClick={sendEmail}
            disabled={!emailTo.includes('@') || sendingEmail || emailSent}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 ${
              emailSent ? 'bg-emerald-500 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}
          >
            {sendingEmail ? <Loader2 size={13} className="animate-spin" /> : emailSent ? <Check size={13} /> : <Mail size={13} />}
            {sendingEmail ? 'Sending…' : emailSent ? 'Sent!' : 'Send'}
          </button>
        </div>
        {emailSent && (
          <p className="text-xs text-emerald-600 mt-1.5">
            ✓ Report sent to {emailTo}
          </p>
        )}
      </div>

      {/* Stats for share context */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Report Preview</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {[
            { label: 'Records', value: String(previewCount) },
            { label: 'Total', value: formatCurrency(tmpl.filterFn(expenses).reduce((s, e) => s + e.amount, 0)) },
            { label: 'Format', value: tmpl.format.toUpperCase() },
          ].map((item) => (
            <div key={item.label} className="px-4 py-3 text-center">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
