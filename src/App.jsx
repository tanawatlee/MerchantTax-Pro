import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PieChart, Wallet, FileText, Calculator, Save, TrendingUp, TrendingDown, 
  AlertCircle, Download, Trash2, Edit, Menu, X, BrainCircuit, Printer, 
  CheckCircle, FileSpreadsheet, Camera, Sparkles, Loader, Filter, 
  Calendar, ChevronDown, BarChart3, Target, User, MapPin, Hash, DollarSign, Store,
  CreditCard, Package, History, Search, FileCheck, FileDown, Phone, Mail, ArrowUpRight, ArrowDownRight, Wand2, Landmark, MessageSquare, Send, Copy, AlertTriangle, Info, Users, Clock, List, BookOpen, Settings
} from 'lucide-react';

// --- Import Firebase ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

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
    EXPENSE: ['ค่าใช้จ่ายทั่วไป', 'ต้นทุนสินค้า', 'ค่าโฆษณา (ในประเทศ)', 'ค่าโฆษณา (ภ.พ.36)', 'ค่าธรรมเนียม Platform', 'ค่าขนส่ง', 'ค่าเช่า', 'เงินเดือน', 'ภาษี/เบี้ยปรับ']
  },
  CHANNELS: ['Shopee', 'Lazada', 'TikTok', 'Line Shopping', 'Facebook', 'หน้าร้าน'],
  VAT_RATES: {
    INCLUDED: 'included',
    EXCLUDED: 'excluded',
    NONE: 'none'
  }
};

// --- Firebase Initialization ---
const app = initializeApp(FIREBASE_CONFIG);
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

// --- Service Layer: API Calls ---
const GeminiService = {
  call: async (prompt, imageBase64 = null) => {
    const apiKey = ""; // API Key handled by environment
    if (!apiKey) { console.warn("Gemini API Key missing"); return null; }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const parts = [{ text: prompt }];
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
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      } catch (error) {
        if (i === maxRetries - 1) return null;
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
      }
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
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", trendBg: "bg-emerald-100", trendText: "text-emerald-700" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", trendBg: "bg-rose-100", trendText: "text-rose-700" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", trendBg: "bg-indigo-100", trendText: "text-indigo-700" }
  };
  const currentStyle = styles[color] || styles.indigo;

  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 border border-slate-100 relative overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
         <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <p className="text-slate-600 text-sm font-medium">{subtitle}</p>
         </div>
         <div className={`p-3 rounded-2xl ${currentStyle.bg} ${currentStyle.text}`}>{icon}</div>
      </div>
      <h3 className={`text-3xl md:text-4xl font-bold ${currentStyle.text} mb-2 tracking-tight`}>{formatCurrency(value)}</h3>
      <div className="flex items-center gap-2 text-xs font-medium">
        {trend !== undefined && (
          <span className={`px-2 py-1 rounded-lg flex items-center gap-1 ${trend >= 0 ? styles.emerald.trendBg + ' ' + styles.emerald.trendText : styles.rose.trendBg + ' ' + styles.rose.trendText}`}>
            {trend >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
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

// --- Features ---

// Feature 1: Dashboard
const Dashboard = ({ transactions }) => {
  const [aiAdvice, setAiAdvice] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analytics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const filterByDate = (items, m, y) => items.filter(t => {
      const d = normalizeDate(t.date);
      return d.getMonth() === m && d.getFullYear() === y;
    });

    const currentTrans = filterByDate(transactions, currentMonth, currentYear);
    const income = currentTrans.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.total)||0), 0);
    const expense = currentTrans.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.total)||0), 0);
    
    const prevTrans = filterByDate(transactions, prevMonth, prevMonthYear);
    const prevIncome = prevTrans.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.total)||0), 0);
    const incomeGrowth = prevIncome === 0 ? 100 : ((income - prevIncome) / prevIncome) * 100;

    const channelMap = {}; 
    currentTrans.filter(t => t.type === 'income').forEach(t => { 
      const ch = t.channel || 'อื่นๆ'; 
      channelMap[ch] = (channelMap[ch] || 0) + Number(t.total); 
    });
    const channels = Object.entries(channelMap).map(([name, value]) => ({ name, value, percent: income ? (value / income) * 100 : 0 })).sort((a, b) => b.value - a.value);

    const costMap = {}; 
    currentTrans.filter(t => t.type === 'expense').forEach(t => { 
      const cat = t.category || 'อื่นๆ'; 
      costMap[cat] = (costMap[cat] || 0) + Number(t.total); 
    });
    const costs = Object.entries(costMap).map(([name, value]) => ({ name, value, percent: expense ? (value / expense) * 100 : 0 })).sort((a, b) => b.value - a.value).slice(0, 5);

    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthTrans = filterByDate(transactions, m, y);
      trend.push({
        label: d.toLocaleDateString('th-TH', { month: 'short' }),
        income: monthTrans.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.total)||0), 0),
        expense: monthTrans.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.total)||0), 0)
      });
    }

    return { income, expense, profit: income - expense, incomeGrowth, channels, costs, trend };
  }, [transactions]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const summary = { income: analytics.income, growth: analytics.incomeGrowth.toFixed(1), topChannel: analytics.channels[0]?.name || 'None', topCost: analytics.costs[0]?.name || 'None' };
    const prompt = `Act as a Business Analyst for a Thai SME. Data: ${JSON.stringify(summary)}. Identify ONE critical insight and ONE actionable recommendation. Output in Thai language only. Keep it short.`;
    const result = await GeminiService.call(prompt);
    setAiAdvice(result || "ระบบไม่สามารถวิเคราะห์ได้ในขณะนี้ กรุณาลองใหม่ภายหลัง");
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 w-full max-w-[2400px] mx-auto pb-10 animate-fadeIn">
      {/* 2xl:grid-cols-4 for extra large screens */}
      <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Revenue" subtitle="ยอดขายเดือนนี้" value={analytics.income} trend={analytics.incomeGrowth} color="emerald" icon={<TrendingUp />} />
        <StatCard title="Total Expenses" subtitle="รายจ่ายเดือนนี้" value={analytics.expense} color="rose" icon={<TrendingDown />} />
        <StatCard title="Net Profit" subtitle="กำไรสุทธิ" value={analytics.profit} color="indigo" icon={<Wallet />} subText={`Margin: ${analytics.income > 0 ? ((analytics.profit/analytics.income)*100).toFixed(1) : 0}%`} />
        {/* Extra Card for 2xl screens, maybe Average Daily Sales or something else in future */}
        <div className="hidden 2xl:block bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                   <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">AI INSIGHT</p>
                   <p className="text-sm leading-snug">{aiAdvice || "กดปุ่ม AI เพื่อวิเคราะห์ข้อมูล"}</p>
                </div>
                <button onClick={handleAnalyze} disabled={isAnalyzing} className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white text-xs py-2 rounded-lg backdrop-blur-sm transition-all flex items-center justify-center gap-2">
                   {isAnalyzing ? <Loader size={12} className="animate-spin"/> : <BrainCircuit size={14}/>} วิเคราะห์
                </button>
            </div>
            <Sparkles className="absolute -bottom-4 -right-4 text-white/10 w-24 h-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="xl:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full">
          <div className="flex justify-between items-center mb-8"><h3 className="font-bold text-slate-700 text-lg flex items-center gap-2"><BarChart3 className="text-indigo-500"/> Financial Trend</h3></div>
          <div className="h-64 flex items-end justify-between gap-3 px-2">
            {analytics.trend.map((t, i) => {
              const maxVal = Math.max(...analytics.trend.map(d => Math.max(d.income, d.expense))) || 1;
              return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                   <div className="flex gap-1 items-end h-full w-full justify-center">
                      <div className="w-full md:w-8 bg-emerald-400 rounded-t-lg relative hover:bg-emerald-500 transition-all duration-300" style={{ height: `${Math.max(t.income / maxVal * 100, 2)}%` }}></div>
                      <div className="w-full md:w-8 bg-rose-400 rounded-t-lg relative hover:bg-rose-500 transition-all duration-300" style={{ height: `${Math.max(t.expense / maxVal * 100, 2)}%` }}></div>
                   </div>
                   <span className="text-[10px] md:text-xs font-medium text-slate-400">{t.label}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 text-lg"><Target className="text-purple-500"/> Top Channels</h3>
          <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
             {analytics.channels.map((ch, i) => (
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
               {analytics.costs.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-xl">
                     <div className="flex items-center gap-3"><div className={`w-2.5 h-2.5 rounded-full ${i===0?'bg-rose-500':i===1?'bg-orange-500':'bg-slate-300'}`}></div><span className="font-medium text-slate-600">{c.name}</span></div>
                     <span className="font-bold text-slate-700">{formatCurrency(c.value)}</span>
                  </div>
               ))}
            </div>
         </div>
         {/* Hide this on 2xl since we moved it to top row, or keep it differently */}
         <div className="xl:col-span-2 bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-900/20 group 2xl:hidden">
            <div className="relative z-10 h-full flex flex-col justify-between">
               <div><div className="flex items-center gap-3 mb-4"><div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm"><Sparkles className="text-yellow-300" /></div><h3 className="text-xl font-bold tracking-tight">AI Financial Analyst</h3></div>{aiAdvice ? <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-slate-200 leading-relaxed animate-fadeIn shadow-inner">{aiAdvice}</div> : <p className="text-indigo-200 text-sm leading-relaxed max-w-md">ให้ AI ช่วยวิเคราะห์ข้อมูลเชิงลึก หาความผิดปกติ และแนะนำกลยุทธ์จากข้อมูลจริงใน Dashboard ของคุณเพื่อเพิ่มผลกำไรสูงสุด</p>}</div>
               <button onClick={handleAnalyze} disabled={isAnalyzing} className="mt-8 w-fit bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-white/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">{isAnalyzing ? <Loader className="animate-spin" size={18}/> : <BrainCircuit size={18}/>} {isAnalyzing ? "Analyzing..." : "Generate AI Insight"}</button>
            </div>
         </div>
      </div>
    </div>
  );
};

// Feature 2: Record Manager
const RecordManager = ({ user, transactions }) => {
  const [subTab, setSubTab] = useState('new'); 
  const [histPeriod, setHistPeriod] = useState('month'); 
  const [histDate, setHistDate] = useState(new Date().toISOString().split('T')[0]);
  const [deleteId, setDeleteId] = useState(null); 
  const [isDeleting, setIsDeleting] = useState(false);
  const [recentSearch, setRecentSearch] = useState('');
  
  const [vendors, setVendors] = useState([]);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [deleteVendorId, setDeleteVendorId] = useState(null); 

  const initialForm = { 
    type: 'income', date: new Date().toISOString().split('T')[0], description: '', amount: '', vatType: 'included', whtRate: 0,
    channel: CONSTANTS.CHANNELS[0], orderId: '', category: CONSTANTS.CATEGORIES.INCOME[0], taxInvoiceNo: '', vendorName: '', vendorTaxId: '', vendorBranch: '00000',
    grossAmount: '', platformFee: ''
  };
  
  const [formData, setFormData] = useState(initialForm);
  const [filterType, setFilterType] = useState('all');
  const [magicPrompt, setMagicPrompt] = useState('');
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isEcommerceMode, setIsEcommerceMode] = useState(false);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'vendors'));
      const unsub = onSnapshot(q, (snap) => {
        setVendors(snap.docs.map(d => ({id: d.id, ...d.data()})));
      });
      return () => unsub();
    }
  }, [user]);

  useEffect(() => {
     if (formData.type === 'income' && ['Shopee', 'Lazada', 'TikTok'].includes(formData.channel)) {
        setIsEcommerceMode(true);
     } else {
        setIsEcommerceMode(false);
     }
  }, [formData.channel, formData.type]);

  useEffect(() => {
    if (isEcommerceMode && formData.grossAmount && formData.platformFee) {
        const net = parseFloat(formData.grossAmount) - parseFloat(formData.platformFee);
        setFormData(prev => ({ ...prev, amount: net }));
    }
  }, [formData.grossAmount, formData.platformFee, isEcommerceMode]);

  const calculated = useMemo(() => {
    const baseAmount = (isEcommerceMode && formData.grossAmount) ? parseFloat(formData.grossAmount) : (parseFloat(formData.amount) || 0);
    let net = 0, vat = 0;
    if (formData.vatType === 'included') { net = baseAmount * 100 / 107; vat = baseAmount - net; } 
    else if (formData.vatType === 'excluded') { net = baseAmount; vat = baseAmount * 0.07; } 
    else { net = baseAmount; vat = 0; }
    const wht = formData.type === 'expense' ? (net * formData.whtRate / 100) : 0;
    return { net, vat, total: formData.vatType === 'excluded' ? net + vat : baseAmount, wht, baseAmount };
  }, [formData.amount, formData.vatType, formData.whtRate, formData.type, formData.grossAmount, isEcommerceMode]);
  
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!user) return;
    const dataToSave = { ...formData, ...calculated, total: parseFloat(formData.amount), date: new Date(formData.date), createdAt: serverTimestamp(), userId: user.uid };
    try {
      await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'transactions'), dataToSave);
      if (isEcommerceMode && formData.platformFee > 0) {
         await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'transactions'), {
            type: 'expense', date: new Date(formData.date), category: 'ค่าธรรมเนียม Platform', description: `ค่าธรรมเนียม ${formData.channel} (Order: ${formData.orderId})`, amount: parseFloat(formData.platformFee), vatType: 'included', total: parseFloat(formData.platformFee), net: parseFloat(formData.platformFee) * 100 / 107, vat: parseFloat(formData.platformFee) - (parseFloat(formData.platformFee) * 100 / 107), wht: 0, createdAt: serverTimestamp(), userId: user.uid
         });
      }
      setFormData(prev => ({ ...initialForm, type: prev.type, category: prev.category })); 
      alert(isEcommerceMode ? "บันทึกรายรับ (Gross) และค่าธรรมเนียม (Expense) เรียบร้อยแล้ว" : "บันทึกรายการสำเร็จ");
    } catch (error) { console.error("Save failed:", error); alert("บันทึกไม่สำเร็จ"); }
  };

  const handleSaveVendor = async () => {
    if (!formData.vendorName) return alert("กรุณาระบุชื่อผู้ขาย");
    const vendorData = {
        vendorName: formData.vendorName,
        vendorTaxId: formData.vendorTaxId,
        vendorBranch: formData.vendorBranch,
        updatedAt: serverTimestamp()
    };
    try {
        await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'vendors'), vendorData);
        alert("บันทึกข้อมูลผู้ขายเรียบร้อย");
    } catch (e) { console.error(e); alert("บันทึกไม่สำเร็จ"); }
  };

  const handleDeleteVendorClick = (id, e) => {
    e.stopPropagation();
    setDeleteVendorId(id);
  };

  const executeDeleteVendor = async () => {
      if (!deleteVendorId) return;
      setIsDeleting(true);
      try {
          await deleteDoc(doc(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'vendors', deleteVendorId));
          setDeleteVendorId(null);
      } catch (err) { console.error(err); alert("ลบไม่สำเร็จ"); } finally { setIsDeleting(false); }
  };

  const selectVendor = (vendor) => {
      setFormData(prev => ({
          ...prev,
          vendorName: vendor.vendorName || '',
          vendorTaxId: vendor.vendorTaxId || '',
          vendorBranch: vendor.vendorBranch || ''
      }));
      setShowVendorModal(false);
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
        await deleteDoc(doc(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'transactions', deleteId));
        setDeleteId(null);
    } catch (err) {
        console.error("Error deleting record:", err);
        alert("เกิดข้อผิดพลาดในการลบ");
    } finally {
        setIsDeleting(false);
    }
  };

  const filteredTransactions = transactions.filter(t => filterType === 'all' || t.type === filterType);

  const recentTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesSearch = t.description?.toLowerCase().includes(recentSearch.toLowerCase()) || 
                              (t.amount && t.amount.toString().includes(recentSearch));
        return matchesType && matchesSearch;
      })
      .sort((a,b) => b.date - a.date)
      .slice(0, 50);
  }, [transactions, filterType, recentSearch]);

  const groupedRecent = useMemo(() => {
    const groups = {};
    recentTransactions.forEach(t => {
        const dateKey = formatDate(t.date);
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(t);
    });
    return groups;
  }, [recentTransactions]);

  const historyData = useMemo(() => {
    return transactions.filter(t => {
      if (histPeriod === 'all') return true;
      const tDate = normalizeDate(t.date);
      const filterD = new Date(histDate);
      if (histPeriod === 'day') return tDate.toDateString() === filterD.toDateString();
      if (histPeriod === 'month') return tDate.getMonth() === filterD.getMonth() && tDate.getFullYear() === filterD.getFullYear();
      if (histPeriod === 'year') return tDate.getFullYear() === filterD.getFullYear();
      return true;
    }).sort((a,b) => b.date - a.date);
  }, [transactions, histPeriod, histDate]);

  const historySummary = useMemo(() => {
    const inc = historyData.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.total),0);
    const exp = historyData.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.total),0);
    return { inc, exp, bal: inc - exp };
  }, [historyData]);

  const exportHistoryCSV = () => {
    let csv = "\uFEFFวันที่,ประเภท,หมวดหมู่,รายละเอียด,จำนวนเงิน\n";
    historyData.forEach(t => {
      csv += `${formatDate(t.date)},${t.type},${t.category},"${t.description}",${t.total}\n`;
    });
    const link = document.createElement('a');
    link.href = encodeURI('data:text/csv;charset=utf-8,' + csv);
    link.download = `History_${histPeriod}_${histDate}.csv`;
    link.click();
  };

  const handleMagicFill = async () => {
    if (!magicPrompt) return;
    setIsMagicLoading(true);
    const prompt = `Extract transaction data from Thai text: "${magicPrompt}". Date: ${new Date().toISOString().split('T')[0]}. Return JSON: { type: "income"|"expense", amount: number, description: string, category: string, channel: string, date: "YYYY-MM-DD" }. Use best guess for missing fields.`;
    try {
      const result = await GeminiService.call(prompt);
      const jsonStr = result.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonStr);
      setFormData(prev => ({ ...prev, ...data }));
      setMagicPrompt('');
    } catch (error) { console.error(error); alert("AI Processing Failed"); } 
    finally { setIsMagicLoading(false); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const prompt = `Analyze receipt. Return JSON: { date: "YYYY-MM-DD", description: string, amount: number, vatType: "included"|"excluded"|"none", taxInvoiceNo: string, vendorName: string, vendorTaxId: string }.`;
      try {
        const result = await GeminiService.call(prompt, reader.result);
        const data = JSON.parse(result.replace(/```json/g, '').replace(/```/g, '').trim());
        setFormData(prev => ({ ...prev, type: 'expense', category: 'ค่าใช้จ่ายทั่วไป', ...data }));
      } catch (err) { alert("Scan Failed"); } finally { setIsScanning(false); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full lg:h-[calc(100vh-140px)] relative">
      {/* VENDOR SELECTION MODAL */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fadeIn flex flex-col h-[70vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><BookOpen className="text-rose-500"/> เลือกผู้ขายเก่า</h3>
                    <button onClick={() => setShowVendorModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                    {vendors.length === 0 ? (
                        <p className="text-center text-slate-400 py-10">ยังไม่มีรายชื่อผู้ขายที่บันทึกไว้</p>
                    ) : (
                        vendors.map(v => (
                            <div key={v.id} className="p-3 border border-slate-100 rounded-xl hover:bg-rose-50 cursor-pointer flex justify-between items-center group transition-colors" onClick={() => selectVendor(v)}>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-700">{v.vendorName}</p>
                                    <p className="text-xs text-slate-400">TAX: {v.vendorTaxId} | Branch: {v.vendorBranch}</p>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button onClick={(e) => handleDeleteVendorClick(v.id, e)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-full transition-all" title="ลบ"><Trash2 size={16}/></button>
                                    <div className="bg-rose-100 text-rose-600 px-3 py-1 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">เลือก</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}
      
      {/* VENDOR DELETE MODAL (Z-Index 60 to appear above Selection Modal) */}
      {deleteVendorId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadeIn text-center">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="text-rose-600" size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">ยืนยันการลบผู้ขาย?</h3>
                <p className="text-slate-500 text-sm mb-6">ข้อมูลนี้จะถูกลบถาวร</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteVendorId(null)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">ยกเลิก</button>
                    <button onClick={executeDeleteVendor} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 flex justify-center items-center gap-2">
                        {isDeleting ? <Loader className="animate-spin" size={18}/> : 'ยืนยันลบ'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadeIn text-center transform transition-all scale-100">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="text-rose-600" size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">ยืนยันการลบรายการ?</h3>
                <p className="text-slate-500 text-sm mb-6">รายการนี้จะถูกลบถาวร</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">ยกเลิก</button>
                    <button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-200">
                        {isDeleting ? <Loader className="animate-spin" size={18}/> : 'ยืนยันลบ'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Sub Tab Navigation */}
      <div className="flex gap-2 mb-4 bg-slate-100 p-1.5 rounded-xl w-fit self-start shadow-inner">
         <button onClick={()=>setSubTab('new')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${subTab==='new' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}><Edit size={16}/> บันทึกรายการใหม่</button>
         <button onClick={()=>setSubTab('history')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${subTab==='history' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}><List size={16}/> รวมรายการที่บันทึก</button>
      </div>

      {subTab === 'new' ? (
        // Changed lg:grid-cols-12 to xl:grid-cols-12 and made height flexible
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 w-full h-full overflow-hidden">
          <div className="xl:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:overflow-y-auto flex flex-col h-full">
            {isScanning && <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center rounded-3xl"><Loader className="animate-spin mb-2" size={32}/><p className="animate-pulse font-bold text-indigo-600">AI Reading Receipt...</p></div>}
            <h3 className="font-bold mb-4 flex gap-2 text-slate-800 text-lg items-center"><Edit className="text-indigo-500" size={24}/> New Transaction</h3>
            <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-10"><Sparkles size={100} className="text-indigo-500" /></div>
               <label className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2 relative z-10"><Wand2 size={16} className="text-indigo-600"/> Magic Fill</label>
               <div className="flex gap-2 relative z-10">
                  <input type="text" className="flex-1 border-0 rounded-xl p-3 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white placeholder:text-slate-400" placeholder='เช่น "ขายเสื้อ 2 ตัว 500 บาท"' value={magicPrompt} onChange={(e) => setMagicPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleMagicFill()} />
                  <button onClick={handleMagicFill} disabled={isMagicLoading || !magicPrompt} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all">{isMagicLoading ? <Loader className="animate-spin" size={18}/> : <BrainCircuit size={18}/>}</button>
               </div>
            </div>
            <div className="bg-slate-100 p-1.5 rounded-xl flex mb-6 shadow-inner">
               <button type="button" onClick={() => setFormData({...formData, type: 'income', category: CONSTANTS.CATEGORIES.INCOME[0]})} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all shadow-sm ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700 shadow-none'}`}>รายรับ</button>
               <button type="button" onClick={() => setFormData({...formData, type: 'expense', category: CONSTANTS.CATEGORIES.EXPENSE[0]})} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all shadow-sm ${formData.type === 'expense' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-500 hover:text-slate-700 shadow-none'}`}>รายจ่าย</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 flex-1 lg:overflow-y-auto pr-1 custom-scrollbar">
              <div className="mb-2"><label className="flex items-center justify-center w-full p-3 border-2 border-dashed border-indigo-200 rounded-xl cursor-pointer bg-indigo-50/30 hover:bg-indigo-50 transition-colors group"><div className="flex items-center gap-2 text-indigo-600 font-bold text-sm"><Camera size={18} className="group-hover:scale-110 transition-transform" /> Scan Receipt with AI</div><input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 mb-1 block">Date</label><input type="date" className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required /></div><div><label className="text-xs font-bold text-slate-500 mb-1 block">Category</label><select className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{(formData.type === 'income' ? CONSTANTS.CATEGORIES.INCOME : CONSTANTS.CATEGORIES.EXPENSE).map(c=><option key={c} value={c}>{c}</option>)}</select></div></div>
              {formData.type === 'income' ? (
                 <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-3"><div className="grid grid-cols-2 gap-3"><input type="text" className="w-full bg-white border-0 rounded-lg p-2.5 text-sm shadow-sm" placeholder="Order ID" value={formData.orderId} onChange={e => setFormData({...formData, orderId: e.target.value})} /><select className="w-full bg-white border-0 rounded-lg p-2.5 text-sm shadow-sm" value={formData.channel} onChange={e => setFormData({...formData, channel: e.target.value})}>{CONSTANTS.CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>{isEcommerceMode && (<div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-sm animate-fadeIn"><div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-700"><Calculator size={14}/> E-Commerce Gross Revenue Calculator (สรรพากร)</div><div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-500">ยอดขายเต็ม (Gross)</label><input type="number" className="w-full border-b border-slate-200 text-sm p-1 focus:outline-none focus:border-emerald-500 font-bold" placeholder="0.00" value={formData.grossAmount} onChange={e => setFormData({...formData, grossAmount: e.target.value})} /></div><div><label className="text-[10px] font-bold text-rose-500">หัก ค่าธรรมเนียม/ขนส่ง</label><input type="number" className="w-full border-b border-slate-200 text-sm p-1 focus:outline-none focus:border-rose-500 text-rose-600" placeholder="0.00" value={formData.platformFee} onChange={e => setFormData({...formData, platformFee: e.target.value})} /></div></div><p className="text-[10px] text-slate-400 mt-2">*ระบบจะบันทึกรายได้ยอดเต็ม และสร้างรายการรายจ่ายค่าธรรมเนียมให้อัตโนมัติ</p></div>)}</div>
              ) : (<div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-3"><div className="flex justify-between items-center mb-1"><label className="text-xs font-bold text-rose-700">Vendor Info (ข้อมูลคู่ค้า)</label><div className="flex gap-1"><button type="button" onClick={() => setShowVendorModal(true)} className="text-[10px] bg-white border border-rose-200 text-rose-600 px-2 py-0.5 rounded hover:bg-rose-50 flex items-center gap-1"><List size={10}/> เลือกผู้ขายเก่า</button><button type="button" onClick={handleSaveVendor} className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded hover:bg-rose-700 flex items-center gap-1"><Save size={10}/> บันทึก</button></div></div><input type="text" className="w-full bg-white border-0 rounded-lg p-2.5 text-sm shadow-sm" placeholder="Vendor Name" value={formData.vendorName} onChange={e => setFormData({...formData, vendorName: e.target.value})} /><div className="grid grid-cols-2 gap-3"><input type="text" className="w-full bg-white border-0 rounded-lg p-2.5 text-sm shadow-sm" placeholder="Tax ID" value={formData.vendorTaxId} onChange={e => setFormData({...formData, vendorTaxId: e.target.value})} /><input type="text" className="w-full bg-white border-0 rounded-lg p-2.5 text-sm shadow-sm" placeholder="Branch" value={formData.vendorBranch} onChange={e => setFormData({...formData, vendorBranch: e.target.value})} /></div><input type="text" className="w-full bg-white border-0 rounded-lg p-2.5 text-sm shadow-sm" placeholder="Tax Invoice No." value={formData.taxInvoiceNo} onChange={e => setFormData({...formData, taxInvoiceNo: e.target.value})} /></div>)}
              <div><label className="text-xs font-bold text-slate-500 mb-1 block">Description</label><input type="text" className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 mb-1 block">{isEcommerceMode ? "Net Received (เงินเข้าบัญชี)" : "Total Amount"}</label><input type="number" className={`w-full bg-slate-50 border-0 rounded-xl p-3 text-lg font-bold text-right ${isEcommerceMode ? 'text-emerald-600' : 'text-slate-700'}`} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required readOnly={isEcommerceMode} /></div><div><label className="text-xs font-bold text-slate-500 mb-1 block">VAT Type</label><select className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm" value={formData.vatType} onChange={e => setFormData({...formData, vatType: e.target.value})}><option value="included">รวม VAT</option><option value="excluded">แยก VAT</option><option value="none">ไม่มี VAT</option></select></div></div>
              {formData.type === 'expense' && (<div><label className="text-xs font-bold text-slate-500 mb-1 block">WHT (หัก ณ ที่จ่าย)</label><select className="w-full bg-yellow-50 border-0 rounded-xl p-3 text-sm text-yellow-800" value={formData.whtRate} onChange={e => setFormData({...formData, whtRate: Number(e.target.value)})}> <option value={0}>ไม่หัก (0%)</option><option value={1}>1% - ขนส่ง</option><option value={3}>3% - บริการ</option><option value={5}>5% - เช่า</option></select></div>)}
              <div className="bg-slate-800 p-4 rounded-xl text-slate-300 text-sm space-y-1 mt-2 shadow-lg"><div className="flex justify-between"><span>Base/Gross:</span><span>{formatCurrency(calculated.baseAmount)}</span></div><div className="flex justify-between"><span>VAT 7%:</span><span>{formatCurrency(calculated.vat)}</span></div><div className="flex justify-between font-bold text-lg text-white border-t border-slate-600 pt-2 mt-1"><span>Recorded Total:</span><span>{formatCurrency(calculated.baseAmount)}</span></div>{isEcommerceMode && <div className="text-[10px] text-emerald-400 mt-1">*บันทึกยอด Gross เป็นรายได้เพื่อคำนวณภาษี</div>}</div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 font-bold shadow-lg transition-all flex items-center justify-center gap-2 mt-4"><Save size={20}/> บันทึกรายการ</button>
            </form>
          </div>
          
          <div className="xl:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[500px] lg:h-full overflow-hidden">
             {/* Header with Search */}
             <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><Clock size={20} className="text-indigo-500"/> รายการล่าสุด</h3>
                    <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                        {['all', 'income', 'expense'].map(type => (<button key={type} onClick={()=>setFilterType(type)} className={`px-3 py-1 text-[10px] font-bold rounded transition-all capitalize ${filterType===type ? (type==='income'?'bg-emerald-100 text-emerald-700':type==='expense'?'bg-rose-100 text-rose-700':'bg-indigo-100 text-indigo-700') : 'text-slate-500'}`}>{type}</button>))}
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
                      placeholder="ค้นหารายการ..."
                      value={recentSearch}
                      onChange={e => setRecentSearch(e.target.value)}
                    />
                </div>
             </div>

             {/* Recent List Content */}
             <div className="flex-1 overflow-auto custom-scrollbar p-4 space-y-6">
                {Object.keys(groupedRecent).length === 0 ? (
                    <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                        <div className="bg-slate-100 p-4 rounded-full mb-3"><FileText size={24}/></div>
                        <p>ไม่มีรายการที่ค้นหา</p>
                    </div>
                ) : (
                    Object.entries(groupedRecent).map(([date, items]) => (
                        <div key={date}>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1 sticky top-0 bg-white/90 backdrop-blur-sm py-1 z-10 w-fit px-2 rounded-md border border-slate-100">{date}</h4>
                            <div className="space-y-3">
                                {items.map(t => (
                                    <div key={t.id} className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-3 hover:shadow-md transition-all group relative">
                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {t.type === 'income' ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                                        </div>
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-slate-700 text-sm truncate">{t.description}</p>
                                                <p className={`font-bold text-sm whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-700'}`}>
                                                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.total)}
                                                </p>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <div className="flex gap-2 text-xs">
                                                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{t.category}</span>
                                                    {t.channel && <span className="border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded">{t.channel}</span>}
                                                </div>
                                                {/* Action */}
                                                <button onClick={() => confirmDelete(t.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1" title="ลบ"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden animate-fadeIn">
           {/* HISTORY HEADER & FILTER */}
           <div className="p-6 border-b border-slate-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                 <h3 className="font-bold text-slate-700 text-xl flex items-center gap-2"><Clock className="text-indigo-500"/> รวมรายการที่บันทึก (All Records)</h3>
                 <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                    <button onClick={()=>setHistPeriod('all')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${histPeriod==='all' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>ทั้งหมด</button>
                    <button onClick={()=>setHistPeriod('day')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${histPeriod==='day' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>รายวัน</button>
                    <button onClick={()=>setHistPeriod('month')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${histPeriod==='month' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>รายเดือน</button>
                    <button onClick={()=>setHistPeriod('year')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${histPeriod==='year' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>รายปี</button>
                 </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                 <div className="flex items-center gap-4 w-full md:w-auto">
                    {histPeriod !== 'all' && <label className="text-sm font-bold text-slate-500 whitespace-nowrap">เลือกช่วงเวลา:</label>}
                    {histPeriod === 'day' && <input type="date" className="border-0 bg-slate-50 rounded-lg px-4 py-2 font-bold text-slate-700 w-full md:w-auto" value={histDate} onChange={e=>setHistDate(e.target.value)} />}
                    {histPeriod === 'month' && <input type="month" className="border-0 bg-slate-50 rounded-lg px-4 py-2 font-bold text-slate-700 w-full md:w-auto" value={histDate.slice(0,7)} onChange={e=>setHistDate(e.target.value + '-01')} />}
                    {histPeriod === 'year' && (
                       <select className="border-0 bg-slate-50 rounded-lg px-4 py-2 font-bold text-slate-700 w-full md:w-auto" value={new Date(histDate).getFullYear()} onChange={e=>setHistDate(`${e.target.value}-01-01`)}>
                          {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
                       </select>
                    )}
                 </div>
                 
                 <div className="flex gap-4 w-full md:w-auto">
                    <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex-1 md:flex-none text-center">
                       <p className="text-[10px] text-emerald-500 font-bold uppercase">รายรับรวม</p>
                       <p className="text-lg font-bold text-emerald-600">{formatCurrency(historySummary.inc)}</p>
                    </div>
                    <div className="bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 flex-1 md:flex-none text-center">
                       <p className="text-[10px] text-rose-500 font-bold uppercase">รายจ่ายรวม</p>
                       <p className="text-lg font-bold text-rose-600">{formatCurrency(historySummary.exp)}</p>
                    </div>
                    <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 flex-1 md:flex-none text-center">
                       <p className="text-[10px] text-indigo-500 font-bold uppercase">คงเหลือ</p>
                       <p className="text-lg font-bold text-indigo-600">{formatCurrency(historySummary.bal)}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* HISTORY TABLE */}
           <div className="flex-1 overflow-auto p-4 custom-scrollbar">
              <div className="flex justify-end mb-2">
                 <button onClick={exportHistoryCSV} className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600"><Download size={14}/> Export CSV</button>
              </div>
              <table className="w-full text-sm text-left border-collapse">
                 <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10">
                    <tr>
                       <th className="p-4 rounded-l-lg">Date</th>
                       <th className="p-4">Category</th>
                       <th className="p-4">Description</th>
                       <th className="p-4 text-right">Amount</th>
                       <th className="p-4 text-center rounded-r-lg">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {historyData.map(t => (
                       <tr key={t.id} className="hover:bg-slate-50">
                          <td className="p-4 text-slate-500">{formatDate(t.date)}</td>
                          <td className="p-4">
                             <span className={`px-2 py-1 rounded-md text-xs font-bold ${t.type==='income'?'bg-emerald-50 text-emerald-600':'bg-rose-50 text-rose-600'}`}>{t.category}</span>
                          </td>
                          <td className="p-4 text-slate-700">{t.description} <span className="text-slate-400 text-xs ml-1">({t.channel || '-'})</span></td>
                          <td className={`p-4 text-right font-bold ${t.type==='income'?'text-emerald-600':'text-rose-600'}`}>{t.type==='income'?'+':'-'}{formatCurrency(t.total)}</td>
                          <td className="p-4 text-center"><button onClick={()=>confirmDelete(t.id)} className="text-slate-300 hover:text-rose-500 p-2 rounded hover:bg-rose-50 transition-all"><Trash2 size={16}/></button></td>
                       </tr>
                    ))}
                    {historyData.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-slate-300">ไม่พบรายการในช่วงเวลานี้</td></tr>}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

// ... (Rest of the components: StockManager, TaxReport, App remain unchanged) ...
const StockManager = ({ user }) => {
   const [products, setProducts] = useState([]);
   const [newItem, setNewItem] = useState({ name: '', sku: '', qty: 0, unit: 'ชิ้น' });

   useEffect(() => {
      if(!user) return;
      const q = query(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'products'));
      const unsub = onSnapshot(q, (snapshot) => {
         setProducts(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
      });
      return () => unsub();
   }, [user]);

   const addProduct = async () => {
      if(!newItem.name) return;
      await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'products'), {...newItem, updatedAt: serverTimestamp()});
      setNewItem({ name: '', sku: '', qty: 0, unit: 'ชิ้น' });
   };

   const updateStock = async (id, currentQty, change) => {
      const docRef = doc(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'products', id);
      await updateDoc(docRef, { qty: currentQty + change, updatedAt: serverTimestamp() });
   };

   return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col">
         <div className="flex justify-between items-center mb-6">
            <div>
               <h3 className="font-bold text-slate-700 text-xl flex items-center gap-2"><Package className="text-orange-500"/> Stock Report (รายงานสินค้าและวัตถุดิบ)</h3>
               <p className="text-slate-400 text-sm">จำเป็นสำหรับผู้จดทะเบียนภาษีมูลค่าเพิ่ม (VAT)</p>
            </div>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
               <input className="bg-transparent border-0 px-3 py-1 text-sm w-48" placeholder="ชื่อสินค้า..." value={newItem.name} onChange={e=>setNewItem({...newItem, name: e.target.value})}/>
               <input className="bg-transparent border-0 px-3 py-1 text-sm w-20 text-center border-l border-slate-200" type="number" placeholder="Qty" value={newItem.qty} onChange={e=>setNewItem({...newItem, qty: Number(e.target.value)})}/>
               <button onClick={addProduct} className="bg-orange-500 text-white px-4 py-1 rounded-md text-sm font-bold shadow-sm hover:bg-orange-600">+ Add</button>
            </div>
         </div>
         <div className="flex-1 overflow-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0"><tr><th className="p-4">SKU/Name</th><th className="p-4 text-center">Unit</th><th className="p-4 text-center">In/Out</th><th className="p-4 text-right">Balance</th><th className="p-4 text-center">Action</th></tr></thead>
               <tbody className="divide-y divide-slate-50">
                  {products.map(p => (
                     <tr key={p.id}>
                        <td className="p-4 font-bold text-slate-700">{p.name} <span className="text-xs text-slate-400 font-normal">{p.sku}</span></td>
                        <td className="p-4 text-center text-slate-500">{p.unit}</td>
                        <td className="p-4 flex justify-center gap-2">
                           <button onClick={()=>updateStock(p.id, p.qty, -1)} className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold">-</button>
                           <button onClick={()=>updateStock(p.id, p.qty, 1)} className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold">+</button>
                        </td>
                        <td className="p-4 text-right font-bold text-lg">{p.qty}</td>
                        <td className="p-4 text-center"><button onClick={async()=>await deleteDoc(doc(db,'artifacts',CONSTANTS.APP_ID,'public','data','products',p.id))} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button></td>
                     </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-slate-400">ยังไม่มีข้อมูลสินค้า</td></tr>}
               </tbody>
            </table>
         </div>
      </div>
   );
};

const InvoiceGenerator = ({ user, invoices }) => {
  const [mode, setMode] = useState('create'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [magicPrompt, setMagicPrompt] = useState('');
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [reminderText, setReminderText] = useState('');
  const [isReminderLoading, setIsReminderLoading] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [customers, setCustomers] = useState([]); 
  const [deleteId, setDeleteId] = useState(null); 
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [deleteCustomerId, setDeleteCustomerId] = useState(null); // New state for customer delete

  const initialInvData = {
    docType: 'ใบกำกับภาษี / ใบเสร็จรับเงิน',
    customerName: '', address: '', taxId: '', branch: '00000', customerPO: '', creditTerm: 0,
    custSubDistrict: '', custDistrict: '', custProvince: '', custZipCode: '', // NEW Customer Address Fields
    customerPhone: '', customerEmail: '', isCustomerHeadOffice: true,
    items: [{ desc: '', qty: 1, unit: 'ชิ้น', price: 0 }],
    date: formatDateISO(new Date()), invNo: '', 
    sellerName: '', sellerAddress: '', sellerTaxId: '', sellerBranchId: '00000', isHeadOffice: true, sellerPhone: '', sellerEmail: '', discount: 0,
    sellerSubDistrict: '', sellerDistrict: '', sellerProvince: '', sellerZipCode: '', // NEW Seller Address Fields
    bankName: '', bankAccount: '', bankBranch: '',
    notes: 'สินค้าซื้อแล้วไม่รับเปลี่ยนหรือคืนเงิน'
  };
  
  const [invData, setInvData] = useState(initialInvData);

  useEffect(() => {
    if (!window.html2pdf && !document.getElementById('html2pdf-script')) {
       const script = document.createElement('script');
       script.id = 'html2pdf-script';
       script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
       document.body.appendChild(script);
    }
  }, []);

  // Sync Customers
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'customers'));
      const unsub = onSnapshot(q, (snap) => {
        setCustomers(snap.docs.map(d => ({id: d.id, ...d.data()})));
      });
      return () => unsub();
    }
  }, [user]);

  useEffect(() => { 
    if (mode === 'create') { 
      const dateStr = invData.date.replace(/-/g, ''); 
      const count = invoices.filter(inv => inv.invNo && inv.invNo.startsWith(dateStr)).length + 1; 
      setInvData(prev => ({ ...prev, invNo: `${dateStr}-${String(count).padStart(3, '0')}` })); 
    } 
  }, [invData.date, invoices, mode]);

  const totals = useMemo(() => {
    const sub = invData.items.reduce((s, i) => s + (i.qty * i.price), 0);
    const afterDisc = sub - Number(invData.discount);
    const vat = afterDisc * 0.07;
    return { sub, afterDisc, vat, total: afterDisc + vat };
  }, [invData.items, invData.discount]);

  const handleSaveInvoice = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'invoices'), { ...invData, ...totals, date: new Date(invData.date), createdAt: serverTimestamp() });
      alert(`Saved Invoice ${invData.invNo}`);
      setMode('history');
    } catch(e) { console.error(e); alert("Save failed"); }
  };

  const handleSaveCustomer = async () => {
    if (!invData.customerName) return alert("กรุณาระบุชื่อลูกค้า");
    const customerData = {
      customerName: invData.customerName,
      address: invData.address,
      custSubDistrict: invData.custSubDistrict,
      custDistrict: invData.custDistrict,
      custProvince: invData.custProvince,
      custZipCode: invData.custZipCode,
      taxId: invData.taxId,
      branch: invData.branch,
      customerPhone: invData.customerPhone,
      customerEmail: invData.customerEmail,
      isCustomerHeadOffice: invData.isCustomerHeadOffice
    };
    try {
        await addDoc(collection(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'customers'), customerData);
        alert("บันทึกข้อมูลลูกค้าเรียบร้อย");
    } catch (e) { console.error(e); alert("บันทึกไม่สำเร็จ"); }
  };

  // DELETE CUSTOMER FUNCTIONS
  const handleDeleteCustomerClick = (id, e) => {
    e.stopPropagation();
    setDeleteCustomerId(id);
  };

  const executeDeleteCustomer = async () => {
      if (!deleteCustomerId) return;
      setIsDeleting(true);
      try {
          await deleteDoc(doc(db, 'artifacts', CONSTANTS.APP_ID, 'public', 'data', 'customers', deleteCustomerId));
          setDeleteCustomerId(null);
      } catch (err) { console.error(err); alert("ลบไม่สำเร็จ"); } finally { setIsDeleting(false); }
  };


  const selectCustomer = (cust) => {
    setInvData(prev => ({
      ...prev,
      customerName: cust.customerName || '',
      address: cust.address || '',
      custSubDistrict: cust.custSubDistrict || '',
      custDistrict: cust.custDistrict || '',
      custProvince: cust.custProvince || '',
      custZipCode: cust.custZipCode || '',
      taxId: cust.taxId || '',
      branch: cust.branch || '',
      customerPhone: cust.customerPhone || '',
      customerEmail: cust.customerEmail || '',
      isCustomerHeadOffice: cust.isCustomerHeadOffice || false
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

  const updateItem = (i, field, val) => {
    const newItems = [...invData.items];
    newItems[i][field] = val;
    setInvData({...invData, items: newItems});
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-preview-area');
    if (!window.html2pdf) { alert("PDF Tool Loading... Try again in 5s"); return; }
    window.html2pdf().set({ margin: 0, filename: `INV_${invData.invNo}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(element).save();
  };

  const handleMagicInvoice = async () => {
    if (!magicPrompt) return;
    setIsMagicLoading(true);
    const prompt = `Extract invoice data from this Thai text: "${magicPrompt}". Return ONLY JSON with keys: customerName, address, taxId, items (array of desc, qty, price, unit), customerPhone. If you can, split address into subDistrict, district, province, zipCode, but main address part goes to 'address'.`;
    try {
      const result = await GeminiService.call(prompt);
      const jsonStr = result.replace(/```json/g, '').replace(/```/g, '').trim();
      const extracted = JSON.parse(jsonStr);
      setInvData(prev => ({ ...prev, ...extracted }));
      setMagicPrompt('');
    } catch (e) { alert("AI Processing Failed"); } finally { setIsMagicLoading(false); }
  };

  const handleGenerateReminder = async () => {
    setIsReminderLoading(true);
    setShowReminder(true);
    const prompt = `Write polite Thai payment reminder for ${invData.customerName}, Inv: ${invData.invNo}, Total: ${formatCurrency(totals.total)}. Tone: Friendly.`;
    try {
      const result = await GeminiService.call(prompt);
      setReminderText(result || "Could not generate message.");
    } catch (e) { setReminderText("Error generating message."); } finally { setIsReminderLoading(false); }
  };

  return (
    <div className="w-full flex flex-col gap-8 relative">
      {/* CUSTOMER SELECTION MODAL */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fadeIn flex flex-col h-[70vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><BookOpen className="text-rose-500"/> เลือกลูกค้าเก่า</h3>
                    <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                    {customers.length === 0 ? (
                        <p className="text-center text-slate-400 py-10">ยังไม่มีรายชื่อลูกค้าที่บันทึกไว้</p>
                    ) : (
                        customers.map(c => (
                            <div key={c.id} className="p-3 border border-slate-100 rounded-xl hover:bg-rose-50 cursor-pointer flex justify-between items-center group transition-colors" onClick={() => selectCustomer(c)}>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-700">{c.customerName}</p>
                                    <p className="text-xs text-slate-400">TAX: {c.taxId} | Branch: {c.branch}</p>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button onClick={(e) => handleDeleteCustomerClick(c.id, e)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-full transition-all" title="ลบ"><Trash2 size={16}/></button>
                                    <div className="bg-rose-100 text-rose-600 px-3 py-1 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">เลือก</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

      {/* CUSTOMER DELETE MODAL (Z-Index 60 to appear above Selection Modal) */}
      {deleteCustomerId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadeIn text-center">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="text-rose-600" size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">ยืนยันการลบลูกค้า?</h3>
                <p className="text-slate-500 text-sm mb-6">ข้อมูลลูกค้าจะถูกลบถาวร</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteCustomerId(null)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">ยกเลิก</button>
                    <button onClick={executeDeleteCustomer} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 flex justify-center items-center gap-2">
                        {isDeleting ? <Loader className="animate-spin" size={18}/> : 'ยืนยันลบ'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadeIn text-center transform transition-all scale-100">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="text-rose-600" size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">ยืนยันการลบเอกสาร?</h3>
                <p className="text-slate-500 text-sm mb-6">เอกสารนี้จะถูกลบถาวรและไม่สามารถกู้คืนได้</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">ยกเลิก</button>
                    <button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-200">
                        {isDeleting ? <Loader className="animate-spin" size={18}/> : 'ยืนยันลบ'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {showReminder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fadeIn">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg flex items-center gap-2"><MessageSquare className="text-indigo-500"/> AI Payment Reminder</h3><button onClick={() => setShowReminder(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 min-h-[150px] relative">
                 {isReminderLoading ? <div className="flex flex-col items-center justify-center h-full gap-2 text-indigo-500 pt-10 pb-10"><Loader className="animate-spin"/><span className="text-xs font-bold animate-pulse">Generating Message...</span></div> : <textarea className="w-full h-40 bg-transparent border-0 resize-none text-sm text-slate-700 focus:ring-0" value={reminderText} onChange={(e) => setReminderText(e.target.value)}></textarea>}
                 {!isReminderLoading && <button onClick={() => {navigator.clipboard.writeText(reminderText); alert("Copied!");}} className="absolute bottom-2 right-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600"><Copy size={16}/></button>}
              </div>
           </div>
        </div>
      )}

      <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit border border-slate-200 print:hidden self-center">
         <button onClick={() => setMode('create')} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode==='create'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700'}`}><FileText size={18}/> ออกใบกำกับภาษี</button>
         <button onClick={() => setMode('history')} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode==='history'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700'}`}><History size={18}/> ประวัติเอกสาร</button>
      </div>

      {mode === 'history' ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-fadeIn">
           <h3 className="font-bold text-slate-700 mb-4 text-xl">Invoice History</h3>
           <div className="rounded-2xl border border-slate-100 overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-xs"><tr><th className="p-4">Date</th><th className="p-4">Inv No.</th><th className="p-4">Customer</th><th className="p-4 text-right">Total</th><th className="p-4 text-center">Action</th></tr></thead>
                 <tbody className="divide-y divide-slate-50">{invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-indigo-50/30">
                        <td className="p-4 text-slate-500 text-xs">{formatDate(inv.date)}</td>
                        <td className="p-4 text-indigo-600 font-bold">{inv.invNo}</td>
                        <td className="p-4">{inv.customerName}</td>
                        <td className="p-4 text-right font-bold">{formatCurrency(inv.total)}</td>
                        <td className="p-4 text-center">
                            <div className="flex justify-center gap-2">
                                <button onClick={() => { setInvData({...inv, date: formatDateISO(inv.date)}); setMode('create'); }} className="text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-100 bg-white transition-all shadow-sm">Edit/Print</button>
                                <button type="button" onClick={() => confirmDelete(inv.id)} className="text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1" title="ลบเอกสาร"><Trash2 size={14}/> ลบ</button>
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
             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2"><Sparkles className="text-indigo-500" size={18} /><span className="font-bold text-indigo-800 text-sm">✨ Magic Invoice Fill</span></div>
                <div className="flex gap-2"><input type="text" className="flex-1 border-0 rounded-xl p-3 text-sm shadow-sm" placeholder='Paste customer info...' value={magicPrompt} onChange={(e) => setMagicPrompt(e.target.value)} /><button onClick={handleMagicInvoice} disabled={isMagicLoading || !magicPrompt} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-md">{isMagicLoading ? <Loader size={18}/> : 'Auto Fill'}</button></div>
             </div>
             <div className="flex justify-between border-b border-slate-100 pb-4"><div><h3 className="font-bold text-slate-800 text-xl">Invoice Editor</h3><p className="text-slate-400 text-sm">สร้างเอกสารใบกำกับภาษีถูกต้องตามกรมสรรพากร</p></div><div className="text-right"><p className="text-xs text-slate-400 font-bold uppercase">DOC ID</p><p className="text-2xl font-bold text-indigo-600 font-mono">{invData.invNo}</p></div></div>
             
             {/* Seller Information */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl">
                    <h4 className="font-bold text-sm text-indigo-600">ข้อมูลผู้ขาย (Seller)</h4>
                    <div className="relative">
                        <input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm pr-16" placeholder="ชื่อผู้เสียภาษี (บุคคลธรรมดาใช้ ชื่อ-สกุล)" value={invData.sellerName} onChange={e=>setInvData({...invData, sellerName: e.target.value})} />
                        <span className="text-[10px] text-indigo-500 absolute right-2 top-2.5 font-bold flex items-center gap-1"><Info size={10}/> ตรง ภ.พ.20</span>
                    </div>
                    <input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm" placeholder="เลขที่ / หมู่บ้าน / ถนน" value={invData.sellerAddress} onChange={e=>setInvData({...invData, sellerAddress: e.target.value})} />
                    
                    {/* New Address Fields Seller */}
                    <div className="grid grid-cols-2 gap-2">
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="แขวง/ตำบล" value={invData.sellerSubDistrict} onChange={e=>setInvData({...invData, sellerSubDistrict: e.target.value})} />
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="เขต/อำเภอ" value={invData.sellerDistrict} onChange={e=>setInvData({...invData, sellerDistrict: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="จังหวัด" value={invData.sellerProvince} onChange={e=>setInvData({...invData, sellerProvince: e.target.value})} />
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="รหัสไปรษณีย์" value={invData.sellerZipCode} onChange={e=>setInvData({...invData, sellerZipCode: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="เลขผู้เสียภาษี" value={invData.sellerTaxId} onChange={e=>setInvData({...invData, sellerTaxId: e.target.value})} />
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="สาขา (00000)" value={invData.sellerBranchId} onChange={e=>setInvData({...invData, sellerBranchId: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="เบอร์โทร" value={invData.sellerPhone} onChange={e=>setInvData({...invData, sellerPhone: e.target.value})} />
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="Email" value={invData.sellerEmail} onChange={e=>setInvData({...invData, sellerEmail: e.target.value})} />
                    </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-rose-600">ข้อมูลลูกค้า (Customer)</h4>
                        <div className="flex gap-1">
                            <button type="button" onClick={() => setShowCustomerModal(true)} className="text-[10px] bg-white border border-rose-200 text-rose-600 px-2 py-0.5 rounded hover:bg-rose-50 flex items-center gap-1"><BookOpen size={10}/> เลือกลูกค้าเก่า</button>
                            <button onClick={handleSaveCustomer} className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded hover:bg-rose-700 flex items-center gap-1"><Save size={10}/> บันทึก</button>
                        </div>
                    </div>
                    <input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm" placeholder="ชื่อลูกค้า / บริษัท" value={invData.customerName} onChange={e=>setInvData({...invData, customerName: e.target.value})} />
                    <input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm" placeholder="เลขที่ / หมู่บ้าน / ถนน" value={invData.address} onChange={e=>setInvData({...invData, address: e.target.value})} />
                    
                    {/* New Address Fields Customer */}
                    <div className="grid grid-cols-2 gap-2">
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="แขวง/ตำบล" value={invData.custSubDistrict} onChange={e=>setInvData({...invData, custSubDistrict: e.target.value})} />
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="เขต/อำเภอ" value={invData.custDistrict} onChange={e=>setInvData({...invData, custDistrict: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="จังหวัด" value={invData.custProvince} onChange={e=>setInvData({...invData, custProvince: e.target.value})} />
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="รหัสไปรษณีย์" value={invData.custZipCode} onChange={e=>setInvData({...invData, custZipCode: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="เลขผู้เสียภาษี" value={invData.taxId} onChange={e=>setInvData({...invData, taxId: e.target.value})} />
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="สาขา" value={invData.branch} onChange={e=>setInvData({...invData, branch: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="เบอร์โทร" value={invData.customerPhone} onChange={e=>setInvData({...invData, customerPhone: e.target.value})} />
                        <input className="border-0 rounded-lg p-2 text-sm" placeholder="Email" value={invData.customerEmail} onChange={e=>setInvData({...invData, customerEmail: e.target.value})} />
                    </div>
                </div>
             </div>

             <div className="bg-slate-50 p-4 rounded-xl"><h4 className="font-bold text-sm text-slate-600 mb-2">รายการสินค้า</h4>{invData.items.map((it, i) => (<div key={i} className="flex gap-2 mb-2 items-center"><span className="text-xs text-slate-400 w-4">{i+1}.</span><input className="flex-[3] border-0 rounded p-2 text-sm" value={it.desc} onChange={e=>updateItem(i,'desc',e.target.value)}/><input className="w-20 border-0 rounded p-2 text-sm text-center" type="number" value={it.qty} onChange={e=>updateItem(i,'qty',Number(e.target.value))}/><input className="w-24 border-0 rounded p-2 text-sm text-right" type="number" value={it.price} onChange={e=>updateItem(i,'price',Number(e.target.value))}/><button onClick={()=>setInvData({...invData, items: invData.items.filter((_,idx)=>idx!==i)})} className="text-rose-400"><Trash2 size={16}/></button></div>))}<button onClick={()=>setInvData({...invData, items:[...invData.items, {desc:'', qty:1, unit:'ชิ้น', price:0}]})} className="mt-2 text-xs bg-indigo-600 text-white px-3 py-1 rounded flex items-center gap-1 w-fit"><Package size={14}/> เพิ่มรายการ</button></div>
             <div className="flex gap-4"><button onClick={handleSaveInvoice} className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold"><Save size={18}/> Save</button><button onClick={handleDownloadPDF} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold"><FileDown size={18}/> PDF</button><button onClick={handleGenerateReminder} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold"><MessageSquare size={18}/> AI Reminder</button></div>
          </div>
          
          <div className="overflow-x-auto pb-10">
            <div id="invoice-preview-area" className="bg-white p-[40px] shadow-2xl min-h-[29.7cm] min-w-[21cm] w-[21cm] mx-auto text-sm font-sarabun text-slate-800 leading-relaxed relative">
               <div className="flex justify-between items-start mb-8">
                  <div className="w-[60%]">
                      <h2 className="text-3xl font-bold text-slate-900 mb-1">{invData.sellerName}</h2>
                      <p className="text-slate-600 leading-snug">
                          {invData.sellerAddress} {invData.sellerSubDistrict && `ต.${invData.sellerSubDistrict}`} {invData.sellerDistrict && `อ.${invData.sellerDistrict}`}<br/>
                          {invData.sellerProvince && `จ.${invData.sellerProvince}`} {invData.sellerZipCode}
                      </p>
                      <div className="mt-2 text-sm text-slate-600">
                          <p><b>เลขประจำตัวผู้เสียภาษี:</b> {invData.sellerTaxId} <b>สาขา:</b> {invData.sellerBranchId}</p>
                          <p><b>โทร:</b> {invData.sellerPhone} <b>Email:</b> {invData.sellerEmail}</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <div className="text-xl font-bold uppercase border-b-2 border-black pb-1 mb-2 inline-block">{invData.docType}</div>
                      <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-right">
                          <span className="font-bold text-slate-500">NO.</span><span className="font-bold text-lg">{invData.invNo}</span>
                          <span className="font-bold text-slate-500">DATE</span><span>{formatDate(invData.date)}</span>
                      </div>
                  </div>
               </div>
               
               <div className="border border-slate-300 rounded p-4 mb-6">
                   <div className="text-xs font-bold text-slate-400 uppercase mb-1">Customer (ลูกค้า)</div>
                   <p className="font-bold text-lg">{invData.customerName}</p>
                   <p className="text-slate-600 leading-snug">
                       {invData.address} {invData.custSubDistrict && `ต.${invData.custSubDistrict}`} {invData.custDistrict && `อ.${invData.custDistrict}`}<br/>
                       {invData.custProvince && `จ.${invData.custProvince}`} {invData.custZipCode}
                   </p>
                   <div className="mt-2 flex gap-4 text-sm">
                       <p><b>Tax ID:</b> {invData.taxId}</p>
                       <p><b>Branch:</b> {invData.branch}</p>
                   </div>
                   <div className="flex gap-4 text-sm">
                       <p><b>Tel:</b> {invData.customerPhone}</p>
                       <p><b>Email:</b> {invData.customerEmail}</p>
                   </div>
               </div>

               <table className="w-full mb-8 border-collapse border border-slate-300"><thead><tr className="bg-slate-100 text-slate-800 font-bold text-xs uppercase text-center"><th className="py-2 border border-slate-300 w-10">No.</th><th className="py-2 border border-slate-300 text-left pl-2">Description</th><th className="py-2 border border-slate-300 w-16">Qty</th><th className="py-2 border border-slate-300 w-24">Price</th><th className="py-2 border border-slate-300 w-28">Total</th></tr></thead><tbody>{invData.items.map((it, i) => (<tr key={i}><td className="py-2 border border-slate-300 text-center">{i+1}</td><td className="py-2 border border-slate-300 pl-2">{it.desc}</td><td className="py-2 border border-slate-300 text-center">{it.qty}</td><td className="py-2 border border-slate-300 text-right pr-2">{formatCurrency(it.price)}</td><td className="py-2 border border-slate-300 text-right pr-2 font-bold">{formatCurrency(it.qty * it.price)}</td></tr>))}</tbody></table>
               <div className="flex justify-between items-start"><div className="w-[60%] pr-8"><div className="bg-slate-100 p-2 text-center font-bold italic mb-4 border border-slate-200">({thaiBahtText(totals.total)})</div><div className="text-xs"><b>Note:</b> {invData.notes}</div></div><div className="w-[35%] space-y-1"><div className="flex justify-between"><span>รวมเป็นเงิน</span><span>{formatCurrency(totals.sub)}</span></div>{invData.discount > 0 && <div className="flex justify-between text-rose-600"><span>ส่วนลด</span><span>-{formatCurrency(invData.discount)}</span></div>}<div className="flex justify-between"><span>มูลค่าหลังหักส่วนลด</span><span>{formatCurrency(totals.afterDisc)}</span></div><div className="flex justify-between border-b border-slate-300 pb-1"><span>VAT 7%</span><span>{formatCurrency(totals.vat)}</span></div><div className="flex justify-between font-bold text-lg pt-1"><span>จำนวนเงินทั้งสิ้น</span><span>{formatCurrency(totals.total)}</span></div></div></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ... (Rest of the components: StockManager, TaxReport, App remain unchanged) ...
const TaxReport = ({ transactions }) => {
  const [activeSubTab, setActiveSubTab] = useState('assessment');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [taxQuestion, setTaxQuestion] = useState("");
  const [taxAnswer, setTaxAnswer] = useState("");
  const [isTaxLoading, setIsTaxLoading] = useState(false);
  const [vatTab, setVatTab] = useState('sales');

  // --- NEW STATE FOR BUSINESS HEADER ---
  const [bizName, setBizName] = useState('');
  const [bizTaxId, setBizTaxId] = useState('');
  const [bizBranch, setBizBranch] = useState('00000');
  const [bizAddress, setBizAddress] = useState('');

  const assessmentData = useMemo(() => {
    const yearlyTrans = transactions.filter(t => normalizeDate(t.date).getFullYear() === year);
    const totalIncome = yearlyTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.total)||0), 0);
    const actualExpense = yearlyTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.total)||0), 0);
    const expenseStandard = totalIncome * 0.6;
    const netIncomeStandard = totalIncome - expenseStandard;
    const taxStandard = calculateProgressiveTax(netIncomeStandard);
    const netIncomeActual = totalIncome - actualExpense;
    const taxActual = calculateProgressiveTax(Math.max(0, netIncomeActual));
    const recommendedMethod = taxStandard < taxActual ? 'standard' : 'actual';
    const recommendation = recommendedMethod === 'standard' ? "แนะนำ 'หักเหมา 60%' (ภาษีน้อยกว่า)" : "แนะนำ 'หักตามจริง' (ภาษีน้อยกว่า)";
    return { totalIncome, actualExpense, expenseStandard, netIncomeStandard, netIncomeActual, taxStandard, taxActual, recommendation, recommendedMethod };
  }, [transactions, year]);

  const monthlyVat = useMemo(() => {
    const filtered = transactions.filter(t => { const d = normalizeDate(t.date); return d.getFullYear() === year && d.getMonth() === month; });
    const salesTax = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.vat)||0), 0);
    const purchaseTax = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.vat)||0), 0);
    return { filtered, salesTax, purchaseTax, remit: salesTax - purchaseTax };
  }, [transactions, year, month]);

  const exportVATReport = (type) => {
    const isSales = type === 'sales';
    const relevantTrans = monthlyVat.filtered.filter(t => t.type === (isSales ? 'income' : 'expense') && t.vatType !== 'none');
    
    // Month name array
    const monthNames = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    const monthName = monthNames[month];

    // CSV Construction with Header
    let csvContent = "data:text/csv;charset=utf-8,%EF%BB%BF"; // BOM
    
    // --- REPORT HEADER ---
    csvContent += `รายงานภาษี${isSales ? 'ขาย' : 'ซื้อ'}\n`;
    csvContent += `เดือนภาษี ${monthName} ปีภาษี ${year}\n`;
    csvContent += `ชื่อผู้ประกอบการ: ${bizName || '-'}, เลขประจำตัวผู้เสียภาษี: ${bizTaxId || '-'}\n`;
    csvContent += `ชื่อสถานประกอบการ/ที่อยู่: ${bizAddress || '-'}\n`;
    csvContent += `สำนักงานใหญ่/สาขาที่: ${bizBranch || '00000'}\n\n`;

    // --- TABLE HEADER ---
    csvContent += "ลำดับ,วันเดือนปี,เลขที่ใบกำกับภาษี,ชื่อผู้ซื้อ/ผู้ขาย,เลขประจำตัวผู้เสียภาษี,สาขา,มูลค่าสินค้า/บริการ,จำนวนภาษีมูลค่าเพิ่ม\n";

    // --- ROWS ---
    relevantTrans.forEach((t, index) => {
      const dateStr = formatDate(t.date);
      const invNo = t.taxInvoiceNo || (t.type === 'income' ? (t.orderId || t.id.slice(0,8)) : '-');
      // For Sales Tax: Customer Name. For Purchase Tax: Vendor Name.
      const name = `"${t.vendorName || t.customerName || t.description || ''}"`;
      const taxId = `"${t.vendorTaxId || t.taxId || ''}"`; // Vendor Tax ID or Customer Tax ID
      const branch = `"${t.vendorBranch || t.branch || '00000'}"`; // Vendor Branch or Customer Branch
      const net = (t.net || 0).toFixed(2);
      const vat = (t.vat || 0).toFixed(2);
      csvContent += `${index+1},${dateStr},${invNo},${name},${taxId},${branch},${net},${vat}\n`;
    });

    // --- TOTAL ---
    const totalNet = relevantTrans.reduce((s,t) => s + (t.net||0), 0).toFixed(2);
    const totalVat = relevantTrans.reduce((s,t) => s + (t.vat||0), 0).toFixed(2);
    csvContent += `,,,,,,${totalNet},${totalVat}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `รายงาน${isSales ? 'ภาษีขาย' : 'ภาษีซื้อ'}_${month+1}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAskTax = async () => {
    if (!taxQuestion.trim()) return;
    setIsTaxLoading(true);
    const prompt = `Act as Thai Tax Expert. Answer in Thai. Question: ${taxQuestion}`;
    const result = await GeminiService.call(prompt);
    setTaxAnswer(result || "Error connecting to AI.");
    setIsTaxLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">{['assessment', 'vat', 'consult'].map(tab => (<button key={tab} onClick={()=>setActiveSubTab(tab)} className={`px-4 py-2 rounded-md text-sm font-bold capitalize transition-all ${activeSubTab===tab ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>{tab}</button>))}</div>
      {activeSubTab === 'consult' && (
         <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-8 text-white shadow-xl"><h3 className="text-2xl font-bold mb-2 flex items-center gap-2"><MessageSquare/> AI Tax Consultant</h3><p className="mb-6 opacity-90">สอบถามปัญหาภาษีกับ AI ผู้เชี่ยวชาญ</p><div className="flex gap-2 mb-6"><input className="flex-1 rounded-xl px-4 py-3 text-slate-800 border-0 focus:ring-2 focus:ring-orange-300" placeholder="พิมพ์คำถามที่นี่..." value={taxQuestion} onChange={e=>setTaxQuestion(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleAskTax()} /><button onClick={handleAskTax} disabled={isTaxLoading} className="bg-white text-orange-600 px-6 rounded-xl font-bold hover:bg-orange-50 disabled:opacity-50">{isTaxLoading ? <Loader className="animate-spin"/> : <Send/>}</button></div>{taxAnswer && <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20 animate-fadeIn leading-relaxed">{taxAnswer}</div>}</div>
      )}
      {activeSubTab === 'assessment' && (
         <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between"><div><h3 className="text-yellow-400 font-bold text-lg mb-1">AI Recommendation</h3><p>{assessmentData.recommendation}</p></div><BrainCircuit size={32} className="text-yellow-400 opacity-50"/></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className={`p-6 rounded-2xl border-2 bg-white ${assessmentData.recommendedMethod === 'standard' ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-transparent'}`}><h4 className="font-bold text-slate-700 mb-4 flex justify-between">แบบเหมา 60% {assessmentData.recommendedMethod === 'standard' && <CheckCircle className="text-emerald-500"/>}</h4><div className="space-y-3 text-sm"><div className="flex justify-between"><span>รายได้</span><span className="font-bold">{formatCurrency(assessmentData.totalIncome)}</span></div><div className="flex justify-between text-rose-500"><span>หักค่าใช้จ่าย</span><span>-{formatCurrency(assessmentData.expenseStandard)}</span></div><div className="flex justify-between border-t pt-2 mt-2"><span>ภาษีที่ต้องจ่าย</span><span className="text-2xl font-bold text-slate-800">{formatCurrency(assessmentData.taxStandard)}</span></div></div></div>
               <div className={`p-6 rounded-2xl border-2 bg-white ${assessmentData.recommendedMethod === 'actual' ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-transparent'}`}><h4 className="font-bold text-slate-700 mb-4 flex justify-between">แบบตามจริง {assessmentData.recommendedMethod === 'actual' && <CheckCircle className="text-emerald-500"/>}</h4><div className="space-y-3 text-sm"><div className="flex justify-between"><span>รายได้</span><span className="font-bold">{formatCurrency(assessmentData.totalIncome)}</span></div><div className="flex justify-between text-rose-500"><span>หักค่าใช้จ่ายจริง</span><span>-{formatCurrency(assessmentData.actualExpense)}</span></div><div className="flex justify-between border-t pt-2 mt-2"><span>ภาษีที่ต้องจ่าย</span><span className="text-2xl font-bold text-slate-800">{formatCurrency(assessmentData.taxActual)}</span></div></div></div>
            </div>
         </div>
      )}
      {activeSubTab === 'vat' && (
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-fadeIn">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-700">VAT Summary (ภ.พ.30)</h3><div className="flex gap-2"><select value={month} onChange={e=>setMonth(Number(e.target.value))} className="bg-slate-50 border-0 rounded p-2 text-sm font-bold">{['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'].map((m,i)=><option key={i} value={i}>{m}</option>)}</select><select value={year} onChange={e=>setYear(Number(e.target.value))} className="bg-slate-50 border-0 rounded p-2 text-sm font-bold"><option value={2024}>2024</option><option value={2025}>2025</option></select></div></div>
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
                  <button onClick={() => exportVATReport(vatTab)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm transition-all"><Download size={16}/> Export CSV</button>
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

// ... (Rest of the components: StockManager, App remain unchanged) ...

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
          <div className="hidden sm:block text-xs text-slate-400 font-medium px-3 py-1 bg-slate-100 rounded-full border border-slate-200">v3.4.0 Tax Report Ready</div>
        </header>
        <div className="flex-1 overflow-auto p-2 lg:p-6 relative scroll-smooth w-full">{renderContent()}</div>
      </main>
    </div>
  );
}
