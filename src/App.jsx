import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PieChart, Wallet, FileText, Calculator, Save, TrendingUp, TrendingDown, 
  Download, Trash2, Edit, Menu, X, Printer, 
  CheckCircle, Sparkles, Loader, 
  BarChart3, Target, User, Store,
  Package, History, Search, MessageSquare, Send, Copy, Info, Clock, List, BookOpen, Settings, PlusCircle, Calendar as CalendarIcon,
  Tag, TicketPercent // New Icons
} from 'lucide-react';

// --- Import Firebase ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, serverTimestamp, updateDoc, getDocs, where } from 'firebase/firestore';

// --- Configuration & Constants ---
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC9kT4Pji_e-i3VCm1jlSoy0fBe1PLWHm0",
  authDomain: "merchant-tax-app.firebaseapp.com",
  projectId: "merchant-tax-app",
  storageBucket: "merchant-tax-app.firebasestorage.app",
  messagingSenderId: "168794198420",
  appId: "1:168794198420:web:d792a54ffac979dd95bf81",
  measurementId: "G-ZS2X8BR5JD"
};

const CONSTANTS = {
  APP_ID: 'eatsanduse',
  CATEGORIES: {
    INCOME: ['สินค้าทั่วไป', 'บริการ', 'อาหาร/เครื่องดื่ม', 'อื่นๆ'],
    EXPENSE: ['ค่าใช้จ่ายทั่วไป', 'ต้นทุนสินค้า', 'ค่าโฆษณา (ในประเทศ)', 'ค่าโฆษณา (ภ.พ.36)', 'ค่าธรรมเนียม Platform', 'ค่าขนส่ง', 'ค่าเช่า', 'เงินเดือน', 'ภาษี/เบี้ยปรับ', 'ส่วนลดร้านค้า']
  },
  CHANNELS: ['Shopee', 'Lazada', 'TikTok', 'Line Shopping', 'Facebook', 'หน้าร้าน'],
  VAT_RATES: {
    INCLUDED: 'included',
    EXCLUDED: 'excluded',
    NONE: 'none'
  }
};

// --- Firebase Initialization (Safe) ---
const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Utility Functions ---
const normalizeDate = (dateInput) => {
  if (!dateInput) return new Date();
  if (dateInput.toDate) return dateInput.toDate();
  return new Date(dateInput);
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('th-TH', { 
    style: 'decimal', 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = normalizeDate(dateString);
  return new Intl.DateTimeFormat('th-TH', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  }).format(date);
};

const formatDateISO = (date) => normalizeDate(date).toISOString().split('T')[0];

const thaiBahtText = (num) => {
  if (!num && num !== 0) return '';
  num = parseFloat(num).toFixed(2);
  const thaiNum = ['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
  const unit = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
  let [integer, decimal] = num.split('.');
  let result = '';

  const convert = (n) => {
    let txt = '';
    let len = n.length;
    for (let i = 0; i < len; i++) {
      let digit = parseInt(n[i]);
      let pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 1 && digit === 1) txt += '';
        else if (pos === 1 && digit === 2) txt += 'ยี่';
        else if (pos === 0 && digit === 1 && len > 1) txt += 'เอ็ด';
        else txt += thaiNum[digit];
        txt += unit[pos];
      }
    }
    return txt;
  };

  if (integer.length > 7) { 
      result = convert(integer.substring(0, integer.length - 6)) + 'ล้าน' + convert(integer.substring(integer.length - 6));
  } else {
      result = convert(integer);
  }
  
  result += 'บาท';
  if (parseInt(decimal) === 0) result += 'ถ้วน';
  else result += convert(decimal) + 'สตางค์';
  return result;
};

const calculateProgressiveTax = (netIncome) => {
  let tax = 0;
  if (netIncome > 150000) tax += Math.min(Math.max(netIncome - 150000, 0), 150000) * 0.05;
  if (netIncome > 300000) tax += Math.min(Math.max(netIncome - 300000, 0), 200000) * 0.10;
  if (netIncome > 500000) tax += Math.min(Math.max(netIncome - 500000, 0), 250000) * 0.15;
  if (netIncome > 750000) tax += Math.min(Math.max(netIncome - 750000, 0), 250000) * 0.20;
  if (netIncome > 1000000) tax += Math.min(Math.max(netIncome - 1000000, 0), 1000000) * 0.25;
  if (netIncome > 2000000) tax += Math.min(Math.max(netIncome - 2000000, 0), 3000000) * 0.30;
  if (netIncome > 5000000) tax += Math.max(netIncome - 5000000, 0) * 0.35;
  return tax;
};

// --- Helper for Excel Export ---
const exportToExcel = (fileName, data, headerInfo = []) => {
    if (!window.XLSX) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        script.onload = () => exportToExcel(fileName, data, headerInfo);
        script.onerror = () => alert("ไม่สามารถโหลดไลบรารี Excel ได้ กรุณาตรวจสอบอินเทอร์เน็ต");
        document.body.appendChild(script);
        return;
    }

    const wb = window.XLSX.utils.book_new();
    const finalData = [...headerInfo, ...data];
    const ws = window.XLSX.utils.aoa_to_sheet(finalData);
    window.XLSX.utils.book_append_sheet(wb, ws, "Report");
    window.XLSX.writeFile(wb, fileName);
};

// --- Service Layer: API Calls ---
const SmartTaxAI = {
  async generate(prompt, imageBase64 = null, expectJSON = false) {
    const apiKey = "AIzaSyDHldGBh5-XUBIX9Ru9tffi6nNg7ZY7H1A"; // API Key provided by execution environment
    if (!apiKey) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const systemContext = "You are a specialized Thai Tax & Accounting Assistant. You understand Thai Revenue Code (สรรพากร), VAT, Withholding Tax, and e-commerce accounting. Respond in Thai unless asked otherwise.";
    const fullPrompt = `${systemContext}\n\nTask: ${prompt}\n\n${expectJSON ? 'IMPORTANT: Return ONLY a valid JSON object. No markdown formatting.' : ''}`;

    const parts = [{ text: fullPrompt }];
    if (imageBase64) {
      const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const data = imageBase64.split(',')[1];
      parts.push({ inlineData: { mimeType, data } });
    }

    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] }) });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (expectJSON && text) {
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            try { return JSON.parse(text); } catch (e) { console.error("JSON Parse Error:", e); throw new Error("Failed to parse AI response"); }
        }
        return text;
      } catch (error) { if (i === maxRetries - 1) return null; await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i))); }
    }
  }
};

// --- Components ---

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-[100dvh] bg-slate-50 text-indigo-600 font-sarabun">
    <Loader className="animate-spin mb-4" size={40} />
    <p className="text-sm font-medium animate-pulse">กำลังซิงค์ข้อมูลร้านค้า...</p>
  </div>
);

const StatCard = ({ title, subtitle, value, trend, color, icon, subText }) => {
  const styles = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", trendBg: "bg-emerald-100", trendText: "text-emerald-700", softBg: "bg-emerald-50/50" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", trendBg: "bg-rose-100", trendText: "text-rose-700", softBg: "bg-rose-50/50" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", trendBg: "bg-indigo-100", trendText: "text-indigo-700", softBg: "bg-indigo-50/50" }
  };
  const currentStyle = styles[color] || styles.indigo;

  return (
    <div className={`rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-slate-100 ${currentStyle.softBg}`}>
      <div className="flex justify-between items-start mb-4 relative z-10">
         <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 opacity-80">{title}</p>
            <h3 className={`text-2xl lg:text-3xl font-bold tracking-tight ${currentStyle.text}`}>{formatCurrency(value)}</h3>
         </div>
         <div className={`p-3 rounded-2xl ${currentStyle.bg} ${currentStyle.text} shadow-sm`}>{icon}</div>
      </div>
      <div className="flex items-center gap-3 text-xs font-medium relative z-10">
        {trend !== undefined && (
          <span className={`px-2 py-1 rounded-lg flex items-center gap-1 ${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {trend >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        <span className="text-slate-400">{subText}</span>
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
    <span className="font-medium tracking-wide text-sm">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>}
  </button>
);

// Feature 1: Dashboard
const Dashboard = ({ transactions }) => {
  const [aiAdvice, setAiAdvice] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [period, setPeriod] = useState('month');

  const analytics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let filteredTrans = [];
    let prevTrans = [];
    let trendData = [];
    
    const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

    if (period === 'day') {
        filteredTrans = transactions.filter(t => isSameDay(t.date, today));
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        prevTrans = transactions.filter(t => isSameDay(t.date, yesterday));
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today); d.setDate(d.getDate() - i);
            const daily = transactions.filter(t => isSameDay(t.date, d));
            trendData.push({ label: d.toLocaleDateString('th-TH', { weekday: 'short' }), income: daily.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.total)||0), 0), expense: daily.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.total)||0), 0) });
        }
    } else if (period === 'week') {
        const day = today.getDay(); const startOfWeek = new Date(today); startOfWeek.setHours(0,0,0,0); startOfWeek.setDate(today.getDate() - day);
        const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23,59,59,999);
        filteredTrans = transactions.filter(t => t.date >= startOfWeek && t.date <= endOfWeek);
        const startPrev = new Date(startOfWeek); startPrev.setDate(startPrev.getDate() - 7);
        const endPrev = new Date(endOfWeek); endPrev.setDate(endPrev.getDate() - 7);
        prevTrans = transactions.filter(t => t.date >= startPrev && t.date <= endPrev);
        for (let i = 0; i < 7; i++) { const d = new Date(startOfWeek); d.setDate(d.getDate() + i); const daily = transactions.filter(t => isSameDay(t.date, d)); trendData.push({ label: d.toLocaleDateString('th-TH', { weekday: 'short' }), income: daily.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.total)||0), 0), expense: daily.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.total)||0), 0) }); }
    } else if (period === 'month') {
        filteredTrans = transactions.filter(t => t.date.getMonth() === today.getMonth() && t.date.getFullYear() === today.getFullYear());
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        prevTrans = transactions.filter(t => t.date.getMonth() === lastMonth.getMonth() && t.date.getFullYear() === lastMonth.getFullYear());
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) { const d = new Date(today.getFullYear(), today.getMonth(), i); const daily = transactions.filter(t => isSameDay(t.date, d)); trendData.push({ label: `${i}`, income: daily.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.total)||0), 0), expense: daily.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.total)||0), 0) }); }
    } else if (period === 'year') {
        filteredTrans = transactions.filter(t => t.date.getFullYear() === today.getFullYear());
        prevTrans = transactions.filter(t => t.date.getFullYear() === today.getFullYear() - 1);
        for (let i = 0; i < 12; i++) { const d = new Date(today.getFullYear(), i, 1); const monthly = transactions.filter(t => t.date.getMonth() === i && t.date.getFullYear() === today.getFullYear()); trendData.push({ label: d.toLocaleDateString('th-TH', { month: 'short' }), income: monthly.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.total)||0), 0), expense: monthly.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.total)||0), 0) }); }
    }

    const income = filteredTrans.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.total)||0), 0);
    const expense = filteredTrans.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.total)||0), 0);
    const profit = income - expense;
    
    const prevIncome = prevTrans.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.total)||0), 0);
    const incomeGrowth = prevIncome === 0 ? (income > 0 ? 100 : 0) : ((income - prevIncome) / prevIncome) * 100;
    
    const channelMap = {}; filteredTrans.filter(t => t.type === 'income').forEach(t => { const ch = t.channel || 'อื่นๆ'; channelMap[ch] = (channelMap[ch] || 0) + Number(t.total); });
    const channels = Object.entries(channelMap).map(([name, value]) => ({ name, value, percent: income ? (value / income) * 100 : 0 })).sort((a, b) => b.value - a.value);
    
    const costMap = {}; filteredTrans.filter(t => t.type === 'expense').forEach(t => { const cat = t.category || 'อื่นๆ'; costMap[cat] = (costMap[cat] || 0) + Number(t.total); });
    const costs = Object.entries(costMap).map(([name, value]) => ({ name, value, percent: expense ? (value / expense) * 100 : 0 })).sort((a, b) => b.value - a.value).slice(0, 5);

    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();
    
    const avgDailyIncome = currentDay > 0 ? income / currentDay : 0;
    const projectedIncome = period === 'month' ? avgDailyIncome * daysInMonth : income;
    const avgDailyExpense = currentDay > 0 ? expense / currentDay : 0;

    return { 
        income, expense, profit, incomeGrowth, 
        channels, costs, trend: trendData,
        avgDailyIncome, projectedIncome, avgDailyExpense 
    };
  }, [transactions, period]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 2000));
    setAiAdvice(`จากข้อมูล ยอดขายเฉลี่ยต่อวันของคุณคือ ${formatCurrency(analytics.avgDailyIncome)} บาท หากรักษามาตรฐานนี้ได้ ยอดขายสิ้นเดือนจะอยู่ที่ประมาณ ${formatCurrency(analytics.projectedIncome)} บาท ควรระวังค่าใช้จ่ายด้าน ${analytics.costs[0]?.name || 'ทั่วไป'} ที่เริ่มสูงขึ้น`);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 w-full max-w-[2400px] mx-auto pb-10 animate-fadeIn p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-2">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard ภาพรวม</h2>
            <p className="text-slate-500 mt-1">สรุปข้อมูลการเงินและคาดการณ์ ({period === 'day' ? 'รายวัน' : period === 'week' ? 'รายสัปดาห์' : period === 'month' ? 'รายเดือน' : 'รายปี'})</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap justify-end">
            <div className="flex bg-slate-100 p-1 rounded-xl">
                {['day', 'week', 'month', 'year'].map(p => (
                    <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${period === p ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        {p === 'day' ? 'รายวัน' : p === 'week' ? 'รายสัปดาห์' : p === 'month' ? 'รายเดือน' : 'รายปี'}
                    </button>
                ))}
            </div>
            <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">{isAnalyzing ? <Loader size={18} className="animate-spin"/> : <Sparkles size={18}/>} {isAnalyzing ? '...' : 'AI วิเคราะห์'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Projected (End Month)" subtitle="คาดการณ์ปิดยอดสิ้นเดือน" value={analytics.projectedIncome} color="indigo" icon={<Target />} subText={`คำนวณจากเฉลี่ย ${formatCurrency(analytics.avgDailyIncome)}/วัน`} />
        <StatCard title="Total Revenue" subtitle={`ยอดขายจริง (${period==='day'?'วันนี้':period==='week'?'สัปดาห์นี้':period==='month'?'เดือนนี้':'ปีนี้'})`} value={analytics.income} trend={analytics.incomeGrowth} color="emerald" icon={<TrendingUp />} subText="ยอดรับชำระจริงทั้งหมด" />
        <StatCard title="Total Expenses" subtitle={`รายจ่ายรวม (${period==='day'?'วันนี้':period==='week'?'สัปดาห์นี้':period==='month'?'เดือนนี้':'ปีนี้'})`} value={analytics.expense} color="rose" icon={<TrendingDown />} subText={`เฉลี่ยจ่ายวันละ ${formatCurrency(analytics.avgDailyExpense)}`} />
        <StatCard title="Net Profit" subtitle="กำไรสุทธิ (ก่อนหักภาษี)" value={analytics.profit} color="indigo" icon={<Wallet />} subText={`Margin: ${analytics.income > 0 ? ((analytics.profit/analytics.income)*100).toFixed(1) : 0}%`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="xl:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full">
          <div className="flex justify-between items-center mb-8"><h3 className="font-bold text-slate-700 text-lg flex items-center gap-2"><BarChart3 className="text-indigo-500"/> Financial Trend</h3></div>
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <div className="h-64 flex items-end gap-3 px-2 min-w-full w-max">
              {analytics.trend.map((t, i) => {
                const maxVal = Math.max(...analytics.trend.map(d => Math.max(d.income, d.expense))) || 1;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 min-w-[50px] group relative">
                    <div className="flex gap-1 items-end h-full w-full justify-center">
                        <div className="w-full md:w-8 bg-emerald-400 rounded-t-lg relative hover:bg-emerald-500 transition-all duration-300" style={{ height: `${Math.max(t.income / maxVal * 100, 2)}%` }}></div>
                        <div className="w-full md:w-8 bg-rose-400 rounded-t-lg relative hover:bg-rose-500 transition-all duration-300" style={{ height: `${Math.max(t.expense / maxVal * 100, 2)}%` }}></div>
                    </div>
                    <span className="text-[10px] md:text-xs font-medium text-slate-400 whitespace-nowrap">{t.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 text-lg"><Target className="text-purple-500"/> Top Channels</h3>
          <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
             {analytics.channels.length === 0 ? <p className="text-center text-slate-300 py-10">ไม่มีข้อมูลช่วงเวลานี้</p> : analytics.channels.map((ch, i) => (
                <div key={i}>
                   <div className="flex justify-between text-sm mb-2"><span className="font-semibold text-slate-600">{ch.name}</span><span className="text-slate-400 text-xs font-medium">{formatCurrency(ch.value)}</span></div>
                   <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: `${ch.percent}%` }}></div></div>
                </div>
             ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 text-lg"><PieChart className="text-orange-500"/> Top Expenses</h3>
            <div className="space-y-4">
               {analytics.costs.length === 0 ? <p className="text-center text-slate-300 py-10">ไม่มีข้อมูลรายจ่าย</p> : analytics.costs.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3"><div className={`w-2.5 h-2.5 rounded-full ${i===0?'bg-rose-500':i===1?'bg-orange-500':'bg-slate-300'}`}></div><span className="font-medium text-slate-600">{c.name}</span></div>
                      <span className="font-bold text-slate-700">{formatCurrency(c.value)}</span>
                  </div>
               ))}
            </div>
         </div>
         <div className="xl:col-span-2">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group min-h-[200px] mb-6">
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"><Sparkles size={24} className="text-yellow-300 animate-pulse"/></div>
                            <h3 className="text-2xl font-bold uppercase tracking-wider text-white">AI Financial Analyst</h3>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            <p className="text-lg leading-relaxed text-indigo-50 font-medium">{aiAdvice || "ระบบพร้อมวิเคราะห์ข้อมูลสุขภาพทางการเงินของคุณ กดปุ่ม 'AI วิเคราะห์' ด้านบนเพื่อเริ่มการวิเคราะห์..."}</p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl group-hover:bg-white/15 transition-all duration-1000"></div>
            </div>
         </div>
      </div>
    </div>
  );
};

// ... RecordManager (Update: Sync Split Expenses on Edit) ...
const RecordManager = ({ user, transactions }) => {
  const [subTab, setSubTab] = useState('new'); 
  const [histPeriod, setHistPeriod] = useState('month'); 
  const [histDate, setHistDate] = useState(new Date().toISOString().split('T')[0]);
  const [deleteId, setDeleteId] = useState(null); 
  const [isDeleting, setIsDeleting] = useState(false);
  const [recentSearch, setRecentSearch] = useState('');
  const [historySearch, setHistorySearch] = useState(''); 
  
  const [vendors, setVendors] = useState([]);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [deleteVendorId, setDeleteVendorId] = useState(null); 
  const [editingId, setEditingId] = useState(null);

  const initialForm = { 
    type: 'income', 
    date: new Date().toISOString().split('T')[0], 
    description: '', 
    amount: '', 
    vatType: 'included', 
    whtRate: 0, 
    channel: CONSTANTS.CHANNELS[0], 
    orderId: '', 
    category: CONSTANTS.CATEGORIES.INCOME[0], 
    taxInvoiceNo: '', 
    vendorName: '', 
    vendorTaxId: '', 
    vendorBranch: '00000', 
    
    // New E-commerce specific fields
    itemAmount: '',      // ค่าสินค้า (Item Price)
    customerShippingFee: '', // ค่าส่งที่ลูกค้าจ่าย (Cust. Ship)
    platformFee: '',     // ค่าธรรมเนียม (Platform Fee)
    shippingFee: '',     // ค่าขนส่งที่ถูกหัก (System Deduction)
    shopVoucher: '',     // ส่วนลดร้านค้า (Shop Voucher)
    
    // New General Expense fields
    expenseDiscount: '', // ส่วนลด (Voucher) for general expense
    
    shippingPayer: 'customer', // 'customer' or 'shop'
    grossAmount: '' // Keeping for compatibility, but recalculated
  };
  
  const [formData, setFormData] = useState(initialForm);
  const [filterType, setFilterType] = useState('all');
  const [magicPrompt, setMagicPrompt] = useState('');
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isEcommerceMode, setIsEcommerceMode] = useState(false);

  // Extract unique descriptions for autocomplete
  const descriptionSuggestions = useMemo(() => {
    const descriptions = transactions
      .map(t => t.description)
      .filter(d => 
        d && 
        d.trim().length > 0 && 
        !d.includes('ค่าธรรมเนียม') && // Exclude fees
        !d.includes('ค่าขนส่ง')       // Exclude shipping logic
      );
    return [...new Set(descriptions)];
  }, [transactions]);

  useEffect(() => { if (user) { const q = query(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'vendors')); const unsub = onSnapshot(q, (snap) => { setVendors(snap.docs.map(d => ({id: d.id, ...d.data()}))); }); return () => unsub(); } }, [user]);
  
  useEffect(() => { setIsEcommerceMode(formData.type === 'income' && ['Shopee', 'Lazada', 'TikTok'].includes(formData.channel)); }, [formData.channel, formData.type]);
  
  // Real-time calculation for E-Commerce Mode
  useEffect(() => { 
      if (isEcommerceMode) { 
          const itemPrice = parseFloat(formData.itemAmount || 0);
          const custShip = parseFloat(formData.customerShippingFee || 0);
          const fee = parseFloat(formData.platformFee || 0);
          const actualShip = parseFloat(formData.shippingFee || 0);
          const voucher = parseFloat(formData.shopVoucher || 0);

          const gross = itemPrice + custShip;
          const net = gross - fee - actualShip - voucher;

          setFormData(prev => ({ 
              ...prev, 
              grossAmount: gross,
              amount: net 
          })); 
      } else if (formData.type === 'expense') {
          // Real-time calc for General Expense (Net = Input - Voucher)
          // We don't overwrite 'amount' here because the user types into 'amount' directly as 'Bill Amount'
          // But we can update a visual 'Net Paid' if needed.
          // For now, let's just keep the state so the render can calculate 'Net Paid'.
      }
  }, [formData.itemAmount, formData.customerShippingFee, formData.platformFee, formData.shippingFee, formData.shopVoucher, isEcommerceMode, formData.expenseDiscount, formData.type]);

  const calculated = useMemo(() => { 
      // Base Amount for VAT
      // If E-Commerce: Gross = Item + Cust.Ship
      // If Expense with Voucher: Typically VAT is on the FULL Bill Amount, not Net Paid.
      
      const baseAmount = isEcommerceMode ? (parseFloat(formData.grossAmount) || 0) : (parseFloat(formData.amount) || 0);
      
      let net = 0, vat = 0; 
      if (formData.vatType === 'included') { 
          net = baseAmount * 100 / 107; 
          vat = baseAmount - net; 
      } else if (formData.vatType === 'excluded') { 
          net = baseAmount; 
          vat = baseAmount * 0.07; 
      } else { 
          net = baseAmount; 
          vat = 0; 
      } 
      
      const wht = formData.type === 'expense' ? (net * formData.whtRate / 100) : 0; 
      const expenseNetPaid = formData.type === 'expense' ? ((parseFloat(formData.amount) || 0) - (parseFloat(formData.expenseDiscount) || 0)) : 0;

      return { 
          net, 
          vat, 
          total: formData.vatType === 'excluded' ? net + vat : baseAmount, 
          wht, 
          baseAmount,
          expenseNetPaid
      }; 
  }, [formData.amount, formData.vatType, formData.whtRate, formData.type, formData.grossAmount, isEcommerceMode, formData.expenseDiscount]);
  
  const manageRelatedExpense = async (category, amount, baseDescription) => {
    if (amount <= 0 || !formData.orderId) return;

    // Check if expense already exists
    const q = query(
      collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'transactions'),
      where('orderId', '==', formData.orderId),
      where('category', '==', category),
      where('type', '==', 'expense')
    );
    const snap = await getDocs(q);

    const expenseData = {
        type: 'expense', 
        date: new Date(formData.date), 
        category: category, 
        description: baseDescription, 
        amount: parseFloat(amount), 
        vatType: 'included', 
        total: parseFloat(amount), 
        net: parseFloat(amount) * 100 / 107, 
        vat: parseFloat(amount) - (parseFloat(amount) * 100 / 107), 
        wht: 0, 
        orderId: formData.orderId,
        userId: user.uid 
    };

    if (!snap.empty) {
        // Update existing expense
        const docRef = snap.docs[0].ref;
        await updateDoc(docRef, { ...expenseData, updatedAt: serverTimestamp() });
        console.log(`Updated related expense: ${category}`);
    } else {
        // Create new expense
        await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'transactions'), { ...expenseData, createdAt: serverTimestamp() });
        console.log(`Created related expense: ${category}`);
    }
  };

  const handleSubmit = async (e) => { 
      e.preventDefault(); 
      if (!user) return; 
      
      let mainTransactionAmount = parseFloat(formData.amount); // For Expense, this is Bill Amount. For Income E-com, this is Net Receive.
      let dataToSave = {};

      if (isEcommerceMode) {
          // If E-Commerce, record GROSS as income, then record separate expenses
          mainTransactionAmount = parseFloat(formData.grossAmount || 0);
          dataToSave = { 
             ...formData, 
             amount: mainTransactionAmount,
             total: mainTransactionAmount,
             net: (formData.vatType === 'included' ? mainTransactionAmount * 100 / 107 : mainTransactionAmount),
             vat: (formData.vatType === 'included' ? mainTransactionAmount - (mainTransactionAmount * 100 / 107) : 0),
          };
      } else if (formData.type === 'expense') {
          // For General Expense, we save the BILL Amount as the transaction amount (for VAT purposes)
          // But we also save 'expenseDiscount' so we know the Net Paid.
          // Note: If user wants to record NET as the expense amount, they should input NET.
          // Assumption: User inputs BILL Amount.
          dataToSave = {
              ...formData,
              amount: mainTransactionAmount,
              total: formData.vatType === 'excluded' ? mainTransactionAmount + (mainTransactionAmount * 0.07) : mainTransactionAmount,
              net: (formData.vatType === 'included' ? mainTransactionAmount * 100 / 107 : mainTransactionAmount),
              vat: (formData.vatType === 'included' ? mainTransactionAmount - (mainTransactionAmount * 100 / 107) : (formData.vatType === 'excluded' ? mainTransactionAmount * 0.07 : 0)),
              expenseNetPaid: mainTransactionAmount - (parseFloat(formData.expenseDiscount) || 0)
          };
      } else {
          // General Income
           dataToSave = {
              ...formData,
              amount: mainTransactionAmount,
              total: formData.vatType === 'excluded' ? mainTransactionAmount + (mainTransactionAmount * 0.07) : mainTransactionAmount,
              net: (formData.vatType === 'included' ? mainTransactionAmount * 100 / 107 : mainTransactionAmount),
              vat: (formData.vatType === 'included' ? mainTransactionAmount - (mainTransactionAmount * 100 / 107) : (formData.vatType === 'excluded' ? mainTransactionAmount * 0.07 : 0)),
          };
      }

      // Time Fix
      const dateObj = new Date(formData.date);
      const now = new Date();
      dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      dataToSave.date = dateObj;
      dataToSave.userId = user.uid;

      if (!editingId) {
          dataToSave.createdAt = serverTimestamp();
      } else {
          dataToSave.updatedAt = serverTimestamp();
      }

      try { 
          if (editingId) {
            // Update Main Transaction
            await updateDoc(doc(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'transactions', editingId), dataToSave);
            
            // Sync Related Expenses (Platform Fee & Shipping Fee & Voucher)
            if (isEcommerceMode) {
                await manageRelatedExpense('ค่าธรรมเนียม Platform', formData.platformFee, `ค่าธรรมเนียม ${formData.channel} (Order: ${formData.orderId})`);
                await manageRelatedExpense('ค่าขนส่ง', formData.shippingFee, `ค่าขนส่ง ${formData.channel} (Order: ${formData.orderId}) - ${formData.shippingPayer === 'customer' ? 'ลูกค้าจ่าย' : 'ร้านค้าจ่าย'}`);
                await manageRelatedExpense('ส่วนลดร้านค้า', formData.shopVoucher, `ส่วนลดร้านค้า ${formData.channel} (Order: ${formData.orderId})`);
            }

            alert("แก้ไขรายการเรียบร้อย (และอัปเดตค่าใช้จ่าย/ส่วนลดที่เกี่ยวข้อง)");
            setEditingId(null);
            setFormData(initialForm); // Reset form after edit
          } else {
            // Create New Transaction
            await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'transactions'), dataToSave); 
            if (isEcommerceMode) {
                // Auto create expense transaction for Platform Fee
                if (formData.platformFee > 0) {
                    await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'transactions'), { 
                        type: 'expense', 
                        date: new Date(formData.date), 
                        category: 'ค่าธรรมเนียม Platform', 
                        description: `ค่าธรรมเนียม ${formData.channel} (Order: ${formData.orderId})`, 
                        amount: parseFloat(formData.platformFee), 
                        vatType: 'included', 
                        total: parseFloat(formData.platformFee), 
                        net: parseFloat(formData.platformFee) * 100 / 107, 
                        vat: parseFloat(formData.platformFee) - (parseFloat(formData.platformFee) * 100 / 107), 
                        wht: 0, 
                        createdAt: serverTimestamp(), 
                        orderId: formData.orderId,
                        userId: user.uid 
                    }); 
                }
                // Auto create expense for Shipping Fee
                if (formData.shippingFee > 0) {
                    await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'transactions'), { 
                        type: 'expense', 
                        date: new Date(formData.date), 
                        category: 'ค่าขนส่ง', 
                        description: `ค่าขนส่ง ${formData.channel} (Order: ${formData.orderId}) - ${formData.shippingPayer === 'customer' ? 'ลูกค้าจ่าย' : 'ร้านค้าจ่าย'}`, 
                        amount: parseFloat(formData.shippingFee), 
                        vatType: 'included', 
                        total: parseFloat(formData.shippingFee), 
                        net: parseFloat(formData.shippingFee) * 100 / 107, 
                        vat: parseFloat(formData.shippingFee) - (parseFloat(formData.shippingFee) * 100 / 107), 
                        wht: 0, 
                        createdAt: serverTimestamp(), 
                        orderId: formData.orderId,
                        userId: user.uid 
                    });
                }
                // Auto create expense for Shop Voucher
                if (formData.shopVoucher > 0) {
                    await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'transactions'), { 
                        type: 'expense', 
                        date: new Date(formData.date), 
                        category: 'ส่วนลดร้านค้า', 
                        description: `ส่วนลดร้านค้า ${formData.channel} (Order: ${formData.orderId})`, 
                        amount: parseFloat(formData.shopVoucher), 
                        vatType: 'included', 
                        total: parseFloat(formData.shopVoucher), 
                        net: parseFloat(formData.shopVoucher) * 100 / 107, 
                        vat: parseFloat(formData.shopVoucher) - (parseFloat(formData.shopVoucher) * 100 / 107), 
                        wht: 0, 
                        createdAt: serverTimestamp(), 
                        orderId: formData.orderId,
                        userId: user.uid 
                    });
                }
            } 
            alert("บันทึกสำเร็จ (แยกรายจ่าย/ส่วนลดให้อัตโนมัติ)"); 
          }
          setFormData(prev => ({ ...initialForm, type: prev.type, category: prev.category })); 
      } catch (error) { 
          console.error("Save failed:", error); 
          alert("บันทึกไม่สำเร็จ: " + error.message); 
      } 
  };

  const handleEdit = (item) => {
      setFormData({
          ...initialForm,
          ...item,
          date: formatDateISO(item.date),
          amount: item.amount || item.total
      });
      setEditingId(item.id);
      setSubTab('new');
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setFormData(initialForm);
  };

  const handleSaveVendor = async () => { if (!formData.vendorName) return alert("กรุณาระบุชื่อผู้ขาย"); const vendorData = { vendorName: formData.vendorName, vendorTaxId: formData.vendorTaxId, vendorBranch: formData.vendorBranch, updatedAt: serverTimestamp() }; try { await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'vendors'), vendorData); alert("บันทึกผู้ขายเรียบร้อย"); } catch (e) { console.error(e); } };
  const handleDeleteVendorClick = (id, e) => { e.stopPropagation(); setDeleteVendorId(id); };
  const executeDeleteVendor = async () => { if (!deleteVendorId) return; setIsDeleting(true); try { await deleteDoc(doc(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'vendors', deleteVendorId)); setDeleteVendorId(null); } catch (err) { console.error(err); } finally { setIsDeleting(false); } };
  const selectVendor = (vendor) => { setFormData(prev => ({ ...prev, vendorName: vendor.vendorName || '', vendorTaxId: vendor.vendorTaxId || '', vendorBranch: vendor.vendorBranch || '' })); setShowVendorModal(false); };
  const confirmDelete = (id) => { setDeleteId(id); };
  const executeDelete = async () => { if (!deleteId) return; setIsDeleting(true); try { await deleteDoc(doc(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'transactions', deleteId)); setDeleteId(null); } catch (err) { console.error("Error deleting record:", err); alert("เกิดข้อผิดพลาดในการลบ"); } finally { setIsDeleting(false); } };
  
  const recentTransactions = useMemo(() => transactions.filter(t => (filterType === 'all' || t.type === filterType) && (
      t.description?.toLowerCase().includes(recentSearch.toLowerCase()) || 
      (t.amount && t.amount.toString().includes(recentSearch)) || 
      (t.orderId && t.orderId.toString().toLowerCase().includes(recentSearch.toLowerCase()))
    )).sort((a,b) => b.date - a.date).slice(0, 50), [transactions, filterType, recentSearch]);
  const groupedRecent = useMemo(() => { const groups = {}; recentTransactions.forEach(t => { const dateKey = formatDate(t.date); if (!groups[dateKey]) groups[dateKey] = []; groups[dateKey].push(t); }); return groups; }, [recentTransactions]);

  const historyData = useMemo(() => transactions.filter(t => { 
      // 1. Period Filter
      let matchesPeriod = true;
      if (histPeriod !== 'all') {
          const tDate = normalizeDate(t.date); 
          const filterD = new Date(histDate); 
          if (histPeriod === 'day') matchesPeriod = tDate.toDateString() === filterD.toDateString(); 
          else if (histPeriod === 'month') matchesPeriod = tDate.getMonth() === filterD.getMonth() && tDate.getFullYear() === filterD.getFullYear(); 
          else if (histPeriod === 'year') matchesPeriod = tDate.getFullYear() === filterD.getFullYear(); 
      }

      // 2. Search Filter (NEW Logic)
      const searchLower = historySearch.toLowerCase();
      const matchesSearch = !historySearch || 
          t.description?.toLowerCase().includes(searchLower) ||
          t.amount?.toString().includes(searchLower) || 
          t.category?.toLowerCase().includes(searchLower) ||
          (t.orderId && t.orderId.toString().toLowerCase().includes(searchLower)) ||
          (t.taxInvoiceNo && t.taxInvoiceNo.toString().toLowerCase().includes(searchLower)) ||
          (t.vendorName && t.vendorName.toLowerCase().includes(searchLower));

      return matchesPeriod && matchesSearch;
  }).sort((a,b) => b.date - a.date), [transactions, histPeriod, histDate, historySearch]);

  const historySummary = useMemo(() => { const inc = historyData.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.total),0); const exp = historyData.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.total),0); return { inc, exp, bal: inc - exp }; }, [historyData]);
  
  const exportHistoryExcel = () => {
    const data = [['วันที่', 'ประเภท', 'หมวดหมู่', 'รายละเอียด', 'รายการ', 'ชื่อผู้ซื้อ/ผู้ขาย', 'เลขที่ใบกำกับภาษี/Order ID', 'ช่องทาง', 'จำนวนเงิน'], ...historyData.map(t => [formatDate(t.date), t.type, t.category, t.description, t.description || '', t.type === 'expense' ? (t.vendorName || '') : (t.channel || 'ลูกค้าทั่วไป'), t.taxInvoiceNo || (t.type === 'income' ? (t.orderId || t.id.slice(0,8)) : '-'), t.channel || '', t.total])];
    exportToExcel(`History_${histPeriod}_${histDate}.xlsx`, data);
  };

  const handleMagicFill = async () => { if (!magicPrompt) return; setIsMagicLoading(true); const prompt = `Extract transaction data from Thai text: "${magicPrompt}". Date: ${new Date().toISOString().split('T')[0]}. Return JSON: { type: "income"|"expense", amount: number, description: string, category: string, channel: string, date: "YYYY-MM-DD" }. Use best guess for missing fields.`; try { const data = await SmartTaxAI.generate(prompt, null, true); if (data) setFormData(prev => ({ ...prev, ...data })); } catch (error) { console.error(error); alert("AI Failed"); } finally { setIsMagicLoading(false); } };

  return (
    <div className="flex flex-col h-full lg:h-[calc(100vh-88px)] relative">
       {deleteId && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl scale-100 animate-fadeIn"><Trash2 size={48} className="mx-auto text-rose-500 mb-4 bg-rose-50 p-3 rounded-full"/><h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการลบ?</h3><p className="text-slate-500 mb-6">ข้อมูลนี้จะหายไปถาวร</p><div className="flex gap-3"><button onClick={()=>setDeleteId(null)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200">ยกเลิก</button><button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold">{isDeleting?<Loader className="animate-spin mx-auto"/>:'ลบรายการ'}</button></div></div></div>}
       {showVendorModal && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-3xl w-full max-w-md h-[70vh] flex flex-col shadow-2xl animate-fadeIn"><div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2"><BookOpen className="text-rose-500"/> เลือกผู้ขายเก่า</h3><button onClick={()=>setShowVendorModal(false)}><X className="text-slate-400 hover:text-slate-600"/></button></div><div className="flex-1 overflow-y-auto p-4 space-y-2">{vendors.map(v=><div key={v.id} onClick={()=>selectVendor(v)} className="p-4 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50 cursor-pointer transition-all group"><div className="flex justify-between items-start"><div><p className="font-bold text-slate-700">{v.vendorName}</p><p className="text-xs text-slate-400 mt-1">TAX: {v.vendorTaxId}</p></div><div className="flex gap-2"><button onClick={(e)=>handleDeleteVendorClick(v.id,e)} className="p-2 text-slate-300 hover:text-rose-500 bg-white rounded-full border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button></div></div></div>)}</div></div></div>}
       {deleteVendorId && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"><Trash2 size={48} className="mx-auto text-rose-500 mb-4 bg-rose-50 p-3 rounded-full"/><h3 className="text-xl font-bold text-slate-800 mb-2">ลบผู้ขาย?</h3><div className="flex gap-3 mt-6"><button onClick={()=>setDeleteVendorId(null)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600">ยกเลิก</button><button onClick={executeDeleteVendor} disabled={isDeleting} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold">{isDeleting?<Loader className="animate-spin mx-auto"/>:'ยืนยัน'}</button></div></div></div>}

       <div className="flex gap-1 p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl w-fit mb-6 self-center md:self-start border border-slate-200">
           <button onClick={()=>setSubTab('new')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${subTab==='new'?'bg-white text-indigo-600 shadow-sm':'text-slate-500 hover:text-slate-700'}`}><Edit size={16}/> บันทึกรายการ</button>
           <button onClick={()=>setSubTab('history')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${subTab==='history'?'bg-white text-indigo-600 shadow-sm':'text-slate-500 hover:text-slate-700'}`}><List size={16}/> รวมรายการ</button>
       </div>

       {subTab === 'new' ? (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
            <div className="lg:col-span-4 xl:col-span-5 bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-100 h-full overflow-y-auto custom-scrollbar flex flex-col">
                <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Edit size={20}/></div> 
                    {editingId ? <span className="text-orange-600">แก้ไขรายการ (Editing)</span> : 'New Transaction'}
                </h3>
                
                {editingId && (
                    <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 p-3 rounded-xl flex justify-between items-center animate-fadeIn">
                        <span className="text-sm font-bold">กำลังแก้ไขรายการเก่า</span>
                        <button onClick={handleCancelEdit} className="text-xs bg-white border border-orange-200 px-3 py-1 rounded-lg hover:bg-orange-100">ยกเลิก</button>
                    </div>
                )}

                <div className="mb-8 relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                    <div className="relative bg-white rounded-xl p-1 flex items-center gap-2 border border-slate-100">
                        <div className="pl-3 text-indigo-500"><Sparkles size={18}/></div>
                        <input className="flex-1 bg-transparent border-none text-sm p-3 focus:ring-0 placeholder:text-slate-400" placeholder="พิมพ์เช่น 'ขายเสื้อ 2 ตัว 500 บาท'" value={magicPrompt} onChange={e=>setMagicPrompt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleMagicFill()}/>
                        <button onClick={handleMagicFill} disabled={isMagicLoading} className="bg-indigo-600 text-white p-2.5 rounded-lg shadow-md hover:bg-indigo-700 transition-all">{isMagicLoading?<Loader size={16} className="animate-spin"/>:<Send size={16}/>}</button>
                    </div>
                </div>
                <div className="flex gap-2 p-1 bg-slate-50 rounded-xl mb-6">
                    <button onClick={()=>setFormData({...formData, type:'income', category:CONSTANTS.CATEGORIES.INCOME[0]})} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${formData.type==='income'?'bg-white text-emerald-600 shadow-sm':'text-slate-400'}`}>รายรับ</button>
                    <button onClick={()=>setFormData({...formData, type:'expense', category:CONSTANTS.CATEGORIES.EXPENSE[0]})} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${formData.type==='expense'?'bg-white text-rose-600 shadow-sm':'text-slate-400'}`}>รายจ่าย</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5 flex-1">
                   <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1"><label className="text-xs font-bold text-slate-500 ml-1">วันที่</label><input type="date" className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500" value={formData.date} onChange={e=>setFormData({...formData,date:e.target.value})}/></div>
                       <div className="space-y-1"><label className="text-xs font-bold text-slate-500 ml-1">หมวดหมู่</label><select className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500" value={formData.category} onChange={e=>setFormData({...formData,category:e.target.value})}>{(formData.type==='income'?CONSTANTS.CATEGORIES.INCOME:CONSTANTS.CATEGORIES.EXPENSE).map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                   </div>
                   {formData.type === 'income' ? (
                       <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-4">
                           <div className="flex justify-between items-center text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1"><span className="flex items-center gap-1"><Store size={14}/> E-Commerce</span></div>
                           <div className="grid grid-cols-2 gap-4">
                               <input className="bg-white border-0 rounded-xl p-3 text-sm shadow-sm" placeholder="Order ID" value={formData.orderId} onChange={e=>setFormData({...formData,orderId:e.target.value})}/>
                               <select className="bg-white border-0 rounded-xl p-3 text-sm shadow-sm" value={formData.channel} onChange={e=>setFormData({...formData,channel:e.target.value})}>{CONSTANTS.CHANNELS.map(c=><option key={c} value={c}>{c}</option>)}</select>
                           </div>
                           {isEcommerceMode && (
                               <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                                   <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-600"><Calculator size={14}/> Calculator (Gross vs Net)</div>
                                      <div className="flex gap-2">
                                          <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                                              <input type="radio" name="shippingPayer" checked={formData.shippingPayer === 'customer'} onChange={()=>setFormData({...formData, shippingPayer: 'customer'})} className="text-emerald-600 focus:ring-0 w-3 h-3"/>
                                              ลูกค้าจ่าย
                                          </label>
                                          <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                                              <input type="radio" name="shippingPayer" checked={formData.shippingPayer === 'shop'} onChange={()=>setFormData({...formData, shippingPayer: 'shop'})} className="text-emerald-600 focus:ring-0 w-3 h-3"/>
                                              ร้านจ่าย (Free)
                                          </label>
                                      </div>
                                   </div>
                                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div><label className="text-[10px] text-slate-400 font-bold block mb-1">ค่าสินค้า (Item)</label><input type="number" className="w-full bg-slate-50 border-0 rounded-lg p-2 text-sm font-bold text-slate-700" placeholder="0.00" value={formData.itemAmount} onChange={e=>setFormData({...formData,itemAmount:e.target.value})}/></div>
                                        <div><label className="text-[10px] text-slate-400 font-bold block mb-1">ค่าส่งลูกค้าจ่าย (Cust.Ship)</label><input type="number" className="w-full bg-slate-50 border-0 rounded-lg p-2 text-sm font-bold text-slate-700" placeholder="0.00" value={formData.customerShippingFee} onChange={e=>setFormData({...formData,customerShippingFee:e.target.value})}/></div>
                                        <div><label className="text-[10px] text-slate-400 font-bold block mb-1">ค่าธรรมเนียม (Fee)</label><input type="number" className="w-full bg-slate-50 border-0 rounded-lg p-2 text-sm font-bold text-rose-500" placeholder="0.00" value={formData.platformFee} onChange={e=>setFormData({...formData,platformFee:e.target.value})}/></div>
                                        <div><label className="text-[10px] text-slate-400 font-bold block mb-1">ค่าส่งระบบหัก (Act.Ship)</label><input type="number" className="w-full bg-slate-50 border-0 rounded-lg p-2 text-sm font-bold text-rose-500" placeholder="0.00" value={formData.shippingFee} onChange={e=>setFormData({...formData,shippingFee:e.target.value})}/></div>
                                   </div>
                                   <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-100 flex items-center gap-2">
                                        <div className="p-1.5 bg-white rounded-full text-orange-500"><Tag size={12}/></div>
                                        <div className="flex-1">
                                            <label className="text-[10px] text-orange-500 font-bold block mb-0.5">ส่วนลดร้านค้า (Shop Voucher)</label>
                                            <input type="number" className="w-full bg-white border-0 rounded-md p-1.5 text-sm font-bold text-orange-600 placeholder:text-orange-200" placeholder="0.00" value={formData.shopVoucher} onChange={e=>setFormData({...formData,shopVoucher:e.target.value})}/>
                                        </div>
                                   </div>
                                   {/* Summary Box */}
                                   <div className="mt-3 grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-emerald-100">
                                        <div className="text-center border-r border-slate-200">
                                             <p className="text-[10px] text-slate-400 uppercase font-bold">ยอดขาย (Gross)</p>
                                             <p className="text-lg font-bold text-emerald-600">{formatCurrency(parseFloat(formData.grossAmount) || 0)}</p>
                                        </div>
                                        <div className="text-center">
                                             <p className="text-[10px] text-slate-400 uppercase font-bold">เงินเข้าจริง (Net)</p>
                                             <p className="text-lg font-bold text-indigo-600">{formatCurrency(parseFloat(formData.amount) || 0)}</p>
                                        </div>
                                   </div>
                               </div>
                           )}
                       </div>
                   ) : (
                       <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 space-y-4">
                           <div className="flex justify-between items-center mb-1">
                               <span className="text-rose-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><User size={14}/> Vendor</span>
                               <div className="flex gap-1">
                                   <button type="button" onClick={()=>setShowVendorModal(true)} className="bg-white border border-rose-200 text-rose-600 text-[10px] px-2 py-1 rounded-md font-bold hover:bg-rose-50">เลือกเก่า</button>
                                   <button type="button" onClick={handleSaveVendor} className="bg-rose-600 text-white text-[10px] px-2 py-1 rounded-md font-bold hover:bg-rose-700">บันทึกใหม่</button>
                               </div>
                           </div>
                           <input className="w-full bg-white border-0 rounded-xl p-3 text-sm shadow-sm" placeholder="ชื่อร้านค้า / ผู้รับเงิน" value={formData.vendorName} onChange={e=>setFormData({...formData,vendorName:e.target.value})}/>
                           <div className="grid grid-cols-2 gap-4">
                               <input className="bg-white border-0 rounded-xl p-3 text-sm shadow-sm" placeholder="เลขผู้เสียภาษี" value={formData.vendorTaxId} onChange={e=>setFormData({...formData,vendorTaxId:e.target.value})}/>
                               <input className="bg-white border-0 rounded-xl p-3 text-sm shadow-sm" placeholder="สาขา" value={formData.vendorBranch} onChange={e=>setFormData({...formData,vendorBranch:e.target.value})}/>
                           </div>
                           <input className="w-full bg-white border-0 rounded-xl p-3 text-sm shadow-sm" placeholder="เลขที่ใบกำกับภาษี (Tax Invoice No.)" value={formData.taxInvoiceNo} onChange={e=>setFormData({...formData,taxInvoiceNo:e.target.value})}/>
                       </div>
                   )}
                   <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-500 ml-1">รายละเอียด</label>
                       <input 
                           list="desc-suggestions"
                           className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" 
                           placeholder="..." 
                           value={formData.description} 
                           onChange={e=>setFormData({...formData,description:e.target.value})}
                       />
                       <datalist id="desc-suggestions">
                           {descriptionSuggestions.map((desc, i) => (
                               <option key={i} value={desc} />
                           ))}
                       </datalist>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1"><label className="text-xs font-bold text-slate-500 ml-1">{isEcommerceMode ? "เงินเข้าจริง (Net)" : "ยอดตามบิล (Total)"}</label><input type="number" className={`w-full bg-slate-50 border-0 rounded-xl p-3 text-lg font-bold text-right ${isEcommerceMode?'text-emerald-500':'text-slate-800'}`} value={formData.amount} onChange={e=>setFormData({...formData,amount:e.target.value})} readOnly={isEcommerceMode}/></div>
                       <div className="space-y-1"><label className="text-xs font-bold text-slate-500 ml-1">VAT</label><select className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm" value={formData.vatType} onChange={e=>setFormData({...formData,vatType:e.target.value})}><option value="included">รวม VAT</option><option value="excluded">แยก VAT</option><option value="none">ไม่มี VAT</option></select></div>
                   </div>
                   
                   {/* General Expense Voucher Field */}
                   {formData.type === 'expense' && (
                       <div className="flex gap-4">
                           <div className="flex-1 space-y-1">
                               <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1"><TicketPercent size={12}/> ส่วนลด / Voucher</label>
                               <input type="number" className="w-full bg-orange-50/50 border border-orange-100 rounded-xl p-3 text-sm font-bold text-orange-600 text-right focus:ring-orange-200" placeholder="0.00" value={formData.expenseDiscount} onChange={e=>setFormData({...formData,expenseDiscount:e.target.value})}/>
                           </div>
                           <div className="flex-1 space-y-1 opacity-50">
                               <label className="text-xs font-bold text-slate-500 ml-1">ยอดจ่ายจริง (Net Paid)</label>
                               <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-600 text-right cursor-not-allowed">
                                   {formatCurrency(calculated.expenseNetPaid)}
                               </div>
                           </div>
                       </div>
                   )}

                   {formData.type === 'expense' && (
                       <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100 flex items-center gap-3">
                           <div className="text-yellow-600 font-bold text-xs whitespace-nowrap">หัก ณ ที่จ่าย (WHT)</div>
                           <select className="w-full bg-white border-0 rounded-lg p-2 text-sm text-slate-700" value={formData.whtRate} onChange={e=>setFormData({...formData,whtRate:Number(e.target.value)})}>
                               <option value={0}>ไม่หัก (0%)</option><option value={1}>1% - ขนส่ง</option><option value={3}>3% - บริการ</option><option value={5}>5% - ค่าเช่า</option>
                           </select>
                       </div>
                   )}
                   <div className="bg-slate-800 text-white p-5 rounded-2xl shadow-lg mt-auto">
                        <div className="flex justify-between text-sm opacity-80 mb-1"><span>Base:</span><span>{formatCurrency(calculated.baseAmount)}</span></div>
                        <div className="flex justify-between text-sm opacity-80 mb-2"><span>VAT 7%:</span><span>{formatCurrency(calculated.vat)}</span></div>
                        <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/20"><span>Total:</span><span>{formatCurrency(calculated.baseAmount)}</span></div>
                   </div>
                   <button type="submit" className={`w-full text-white py-4 rounded-xl font-bold shadow-lg transition-all flex justify-center items-center gap-2 ${editingId ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
                       <Save size={20}/> {editingId ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
                   </button>
                </form>
            </div>
            
            {/* RIGHT SIDE (Recent Transactions) */}
            <div className="lg:col-span-8 xl:col-span-7 bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Clock className="text-indigo-500"/> รายการล่าสุด</h3>
                       <div className="flex bg-slate-100 p-1 rounded-lg">
                           {['all', 'income', 'expense'].map(t => <button key={t} onClick={()=>setFilterType(t)} className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${filterType===t?'bg-white shadow text-indigo-600':'text-slate-500'}`}>{t}</button>)}
                       </div>
                   </div>
                   <div className="relative">
                       <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                       <input className="w-full bg-slate-50 border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100" placeholder="ค้นหาตามชื่อ, จำนวนเงิน, Order ID..." value={recentSearch} onChange={e=>setRecentSearch(e.target.value)}/>
                   </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {Object.entries(groupedRecent).length === 0 ? <div className="text-center py-20 text-slate-300">ไม่มีรายการ</div> : 
                   Object.entries(groupedRecent).map(([date, items]) => (
                      <div key={date}>
                          <div className="sticky top-0 bg-white/95 backdrop-blur py-2 mb-2 z-10 w-fit px-3 rounded-lg border border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider shadow-sm">{date}</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {items.map(t => (
                                  <div key={t.id} className="bg-white border border-slate-100 p-4 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all group relative">
                                          <div className="flex justify-between items-start mb-2">
                                              <div className="flex items-center gap-3">
                                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type==='income'?'bg-emerald-100 text-emerald-600':'bg-rose-100 text-rose-600'}`}>
                                                      {t.type==='income' ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                                                  </div>
                                                  <div>
                                                      <p className="font-bold text-slate-700 text-sm line-clamp-1">{t.description}</p>
                                                      <div className="flex gap-2 text-[10px] mt-0.5">
                                                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{t.category}</span>
                                                          {t.channel && <span className="border border-slate-200 px-1.5 py-0.5 rounded text-slate-400">{t.channel}</span>}
                                                      </div>
                                                  </div>
                                              </div>
                                              <p className={`font-bold text-sm ${t.type==='income'?'text-emerald-600':'text-slate-800'}`}>{t.type==='income'?'+':'-'}{formatCurrency(t.total)}</p>
                                          </div>
                                          {(t.orderId || t.taxInvoiceNo) && (
                                              <div className="text-[10px] text-slate-400 pl-[52px] mb-1">
                                                  Ref: {t.orderId || t.taxInvoiceNo}
                                              </div>
                                          )}
                                          {t.expenseNetPaid && (
                                              <div className="text-[10px] text-orange-400 pl-[52px] flex items-center gap-1">
                                                  <TicketPercent size={10}/> จ่ายจริง: {formatCurrency(t.expenseNetPaid)} (ใช้ Voucher)
                                              </div>
                                          )}
                                          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={()=>handleEdit(t)} className="p-1.5 bg-slate-50 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"><Edit size={14}/></button>
                                            <button onClick={()=>confirmDelete(t.id)} className="p-1.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                                          </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
               </div>
            </div>
         </div>
        ) : (
          /* HISTORY TAB (FULL TABLE VIEW) */
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden animate-fadeIn">
            {/* Same History Table logic but with improved styling */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg"><Clock className="text-indigo-500"/> Transaction History</h3>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <input 
                            className="bg-slate-50 border-none rounded-xl text-sm py-2 pl-9 pr-4 text-slate-600 focus:ring-2 focus:ring-indigo-100 w-48" 
                            placeholder="ค้นหา..." 
                            value={historySearch} 
                            onChange={e=>setHistorySearch(e.target.value)}
                        />
                    </div>
                    
                    <select className="bg-slate-50 border-none rounded-xl text-sm font-bold py-2 px-4 text-slate-600" value={histPeriod} onChange={e=>setHistPeriod(e.target.value)}>
                        <option value="month">รายเดือน</option><option value="year">รายปี</option><option value="all">ทั้งหมด</option>
                    </select>
                    {histPeriod !== 'all' && <input type={histPeriod==='month'?'month':'number'} className="bg-slate-50 border-none rounded-xl text-sm font-bold py-2 px-4 text-slate-600" value={histDate} onChange={e=>setHistDate(e.target.value)}/>}
                    <button onClick={exportHistoryExcel} className="bg-indigo-50 text-indigo-600 p-2 rounded-xl hover:bg-indigo-100 flex items-center gap-2"><FileText size={20}/> Excel</button>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50/50">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 text-center"><p className="text-xs text-emerald-500 font-bold uppercase mb-1">รายรับ</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(historySummary.inc)}</p></div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 text-center"><p className="text-xs text-rose-500 font-bold uppercase mb-1">รายจ่าย</p><p className="text-lg font-bold text-rose-600">{formatCurrency(historySummary.exp)}</p></div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 text-center"><p className="text-xs text-indigo-500 font-bold uppercase mb-1">คงเหลือ</p><p className="text-lg font-bold text-indigo-600">{formatCurrency(historySummary.bal)}</p></div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-slate-400 font-bold sticky top-0 z-10 border-b border-slate-100">
                        <tr><th className="p-4">Date</th><th className="p-4">Category</th><th className="p-4">Description</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {historyData.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-4 text-slate-500">{formatDate(t.date)}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${t.type==='income'?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-700'}`}>{t.category}</span></td>
                                <td className="p-4">
                                    <div className="font-medium text-slate-700">{t.description}</div>
                                    {(t.orderId || t.channel) && (
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {t.orderId && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">Ref: {t.orderId}</span>}
                                            {t.channel && <span className="text-[10px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded border border-indigo-100">{t.channel}</span>}
                                        </div>
                                    )}
                                </td>
                                <td className={`p-4 text-right font-bold ${t.type==='income'?'text-emerald-600':'text-slate-800'}`}>{t.type==='income'?'+':'-'}{formatCurrency(t.total)}</td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={()=>handleEdit(t)} className="text-slate-300 hover:text-orange-500 transition-colors bg-white border border-slate-200 p-1.5 rounded-lg"><Edit size={14}/></button>
                                        <button onClick={()=>confirmDelete(t.id)} className="text-slate-300 hover:text-rose-500 transition-colors bg-white border border-slate-200 p-1.5 rounded-lg"><Trash2 size={14}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         </div>
        )}
    </div>
  );
};

// ... StockManager (Standard, No Changes) ...
const StockManager = ({ user }) => {
   const [products, setProducts] = useState([]);
   const [showAddProductModal, setShowAddProductModal] = useState(false);
   const [newItem, setNewItem] = useState({ name: '', sku: '', qty: 0, unit: 'ชิ้น', expDate: '' });
   const [editingId, setEditingId] = useState(null);

   useEffect(() => {
      if(!user) return;
      const q = query(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'products'));
      const unsub = onSnapshot(q, (snapshot) => {
         setProducts(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
      });
      return () => unsub();
   }, [user]);

   const handleSaveProduct = async () => {
      if(!newItem.name) return;
      const productData = { ...newItem };
      if (!productData.expDate) delete productData.expDate;
      if (editingId) {
          await updateDoc(doc(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'products', editingId), { ...productData, updatedAt: serverTimestamp() });
          setEditingId(null);
      } else {
          await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'products'), {...productData, updatedAt: serverTimestamp()});
      }
      setNewItem({ name: '', sku: '', qty: 0, unit: 'ชิ้น', expDate: '' });
      setShowAddProductModal(false);
   };

   const updateStock = async (id, currentQty, change) => {
      await updateDoc(doc(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'products', id), { qty: (Number(currentQty) || 0) + change, updatedAt: serverTimestamp() });
   };

   return (
      <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-100 h-full flex flex-col relative">
         {showAddProductModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-fadeIn p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><Package className="text-orange-500"/> {editingId ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h3>
                        <button onClick={()=>{setShowAddProductModal(false); setEditingId(null); setNewItem({ name: '', sku: '', qty: 0, unit: 'ชิ้น', expDate: '' });}}><X className="text-slate-400 hover:text-slate-600"/></button>
                    </div>
                    <div className="space-y-4">
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">ชื่อสินค้า</label><input className="w-full bg-slate-50 border-0 rounded-xl p-3" value={newItem.name} onChange={e=>setNewItem({...newItem, name: e.target.value})}/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block">จำนวน</label><input type="number" className="w-full bg-slate-50 border-0 rounded-xl p-3" value={newItem.qty} onChange={e=>setNewItem({...newItem, qty: Number(e.target.value)})}/></div>
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block">หน่วย</label><input className="w-full bg-slate-50 border-0 rounded-xl p-3" value={newItem.unit} onChange={e=>setNewItem({...newItem, unit: e.target.value})}/></div>
                        </div>
                        <button onClick={handleSaveProduct} className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold mt-4">บันทึก</button>
                    </div>
                </div>
            </div>
         )}
         <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-slate-700 text-xl flex items-center gap-2"><Package className="text-orange-500"/> Stock Report</h3>
             <button onClick={() => setShowAddProductModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2"><PlusCircle size={18}/> เพิ่มสินค้า</button>
         </div>
         <div className="flex-1 overflow-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10"><tr><th className="p-4">Name</th><th className="p-4 text-center">Qty</th><th className="p-4 text-center">Action</th></tr></thead>
               <tbody className="divide-y divide-slate-50">
                  {products.map(p => (
                      <tr key={p.id} className="hover:bg-orange-50/30">
                          <td className="p-4 font-bold text-slate-700">{p.name} <span className="text-xs text-slate-400 font-normal">({p.unit})</span></td>
                          <td className="p-4 text-center font-bold text-lg">{p.qty}</td>
                          <td className="p-4 flex justify-center gap-2">
                             <button onClick={()=>updateStock(p.id, p.qty, 1)} className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">+</button>
                             <button onClick={()=>updateStock(p.id, p.qty, -1)} className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">-</button>
                             <button onClick={()=>{setNewItem(p); setEditingId(p.id); setShowAddProductModal(true);}} className="p-2 text-indigo-500"><Edit size={16}/></button>
                          </td>
                       </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
};

const InvoiceGenerator = ({ user, invoices }) => {
  const [mode, setMode] = useState('create');
  // Load Seller Info from LocalStorage
  const savedSeller = useMemo(() => {
      try {
          return JSON.parse(localStorage.getItem('merchant_seller_info') || '{}');
      } catch (e) { return {}; }
  }, []);

  const initialInvData = {
    docType: 'ใบกำกับภาษี / ใบเสร็จรับเงิน',
    customerName: '', address: '', taxId: '', branch: '00000',
    custSubDistrict: '', custDistrict: '', custProvince: '', custZipCode: '', 
    customerPhone: '', customerEmail: '',
    items: [{ desc: '', qty: 1, unit: 'ชิ้น', price: 0 }],
    date: formatDateISO(new Date()), invNo: '',
    sellerName: savedSeller.sellerName || '',
    sellerAddress: savedSeller.sellerAddress || '',
    sellerTaxId: savedSeller.sellerTaxId || '',
    sellerBranchId: savedSeller.sellerBranchId || '00000',
    sellerPhone: savedSeller.sellerPhone || '',
    sellerEmail: savedSeller.sellerEmail || '',
    sellerSubDistrict: savedSeller.sellerSubDistrict || '',
    sellerDistrict: savedSeller.sellerDistrict || '',
    sellerProvince: savedSeller.sellerProvince || '',
    sellerZipCode: savedSeller.sellerZipCode || '',
    discount: 0,
    notes: 'สินค้าซื้อแล้วไม่รับเปลี่ยนหรือคืนเงิน'
  };

  const [invData, setInvData] = useState(initialInvData);
  const [editingDocId, setEditingDocId] = useState(null);
  const [docTypeStatus, setDocTypeStatus] = useState('original');
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [sellerProfiles, setSellerProfiles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deleteCustomerId, setDeleteCustomerId] = useState(null);
  const [deleteId, setDeleteId] = useState(null); 
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { 
    if (mode === 'create' && !editingDocId) { 
      const dateStr = invData.date.replace(/-/g, ''); 
      const count = invoices.filter(inv => inv.invNo && inv.invNo.startsWith(dateStr)).length + 1; 
      setInvData(prev => ({ ...prev, invNo: `${dateStr}-${String(count).padStart(3, '0')}` })); 
    } 
  }, [invData.date, invoices, mode, editingDocId]);

  useEffect(() => {
      if (user) {
          const qSellers = query(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'seller_profiles'));
          const unsubSellers = onSnapshot(qSellers, (snap) => setSellerProfiles(snap.docs.map(d => ({id: d.id, ...d.data()}))));
          const qCustomers = query(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'customers'));
          const unsubCustomers = onSnapshot(qCustomers, (snap) => setCustomers(snap.docs.map(d => ({id: d.id, ...d.data()}))));
          return () => { unsubSellers(); unsubCustomers(); };
      }
  }, [user]);

  const totals = useMemo(() => {
    const sub = invData.items.reduce((s, i) => s + (i.qty * i.price), 0);
    const afterDisc = sub - Number(invData.discount);
    const vat = afterDisc * 0.07;
    return { sub, afterDisc, vat, total: afterDisc + vat };
  }, [invData.items, invData.discount]);

  const handleSaveInvoice = async () => {
    if (!user) return;
    try {
      const sellerInfo = {
          sellerName: invData.sellerName,
          sellerAddress: invData.sellerAddress,
          sellerTaxId: invData.sellerTaxId,
          sellerBranchId: invData.sellerBranchId,
          sellerPhone: invData.sellerPhone,
          sellerEmail: invData.sellerEmail,
          sellerSubDistrict: invData.sellerSubDistrict,
          sellerDistrict: invData.sellerDistrict,
          sellerProvince: invData.sellerProvince,
          sellerZipCode: invData.sellerZipCode,
      };
      localStorage.setItem('merchant_seller_info', JSON.stringify(sellerInfo));

      const payload = { ...invData, ...totals, date: new Date(invData.date) };
      if (editingDocId) {
          await updateDoc(doc(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'invoices', editingDocId), { ...payload, updatedAt: serverTimestamp() });
          alert(`Updated Invoice ${invData.invNo}`);
      } else {
          await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'invoices'), { ...payload, createdAt: serverTimestamp() });
          alert(`Saved Invoice ${invData.invNo}`);
      }
      setMode('history'); setEditingDocId(null);
    } catch(e) { console.error(e); alert("Save failed"); }
  };

  const handleDownloadPDF = () => {
      const element = document.getElementById('invoice-preview-area');
      const opt = {
          margin: 0,
          filename: `INV-${invData.invNo}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      if (!window.html2pdf) {
          const script = document.createElement('script');
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          script.onload = () => {
               window.html2pdf().set(opt).from(element).save();
          };
          document.body.appendChild(script);
      } else {
          window.html2pdf().set(opt).from(element).save();
      }
  };

  const handleNewInvoice = () => {
      const currentSavedSeller = JSON.parse(localStorage.getItem('merchant_seller_info') || '{}');
      setEditingDocId(null);
      setInvData({
          ...initialInvData,
          sellerName: currentSavedSeller.sellerName || initialInvData.sellerName,
          sellerAddress: currentSavedSeller.sellerAddress || initialInvData.sellerAddress,
          ...currentSavedSeller 
      });
      setMode('create');
  }

  const handleEditInvoice = (inv) => {
      setInvData({ ...inv, date: formatDateISO(inv.date) });
      setEditingDocId(inv.id);
      setMode('create');
  }

  const updateItem = (i, field, val) => {
    const newItems = [...invData.items];
    newItems[i][field] = val;
    setInvData({...invData, items: newItems});
  };

  const saveSellerProfile = async () => {
      if(!invData.sellerName) return alert("ระบุชื่อผู้ขาย");
      const profile = {
          sellerName: invData.sellerName, sellerAddress: invData.sellerAddress, sellerTaxId: invData.sellerTaxId, sellerBranchId: invData.sellerBranchId, sellerPhone: invData.sellerPhone, sellerEmail: invData.sellerEmail, sellerSubDistrict: invData.sellerSubDistrict, sellerDistrict: invData.sellerDistrict, sellerProvince: invData.sellerProvince, sellerZipCode: invData.sellerZipCode
      };
      await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'seller_profiles'), profile);
      alert("บันทึกข้อมูลผู้ขายเรียบร้อย");
  };

  const saveCustomerProfile = async () => {
      if(!invData.customerName) return alert("ระบุชื่อลูกค้า");
      const profile = {
          customerName: invData.customerName, address: invData.address, taxId: invData.taxId, branch: invData.branch, custSubDistrict: invData.custSubDistrict, custDistrict: invData.custDistrict, custProvince: invData.custProvince, custZipCode: invData.custZipCode, customerPhone: invData.customerPhone, customerEmail: invData.customerEmail
      };
      await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'customers'), profile);
      alert("บันทึกข้อมูลลูกค้าเรียบร้อย");
  };

  const selectSeller = (s) => {
      setInvData(prev => ({...prev, ...s}));
      setShowSellerModal(false);
  };

  const selectCustomer = (c) => {
      setInvData(prev => ({
          ...prev,
          customerName: c.customerName, address: c.address, taxId: c.taxId, branch: c.branch, custSubDistrict: c.custSubDistrict, custDistrict: c.custDistrict, custProvince: c.custProvince, custZipCode: c.custZipCode, customerPhone: c.customerPhone, customerEmail: c.customerEmail
      }));
      setShowCustomerModal(false);
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
        await deleteDoc(doc(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'invoices', deleteId));
        setDeleteId(null);
    } catch (err) {
        console.error("Error deleting invoice:", err);
        alert("เกิดข้อผิดพลาดในการลบ");
    } finally {
        setIsDeleting(false);
    }
  };

  const handleDeleteCustomer = async () => {
      if (!deleteCustomerId) return;
      setIsDeleting(true);
      try {
          await deleteDoc(doc(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'customers', deleteCustomerId));
          setDeleteCustomerId(null);
      } catch (e) { console.error(e); alert("ลบไม่สำเร็จ"); } finally { setIsDeleting(false); }
  };

  return (
    <div className="w-full flex flex-col gap-8 relative h-full">
      {/* Modals for Seller/Customer Selection */}
      {showSellerModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md h-[70vh] flex flex-col shadow-2xl animate-fadeIn">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg flex items-center gap-2"><Store className="text-indigo-500"/> จัดการข้อมูลผู้ขาย</h3>
                      <button onClick={()=>setShowSellerModal(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                      <button onClick={saveSellerProfile} className="w-full bg-indigo-600 text-white py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2"><Save size={16}/> บันทึกข้อมูลปัจจุบันเป็นโปรไฟล์ใหม่</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {sellerProfiles.map(s => (
                          <div key={s.id} onClick={()=>selectSeller(s)} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer transition-all">
                              <p className="font-bold text-slate-700">{s.sellerName}</p>
                              <p className="text-xs text-slate-400 mt-1">TAX: {s.sellerTaxId} ({s.sellerBranchId})</p>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
      {showCustomerModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md h-[70vh] flex flex-col shadow-2xl animate-fadeIn">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg flex items-center gap-2"><User className="text-rose-500"/> จัดการข้อมูลลูกค้า</h3>
                      <button onClick={()=>setShowCustomerModal(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                      <button onClick={saveCustomerProfile} className="w-full bg-rose-600 text-white py-2 rounded-xl font-bold text-sm hover:bg-rose-700 flex items-center justify-center gap-2"><Save size={16}/> บันทึกข้อมูลปัจจุบันเป็นลูกค้าใหม่</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {customers.map(c => (
                          <div key={c.id} className="p-4 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50 transition-all flex justify-between items-center group">
                              <div className="cursor-pointer flex-1" onClick={()=>selectCustomer(c)}>
                                  <p className="font-bold text-slate-700">{c.customerName}</p>
                                  <div className="flex gap-2 mt-1 items-center">
                                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold border border-indigo-100">สาขา {c.branch || '00000'}</span>
                                      <span className="text-xs text-slate-400 truncate max-w-[150px]">{c.address}</span>
                                  </div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setDeleteCustomerId(c.id); }} className="p-2 text-slate-300 hover:text-rose-500 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100">
                                  <Trash2 size={14}/>
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {deleteCustomerId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                <Trash2 size={48} className="mx-auto text-rose-500 mb-4 bg-rose-50 p-3 rounded-full"/>
                <h3 className="text-xl font-bold text-slate-800 mb-2">ลบลูกค้า?</h3>
                <p className="text-slate-500 mb-6 text-sm">ข้อมูลลูกค้าจะถูกลบถาวร</p>
                <div className="flex gap-3">
                    <button onClick={()=>setDeleteCustomerId(null)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200">ยกเลิก</button>
                    <button onClick={handleDeleteCustomer} disabled={isDeleting} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-200">{isDeleting?<Loader className="animate-spin mx-auto"/>:'ยืนยัน'}</button>
                </div>
            </div>
        </div>
      )}

      {deleteId && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl scale-100 animate-fadeIn"><Trash2 size={48} className="mx-auto text-rose-500 mb-4 bg-rose-50 p-3 rounded-full"/><h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการลบเอกสาร?</h3><p className="text-slate-500 mb-6">ข้อมูลนี้จะหายไปถาวร</p><div className="flex gap-3"><button onClick={()=>setDeleteId(null)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200">ยกเลิก</button><button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-200">{isDeleting?<Loader className="animate-spin mx-auto"/>:'ลบรายการ'}</button></div></div></div>}

      <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit print:hidden self-center">
         <button onClick={() => setMode('create')} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode==='create'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700'}`}><FileText size={18}/> ออกใบกำกับภาษี</button>
         <button onClick={() => setMode('history')} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode==='history'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700'}`}><History size={18}/> ประวัติเอกสาร</button>
      </div>

      {mode === 'history' ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-fadeIn">
           <h3 className="font-bold text-slate-700 mb-4 text-xl">Invoice History</h3>
           <div className="rounded-2xl border border-slate-100 overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs"><tr><th className="p-4">Date</th><th className="p-4">Inv No.</th><th className="p-4">Customer</th><th className="p-4 text-right">Total</th><th className="p-4 text-center">Action</th></tr></thead>
                 <tbody className="divide-y divide-slate-50">{invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-indigo-50/30">
                        <td className="p-4 text-slate-500 text-xs">{formatDate(inv.date)}</td>
                        <td className="p-4 text-indigo-600 font-bold">{inv.invNo}</td>
                        <td className="p-4">{inv.customerName}</td>
                        <td className="p-4 text-right font-bold">{formatCurrency(inv.total)}</td>
                        <td className="p-4 text-center">
                            <div className="flex justify-center gap-2">
                                <button onClick={() => handleEditInvoice(inv)} className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-100 transition-all flex items-center gap-1"><Edit size={12}/> Edit/Print</button>
                                <button onClick={()=>confirmDelete(inv.id)} className="text-slate-300 hover:text-rose-500 transition-colors bg-white border border-slate-200 p-1.5 rounded-lg"><Trash2 size={14}/></button>
                            </div>
                        </td>
                    </tr>))}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <>
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 print:hidden space-y-6">
              <div className="flex justify-between border-b border-slate-100 pb-4">
                 <div>
                    <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                       Invoice Editor {editingDocId && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">Editing Mode</span>}
                    </h3>
                    <p className="text-slate-400 text-sm">สร้างเอกสารใบกำกับภาษีถูกต้องตามกรมสรรพากร</p>
                 </div>
                 <div className="text-right flex flex-col items-end gap-2">
                    <button onClick={handleNewInvoice} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"><PlusCircle size={14}/> New Invoice</button>
                    <div><p className="text-xs text-slate-400 font-bold uppercase">DOC ID</p><p className="text-2xl font-bold text-indigo-600 font-mono">{invData.invNo}</p></div>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4 bg-slate-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-indigo-600">ข้อมูลผู้ขาย (Seller)</h4>
                        <button onClick={()=>setShowSellerModal(true)} className="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold hover:bg-indigo-200">จัดการผู้ขาย (Popup)</button>
                    </div>
                    <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">ชื่อผู้เสียภาษี</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm" placeholder="" value={invData.sellerName} onChange={e=>setInvData({...invData, sellerName: e.target.value})} /></div>
                    <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">ที่อยู่ (เลขที่, หมู่บ้าน, ถนน)</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm" placeholder="" value={invData.sellerAddress} onChange={e=>setInvData({...invData, sellerAddress: e.target.value})} /></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">แขวง/ตำบล</label><input className="w-full border-0 rounded-lg p-2 text-sm" value={invData.sellerSubDistrict} onChange={e=>setInvData({...invData, sellerSubDistrict: e.target.value})} /></div>
                        <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">เขต/อำเภอ</label><input className="w-full border-0 rounded-lg p-2 text-sm" value={invData.sellerDistrict} onChange={e=>setInvData({...invData, sellerDistrict: e.target.value})} /></div>
                        <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">จังหวัด</label><input className="w-full border-0 rounded-lg p-2 text-sm" value={invData.sellerProvince} onChange={e=>setInvData({...invData, sellerProvince: e.target.value})} /></div>
                        <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">รหัสไปรษณีย์</label><input className="w-full border-0 rounded-lg p-2 text-sm" value={invData.sellerZipCode} onChange={e=>setInvData({...invData, sellerZipCode: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">เลขผู้เสียภาษี</label><input className="w-full border-0 rounded-lg p-2 text-sm" value={invData.sellerTaxId} onChange={e=>setInvData({...invData, sellerTaxId: e.target.value})} /></div>
                        <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">สาขา (00000)</label><input className="w-full border-0 rounded-lg p-2 text-sm" value={invData.sellerBranchId} onChange={e=>setInvData({...invData, sellerBranchId: e.target.value})} /></div>
                    </div>
                 </div>

                 <div className="space-y-4 bg-slate-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-rose-600">ข้อมูลลูกค้า (Customer)</h4>
                        <button onClick={()=>setShowCustomerModal(true)} className="text-[10px] bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-bold hover:bg-rose-200">จัดการลูกค้า (Popup)</button>
                    </div>
                    <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">ชื่อลูกค้า / บริษัท</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm" value={invData.customerName} onChange={e=>setInvData({...invData, customerName: e.target.value})} /></div>
                    <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">ที่อยู่ (เลขที่, หมู่บ้าน, ถนน)</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm" value={invData.address} onChange={e=>setInvData({...invData, address: e.target.value})} /></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">แขวง/ตำบล</label><input className="w-full border-0 rounded-lg p-2 text-sm" value={invData.custSubDistrict} onChange={e=>setInvData({...invData, custSubDistrict: e.target.value})} /></div>
                        <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">เขต/อำเภอ</label><input className="w-full border-0 rounded-lg p-2 text-sm" value={invData.custDistrict} onChange={e=>setInvData({...invData, custDistrict: e.target.value})} /></div>
                        <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">จังหวัด</label><input className="w-full border-0 rounded-lg p-2 text-sm" value={invData.custProvince} onChange={e=>setInvData({...invData, custProvince: e.target.value})} /></div>
                        <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">รหัสไปรษณีย์</label><input className="w-full border-0 rounded-lg p-2 text-sm" value={invData.custZipCode} onChange={e=>setInvData({...invData, custZipCode: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">เลขผู้เสียภาษี</label><input className="w-full border-0 rounded-lg p-2 text-sm" value={invData.taxId} onChange={e=>setInvData({...invData, taxId: e.target.value})} /></div>
                        <div><label className="text-[10px] text-slate-500 font-bold mb-1 block">สาขา</label><input className="w-full border-0 rounded-lg p-2 text-sm" value={invData.branch} onChange={e=>setInvData({...invData, branch: e.target.value})} /></div>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl">
                 <h4 className="font-bold text-sm text-slate-600 mb-2">รายการสินค้า</h4>
                 {invData.items.map((it, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                        <span className="text-xs text-slate-400 w-4">{i+1}.</span>
                        <input className="flex-[3] border-0 rounded p-2 text-sm" value={it.desc} onChange={e=>updateItem(i,'desc',e.target.value)}/>
                        <input className="w-20 border-0 rounded p-2 text-sm text-center" type="number" value={it.qty} onChange={e=>updateItem(i,'qty',Number(e.target.value))}/>
                        <input className="w-24 border-0 rounded p-2 text-sm text-right" type="number" value={it.price} onChange={e=>updateItem(i,'price',Number(e.target.value))}/>
                        <button onClick={()=>setInvData({...invData, items: invData.items.filter((_,idx)=>idx!==i)})} className="text-rose-400"><Trash2 size={16}/></button>
                    </div>
                 ))}
                 <button onClick={()=>setInvData({...invData, items:[...invData.items, {desc:'', qty:1, unit:'ชิ้น', price:0}]})} className="mt-2 text-xs bg-indigo-600 text-white px-3 py-1 rounded flex items-center gap-1 w-fit"><PlusCircle size={14}/> เพิ่มรายการ</button>
                 <div className="flex justify-end mt-4 border-t border-slate-200 pt-3">
                    <div className="w-full max-w-[200px]">
                        <label className="text-xs font-bold text-slate-500 block mb-1 text-right">ส่วนลดท้ายบิล (บาท)</label>
                        <input type="number" className="w-full border-0 rounded-lg p-2 text-right font-bold text-rose-500 bg-white ring-1 ring-rose-100 focus:ring-rose-300" placeholder="0.00" value={invData.discount} onChange={e => setInvData({ ...invData, discount: Number(e.target.value) })} />
                    </div>
                 </div>
              </div>
              
              <div className="flex justify-between items-center bg-slate-100 p-2 rounded-lg">
                 <div className="flex gap-2">
                    <button onClick={() => setDocTypeStatus('original')} className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${docTypeStatus==='original' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>ต้นฉบับ (Original)</button>
                    <button onClick={() => setDocTypeStatus('copy')} className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${docTypeStatus==='copy' ? 'bg-white shadow text-slate-600' : 'text-slate-500'}`}>สำเนา (Copy)</button>
                 </div>
              </div>

              <div className="flex gap-4">
                  <button onClick={handleSaveInvoice} className={`flex-1 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${editingDocId ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}>
                      <Save size={18}/> {editingDocId ? 'Update' : 'Save'}
                  </button>
                  <button onClick={handleDownloadPDF} className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-slate-300 transition-all"><Download size={18}/> Download PDF</button>
              </div>
          </div>
          
          <div className="overflow-x-auto pb-10 flex justify-center print:p-0 print:absolute print:left-0 print:top-0 print:w-full print:h-full print:z-50 print:bg-white">
            {/* --- INVOICE TEMPLATE PREVIEW --- */}
            <div id="invoice-preview-area" className="shadow-2xl print:shadow-none bg-white p-[30px] w-[210mm] min-h-[296mm] text-sm font-sarabun text-slate-900 leading-relaxed relative box-border">
                <div className="flex justify-between items-start mb-6">
                   <div className="w-[60%]">
                       <h2 className="text-2xl font-bold text-slate-900 mb-2">{invData.sellerName}</h2>
                       <p className="text-slate-600 text-sm leading-loose mb-2 whitespace-pre-wrap">
                           {[invData.sellerAddress, invData.sellerSubDistrict ? `ต.${invData.sellerSubDistrict}` : ''].filter(Boolean).join(' ')}<br/>
                           {[invData.sellerDistrict ? `อ.${invData.sellerDistrict}` : '', invData.sellerProvince ? `จ.${invData.sellerProvince}` : '', invData.sellerZipCode].filter(Boolean).join(' ')}
                       </p>
                       <div className="text-sm text-slate-700">
                           <p><b>เลขประจำตัวผู้เสียภาษี:</b> {invData.sellerTaxId} <b>สาขาที่:</b> {invData.sellerBranchId}</p>
                           <p><b>โทร:</b> {invData.sellerPhone} {invData.sellerEmail && <><b>Email:</b> {invData.sellerEmail}</>}</p>
                       </div>
                   </div>
                   <div className="text-right w-[40%] flex flex-col items-end">
                       <div className="text-lg font-bold uppercase mb-1">{invData.docType}</div>
                       <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">TAX INVOICE / RECEIPT</div>
                       <div className="border border-slate-300 p-2 w-full max-w-[200px]">
                           <div className="flex justify-between mb-1"><span className="font-bold text-slate-500 text-xs">เลขที่ (No.)</span><span className="font-bold">{invData.invNo}</span></div>
                           <div className="flex justify-between"><span className="font-bold text-slate-500 text-xs">วันที่ (Date)</span><span>{formatDate(invData.date)}</span></div>
                       </div>
                       <div className="mt-2 text-right">
                           <span className={`px-3 py-1 border rounded text-xs font-bold uppercase ${docTypeStatus === 'original' ? 'border-black text-black' : 'border-slate-300 text-slate-400'}`}>
                               {docTypeStatus === 'original' ? 'ต้นฉบับ (Original)' : 'สำเนา (Copy)'}
                           </span>
                       </div>
                   </div>
                </div>

                <div className="border border-slate-300 p-4 mb-4 flex gap-4">
                    <div className="flex-1">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">ลูกค้า (Customer)</div>
                        <p className="font-bold text-base mb-1">{invData.customerName}</p>
                        <p className="text-slate-600 text-sm leading-loose mb-2 whitespace-pre-wrap">
                            {[invData.address, invData.custSubDistrict ? `ต.${invData.custSubDistrict}` : ''].filter(Boolean).join(' ')}<br/>
                            {[invData.custDistrict ? `อ.${invData.custDistrict}` : '', invData.custProvince ? `จ.${invData.custProvince}` : '', invData.custZipCode].filter(Boolean).join(' ')}
                        </p>
                    </div>
                    <div className="w-[40%] border-l border-slate-200 pl-4 flex flex-col justify-center text-sm">
                        <div className="grid grid-cols-[80px_auto] gap-y-1">
                            <span className="font-bold text-slate-500">เลขผู้เสียภาษี</span><span>{invData.taxId}</span>
                            <span className="font-bold text-slate-500">สาขาที่</span><span>{invData.branch}</span>
                            <span className="font-bold text-slate-500">เบอร์โทร</span><span>{invData.customerPhone}</span>
                        </div>
                    </div>
                </div>

                <table className="w-full mb-6 border-collapse">
                    <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold text-xs uppercase text-center">
                            <th className="py-2 border-y border-slate-300 w-12">ลำดับ<br/>No.</th>
                            <th className="py-2 border-y border-slate-300 text-left pl-4">รายการสินค้า / บริการ<br/>Description</th>
                            <th className="py-2 border-y border-slate-300 w-20">จำนวน<br/>Qty</th>
                            <th className="py-2 border-y border-slate-300 w-24">หน่วยละ<br/>Unit Price</th>
                            <th className="py-2 border-y border-slate-300 w-28">จำนวนเงิน<br/>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invData.items.map((it, i) => (
                            <tr key={i}>
                                <td className="py-2 border-b border-slate-200 text-center align-top">{i+1}</td>
                                <td className="py-2 border-b border-slate-200 pl-4 align-top">{it.desc}</td>
                                <td className="py-2 border-b border-slate-200 text-center align-top">{it.qty}</td>
                                <td className="py-2 border-b border-slate-200 text-right pr-2 align-top">{formatCurrency(it.price)}</td>
                                <td className="py-2 border-b border-slate-200 text-right pr-2 font-bold align-top">{formatCurrency(it.qty * it.price)}</td>
                            </tr>
                        ))}
                        {[...Array(Math.max(0, 8 - invData.items.length))].map((_, i) => (
                            <tr key={`empty-${i}`} className="h-8">
                                <td className="border-b border-slate-100"></td><td className="border-b border-slate-100"></td><td className="border-b border-slate-100"></td><td className="border-b border-slate-100"></td><td className="border-b border-slate-100"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-between items-start mb-8">
                   <div className="w-[55%] pr-4 flex flex-col justify-between h-full gap-4">
                       <div>
                           <div className="text-xs font-bold text-slate-500 mb-1">จำนวนเงินตัวอักษร (Amount in Words)</div>
                           <div className="bg-slate-100 p-2 text-center font-bold italic border border-slate-200 rounded">({thaiBahtText(totals.total)})</div>
                       </div>
                       <div className="text-xs text-slate-500">
                           <b>หมายเหตุ (Notes):</b> {invData.notes}
                       </div>
                   </div>
                   <div className="w-[40%]">
                       <div className="grid grid-cols-[auto_auto] gap-y-2 text-right text-sm">
                           <span className="font-bold text-slate-600">รวมเป็นเงิน</span><span className="font-medium">{formatCurrency(totals.sub)}</span>
                           {invData.discount > 0 && <><span className="font-bold text-rose-600">หักส่วนลด</span><span className="text-rose-600">-{formatCurrency(invData.discount)}</span></>}
                           <span className="font-bold text-slate-600">จำนวนเงินหลังหักส่วนลด</span><span className="font-medium">{formatCurrency(totals.afterDisc)}</span>
                           <span className="font-bold text-slate-600">ภาษีมูลค่าเพิ่ม 7%</span><span className="font-medium">{formatCurrency(totals.vat)}</span>
                           <div className="col-span-2 border-t border-black my-1"></div>
                           <span className="font-bold text-slate-900 text-lg">จำนวนเงินทั้งสิ้น</span><span className="font-bold text-slate-900 text-lg">{formatCurrency(totals.total)}</span>
                           <div className="col-span-2 border-t-2 border-black my-0.5"></div>
                       </div>
                   </div>
                </div>

                <div className="flex justify-between mt-12 px-8 absolute bottom-10 w-[calc(100%-60px)]">
                    <div className="text-center w-[40%]">
                        <div className="border-b border-dotted border-slate-400 h-8 mb-2"></div>
                        <p className="text-xs font-bold">ผู้รับวางบิล / ผู้รับของ</p>
                        <p className="text-xs font-bold text-slate-400 uppercase">(Receiver Signature)</p>
                        <p className="text-xs mt-4">วันที่ ______/______/______</p>
                    </div>
                    <div className="text-center w-[40%]">
                        <div className="border-b border-dotted border-slate-400 h-8 mb-2"></div>
                        <p className="text-xs font-bold">ผู้รับเงิน / ผู้ออกใบกำกับภาษี</p>
                        <p className="text-[10px] text-slate-400 uppercase">(Authorized Signature)</p>
                        <p className="text-xs mt-4">วันที่ ______/______/______</p>
                    </div>
                </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Feature 4: TaxReport (UPGRADED)
const TaxReport = ({ transactions }) => {
  const [activeSubTab, setActiveSubTab] = useState('assessment');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [taxQuestion, setTaxQuestion] = useState("");
  const [taxAnswer, setTaxAnswer] = useState("");
  const [isTaxLoading, setIsTaxLoading] = useState(false);
  const [vatTab, setVatTab] = useState('sales');

  const [bizName, setBizName] = useState('');
  const [bizTaxId, setBizTaxId] = useState('');
  const [bizBranch, setBizBranch] = useState('00000');
  const [bizAddress, setBizAddress] = useState('');

  // --- NEW STATE FOR DEDUCTIONS ---
  const [deductions, setDeductions] = useState({
      personal: 60000,
      socialSecurity: 0,
      lifeInsurance: 0,
      family: 0,
      shopAndPay: 0,
      rmf_ssf: 0
  });
  const [showDeductionModal, setShowDeductionModal] = useState(false);

  const assessmentData = useMemo(() => {
    const yearlyTrans = transactions.filter(t => normalizeDate(t.date).getFullYear() === year);
    const totalIncome = yearlyTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.total)||0), 0);
    const actualExpense = yearlyTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.total)||0), 0);
    
    // คำนวณลดหย่อนรวม
    const totalDeductions = Object.values(deductions).reduce((a, b) => a + Number(b), 0);

    // 1. วิธีหักเหมา 60%
    const expenseStandard = totalIncome * 0.6;
    const netIncomeStandard = Math.max(0, totalIncome - expenseStandard - totalDeductions);
    const taxStandard = calculateProgressiveTax(netIncomeStandard);

    // 2. วิธีหักตามจริง
    const netIncomeActual = Math.max(0, totalIncome - actualExpense - totalDeductions);
    const taxActual = calculateProgressiveTax(netIncomeActual);

    const recommendedMethod = taxStandard < taxActual ? 'standard' : 'actual';
    const savedAmount = Math.abs(taxStandard - taxActual);

    return { totalIncome, actualExpense, expenseStandard, netIncomeStandard, netIncomeActual, taxStandard, taxActual, recommendedMethod, savedAmount, totalDeductions };
  }, [transactions, year, deductions]);

  const monthlyVat = useMemo(() => {
    const filtered = transactions.filter(t => { const d = normalizeDate(t.date); return d.getFullYear() === year && d.getMonth() === month; });
    const salesTax = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.vat)||0), 0);
    const purchaseTax = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.vat)||0), 0);
    return { filtered, salesTax, purchaseTax, remit: salesTax - purchaseTax };
  }, [transactions, year, month]);

  const exportVATReport = (type) => {
    const isSales = type === 'sales';
    const relevantTrans = monthlyVat.filtered.filter(t => t.type === (isSales ? 'income' : 'expense') && t.vatType !== 'none');
    const monthNames = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    const monthName = monthNames[month];

    const data = [
        [`รายงานภาษี${isSales ? 'ขาย' : 'ซื้อ'}`],
        [`เดือนภาษี ${monthName} ปีภาษี ${year}`],
        [`ชื่อผู้ประกอบการ: ${bizName || '-'}`, `เลขประจำตัวผู้เสียภาษี: ${bizTaxId || '-'}`],
        [`ชื่อสถานประกอบการ/ที่อยู่: ${bizAddress || '-'}`],
        [`สำนักงานใหญ่/สาขาที่: ${bizBranch || '00000'}`],
        [],
        ['ลำดับ', 'วันเดือนปี', 'เลขที่ใบกำกับภาษี', 'รายการ', 'ชื่อผู้ซื้อ/ผู้ขาย', 'เลขประจำตัวผู้เสียภาษี', 'สาขา', 'มูลค่าสินค้า/บริการ', 'จำนวนภาษีมูลค่าเพิ่ม'],
        ...relevantTrans.map((t, index) => [
            index + 1, formatDate(t.date), t.taxInvoiceNo || (t.type === 'income' ? (t.orderId || t.id.slice(0,8)) : '-'), t.description || '', t.type === 'expense' ? (t.vendorName || '') : (t.channel || 'ลูกค้าทั่วไป'), t.type === 'expense' ? (t.vendorTaxId || '') : '', t.type === 'expense' ? (t.vendorBranch || '00000') : '00000', (t.net || 0), (t.vat || 0)
        ]),
        [],
        ['', '', '', '', '', '', 'รวม', relevantTrans.reduce((s,t) => s + (t.net||0), 0), relevantTrans.reduce((s,t) => s + (t.vat||0), 0)]
    ];
    exportToExcel(`รายงาน${isSales ? 'ภาษีขาย' : 'ภาษีซื้อ'}_${month+1}_${year}.xlsx`, data);
  };

  const handleAskTax = async () => {
    if (!taxQuestion.trim()) return;
    setIsTaxLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setTaxAnswer("สามารถนำใบกำกับภาษีเต็มรูปมาลดหย่อนได้ครับ หากมีการระบุชื่อและที่อยู่ครบถ้วน");
    setIsTaxLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">{['assessment', 'vat', 'wht', 'consult'].map(tab => (<button key={tab} onClick={()=>setActiveSubTab(tab)} className={`px-4 py-2 rounded-md text-sm font-bold capitalize transition-all ${activeSubTab===tab ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>{tab === 'wht' ? '50 ทวิ' : tab}</button>))}</div>
      
      {activeSubTab === 'consult' && (
         <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-8 text-white shadow-xl"><h3 className="text-2xl font-bold mb-2 flex items-center gap-2"><MessageSquare/> AI Tax Consultant</h3><p className="mb-6 opacity-90">สอบถามปัญหาภาษีกับ AI ผู้เชี่ยวชาญ</p><div className="flex gap-2 mb-6"><input className="flex-1 rounded-xl px-4 py-3 text-slate-800 border-0 focus:ring-2 focus:ring-orange-300" placeholder="พิมพ์คำถามที่นี่..." value={taxQuestion} onChange={e=>setTaxQuestion(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleAskTax()} /><button onClick={handleAskTax} disabled={isTaxLoading} className="bg-white text-orange-600 px-6 rounded-xl font-bold hover:bg-orange-50 disabled:opacity-50">{isTaxLoading ? <Loader className="animate-spin"/> : <Send/>}</button></div>{taxAnswer && <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20 animate-fadeIn leading-relaxed">{taxAnswer}</div>}</div>
      )}
      
      {activeSubTab === 'assessment' && (
         <div className="space-y-6 animate-fadeIn">
            {/* AI Recommendation Box */}
            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-yellow-400 font-bold text-lg mb-1 flex items-center gap-2"><Sparkles size={20}/> AI Tax Recommendation</h3>
                    <p className="opacity-90">
                        ปี {year} นี้ ควรยื่นแบบ <strong>{assessmentData.recommendedMethod === 'standard' ? 'เหมา 60%' : 'ตามจริง (Itemized)'}</strong> 
                        <br/>ประหยัดภาษีได้ประมาณ <span className="text-green-400 font-bold underline">{formatCurrency(assessmentData.savedAmount)} บาท</span>
                    </p>
                </div>
                <div className="text-right bg-white/10 p-4 rounded-xl backdrop-blur-sm min-w-[200px]">
                    <p className="text-xs text-slate-300 uppercase">ประมาณการภาษีที่ต้องจ่าย</p>
                    <p className="text-3xl font-bold text-white">{formatCurrency(assessmentData.recommendedMethod === 'standard' ? assessmentData.taxStandard : assessmentData.taxActual)}</p>
                </div>
            </div>

            {/* Deduction Section */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={20}/></div>
                    <div>
                        <h4 className="font-bold text-slate-700">ค่าลดหย่อน (Deductions)</h4>
                        <p className="text-xs text-slate-400">ระบุค่าลดหย่อนส่วนตัว ประกัน และครอบครัว</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <p className="font-bold text-slate-700 text-lg">{formatCurrency(assessmentData.totalDeductions)}</p>
                    <button onClick={() => setShowDeductionModal(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold transition-all">แก้ไข</button>
                </div>
            </div>

            {/* Deduction Modal */}
            {showDeductionModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">ตั้งค่าค่าลดหย่อน</h3>
                            <button onClick={()=>setShowDeductionModal(false)}><X className="text-slate-400"/></button>
                        </div>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            <div><label className="text-xs font-bold text-slate-500">ลดหย่อนส่วนตัว (มาตรฐาน 60,000)</label><input type="number" className="w-full bg-slate-50 border-0 rounded-lg p-2 mt-1" value={deductions.personal} onChange={e=>setDeductions({...deductions, personal: Number(e.target.value)})}/></div>
                            <div><label className="text-xs font-bold text-slate-500">ประกันสังคม (สูงสุด 9,000)</label><input type="number" className="w-full bg-slate-50 border-0 rounded-lg p-2 mt-1" value={deductions.socialSecurity} onChange={e=>setDeductions({...deductions, socialSecurity: Number(e.target.value)})}/></div>
                            <div><label className="text-xs font-bold text-slate-500">เบี้ยประกันชีวิต/สุขภาพ (สูงสุด 100,000)</label><input type="number" className="w-full bg-slate-50 border-0 rounded-lg p-2 mt-1" value={deductions.lifeInsurance} onChange={e=>setDeductions({...deductions, lifeInsurance: Number(e.target.value)})}/></div>
                            <div><label className="text-xs font-bold text-slate-500">คู่สมรส/บุตร/บิดามารดา</label><input type="number" className="w-full bg-slate-50 border-0 rounded-lg p-2 mt-1" value={deductions.family} onChange={e=>setDeductions({...deductions, family: Number(e.target.value)})}/></div>
                            <div><label className="text-xs font-bold text-slate-500">กองทุน (SSF/RMF)</label><input type="number" className="w-full bg-slate-50 border-0 rounded-lg p-2 mt-1" value={deductions.rmf_ssf} onChange={e=>setDeductions({...deductions, rmf_ssf: Number(e.target.value)})}/></div>
                        </div>
                        <button onClick={()=>setShowDeductionModal(false)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-6">บันทึก</button>
                    </div>
                </div>
            )}

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className={`p-6 rounded-2xl border-2 bg-white ${assessmentData.recommendedMethod === 'standard' ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-transparent'}`}>
                   <h4 className="font-bold text-slate-700 mb-4 flex justify-between">แบบเหมา 60% {assessmentData.recommendedMethod === 'standard' && <CheckCircle className="text-emerald-500"/>}</h4>
                   <div className="space-y-3 text-sm">
                       <div className="flex justify-between"><span>รายได้ (Income)</span><span className="font-bold">{formatCurrency(assessmentData.totalIncome)}</span></div>
                       <div className="flex justify-between text-slate-400"><span>หักค่าใช้จ่าย (60%)</span><span>-{formatCurrency(assessmentData.expenseStandard)}</span></div>
                       <div className="flex justify-between text-slate-400"><span>หักค่าลดหย่อน</span><span>-{formatCurrency(assessmentData.totalDeductions)}</span></div>
                       <div className="flex justify-between font-bold text-indigo-600"><span>เงินได้สุทธิ</span><span>{formatCurrency(assessmentData.netIncomeStandard)}</span></div>
                       <div className="flex justify-between border-t pt-2 mt-2"><span>ภาษีที่ต้องจ่าย</span><span className="text-2xl font-bold text-slate-800">{formatCurrency(assessmentData.taxStandard)}</span></div>
                   </div>
               </div>
               <div className={`p-6 rounded-2xl border-2 bg-white ${assessmentData.recommendedMethod === 'actual' ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-transparent'}`}>
                   <h4 className="font-bold text-slate-700 mb-4 flex justify-between">แบบตามจริง (Itemized) {assessmentData.recommendedMethod === 'actual' && <CheckCircle className="text-emerald-500"/>}</h4>
                   <div className="space-y-3 text-sm">
                       <div className="flex justify-between"><span>รายได้ (Income)</span><span className="font-bold">{formatCurrency(assessmentData.totalIncome)}</span></div>
                       <div className="flex justify-between text-slate-400"><span>หักค่าใช้จ่ายจริง</span><span>-{formatCurrency(assessmentData.actualExpense)}</span></div>
                       <div className="flex justify-between text-slate-400"><span>หักค่าลดหย่อน</span><span>-{formatCurrency(assessmentData.totalDeductions)}</span></div>
                       <div className="flex justify-between font-bold text-indigo-600"><span>เงินได้สุทธิ</span><span>{formatCurrency(assessmentData.netIncomeActual)}</span></div>
                       <div className="flex justify-between border-t pt-2 mt-2"><span>ภาษีที่ต้องจ่าย</span><span className="text-2xl font-bold text-slate-800">{formatCurrency(assessmentData.taxActual)}</span></div>
                   </div>
               </div>
            </div>
         </div>
      )}
      
      {activeSubTab === 'wht' && (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 text-xl mb-4 flex items-center gap-2">
                    <FileText className="text-purple-500"/> รายการหัก ณ ที่จ่าย (50 ทวิ)
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-purple-50 text-purple-700 font-bold uppercase text-xs">
                            <tr><th className="p-4 rounded-l-xl">วันที่</th><th className="p-4">ผู้ถูกหักภาษี</th><th className="p-4 text-right">ยอดเงินได้</th><th className="p-4 text-right">ภาษีที่หัก</th><th className="p-4 text-center rounded-r-xl">เอกสาร</th></tr>
                        </thead>
                        <tbody className="divide-y divide-purple-50">
                            {transactions.filter(t => t.type === 'expense' && t.wht > 0).map(t => (
                                <tr key={t.id} className="hover:bg-purple-50/50 transition-colors">
                                    <td className="p-4">{formatDate(t.date)}</td>
                                    <td className="p-4 font-medium text-slate-700">{t.vendorName} <span className="text-xs text-slate-400 ml-1">({t.vendorTaxId || '-'})</span></td>
                                    <td className="p-4 text-right">{formatCurrency(t.net)}</td>
                                    <td className="p-4 text-right font-bold text-purple-600">{formatCurrency(t.wht)}</td>
                                    <td className="p-4 text-center"><button className="text-xs bg-white border border-purple-200 text-purple-600 px-3 py-1 rounded-lg hover:bg-purple-50 font-bold shadow-sm transition-all" onClick={() => alert("ระบบสร้าง PDF 50 ทวิ กำลังพัฒนา")}>Print 50 ทวิ</button></td>
                                </tr>
                            ))}
                            {transactions.filter(t => t.type === 'expense' && t.wht > 0).length === 0 && (<tr><td colSpan="5" className="p-8 text-center text-slate-400">ไม่พบรายการหัก ณ ที่จ่าย</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {activeSubTab === 'vat' && (
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-fadeIn">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-700">VAT Summary (ภ.พ.30)</h3><div className="flex gap-2"><select value={month} onChange={e=>setMonth(Number(e.target.value))} className="bg-slate-50 border-0 rounded p-2 text-sm font-bold">{['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'].map((m,i)=><option key={i} value={i}>{m}</option>)}</select><select value={year} onChange={e=>setYear(Number(e.target.value))} className="bg-slate-50 border-0 rounded p-2 text-sm font-bold"><option value={2024}>2024</option><option value={2025}>2025</option><option value={2026}>2026</option></select></div></div>
            <div className="grid grid-cols-3 gap-4 text-center mb-8"><div className="p-4 bg-emerald-50 rounded-xl"><p className="text-xs text-emerald-600 font-bold uppercase">ภาษีขาย</p><p className="text-xl font-bold text-emerald-700">{formatCurrency(monthlyVat.salesTax)}</p></div><div className="p-4 bg-rose-50 rounded-xl"><p className="text-xs text-rose-600 font-bold uppercase">ภาษีซื้อ</p><p className="text-xl font-bold text-rose-700">{formatCurrency(monthlyVat.purchaseTax)}</p></div><div className="p-4 bg-indigo-50 rounded-xl"><p className="text-xs text-indigo-600 font-bold uppercase">นำส่งสุทธิ</p><p className="text-xl font-bold text-indigo-700">{formatCurrency(monthlyVat.remit)}</p></div></div>
            <div className="border-t border-slate-100 pt-6">
               <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
                  <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold"><Settings size={18}/> ตั้งค่าหัวกระดาษรายงาน (Report Header)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <input className="border border-slate-300 rounded p-2 text-sm" placeholder="ชื่อผู้ประกอบการ (ร้านค้า)" value={bizName} onChange={e=>setBizName(e.target.value)}/>
                     <input className="border border-slate-300 rounded p-2 text-sm" placeholder="เลขประจำตัวผู้เสียภาษี (13 หลัก)" value={bizTaxId} onChange={e=>setBizTaxId(e.target.value)}/>
                     <input className="border border-slate-300 rounded p-2 text-sm md:col-span-2" placeholder="ที่อยู่สถานประกอบการ" value={bizAddress} onChange={e=>setBizAddress(e.target.value)}/>
                     <input className="border border-slate-300 rounded p-2 text-sm" placeholder="สาขา (เช่น 00000)" value={bizBranch} onChange={e=>setBizBranch(e.target.value)}/>
                  </div>
               </div>
               <div className="flex justify-between items-center mb-4">
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                     <button onClick={()=>setVatTab('sales')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${vatTab==='sales'?'bg-white shadow text-emerald-600':'text-slate-500'}`}>รายงานภาษีขาย</button>
                     <button onClick={()=>setVatTab('purchase')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${vatTab==='purchase'?'bg-white shadow text-rose-600':'text-slate-500'}`}>รายงานภาษีซื้อ</button>
                  </div>
                  <button onClick={() => exportVATReport(vatTab)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm transition-all"><FileText size={16}/> Export Excel</button>
               </div>
               <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                     <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase"><tr><th className="p-3">วันที่</th><th className="p-3">เลขที่ใบกำกับ</th><th className="p-3">รายการ</th><th className="p-3 text-right">มูลค่า</th><th className="p-3 text-right">VAT</th><th className="p-3 text-right">รวม</th></tr></thead>
                     <tbody className="divide-y divide-slate-50">
                        {monthlyVat.filtered.filter(t => t.type === (vatTab === 'sales' ? 'income' : 'expense') && t.vatType !== 'none').map(t => (
                           <tr key={t.id} className="hover:bg-slate-50">
                              <td className="p-3 text-xs">{formatDate(t.date)}</td>
                              <td className="p-3 text-xs font-mono">{t.taxInvoiceNo || (t.type === 'income' ? (t.orderId || '-') : '-')}</td>
                              <td className="p-3 text-xs truncate max-w-[150px]">{t.description}</td>
                              <td className="p-3 text-right">{formatCurrency(t.net)}</td>
                              <td className={`p-3 text-right font-bold ${vatTab==='sales'?'text-emerald-600':'text-rose-600'}`}>{formatCurrency(t.vat)}</td>
                              <td className="p-3 text-right font-bold">{formatCurrency(t.total)}</td>
                           </tr>
                        ))}
                        {monthlyVat.filtered.filter(t => t.type === (vatTab === 'sales' ? 'income' : 'expense') && t.vatType !== 'none').length === 0 && (
                           <tr><td colSpan="6" className="p-8 text-center text-slate-400">ไม่พบรายการภาษีในเดือนนี้</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

// --- Root App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (error) { console.error("Auth Failed", error); } };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const qTrans = query(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'transactions'));
        const unsubTrans = onSnapshot(qTrans, (snapshot) => { setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: normalizeDate(doc.data().date) })).sort((a, b) => b.date - a.date)); }, (error) => console.error("Trans Sync Error:", error));
        const qInv = query(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'invoices'));
        const unsubInv = onSnapshot(qInv, (snapshot) => { setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: normalizeDate(doc.data().date) })).sort((a, b) => b.invNo > a.invNo ? -1 : 1)); setLoading(false); }, (error) => console.error("Inv Sync Error:", error));
        return () => { unsubTrans(); unsubInv(); };
      } else { setLoading(false); }
    });
    return () => unsubscribeAuth();
  }, []);

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard transactions={transactions} />;
      case 'records': return <RecordManager user={user} transactions={transactions} />;
      case 'invoice': return <InvoiceGenerator user={user} invoices={invoices} />;
      case 'stock': return <StockManager user={user} />;
      case 'taxes': return <TaxReport transactions={transactions} />;
      default: return <Dashboard transactions={transactions} />;
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex h-[100dvh] bg-slate-50 font-sans text-slate-800 overflow-hidden font-sarabun selection:bg-indigo-100 selection:text-indigo-900">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap'); .font-sarabun { font-family: 'Sarabun', sans-serif !important; } ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; } ::-webkit-scrollbar-thumb:hover { background: #94a3b8; } @media print { body * { visibility: hidden; } #invoice-preview-area, #invoice-preview-area * { visibility: visible; } #invoice-preview-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; transform: scale(1); } @page { size: auto; margin: 0mm; } .no-print { display: none !important; } }`}</style>
      {sidebarOpen && (<div className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)}></div>)}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white shadow-2xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800"><div><h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-2"><Wallet className="text-indigo-400"/> MerchantTax</h1><p className="text-[10px] text-slate-400 mt-1 tracking-wider uppercase">Pro Accounting System</p></div><button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X size={20} /></button></div>
        <nav className="p-4 space-y-1 mt-2 flex-1 overflow-y-auto">
          <NavButton active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setSidebarOpen(false);}} icon={<BarChart3 size={20} />} label="ภาพรวมธุรกิจ (Dashboard)" />
          <NavButton active={activeTab === 'records'} onClick={() => {setActiveTab('records'); setSidebarOpen(false);}} icon={<FileText size={20} />} label="บันทึกรายรับ-รายจ่าย" />
          <NavButton active={activeTab === 'stock'} onClick={() => {setActiveTab('stock'); setSidebarOpen(false);}} icon={<Package size={20} />} label="Stock (รายงานสินค้า)" />
          <NavButton active={activeTab === 'invoice'} onClick={() => {setActiveTab('invoice'); setSidebarOpen(false);}} icon={<Printer size={20} />} label="ออกใบกำกับภาษี" />
          <NavButton active={activeTab === 'taxes'} onClick={() => {setActiveTab('taxes'); setSidebarOpen(false);}} icon={<Calculator size={20} />} label="ภาษีและ 50 ทวิ" />
        </nav>
        <div className="p-6 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">{user?.uid?.slice(0,1).toUpperCase() || 'G'}</div><div className="overflow-hidden"><p className="text-sm font-medium text-slate-200 truncate">Shop ID: {CONSTANTS.APP_ID}</p><p className="text-xs text-green-400 truncate flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online Sync</p></div></div></div>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 p-4 lg:px-8 flex justify-between items-center z-10 sticky top-0">
          <div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-indigo-600 p-1 rounded-md hover:bg-slate-100 transition-colors"><Menu size={24} /></button><h2 className="font-semibold text-slate-800 text-lg flex items-center gap-2 truncate">{activeTab === 'dashboard' && <><BarChart3 className="text-indigo-500 hidden sm:block" size={20}/> Business Intelligence</>}{activeTab === 'records' && <><FileText className="text-emerald-500 hidden sm:block" size={20}/> Accounting Records</>}{activeTab === 'stock' && <><Package className="text-orange-500 hidden sm:block" size={20}/> Inventory & Stock</>}{activeTab === 'invoice' && <><Printer className="text-blue-500 hidden sm:block" size={20}/> Invoice Generator</>}{activeTab === 'taxes' && <><Calculator className="text-rose-500 hidden sm:block" size={20}/> Tax & Reporting</>}</h2></div>
          <div className="hidden sm:block text-xs text-slate-400 font-medium px-3 py-1 bg-slate-100 rounded-full border border-slate-200">v3.5.0 (Pro)</div>
        </header>
        <div className="flex-1 overflow-auto p-2 lg:p-6 relative scroll-smooth w-full">{renderContent()}</div>
      </main>
    </div>
  );
}
