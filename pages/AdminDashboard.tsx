import React, { useState, useContext, useMemo } from 'react';
import { Users, Search, FileSpreadsheet, AlertTriangle, ClipboardList, ShieldCheck, FileDown, Activity, UserCheck, History, UserPlus, Calendar, CheckCircle2, Loader2, X, Upload, Database, Webhook, CheckCircle, AlertCircle, Settings2, Mail, Workflow, Shield, Lock, ThumbsUp, ThumbsDown, FileText, Download, Edit3, Trash2, FileUp, Table as TableIcon, ChevronRight, Monitor, // Fix: Added missing icons required by the components
Plus, TrendingUp, ShieldAlert, RefreshCw } from 'lucide-react';
import { AuditEntry, WorkflowPolicy, RequestCategory, User, SHIFTS, ShiftType } from '../types';
import { UserContext } from '../App';

interface PendingRequest {
  id: string;
  empId: string;
  empName: string;
  dept: string;
  category: RequestCategory;
  dateRange: string;
  hours: number;
  reason: string;
  submittedAt: string;
}

const AdminDashboard = () => {
  const { currentCompany, currentUser, allUsers, setAllUsers, auditLogs, addAuditLog } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState<'approvals' | 'hr' | 'reports' | 'audit' | 'permissions' | 'integration'>('approvals');
  const [userSearchVal, setUserSearch] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    employeeId: '',
    department: '',
    role: 'EMPLOYEE',
    shift: 'A',
    hireDate: new Date().toISOString().split('T')[0]
  });

  // 1. 待審核清單
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([
    { id: 'REQ-001', empId: 'u-101', empName: '陳大文 (Alex)', dept: '產品工程部', category: RequestCategory.LEAVE, dateRange: '2026-06-25 ~ 2026-06-26', hours: 16, reason: '家庭旅遊', submittedAt: '2026-06-21 09:30' },
    { id: 'REQ-002', empId: 'u-201', empName: '張工', dept: '生產一線', category: RequestCategory.OVERTIME_VERIFY, dateRange: '2026-06-20', hours: 4, reason: '機台突發故障維修', submittedAt: '2026-06-21 10:15' },
    { id: 'REQ-003', empId: 'u-101', empName: '陳大文 (Alex)', dept: '產品工程部', category: RequestCategory.PUNCH_CORRECTION, dateRange: '2026-06-19', hours: 0, reason: '忘記打卡', submittedAt: '2026-06-21 11:00' },
  ]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 2. 數據導出記錄
  const [exportHistory, setExportHistory] = useState([
    { id: 'EXP-99', name: '2026_Q2_請假彙總表.csv', size: '124 KB', date: '2026-06-15 14:00', status: 'SUCCESS' },
    { id: 'EXP-98', name: '員工名冊與到職日報表.xlsx', size: '45 KB', date: '2026-06-10 11:20', status: 'SUCCESS' },
  ]);

  // 3. Work Engine 策略
  const [policies, setPolicies] = useState<WorkflowPolicy[]>([
    { deptId: 'd1', deptName: '產品工程部', approvalTiers: 2, forceEmailNotify: true, approverId: 'u-102' },
    { deptId: 'd2', deptName: '人力資源部', approvalTiers: 1, forceEmailNotify: true, approverId: 'u-999' },
    { deptId: 'd3', deptName: '生產管理部', approvalTiers: 1, forceEmailNotify: false, approverId: 'u-202' },
  ]);

  // 4. 審計日誌
  // Using auditLogs from context instead of local mock state
  
  const companyUsers = useMemo(() => allUsers.filter(u => u.tenantId === currentCompany.id), [allUsers, currentCompany.id]);

  const filteredUsers = companyUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchVal.toLowerCase()) ||
    u.department.toLowerCase().includes(userSearchVal.toLowerCase()) ||
    (u.employeeId && u.employeeId.includes(userSearchVal))
  );

  const handleApprove = async (id: string | string[]) => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1000));
    const idsToHandle = Array.isArray(id) ? id : [id];
    
    idsToHandle.forEach(reqId => {
      const req = pendingRequests.find(r => r.id === reqId);
      if (req) {
        addAuditLog('REQUEST_APPROVE', req.empId, `核准 ${req.empName} 的 ${req.category} 申請 (${req.hours}h)`);
      }
    });

    setPendingRequests(prev => prev.filter(req => !idsToHandle.includes(req.id)));
    setSelectedIds([]);
    setIsProcessing(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 800));
    
    const userToCreate: User = {
      id: `u-${Date.now()}`,
      employeeId: newUser.employeeId || `EMP-${Math.floor(Math.random()*10000)}`,
      tenantId: currentCompany.id,
      name: newUser.name || '',
      email: newUser.email || '',
      role: newUser.role as any,
      department: newUser.department || '未分配',
      hireDate: newUser.hireDate || '',
      seniority: 0,
      shift: newUser.shift as any
    };

    setAllUsers(prev => [...prev, userToCreate]);
    addAuditLog('USER_CREATE', userToCreate.id, `手動建立新同仁: ${userToCreate.name} (${userToCreate.employeeId})`);
    setIsProcessing(false);
    setIsAddUserModalOpen(false);
  };

  const updatePolicy = (deptId: string, updates: Partial<WorkflowPolicy>) => {
    setPolicies(prev => prev.map(p => p.deptId === deptId ? { ...p, ...updates } : p));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
          <Shield size={32} className="mr-3 text-indigo-600" />
          管理稽核中心
        </h2>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">租戶：{currentCompany.name} ({currentCompany.schema})</span>
        </div>
      </div>

      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-2xl w-fit overflow-x-auto no-scrollbar shadow-inner">
        {[
          { id: 'approvals', label: '待審中心', icon: ClipboardList, badge: pendingRequests.length },
          { id: 'hr', label: '人事管理', icon: Users },
          { id: 'permissions', label: '工作流策略', icon: Workflow },
          { id: 'reports', label: '數據報表', icon: FileSpreadsheet },
          { id: 'audit', label: '審計日誌', icon: Activity },
          { id: 'integration', label: '資料同步', icon: Database },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 待審中心 */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-10 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">待簽核申請佇列</h3>
              <p className="text-sm text-slate-400 mt-1 font-medium">系統自動過濾當前租戶下需要處理的申請案件。</p>
            </div>
            {selectedIds.length > 0 && (
              <button onClick={() => handleApprove(selectedIds)} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl">批次核准 ({selectedIds.length})</button>
            )}
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-100">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="p-6 w-12 text-center">
                    <input type="checkbox" className="rounded" onChange={(e) => setSelectedIds(e.target.checked ? pendingRequests.map(r => r.id) : [])} />
                  </th>
                  <th className="p-6">成員 / 單位</th>
                  <th className="p-6">類別</th>
                  <th className="p-6">期間</th>
                  <th className="p-6">時數</th>
                  <th className="p-6 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 text-center">
                      <input type="checkbox" className="rounded" checked={selectedIds.includes(req.id)} onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, req.id] : prev.filter(id => id !== req.id))} />
                    </td>
                    <td className="p-6">
                      <div className="font-black text-slate-800">{req.empName}</div>
                      <div className="text-[10px] text-slate-400 font-black mt-1 uppercase">{req.dept}</div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase ${req.category === RequestCategory.LEAVE ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                        {req.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-6 text-xs text-slate-500">{req.dateRange}</td>
                    <td className="p-6 font-black text-slate-800">{req.hours}h</td>
                    <td className="p-6 text-right space-x-2">
                      <button onClick={() => handleApprove(req.id)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><ThumbsUp size={16}/></button>
                      <button className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><ThumbsDown size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 工作流策略 */}
      {activeTab === 'permissions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-300">
          {policies.map(policy => (
            <div key={policy.deptId} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-black text-slate-800">{policy.deptName}</h4>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">組織策略 ID: {policy.deptId}</span>
                </div>
                <div className={`p-3 rounded-2xl ${policy.forceEmailNotify ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Mail size={24} />
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex justify-between">
                    <span>簽核層級深核</span>
                    <span className="text-indigo-600">{policy.approvalTiers} 級</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(t => (
                      <button key={t} onClick={() => updatePolicy(policy.deptId, { approvalTiers: t })} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${policy.approvalTiers === t ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-300'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-600">強制 Email 推送通知</span>
                  <button onClick={() => updatePolicy(policy.deptId, { forceEmailNotify: !policy.forceEmailNotify })} className={`w-12 h-6 rounded-full transition-all relative ${policy.forceEmailNotify ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${policy.forceEmailNotify ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-10 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all space-y-4">
            <Plus size={40} />
            <span className="font-black text-sm uppercase tracking-widest">新增單位策略</span>
          </button>
        </div>
      )}

      {/* 數據報表 */}
      {activeTab === 'reports' && (
        <div className="space-y-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: '特休彙總表', icon: FileSpreadsheet, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: '全體成員假額存摺明細' },
              { title: '考勤異常統計', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', desc: '遲到早退與漏打卡分析' },
              { title: '預算消耗報表', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: '請假成本與人力缺口評估' },
            ].map((card, i) => (
              <div key={i} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                <div className={`w-16 h-16 rounded-[24px] ${card.bg} ${card.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <card.icon size={32} />
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-2">{card.title}</h4>
                <p className="text-xs text-slate-400 font-medium mb-10">{card.desc}</p>
                <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl flex items-center justify-center space-x-2">
                  <Download size={16} />
                  <span>立即生成報表</span>
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[40px] border border-slate-100 p-10">
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">報表產出歷史記錄</h4>
            <div className="overflow-hidden rounded-3xl border border-slate-50">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-50">
                  {exportHistory.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5">
                        <div className="flex items-center space-x-3">
                          <FileText size={20} className="text-slate-300" />
                          <span className="text-sm font-bold text-slate-700">{exp.name}</span>
                        </div>
                      </td>
                      <td className="p-5 text-xs text-slate-400 font-mono">{exp.size}</td>
                      <td className="p-5 text-xs font-bold text-slate-500">{exp.date}</td>
                      <td className="p-5 text-right"><button className="text-indigo-600 font-black text-xs hover:underline">下載</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 審計日誌 */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 rounded-[40px] p-10 text-white animate-in fade-in">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black flex items-center">
              <ShieldAlert size={24} className="mr-3 text-rose-500" />
              Immutable Audit Logs
            </h3>
            <div className="flex items-center space-x-4">
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-mono opacity-60">System Version: v3.1.2-Compliance</div>
              <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><RefreshCw size={18} /></button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10">
            <table className="w-full text-left text-[11px] font-mono">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-500 uppercase font-black">
                  <th className="p-5">Timestamp</th>
                  <th className="p-5">Actor</th>
                  <th className="p-5">Action</th>
                  <th className="p-5">Resource</th>
                  <th className="p-5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-5 text-slate-400">{log.timestamp}</td>
                    <td className="p-5 text-indigo-400 font-bold underline cursor-pointer">{log.actor}</td>
                    <td className="p-5 text-emerald-400">{log.action}</td>
                    <td className="p-5 text-slate-500">{log.resource}</td>
                    <td className="p-5 text-slate-300 italic">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 人事管理 (原有功能整合) */}
      {activeTab === 'hr' && (
        <div className="space-y-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <button onClick={() => setIsAddUserModalOpen(true)} className="md:col-span-1 p-8 bg-indigo-600 text-white rounded-[40px] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex flex-col items-center justify-center space-y-4">
              <UserPlus size={32} />
              <span className="font-black text-sm">手動建立同仁</span>
            </button>
            <button onClick={() => setIsImportModalOpen(true)} className="md:col-span-1 p-8 bg-white border border-slate-100 rounded-[40px] shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-center space-y-4">
              <FileUp size={32} className="text-emerald-500" />
              <span className="font-black text-sm text-slate-800">批量匯入檔案</span>
            </button>
            <div className="md:col-span-2 bg-slate-900 rounded-[40px] p-8 text-white flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">環境成員總數</div>
                <div className="text-5xl font-black">{companyUsers.length} <span className="text-xl text-slate-500">Active</span></div>
              </div>
              <Users size={120} className="absolute -right-4 -bottom-4 opacity-10" />
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-100 p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">員工檔案總覽</h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  placeholder="搜尋姓名、工號..." 
                  className="pl-12 pr-6 py-3 bg-slate-50 rounded-xl text-sm font-bold w-64 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                  value={userSearchVal}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-6">工號 / 成員</th><th className="p-6">單位部門</th><th className="p-6">班別</th><th className="p-6">角色</th><th className="p-6 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="p-6"><div className="font-black text-slate-800">{user.name}</div><div className="text-[10px] font-black text-slate-400 mt-0.5">ID: {user.employeeId}</div></td>
                      <td className="p-6 text-sm font-bold text-slate-600">{user.department}</td>
                      <td className="p-6"><span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black border border-slate-200">{user.shift} 班</span></td>
                      <td className="p-6"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${user.role === 'HR' ? 'text-amber-600' : 'text-slate-500'}`}>{user.role}</span></td>
                      <td className="p-6 text-right space-x-2"><button className="p-2 text-slate-400 hover:text-indigo-600"><Edit3 size={16}/></button><button className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 資料同步 */}
      {activeTab === 'integration' && (
        <div className="space-y-10 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] border border-slate-100 p-12 flex items-center justify-between">
            <div className="space-y-4 max-w-xl">
              <div className="bg-indigo-600 w-16 h-16 rounded-3xl flex items-center justify-center text-white mb-6">
                <Webhook size={32} />
              </div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">API & Webhook 整合監控</h3>
              <p className="text-slate-500 font-medium leading-relaxed text-sm">
                透過 SaaS 開放 API 將 OmniLeave 與您的企業 ERP、人資系統 (HRIS) 進行深度整合。支援打卡鐘即時數據回傳與假額餘額自動更新。
              </p>
              <div className="pt-6 flex gap-4">
                <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl">取得 API 金鑰</button>
                <button className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black">查閱開發文檔</button>
              </div>
            </div>
            
            <div className="hidden lg:block w-96 space-y-4">
              {[
                { endpoint: '/v1/attendance/sync', status: 'ACTIVE', latency: '42ms' },
                { endpoint: '/v1/employee/import', status: 'ACTIVE', latency: '128ms' },
                { endpoint: '/v1/audit/stream', status: 'ERROR', latency: '---' },
              ].map((api, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 p-5 rounded-[24px] flex justify-between items-center group hover:border-indigo-200 transition-all">
                  <div className="space-y-1">
                    <code className="text-[10px] font-mono font-bold text-slate-400">{api.endpoint}</code>
                    <div className="flex items-center text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                      <div className={`w-2 h-2 rounded-full mr-2 ${api.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {api.status} • {api.latency}
                    </div>
                  </div>
                  <Settings2 size={16} className="text-slate-300 group-hover:text-indigo-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 rounded-[40px] p-10 text-white flex flex-col justify-between min-h-[300px] relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <h4 className="text-xl font-black">資料庫複寫狀態</h4>
                <p className="text-xs text-slate-400 font-medium">實體隔離物理存摺備份同步中，預計下次檢查點於 5 分鐘後。</p>
              </div>
              <div className="relative z-10 flex items-center space-x-3 text-xs font-black text-emerald-400">
                <Monitor size={18} />
                <span>Cross-Region Sync: OK</span>
              </div>
              <Database size={160} className="absolute -right-10 -bottom-10 opacity-5" />
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-[40px] p-10 flex flex-col justify-between min-h-[300px]">
              <div className="space-y-4">
                <h4 className="text-xl font-black text-indigo-900">外部檔案上傳池</h4>
                <p className="text-xs text-indigo-600 font-medium">提供臨時資料落地與清洗緩衝區，支援從現有 ERP 直接拋轉時數存摺。</p>
              </div>
              <button className="w-full py-5 border-2 border-dashed border-indigo-300 rounded-3xl text-indigo-600 font-black text-sm flex items-center justify-center space-x-3 hover:bg-white transition-all">
                <Upload size={20} />
                <span>上傳 .sql 或 .csv 檔案</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
