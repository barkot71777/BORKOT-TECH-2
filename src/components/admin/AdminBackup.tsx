import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Database, Download, Check, ShieldCheck, Server } from 'lucide-react';

export const AdminBackup: React.FC = () => {
  const { authFetch } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDownloadBackup = async () => {
    setDownloading(true);
    setDownloadSuccess(false);
    setErrorMsg('');
    try {
      const res = await authFetch('/api/admin/backup');
      if (res.ok) {
        const data = await res.json();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `borkot_tech_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloadSuccess(true);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to export backup');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to export backup due to network error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Database Operations & Snapshots</h1>
        <p className="text-xs text-slate-400 mt-1">
          Export persistent JSON snapshots, inspect schema integrity, and maintain data backups.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 rounded-xl shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Persistent Storage Engine</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Borkot Tech stores all authoritative entities (products, inventory movement logs, orders, users, and audit trails) in a durable, ACID-compliant file-backed store at <code className="text-cyan-400 font-mono bg-slate-950 px-1 py-0.5 rounded">data/borkot_tech.db.json</code> with atomic rename-write protection.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Export a full sanitized snapshot of the store's current database state.
          </div>

          <button
            onClick={handleDownloadBackup}
            disabled={downloading}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-98 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Generating...' : 'Export Snapshot JSON'}</span>
          </button>
        </div>

        {downloadSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Database snapshot downloaded to your local device.</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Backup & Restore Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3 text-xs text-slate-300">
        <h3 className="text-sm font-bold text-white">Disaster Recovery & Migration Procedures</h3>
        <ul className="list-disc list-inside space-y-1.5 text-slate-400">
          <li><strong>Automated Atomic Writes:</strong> Write operations are committed to a temporary file before renaming, preventing file corruption in case of unexpected host restarts.</li>
          <li><strong>Manual Restore:</strong> To restore a previous snapshot, replace <code className="text-cyan-400">data/borkot_tech.db.json</code> with your snapshot and restart the Node.js server.</li>
          <li><strong>Security:</strong> Exported backups contain hashed passwords (PBKDF2-SHA512) and zero plaintext credentials. Keep your backups in an encrypted repository.</li>
        </ul>
      </div>

    </div>
  );
};
