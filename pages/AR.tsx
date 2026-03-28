import React, { useState, useEffect, useContext } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  History,
  TimerOff,
  AlertCircle,
  CheckCircle2,
  Info,
  Building,
  Car,
  Mail,
  Loader2,
  UserCheck,
  ShieldCheck,
  Lock,
  Workflow,
  Zap,
  CheckSquare,
  FileSearch
} from 'lucide-react';
import { RequestCategory, LeaveType, SHIFTS } from '../types';
import { UserContext } from '../App';

const translateLeaveType = (type: LeaveType) => {
  const map = {
    [LeaveType.ANNUAL]: '特休',
    [LeaveType.COMPENSATORY]: '補休',
    [LeaveType.SICK]: '病假',
    [LeaveType.PERSONAL]: '事假'
  };
  return map[type] || type;
};

const AttendanceRequest = () => {
  const { currentUser, workCalendar, currentCompany, deductLeave, addAuditLog } = useContext(UserContext);
  const shift = SHIFTS[currentUser.shift];

  const [category, setCategory] = useState<RequestCategory>(RequestCategory.LEAVE);
  const [formData, setFormData] = useState({
    leaveType: LeaveType.ANNUAL,
    startDate: new Date().toISOString().split('T')[0],
    startTime: shift.startTime,
    endDate: new Date().toISOString().split('T')[0],
    endTime: shift.endTime,
    reason: '',
    location: '',
    transport: '公司車',
    correctionType: 'IN' as 'IN' | 'OUT',
    otAction: 'APPLY' as 'APPLY' | 'VERIFY' // OT 雙軌切換
  });

  const [calculation, setCalculation] = useState({
    hours: 0,
    lunchExcl: 0,
    holidayExcl: 0,
    msg: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Work Engine 邏輯判斷
  const needsApproval = category !== RequestCategory.OFFICIAL_OUTING;
  
  const workflowPreview = {
    dept: currentUser.department,
    tiers: currentUser.department === '產品工程部' ? 2 : 1,
    manager: '王主管',
    forceEmail: needsApproval // 僅在需要簽核時推信
  };

  useEffect(() => {
    if (category === RequestCategory.PUNCH_CORRECTION) {
      setCalculation({ hours: 0, lunchExcl: 0, holidayExcl: 0, msg: `補登紀錄需經主管核實, 每月上限 ${currentCompany.punchLimit} 次` });
      return;
    }

    if (!formData.startDate || !formData.endDate) return;

    let totalHours = 0;
    let lunchHours = 0;
    let holidayHours = 0;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const calEntry = workCalendar.find(c => c.date === dateStr);
      const isWorkingDay = calEntry ? calEntry.isWorkingDay : (d.getDay() !== 0 && d.getDay() !== 6);

      if (!isWorkingDay && category !== RequestCategory.OVERTIME) {
        holidayHours += 8;
        continue;
      }

      let dStart = dateStr === formData.startDate ? formData.startTime : shift.startTime;
      let dEnd = dateStr === formData.endDate ? formData.endTime : shift.endTime;

      const [hs, ms] = dStart.split(':').map(Number);
      const [he, me] = dEnd.split(':').map(Number);
      
      let dayH = (he + me/60) - (hs + ms/60);
      
      // 加班與公務外出不扣午休
      if (category === RequestCategory.LEAVE) {
        const lunchOverlapStart = Math.max(hs + ms/60, 12);
        const lunchOverlapEnd = Math.min(he + me/60, 13);
        const overlap = Math.max(0, lunchOverlapEnd - lunchOverlapStart);
        dayH -= overlap;
        lunchHours += overlap;
      }
      
      totalHours += Math.max(0, dayH);
    }

    let message = '';
    if (category === RequestCategory.LEAVE) message = '將由現有假額優先抵扣 (FIFO)';
    else if (category === RequestCategory.OVERTIME) {
      message = formData.otAction === 'VERIFY' ? '核實後將正式核發補休時數' : '此為事前報備，核准後需另行提交核實單';
    } else if (category === RequestCategory.OFFICIAL_OUTING) message = '公務外出為核備制，提交後即完成。';

    setCalculation({
      hours: Math.round(totalHours * 2) / 2,
      lunchExcl: lunchHours,
      holidayExcl: holidayHours,
      msg: message
    });

  }, [formData, category, shift, workCalendar, currentCompany]);

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1200));

    if (category === RequestCategory.LEAVE) {
      const result = deductLeave(currentUser.id, formData.leaveType, calculation.hours);
      if (!result.success) {
        alert('假額不足，無法提交申請！');
        setIsSubmitting(false);
        return;
      }
      addAuditLog('LEAVE_SUBMIT', currentUser.id, `提交 ${translateLeaveType(formData.leaveType)} 申請: ${calculation.hours}h, 抵扣來源: ${result.breakdown.map(b => b.sourceName).join(', ')}`);
    } else {
      addAuditLog('ATTENDANCE_SUBMIT', currentUser.id, `提交 ${category} 申請: ${calculation.hours}h`);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center animate-in zoom-in-95 duration-300">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner ${needsApproval ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'}`}>
          {needsApproval ? <CheckCircle2 size={48} /> : <Zap size={48} />}
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">
          {needsApproval ? '申請提交成功' : '公務核備完成'}
        </h2>
        
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm mb-12 space-y-6">
           <div className="flex items-center justify-center space-x-3 text-slate-400">
              <ShieldCheck size={20} />
              <span className="font-black text-xs uppercase tracking-widest">
                {needsApproval ? 'Work Engine 流程已啟動' : '系統已自動存檔備查'}
              </span>
           </div>
           <p className="text-slate-500 text-sm leading-relaxed font-medium">
             {needsApproval 
              ? `根據部門策略，已推送 Email 提醒 ${workflowPreview.manager}。`
              : '此公務行程已記錄於個人出勤歷史，無需主管簽核。'}
           </p>
        </div>

        <button onClick={() => window.location.hash = '/'} className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl shadow-xl hover:bg-black transition-all">
          返回儀表板
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex space-x-3 overflow-x-auto pb-4 no-scrollbar">
        {[
          { id: RequestCategory.LEAVE, label: '請假申請', icon: TimerOff, color: 'text-rose-600', bg: 'bg-rose-50' },
          { id: RequestCategory.OVERTIME, label: '加班處理', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { id: RequestCategory.OFFICIAL_OUTING, label: '公務外出', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { id: RequestCategory.PUNCH_CORRECTION, label: '補登刷卡', icon: History, color: 'text-amber-600', bg: 'bg-amber-50' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id as RequestCategory)}
            className={`flex-shrink-0 flex items-center space-x-4 px-8 py-5 rounded-[28px] border-2 transition-all ${
              category === cat.id ? `border-indigo-600 ${cat.bg} shadow-md` : 'border-white bg-white text-slate-400 hover:border-slate-100 shadow-sm'
            }`}
          >
            <cat.icon size={22} className={category === cat.id ? cat.color : ''} />
            <span className={`text-sm font-black whitespace-nowrap ${category === cat.id ? 'text-slate-900' : ''}`}>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        <div className="lg:col-span-2 bg-white rounded-[40px] shadow-sm border border-slate-100 p-8 lg:p-12 space-y-10">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {category === RequestCategory.OVERTIME ? '加班申請與核實' : '詳細資訊填寫'}
            </h3>
            <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Building size={14} />
              <span>{currentCompany.name}</span>
            </div>
          </div>

          <form onSubmit={handleFinalSubmit} className="space-y-10">
            {category === RequestCategory.OVERTIME && (
              <div className="p-2 bg-slate-100 rounded-3xl grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, otAction: 'APPLY'})}
                  className={`flex items-center justify-center space-x-2 py-4 rounded-2xl font-black text-xs transition-all ${formData.otAction === 'APPLY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <FileSearch size={16} />
                  <span>事前加班申請</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, otAction: 'VERIFY'})}
                  className={`flex items-center justify-center space-x-2 py-4 rounded-2xl font-black text-xs transition-all ${formData.otAction === 'VERIFY' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
                >
                  <CheckSquare size={16} />
                  <span>事後時數核實</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Calendar size={14} className="mr-2" /> 
                    {category === RequestCategory.PUNCH_CORRECTION ? '補登日期' : '起始日期與時間'}
                  </label>
                  <div className="space-y-3">
                    <input type="date" required className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-800" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                    {category !== RequestCategory.PUNCH_CORRECTION && (
                      <input type="time" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-800" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
                    )}
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Clock size={14} className="mr-2" />
                    {category === RequestCategory.PUNCH_CORRECTION ? '刷卡類別' : '結束日期與時間'}
                  </label>
                  <div className="space-y-3">
                    {category === RequestCategory.PUNCH_CORRECTION ? (
                       <select className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 appearance-none" value={formData.correctionType} onChange={(e) => setFormData({...formData, correctionType: e.target.value as 'IN' | 'OUT'})}>
                        <option value="IN">上班 (Clock-In)</option>
                        <option value="OUT">下班 (Clock-Out)</option>
                      </select>
                    ) : (
                      <>
                        <input type="date" required className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-800" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                        <input type="time" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-800" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
                      </>
                    )}
                  </div>
               </div>
            </div>

            {category === RequestCategory.OFFICIAL_OUTING && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
                 <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">拜訪地點</label>
                    <input placeholder="輸入地點名稱" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-800" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                 </div>
                 <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">交通工具</label>
                    <select className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 appearance-none" value={formData.transport} onChange={(e) => setFormData({...formData, transport: e.target.value})}>
                      <option>公司派車</option>
                      <option>自用汽機車</option>
                      <option>大眾運輸</option>
                    </select>
                 </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">詳細事由</label>
              <textarea required rows={4} placeholder="請輸入說明..." className="w-full p-6 bg-slate-50 border-none rounded-[32px] font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
            </div>

            {/* 動態 Work Engine 展示 */}
            {needsApproval ? (
              <div className="p-8 bg-slate-900 rounded-[32px] text-white space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-indigo-400">
                  <div className="flex items-center space-x-2">
                    <Workflow size={16} />
                    <span>簽核流程：{category === RequestCategory.OVERTIME && formData.otAction === 'VERIFY' ? '加班核實流程' : '標準審核流程'}</span>
                  </div>
                  <Lock size={14} className="opacity-40" />
                </div>
                <div className="flex items-center space-x-6 relative z-10">
                   <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-xs font-black">1</div>
                      <div className="h-6 w-0.5 bg-slate-700 my-1"></div>
                      <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-500">2</div>
                   </div>
                   <div className="flex-1 space-y-5">
                      <div>
                        <div className="text-sm font-black text-white">{workflowPreview.manager} (直屬主管)</div>
                        <div className="text-[10px] text-slate-400 flex items-center mt-1">
                          <Mail size={10} className="mr-1 text-emerald-400" />
                          <span>系統將強制推信提醒主管</span>
                        </div>
                      </div>
                      <div className="text-slate-600 text-[11px] font-bold">人力資源部 (核備)</div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[32px] flex items-center space-x-4">
                 <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg shadow-emerald-200">
                    <Zap size={24} />
                 </div>
                 <div>
                    <h4 className="font-black text-emerald-900 text-sm">公務核備模式 (免簽核)</h4>
                    <p className="text-emerald-700/70 text-xs font-medium mt-1">此行程將自動核備至 HR 系統，主管僅供備查閱覽。</p>
                 </div>
              </div>
            )}

            <button 
              disabled={isSubmitting}
              className="w-full py-6 bg-slate-900 text-white rounded-[28px] font-black text-xl shadow-2xl hover:bg-black hover:-translate-y-1 transition-all flex items-center justify-center space-x-3"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <span>確認提交申請</span>}
            </button>
          </form>
        </div>

        <div className="lg:sticky lg:top-10 space-y-8">
           <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl">
              <div className="flex items-center space-x-3 mb-10">
                <div className="bg-indigo-500 p-2 rounded-xl">
                  <AlertCircle size="20" />
                </div>
                <h4 className="text-lg font-black tracking-tight">演算統計摘要</h4>
              </div>
              
              <div className="space-y-8">
                <div className="flex justify-between items-end pb-8 border-b border-white/10">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">預估處理時數</span>
                  <span className="text-5xl font-black text-indigo-400">{calculation.hours}<span className="text-xs ml-1 text-slate-500">h</span></span>
                </div>
                
                <div className="space-y-4">
                   <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">自動扣除午休</span>
                      <span className="text-rose-400">-{calculation.lunchExcl} h</span>
                   </div>
                   <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">假日排除時數</span>
                      <span className="text-emerald-400">-{calculation.holidayExcl} h</span>
                   </div>
                </div>

                <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/10">
                   <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
                     <Info size="12" className="inline mr-1 text-indigo-400" />
                     {calculation.msg}
                   </p>
                </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
              <h4 className="font-bold text-slate-800 text-xs mb-6 flex items-center uppercase tracking-widest">
                <Clock className="mr-2 text-indigo-600" size="14" />
                當前工作時段
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400">班別代號</span>
                  <span className="text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{currentUser.shift} 班</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400">標準起訖</span>
                  <span className="text-slate-900">{shift.startTime} - {shift.endTime}</span>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceRequest;
