import React from 'react';
import { Database, Workflow, Cpu, ShieldCheck, ShieldAlert, Code2, Globe, Lock, Server } from 'lucide-react';

const ArchitectureDocs = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="space-y-4">
        <div className="flex items-center space-x-2 text-indigo-600 font-black uppercase tracking-widest text-xs">
          <ShieldCheck size={16} />
          <span>SaaS v3 Compliance Architecture</span>
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
          物理隔離與全方位稽核
        </h1>
        <p className="text-slate-500 text-xl max-w-2xl font-medium leading-relaxed">
          針對上櫃公司 (Listed Companies) 的高規格資料隔離設計，確保不同租戶間的物理邊界。
        </p>
      </header>

      {/* Schema Isolation Section */}
      <section className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-8">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-500 p-3 rounded-2xl"><Server size={32} /></div>
            <h2 className="text-3xl font-black">Schema-level Isolation</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
              <div className="text-indigo-400 font-black mb-2">Company A</div>
              <code className="text-[10px] text-slate-400">SCHEMA: schema_corp_a</code>
              <p className="text-xs text-slate-500 mt-4 leading-relaxed">完全獨立的 Tablespace。與其他公司在 DB 層級即切換環境，防止 IDOR 越權攻擊。</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
              <div className="text-emerald-400 font-black mb-2">Company B</div>
              <code className="text-[10px] text-slate-400">SCHEMA: schema_listed_01</code>
              <p className="text-xs text-slate-500 mt-4 leading-relaxed">上櫃專用 Schema，預設啟動全欄位稽核與 Trigger Logging。</p>
            </div>

            <div className="bg-indigo-600/20 border border-indigo-500/30 p-6 rounded-3xl flex flex-col items-center justify-center text-center">
              <Lock size={24} className="mb-2 text-indigo-400" />
              <div className="font-bold text-sm">Strict RLS Enabled</div>
              <p className="text-[10px] text-indigo-300/60 mt-2">Row-Level Security 作為第二道防線</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <Database size={300} />
        </div>
      </section>

      {/* Audit SQL */}
      <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center space-x-4">
          <Workflow size={28} className="text-indigo-600" />
          <h2 className="text-2xl font-black text-slate-800">稽核日誌實現機制</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center text-sm uppercase tracking-wider">
              <Code2 size={16} className="mr-2" />
              Database Trigger (PL/pgSQL)
            </h3>
            <div className="bg-slate-50 p-6 rounded-3xl font-mono text-[11px] text-slate-600 leading-relaxed border border-slate-100">
              <pre>{`\nCREATE OR REPLACE FUNCTION log_audit_change()\nRETURNS TRIGGER AS \$\$\nBEGIN\n  INSERT INTO audit_logs (\n    actor, action, old_val, new_val, timestamp\n  )\n  VALUES (\n    current_setting('app.current_user'),\n    TG_OP,\n    row_to_json(OLD),\n    row_to_json(NEW),\n    now()\n  );\n  RETURN NEW;\nEND;\n\$\$ LANGUAGE plpgsql;\n              `}</pre>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-6">
            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
              <h4 className="font-bold text-indigo-900 mb-2">不可篡改性 (Immutability)</h4>
              <p className="text-sm text-indigo-700 leading-relaxed">
                審計日誌表僅允許 <code>INSERT</code> 操作。即使是資料庫管理員 (DBA) 帳號也受連鎖稽核限制，任何修改日誌的行為均會觸發警報，完全符合外部稽核標準。
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <h4 className="font-bold text-slate-800 mb-2">租戶連線池切換</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                採用動態數據源切換 (Dynamic DataSource Routing)，根據 Tenant Token 切換實體連線，確保記憶體與緩存級別的隔離。
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-10">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center">
          <ShieldAlert size={14} className="mr-2" />
          Certified Listed Compliance Level 3 • 2026 OmniLeave Enterprise
        </p>
      </footer>
    </div>
  );
};

export default ArchitectureDocs;
