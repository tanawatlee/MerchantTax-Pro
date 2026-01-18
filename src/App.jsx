import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PieChart, Wallet, FileText, Calculator, Save, TrendingUp, TrendingDown, 
  Download, Trash2, Edit, Menu, X, Printer, 
  CheckCircle, Loader, Target, User, Package, Search, Send, Clock, List, Settings, PlusCircle, Tag,
  MessageCircle, Store, Code, Database, Image as ImageIcon, ChevronRight, Layout, BarChart2, DollarSign, Activity, MapPin, FileCheck, CheckSquare, XSquare, ShoppingBag, Eye, EyeOff, Inbox, XCircle, CreditCard, AlertTriangle, RefreshCw, Layers
} from 'lucide-react';

// --- Import Firebase ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, serverTimestamp, updateDoc, setDoc, getDocs, where, increment, writeBatch } from 'firebase/firestore';

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
  IDS: { PROD: 'eatsanduse', DEV: 'merchant-tax-dev-v1' },
  SHOPS: ['eats and use', 'bubee bubee', 'ไม่ระบุ'],
  CATEGORIES: {
    INCOME: ['สินค้าทั่วไป', 'บริการ', 'อาหาร/เครื่องดื่ม', 'อื่นๆ'],
    EXPENSE: ['ค่าใช้จ่ายทั่วไป', 'ต้นทุนสินค้า', 'สินค้าเสียหาย/หมดอายุ', 'ค่าบริการ/จ้างทำของ', 'ค่าโฆษณา (ในประเทศ)', 'ค่าโฆษณา (ภ.พ.36)', 'ค่าธรรมเนียม Platform', 'ค่าขนส่ง', 'ค่าเช่า', 'เงินเดือน', 'ภาษี/เบี้ยปรับ', 'ส่วนลดร้านค้า']
  },
  CHANNELS: ['Shopee', 'Lazada', 'TikTok', 'Line Shopping', 'Facebook', 'หน้าร้าน'],
  VAT_RATES: { INCLUDED: 'included', EXCLUDED: 'excluded', NONE: 'none' }
};

// --- GLOBAL STYLES ---
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap'); 
  .font-sarabun { font-family: 'Sarabun', sans-serif !important; } 
  ::-webkit-scrollbar { width: 6px; height: 6px; } 
  ::-webkit-scrollbar-track { background: transparent; } 
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; } 
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; } 
  @media print { 
    body * { visibility: hidden; } 
    #invoice-preview-area, #invoice-preview-modal-area, #invoice-preview-area *, #invoice-preview-modal-area * { visibility: visible; } 
    #invoice-preview-area, #invoice-preview-modal-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; transform: scale(1); } 
    @page { size: auto; margin: 0mm; } 
    .no-print { display: none !important; } 
  }
`;

// --- Firebase Initialization ---
const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Utility Functions ---
const normalizeDate = (dateInput) => {
  if (!dateInput) return new Date();
  if (typeof dateInput.toDate === 'function') return dateInput.toDate();
  return new Date(dateInput);
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
};

const formatCompactNumber = (number) => {
  return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(number);
};

const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = normalizeDate(dateInput);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
};

const formatDateISO = (dateInput) => {
  const date = normalizeDate(dateInput);
  if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

const ArabicToThaiBaht = (num) => {
  const numberText = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const unitText = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  let bahtText = "";
  
  if (!num || isNaN(num)) return "ศูนย์บาทถ้วน";
  
  num = parseFloat(num).toFixed(2);
  const [intPart, decimalPart] = num.split(".");

  if (parseFloat(num) === 0) return "ศูนย์บาทถ้วน";

  for (let i = 0; i < intPart.length; i++) {
    let n = parseInt(intPart[i]);
    let p = intPart.length - i - 1;
    if (n !== 0) {
      if (p % 6 === 1 && n === 1) bahtText += "";
      else if (p % 6 === 1 && n === 2) bahtText += "ยี่";
      else if (p % 6 === 0 && n === 1 && i > 0) bahtText += "เอ็ด";
      else bahtText += numberText[n];
      bahtText += unitText[p % 6];
    }
    if (p > 0 && p % 6 === 0) bahtText += "ล้าน";
  }
  if (intPart !== "0") bahtText += "บาท";

  if (decimalPart === "00") {
    bahtText += "ถ้วน";
  } else {
    for (let i = 0; i < decimalPart.length; i++) {
      let n = parseInt(decimalPart[i]);
      let p = decimalPart.length - i - 1;
      if (n !== 0) {
        if (p === 1 && n === 1) bahtText += "";
        else if (p === 1 && n === 2) bahtText += "ยี่";
        else if (p === 0 && n === 1 && i > 0) bahtText += "เอ็ด";
        else bahtText += numberText[n];
        bahtText += unitText[p];
      }
    }
    bahtText += "สตางค์";
  }
  return bahtText;
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

const exportToExcel = (fileName, data, headerInfo = []) => {
    if (!window.XLSX) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        script.onload = () => exportToExcel(fileName, data, headerInfo);
        document.body.appendChild(script);
        return;
    }
    const wb = window.XLSX.utils.book_new();
    const ws = window.XLSX.utils.aoa_to_sheet([...headerInfo, ...data]);
    window.XLSX.utils.book_append_sheet(wb, ws, "Report");
    window.XLSX.writeFile(wb, fileName);
};

const SmartTaxAI = {
  async generate(prompt, imageBase64 = null, expectJSON = false) {
    const apiKey = ""; 
    if (!apiKey) return null;
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=" + apiKey;
    try {
      const parts = [{ text: prompt }];
      if (imageBase64) parts.push({ inlineData: { mimeType: "image/png", data: imageBase64.split(',')[1] } });
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] }) });
      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (expectJSON && text) {
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          try { return JSON.parse(text); } catch (e) { return null; }
      }
      return text;
    } catch (error) { return null; }
  }
};

// --- Shared Components ---

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-[100dvh] bg-slate-50 text-indigo-600 font-sarabun text-center">
    <Loader className="animate-spin mb-4" size={40} />
    <p className="text-sm font-medium animate-pulse">กำลังซิงค์ข้อมูลร้านค้า...</p>
  </div>
);

const ToastContainer = ({ toasts, removeToast }) => (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
            <div key={t.id} className={"pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border animate-in slide-in-from-right-full duration-300 " + (t.type === 'error' ? 'bg-white border-rose-100 text-rose-600' : 'bg-white border-emerald-100 text-emerald-600')}>
                {t.type === 'error' ? <XCircle size={20} className="flex-shrink-0"/> : <CheckCircle size={20} className="flex-shrink-0"/>}
                <p className="text-sm font-bold">{t.message}</p>
                <button onClick={() => removeToast(t.id)} className="ml-2 text-slate-300 hover:text-slate-500"><X size={14}/></button>
            </div>
        ))}
    </div>
);

const NavButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={"w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group " + (active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white')}>
    <div className={"transition-transform duration-200 " + (active ? 'scale-110' : 'group-hover:scale-110')}>{icon}</div>
    <span className="font-medium tracking-wide text-sm">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>}
  </button>
);

const StatCard = ({ title, value, trend, color, icon, subtitle }) => {
  const styles = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    rose: { bg: "bg-rose-50", text: "text-rose-600" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" }
  };
  const currentStyle = styles[color] || styles.indigo;
  
  const renderTrend = () => {
    if (trend === undefined || trend === null) return null;
    const isPos = trend > 0;
    return (
      <span className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-bold ${trend === 0 ? 'bg-slate-100 text-slate-500' : isPos ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
        {trend === 0 ? '' : isPos ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
        {Math.abs(trend).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-slate-100 bg-white">
      <div className="flex justify-between items-start mb-4 relative z-10 text-left">
         <div className="text-left">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 opacity-80">{title}</p>
            <h3 className={"text-2xl lg:text-3xl font-bold tracking-tight " + currentStyle.text}>{formatCurrency(value)}</h3>
         </div>
         <div className={"p-3 rounded-2xl " + currentStyle.bg + " " + currentStyle.text + " shadow-sm"}>{icon}</div>
      </div>
      <div className="flex items-center gap-3 text-xs font-medium relative z-10 text-left">
        {renderTrend()}
        <span className="text-slate-400 text-left">{subtitle}</span>
      </div>
    </div>
  );
};

const downloadInvoicePDF = async (elementId, invNo, showToast) => {
    const element = document.getElementById(elementId); 
    if (!element) return;
    
    showToast("กำลังเตรียมไฟล์ PDF...", "success");
    
    const loadScript = (src) => new Promise(res => { const s = document.createElement('script'); s.src = src; s.onload = res; document.body.appendChild(s); });
    if (!window.html2pdf) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
    if (!window.JSZip) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
    
    const zip = new window.JSZip();
    
    const generatePDFBlob = async (statusLabel, scale = 2) => {
        const badge = element.querySelector('.status-badge');
        if (badge) badge.innerText = statusLabel;

        await new Promise(res => setTimeout(res, 300)); 
        const opt = { margin: 0, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: scale, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
        return await window.html2pdf().set(opt).from(element).output('blob');
    };
    
    try {
        const originalBlob = await generatePDFBlob('ต้นฉบับ (Original)');
        const copyBlob = await generatePDFBlob('สำเนา (Copy)');
        const badge = element.querySelector('.status-badge');
        if (badge) badge.innerText = 'ต้นฉบับ (Original)';

        const folderName = invNo || "INVOICE";
        
        zip.file(folderName + "/" + invNo + "_ต้นฉบับ.pdf", originalBlob);
        zip.file(folderName + "/" + invNo + "_สำเนา.pdf", copyBlob);
        
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a'); 
        link.href = URL.createObjectURL(content); 
        link.download = invNo + ".zip"; 
        link.click();
        
        showToast("ดาวน์โหลดสำเร็จ", "success");
    } catch (e) { 
        console.error(e);
        showToast("เกิดข้อผิดพลาด", "error"); 
    }
};

const Dashboard = ({ transactions, invoices }) => {
  const [period, setPeriod] = useState('month'); 
  const [showValues, setShowValues] = useState(true);
  const [shopFilter, setShopFilter] = useState('all');

  const analytics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const getRange = (p, offset = 0) => {
        const d = new Date(today);
        let start, end;
        if (p === 'day') { d.setDate(d.getDate() - offset); start = new Date(d); end = new Date(d); } 
        else if (p === 'week') { d.setDate(d.getDate() - (offset * 7)); const day = d.getDay(); start = new Date(d); start.setDate(d.getDate() - day); end = new Date(start); end.setDate(start.getDate() + 6); } 
        else if (p === 'month') { d.setMonth(d.getMonth() - offset); start = new Date(d.getFullYear(), d.getMonth(), 1); end = new Date(d.getFullYear(), d.getMonth() + 1, 0); } 
        else if (p === 'year') { d.setFullYear(d.getFullYear() - offset); start = new Date(d.getFullYear(), 0, 1); end = new Date(d.getFullYear(), 11, 31); } 
        else { return { start: new Date(0), end: new Date() }; }
        start.setHours(0,0,0,0); end.setHours(23,59,59,999); return { start, end };
    };

    const currentRange = getRange(period, 0);
    const prevRange = getRange(period, 1);

    const filteredTransactions = transactions.filter(t => shopFilter === 'all' || t.shop === shopFilter);
    const filteredInvoices = invoices.filter(i => shopFilter === 'all' || i.shop === shopFilter);

    const filterTrans = (range) => filteredTransactions.filter(t => t.date >= range.start && t.date <= range.end);
    const currTrans = filterTrans(currentRange);
    const prevTrans = filterTrans(prevRange);

    const sumTotal = (arr, type) => arr.filter(t => t.type === type).reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    
    const totalIncome = sumTotal(currTrans, 'income');
    const totalExpense = sumTotal(currTrans, 'expense');
    
    const prevIncome = sumTotal(prevTrans, 'income');
    const prevExpense = sumTotal(prevTrans, 'expense');
    
    const incomeTrend = prevIncome === 0 ? 0 : ((totalIncome - prevIncome) / prevIncome) * 100;
    const expenseTrend = prevExpense === 0 ? 0 : ((totalExpense - prevExpense) / prevExpense) * 100;
    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const operatingRatio = totalIncome > 0 ? (totalExpense / totalIncome) : 0;

    const trendMap = {};
    currTrans.forEach(t => {
      const label = period === 'year' ? t.date.toLocaleDateString('th-TH', { month: 'short' }) : t.date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      if(!trendMap[label]) trendMap[label] = { income: 0, expense: 0 };
      if(t.type === 'income') trendMap[label].income += Number(t.total);
      else trendMap[label].expense += Number(t.total);
    });
    const trendData = Object.entries(trendMap).map(([label, data]) => ({ label, ...data }));

    const expenseByCategory = {};
    currTrans.filter(t => t.type === 'expense').forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + Number(t.total);
    });
    const topExpenses = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value, percent: totalExpense > 0 ? (value / totalExpense) * 100 : 0 })).sort((a,b) => b.value - a.value).slice(0, 5);

    const incomeByChannel = {};
    currTrans.filter(t => t.type === 'income').forEach(t => {
        const ch = t.channel || 'หน้าร้าน';
        incomeByChannel[ch] = (incomeByChannel[ch] || 0) + Number(t.total);
    });
    const topIncomes = Object.entries(incomeByChannel).map(([name, value]) => ({ name, value, percent: totalIncome > 0 ? (value / totalIncome) * 100 : 0 })).sort((a,b) => b.value - a.value).slice(0, 5);

    const estimatedTax = calculateProgressiveTax(totalIncome * 0.4); 
    const unpaidTotal = filteredInvoices.filter(inv => inv.type === 'invoice' && inv.status !== 'paid').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    const avgTicket = currTrans.filter(t => t.type === 'income').length > 0 ? totalIncome / currTrans.filter(t => t.type === 'income').length : 0;

    return { totalIncome, totalExpense, incomeTrend, expenseTrend, netProfit, profitMargin, operatingRatio, trendData, topExpenses, topIncomes, estimatedTax, unpaidTotal, avgTicket };
  }, [transactions, invoices, period, shopFilter]);

  return (
    <div className="space-y-6 w-full max-w-[2400px] mx-auto pb-10 animate-fadeIn p-4 md:p-6 bg-slate-50/50 text-left">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-left">
            <div className="text-left w-full"><h2 className="text-2xl font-bold text-slate-800 tracking-tight">Business Dashboard Pro</h2><p className="text-slate-500 text-sm">วิเคราะห์ผลประกอบการแบบ Real-time</p></div>
            <div className="flex gap-2">
                <select className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 text-sm font-bold text-slate-600" value={shopFilter} onChange={e=>setShopFilter(e.target.value)}>
                    <option value="all">ทั้งหมด (All Shops)</option>
                    {CONSTANTS.SHOPS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">{['day', 'week', 'month', 'year', 'all'].map(p => (<button key={p} onClick={() => setPeriod(p)} className={"px-4 py-2 rounded-lg text-xs font-bold transition-all " + (period === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50')}>{p === 'day' ? 'วันนี้' : p === 'week' ? 'สัปดาห์นี้' : p === 'month' ? 'เดือนนี้' : p === 'year' ? 'ปีนี้' : 'ทั้งหมด'}</button>))}</div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="รายรับรวม (Income)" value={analytics.totalIncome} trend={analytics.incomeTrend} color="emerald" icon={<TrendingUp />} subtitle="เทียบกับช่วงก่อนหน้า" />
            <StatCard title="รายจ่ายรวม (Expense)" value={analytics.totalExpense} trend={analytics.expenseTrend} color="rose" icon={<TrendingDown />} subtitle="เทียบกับช่วงก่อนหน้า" />
            <StatCard title="กำไรสุทธิ (Net Profit)" value={analytics.netProfit} color="indigo" icon={<Wallet />} subtitle={"Margin: " + analytics.profitMargin.toFixed(1) + "%"} />
            <StatCard title="ลูกหนี้การค้า (Unpaid)" value={analytics.unpaidTotal} color="amber" icon={<Clock />} subtitle="ยอดรอเรียกเก็บ" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center text-left">
                <div className="flex justify-between items-end mb-4 text-left">
                    <div className="text-left">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2 text-left"><Activity className="text-rose-500"/> Financial Health (Operating Ratio)</h3>
                        <p className="text-xs text-slate-400 text-left">สัดส่วนรายจ่ายต่อรายได้ (ยิ่งน้อยยิ่งดี)</p>
                    </div>
                    <span className={`text-2xl font-bold ${analytics.operatingRatio > 0.8 ? 'text-rose-500' : analytics.operatingRatio > 0.5 ? 'text-amber-500' : 'text-emerald-500'}`}>{(analytics.operatingRatio * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden relative">
                    <div className={`h-full rounded-full transition-all duration-1000 ${analytics.operatingRatio > 0.8 ? 'bg-rose-500' : analytics.operatingRatio > 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{width: Math.min(analytics.operatingRatio * 100, 100) + "%"}}></div>
                </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg flex items-center justify-between relative overflow-hidden text-left">
                 <div className="relative z-10 text-left">
                     <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 text-left">ประมาณการภาษี (Est. Tax)</p>
                     <h3 className="text-3xl font-bold tracking-tight text-left">{formatCurrency(analytics.estimatedTax)}</h3>
                     <p className="text-xs text-slate-500 mt-2 text-left">คำนวณแบบเหมาจ่าย 60% เบื้องต้น</p>
                 </div>
                 <div className="p-4 rounded-full bg-white/10 text-white relative z-10"><Calculator size={32}/></div>
                 <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[400px] text-left">
                <div className="flex justify-between items-center mb-6 text-left">
                    <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2 text-left"><BarChart2 className="text-indigo-500"/> แนวโน้มรายรับ-รายจ่าย</h3>
                    <button onClick={() => setShowValues(!showValues)} className={"text-xs px-3 py-1.5 rounded-lg font-bold border flex items-center gap-2 transition-all " + (showValues ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-500 border-slate-200')}>
                        {showValues ? <Eye size={14}/> : <EyeOff size={14}/>} {showValues ? 'ซ่อนตัวเลข' : 'แสดงตัวเลข'}
                    </button>
                </div>
                <div className="flex-1 flex items-end gap-2 overflow-x-auto pb-4 px-2 relative text-left">
                    {analytics.trendData.length > 0 ? analytics.trendData.map((d, i) => {
                        const maxVal = Math.max(...analytics.trendData.map(x => Math.max(x.income, x.expense))) || 1;
                        return (
                            <div key={i} className="flex-1 min-w-[60px] flex flex-col items-center gap-2 h-full justify-end group text-left">
                                {showValues && (
                                    <div className="flex flex-col items-center text-[8px] font-bold w-full opacity-60 gap-0.5 pointer-events-none mb-1 text-center">
                                        <span className="text-emerald-600">+{formatCompactNumber(d.income)}</span>
                                        <span className="text-rose-500">-{formatCompactNumber(d.expense)}</span>
                                    </div>
                                )}
                                <div className="flex gap-1 items-end w-full justify-center h-[70%] text-center">
                                    <div className="w-3 bg-emerald-400 rounded-t-sm transition-all group-hover:bg-emerald-500" style={{height: (d.income/maxVal)*100 + "%"}}></div>
                                    <div className="w-3 bg-rose-400 rounded-t-sm transition-all group-hover:bg-rose-500" style={{height: (d.expense/maxVal)*100 + "%"}}></div>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 truncate w-full text-center">{d.label}</span>
                            </div>
                        )
                    }) : <div className="w-full h-full flex items-center justify-center text-slate-300">ไม่มีข้อมูล</div>}
                </div>
            </div>

            <div className="flex flex-col gap-6 text-left">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col text-left">
                    <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-4 text-left"><ShoppingBag className="text-emerald-500" size={18}/> แหล่งที่มารายได้</h3>
                    <div className="space-y-3 text-left">
                        {analytics.topIncomes.length > 0 ? analytics.topIncomes.map((e, i) => (
                            <div key={i} className="text-left">
                                <div className="flex justify-between text-[11px] mb-1 font-bold text-left"><span className="text-slate-600 text-left">{e.name}</span><span className="text-slate-800">{e.percent.toFixed(1)}%</span></div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden text-left"><div className="h-full rounded-full bg-emerald-400" style={{width: e.percent + "%"}}></div></div>
                            </div>
                        )) : <p className="text-xs text-slate-400">ไม่มีข้อมูล</p>}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col text-left">
                    <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-4 text-left"><PieChart className="text-rose-500" size={18}/> รายจ่ายตามหมวดหมู่</h3>
                    <div className="space-y-3 text-left">
                        {analytics.topExpenses.length > 0 ? analytics.topExpenses.map((e, i) => (
                            <div key={i} className="text-left">
                                <div className="flex justify-between text-[11px] mb-1 font-bold text-left"><span className="text-slate-600 text-left">{e.name}</span><span className="text-slate-800">{e.percent.toFixed(1)}%</span></div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden text-left"><div className="h-full rounded-full bg-rose-400" style={{width: e.percent + "%"}}></div></div>
                            </div>
                        )) : <p className="text-xs text-slate-400 text-left">ไม่มีข้อมูล</p>}
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-8 items-center text-left">
            <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><DollarSign size={24}/></div>
                <div className="text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase text-left">ยอดขายเฉลี่ย (Ticket Size)</p>
                    <p className="text-xl font-bold text-slate-700 text-left">{formatCurrency(analytics.avgTicket)}</p>
                </div>
            </div>
             <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><FileText size={24}/></div>
                <div className="text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase text-left">เปิดบิลค้างชำระ</p>
                    <p className="text-xl font-bold text-slate-700 text-left">{formatCurrency(analytics.unpaidTotal)}</p>
                </div>
            </div>
        </div>
    </div>
  );
};

const InvoicePreviewModal = ({ transaction, onClose, showToast }) => {
    const savedSeller = JSON.parse(localStorage.getItem('merchant_seller_info') || '{}');
    const sub = transaction.net || transaction.amount || 0;
    const vat = transaction.vat || 0;
    const total = transaction.total || 0;
    const discount = transaction.discount || transaction.shopDiscount || 0;
    const preVat = transaction.preVat || sub - discount;
    const items = transaction.items || [{ desc: transaction.description, amount: transaction.total, qty: 1 }];

    const handleDownload = () => {
          downloadInvoicePDF('invoice-preview-modal-area', transaction.invNo || "DRAFT", showToast);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto font-sarabun text-left">
            <div className="bg-white rounded-[32px] w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl animate-fadeIn overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50 text-left">
                    <div className="text-left w-full">
                        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><Printer className="text-indigo-600"/> Preview ใบกำกับภาษี (Template Pro)</h3>
                        <p className="text-xs text-slate-500">รูปแบบเอกสารเดียวกับเมนูออกใบกำกับภาษี</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X/></button>
                </div>
                <div className="flex-1 overflow-auto bg-slate-200 p-4 md:p-10 flex justify-center">
                    <div id="invoice-preview-modal-area" className="bg-white p-[30px] w-[210mm] min-h-[296mm] text-sm text-slate-900 leading-relaxed shadow-xl box-border text-left relative">
                        <div className="flex justify-between items-start mb-8 text-left">
                            <div className="w-[65%] flex items-center gap-5 text-left">
                                {savedSeller.logo && <img src={savedSeller.logo} className="w-[90px] h-[90px] object-contain flex-shrink-0" alt="Logo"/>}
                                <div className="flex flex-col justify-center text-left">
                                    <h2 className="text-xl font-bold text-slate-900 mb-1 leading-tight text-left">{savedSeller.sellerName || 'กรุณาระบุชื่อร้านค้า'}</h2>
                                    <p className="text-slate-600 text-xs mb-1 text-left">{[savedSeller.sellerAddress, savedSeller.sellerSubDistrict, savedSeller.sellerDistrict, savedSeller.sellerProvince, savedSeller.sellerZipCode].filter(Boolean).join(' ')}</p>
                                    <div className="text-xs text-slate-700 leading-snug">
                                        <p className="text-left"><b>เลขผู้เสียภาษี:</b> {savedSeller.sellerTaxId || '-'} <b>สาขา:</b> {savedSeller.sellerBranchId || '00000'}</p>
                                        <p className="text-left"><b>โทร:</b> {savedSeller.sellerPhone || '-'} {savedSeller.sellerEmail && <><b>Email:</b> {savedSeller.sellerEmail}</>}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right w-[35%] flex flex-col items-end text-right">
                                <div className="text-lg font-bold uppercase mb-1 text-right">ใบกำกับภาษี / ใบเสร็จรับเงิน</div>
                                <div className="border border-slate-300 p-2 w-full max-w-[200px]">
                                    <div className="flex justify-between mb-1 text-right"><span className="text-xs text-slate-500 font-bold">เลขที่ (No.)</span><span className="font-bold">{transaction.invNo || "AUTO-XXXXXX"}</span></div>
                                    <div className="flex justify-between text-right"><span className="text-xs text-slate-500 font-bold">วันที่ (Date)</span><span>{formatDate(transaction.date)}</span></div>
                                    <div className="flex justify-between text-right"><span className="text-xs text-slate-500 font-bold">Order ID</span><span>{transaction.orderId || "-"}</span></div>
                                </div>
                                <div className="mt-2 text-right"><span className="px-3 py-1 border rounded text-xs font-bold uppercase border-black text-black status-badge">ต้นฉบับ (Original)</span></div>
                            </div>
                        </div>
                        <div className="border border-slate-300 p-4 mb-4 flex gap-4 text-left">
                            <div className="flex-1 text-left">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1 text-left">ลูกค้า (Customer)</div>
                                <p className="font-bold text-base mb-1 text-left">{transaction.customerName || 'ลูกค้าทั่วไป'}</p>
                                {transaction.address && (
                                    <p className="text-xs text-slate-600 mb-1">{transaction.address}</p>
                                )}
                                {(transaction.taxId || transaction.branch) && (
                                    <p className="text-xs text-slate-700">
                                        <b>เลขผู้เสียภาษี:</b> {transaction.taxId || '-'} <b>สาขา:</b> {transaction.branch || '00000'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <table className="w-full mb-6 border-collapse text-left">
                            <thead><tr className="bg-slate-100 text-slate-800 font-bold text-xs uppercase text-center"><th className="py-2 border-y border-slate-300 w-12">ลำดับ<br/>No.</th><th className="py-2 border-y border-slate-300 text-left pl-4">รายการสินค้า / บริการ<br/>Description</th><th className="py-2 border-y border-slate-300 w-20">จำนวน<br/>Qty</th><th className="py-2 border-y border-slate-300 w-24">หน่วยละ<br/>Unit Price</th><th className="py-2 border-y border-slate-300 w-28">จำนวนเงิน<br/>Amount</th></tr></thead>
                            <tbody className="text-left">
                                {items.map((it, idx) => (
                                    <tr key={idx}><td className="py-2 border-b border-slate-200 text-center align-top">{idx+1}</td><td className="py-2 border-b border-slate-200 pl-4 align-top text-left">{it.desc}</td><td className="py-2 border-b border-slate-200 text-center align-top">{it.qty || 1}</td><td className="py-2 border-b border-slate-200 text-right pr-2 align-top">{formatCurrency(it.amount || it.price)}</td><td className="py-2 border-b border-slate-200 text-right pr-2 font-bold align-top">{formatCurrency((it.qty || 1) * (it.amount || it.price))}</td></tr>
                                ))}
                                {[...Array(Math.max(0, 5 - items.length))].map((_, i) => (<tr key={"empty-" + i} className="h-8"><td className="border-b border-slate-100" colSpan="5"></td></tr>))}
                            </tbody>
                        </table>

                        <div className="flex justify-between items-start">
                            <div className="w-[55%] pt-2">
                                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-left">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">ตัวอักษร (Total in Words)</span>
                                    <span className="font-bold text-slate-800">{ArabicToThaiBaht(total)}</span>
                                </div>
                            </div>
                            <div className="w-[40%] text-right">
                                <div className="grid grid-cols-[auto_auto] gap-y-2 text-right text-sm">
                                    <span className="font-bold text-slate-600 text-right">รวมเป็นเงิน</span><span className="font-medium">{formatCurrency(sub)}</span>
                                    {discount > 0 && <><span className="font-bold text-rose-600 text-right">หักส่วนลด</span><span className="text-rose-600">-{formatCurrency(discount)}</span></>}
                                    <span className="font-bold text-slate-600 text-right">มูลค่าสินค้า (Pre-VAT)</span><span className="font-medium">{formatCurrency(preVat)}</span>
                                    <span className="font-bold text-slate-600 text-right">ภาษีมูลค่าเพิ่ม 7%</span><span className="font-medium">{formatCurrency(vat)}</span>
                                    <div className="col-span-2 border-t border-black my-1"></div>
                                    <span className="font-bold text-slate-900 text-lg text-right">จำนวนเงินทั้งสิ้น</span><span className="font-bold text-slate-900 text-lg">{formatCurrency(total)}</span>
                                    <div className="col-span-2 border-t-2 border-black my-0.5"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-12 px-8 absolute bottom-10 w-[calc(100%-60px)] text-center">
                            <div className="text-center w-[40%] text-slate-700">
                                <div className="border-b border-dotted border-slate-400 h-8 mb-2"></div>
                                <p className="text-xs font-bold">ผู้รับวางบิล / ผู้รับของ</p>
                                <p className="text-xs font-bold text-slate-400 uppercase">(Receiver Signature)</p>
                            </div>
                            <div className="text-center w-[40%] text-slate-700">
                                <div className="border-b border-dotted border-slate-400 h-8 mb-2"></div>
                                <p className="text-xs font-bold">ผู้รับเงิน / ผู้ออกใบกำกับภาษี</p>
                                <p className="text-xs text-slate-400 uppercase">(Authorized Signature)</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t bg-white flex flex-wrap gap-4 text-center">
                    <button onClick={onClose} className="flex-1 min-w-[120px] py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700">ปิด</button>
                    <button onClick={handleDownload} className="flex-1 min-w-[200px] py-4 rounded-2xl bg-slate-800 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all"><Download size={20}/> Download ZIP</button>
                </div>
            </div>
        </div>
    );
};

const RecordManager = ({ user, transactions, invoices, appId, showToast }) => {
  const [subTab, setSubTab] = useState('new'); 
  const [histFilterType, setHistFilterType] = useState('all');
  const [deleteId, setDeleteId] = useState(null); 
  const [isDeleting, setIsDeleting] = useState(false);
  const [recentSearch, setRecentSearch] = useState('');
  const [historySearch, setHistorySearch] = useState(''); 
  const [editingId, setEditingId] = useState(null);
  const [previewInvoiceTransaction, setPreviewInvoiceTransaction] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');
  
  const [stockProducts, setStockProducts] = useState([]);
  const [inventoryLots, setInventoryLots] = useState([]); 

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState('year'); 
  const currentYear = new Date().getFullYear();

  const initialForm = { 
    type: 'income', 
    shop: CONSTANTS.SHOPS[0], 
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
    vendorBranchName: '', 
    vendorAddress: '', 
    expenseDiscount: '', 
    grossAmount: '',
    items: [{ desc: '', qty: 1, amount: '' }],
    customerShipping: '', 
    platformFee: '', 
    shippingCost: '', 
    shopDiscount: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [filterType, setFilterType] = useState('all');
  const [magicPrompt, setMagicPrompt] = useState('');
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isEcommerceMode, setIsEcommerceMode] = useState(false);

  useEffect(() => { setIsEcommerceMode(formData.type === 'income' && ['Shopee', 'Lazada', 'TikTok'].includes(formData.channel)); }, [formData.channel, formData.type]);

  useEffect(() => {
      if (user) {
          const unsubVendors = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'vendors')), (snap) => setVendors(snap.docs.map(d=>({id:d.id, ...d.data()}))));
          const unsubStock = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'products')), (snap) => setStockProducts(snap.docs.map(d=>({id:d.id, ...d.data()}))));
          const unsubLots = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'inventory_lots')), (snap) => setInventoryLots(snap.docs.map(d=>({id:d.id, ...d.data()}))));
          return () => { unsubVendors(); unsubStock(); unsubLots(); };
      }
  }, [user, appId]);
    
  const calculated = useMemo(() => { 
      let baseAmount = 0;
      if (formData.items.length > 0) {
          baseAmount = formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      } else {
          baseAmount = parseFloat(formData.amount) || 0;
      }
      
      const expDiscount = parseFloat(formData.expenseDiscount) || 0;
      const totalAfterDiscount = baseAmount - expDiscount;

      const custShip = parseFloat(formData.customerShipping) || 0;
      const platFee = parseFloat(formData.platformFee) || 0;
      const shipCost = parseFloat(formData.shippingCost) || 0;
      const shopDisc = parseFloat(formData.shopDiscount) || 0;
      
      const estimatedPayout = (baseAmount + custShip) - (platFee + shipCost + shopDisc);

      let net = 0, vat = 0; 
      const finalAmount = formData.type === 'expense' ? totalAfterDiscount : baseAmount;

      if (formData.vatType === 'included') { net = finalAmount * 100 / 107; vat = finalAmount - net; } 
      else if (formData.vatType === 'excluded') { net = finalAmount; vat = finalAmount * 0.07; } 
      else { net = finalAmount; vat = 0; } 
      
      return { 
          net, 
          vat, 
          total: formData.vatType === 'excluded' ? net + vat : finalAmount, 
          baseAmount, 
          estimatedPayout,
          totalAfterDiscount
      }; 
  }, [formData.amount, formData.vatType, formData.type, formData.items, formData.customerShipping, formData.platformFee, formData.shippingCost, formData.shopDiscount, formData.expenseDiscount]);
  
  const getCollectionName = (type) => type === 'income' ? 'transactions_income' : 'transactions_expense';

  const saveVendorProfile = async () => {
      if (!formData.vendorName) { showToast("กรุณาระบุชื่อร้านค้า", "error"); return; }
      try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'vendors'), {
              vendorName: formData.vendorName,
              vendorTaxId: formData.vendorTaxId || '',
              vendorBranch: formData.vendorBranch || '',
              vendorBranchName: formData.vendorBranchName || '',
              vendorAddress: formData.vendorAddress || '',
              createdAt: serverTimestamp()
          });
          showToast("บันทึกข้อมูลผู้ขายเรียบร้อย", "success");
      } catch (e) { showToast("บันทึกไม่สำเร็จ", "error"); }
  };

  const updateStockFIFO = async (items, transactionType, totalDiscount = 0) => {
      const totalLineItemsAmount = items.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

      for (const item of items) {
          if (!item.desc) continue;
          
          const product = stockProducts.find(p => p.name === item.desc);
          if (!product) continue;

          const qtyChange = Number(item.qty) || 1;

          if (transactionType === 'income') {
              let remainingToDeduct = qtyChange;
              const productLots = inventoryLots
                  .filter(l => l.productId === product.id && l.remainingQty > 0)
                  .sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);

              for (const lot of productLots) {
                  if (remainingToDeduct <= 0) break;
                  const deductAmount = Math.min(remainingToDeduct, lot.remainingQty);
                  await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventory_lots', lot.id), {
                      remainingQty: lot.remainingQty - deductAmount
                  });
                  remainingToDeduct -= deductAmount;
              }
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', product.id), {
                  stock: increment(-qtyChange)
              });
          } else {
              const itemAmount = parseFloat(item.amount) || 0;
              const discountRatio = totalLineItemsAmount > 0 ? itemAmount / totalLineItemsAmount : 0;
              const allocatedDiscount = discountRatio * totalDiscount;
              const netItemCost = Math.max(0, itemAmount - allocatedDiscount);

              await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'inventory_lots'), {
                  productId: product.id,
                  productName: product.name,
                  initialQty: qtyChange,
                  remainingQty: qtyChange,
                  cost: netItemCost, 
                  costPerUnit: netItemCost / qtyChange,
                  createdAt: serverTimestamp()
              });

              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', product.id), {
                  stock: increment(qtyChange),
                  cost: netItemCost / qtyChange 
              });
          }
      }
  };

  const handleSubmit = async (e) => { 
      e.preventDefault(); 
      if (!user) return; 
      try { 
          const dateObj = new Date(formData.date);
          const dateStr = formData.date.replace(/-/g, '');
          const prefix = "INV-" + dateStr;
          
          // คำนวณเลขที่เอกสารใหม่ให้ตรงกับประวัติ
          const qMatch = invoices.filter(inv => inv.invNo && inv.invNo.startsWith(prefix)).length;
          const newInvNo = `${prefix}-${String(qMatch + 1).padStart(3, '0')}`;

          const dataToSave = { 
              ...formData, 
              ...calculated, 
              invNo: newInvNo, // บันทึกลง transaction ด้วย
              amount: calculated.baseAmount, 
              date: dateObj, 
              userId: user.uid,
              customerShipping: parseFloat(formData.customerShipping) || 0,
              platformFee: parseFloat(formData.platformFee) || 0,
              shippingCost: parseFloat(formData.shippingCost) || 0,
              shopDiscount: parseFloat(formData.shopDiscount) || 0,
              expenseDiscount: parseFloat(formData.expenseDiscount) || 0,
          };
          const collectionName = getCollectionName(dataToSave.type);
          
          if (editingId) {
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, editingId), { ...dataToSave, updatedAt: serverTimestamp() }, {merge: true});
          } else {
              await addDoc(collection(db, 'artifacts', appId, 'public', 'data', collectionName), { ...dataToSave, createdAt: serverTimestamp() });
              await updateStockFIFO(formData.items, formData.type, parseFloat(formData.expenseDiscount) || 0);

              if (formData.type === 'income') {
                  const savedSeller = JSON.parse(localStorage.getItem('merchant_seller_info') || '{}');
                  const invoicePayload = {
                      type: 'invoice',
                      docType: 'ใบกำกับภาษี / ใบเสร็จรับเงิน',
                      customerName: 'ลูกค้าทั่วไป',
                      address: '', taxId: '', branch: '00000',
                      items: formData.items.map(it => ({
                          desc: it.desc || 'สินค้า/บริการ',
                          qty: it.qty || 1,
                          unit: 'รายการ',
                          price: parseFloat(it.amount) || 0
                      })),
                      date: dateObj,
                      invNo: newInvNo, 
                      orderId: formData.orderId || '',
                      shop: formData.shop || '', 
                      sellerName: savedSeller.sellerName || '',
                      sellerAddress: savedSeller.sellerAddress || '',
                      sellerTaxId: savedSeller.sellerTaxId || '',
                      sellerBranchId: savedSeller.sellerBranchId || '00000',
                      sellerPhone: savedSeller.sellerPhone || '',
                      sellerEmail: savedSeller.sellerEmail || '',
                      logo: savedSeller.logo || '',
                      vatType: formData.vatType,
                      discount: parseFloat(formData.shopDiscount) || 0, 
                      notes: 'ออกอัตโนมัติจากการบันทึกรายรับ',
                      status: 'paid',
                      sub: calculated.baseAmount,
                      afterDisc: calculated.baseAmount - (parseFloat(formData.shopDiscount) || 0),
                      vat: calculated.vat,
                      total: calculated.total,
                      preVat: calculated.net,
                      createdAt: serverTimestamp()
                  };
                  await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'invoices'), invoicePayload);
                  showToast(`บันทึกรายรับสำเร็จ (เลขที่: ${newInvNo})`, "success");
              } else {
                  showToast("บันทึกรายจ่ายและเพิ่มสต็อกสำเร็จ", "success");
              }
          }
          setFormData(initialForm); setEditingId(null);
      } catch (error) { showToast("บันทึกไม่สำเร็จ: " + error.message, "error"); } 
  };

  const handleEdit = (item) => { 
      setFormData({ 
          ...initialForm, 
          ...item, 
          date: formatDateISO(item.date), 
          amount: item.amount || item.total,
          items: item.items || [{ desc: item.description, qty: 1, amount: item.amount }],
          customerShipping: item.customerShipping || '',
          platformFee: item.platformFee || '',
          shippingCost: item.shippingCost || '',
          shopDiscount: item.shopDiscount || '',
          expenseDiscount: item.expenseDiscount || ''
      }); 
      setEditingId(item.id); 
      setSubTab('new'); 
  };

  const executeDelete = async () => { 
      if (!deleteId) return; setIsDeleting(true); 
      try { 
          const item = transactions.find(t => t.id === deleteId);
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', getCollectionName(item.type), deleteId)); 
          setDeleteId(null); showToast("ลบสำเร็จ", "success"); 
      } catch (err) { setDeleteId(null); } finally { setIsDeleting(false); } 
  };

  const groupedRecent = useMemo(() => { 
    const groups = {}; 
    transactions.filter(t => (filterType === 'all' || t.type === filterType) && (
        t.description?.toLowerCase().includes(recentSearch.toLowerCase()) || 
        t.amount?.toString().includes(recentSearch) || 
        t.orderId?.toLowerCase().includes(recentSearch.toLowerCase())
    )).sort((a,b) => b.date - a.date).slice(0, 50).forEach(t => {
      const k = formatDate(t.date); if(!groups[k]) groups[k] = []; groups[k].push(t);
    });
    return groups;
  }, [transactions, filterType, recentSearch]);

  const exportHistoryExcel = () => {
    const data = [['วันที่', 'ประเภท', 'หมวดหมู่', 'รายละเอียด', 'จำนวนเงิน', 'ร้านค้า'], ...transactions.map(t => [formatDate(t.date), t.type, t.category, t.description, t.total, t.shop])];
    exportToExcel("History.xlsx", data);
  };

  const handleAddItem = () => {
      setFormData({ ...formData, items: [...formData.items, { desc: '', qty: 1, amount: '' }] });
  };

  const handleRemoveItem = (index) => {
      if (formData.items.length > 1) {
          setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
      }
  };

  const handleItemChange = (index, field, value) => {
      const newItems = [...formData.items];
      newItems[index][field] = value;
      
      if (field === 'desc') {
          const matchedProduct = stockProducts.find(p => p.name === value);
          if (matchedProduct && formData.type === 'income') {
              newItems[index]['amount'] = matchedProduct.price || '';
          }
      }
      if (index === 0 && field === 'desc') {
          setFormData({ ...formData, items: newItems, description: value });
      } else {
          setFormData({ ...formData, items: newItems });
      }
  };

  const handleMagicFill = async () => { if (!magicPrompt) return; setIsMagicLoading(true); const prompt = `Extract transaction data from Thai text: "${magicPrompt}". Return JSON: { type: "income"|"expense", items: [{ desc: string, amount: number }], channel: string, date: "YYYY-MM-DD" }.`; try { const data = await SmartTaxAI.generate(prompt, null, true); if (data) setFormData(prev => ({ ...prev, ...data })); } catch (error) { showToast("AI Failed", "error"); } finally { setIsMagicLoading(false); } };

  const historyStats = useMemo(() => {
    const filtered = transactions.filter(t => {
        if (histFilterType !== 'all' && t.type !== histFilterType) return false;
        const searchMatch = !historySearch || 
            t.description?.toLowerCase().includes(historySearch.toLowerCase()) || 
            t.amount?.toString().includes(historySearch) || 
            t.orderId?.toLowerCase().includes(historySearch.toLowerCase());
        if (!searchMatch) return false;
        const d = normalizeDate(t.date);
        if (d.getFullYear() !== selectedYear) return false;
        const now = new Date();
        const targetDate = new Date();
        targetDate.setFullYear(selectedYear);
        if (viewMode === 'day') {
           return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
        } else if (viewMode === 'week') {
           return getWeekNumber(d) === getWeekNumber(targetDate);
        } else if (viewMode === 'month') {
           return d.getMonth() === now.getMonth();
        }
        return true; 
    });

    const totalAmount = filtered.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const count = filtered.length;
    const avg = count > 0 ? totalAmount / count : 0;
    
    const catMap = {};
    filtered.forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + (Number(t.total) || 0);
    });
    const topCats = Object.entries(catMap)
        .map(([name, value]) => ({ name, value, percent: totalAmount > 0 ? (value/totalAmount)*100 : 0 }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 5);

    const trendMap = {};
    filtered.forEach(t => {
        const d = normalizeDate(t.date);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (!trendMap[dateKey]) trendMap[dateKey] = { date: d, income: 0, expense: 0 };
        if (t.type === 'income') trendMap[dateKey].income += Number(t.total);
        else trendMap[dateKey].expense += Number(t.total);
    });
    
    const trendData = Object.values(trendMap)
        .sort((a,b) => a.date - b.date)
        .slice(-14);

    return { totalAmount, count, avg, topCats, trendData, filtered };
  }, [transactions, histFilterType, selectedYear, viewMode, historySearch]);

  return (
    <div className="flex flex-col h-full lg:h-[calc(100vh-88px)] relative text-left font-sarabun">
       {deleteId && <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 text-center"><div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fadeIn"><Trash2 size={48} className="mx-auto text-rose-500 mb-4 bg-rose-50 p-3 rounded-full"/><h3 className="text-xl font-bold mb-6 text-slate-800">ยืนยันการลบ?</h3><div className="flex gap-3 mt-6"><button onClick={()=>setDeleteId(null)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold">ยกเลิก</button><button onClick={executeDelete} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold">ลบรายการ</button></div></div></div>}
       {previewInvoiceTransaction && (<InvoicePreviewModal transaction={previewInvoiceTransaction} onClose={()=>setPreviewInvoiceTransaction(null)} showToast={showToast}/>)}
       
       {showVendorModal && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-sarabun text-left"><div className="bg-white rounded-3xl w-full max-md h-[70vh] flex flex-col shadow-2xl animate-fadeIn text-left"><div className="p-6 border-b flex justify-between items-center text-left"><h3 className="font-bold text-lg flex items-center gap-2 text-indigo-600 text-left"><Store className="text-indigo-500"/> เลือกคู่ค้า (Vendor)</h3><button onClick={()=>setShowVendorModal(false)}><X/></button></div><div className="px-6 pt-4"><div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input className="w-full bg-slate-50 border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-indigo-100" placeholder="ค้นหาชื่อร้าน, สาขา, ที่อยู่..." value={vendorSearch} onChange={e=>setVendorSearch(e.target.value)}/></div></div><div className="flex-1 overflow-y-auto p-4 space-y-2 text-left">{vendors.filter(v => v.vendorName?.toLowerCase().includes(vendorSearch.toLowerCase()) || v.vendorTaxId?.includes(vendorSearch) || v.vendorBranch?.includes(vendorSearch) || v.vendorBranchName?.includes(vendorSearch) || v.vendorAddress?.toLowerCase().includes(vendorSearch.toLowerCase())).map(v => (<div key={v.id} onClick={()=>{setFormData(p=>({...p, vendorName: v.vendorName, vendorTaxId: v.vendorTaxId, vendorBranch: v.vendorBranch, vendorBranchName: v.vendorBranchName || '', vendorAddress: v.vendorAddress})); setShowVendorModal(false);}} className="p-4 rounded-xl border border-slate-100 hover:bg-indigo-50 cursor-pointer shadow-sm text-left group transition-colors"><div className="flex justify-between items-start mb-1"><p className="font-bold text-slate-700 text-sm">{v.vendorName}</p>{v.vendorBranch && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 font-medium text-right max-w-[120px] truncate">สาขา {v.vendorBranch} {v.vendorBranchName ? `(${v.vendorBranchName})` : ''}</span>}</div><p className="text-xs text-slate-500 line-clamp-1">{v.vendorAddress || '-'}</p><p className="text-[10px] text-slate-400 mt-1 font-mono">Tax ID: {v.vendorTaxId || '-'}</p></div>))}</div></div></div>)}

        <div className="flex gap-1 p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl w-fit mb-6 self-center md:self-start border border-slate-200">
           <button onClick={()=>setSubTab('new')} className={"px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 " + (subTab==='new'?'bg-white text-indigo-600 shadow-sm':'text-slate-500')}><Edit size={16}/> บันทึกรายการ</button>
           <button onClick={()=>setSubTab('history')} className={"px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 " + (subTab==='history'?'bg-white text-indigo-600 shadow-sm':'text-slate-500')}><BarChart2 size={16}/> Performance</button>
        </div>

        {subTab === 'new' ? (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden text-left">
            <div className="lg:col-span-5 xl:col-span-5 bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-100 h-full overflow-y-auto flex flex-col text-left">
                <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2 text-left">New Transaction Pro</h3>
                
                <div className="flex gap-2 p-1 bg-slate-50 rounded-xl mb-6 text-center">
                    <button onClick={()=>setFormData({...formData, type:'income'})} className={"flex-1 py-3 rounded-lg text-sm font-bold transition-all " + (formData.type==='income'?'bg-white text-emerald-600 shadow-sm':'text-slate-400')}>รายรับ</button>
                    <button onClick={()=>setFormData({...formData, type:'expense'})} className={"flex-1 py-3 rounded-lg text-sm font-bold transition-all " + (formData.type==='expense'?'bg-white text-rose-600 shadow-sm':'text-slate-400')}>รายจ่าย</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 flex-1 text-left">
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="space-y-1 text-left"><label className="text-xs font-bold text-slate-500 ml-1 text-left">วันที่</label><input type="date" className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm font-semibold text-left" value={formData.date} onChange={e=>setFormData({...formData,date:e.target.value})}/></div>
                        <div className="space-y-1 text-left">
                            <label className="text-xs font-bold text-slate-500 ml-1 text-left">ร้านค้า</label>
                            <select className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm font-semibold text-left" value={formData.shop} onChange={e=>setFormData({...formData, shop: e.target.value})}>
                                {CONSTANTS.SHOPS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1 text-left"><label className="text-xs font-bold text-slate-500 ml-1 text-left">หมวดหมู่</label><select className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm font-semibold text-left" value={formData.category} onChange={e=>setFormData({...formData,category:e.target.value})}>{(formData.type==='income'?CONSTANTS.CATEGORIES.INCOME:CONSTANTS.CATEGORIES.EXPENSE).map(c=><option key={c} value={c}>{c}</option>)}</select></div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-3"><h4 className="font-bold text-xs text-slate-500 uppercase flex items-center gap-1"><List size={14}/> รายการสินค้า (Stock)</h4><button type="button" onClick={handleAddItem} className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-full font-bold shadow-sm hover:bg-indigo-700">+ เพิ่มสินค้า</button></div>
                        <div className="space-y-3">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center group">
                                    <div className="flex-[3] relative">
                                        <input required className="w-full bg-white border-0 rounded-lg p-2 text-xs shadow-sm" placeholder="ชื่อสินค้า..." value={item.desc} onChange={e => handleItemChange(idx, 'desc', e.target.value)} list={`products-list-${idx}`}/>
                                        <datalist id={`products-list-${idx}`}>
                                            {stockProducts.map(p => <option key={p.id} value={p.name}>{p.name} (คงเหลือ: {p.stock})</option>)}
                                        </datalist>
                                    </div>
                                    <input required type="number" className="w-16 bg-white border-0 rounded-lg p-2 text-xs text-center font-bold shadow-sm" placeholder="Qty" value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} />
                                    <input required type="number" className="flex-1 min-w-[80px] bg-white border-0 rounded-lg p-2 text-xs text-right font-bold shadow-sm" placeholder="0.00" value={item.amount} onChange={e => handleItemChange(idx, 'amount', e.target.value)} />
                                    {formData.items.length > 1 && (<button type="button" onClick={() => handleRemoveItem(idx)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {formData.type === 'income' ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-xs font-bold text-slate-500 ml-1">ช่องทางขาย</label><select className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm font-semibold" value={formData.channel} onChange={e=>setFormData({...formData,channel:e.target.value})}>{CONSTANTS.CHANNELS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-slate-500 ml-1">Order ID / Ref.</label><input className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm font-mono text-indigo-600" placeholder="เลขที่คำสั่งซื้อ" value={formData.orderId} onChange={e=>setFormData({...formData,orderId:e.target.value})}/></div>
                            </div>

                            {isEcommerceMode && (
                                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2">
                                    <h4 className="font-bold text-xs text-indigo-600 uppercase flex items-center gap-1 mb-3"><Store size={14}/> E-Commerce Breakdown</h4>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Package size={10}/> ค่าส่งจากลูกค้า (+)</label>
                                            <input type="number" className="w-full bg-white border-0 rounded-lg p-2 text-xs font-bold text-emerald-600 shadow-sm" placeholder="0.00" value={formData.customerShipping} onChange={e=>setFormData({...formData, customerShipping: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Tag size={10}/> ส่วนลดร้านค้า (-)</label>
                                            <input type="number" className="w-full bg-white border-0 rounded-lg p-2 text-xs font-bold text-rose-600 shadow-sm" placeholder="0.00" value={formData.shopDiscount} onChange={e=>setFormData({...formData, shopDiscount: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Activity size={10}/> ค่าธรรมเนียม (-)</label>
                                            <input type="number" className="w-full bg-white border-0 rounded-lg p-2 text-xs font-bold text-slate-600 shadow-sm" placeholder="0.00" value={formData.platformFee} onChange={e=>setFormData({...formData, platformFee: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Package size={10}/> ค่าส่งถูกหัก (-)</label>
                                            <input type="number" className="w-full bg-white border-0 rounded-lg p-2 text-xs font-bold text-slate-600 shadow-sm" placeholder="0.00" value={formData.shippingCost} onChange={e=>setFormData({...formData, shippingCost: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-indigo-100 text-xs">
                                        <span className="font-bold text-indigo-400">Est. Payout:</span>
                                        <span className="font-bold text-indigo-700 text-base">{formatCurrency(calculated.estimatedPayout)}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4 animate-fadeIn">
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-xs text-slate-500 uppercase flex items-center gap-1"><Store size={14}/> ข้อมูลคู่ค้า (Vendor)</h4>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setShowVendorModal(true)} className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold hover:bg-indigo-100">เลือกเก่า</button>
                                        <button type="button" onClick={saveVendorProfile} className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold hover:bg-emerald-100">บันทึกใหม่</button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <input className="w-full bg-white border-0 rounded-lg p-2 text-sm shadow-sm" placeholder="ชื่อร้านค้า / ผู้รับเงิน" value={formData.vendorName} onChange={e=>setFormData({...formData, vendorName: e.target.value})} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input className="w-full bg-white border-0 rounded-lg p-2 text-sm shadow-sm" placeholder="เลขผู้เสียภาษี" value={formData.vendorTaxId} onChange={e=>setFormData({...formData, vendorTaxId: e.target.value})} />
                                        <input className="w-full bg-white border-0 rounded-lg p-2 text-sm shadow-sm" placeholder="รหัสสาขา (เช่น 00000)" value={formData.vendorBranch} onChange={e=>setFormData({...formData, vendorBranch: e.target.value})} />
                                    </div>
                                    <input className="w-full bg-white border-0 rounded-lg p-2 text-sm shadow-sm" placeholder="ชื่อสาขา (ถ้ามี)" value={formData.vendorBranchName} onChange={e=>setFormData({...formData, vendorBranchName: e.target.value})} />
                                    <input className="w-full bg-white border-0 rounded-lg p-2 text-sm shadow-sm" placeholder="ที่อยู่" value={formData.vendorAddress} onChange={e=>setFormData({...formData, vendorAddress: e.target.value})} />
                                </div>
                             </div>
                             <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                                <label className="text-[10px] font-bold text-orange-600 flex items-center gap-1 mb-1"><Tag size={12}/> ส่วนลดจากร้านค้า (ทั้งหมด)</label>
                                <input type="number" className="w-full bg-white border-0 rounded-lg p-2 text-sm font-bold text-orange-600 shadow-sm" placeholder="0.00" value={formData.expenseDiscount} onChange={e=>setFormData({...formData, expenseDiscount: e.target.value})} />
                             </div>
                        </div>
                    )}

                    <div className="space-y-1 text-left"><label className="text-xs font-bold text-slate-500 ml-1 text-left">รูปแบบ VAT</label><select className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm text-left font-bold" value={formData.vatType} onChange={e=>setFormData({...formData,vatType:e.target.value})}><option value="included">รวม VAT (7%)</option><option value="excluded">แยก VAT (7%)</option><option value="none">ไม่มี VAT</option></select></div>

                    <div className="bg-slate-800 text-white p-5 rounded-2xl shadow-lg mt-auto text-left">
                        {formData.type === 'expense' && calculated.totalAfterDiscount < calculated.baseAmount && (
                            <div className="flex justify-between text-xs text-orange-300 mb-1"><span>ส่วนลด:</span><span>-{formatCurrency(formData.expenseDiscount)}</span></div>
                        )}
                        <div className="flex justify-between text-xs opacity-60 mb-1"><span>Pre-VAT:</span><span>{formatCurrency(calculated.net)}</span></div>
                        <div className="flex justify-between text-xs opacity-60 mb-2"><span>VAT 7%:</span><span>{formatCurrency(calculated.vat)}</span></div>
                        <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/20 text-left"><span>ยอดรวมสุทธิ:</span><span>{formatCurrency(calculated.total)}</span></div>
                    </div>
                    
                    <button type="submit" className="w-full text-white py-4 rounded-xl font-bold shadow-lg bg-indigo-600 hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 text-center"><Save size={20}/> {editingId ? 'บันทึกการแก้ไข' : (formData.type === 'income' ? 'บันทึก & ตัดสต็อก (FIFO)' : 'บันทึก & เพิ่มสต็อก (Net Cost)')}</button>
                    
                    <div className="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <div className="flex items-center gap-2 mb-2"><div className="p-1 bg-indigo-100 rounded-full text-indigo-600"><Settings size={12}/></div><span className="text-[10px] font-bold text-indigo-600 uppercase">AI Magic Auto-Fill</span></div>
                        <div className="flex gap-2">
                           <input className="flex-1 bg-white border border-indigo-100 rounded-lg px-3 py-2 text-xs" placeholder="พิมพ์เช่น 'ขายเสื้อ 2 ตัว 500 บาท'" value={magicPrompt} onChange={e=>setMagicPrompt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleMagicFill()}/>
                           <button onClick={handleMagicFill} disabled={isMagicLoading} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-[10px] font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center min-w-[70px]">{isMagicLoading ? <Loader size={12} className="animate-spin"/> : 'Auto Fill'}</button>
                        </div>
                    </div>
                </form>
            </div>
            
            <div className="lg:col-span-7 xl:col-span-7 bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden text-left">
                <div className="p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20 text-left"><div className="flex justify-between items-center mb-4 text-left"><h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 text-left"><Clock className="text-indigo-500"/> รายการล่าสุด</h3></div><div className="relative text-left"><Search className="absolute left-3 top-2.5 text-slate-400 text-left" size={18}/><input className="w-full bg-slate-50 border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm text-left focus:ring-1 focus:ring-indigo-100" placeholder="ค้นหาชื่อ, ยอดเงิน, Order ID..." value={recentSearch} onChange={e=>setRecentSearch(e.target.value)}/></div></div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left custom-scrollbar">
                {Object.entries(groupedRecent).map(([date, items]) => (<div key={date} className="text-left"><div className="sticky top-0 bg-white/95 backdrop-blur py-2 mb-2 z-10 w-fit px-3 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">{date}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">{items.map((t, idx) => (<div key={`${t.id}-${idx}`} className="bg-white border border-slate-100 p-4 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all group relative text-left"><div className="flex justify-between items-start mb-2 text-left"><div className="flex items-center gap-3 text-left"><div className={"w-10 h-10 rounded-full flex items-center justify-center " + (t.type==='income'?'bg-emerald-100 text-emerald-600':'bg-rose-100 text-rose-600')}>{t.type==='income' ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}</div><div><p className="font-bold text-slate-700 text-sm line-clamp-1 text-left">{t.description}</p><div className="flex gap-2 mt-0.5"><span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase">{t.category}</span>{t.channel && <span className="text-[10px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded font-bold">{t.channel}</span>}{t.orderId && <span className="text-[10px] bg-slate-100 text-indigo-500 px-1.5 py-0.5 rounded font-bold">#{t.orderId}</span>}</div></div></div><p className={`font-bold text-sm ${t.type==='income'?'text-emerald-600':'text-rose-800'}`}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.total)}</p></div><div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                    {t.type === 'income' && (<button onClick={() => setPreviewInvoiceTransaction(t)} className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-500 rounded-lg transition-colors text-center" title="ออกใบกำกับภาษี"><Printer size={14}/></button>)}
                    <button onClick={()=>handleEdit(t)} className="p-1.5 bg-slate-50 text-slate-400 hover:text-orange-500 rounded-lg transition-colors text-center"><Edit size={14}/></button>
                    <button onClick={(e)=>setDeleteId(t.id)} className="p-1.5 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors text-center"><Trash2 size={14}/></button>
                </div></div>))}</div></div>))}
                </div>
            </div>
         </div>
       ) : (
         <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden animate-fadeIn text-left">
           <div className="p-6 border-b border-slate-100 space-y-4">
             <div className="flex flex-col md:flex-row justify-between items-start gap-4">
               <div>
                 <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xl"><BarChart2 className="text-indigo-600"/> Performance & History</h3>
                 <p className="text-slate-500 text-sm">วิเคราะห์เจาะลึกรายการบันทึกย้อนหลัง</p>
               </div>
               <div className="flex flex-wrap gap-2">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button onClick={()=>setSelectedYear(currentYear-1)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedYear === currentYear-1 ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>ปีย้อนหลัง ({currentYear-1})</button>
                      <button onClick={()=>setSelectedYear(currentYear)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedYear === currentYear ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>ปีปัจจุบัน ({currentYear})</button>
                  </div>
                  <select className="bg-slate-50 border-none rounded-xl text-sm font-bold py-2 px-4 text-slate-600" value={histFilterType} onChange={e=>setHistFilterType(e.target.value)}>
                      <option value="all">รวมทุกประเภท</option>
                      <option value="income">รายรับ (Income)</option>
                      <option value="expense">รายจ่าย (Expense)</option>
                  </select>
                  <button onClick={exportHistoryExcel} className="bg-emerald-50 text-emerald-600 p-2 rounded-xl hover:bg-emerald-100 flex items-center gap-2 px-4 text-sm font-bold shadow-sm transition-all"><FileText size={18}/> Export</button>
               </div>
             </div>
             
             <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex bg-indigo-50/50 p-1 rounded-xl w-full md:w-auto">
                    {['day', 'week', 'month', 'year'].map(m => (
                        <button key={m} onClick={() => setViewMode(m)} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${viewMode === m ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400 hover:bg-indigo-100'}`}>
                            {m === 'day' ? 'รายวัน' : m === 'week' ? 'รายสัปดาห์' : m === 'month' ? 'รายเดือน' : 'ทั้งปี'}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                    <input 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all" 
                        placeholder="ค้นหารายการ, ยอดเงิน..." 
                        value={historySearch} 
                        onChange={e=>setHistorySearch(e.target.value)}
                    />
                </div>
             </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">จำนวนรายการ (Volume)</p>
                            <h4 className="text-3xl font-bold text-indigo-700">{formatCompactNumber(historyStats.count)} <span className="text-sm font-medium text-indigo-400">รายการ</span></h4>
                        </div>
                        <div className="absolute -right-2 -bottom-2 text-indigo-200 opacity-20 group-hover:scale-110 transition-transform"><List size={80}/></div>
                    </div>
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">มูลค่ารวม (Total Value)</p>
                            <h4 className="text-3xl font-bold text-emerald-700">{formatCurrency(historyStats.totalAmount)}</h4>
                        </div>
                        <div className="absolute -right-2 -bottom-2 text-emerald-200 opacity-20 group-hover:scale-110 transition-transform"><Wallet size={80}/></div>
                    </div>
                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">เฉลี่ยต่อบิล (Avg. Ticket)</p>
                            <h4 className="text-3xl font-bold text-amber-700">{formatCurrency(historyStats.avg)}</h4>
                        </div>
                        <div className="absolute -right-2 -bottom-2 text-amber-200 opacity-20 group-hover:scale-110 transition-transform"><Tag size={80}/></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2"><Activity size={16}/> Activity Trend (Filtered)</h4>
                        </div>
                        <div className="flex items-end gap-3 h-40">
                            {historyStats.trendData.length > 0 ? historyStats.trendData.map((d, i) => {
                                const maxVal = Math.max(...historyStats.trendData.map(x => Math.max(x.income, x.expense))) || 1;
                                return (
                                    <div key={i} className="flex-1 flex flex-col justify-end gap-1 h-full group relative">
                                        <div className="w-full bg-emerald-400 rounded-t opacity-90 group-hover:opacity-100 transition-all shadow-sm" style={{height: `${Math.max((d.income/maxVal)*100, 2)}%`}}></div>
                                        <div className="w-full bg-rose-400 rounded-t opacity-90 group-hover:opacity-100 transition-all shadow-sm" style={{height: `${Math.max((d.expense/maxVal)*100, 2)}%`}}></div>
                                        <div className="text-[9px] text-center text-slate-400 font-bold mt-1">{d.date.getDate()}</div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 shadow-xl transition-opacity">
                                            <div className="font-bold border-b border-slate-600 pb-1 mb-1">{formatDate(d.date)}</div>
                                            <div className="text-emerald-300">In: {formatCurrency(d.income)}</div>
                                            <div className="text-rose-300">Ex: {formatCurrency(d.expense)}</div>
                                        </div>
                                    </div>
                                )
                            }) : <div className="w-full h-full flex items-center justify-center text-slate-400">ไม่มีข้อมูลในช่วงนี้</div>}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2"><PieChart size={16}/> Top Categories</h4>
                        <div className="space-y-4">
                            {historyStats.topCats.length > 0 ? historyStats.topCats.map((c, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs mb-1.5 font-bold">
                                        <span className="text-slate-600">{i+1}. {c.name}</span>
                                        <span className="text-slate-800">{formatCompactNumber(c.value)} ({c.percent.toFixed(1)}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div className={`h-full rounded-full ${i === 0 ? 'bg-indigo-500' : 'bg-indigo-300'}`} style={{width: `${c.percent}%`}}></div>
                                    </div>
                                </div>
                            )) : <p className="text-center text-slate-400 text-sm py-4">ไม่มีข้อมูลหมวดหมู่</p>}
                        </div>
                    </div>
                </div>

                <h4 className="font-bold text-slate-700 text-lg mb-4 flex items-center gap-2"><List size={20}/> Transaction Logs <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-2">Year: {selectedYear} / View: {viewMode.toUpperCase()}</span></h4>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                            <tr>
                                <th className="p-4 w-[120px]">Date</th>
                                <th className="p-4 w-[100px]">Type</th>
                                <th className="p-4">Description</th>
                                <th className="p-4 text-right w-32">Amount</th>
                                <th className="p-4 text-center w-[100px]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {historyStats.filtered.sort((a,b) => b.date - a.date).map((t, idx) => (
                                <tr key={t.id + "-hist-" + idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-500 text-xs font-mono">{formatDate(t.date)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700">{t.description}</div>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{t.category}</span>
                                            {t.orderId && <span className="text-[10px] text-indigo-400 font-mono">Ref: {t.orderId}</span>}
                                        </div>
                                    </td>
                                    <td className={`p-4 text-right font-bold ${t.type==='income'?'text-emerald-600':'text-rose-600'}`}>
                                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.total)}
                                        {t.platformFee > 0 && <div className="text-[9px] text-slate-400 font-normal mt-1">Fee: -{formatCurrency(t.platformFee)}</div>}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {t.type === 'income' && (<button onClick={() => setPreviewInvoiceTransaction(t)} className="text-slate-300 hover:text-indigo-600" title="Reprint Invoice"><Printer size={14}/></button>)}
                                            <button onClick={()=>handleEdit(t)} className="text-slate-300 hover:text-orange-500"><Edit size={14}/></button>
                                            <button onClick={(e)=>setDeleteId(t.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {historyStats.filtered.length === 0 && (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-300">ไม่พบรายการในช่วงนี้</td></tr>
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

const InvoiceGenerator = ({ user, invoices, appId, showToast }) => {
  const [mode, setMode] = useState('history'); 
  const [docType, setDocType] = useState('invoice'); 
  const savedSeller = useMemo(() => { try { return JSON.parse(localStorage.getItem('merchant_seller_info') || '{}'); } catch (e) { return {}; } }, []);
  
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('all');
  const [isGeneralCustomer, setIsGeneralCustomer] = useState(true);
  const [loadedProfileId, setLoadedProfileId] = useState(null);
  const [profileDeleteId, setProfileDeleteId] = useState(null);

  const initialInvData = {
    docType: 'ใบกำกับภาษี / ใบเสร็จรับเงิน', customerName: 'ลูกค้าทั่วไป', address: '', taxId: '', branch: '00000', orderId: '',
    custSubDistrict: '', custDistrict: '', custProvince: '', custZipCode: '', customerPhone: '', customerEmail: '', 
    items: [{ desc: '', qty: 1, unit: 'ชิ้น', price: 0 }], date: formatDateISO(new Date()), invNo: '',
    sellerName: savedSeller.sellerName || '', sellerAddress: savedSeller.sellerAddress || '', sellerTaxId: savedSeller.sellerTaxId || '', 
    sellerBranchId: savedSeller.sellerBranchId || '00000', sellerPhone: savedSeller.sellerPhone || '', sellerEmail: savedSeller.sellerEmail || '', 
    sellerSubDistrict: savedSeller.sellerSubDistrict || '', sellerDistrict: savedSeller.sellerDistrict || '', 
    sellerProvince: savedSeller.sellerProvince || '', sellerZipCode: savedSeller.sellerZipCode || '', 
    discount: 0, notes: 'สินค้าซื้อแล้วไม่รับเปลี่ยนหรือคืนเงิน', vatType: 'excluded', logo: '', status: 'unpaid'
  };

  const [invData, setInvData] = useState(initialInvData);
  const [editingDocId, setEditingDocId] = useState(null);
  const [docTypeStatus, setDocTypeStatus] = useState('original');
  const [showSellerEditModal, setShowSellerEditModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [sellerProfiles, setSellerProfiles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deleteId, setDeleteId] = useState(null); 
  const logoInputRef = useRef(null);

  const totals = useMemo(() => {
    const { vatType, items, discount } = invData;
    let sub = items.reduce((s, i) => s + (i.qty * i.price), 0);
    let afterDisc = sub - Number(discount);
    let vat = 0, total = 0, preVat = 0;
    if (vatType === 'included') { total = afterDisc; preVat = total * 100 / 107; vat = total - preVat; } 
    else if (vatType === 'excluded') { preVat = afterDisc; vat = preVat * 0.07; total = preVat + vat; } 
    else { preVat = afterDisc; vat = 0; total = preVat; }
    return { sub, afterDisc, vat, total, preVat };
  }, [invData.items, invData.discount, invData.vatType]);

  const filteredInvoices = useMemo(() => {
      return invoices.filter(inv => {
          const d = normalizeDate(inv.date);
          const matchYear = d.getFullYear() === yearFilter;
          const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
          return matchYear && matchStatus;
      }).sort((a,b) => b.date - a.date);
  }, [invoices, yearFilter, statusFilter]);

  const invoiceStats = useMemo(() => {
      const total = filteredInvoices.reduce((s, i) => s + (Number(i.total) || 0), 0);
      const paid = filteredInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + (Number(i.total) || 0), 0);
      const unpaid = filteredInvoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (Number(i.total) || 0), 0);
      const count = filteredInvoices.length;
      return { total, paid, unpaid, count };
  }, [filteredInvoices]);

  useEffect(() => { 
    if (mode === 'create' && !editingDocId) { 
      const prefix = docType === 'quotation' ? 'QT' : 'INV';
      const dateStr = invData.date.replace(/-/g, ''); 
      const count = invoices.filter(inv => inv.invNo && inv.invNo.startsWith(prefix + "-" + dateStr)).length + 1; 
      setInvData(prev => ({ ...prev, invNo: prefix + "-" + dateStr + "-" + String(count).padStart(3, '0') })); 
    } 
  }, [invData.date, invoices, mode, editingDocId, docType]);

  useEffect(() => {
      if (user) {
          const unsubSellers = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'seller_profiles')), (snap) => setSellerProfiles(snap.docs.map(d=>({id:d.id, ...d.data()}))));
          const unsubCustomers = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'customers')), (snap) => setCustomers(snap.docs.map(d=>({id:d.id, ...d.data()}))));
          return () => { unsubSellers(); unsubCustomers(); };
      }
  }, [user, appId]);

  const handleSaveInvoice = async () => {
    if (!user) return;
    try {
      const payload = { 
          ...invData, 
          ...totals, 
          customerName: isGeneralCustomer ? 'ลูกค้าทั่วไป' : invData.customerName,
          date: new Date(invData.date), 
          type: docType 
      };

      if (editingDocId) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'invoices', editingDocId), { ...payload, updatedAt: serverTimestamp() }, {merge: true}); 
      else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'invoices'), { ...payload, createdAt: serverTimestamp(), status: 'unpaid' });
      
      showToast("บันทึกเอกสารสำเร็จ", "success"); 
      setMode('history'); 
      setEditingDocId(null);
    } catch(e) { showToast("บันทึกไม่สำเร็จ", "error"); }
  };

  const handleSaveAsDefault = () => {
    const sellerInfo = {
        sellerName: invData.sellerName,
        sellerAddress: invData.sellerAddress,
        sellerTaxId: invData.sellerTaxId,
        sellerBranchId: invData.sellerBranchId,
        sellerPhone: invData.sellerPhone,
        sellerEmail: invData.sellerEmail,
        logo: invData.logo
    };
    localStorage.setItem('merchant_seller_info', JSON.stringify(sellerInfo));
    showToast("บันทึกข้อมูลผู้ขายเป็นค่าเริ่มต้นแล้ว", "success");
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-preview-area'); if (!element) return;
    showToast("กำลังเตรียมไฟล์ PDF...", "success");
    const loadScript = (src) => new Promise(res => { const s = document.createElement('script'); s.src = src; s.onload = res; document.body.appendChild(s); });
    if (!window.html2pdf) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
    if (!window.JSZip) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
    const zip = new window.JSZip();
    const generatePDFBlob = async (statusLabel, scale = 2) => {
        setDocTypeStatus(statusLabel === 'ต้นฉบับ' ? 'original' : 'copy');
        await new Promise(res => setTimeout(res, 400)); 
        const opt = { margin: 0, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: scale, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
        return await window.html2pdf().set(opt).from(element).output('blob');
    };
    try {
        const originalBlob = await generatePDFBlob('ต้นฉบับ');
        const copyBlob = await generatePDFBlob('สำเนา');
        const folderName = invData.invNo;
        zip.file(folderName + "/" + invData.invNo + "_ต้นฉบับ.pdf", originalBlob);
        zip.file(folderName + "/" + invData.invNo + "_สำเนา.pdf", copyBlob);
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a'); link.href = URL.createObjectURL(content); link.download = invData.invNo + ".zip"; link.click();
        showToast("ดาวน์โหลด ZIP สำเร็จ", "success");
    } catch (e) { showToast("เกิดข้อผิดพลาด", "error"); }
  };

  const handleExportReport = () => {
      const data = filteredInvoices.map(inv => [
          formatDate(inv.date),
          inv.invNo,
          inv.customerName,
          inv.total,
          inv.status === 'paid' ? 'Paid' : 'Unpaid'
      ]);
      const header = [['Date', 'Invoice No.', 'Customer', 'Amount', 'Status']];
      exportToExcel(`Invoice_Report_${yearFilter}.xlsx`, data, header);
      showToast("Export Report สำเร็จ", "success");
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setInvData(prev => ({ ...prev, logo: reader.result })); };
      reader.readAsDataURL(file);
    }
  };

  const handleNewInvoice = () => { 
      const currentSavedSeller = JSON.parse(localStorage.getItem('merchant_seller_info') || '{}'); 
      setEditingDocId(null); 
      setLoadedProfileId(null);
      setInvData({ ...initialInvData, ...currentSavedSeller }); 
      setIsGeneralCustomer(true);
      setMode('create'); 
  }
  const handleEditInvoice = (inv) => { 
      setInvData({ ...inv, date: formatDateISO(inv.date) }); 
      setIsGeneralCustomer(inv.customerName === 'ลูกค้าทั่วไป');
      setEditingDocId(inv.id); 
      setMode('create'); 
  }
  const updateItem = (i, field, val) => { const newItems = [...invData.items]; newItems[i][field] = val; setInvData({...invData, items: newItems}); };
  
  const executeProfileDelete = async () => {
      if (!profileDeleteId) return;
      try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'seller_profiles', profileDeleteId));
          showToast("ลบโปรไฟล์สำเร็จ", "success");
          if (loadedProfileId === profileDeleteId) setLoadedProfileId(null);
          setProfileDeleteId(null);
      } catch (err) { 
          showToast("ลบไม่สำเร็จ", "error"); 
          setProfileDeleteId(null);
      }
  };

  const handleSelectSellerProfile = (s) => {
      setInvData(prev => ({ ...prev, ...s }));
      setLoadedProfileId(s.id);
      setShowSellerEditModal(false);
      showToast(`โหลดโปรไฟล์ ${s.sellerName} เรียบร้อย`, "success");
  };

  const saveSellerProfile = async () => { 
      if(!invData.sellerName) { showToast("กรุณาระบุชื่อร้านค้า", "error"); return; }
      const profileData = { 
          sellerName: invData.sellerName, 
          sellerAddress: invData.sellerAddress, 
          sellerTaxId: invData.sellerTaxId, 
          sellerBranchId: invData.sellerBranchId, 
          sellerPhone: invData.sellerPhone, 
          sellerEmail: invData.sellerEmail, 
          logo: invData.logo,
          updatedAt: serverTimestamp()
      };
      
      try {
          if (loadedProfileId) {
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'seller_profiles', loadedProfileId), profileData);
              showToast("อัปเดตโปรไฟล์ใน Cloud สำเร็จ", "success");
          } else {
              const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'seller_profiles'), { ...profileData, createdAt: serverTimestamp() });
              setLoadedProfileId(docRef.id);
              showToast("บันทึกโปรไฟล์ลง Cloud สำเร็จ", "success");
          }
      } catch (err) { showToast("บันทึกไม่สำเร็จ", "error"); }
  };

  return (
    <div className="w-full flex flex-col gap-8 relative h-full text-left font-sarabun">
      {profileDeleteId && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 font-sarabun text-center">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-fadeIn">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={32} className="text-rose-500"/>
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-800">ยืนยันการลบโปรไฟล์?</h3>
                <p className="text-sm text-slate-500 mb-6">ข้อมูลร้านค้าที่บันทึกไว้ในโปรไฟล์นี้จะหายไปอย่างถาวร</p>
                <div className="flex gap-3 text-center">
                    <button onClick={()=>setProfileDeleteId(null)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-center">ยกเลิก</button>
                    <button onClick={executeProfileDelete} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold text-center">ยืนยันลบ</button>
                </div>
            </div>
        </div>
      )}

      {showSellerEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-sarabun text-left">
            <div className="bg-white rounded-3xl w-full max-w-lg h-[70vh] flex flex-col shadow-2xl animate-fadeIn">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-indigo-700 text-left"><Database size={20}/> เลือกโปรไฟล์ผู้ขายเก่า</h3>
                    <button onClick={()=>setShowSellerEditModal(false)} className="p-1 hover:bg-slate-100 rounded-full"><X/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {sellerProfiles.length > 0 ? sellerProfiles.map(s => (
                        <div key={s.id} onClick={() => handleSelectSellerProfile(s)} className={`group p-4 bg-white border rounded-2xl cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all flex items-center gap-4 relative ${loadedProfileId === s.id ? 'border-indigo-600 ring-1 ring-indigo-50' : 'border-slate-100'}`}>
                            <div className="w-12 h-12 rounded-lg bg-slate-50 p-1 flex-shrink-0 border border-slate-100">
                                {s.logo ? <img src={s.logo} className="w-full h-full object-contain" alt="Logo" /> : <Store className="w-full h-full p-2 text-slate-300" />}
                            </div>
                            <div className="flex-1 pr-12">
                                <p className="font-bold text-slate-800 text-sm">{s.sellerName}</p>
                                <p className="text-[10px] text-slate-400 line-clamp-1">{s.sellerAddress}</p>
                                <p className="text-[10px] text-indigo-500 font-mono mt-1">Tax: {s.sellerTaxId || '-'}</p>
                            </div>
                            <div className="absolute right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); handleSelectSellerProfile(s); setShowSellerEditModal(false); }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100" title="Edit/Select"><Edit size={14}/></button>
                                <button onClick={(e) => { e.stopPropagation(); setProfileDeleteId(s.id); }} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100" title="Delete"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    )) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                            <Database size={40} className="mb-2 opacity-20"/>
                            <p className="text-sm">ไม่พบโปรไฟล์ที่บันทึกไว้</p>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t bg-slate-50 text-center">
                    <button onClick={()=>setShowSellerEditModal(false)} className="w-full py-3 rounded-xl font-bold bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-white/80 transition-all">ปิด</button>
                </div>
            </div>
        </div>
      )}
      
      {showCustomerModal && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-sarabun text-left"><div className="bg-white rounded-3xl w-full max-md h-[70vh] flex flex-col shadow-2xl animate-fadeIn text-left"><div className="p-6 border-b flex justify-between items-center text-left"><h3 className="font-bold text-lg flex items-center gap-2 text-rose-600 text-left"><User className="text-rose-500"/> เลือกข้อมูลลูกค้า</h3><button onClick={()=>setShowCustomerModal(false)}><X/></button></div><div className="flex-1 overflow-y-auto p-4 space-y-2 text-left">{customers.map(c => (<div key={c.id} onClick={()=>{setInvData(p=>({...p, customerName: c.customerName, address: c.address, taxId: c.taxId, branch: c.branch, custSubDistrict: c.custSubDistrict || '', custDistrict: c.custDistrict || '', custProvince: c.custProvince || '', custZipCode: c.custZipCode || ''})); setShowCustomerModal(false); setIsGeneralCustomer(false);}} className="p-4 rounded-xl border border-slate-100 hover:bg-rose-50 cursor-pointer shadow-sm text-left"><p className="font-bold text-left">{c.customerName}</p><p className="text-xs text-slate-400 truncate text-left">{c.address}</p></div>))}</div></div></div>)}
      
      {deleteId && (<div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 font-sarabun text-center"><div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-fadeIn"><div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} className="text-rose-500"/></div><h3 className="text-xl font-bold mb-6 text-slate-800">ลบเอกสารใบนี้?</h3><div className="flex gap-3 text-center"><button onClick={()=>setDeleteId(null)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-center">ยกเลิก</button><button onClick={async ()=>{await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'invoices', deleteId)); setDeleteId(null); showToast("ลบเรียบร้อย", "success");}} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold text-center">ยืนยันลบ</button></div></div></div>)}
      
      <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit print:hidden self-center"><button onClick={() => setMode('create')} className={"px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all " + (mode==='create'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700')}><FileText size={18}/> ออกเอกสาร</button><button onClick={() => setMode('history')} className={"px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all " + (mode==='history'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700')}><Clock size={18}/> ประวัติเอกสาร</button></div>
      
      {mode === 'history' ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-fadeIn h-full flex flex-col text-left">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b border-slate-100">
                <div>
                    <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2"><BarChart2 className="text-indigo-600"/> Document Performance</h3>
                    <p className="text-slate-500 text-sm">วิเคราะห์และจัดการประวัติเอกสารย้อนหลัง</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {[new Date().getFullYear()-1, new Date().getFullYear()].map(y => (
                            <button key={y} onClick={()=>setYearFilter(y)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${yearFilter === y ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>{y}</button>
                        ))}
                    </div>
                    <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="bg-slate-50 border-none rounded-xl text-sm font-bold py-2 px-4 text-slate-600">
                        <option value="all">ทั้งหมด (All Status)</option>
                        <option value="paid">ชำระแล้ว (Paid)</option>
                        <option value="unpaid">รอชำระ (Unpaid)</option>
                    </select>
                    <button onClick={handleExportReport} className="bg-emerald-50 text-emerald-600 p-2 rounded-xl hover:bg-emerald-100 flex items-center gap-2 px-4 text-sm font-bold shadow-sm transition-all"><Download size={18}/> Export Report</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard title="ยอดรวมเอกสาร (Total)" value={invoiceStats.total} color="indigo" icon={<FileText/>} subtitle={`${invoiceStats.count} รายการ`}/>
                <StatCard title="ชำระแล้ว (Paid)" value={invoiceStats.paid} color="emerald" icon={<CheckCircle/>} subtitle="ยอดรับชำระจริง"/>
                <StatCard title="รอชำระ (Unpaid)" value={invoiceStats.unpaid} color="amber" icon={<Clock/>} subtitle="ยอดค้างชำระ"/>
            </div>

            <div className="rounded-2xl border border-slate-100 overflow-x-auto flex-1 custom-scrollbar text-left">
                <table className="w-full text-sm text-left whitespace-nowrap text-left"><thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs sticky top-0 z-10 text-left"><tr><th className="p-4 text-left">Date</th><th className="p-4 text-left">No.</th><th className="p-4 text-left">Customer</th><th className="p-4 text-right">Total</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Action</th></tr></thead><tbody className="divide-y divide-slate-50 text-left">{filteredInvoices.map((inv, idx) => (
                    <tr key={inv.id + "-" + idx} className="hover:bg-indigo-50/30 even:bg-slate-50/50 text-left">
                        <td className="p-4 text-slate-500 text-xs text-left">{formatDate(inv.date)}</td><td className="p-4 text-slate-700 font-bold text-left">{inv.invNo}</td><td className="p-4 text-left">{inv.customerName}</td><td className="p-4 text-right font-bold">{formatCurrency(inv.total)}</td>
                        <td className="p-4 text-center"><button onClick={async ()=>{await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'invoices', inv.id), { status: inv.status === 'paid' ? 'unpaid' : 'paid' });}} className={"px-3 py-1 rounded-full text-[10px] font-bold border transition-all " + (inv.status === 'paid' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-orange-100 text-orange-600 border-orange-200')}>{inv.status === 'paid' ? 'Paid' : 'Unpaid'}</button></td>
                        <td className="p-4 text-center"><div className="flex justify-center gap-2 text-center"><button onClick={() => handleEditInvoice(inv)} className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-100 transition-all flex items-center gap-1 text-center"><Edit size={12}/> Edit/Print</button><button onClick={()=>setDeleteId(inv.id)} className="p-1.5 text-slate-300 hover:text-rose-500 text-center"><Trash2 size={14}/></button></div></td></tr>))}
                        {filteredInvoices.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-400">ไม่พบเอกสารในช่วงเวลานี้</td></tr>}
                    </tbody></table>
            </div>
        </div>
      ) : (
        <><div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 print:hidden space-y-6 text-left">
            <div className="flex justify-between border-b border-slate-100 pb-4 text-left"><div><h3 className="font-bold text-slate-800 text-xl flex items-center gap-2 text-left">Document Editor</h3><p className="text-slate-400 text-sm text-left">สร้างเอกสารใบกำกับภาษี หรือ ใบเสนอราคา</p></div><div className="text-right flex flex-col items-end gap-2 text-right"><button onClick={handleNewInvoice} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 text-right"><PlusCircle size={14}/> New Document</button><div><p className="text-xs text-slate-400 font-bold uppercase text-right">DOC ID</p><p className="text-2xl font-bold text-indigo-600 font-mono text-right">{invData.invNo}</p></div></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between text-left">
                    <div className="text-left space-y-3">
                        <div className="flex justify-between items-start mb-2 text-left">
                          <h4 className="font-bold text-indigo-700 flex items-center gap-2 text-left"><Store size={18}/> ข้อมูลผู้ขาย {loadedProfileId && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full ml-2">โปรไฟล์ที่โหลดอยู่</span>}</h4>
                          <div className="flex gap-2">
                             <button onClick={handleSaveAsDefault} className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded font-bold hover:bg-indigo-700 flex items-center gap-1"><Save size={10}/> บันทึกเป็นค่าเริ่มต้น</button>
                             <button onClick={()=>setShowSellerEditModal(true)} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold hover:bg-slate-200">สลับโปรไฟล์</button>
                          </div>
                        </div>
                        <div className="flex gap-4 items-center mb-2">
                            <div className="w-16 h-16 rounded-lg bg-white p-1 border border-slate-200 flex-shrink-0 cursor-pointer relative group" onClick={() => logoInputRef.current?.click()}>
                                {invData.logo ? <img src={invData.logo} className="w-full h-full object-contain" alt="Logo" /> : <ImageIcon className="w-full h-full p-2 text-slate-300" />}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity"><Edit size={12} className="text-white"/></div>
                                <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={handleLogoUpload} />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">ชื่อร้านค้า</label>
                                <input className="w-full border-0 bg-white rounded-lg p-2 text-sm font-bold shadow-sm" placeholder="ระบุชื่อร้านค้า" value={invData.sellerName} onChange={e=>setInvData({...invData, sellerName: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">เลขผู้เสียภาษี</label>
                                <input className="w-full border-0 bg-white rounded-lg p-2 text-sm shadow-sm font-mono" placeholder="เลขผู้เสียภาษี" value={invData.sellerTaxId} onChange={e=>setInvData({...invData, sellerTaxId: e.target.value})} />
                             </div>
                             <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">สาขา</label>
                                <input className="w-full border-0 bg-white rounded-lg p-2 text-sm shadow-sm" placeholder="00000" value={invData.sellerBranchId} onChange={e=>setInvData({...invData, sellerBranchId: e.target.value})} />
                             </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">ที่อยู่ (ละเอียด)</label>
                            <textarea className="w-full border-0 bg-white rounded-lg p-2 text-xs shadow-sm h-16 leading-relaxed" placeholder="ที่อยู่ บ้านเลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์" value={invData.sellerAddress} onChange={e=>setInvData({...invData, sellerAddress: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">เบอร์โทรศัพท์</label>
                                <input className="w-full border-0 bg-white rounded-lg p-2 text-xs shadow-sm" placeholder="0xx-xxx-xxxx" value={invData.sellerPhone} onChange={e=>setInvData({...invData, sellerPhone: e.target.value})} />
                             </div>
                             <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">อีเมล (ถ้ามี)</label>
                                <input className="w-full border-0 bg-white rounded-lg p-2 text-xs shadow-sm" placeholder="email@shop.com" value={invData.sellerEmail} onChange={e=>setInvData({...invData, sellerEmail: e.target.value})} />
                             </div>
                        </div>
                        {/* Cloud Save Option */}
                        <div className="pt-2">
                           <button onClick={saveSellerProfile} className="w-full text-[10px] border border-emerald-200 text-emerald-600 py-1.5 rounded-lg font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-1">
                               <Database size={10}/> {loadedProfileId ? 'อัปเดตโปรไฟล์นี้ใน Cloud' : 'บันทึกเป็นโปรไฟล์ใหม่ใน Cloud'}
                           </button>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t flex gap-2 text-center">
                      <button onClick={()=>setInvData({...invData, vatType: 'excluded'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border ${invData.vatType==='excluded' ? 'bg-indigo-600 text-white shadow-sm border-indigo-700' : 'bg-white'}`}>แยก VAT (7%)</button>
                      <button onClick={()=>setInvData({...invData, vatType: 'included'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border ${invData.vatType==='included' ? 'bg-indigo-600 text-white shadow-sm border-indigo-700' : 'bg-white'}`}>รวม VAT (7%)</button>
                      <button onClick={()=>setInvData({...invData, vatType: 'none'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border ${invData.vatType==='none' ? 'bg-indigo-600 text-white shadow-sm border-indigo-700' : 'bg-white'}`}>ไม่มี VAT</button>
                    </div>
                </div>
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                    <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm text-left">
                            <label className="text-[10px] font-bold text-indigo-600 mb-1 flex items-center gap-1 text-left">วันที่เอกสาร</label>
                            <input type="date" className="w-full border-0 p-1 text-sm font-bold text-slate-700 bg-transparent focus:ring-0 text-left" value={invData.date} onChange={e => setInvData({ ...invData, date: e.target.value })} />
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-left">
                            <label className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1 text-left">Order ID</label>
                            <input className="w-full border-0 p-1 text-sm font-mono text-indigo-600 bg-transparent focus:ring-0 text-left" placeholder="เลขคำสั่งซื้อ" value={invData.orderId} onChange={e => setInvData({ ...invData, orderId: e.target.value })} />
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-xs text-rose-600 flex items-center gap-2"><User size={16}/> ข้อมูลลูกค้า</h4>
                            <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                <button onClick={() => setIsGeneralCustomer(true)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${isGeneralCustomer ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>ลูกค้าทั่วไป</button>
                                <button onClick={() => setIsGeneralCustomer(false)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!isGeneralCustomer ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>ระบุข้อมูล</button>
                            </div>
                        </div>

                        {!isGeneralCustomer && (
                            <div className="space-y-3 animate-fadeIn">
                                <div className="flex justify-between items-center"><label className="text-[10px] text-slate-500 font-bold uppercase">ข้อมูลผู้รับ</label><button onClick={()=>setShowCustomerModal(true)} className="text-[10px] bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-bold">เลือกเก่า</button></div>
                                <input className="w-full border-0 bg-slate-50 rounded-lg p-2 text-sm shadow-sm" placeholder="ชื่อลูกค้า / บริษัท" value={invData.customerName} onChange={e=>setInvData({...invData, customerName: e.target.value})} />
                                <div className="grid grid-cols-2 gap-2">
                                    <input className="w-full border-0 bg-slate-50 rounded-lg p-2 text-sm shadow-sm" placeholder="เลขผู้เสียภาษี" value={invData.taxId} onChange={e=>setInvData({...invData, taxId: e.target.value})} />
                                    <input className="w-full border-0 bg-slate-50 rounded-lg p-2 text-sm shadow-sm" placeholder="สาขา (00000)" value={invData.branch} onChange={e=>setInvData({...invData, branch: e.target.value})} />
                                </div>
                                <textarea className="w-full border-0 bg-slate-50 rounded-lg p-2 text-sm shadow-sm h-16" placeholder="ที่อยู่ (บ้านเลขที่, ถนน, แขวง, เขต, จังหวัด, ไปรษณีย์)" value={invData.address} onChange={e=>setInvData({...invData, address: e.target.value})} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left"><h4 className="font-bold text-sm text-slate-600 mb-2 text-left">รายการสินค้า</h4>{invData.items.map((it, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center text-left"><span className="text-xs text-slate-400 w-4 text-left">{i+1}.</span><input className="flex-[3] border-0 rounded p-2 text-sm shadow-sm text-left" value={it.desc} onChange={e=>updateItem(i,'desc',e.target.value)}/><input className="w-20 border-0 rounded p-2 text-sm text-center shadow-sm text-center" type="number" value={it.qty} onChange={e=>updateItem(i,'qty',Number(e.target.value))}/><input className="w-24 border-0 rounded p-2 text-sm text-right shadow-sm text-right" type="number" value={it.price} onChange={e=>updateItem(i,'price',Number(e.target.value))}/><button onClick={()=>setInvData({...invData, items: invData.items.filter((_,idx)=>idx!==i)})} className="text-rose-400 p-2 text-center"><Trash2 size={16}/></button></div>))}
                <button onClick={()=>setInvData({...invData, items:[...invData.items, {desc:'', qty:1, unit:'ชิ้น', price:0}]})} className="mt-2 text-[10px] bg-indigo-600 text-white px-4 py-1.5 rounded-lg flex items-center gap-1 w-fit font-bold shadow-md text-center"><PlusCircle size={14}/> เพิ่มรายการ</button>
            </div>
            <div className="flex gap-4 text-center"><button onClick={handleSaveInvoice} className={"flex-1 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all " + (editingDocId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700') + " flex items-center justify-center gap-2 text-center"}><Save size={18}/> {editingDocId ? 'Update Document' : 'Save Document'}</button><button onClick={handleDownloadPDF} className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all text-center"><Download size={18}/> Download ZIP (Original+Copy)</button></div>
        </div>
        <div className="overflow-x-auto pb-10 flex justify-center print:p-0 print:absolute print:left-0 print:top-0 print:w-full print:h-full print:z-50 print:bg-white text-left"><div id="invoice-preview-area" className="shadow-2xl print:shadow-none bg-white p-[30px] w-[210mm] min-h-[296mm] text-sm font-sarabun text-slate-900 leading-relaxed relative box-border text-left">
          <div className="flex justify-between items-start mb-8 text-left"><div className="w-[65%] flex items-center gap-5 text-left">{invData.logo && (<img src={invData.logo} className="w-[90px] h-[90px] object-contain flex-shrink-0 text-left" alt="Logo"/>)}<div className="flex flex-col justify-center text-left"><h2 className="text-xl font-bold text-slate-900 mb-1 leading-tight text-left">{invData.sellerName}</h2><p className="text-slate-600 text-xs leading-snug mb-1 text-left">{invData.sellerAddress}</p><div className="text-xs text-slate-700 leading-snug text-left text-left"><p className="text-left"><b>เลขผู้เสียภาษี:</b> {invData.sellerTaxId} <b>สาขา:</b> {invData.sellerBranchId}</p><p className="text-left"><b>โทร:</b> {invData.sellerPhone} {invData.sellerEmail && <><b>Email:</b> {invData.sellerEmail}</>}</p></div></div></div><div className="text-right w-[35%] flex flex-col items-end text-right"><div className="text-lg font-bold uppercase mb-1 text-right">ใบกำกับภาษี / ใบเสร็จรับเงิน</div><div className="border border-slate-300 p-2 w-full max-w-[200px] text-right text-right"><div className="flex justify-between mb-1 text-right text-right"><span className="font-bold text-slate-500 text-xs">เลขที่ (No.)</span><span className="font-bold">{invData.invNo}</span></div><div className="flex justify-between text-right text-right text-right"><span className="font-bold text-slate-500 text-xs">วันที่ (Date)</span><span>{formatDate(invData.date)}</span></div><div className="flex justify-between text-right text-right text-right"><span className="font-bold text-slate-500 text-xs">Order ID</span><span>{invData.orderId || "-"}</span></div></div><div className="mt-2 text-right text-right"><span className={"px-3 py-1 border rounded text-xs font-bold uppercase " + (docTypeStatus === 'original' ? 'border-black text-black' : 'border-slate-300 text-slate-400') + " text-right"}>{docTypeStatus === 'original' ? 'ต้นฉบับ (Original)' : 'สำเนา (Copy)'}</span></div></div></div>
          
          <div className="border border-slate-300 p-4 mb-4 flex gap-4 text-left">
            <div className="flex-1 text-left">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">ลูกค้า (Customer)</div>
                <p className="font-bold text-base mb-1">{isGeneralCustomer ? 'ลูกค้าทั่วไป' : (invData.customerName || 'ลูกค้าทั่วไป')}</p>
                {!isGeneralCustomer && invData.customerName !== 'ลูกค้าทั่วไป' && (
                  <>
                    <p className="text-xs text-slate-600 mb-1">
                      {invData.address}
                    </p>
                    {(invData.taxId || invData.branch) && (
                      <p className="text-xs text-slate-700">
                        <b>เลขผู้เสียภาษี:</b> {invData.taxId || '-'} <b>สาขา:</b> {invData.branch || '00000'}
                      </p>
                    )}
                  </>
                )}
            </div>
          </div>

          <table className="w-full mb-6 border-collapse text-left"><thead><tr className="bg-slate-100 text-slate-800 font-bold text-xs uppercase text-center"><th className="py-2 border-y border-slate-300 w-12 text-center">ลำดับ<br/>No.</th><th className="py-2 border-y border-slate-300 text-left pl-4 text-left">รายการสินค้า / บริการ<br/>Description</th><th className="py-2 border-y border-slate-300 w-20 text-center text-center">จำนวน<br/>Qty</th><th className="py-2 border-y border-slate-300 w-24 text-right text-right">หน่วยละ<br/>Unit Price</th><th className="py-2 border-y border-slate-300 w-28 text-right text-right">จำนวนเงิน<br/>Amount</th></tr></thead><tbody className="text-left text-left">{invData.items.map((it, i) => (<tr key={"item-" + i} className="text-left"><td className="py-2 border-b border-slate-200 text-center align-top text-center">{i+1}</td><td className="py-2 border-b border-slate-200 pl-4 align-top text-left">{it.desc}</td><td className="py-2 border-b border-slate-200 text-center align-top text-center">{it.qty}</td><td className="py-2 border-b border-slate-200 text-right pr-2 align-top text-right">{formatCurrency(it.price)}</td><td className="py-2 border-b border-slate-200 text-right pr-2 font-bold align-top text-right">{formatCurrency(it.qty * it.price)}</td></tr>))}{[...Array(Math.max(0, 5 - invData.items.length))].map((_, i) => (<tr key={"empty-" + i} className="h-8 text-left"><td className="border-b border-slate-100 text-left" colSpan="5"></td></tr>))}</tbody></table>
          
          <div className="flex justify-between items-start">
              <div className="w-[55%] pt-2">
                  <div className="bg-slate-50 p-3 rounded border border-slate-200 text-left">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">ตัวอักษร (Total in Words)</span>
                      <span className="font-bold text-slate-800">{ArabicToThaiBaht(totals.total)}</span>
                  </div>
              </div>
              <div className="w-[40%] text-right text-right">
                  <div className="grid grid-cols-[auto_auto] gap-y-2 text-right text-sm">
                      <span className="font-bold text-slate-600 text-right text-right">รวมเป็นเงิน</span><span className="font-medium">{formatCurrency(totals.sub)}</span>
                      {invData.discount > 0 && <><span className="font-bold text-rose-600 text-right text-right">หักส่วนลด</span><span className="text-rose-600">-{formatCurrency(invData.discount)}</span></>}
                      <span className="font-bold text-slate-600 text-right text-right">มูลค่าสินค้า (Pre-VAT)</span><span className="font-medium">{formatCurrency(totals.preVat)}</span>
                      <span className="font-bold text-slate-600 text-right text-right">ภาษีมูลค่าเพิ่ม 7%</span><span className="font-medium">{formatCurrency(totals.vat)}</span>
                      <div className="col-span-2 border-t border-black my-1 text-right"></div>
                      <span className="font-bold text-slate-900 text-lg text-right text-right">จำนวนเงินทั้งสิ้น</span><span className="font-bold text-slate-900 text-lg">{formatCurrency(totals.total)}</span>
                      <div className="col-span-2 border-t-2 border-black my-0.5 text-right"></div>
                  </div>
              </div>
          </div>
          <div className="flex justify-between mt-12 px-8 absolute bottom-10 w-[calc(100%-60px)] text-center text-center"><div className="text-center w-[40%] text-slate-700 text-center text-center"><div className="border-b border-dotted border-slate-400 h-8 mb-2 text-center"></div><p className="text-xs font-bold text-center">ผู้รับวางบิล / ผู้รับของ</p><p className="text-xs font-bold text-slate-400 uppercase text-center">(Receiver Signature)</p></div><div className="text-center w-[40%] text-slate-700 text-center text-center"><div className="border-b border-dotted border-slate-400 h-8 mb-2 text-center"></div><p className="text-xs font-bold text-center">ผู้รับเงิน / ผู้ออกใบกำกับภาษี</p><p className="text-xs text-slate-400 uppercase text-center text-center">(Authorized Signature)</p></div></div>
        </div></div></>)}
    </div>
  );
};

const StockManager = ({ appId, showToast }) => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [inventoryLots, setInventoryLots] = useState([]); 
  
  const initialProduct = { name: '', sku: '', category: 'สินค้าทั่วไป', cost: '', price: '', stock: 0 };
  const [formData, setFormData] = useState(initialProduct);

  useEffect(() => {
    const unsubProducts = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'products')), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubLots = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'inventory_lots')), (snap) => {
        setInventoryLots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubProducts(); unsubLots(); };
  }, [appId]);

  const handleSave = async () => {
    try {
      const data = { ...formData, cost: Number(formData.cost), price: Number(formData.price), stock: Number(formData.stock) };
      if (editingProduct) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', editingProduct.id), { 
            name: data.name, sku: data.sku, category: data.category, price: data.price, cost: data.cost, updatedAt: serverTimestamp() 
        });
        showToast("อัปเดตข้อมูลสินค้าสำเร็จ", "success");
      } else {
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), { ...data, createdAt: serverTimestamp() });
        if (data.stock > 0) {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'inventory_lots'), {
                productId: docRef.id,
                productName: data.name,
                initialQty: data.stock,
                remainingQty: data.stock,
                cost: data.cost,
                costPerUnit: data.cost,
                createdAt: serverTimestamp(),
                note: 'Initial Stock'
            });
        }
        showToast("เพิ่มสินค้าสำเร็จ", "success");
      }
      setShowModal(false); setFormData(initialProduct); setEditingProduct(null);
    } catch (e) { showToast("บันทึกไม่สำเร็จ", "error"); }
  };

  const handleDelete = async (id) => {
    if (confirm("ต้องการลบสินค้านี้?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id));
      showToast("ลบสินค้าสำเร็จ", "success");
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
  
  const totalValue = inventoryLots.reduce((sum, lot) => sum + (lot.remainingQty * lot.costPerUnit), 0);
  const lowStock = products.filter(p => p.stock < 10).length;

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col animate-fadeIn text-left">
      <div className="flex justify-between items-center mb-6">
        <div><h3 className="font-bold text-slate-800 text-xl flex items-center gap-2"><Package className="text-indigo-600"/> สต็อกสินค้า (FIFO Inventory)</h3><p className="text-slate-500 text-sm">จัดการสินค้าคงคลังแบบเข้าก่อน-ออกก่อน</p></div>
        <button onClick={() => { setEditingProduct(null); setFormData(initialProduct); setShowModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"><PlusCircle size={18}/> เพิ่มสินค้า</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100"><p className="text-xs font-bold text-blue-600 uppercase">สินค้าทั้งหมด</p><p className="text-2xl font-bold text-blue-800">{products.length} <span className="text-sm font-normal">รายการ</span></p></div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100"><p className="text-xs font-bold text-emerald-600 uppercase">มูลค่าคงคลัง (Real Cost)</p><p className="text-2xl font-bold text-emerald-800">{formatCurrency(totalValue)}</p></div>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100"><p className="text-xs font-bold text-orange-600 uppercase">สินค้าใกล้หมด (&lt;10)</p><p className="text-2xl font-bold text-orange-800">{lowStock} <span className="text-sm font-normal">รายการ</span></p></div>
      </div>

      <div className="relative mb-4"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input className="w-full bg-slate-50 border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-indigo-100" placeholder="ค้นหาชื่อสินค้า, SKU..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="flex-1 overflow-auto rounded-2xl border border-slate-100 custom-scrollbar">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs sticky top-0 border-b border-slate-200">
            <tr>
              <th className="p-4">สินค้า</th>
              <th className="p-4">หมวดหมู่</th>
              <th className="p-4 text-right">ต้นทุนล่าสุด</th>
              <th className="p-4 text-right">ราคาขาย</th>
              <th className="p-4 text-center">คงเหลือ</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="p-4"><div className="font-bold text-slate-700">{p.name}</div><div className="text-xs text-slate-400 font-mono">{p.sku}</div></td>
                <td className="p-4"><span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs">{p.category}</span></td>
                <td className="p-4 text-right text-slate-500">{formatCurrency(p.cost)}</td>
                <td className="p-4 text-right font-bold text-indigo-600">{formatCurrency(p.price)}</td>
                <td className="p-4 text-center"><span className={`px-2 py-1 rounded font-bold text-xs ${p.stock <= 0 ? 'bg-rose-100 text-rose-600' : p.stock < 10 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>{p.stock}</span></td>
                <td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => { setEditingProduct(p); setFormData(p); setShowModal(true); }} className="text-slate-400 hover:text-indigo-600"><Edit size={16}/></button><button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={16}/></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-md shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X/></button>
            <h3 className="text-lg font-bold mb-4">{editingProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}</h3>
            
            <div className="space-y-3 mb-6">
              <div><label className="text-xs font-bold text-slate-500">ชื่อสินค้า</label><input className="w-full border rounded-lg p-2 text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-slate-500">รหัสสินค้า (SKU)</label><input className="w-full border rounded-lg p-2 text-sm" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} /></div>
                <div><label className="text-xs font-bold text-slate-500">หมวดหมู่</label><select className="w-full border rounded-lg p-2 text-sm" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>{CONSTANTS.CATEGORIES.INCOME.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs font-bold text-slate-500">ต้นทุน (ล่าสุด)</label><input type="number" className="w-full border rounded-lg p-2 text-sm text-right" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} /></div>
                <div><label className="text-xs font-bold text-slate-500">ราคาขาย</label><input type="number" className="w-full border rounded-lg p-2 text-sm text-right font-bold text-indigo-600" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} /></div>
                <div><label className="text-xs font-bold text-slate-500">คงเหลือปัจจุบัน</label><input type="number" disabled className="w-full bg-slate-100 border rounded-lg p-2 text-sm text-center font-bold text-slate-500" value={formData.stock} /></div>
              </div>
              {!editingProduct && <p className="text-[10px] text-orange-500">* หากใส่จำนวนคงเหลือ ระบบจะสร้าง Lot สินค้าเริ่มต้นให้ทันที</p>}
            </div>

            {editingProduct && (
                <div className="border-t pt-4">
                    <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-2"><Layers size={14}/> Active Inventory Lots</h4>
                    <div className="max-h-32 overflow-y-auto border rounded-lg bg-slate-50">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 text-slate-500 sticky top-0"><tr><th className="p-2">Date</th><th className="p-2 text-right">Cost</th><th className="p-2 text-center">Remaining</th></tr></thead>
                            <tbody>
                                {inventoryLots.filter(l => l.productId === editingProduct.id && l.remainingQty > 0).sort((a,b)=>a.createdAt?.seconds - b.createdAt?.seconds).map(l => (
                                    <tr key={l.id} className="border-b border-slate-100 last:border-0">
                                        <td className="p-2">{formatDate(l.createdAt)}</td>
                                        <td className="p-2 text-right">{formatCurrency(l.costPerUnit)}</td>
                                        <td className="p-2 text-center font-bold text-indigo-600">{l.remainingQty}</td>
                                    </tr>
                                ))}
                                {inventoryLots.filter(l => l.productId === editingProduct.id && l.remainingQty > 0).length === 0 && <tr><td colSpan="3" className="p-2 text-center text-slate-400">No active lots</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 bg-slate-100 rounded-lg font-bold text-slate-600">ปิด</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md">บันทึกข้อมูล</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaxReport = ({ transactions, invoices }) => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth());
    const [activeReport, setActiveReport] = useState('sales'); 
    const [shopFilter, setShopFilter] = useState('all');

    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  
    const taxData = useMemo(() => {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
  
      const periodTrans = transactions.filter(t => {
          const d = normalizeDate(t.date);
          const matchDate = d >= start && d <= end;
          const matchShop = shopFilter === 'all' || t.shop === shopFilter;
          return matchDate && matchShop;
      });
  
      const sales = periodTrans.filter(t => t.type === 'income');
      
      let salesTotalBase = 0; 
      let salesTotalVat = 0;
      let salesTotalGross = 0;

      sales.forEach(t => {
          if (t.vatType === 'none') {
             salesTotalGross += (Number(t.total) || 0);
          } else {
             salesTotalBase += (Number(t.net) || Number(t.amount) || 0);
             salesTotalVat += (Number(t.vat) || 0);
             salesTotalGross += (Number(t.total) || 0);
          }
      });
  
      const purchases = periodTrans.filter(t => t.type === 'expense' && t.vatType !== 'none');
      let purchaseTotalBase = 0;
      let purchaseTotalVat = 0;
      let purchaseTotalGross = 0;

      purchases.forEach(t => {
           purchaseTotalBase += (Number(t.net) || Number(t.amount) || 0);
           purchaseTotalVat += (Number(t.vat) || 0);
           purchaseTotalGross += (Number(t.total) || 0);
      });
  
      const vatPayable = salesTotalVat - purchaseTotalVat;
  
      return { 
          sales, 
          purchases, 
          salesTotalBase, 
          salesTotalVat, 
          salesTotalGross,
          purchaseTotalBase, 
          purchaseTotalVat, 
          purchaseTotalGross,
          vatPayable 
      };
    }, [transactions, year, month, shopFilter]);
  
    const exportTaxReport = () => {
       const fileName = `Tax_Report_PP30_${months[month]}_${year}_${shopFilter}.xlsx`;
       const header = activeReport === 'sales'
          ? [['วันที่', 'เลขอ้างอิง/ใบกำกับ', 'ลูกค้า/รายละเอียด', 'มูลค่าสินค้า (Tax Base)', 'ภาษีมูลค่าเพิ่ม (VAT)', 'จำนวนเงินรวม', 'ร้านค้า']]
          : [['วันที่', 'เลขใบกำกับภาษี', 'ผู้ขาย/ร้านค้า', 'เลขผู้เสียภาษี', 'มูลค่าสินค้า (Tax Base)', 'ภาษีมูลค่าเพิ่ม (VAT)', 'จำนวนเงินรวม', 'ร้านค้า']];
  
       const data = activeReport === 'sales'
          ? taxData.sales.map(t => [formatDate(t.date), t.invNo || t.orderId || '-', t.customerName || t.description || 'ลูกค้าทั่วไป', t.net || t.amount, t.vat || 0, t.total, t.shop])
          : taxData.purchases.map(t => [formatDate(t.date), t.taxInvoiceNo || '-', t.vendorName || t.description || '-', t.vendorTaxId || '-', t.net || t.amount, t.vat || 0, t.total, t.shop]);
  
       exportToExcel(fileName, data, header);
    };
  
    return (
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col animate-fadeIn text-left">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-100 pb-6">
              <div>
                  <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2"><Calculator className="text-indigo-600"/> รายงานภาษีมูลค่าเพิ่ม (Performance Report)</h3>
                  <p className="text-slate-500 text-sm">สำหรับใช้ยื่นแบบ ภ.พ.30 (P.P.30)</p>
              </div>
              <div className="flex gap-2">
                  <select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl text-sm font-bold py-2 px-4 text-slate-600 shadow-sm">
                      <option value="all">ทุกร้านค้า (All)</option>
                      {CONSTANTS.SHOPS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-slate-50 border-none rounded-xl text-sm font-bold py-2 px-4 text-slate-600">
                      {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-slate-50 border-none rounded-xl text-sm font-bold py-2 px-4 text-slate-600">
                      {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <button onClick={exportTaxReport} className="bg-indigo-50 text-indigo-600 p-2 rounded-xl hover:bg-indigo-100 flex items-center gap-2 px-4 text-sm font-bold shadow-sm transition-all">
                      <Download size={18}/> Export Excel
                  </button>
              </div>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10 text-emerald-600"><TrendingUp size={60}/></div>
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-4 tracking-wider">1. ภาษีขาย (Output Tax)</p>
                  <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                          <span className="text-slate-500">ยอดขาย (Tax Base)</span>
                          <span className="font-bold text-slate-700">{formatCurrency(taxData.salesTotalBase)}</span>
                      </div>
                      <div className="flex justify-between items-end pt-2 border-t border-emerald-50">
                          <span className="text-sm font-bold text-emerald-700">ภาษีขายต้องนำส่ง</span>
                          <span className="text-xl font-bold text-emerald-600">{formatCurrency(taxData.salesTotalVat)}</span>
                      </div>
                  </div>
              </div>
  
               <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10 text-rose-600"><TrendingDown size={60}/></div>
                  <p className="text-xs font-bold text-rose-600 uppercase mb-4 tracking-wider">2. ภาษีซื้อ (Input Tax)</p>
                  <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                          <span className="text-slate-500">ยอดซื้อ (Tax Base)</span>
                          <span className="font-bold text-slate-700">{formatCurrency(taxData.purchaseTotalBase)}</span>
                      </div>
                      <div className="flex justify-between items-end pt-2 border-t border-rose-50">
                          <span className="text-sm font-bold text-rose-700">ภาษีซื้อขอคืนได้</span>
                          <span className="text-xl font-bold text-rose-600">{formatCurrency(taxData.purchaseTotalVat)}</span>
                      </div>
                  </div>
              </div>
  
              <div className={`col-span-1 md:col-span-2 p-6 rounded-2xl border shadow-md flex flex-col justify-center relative overflow-hidden ${taxData.vatPayable > 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <p className={`text-xs font-bold uppercase mb-2 relative z-10 ${taxData.vatPayable > 0 ? 'text-indigo-600' : 'text-emerald-600'}`}>3. ภาษีมูลค่าเพิ่มสุทธิ (Net VAT)</p>
                   <div className="flex justify-between items-end pt-2 relative z-10 mt-auto">
                      <span className={`text-sm font-bold ${taxData.vatPayable > 0 ? 'text-indigo-800' : 'text-emerald-800'}`}>
                          {taxData.vatPayable > 0 ? 'ต้องชำระภาษีเพิ่ม (Payable)' : 'มีสิทธิขอคืนภาษี (Refundable)'}
                      </span>
                      <span className={`text-3xl font-bold ${taxData.vatPayable > 0 ? 'text-indigo-600' : 'text-emerald-600'}`}>{formatCurrency(Math.abs(taxData.vatPayable))}</span>
                  </div>
                  <div className={`absolute -right-5 -bottom-5 opacity-10 ${taxData.vatPayable > 0 ? 'text-indigo-600' : 'text-emerald-600'}`}><Wallet size={100}/></div>
              </div>
          </div>
  
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit mb-4 self-center md:self-start">
              <button onClick={() => setActiveReport('sales')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeReport === 'sales' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <FileText size={16}/> รายงานภาษีขาย (Output Tax Report)
              </button>
              <button onClick={() => setActiveReport('purchase')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeReport === 'purchase' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <FileText size={16}/> รายงานภาษีซื้อ (Input Tax Report)
              </button>
          </div>
  
          <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 custom-scrollbar shadow-sm bg-white">
              <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs sticky top-0 border-b border-slate-200">
                      <tr>
                          <th className="p-4 w-32">วันที่</th>
                          <th className="p-4 w-40">{activeReport === 'sales' ? 'เลขที่ใบกำกับ' : 'เลขใบกำกับภาษี'}</th>
                          <th className="p-4">{activeReport === 'sales' ? 'ชื่อผู้ซื้อสินค้า/ผู้รับบริการ' : 'ชื่อผู้ขายสินค้า/ผู้ให้บริการ'}</th>
                           {activeReport === 'purchase' && <th className="p-4 w-32">เลขผู้เสียภาษี</th>}
                          <th className="p-4 text-right w-32">มูลค่าสินค้า</th>
                          <th className="p-4 text-right w-32">จำนวนภาษี</th>
                          <th className="p-4 text-right w-32">จำนวนเงินรวม</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {(activeReport === 'sales' ? taxData.sales : taxData.purchases).length > 0 ? (
                           (activeReport === 'sales' ? taxData.sales : taxData.purchases).map((t, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-4 text-slate-500 font-mono text-xs">{formatDate(t.date)}</td>
                                  <td className="p-4 font-mono text-xs font-bold text-slate-700">{activeReport === 'sales' ? (t.invNo || t.orderId || '-') : (t.taxInvoiceNo || '-')}</td>
                                  <td className="p-4 text-slate-700">{activeReport === 'sales' ? (t.customerName || t.description) : (t.vendorName || t.description)}</td>
                                  {activeReport === 'purchase' && <td className="p-4 font-mono text-xs text-slate-500">{t.vendorTaxId || '-'}</td>}
                                  <td className="p-4 text-right text-slate-600">{formatCurrency(t.net || t.amount)}</td>
                                  <td className="p-4 text-right font-bold text-slate-800">{formatCurrency(t.vat || 0)}</td>
                                  <td className="p-4 text-right font-bold text-indigo-600">{formatCurrency(t.total)}</td>
                              </tr>
                          ))
                      ) : (
                          <tr><td colSpan="7" className="p-12 text-center text-slate-300 flex flex-col items-center justify-center gap-2">
                              <Inbox size={40} className="opacity-20"/>
                              <span>ไม่พบข้อมูลภาษีในเดือนนี้</span>
                          </td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appId, setAppId] = useState(localStorage.getItem('merchant_app_id') || CONSTANTS.IDS.DEV);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
      const id = Date.now(); setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const removeToast = (id) => { setToasts(prev => prev.filter(t => t.id !== id)); };

  const toggleAppMode = () => {
    const newId = appId === CONSTANTS.IDS.DEV ? CONSTANTS.IDS.PROD : CONSTANTS.IDS.DEV;
    setAppId(newId); localStorage.setItem('merchant_app_id', newId);
    setLoading(true); addToast("Switched to " + (newId === CONSTANTS.IDS.DEV ? 'Dev' : 'Production') + " Mode", 'success');
  };

  const isDev = appId === CONSTANTS.IDS.DEV;

  useEffect(() => {
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (e) {} }; initAuth();
    onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const qInc = query(collection(db, 'artifacts', appId, 'public', 'data', 'transactions_income'));
    const qExp = query(collection(db, 'artifacts', appId, 'public', 'data', 'transactions_expense'));
    const qInv = query(collection(db, 'artifacts', appId, 'public', 'data', 'invoices'));
    
    const unsubInc = onSnapshot(qInc, (s) => setTransactions(prev => [...prev.filter(t=>t.type!=='income'), ...s.docs.map(d=>({id:d.id, ...d.data(), date: normalizeDate(d.data().date)}))]));
    const unsubExp = onSnapshot(qExp, (s) => setTransactions(prev => [...prev.filter(t=>t.type!=='expense'), ...s.docs.map(d=>({id:d.id, ...d.data(), date: normalizeDate(d.data().date)}))]));
    const unsubInv = onSnapshot(qInv, (s) => { setInvoices(s.docs.map(d=>({id:d.id, ...d.data(), date: normalizeDate(d.data().date)}))); setLoading(false); });
    return () => { unsubInc(); unsubExp(); unsubInv(); };
  }, [user, appId]);

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard transactions={transactions} invoices={invoices} />;
      case 'records': return <RecordManager user={user} transactions={transactions} invoices={invoices} appId={appId} showToast={addToast} />;
      case 'invoice': return <InvoiceGenerator user={user} invoices={invoices} appId={appId} showToast={addToast} />;
      case 'stock': return <StockManager appId={appId} showToast={addToast} />;
      case 'taxes': return <TaxReport transactions={transactions} invoices={invoices} />;
      default: return <Dashboard transactions={transactions} invoices={invoices} />;
    }
  };

  if (loading && !user) return <LoadingScreen />;

  return (
    <div className="flex h-[100dvh] bg-slate-50 font-sans text-slate-800 overflow-hidden font-sarabun selection:bg-indigo-100 text-left">
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <aside className={"fixed lg:static inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out " + (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0") + " flex flex-col text-left"}>
        <div className="p-6 border-b border-slate-800 text-left"><h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-2 text-left"><Wallet className="text-indigo-400 text-left"/> MerchantTax</h1></div>
        <nav className="p-4 space-y-1 mt-2 flex-1 overflow-y-auto text-left">
          <NavButton active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setSidebarOpen(false);}} icon={<PieChart size={20} />} label="ภาพรวมธุรกิจ (Pro)" />
          <NavButton active={activeTab === 'records'} onClick={() => {setActiveTab('records'); setSidebarOpen(false);}} icon={<FileText size={20} />} label="บันทึกรายการ" />
          <NavButton active={activeTab === 'invoice'} onClick={() => {setActiveTab('invoice'); setSidebarOpen(false);}} icon={<Printer size={20} />} label="ใบกำกับภาษี (Pro)" />
          <NavButton active={activeTab === 'stock'} onClick={() => {setActiveTab('stock'); setSidebarOpen(false);}} icon={<Package size={20} />} label="สต็อกสินค้า" />
          <NavButton active={activeTab === 'taxes'} onClick={() => {setActiveTab('taxes'); setSidebarOpen(false);}} icon={<Calculator size={20} />} label="รายงานภาษี" />
        </nav>
        <div className="p-6 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800 text-left">
            <button onClick={toggleAppMode} className={"w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all " + (isDev ? 'bg-indigo-900 text-indigo-200 ring-1 ring-indigo-700 hover:bg-indigo-800' : 'bg-emerald-900 text-emerald-200 ring-1 ring-emerald-700 hover:bg-emerald-800') + " text-center"}>
              {isDev ? <Code size={14}/> : <Database size={14}/>}
              {isDev ? 'Switch to Production' : 'Switch to Dev Mode'}
            </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full text-left">
        <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 p-4 lg:px-8 flex justify-between items-center z-10 sticky top-0 text-left">
          <div className="flex items-center gap-3 text-left"><button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 rounded-md hover:bg-slate-100 transition-colors text-left"><Menu size={24} /></button><h2 className="font-semibold text-slate-800 text-lg text-left">{activeTab.toUpperCase()}</h2></div>
          <div className="flex items-center gap-3 text-right">{loading && <div className="text-xs font-bold text-indigo-600 flex items-center gap-1 animate-pulse text-right"><Loader size={12} className="animate-spin text-right"/> Syncing...</div>}</div>
        </header>
        <div className="flex-1 overflow-auto p-2 lg:p-6 relative scroll-smooth w-full text-left">{renderContent()}</div>
      </main>
    </div>
  );
}
