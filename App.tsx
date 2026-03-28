import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  ShieldCheck, 
  Database,
  ClipboardCheck,
  UserCheck,
  Building2,
  Menu,
  Bell,
  Lock
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AttendanceRequest from './pages/AttendanceRequest';
import ArchitectureDocs from './pages/ArchitectureDocs';
import { User, WorkCalendarEntry, Company, LeaveType, AuditEntry, ConsumptionItem } from './types';

const MOCK_COMPANIES: Company[] = [
  { id: 'c-01', name: '奧米科技 (上櫃公司)', schema: 'schema_omni_hq', isListed: true, punchLimit: 3 },
  { id: 'c-02', name: '智造工業 (上櫃公司)', schema: 'schema_mfg_01', isListed: true, punchLimit: 5 },
  { id: 'c-03', name: '創思設計 (Studio)', schema: 'schema_creative', isListed: false, punchLimit: 10 },
  { id: 'c-04', name: '雲端流通 (Logistics)', schema: 'schema_cloud', isListed: false, punchLimit: 3 }
];

const INITIAL_2026_CALENDAR: WorkCalendarEntry[] = [
  { date: '2026-01-01', isWorkingDay: false, description: '元旦' },
  { date: '2026-06-19', isWorkingDay: false, description: '端午節' },
  { date: '2026-10-10', isWorkingDay: false, description: '國慶日' },
];

export const MOCK_USERS: User[] = [
  // Fixed: Added mandatory employeeId to each mock user
  { id: 'u-101', employeeId: '8001', tenantId: 'c-01', name: '陳大文 (Alex)', email: 'alex@omni.com', role: 'EMPLOYEE', department: '產品工程部', hireDate: '2022-05-20', seniority: 28, shift: 'B' },
  { id: 'u-999', employeeId: '0001', tenantId: 'c-01', name: '李美玲 (Mary)', email: 'mary@omni.com', role: 'HR', department: '人力資源部', hireDate: '2018-03-15', seniority: 72, shift: 'A' },
  { id: 'u-102', employeeId: '8002', tenantId: 'c-01', name: '王小明', email: 'ming@omni.com', role: 'MANAGER', department: '產品工程部', hireDate: '2021-01-10', seniority: 40, shift: 'B' },
  { id: 'u-201', employeeId: '9001', tenantId: 'c-02', name: '張工', email: 'zhang@mfg.com', role: 'EMPLOYEE', department: '生產一線', hireDate: '2023-11-01', seniority: 8, shift: 'C' },
  { id: 'u-202', employeeId: '9002', tenantId: 'c-02', name: '林廠長', email: 'lin@mfg.com', role: 'MANAGER', department: '生產管理部', hireDate: '2015-06-20', seniority: 110, shift: 'A' },
];

export interface LeaveBucket {
  id: string;
  userId: string;
  type: LeaveType;
  name: string;
  total: number;
  consumed: number;
  expiryDate: string;
}

export const UserContext = createContext<{
  currentUser: User;
  setCurrentUser: (user: User) => void;
  currentCompany: Company;
  setCurrentCompany: (company: Company) => void;
  workCalendar: WorkCalendarEntry[];
  allUsers: User[];
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  leaveBuckets: LeaveBucket[];
  setLeaveBuckets: React.Dispatch<React.SetStateAction<LeaveBucket[]>>;
  auditLogs: AuditEntry[];
  addAuditLog: (action: string, resource: string, details: string) => void;
  deductLeave: (userId: string, type: LeaveType, hours: number) => { success: boolean; breakdown: ConsumptionItem[] };
}>({
  currentUser: MOCK_USERS[0],
  setCurrentUser: () => {},
  currentCompany: MOCK_COMPANIES[0],
  setCurrentCompany: () => {},
  workCalendar: INITIAL_2026_CALENDAR,
  allUsers: MOCK_USERS,
  setAllUsers: () => {},
  leaveBuckets: [],
  setLeaveBuckets: () => {},
  auditLogs: [],
  addAuditLog: () => {},
  deductLeave: () => ({ success: false, breakdown: [] }),
});

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setCurrentUser, currentCompany, setCurrentCompany } = useContext(UserContext);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const selectableUsers = MOCK_USERS.filter(u => u.tenantId === currentCompany.id);

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center space-x-3 mb-10">
            <div className="bg-slate-900 p-2.5 rounded-2xl text-white shadow-lg shadow-slate-200">
              <ClipboardCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">OmniLeave</h1>
              <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Listed Compliance v3</div>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {[
              { to: '/', icon: LayoutDashboard, label: '首頁儀表板' },
              { to: '/apply', icon: FileText, label: '出勤申請' },
              { to: '/admin', icon: ShieldCheck, label: '管理稽核中心', adminOnly: true },
              { to: '/docs', icon: Database, label: '隔離架構文檔' }
            ].map(item => (
              (item.adminOnly && currentUser.role !== 'HR') ? null : (
                <Link 
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 p-3.5 rounded-2xl transition-all ${
                    location.pathname === item.to ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-bold">{item.label}</span>
                </Link>
              )
            ))}
          </nav>

          <div className="mt-auto space-y-4 pt-6 border-t border-slate-100">
             {currentCompany.isListed && (
               <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center space-x-2">
                  <Lock size={14} className="text-emerald-600" />
                  <span className="text-[10px] font-black text-emerald-700 uppercase">隔離 Schema 模式已啟動</span>
               </div>
             )}
            <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Building2 size={12} />
                <span>切換租戶環境</span>
              </div>
              <select 
                value={currentCompany.id}
                onChange={(e) => {
                  const company = MOCK_COMPANIES.find(c => c.id === e.target.value)!;
                  setCurrentCompany(company);
                  // Auto-switch to first user of that company to simulate environment change
                  const firstUser = MOCK_USERS.find(u => u.tenantId === company.id);
                  if (firstUser) setCurrentUser(firstUser);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-500"
              >
                {MOCK_COMPANIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                <UserCheck size={12} />
                <span>切換測試身份</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectableUsers.map(u => (
                  <button 
                    key={u.id}
                    onClick={() => setCurrentUser(u)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${currentUser.id === u.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                  >
                    {u.name} ({u.role})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center">
            <button className="p-2.5 lg:hidden text-slate-600 hover:bg-slate-100 rounded-xl mr-4" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold text-slate-800">歡迎回來, {currentUser.name}</h2>
              <p className="text-xs text-slate-400 font-medium">{currentCompany.name} • {currentUser.department}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             {currentCompany.isListed && (
               <div className="flex items-center bg-rose-50 text-rose-600 px-3 py-1 rounded-lg border border-rose-100 text-[10px] font-bold">
                 管理稽核模式
               </div>
             )}
             <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
             </button>
             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
               {currentUser.name[0]}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
};

const App = () => {
  const [currentUser, setCurrentUser] = useState(MOCK_USERS[0]);
  const [currentCompany, setCurrentCompany] = useState(MOCK_COMPANIES[0]);
  const [allUsers, setAllUsers] = useState(MOCK_USERS);
  const [leaveBuckets, setLeaveBuckets] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Initialize seniority and leave buckets
  useEffect(() => {
    const initializedUsers = MOCK_USERS.map(user => {
      const hireDate = new Date(user.hireDate);
      const now = new Date();
      const months = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());
      return { ...user, seniority: months };
    });
    setAllUsers(initializedUsers);
    setCurrentUser(initializedUsers[0]);

    // Initialize mock buckets
    const initialBuckets = [];
    initializedUsers.forEach(user => {
      initialBuckets.push(
        { id: `b-${user.id}-1`, userId: user.id, type: 'ANNUAL', name: '2025 年度特休', total: 80, consumed: 0, expiryDate: '2025-12-31' },
        { id: `b-${user.id}-2`, userId: user.id, type: 'ANNUAL', name: '2026 年度特休', total: 80, consumed: 0, expiryDate: '2026-12-31' },
        { id: `b-${user.id}-3`, userId: user.id, type: 'COMPENSATORY', name: '加班補休 (Q1)', total: 16, consumed: 4, expiryDate: '2026-06-30' }
      );
    });
    setLeaveBuckets(initialBuckets);

    // Initial audit log
    setAuditLogs([{
      id: 'log-init',
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
      actor: 'System',
      action: 'SYSTEM_BOOT',
      resource: 'OmniLeave',
      ip: '127.0.0.1',
      details: '系統初始化完成，FIFO 引擎就緒'
    }]);
  }, []);

  const addAuditLog = (action, resource, details) => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
      actor: currentUser.name,
      action,
      resource,
      ip: '192.168.1.1',
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const deductLeave = (userId, type, hours) => {
    const userBuckets = leaveBuckets
      .filter(b => b.userId === userId && b.type === type && b.total > b.consumed)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()); // FIFO: earliest expiry first

    let remainingToDeduct = hours;
    const breakdown = [];
    const updatedBuckets = [...leaveBuckets];

    for (const bucket of userBuckets) {
      if (remainingToDeduct <= 0) break;

      const available = bucket.total - bucket.consumed;
      const toDeduct = Math.min(available, remainingToDeduct);

      // Find index in main state
      const idx = updatedBuckets.findIndex(b => b.id === bucket.id);
      updatedBuckets[idx] = { ...updatedBuckets[idx], consumed: updatedBuckets[idx].consumed + toDeduct };

      breakdown.push({
        sourceId: bucket.id,
        sourceName: bucket.name,
        hours: toDeduct,
        expiryDate: bucket.expiryDate
      });

      remainingToDeduct -= toDeduct;
    }

    if (remainingToDeduct <= 0) {
      setLeaveBuckets(updatedBuckets);
      return { success: true, breakdown };
    }

    return { success: false, breakdown: [] };
  };

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      setCurrentUser, 
      currentCompany, 
      setCurrentCompany, 
      workCalendar: INITIAL_2026_CALENDAR,
      allUsers,
      setAllUsers,
      leaveBuckets,
      setLeaveBuckets,
      auditLogs,
      addAuditLog,
      deductLeave
    }}>
      <HashRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/apply" element={<AttendanceRequest />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/docs" element={<ArchitectureDocs />} />
          </Routes>
        </AppLayout>
      </HashRouter>
    </UserContext.Provider>
  );
};

export default App;
