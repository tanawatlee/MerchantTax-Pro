import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  PieChart, Wallet, FileText, Calculator, Save, TrendingUp, TrendingDown, 
  Trash2, Edit, Menu, X, Printer, 
  Camera, Sparkles, Loader, 
  Calendar, Target, User, Home,
  Package, History, CheckCircle, Download, ArrowUpRight, ArrowDownRight, Zap, MessageSquare, Send, Eye, Plus, CreditCard, AlertTriangle
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy, where, setDoc } from 'firebase/firestore';

// --- Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyC9kT4Pji_e-i3VCm1jlSoy0fBe1PLWHm0",
  authDomain: "merchant-tax-app.firebaseapp.com",
  projectId: "merchant-tax-app",
  storageBucket: "merchant-tax-app.firebasestorage.app",
  messagingSenderId: "168794198420",
  appId: "1:168794198420:web:d792a54ffac979dd95bf81",
  measurementId: "G-ZS2X8BR5JD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = 'eatsanduse'; 

// ==========================================
// UTILITIES & HELPER FUNCTIONS
// ==========================================

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('th-TH', { 
    style: 'decimal', 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
};

const formatDateISO = (date) => date.toISOString().split('T')[0];

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

// CSV Export Helper
const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;
  const separator = ',';
  const keys = Object.keys(data[0]);
  const csvContent = [
    keys.join(separator),
    ...data.map(row => keys.map(k => {
      let cell = row[k] === null || row[k] === undefined ? '' : row[k];
      cell = cell instanceof Date ? cell.toISOString().split('T')[0] : cell.toString().replace(/"/g, '""');
      if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
      return cell;
    }).join(separator))
  ].join('\n');

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const calculateProgressiveTax = (netIncome) => {
  let tax = 0;
  if (netIncome > 150000) tax += Math.min(Math.max(netIncome - 150000, 0), 150000) * 0.05; 
  if (netIncome > 300000) tax += Math.min(Math.max(netIncome - 300000, 0), 200000) * 0.10; 
  if (netIncome > 500000) tax += Math.min(Math.max(netIncome - 500000, 0), 250000) * 0.15; 
  if (netIncome > 750000) tax += Math.min(Math.max(netIncome - 750000, 0), 250000) * 0.20; 
  if (netIncome > 1000000) tax += Math.min(Math.max(netIncome - 1000000, 0), 1000000) * 0.25; 
  return tax;
};

// ==========================================
// CUSTOM HOOKS
// ==========================================

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        if (mounted) {
           try { await signInAnonymously(auth); } catch (e) { console.error(e); }
        }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { if (mounted) { setUser(u); setLoading(false); } });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  return { user, loading };
};

const useDataSync = (user) => {
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]); // New Vendors State
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) { setTransactions([]); setInvoices([]); setCustomers([]); setVendors([]); return; }

    const qTrans = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'transactions'));
    const unsubTrans = onSnapshot(qTrans, (snap) => {
      const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id, date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date || new Date()) }));
      data.sort((a, b) => b.date - a.date);
      setTransactions(data);
    });

    const qInv = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'invoices'));
    const unsubInv = onSnapshot(qInv, (snap) => {
      const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id, date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date || new Date()) }));
      data.sort((a, b) => (b.invNo || '') > (a.invNo || '') ? -1 : 1);
      setInvoices(data);
    });

    const qCust = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'customers'));
    const unsubCust = onSnapshot(qCust, (snap) => {
      const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      data.sort((a, b) => (a.customerName || '').localeCompare(b.customerName || ''));
      setCustomers(data);
    });

    const qVend = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'vendors')); // Vendor Query
    const unsubVend = onSnapshot(qVend, (snap) => {
      const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      data.sort((a, b) => (a.vendorName || '').localeCompare(b.vendorName || ''));
      setVendors(data);
      setLoadingData(false);
    });

    return () => { unsubTrans(); unsubInv(); unsubCust(); unsubVend(); };
  }, [user]);

  return { transactions, invoices, customers, vendors, loadingData };
};

const useGemini = () => {
  const [loading, setLoading] = useState(false);
  const apiKey = ""; 

  const callApi = useCallback(async (prompt, imageBase64 = null) => {
    setLoading(true);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const parts = [{ text: prompt }];
    if (imageBase64) {
      parts.push({ inlineData: { mimeType: imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg', data: imageBase64.split(',')[1] } });
    }
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] }) });
      if (!response.ok) throw new Error('API Request Failed');
      const data = await response.json();
      setLoading(false);
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (error) {
      console.error(error); setLoading(false); return null;
    }
  }, []);
  return { callApi, loading };
};

// ==========================================
// UI COMPONENTS
// ==========================================

const NavButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
    <span className="font-medium tracking-wide text-sm">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>}
  </button>
);

const StatCard = ({ title, value, color, icon, trend, subText }) => (
  <div className={`bg-white p-6 rounded-3xl shadow-sm border ${color === 'emerald' ? 'border-emerald-100' : color === 'rose' ? 'border-rose-100' : 'border-indigo-100'} flex flex-col justify-between h-full`}>
    <div className="flex justify-between items-start mb-2">
      <div>
        <p className={`font-bold mb-1 text-xs uppercase tracking-wider ${color === 'emerald' ? 'text-emerald-600' : color === 'rose' ? 'text-rose-600' : 'text-indigo-600'}`}>{title}</p>
        <h3 className={`text-3xl font-bold ${color === 'emerald' ? 'text-emerald-700' : color === 'rose' ? 'text-rose-700' : 'text-indigo-700'}`}>{formatCurrency(value)}</h3>
      </div>
      <div className={`p-3 rounded-2xl ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
        {icon}
      </div>
    </div>
    <div className="flex items-center gap-2 mt-2">
      {trend !== undefined && (
        <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {trend >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
          {Math.abs(trend).toFixed(1)}%
        </span>
      )}
      <span className="text-xs text-slate-400 font-medium">{subText}</span>
    </div>
  </div>
);

// Custom Confirm Modal
const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full animate-fadeIn">
        <div className="flex items-center gap-3 text-rose-600 mb-4">
          <div className="p-2 bg-rose-100 rounded-full"><AlertTriangle size={24} /></div>
          <h3 className="font-bold text-lg">ยืนยันการลบ</h3>
        </div>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors">ยกเลิก</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold transition-colors shadow-lg shadow-rose-200">ลบรายการ</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// FEATURE COMPONENTS
// ==========================================

const Dashboard = ({ transactions }) => {
  const [filterDate, setFilterDate] = useState(new Date());
  const [aiAdvice, setAiAdvice] = useState("");
  const { callApi, loading: isAnalyzing } = useGemini();

  const handleMonthChange = (e) => {
    const newDate = new Date(filterDate);
    newDate.setMonth(parseInt(e.target.value));
    setFilterDate(newDate);
  };

  const handleYearChange = (e) => {
    const newDate = new Date(filterDate);
    newDate.setFullYear(parseInt(e.target.value));
    setFilterDate(newDate);
  };

  const analytics = useMemo(() => {
    const currentMonth = filterDate.getMonth();
    const currentYear = filterDate.getFullYear();
    
    const currentTrans = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const prevDate = new Date(filterDate);
    prevDate.setMonth(currentMonth - 1);
    const prevTrans = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === prevDate.getMonth() && d.getFullYear() === prevDate.getFullYear();
    });

    const calculateTotals = (trans) => ({
      income: trans.filter(t => t.type === 'income').reduce((s, t) => s + t.total, 0),
      expense: trans.filter(t => t.type === 'expense').reduce((s, t) => s + t.total, 0),
    });

    const current = calculateTotals(currentTrans);
    const prev = calculateTotals(prevTrans);

    const growth = {
      income: prev.income === 0 ? 100 : ((current.income - prev.income) / prev.income) * 100,
      expense: prev.expense === 0 ? 100 : ((current.expense - prev.expense) / prev.expense) * 100,
    };

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyTrend = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayTrans = currentTrans.filter(t => new Date(t.date).getDate() === day);
      return {
        day,
        income: dayTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.total, 0),
        expense: dayTrans.filter(t => t.type === 'expense').reduce((s, t) => s + t.total, 0)
      };
    });

    const categoryStats = currentTrans.filter(t => t.type === 'income').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.total;
      return acc;
    }, {});
    const topCategories = Object.entries(categoryStats)
      .map(([name, value]) => ({ name, value, percent: current.income > 0 ? (value/current.income)*100 : 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { 
      ...current, 
      profit: current.income - current.expense, 
      prev, 
      growth, 
      dailyTrend,
      topCategories
    };
  }, [transactions, filterDate]);

  const handleAnalyze = async () => {
    const summary = { 
      month: filterDate.toLocaleDateString('th-TH', { month: 'long' }),
      income: analytics.income, 
      growth: analytics.growth.income.toFixed(1),
      topCategory: analytics.topCategories[0]?.name || 'None'
    };
    const prompt = `Act as a Thai Business Analyst. Data: ${JSON.stringify(summary)}. Give 1 concise, actionable insight in Thai.`;
    const result = await callApi(prompt);
    setAiAdvice(result || "ไม่สามารถวิเคราะห์ได้");
  };

  const maxDaily = Math.max(...analytics.dailyTrend.map(d => Math.max(d.income, d.expense)), 1000);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
         <h2 className="font-bold text-slate-700 flex items-center gap-2"><PieChart className="text-indigo-600"/> Business Intelligence</h2>
         <div className="flex gap-2">
            <select className="bg-slate-50 border-0 rounded-lg p-2 font-bold text-slate-700 text-sm" value={filterDate.getMonth()} onChange={handleMonthChange}>
               {['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'].map((m,i)=><option key={i} value={i}>{m}</option>)}
            </select>
            <select className="bg-slate-50 border-0 rounded-lg p-2 font-bold text-slate-700 text-sm" value={filterDate.getFullYear()} onChange={handleYearChange}>
               {[2024, 2025, 2026].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="รายรับ (Revenue)" value={analytics.income} color="emerald" icon={<TrendingUp/>} trend={analytics.growth.income} subText="เทียบเดือนก่อน" />
        <StatCard title="รายจ่าย (Expenses)" value={analytics.expense} color="rose" icon={<TrendingDown/>} trend={analytics.growth.expense} subText="เทียบเดือนก่อน" />
        <StatCard title="กำไรสุทธิ (Net Profit)" value={analytics.profit} color="indigo" icon={<Wallet/>} trend={analytics.prev.income > 0 ? ((analytics.profit - (analytics.prev.income - analytics.prev.expense))/(Math.abs(analytics.prev.income - analytics.prev.expense)||1))*100 : 0} subText="Margin Growth" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-700 flex gap-2"><Calendar className="text-indigo-500"/> กระแสเงินสดรายวัน (Daily Cash Flow)</h3>
              <div className="flex gap-4 text-xs font-bold">
                 <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> รายรับ</span>
                 <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400"></div> รายจ่าย</span>
              </div>
           </div>
           <div className="h-64 flex items-end justify-between gap-1 overflow-x-auto pb-2">
             {analytics.dailyTrend.map((d) => (
               <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group min-w-[10px]">
                 <div className="flex gap-[1px] items-end h-full justify-center w-full relative">
                   <div className="absolute bottom-full mb-1 bg-slate-800 text-white text-[10px] p-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                      วันที่ {d.day}: +{formatCurrency(d.income)} / -{formatCurrency(d.expense)}
                   </div>
                   <div style={{height: `${Math.max(0, (d.income/maxDaily)*100)}%`}} className="w-1.5 md:w-3 bg-emerald-400 rounded-t-sm hover:bg-emerald-500 transition-all"></div>
                   <div style={{height: `${Math.max(0, (d.expense/maxDaily)*100)}%`}} className="w-1.5 md:w-3 bg-rose-400 rounded-t-sm hover:bg-rose-500 transition-all"></div>
                 </div>
                 <span className="text-[9px] text-slate-400">{d.day%5===0 || d.day===1 ? d.day : ''}</span>
               </div>
             ))}
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-700 mb-4 flex gap-2"><Target className="text-purple-500"/> หมวดหมู่รายรับสูงสุด</h3>
              <div className="space-y-4">
                 {analytics.topCategories.length === 0 ? <p className="text-center text-slate-300 text-sm">ไม่มีข้อมูล</p> : 
                 analytics.topCategories.map((cat, i) => (
                    <div key={i}>
                       <div className="flex justify-between text-sm mb-1"><span className="text-slate-600 font-medium">{cat.name}</span><span className="text-slate-800 font-bold">{formatCurrency(cat.value)}</span></div>
                       <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-purple-500 h-1.5 rounded-full" style={{width: `${cat.percent}%`}}></div></div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold flex items-center gap-2 mb-4"><Sparkles className="text-yellow-400"/> AI Analyst</h3>
                {aiAdvice ? <p className="text-sm bg-white/10 p-4 rounded-xl backdrop-blur leading-relaxed">{aiAdvice}</p> : <p className="text-slate-400 text-sm">กดปุ่มเพื่อวิเคราะห์ข้อมูลเชิงลึก</p>}
                <button onClick={handleAnalyze} disabled={isAnalyzing} className="mt-4 bg-white text-indigo-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-50 transition-colors w-fit">{isAnalyzing ? <Loader className="animate-spin" size={16}/> : <Zap size={16}/>} วิเคราะห์</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const RecordManager = ({ user, transactions, vendors }) => {
  const [activeTab, setActiveTab] = useState('new');
  const [formData, setFormData] = useState({ 
    type: 'income', date: formatDateISO(new Date()), description: '', amount: '', vatType: 'included', whtRate: 0,
    channel: 'Shopee', orderId: '', category: 'ขายสินค้า', taxInvoiceNo: '', vendorName: '', vendorTaxId: '', vendorBranch: '00000', vendorAddress: '', paymentMethod: 'cash', evidenceType: 'receipt', platformFee: 0
  });
  const [isScanning, setIsScanning] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false); 
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { callApi, loading: isMagicLoading } = useGemini();

  const calculated = useMemo(() => {
    const amount = parseFloat(formData.amount) || 0;
    const fee = parseFloat(formData.platformFee) || 0;
    const netReceived = formData.type === 'income' ? amount - fee : amount;

    let net = 0, vat = 0;
    if (formData.vatType === 'included') { net = amount * 100 / 107; vat = amount - net; } 
    else if (formData.vatType === 'excluded') { net = amount; vat = amount * 0.07; } 
    else { net = amount; vat = 0; }
    
    const wht = formData.type === 'expense' ? (net * formData.whtRate / 100) : 0;
    
    return { net, vat, total: formData.vatType === 'excluded' ? net + vat : amount, wht, netReceived };
  }, [formData]);
  
  const handleSubmit = async (e) => {
    e.preventDefault(); if (!user) return;
    
    const mainDoc = { 
        ...formData, 
        ...calculated, 
        date: new Date(formData.date), 
        createdAt: serverTimestamp() 
    };
    
    await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'transactions'), mainDoc);

    if (formData.type === 'income' && formData.platformFee > 0) {
        await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'transactions'), {
            type: 'expense',
            date: new Date(formData.date),
            description: `ค่าธรรมเนียม ${formData.channel} (${formData.orderId || 'Fee'})`,
            amount: Number(formData.platformFee),
            net: Number(formData.platformFee),
            vat: 0,
            vatType: 'none',
            total: Number(formData.platformFee),
            wht: 0,
            category: 'ค่าธรรมเนียมแพลตฟอร์ม',
            channel: formData.channel,
            createdAt: serverTimestamp()
        });
    }

    setFormData(prev => ({ 
        ...prev, 
        description: '', amount: '', orderId: '', taxInvoiceNo: '', vendorName: '', vendorTaxId: '', vendorAddress: '', platformFee: 0 
    }));
  };

  const handleSaveVendor = async () => {
    if (!formData.vendorName) return;
    await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'vendors'), {
      vendorName: formData.vendorName,
      vendorTaxId: formData.vendorTaxId,
      vendorBranch: formData.vendorBranch,
      vendorAddress: formData.vendorAddress
    });
    alert("บันทึกข้อมูลผู้ขายเรียบร้อย");
  };

  const loadVendor = (v) => {
      setFormData(prev => ({
          ...prev,
          vendorName: v.vendorName || '',
          vendorTaxId: v.vendorTaxId || '',
          vendorBranch: v.vendorBranch || '',
          vendorAddress: v.vendorAddress || ''
      }));
      setShowVendorModal(false);
  }

  const confirmDelete = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (deleteId) {
        await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'transactions', deleteId));
        setIsDeleteModalOpen(false);
        setDeleteId(null);
    }
  };

  const handleExport = () => {
    const data = transactions.map(t => ({
      Date: formatDateISO(t.date), Type: t.type, Description: t.description, 
      Amount: t.total, Net: t.net, VAT: t.vat, WHT: t.wht, 
      Category: t.category, Channel: t.channel || '-', TaxInvoice: t.taxInvoiceNo || '-', Vendor: t.vendorName || '-', TaxID: t.vendorTaxId || '-', Payment: t.paymentMethod, Evidence: t.evidenceType
    }));
    exportToCSV(data, `Transactions_${formatDateISO(new Date())}.csv`);
  };

  const isOnlineChannel = ['Shopee', 'Lazada', 'TikTok'].includes(formData.channel);

  return (
    <div className="w-full h-full animate-fadeIn flex flex-col">
      <ConfirmModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={executeDelete} 
        message="คุณต้องการลบรายการนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้" 
      />

      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
         <button onClick={() => setActiveTab('new')} className={`px-4 py-2 font-bold text-sm rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'new' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}><Edit size={16}/> บันทึกรายการใหม่</button>
         <button onClick={() => setActiveTab('all')} className={`px-4 py-2 font-bold text-sm rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}><FileText size={16}/> รายการทั้งหมด</button>
      </div>

      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
           <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit overflow-y-auto max-h-screen relative">
              <h3 className="font-bold mb-4 text-slate-800">รายละเอียดรายการ</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="bg-slate-100 p-1 rounded-lg flex mb-4"><button type="button" onClick={()=>setFormData({...formData, type:'income', category: 'ขายสินค้า'})} className={`flex-1 py-2 rounded font-bold text-sm ${formData.type==='income'?'bg-white text-emerald-600 shadow-sm':'text-slate-500'}`}>รายรับ</button><button type="button" onClick={()=>setFormData({...formData, type:'expense', category: 'ต้นทุนสินค้า'})} className={`flex-1 py-2 rounded font-bold text-sm ${formData.type==='expense'?'bg-white text-rose-600 shadow-sm':'text-slate-500'}`}>รายจ่าย</button></div>
                 
                 <div className="grid grid-cols-2 gap-3">
                   <input type="date" className="border p-2 rounded-lg w-full text-sm" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})}/>
                   <select className="border p-2 rounded-lg w-full text-sm" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>
                     {formData.type==='income' 
                        ? ['ขายสินค้า', 'บริการ', 'ค่านายหน้า', 'ค่าเช่า', 'รายได้อื่นๆ'].map(o=><option key={o} value={o}>{o}</option>)
                        : ['ต้นทุนสินค้า', 'ค่าขนส่ง', 'ค่าโฆษณา/การตลาด', 'เงินเดือนพนักงาน', 'ค่าเช่าสถานประกอบการ', 'ค่าน้ำ/ค่าไฟ/โทรศัพท์', 'วัสดุสิ้นเปลือง', 'ค่าธรรมเนียมธนาคาร', 'ค่าธรรมเนียมแพลตฟอร์ม', 'ค่าใช้จ่ายอื่นๆ'].map(o=><option key={o} value={o}>{o}</option>)
                     }
                   </select>
                 </div>
                 
                 <input className="border p-2 rounded-lg w-full text-sm" placeholder="รายละเอียด (เช่น ขายเสื้อ, ค่าไฟ)" value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} required/>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-1">{formData.type === 'income' && isOnlineChannel ? 'ยอดขายเต็ม (Gross)' : 'จำนวนเงิน'}</label>
                        <input type="number" className="border p-2 rounded-lg w-full text-sm font-bold text-right" placeholder="0.00" value={formData.amount} onChange={e=>setFormData({...formData, amount:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-1">ประเภท VAT</label>
                        <select className="border p-2 rounded-lg w-full text-sm" value={formData.vatType} onChange={e=>setFormData({...formData, vatType:e.target.value})}><option value="included">รวม VAT</option><option value="excluded">แยก VAT</option><option value="none">ไม่มี VAT</option></select>
                    </div>
                 </div>

                 {/* Platform Fee Logic */}
                 {formData.type === 'income' && isOnlineChannel && (
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
                         <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-indigo-700 flex items-center gap-1"><Zap size={12}/> ค่าธรรมเนียมที่ถูกหัก (Platform Fee)</label>
                            <input 
                                type="number" 
                                className="border-0 border-b border-indigo-300 bg-transparent text-right text-sm font-bold text-indigo-700 w-24 focus:ring-0" 
                                placeholder="0.00" 
                                value={formData.platformFee} 
                                onChange={e=>setFormData({...formData, platformFee:e.target.value})}
                            />
                         </div>
                         <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-indigo-100">
                             <span>ยอดเงินที่ได้รับจริง (Net Received):</span>
                             <span className="font-bold text-emerald-600">{formatCurrency(calculated.netReceived)}</span>
                         </div>
                    </div>
                 )}

                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 relative">
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><FileText size={12}/> ข้อมูลภาษีและหลักฐาน</p>
                    
                    {/* Vendor Modal */}
                    {showVendorModal && (
                        <div className="absolute inset-0 bg-white z-10 p-4 rounded-xl border border-indigo-200 shadow-lg flex flex-col">
                            <div className="flex justify-between items-center mb-2"><span className="font-bold text-sm text-slate-700">เลือกผู้ขายเดิม</span><button type="button" onClick={()=>setShowVendorModal(false)}><X size={16}/></button></div>
                            <div className="flex-1 overflow-auto space-y-1 custom-scrollbar">
                                {vendors.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">ไม่พบข้อมูลผู้ขาย</p> : 
                                vendors.map(v => (
                                    <button key={v.id} type="button" onClick={()=>loadVendor(v)} className="w-full text-left p-2 hover:bg-slate-50 text-xs border-b border-slate-100 text-slate-600 truncate">
                                        <span className="font-bold block">{v.vendorName}</span>
                                        <span className="text-[10px] text-slate-400">{v.vendorTaxId}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-slate-400 block mb-1">ประเภทหลักฐาน</label>
                            <select className="border p-2 rounded-lg w-full text-xs" value={formData.evidenceType} onChange={e=>setFormData({...formData, evidenceType:e.target.value})}>
                                <option value="tax_invoice">ใบกำกับภาษีเต็มรูป</option>
                                <option value="short_receipt">ใบกำกับฯ อย่างย่อ/ใบเสร็จ</option>
                                <option value="cash_bill">บิลเงินสด</option>
                                <option value="slip">สลิปโอนเงิน/อื่นๆ</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 block mb-1">การชำระเงิน</label>
                            <select className="border p-2 rounded-lg w-full text-xs" value={formData.paymentMethod} onChange={e=>setFormData({...formData, paymentMethod:e.target.value})}>
                                <option value="cash">เงินสด (Cash)</option>
                                <option value="transfer">เงินโอน (Transfer)</option>
                                <option value="credit">บัตรเครดิต (Credit Card)</option>
                            </select>
                        </div>
                    </div>

                    {(formData.type === 'expense' || formData.vatType !== 'none') && (
                        <div className="grid grid-cols-2 gap-3">
                             <input className="border p-2 rounded-lg w-full text-xs" placeholder={formData.type==='income' ? "เลขใบกำกับภาษี (ถ้ามี)" : "เลขที่ใบกำกับภาษี"} value={formData.taxInvoiceNo} onChange={e=>setFormData({...formData, taxInvoiceNo:e.target.value})}/>
                             {formData.type === 'expense' && <input className="border p-2 rounded-lg w-full text-xs" placeholder="เลขผู้เสียภาษีผู้รับเงิน" value={formData.vendorTaxId} onChange={e=>setFormData({...formData, vendorTaxId:e.target.value})}/>}
                        </div>
                    )}

                    {formData.type === 'expense' && (
                        <>
                            <div className="flex gap-1">
                                <input className="border p-2 rounded-lg w-full text-xs" placeholder="ชื่อผู้รับเงิน/ร้านค้า" value={formData.vendorName} onChange={e=>setFormData({...formData, vendorName:e.target.value})}/>
                                <button type="button" onClick={handleSaveVendor} className="bg-indigo-50 text-indigo-600 px-2 rounded-lg text-[10px] font-bold border border-indigo-100 hover:bg-indigo-100">Save</button>
                                <button type="button" onClick={()=>setShowVendorModal(true)} className="bg-slate-100 text-slate-600 px-2 rounded-lg text-[10px] font-bold border border-slate-200 hover:bg-slate-200">Load</button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 items-center">
                                <div>
                                    <label className="text-[10px] text-slate-400 block mb-1">หัก ณ ที่จ่าย (WHT)</label>
                                    <select className="border p-2 rounded-lg w-full text-xs text-rose-600 font-bold" value={formData.whtRate} onChange={e=>setFormData({...formData, whtRate:Number(e.target.value)})}>
                                        <option value={0}>ไม่หัก (0%)</option>
                                        <option value={1}>1% ค่าขนส่ง</option>
                                        <option value={3}>3% ค่าบริการ</option>
                                        <option value={5}>5% ค่าเช่า</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 block mb-1">สาขาผู้รับเงิน</label>
                                    <input className="border p-2 rounded-lg w-full text-xs text-center" placeholder="00000" value={formData.vendorBranch} onChange={e=>setFormData({...formData, vendorBranch:e.target.value})}/>
                                </div>
                            </div>

                            {formData.whtRate > 0 && (
                                <textarea 
                                    className="border p-2 rounded-lg w-full text-xs h-16" 
                                    placeholder="ที่อยู่ผู้รับเงิน (สำหรับออกหนังสือรับรอง 50 ทวิ)" 
                                    value={formData.vendorAddress} 
                                    onChange={e=>setFormData({...formData, vendorAddress:e.target.value})}
                                />
                            )}
                        </>
                    )}
                 </div>

                 <div className="bg-slate-800 text-white p-4 rounded-xl flex justify-between items-center shadow-lg"><span className="text-slate-400 text-sm">ยอดรวมสุทธิ</span><span className="text-2xl font-bold">{formatCurrency(calculated.total - calculated.wht)}</span></div>
                 <button className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-all">บันทึกรายการ</button>
              </form>
           </div>
           <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-[600px]">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center"><span className="font-bold text-slate-700">รายการล่าสุด (10 รายการ)</span></div>
              <div className="overflow-auto flex-1 p-0">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-white sticky top-0 border-b text-slate-500 font-bold text-xs">
                        <tr>
                            <th className="p-3">วันที่</th>
                            <th className="p-3">รายการ</th>
                            <th className="p-3 text-right">จำนวนเงิน</th>
                            <th className="p-3 text-center w-12">ลบ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                       {transactions.slice(0, 10).map(t => (
                         <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-slate-500 whitespace-nowrap">{formatDate(t.date)}</td>
                            <td className="p-3">
                               <div className="font-bold text-slate-700">{t.description}</div>
                               <div className="text-xs text-slate-400">{t.category}</div>
                               {t.category === 'ค่าธรรมเนียมแพลตฟอร์ม' && <span className="text-[9px] bg-rose-100 text-rose-600 px-1 rounded">Auto-Expense</span>}
                            </td>
                            <td className={`p-3 text-right font-bold ${t.type==='income'?'text-emerald-600':'text-rose-600'}`}>{t.type==='income'?'+':'-'}{formatCurrency(t.total)}</td>
                            <td className="p-3 text-center">
                                <button onClick={()=>confirmDelete(t.id)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-colors"><Trash2 size={16}/></button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'all' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
           <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-700 flex items-center gap-2"><History size={18}/> รายการทั้งหมด ({transactions.length})</h3>
              <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700"><Download size={16}/> Export CSV</button>
           </div>
           <div className="flex-1 overflow-auto">
              <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 sticky top-0 text-slate-600 font-bold border-b">
                    <tr><th className="p-4">วันที่</th><th className="p-4">ประเภท</th><th className="p-4">รายละเอียด</th><th className="p-4 text-right">มูลค่าสุทธิ</th><th className="p-4 text-right">VAT</th><th className="p-4 text-right">ยอดรวม</th><th className="p-4 text-center">จัดการ</th></tr>
                 </thead>
                 <tbody className="divide-y">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                         <td className="p-4 whitespace-nowrap">{formatDate(t.date)}</td>
                         <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${t.type==='income'?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-700'}`}>{t.type==='income'?'รายรับ':'รายจ่าย'}</span></td>
                         <td className="p-4 max-w-xs truncate font-medium text-slate-700">{t.description}</td>
                         <td className="p-4 text-right">{formatCurrency(t.net)}</td>
                         <td className="p-4 text-right text-slate-500">{formatCurrency(t.vat)}</td>
                         <td className="p-4 text-right font-bold">{formatCurrency(t.total)}</td>
                         <td className="p-4 text-center"><button onClick={()=>confirmDelete(t.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={16}/></button></td>
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

const InvoiceGenerator = ({ user, invoices, customers }) => {
  const [mode, setMode] = useState('create');
  const [isViewMode, setIsViewMode] = useState(false);
  // Delete Modal State for Invoices
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // 1. DEFAULT_INVOICE_STATE: ค่าเริ่มต้นสำหรับใบกำกับภาษีใหม่
  const DEFAULT_INVOICE_STATE = {
    docId: null,
    docType: 'ใบกำกับภาษี / ใบเสร็จรับเงิน',
    customerName: '', address: '', subDistrict: '', district: '', province: '', zip: '',
    taxId: '', branch: '00000', customerPO: '', creditTerm: 0,
    customerPhone: '', customerEmail: '', isCustomerHeadOffice: true,
    items: [{ desc: '', qty: 1, unit: 'ชิ้น', price: 0, discount: 0 }],
    date: formatDateISO(new Date()), invNo: '', 
    sellerName: 'บริษัท ตัวอย่าง จำกัด', sellerAddress: '99/99 กทม.', sellerSubDistrict: '', sellerDistrict: '', sellerProvince: '', sellerZip: '',
    sellerTaxId: '0123456789012', sellerBranchId: '00000', isHeadOffice: true, sellerPhone: '', sellerEmail: '', discount: 0,
    paymentInfo: 'โอนเงินเข้าบัญชี ...', notes: 'สินค้าซื้อแล้วไม่รับเปลี่ยนหรือคืนเงิน'
  };

  const [invData, setInvData] = useState(DEFAULT_INVOICE_STATE);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Helper to init invoice number
  useEffect(() => { 
    if (mode === 'create' && !invData.docId) { 
       const dateStr = invData.date.replace(/-/g, '').slice(2, 6); 
       const existingInvoices = invoices.filter(inv => inv.invNo && inv.invNo.startsWith(dateStr));
       
       let nextSeq = 1;
       if (existingInvoices.length > 0) {
          const maxSeq = existingInvoices.reduce((max, inv) => {
             const parts = inv.invNo.split('-');
             if (parts.length === 2) {
                const seq = parseInt(parts[1], 10);
                return !isNaN(seq) && seq > max ? seq : max;
             }
             return max;
          }, 0);
          nextSeq = maxSeq + 1;
       }
       
       setInvData(prev => ({ ...prev, invNo: `${dateStr}-${String(nextSeq).padStart(3, '0')}` })); 
    } 
  }, [invData.date, invoices, mode, invData.docId]);

  useEffect(() => {
    if (!window.html2pdf && !document.getElementById('html2pdf-script')) {
       const script = document.createElement('script'); script.id = 'html2pdf-script'; script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"; document.body.appendChild(script);
    }
  }, []);

  const totals = useMemo(() => {
    const itemsTotal = invData.items.reduce((s, i) => s + (i.qty * i.price) - (i.discount || 0), 0);
    const afterDocDiscount = itemsTotal - (invData.discount || 0);
    const vat = afterDocDiscount * 0.07;
    return { sub: itemsTotal, afterDisc: afterDocDiscount, vat, total: afterDocDiscount + vat };
  }, [invData]);

  const handleSaveInvoice = async () => {
    if (!user) return;
    
    const { docId, ...firestoreData } = { 
        ...invData, 
        ...totals, 
        date: new Date(invData.date), 
        createdAt: invData.createdAt || serverTimestamp() 
    };

    if (docId) {
        await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'invoices', docId), firestoreData);
        alert("อัปเดตข้อมูลเรียบร้อย");
    } else {
        await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'invoices'), firestoreData);
        alert("บันทึกข้อมูลใหม่เรียบร้อย");
    }
    setMode('history');
  };

  const handleSaveCustomer = async () => {
    if (!invData.customerName) return;
    await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'customers'), {
      customerName: invData.customerName, 
      address: invData.address, subDistrict: invData.subDistrict, district: invData.district, province: invData.province, zip: invData.zip,
      taxId: invData.taxId, branch: invData.branch,
      phone: invData.customerPhone, email: invData.customerEmail, isHeadOffice: invData.isCustomerHeadOffice
    });
    alert("บันทึกข้อมูลลูกค้าแล้ว");
  };

  const loadCustomer = (c) => {
    setInvData(prev => ({ 
      ...prev, 
      customerName: c.customerName || '', 
      address: c.address || '', subDistrict: c.subDistrict || '', district: c.district || '', province: c.province || '', zip: c.zip || '',
      taxId: c.taxId || '', branch: c.branch || '', 
      customerPhone: c.phone || '', customerEmail: c.email || '', isCustomerHeadOffice: c.isHeadOffice ?? true 
    }));
    setShowCustomerModal(false);
  };

  const confirmDeleteInvoice = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const executeDeleteInvoice = async () => {
    if (deleteId) {
        await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'invoices', deleteId));
        setIsDeleteModalOpen(false);
        setDeleteId(null);
    }
  };

  const handleExportInvoices = () => {
    const data = invoices.map(i => ({ Date: formatDateISO(i.date), No: i.invNo, Customer: i.customerName, Total: i.total, Status: 'Issued' }));
    exportToCSV(data, 'Invoices_History.csv');
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-preview-area');
    const opt = {
      margin: 0,
      filename: `${invData.invNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { scale: 3, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (window.html2pdf) {
       window.html2pdf().set(opt).from(element).save();
    } else {
       alert("กำลังโหลดเครื่องมือ PDF กรุณากดใหม่อีกครั้ง");
    }
  };

  const handleView = (inv) => {
    setInvData({ ...DEFAULT_INVOICE_STATE, ...inv, docId: inv.id, date: formatDateISO(new Date(inv.date)) });
    setIsViewMode(true);
    setMode('create');
  };

  const handleEdit = (inv) => {
    setInvData({ ...DEFAULT_INVOICE_STATE, ...inv, docId: inv.id, date: formatDateISO(new Date(inv.date)) });
    setIsViewMode(false);
    setMode('create');
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn h-full">
      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={executeDeleteInvoice} 
        message="ยืนยันการลบเอกสารใบกำกับภาษีนี้? การกระทำนี้ไม่สามารถย้อนกลับได้" 
      />

      <div className="flex gap-2 border-b pb-2 flex-shrink-0">
         <button onClick={() => { setInvData(DEFAULT_INVOICE_STATE); setIsViewMode(false); setMode('create'); }} className={`px-4 py-2 font-bold text-sm rounded-lg ${mode==='create'?'bg-indigo-600 text-white':'text-slate-500'}`}>สร้างใบกำกับภาษี</button>
         <button onClick={() => setMode('history')} className={`px-4 py-2 font-bold text-sm rounded-lg ${mode==='history'?'bg-indigo-600 text-white':'text-slate-500'}`}>ประวัติเอกสาร</button>
      </div>

      {mode === 'history' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
           <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="font-bold text-slate-700">ประวัติการออกเอกสาร</h3>
              <button onClick={handleExportInvoices} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700"><Download size={16}/> Export CSV</button>
           </div>
           <div className="flex-1 overflow-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 font-bold text-slate-600 sticky top-0 z-10"><tr><th className="p-3">วันที่</th><th className="p-3">เลขที่</th><th className="p-3">ลูกค้า</th><th className="p-3 text-right">ยอดรวม</th><th className="p-3 text-center">Action</th></tr></thead>
                <tbody className="divide-y">{invoices.map(inv=>(
                  <tr key={inv.id}>
                    <td className="p-3">{formatDate(inv.date)}</td>
                    <td className="p-3 font-bold text-indigo-600">{inv.invNo}</td>
                    <td className="p-3">{inv.customerName}</td>
                    <td className="p-3 text-right font-bold">{formatCurrency(inv.total)}</td>
                    <td className="p-3 text-center flex justify-center gap-2">
                      <button onClick={() => handleView(inv)} className="text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors" title="ดู"><Eye size={16}/></button>
                      <button onClick={() => handleEdit(inv)} className="text-slate-500 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 p-1.5 rounded-lg transition-colors" title="แก้ไข"><Edit size={16}/></button>
                      <button onClick={() => confirmDeleteInvoice(inv.id)} className="text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 p-1.5 rounded-lg transition-colors" title="ลบ"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}</tbody>
             </table>
           </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
           <div className={`lg:col-span-4 space-y-6 h-full overflow-y-auto custom-scrollbar pr-1 ${isViewMode ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                 <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Home size={16}/> ผู้ขาย (Seller)</h4>
                 <div className="space-y-2 text-sm">
                    <input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="ชื่อบริษัท/ร้านค้า" value={invData.sellerName} onChange={e=>setInvData({...invData, sellerName: e.target.value})}/>
                    <input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="ที่อยู่ (เลขที่, หมู่, ถนน)" value={invData.sellerAddress} onChange={e=>setInvData({...invData, sellerAddress: e.target.value})}/>
                    <div className="flex gap-2">
                       <input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="ตำบล/แขวง" value={invData.sellerSubDistrict} onChange={e=>setInvData({...invData, sellerSubDistrict: e.target.value})}/>
                       <input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="อำเภอ/เขต" value={invData.sellerDistrict} onChange={e=>setInvData({...invData, sellerDistrict: e.target.value})}/>
                    </div>
                    <div className="flex gap-2">
                       <input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="จังหวัด" value={invData.sellerProvince} onChange={e=>setInvData({...invData, sellerProvince: e.target.value})}/>
                       <input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="รหัสไปรษณีย์" value={invData.sellerZip} onChange={e=>setInvData({...invData, sellerZip: e.target.value})}/>
                    </div>
                    <div className="flex gap-2">
                       <input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="เลขผู้เสียภาษี" value={invData.sellerTaxId} onChange={e=>setInvData({...invData, sellerTaxId: e.target.value})}/>
                       <div className="flex items-center gap-2 border p-2 rounded w-fit bg-slate-50">
                          <input disabled={isViewMode} type="checkbox" checked={invData.isHeadOffice} onChange={e=>setInvData({...invData, isHeadOffice: e.target.checked})} className="rounded text-indigo-600"/>
                          <span className="text-xs whitespace-nowrap">สนง.ใหญ่</span>
                       </div>
                       {!invData.isHeadOffice && <input disabled={isViewMode} className="border p-2 rounded w-20 text-center" placeholder="สาขา" value={invData.sellerBranchId} onChange={e=>setInvData({...invData, sellerBranchId: e.target.value})}/>}
                    </div>
                    <div className="flex gap-2"><input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="เบอร์โทร" value={invData.sellerPhone} onChange={e=>setInvData({...invData, sellerPhone: e.target.value})}/><input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="Email" value={invData.sellerEmail} onChange={e=>setInvData({...invData, sellerEmail: e.target.value})}/></div>
                 </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative">
                 <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><User size={16}/> ลูกค้า (Customer)</h4>
                    <div className="flex gap-1">
                       <button disabled={isViewMode} onClick={handleSaveCustomer} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 font-bold">Save</button>
                       <button disabled={isViewMode} onClick={()=>setShowCustomerModal(true)} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 font-bold">Load</button>
                    </div>
                 </div>
                 {showCustomerModal && (
                   <div className="absolute inset-0 bg-white z-10 p-4 rounded-2xl border border-indigo-200 shadow-lg flex flex-col">
                      <div className="flex justify-between items-center mb-2"><span className="font-bold text-sm">เลือกลูกค้า</span><button onClick={()=>setShowCustomerModal(false)}><X size={16}/></button></div>
                      <div className="flex-1 overflow-auto space-y-1">
                         {customers.map(c => <button key={c.id} onClick={()=>loadCustomer(c)} className="w-full text-left p-2 hover:bg-slate-50 text-sm border-b">{c.customerName}</button>)}
                      </div>
                   </div>
                 )}
                 <div className="space-y-2 text-sm">
                    <input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="ชื่อลูกค้า" value={invData.customerName} onChange={e=>setInvData({...invData, customerName: e.target.value})}/>
                    <input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="ที่อยู่ (เลขที่, หมู่, ถนน)" value={invData.address} onChange={e=>setInvData({...invData, address: e.target.value})}/>
                    <div className="flex gap-2">
                       <input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="ตำบล/แขวง" value={invData.subDistrict} onChange={e=>setInvData({...invData, subDistrict: e.target.value})}/>
                       <input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="อำเภอ/เขต" value={invData.district} onChange={e=>setInvData({...invData, district: e.target.value})}/>
                    </div>
                    <div className="flex gap-2">
                       <input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="จังหวัด" value={invData.province} onChange={e=>setInvData({...invData, province: e.target.value})}/>
                       <input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="รหัสไปรษณีย์" value={invData.zip} onChange={e=>setInvData({...invData, zip: e.target.value})}/>
                    </div>
                    <div className="flex gap-2">
                       <input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="เลขผู้เสียภาษี" value={invData.taxId} onChange={e=>setInvData({...invData, taxId: e.target.value})}/>
                       <div className="flex items-center gap-2 border p-2 rounded w-fit bg-slate-50">
                          <input disabled={isViewMode} type="checkbox" checked={invData.isCustomerHeadOffice} onChange={e=>setInvData({...invData, isCustomerHeadOffice: e.target.checked})} className="rounded text-indigo-600"/>
                          <span className="text-xs whitespace-nowrap">สนง.ใหญ่</span>
                       </div>
                       {!invData.isCustomerHeadOffice && <input disabled={isViewMode} className="border p-2 rounded w-20 text-center" placeholder="สาขา" value={invData.branch} onChange={e=>setInvData({...invData, branch: e.target.value})}/>}
                    </div>
                    <div className="flex gap-2"><input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="เบอร์โทร" value={invData.customerPhone} onChange={e=>setInvData({...invData, customerPhone: e.target.value})}/><input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="Email" value={invData.customerEmail} onChange={e=>setInvData({...invData, customerEmail: e.target.value})}/></div>
                    <div className="flex gap-2 pt-2 border-t mt-2"><input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="PO Ref." value={invData.customerPO} onChange={e=>setInvData({...invData, customerPO: e.target.value})}/><input disabled={isViewMode} className="border p-2 rounded w-full" placeholder="Credit Term (Days)" type="number" value={invData.creditTerm} onChange={e=>setInvData({...invData, creditTerm: e.target.value})}/></div>
                 </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                 <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Package size={16}/> รายการสินค้า</h4>
                 
                 {/* Header Row */}
                 <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-bold text-slate-500">
                    <div className="col-span-6">รายละเอียด</div>
                    <div className="col-span-2 text-center">จำนวน</div>
                    <div className="col-span-2 text-right">ราคา/หน่วย</div>
                    <div className="col-span-2 text-right">รวม</div>
                 </div>

                 <div className="space-y-2">
                    {invData.items.map((it, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 text-sm items-center group">
                         {/* Description */}
                         <div className="col-span-6 relative">
                            <input 
                              disabled={isViewMode} 
                              className="w-full border p-2 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none" 
                              placeholder="ชื่อสินค้า..." 
                              value={it.desc} 
                              onChange={e=>{const n=[...invData.items];n[i].desc=e.target.value;setInvData({...invData,items:n})}}
                            />
                         </div>
                         
                         {/* Qty */}
                         <div className="col-span-2">
                            <input 
                              disabled={isViewMode} 
                              type="number" 
                              className="w-full border p-2 rounded-lg text-center bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none" 
                              placeholder="0" 
                              value={it.qty} 
                              onChange={e=>{const n=[...invData.items];n[i].qty=Number(e.target.value);setInvData({...invData,items:n})}}
                            />
                         </div>

                         {/* Price */}
                         <div className="col-span-2 relative">
                            <input 
                              disabled={isViewMode} 
                              type="number" 
                              className="w-full border p-2 rounded-lg text-right bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none" 
                              placeholder="0.00" 
                              value={it.price} 
                              onChange={e=>{const n=[...invData.items];n[i].price=Number(e.target.value);setInvData({...invData,items:n})}}
                            />
                         </div>

                         {/* Total & Delete */}
                         <div className="col-span-2 flex items-center justify-end gap-2">
                            <span className="font-bold text-slate-700">{formatCurrency(it.qty * it.price)}</span>
                            {!isViewMode && (
                               <button 
                                 type="button"
                                 onClick={()=>setInvData({...invData, items: invData.items.filter((_,idx)=>idx!==i)})} 
                                 className="text-white bg-rose-500 hover:bg-rose-600 p-1.5 rounded transition-colors flex-shrink-0"
                                 title="ลบรายการ"
                               >
                                 <Trash2 size={14}/>
                               </button>
                             )}
                         </div>
                      </div>
                    ))}
                 </div>

                 {/* Add Button */}
                 {!isViewMode && (
                    <button 
                      onClick={()=>setInvData({...invData, items: [...invData.items, {desc:'',qty:1,price:0,unit:'ชิ้น'}]})} 
                      className="w-full mt-4 py-2 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-500 font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16}/> เพิ่มรายการสินค้า
                    </button>
                 )}
                 
                 {/* Summary Section within Card */}
                 <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500 font-medium">ส่วนลดท้ายบิล (Discount)</span>
                       <div className="flex items-center gap-2">
                          <span className="text-slate-400">-</span>
                          <input 
                            disabled={isViewMode} 
                            type="number" 
                            className="border p-1.5 rounded-lg w-28 text-right font-bold text-rose-600 bg-rose-50 focus:bg-white focus:ring-2 focus:ring-rose-200 outline-none" 
                            value={invData.discount} 
                            onChange={e=>setInvData({...invData, discount:Number(e.target.value)})}
                          />
                       </div>
                    </div>
                 </div>
              </div>

              {!isViewMode && (
                <div className="flex gap-3">
                   <button onClick={handleSaveInvoice} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold shadow hover:bg-emerald-700 flex items-center justify-center gap-2"><Save size={18}/> {invData.docId ? 'อัปเดต' : 'บันทึก'}</button>
                </div>
              )}
              {isViewMode && (
                <div className="flex gap-3">
                   <button onClick={()=>setIsViewMode(false)} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold shadow hover:bg-amber-600 flex items-center justify-center gap-2"><Edit size={18}/> แก้ไขเอกสาร</button>
                </div>
              )}
              <button onClick={handleDownloadPDF} className="w-full bg-rose-600 text-white px-6 py-3 rounded-xl font-bold shadow hover:bg-rose-700 flex items-center justify-center gap-2"><Download size={18}/> Download PDF</button>
           </div>

           {/* Preview Panel - Universal Standard Template */}
           <div className="lg:col-span-8 flex justify-center bg-slate-500/10 rounded-3xl p-4 overflow-auto h-full">
              <div id="invoice-preview-area" className="bg-white shadow-xl h-[29.6cm] w-[21cm] p-[1.5cm] text-slate-900 relative font-sarabun text-sm leading-[1.8] mx-auto overflow-hidden">
                 {/* Header */}
                 <div className="flex justify-between items-start mb-8">
                    <div className="w-[55%]">
                       <h2 className="text-2xl font-bold text-slate-900 mb-1 leading-snug">{invData.sellerName}</h2>
                       <p className="whitespace-pre-wrap text-slate-600 leading-normal">{invData.sellerAddress}</p>
                       <p className="text-slate-600 leading-normal">
                          {invData.sellerSubDistrict && `${invData.sellerSubDistrict} `}
                          {invData.sellerDistrict}
                       </p>
                       <p className="text-slate-600 leading-normal">
                          {invData.sellerProvince && `${invData.sellerProvince} `}
                          {invData.sellerZip}
                       </p>
                       <p className="mt-2 text-slate-600 leading-normal"><span className="font-bold text-slate-800">เลขประจำตัวผู้เสียภาษี:</span> {invData.sellerTaxId} <span className="ml-2">({invData.isHeadOffice ? 'สำนักงานใหญ่' : `สาขา ${invData.sellerBranchId}`})</span></p>
                       <p className="text-slate-600 leading-normal"><span className="font-bold text-slate-800">โทร:</span> {invData.sellerPhone} {invData.sellerEmail && <span className="ml-2"><span className="font-bold text-slate-800">Email:</span> {invData.sellerEmail}</span>}</p>
                    </div>
                    <div className="w-[40%] text-right">
                       <h1 className="text-2xl font-bold text-slate-900 mb-4 border-b-2 border-slate-900 pb-1 inline-block whitespace-nowrap">{invData.docType}</h1>
                       <div className="flex justify-between mb-1"><span className="font-bold text-slate-600">เลขที่เอกสาร:</span> <span className="font-bold">{invData.invNo}</span></div>
                       <div className="flex justify-between mb-1"><span className="font-bold text-slate-600">วันที่:</span> <span>{formatDate(invData.date)}</span></div>
                       {invData.customerPO && <div className="flex justify-between mb-1"><span className="font-bold text-slate-600">อ้างอิง (PO):</span> <span>{invData.customerPO}</span></div>}
                       {invData.creditTerm > 0 && <div className="flex justify-between mb-1"><span className="font-bold text-slate-600">เครดิต:</span> <span>{invData.creditTerm} วัน</span></div>}
                    </div>
                 </div>

                 {/* Customer Box */}
                 <div className="border border-slate-300 rounded-lg p-4 mb-6 flex justify-between bg-slate-50/50">
                    <div className="w-full">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">ลูกค้า (Customer)</p>
                       <p className="font-bold text-lg text-slate-900 leading-snug">{invData.customerName}</p>
                       <p className="whitespace-pre-wrap text-slate-600 leading-normal w-[80%]">{invData.address}</p>
                       <p className="text-slate-600 leading-normal w-[80%]">
                          {invData.subDistrict && `${invData.subDistrict} `}
                          {invData.district}
                       </p>
                       <p className="text-slate-600 leading-normal w-[80%]">
                          {invData.province && `${invData.province} `}
                          {invData.zip}
                       </p>
                       <div className="mt-2">
                          <p>
                             <span className="font-bold text-slate-800">เลขผู้เสียภาษี:</span> {invData.taxId} 
                             <span className="ml-2">({invData.isCustomerHeadOffice ? 'สำนักงานใหญ่' : `สาขา ${invData.branch}`})</span>
                          </p>
                          <p className="text-slate-600 leading-normal mt-1"><span className="font-bold text-slate-800">โทร:</span> {invData.customerPhone} {invData.customerEmail && <span className="ml-2"><span className="font-bold text-slate-800">Email:</span> {invData.customerEmail}</span>}</p>
                       </div>
                    </div>
                 </div>

                 {/* Table */}
                 <table className="w-full mb-6 border-collapse table-fixed">
                    <thead>
                       <tr className="bg-slate-100 border-y border-slate-300 text-slate-700">
                          <th className="py-2 text-center w-[5%] border-r border-slate-200">#</th>
                          <th className="py-2 text-left pl-3 w-[45%] border-r border-slate-200">รายการ (Description)</th>
                          <th className="py-2 text-center w-[10%] border-r border-slate-200">จำนวน</th>
                          <th className="py-2 text-center w-[10%] border-r border-slate-200">หน่วย</th>
                          <th className="py-2 text-right pr-3 w-[15%] border-r border-slate-200">ราคา/หน่วย</th>
                          <th className="py-2 text-right pr-3 w-[15%]">จำนวนเงิน</th>
                       </tr>
                    </thead>
                    <tbody className="text-slate-700">
                       {invData.items.map((it, i) => (
                          <tr key={i} className="border-b border-slate-100">
                             <td className="py-2 text-center border-r border-slate-100 align-top">{i+1}</td>
                             <td className="py-2 pl-3 border-r border-slate-100 font-medium align-top break-words">{it.desc}</td>
                             <td className="py-2 text-center border-r border-slate-100 align-top">{it.qty}</td>
                             <td className="py-2 text-center border-r border-slate-100 align-top">{it.unit}</td>
                             <td className="py-2 text-right pr-3 border-r border-slate-100 align-top">{formatCurrency(it.price)}</td>
                             <td className="py-2 text-right pr-3 font-bold align-top">{formatCurrency(it.qty * it.price)}</td>
                          </tr>
                       ))}
                       {/* Fill empty rows to maintain height */}
                       {[...Array(Math.max(0, 8 - invData.items.length))].map((_, i) => (
                          <tr key={`empty-${i}`}><td className="py-3 border-r border-slate-100"></td><td className="border-r border-slate-100"></td><td className="border-r border-slate-100"></td><td className="border-r border-slate-100"></td><td className="border-r border-slate-100"></td><td></td></tr>
                       ))}
                    </tbody>
                 </table>

                 {/* Summary & Footer */}
                 <div className="flex justify-between items-start border-t border-slate-300 pt-4">
                    <div className="w-[60%] pr-8">
                       <div className="mb-4">
                          <span className="text-xs font-bold text-slate-400 uppercase">จำนวนเงินตัวอักษร</span>
                          <div className="bg-slate-100 border border-slate-200 p-2 text-center font-bold text-slate-800 italic rounded mt-1">{thaiBahtText(totals.total)}</div>
                       </div>
                       <div className="text-xs text-slate-500 space-y-1 leading-normal">
                          <p><span className="font-bold">หมายเหตุ:</span> {invData.notes}</p>
                          <p><span className="font-bold">ข้อมูลการชำระเงิน:</span> {invData.paymentInfo}</p>
                       </div>
                    </div>
                    <div className="w-[35%]">
                       <div className="space-y-2 text-sm leading-normal">
                          <div className="flex justify-between"><span>รวมเป็นเงิน</span><span className="font-bold">{formatCurrency(totals.sub)}</span></div>
                          {invData.discount > 0 && <div className="flex justify-between text-rose-600"><span>หักส่วนลด</span><span>-{formatCurrency(invData.discount)}</span></div>}
                          <div className="flex justify-between"><span>จำนวนเงินหลังหักส่วนลด</span><span className="font-bold">{formatCurrency(totals.afterDisc)}</span></div>
                          <div className="flex justify-between text-slate-600"><span>ภาษีมูลค่าเพิ่ม 7%</span><span>{formatCurrency(totals.vat)}</span></div>
                          <div className="flex justify-between border-t border-slate-300 pt-2 mt-2"><span className="font-bold text-lg">จำนวนเงินทั้งสิ้น</span><span className="font-bold text-lg text-indigo-900">{formatCurrency(totals.total)}</span></div>
                       </div>
                    </div>
                 </div>

                 {/* Signatures */}
                 <div className="flex justify-between mt-32 px-8">
                    <div className="text-center">
                       <div className="border-b border-slate-400 w-40 mb-2"></div>
                       <p className="font-bold text-sm">ผู้รับวางบิล / ผู้รับของ</p>
                       <p className="text-xs text-slate-400 mt-4">วันที่ .......................................</p>
                    </div>
                    <div className="text-center">
                       <div className="border-b border-slate-400 w-40 mb-2"></div>
                       <p className="font-bold text-sm">ผู้มีอำนาจลงนาม</p>
                       <p className="text-xs text-slate-400 mt-4">วันที่ .......................................</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

const TaxReport = ({ transactions }) => {
  const [activeTab, setActiveTab] = useState('monthly'); // 'monthly' or 'annual'
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [assessmentYear, setAssessmentYear] = useState(new Date().getFullYear());
  const [aiAnalysis, setAiAnalysis] = useState("");
  const { callApi, loading: isAiLoading } = useGemini();

  // Monthly VAT Data
  const taxData = useMemo(() => {
    const monthTrans = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const sales = monthTrans.filter(t => t.type === 'income' && t.vatType !== 'none');
    const purchases = monthTrans.filter(t => t.type === 'expense' && t.vatType !== 'none');
    
    const totalSales = sales.reduce((s, t) => s + (Number(t.net) || 0), 0);
    const outputVat = sales.reduce((s, t) => s + (Number(t.vat) || 0), 0);
    const totalPurchases = purchases.reduce((s, t) => s + (Number(t.net) || 0), 0);
    const inputVat = purchases.reduce((s, t) => s + (Number(t.vat) || 0), 0);
    
    const whtItems = monthTrans.filter(t => t.type === 'expense' && t.wht > 0);
    const totalWht = whtItems.reduce((s, t) => s + (Number(t.wht) || 0), 0);

    return { monthTrans, sales, purchases, totalSales, outputVat, totalPurchases, inputVat, whtItems, totalWht };
  }, [transactions, month, year]);

  // Annual Assessment Data
  const annualData = useMemo(() => {
    const yearTrans = transactions.filter(t => new Date(t.date).getFullYear() === assessmentYear);
    const totalIncome = yearTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.total, 0);
    const actualExpense = yearTrans.filter(t => t.type === 'expense').reduce((s, t) => s + t.total, 0);

    // Method 1: Standard Deduction (60%)
    const expenseStandard = totalIncome * 0.6;
    const netIncomeStandard = totalIncome - expenseStandard; // Simplified, ignoring allowances for now
    const taxStandard = calculateProgressiveTax(netIncomeStandard);

    // Method 2: Actual Expense
    const netIncomeActual = totalIncome - actualExpense; // Simplified
    const taxActual = calculateProgressiveTax(netIncomeActual > 0 ? netIncomeActual : 0);

    return { totalIncome, actualExpense, expenseStandard, netIncomeStandard, netIncomeActual, taxStandard, taxActual };
  }, [transactions, assessmentYear]);

  const handleAnalyzeAnnual = async () => {
    const summary = {
      year: assessmentYear,
      totalIncome: annualData.totalIncome,
      actualExpense: annualData.actualExpense,
      taxStandard: annualData.taxStandard,
      taxActual: annualData.taxActual
    };
    const prompt = `Act as a Thai Tax Consultant. Analyze this annual data: ${JSON.stringify(summary)}. 
    Compare 'Standard Deduction (60%)' vs 'Actual Expense Deduction'. 
    Recommend the best method and give 3 tax planning tips for the next year in Thai.`;
    
    const result = await callApi(prompt);
    setAiAnalysis(result || "ไม่สามารถวิเคราะห์ได้");
  };

  const handleExportVAT = (type) => {
    const isSales = type === 'sales';
    const data = (isSales ? taxData.sales : taxData.purchases).map(t => ({
      Date: formatDateISO(t.date),
      InvNo: t.taxInvoiceNo || t.id.substring(0,8),
      Name: isSales ? 'ลูกค้าทั่วไป' : t.vendorName,
      TaxID: isSales ? '-' : t.vendorTaxId,
      Branch: isSales ? '-' : t.vendorBranch,
      Net: t.net,
      VAT: t.vat,
      Total: t.total
    }));
    exportToCSV(data, `VAT_${type}_${month+1}_${year}.csv`);
  };

  return (
    <div className="space-y-6 animate-fadeIn h-full flex flex-col">
      {/* Sub-Navigation */}
      <div className="flex gap-2 border-b pb-2 flex-shrink-0">
         <button onClick={() => setActiveTab('monthly')} className={`px-4 py-2 font-bold text-sm rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>VAT รายเดือน</button>
         <button onClick={() => setActiveTab('annual')} className={`px-4 py-2 font-bold text-sm rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'annual' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>ประเมินภาษีประจำปี</button>
      </div>

      {activeTab === 'monthly' && (
        <>
          {/* Header & Controls */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
             <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2"><FileText className="text-purple-600"/> ศูนย์ภาษีและบัญชี</h2>
             </div>
             <div className="flex gap-2">
                <select className="bg-slate-50 border-0 rounded-lg p-2 font-bold text-slate-700" value={month} onChange={e=>setMonth(Number(e.target.value))}>
                   {['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'].map((m,i)=><option key={i} value={i}>{m}</option>)}
                </select>
                <select className="bg-slate-50 border-0 rounded-lg p-2 font-bold text-slate-700" value={year} onChange={e=>setYear(Number(e.target.value))}>
                   {[2024, 2025, 2026].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
             </div>
          </div>

          {/* VAT Summary (P.P.30 Model) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-3xl border-2 border-emerald-50 relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingUp size={80} className="text-emerald-500"/></div>
                <p className="text-emerald-600 font-bold mb-1 text-sm uppercase tracking-wider">ภาษีขาย (Output Tax)</p>
                <h3 className="text-3xl font-bold text-slate-800">{formatCurrency(taxData.outputVat)}</h3>
                <p className="text-xs text-slate-400 mt-2">จากยอดขาย: {formatCurrency(taxData.totalSales)}</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border-2 border-rose-50 relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingDown size={80} className="text-rose-500"/></div>
                <p className="text-rose-600 font-bold mb-1 text-sm uppercase tracking-wider">ภาษีซื้อ (Input Tax)</p>
                <h3 className="text-3xl font-bold text-slate-800">{formatCurrency(taxData.inputVat)}</h3>
                <p className="text-xs text-slate-400 mt-2">จากยอดซื้อ: {formatCurrency(taxData.totalPurchases)}</p>
             </div>
             <div className={`p-6 rounded-3xl border-2 relative overflow-hidden text-white flex flex-col justify-center ${taxData.outputVat > taxData.inputVat ? 'bg-indigo-600 border-indigo-600' : 'bg-emerald-500 border-emerald-500'}`}>
                <p className="font-bold mb-1 text-sm uppercase tracking-wider opacity-80">{taxData.outputVat > taxData.inputVat ? 'ต้องชำระ (Payable)' : 'ขอคืนได้ (Refundable)'}</p>
                <h3 className="text-4xl font-bold">{formatCurrency(Math.abs(taxData.outputVat - taxData.inputVat))}</h3>
                <div className="mt-2 text-xs opacity-80 bg-white/20 w-fit px-2 py-1 rounded">ประมาณการ ภ.พ.30</div>
             </div>
          </div>

          {/* Reports Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden min-h-0">
             {/* VAT Report */}
             <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center flex-shrink-0">
                   <h3 className="font-bold text-slate-700 flex items-center gap-2"><FileText size={16}/> รายงานภาษี (VAT)</h3>
                   <div className="flex gap-1">
                      <button onClick={()=>handleExportVAT('sales')} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-bold hover:bg-emerald-100">Export ขาย</button>
                      <button onClick={()=>handleExportVAT('buy')} className="text-[10px] bg-rose-50 text-rose-700 px-2 py-1 rounded font-bold hover:bg-rose-100">Export ซื้อ</button>
                   </div>
                </div>
                <div className="flex-1 overflow-auto">
                   <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 sticky top-0 text-slate-500 font-bold z-10">
                         <tr><th className="p-3">วันที่</th><th className="p-3">เลขที่</th><th className="p-3 text-right">มูลค่า</th><th className="p-3 text-right">VAT</th></tr>
                      </thead>
                      <tbody className="divide-y">
                         {taxData.sales.map(t=>(<tr key={t.id}><td className="p-3">{formatDate(t.date)}</td><td className="p-3">{t.id.slice(0,6)}</td><td className="p-3 text-right">{formatCurrency(t.net)}</td><td className="p-3 text-right text-emerald-600 font-bold">{formatCurrency(t.vat)}</td></tr>))}
                         {taxData.purchases.map(t=>(<tr key={t.id}><td className="p-3">{formatDate(t.date)}</td><td className="p-3">{t.taxInvoiceNo||'-'}</td><td className="p-3 text-right">{formatCurrency(t.net)}</td><td className="p-3 text-right text-rose-600 font-bold">{formatCurrency(t.vat)}</td></tr>))}
                      </tbody>
                   </table>
                </div>
             </div>

             {/* WHT Report */}
             <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center flex-shrink-0">
                   <h3 className="font-bold text-slate-700 flex items-center gap-2"><CheckCircle size={16}/> หัก ณ ที่จ่าย (WHT)</h3>
                   <div className="text-right">
                      <span className="text-xs text-slate-400 block">ยอดนำส่ง</span>
                      <span className="text-lg font-bold text-indigo-700">{formatCurrency(taxData.totalWht)}</span>
                   </div>
                </div>
                <div className="flex-1 overflow-auto">
                   <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 sticky top-0 text-slate-500 font-bold z-10">
                         <tr><th className="p-3">วันที่</th><th className="p-3">ผู้ถูกหัก</th><th className="p-3 text-right">อัตรา</th><th className="p-3 text-right">ภาษี</th></tr>
                      </thead>
                      <tbody className="divide-y">
                         {taxData.whtItems.map(t=>(
                            <tr key={t.id}>
                               <td className="p-3">{formatDate(t.date)}</td>
                               <td className="p-3">{t.vendorName || '-'}</td>
                               <td className="p-3 text-right">{t.whtRate}%</td>
                               <td className="p-3 text-right font-bold text-slate-700">{formatCurrency(t.wht)}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        </>
      )}

      {activeTab === 'annual' && (
        <div className="space-y-6 overflow-y-auto h-full pr-2 custom-scrollbar">
          {/* Annual Header */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
             <h2 className="font-bold text-slate-700 flex items-center gap-2"><Calculator className="text-indigo-600"/> ประเมินภาษีประจำปี</h2>
             <select className="bg-slate-50 border-0 rounded-lg p-2 font-bold text-slate-700" value={assessmentYear} onChange={e=>setAssessmentYear(Number(e.target.value))}>
                {[2024, 2025, 2026].map(y=><option key={y} value={y}>{y}</option>)}
             </select>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Method 1: Standard */}
             <div className={`p-6 rounded-3xl border-2 transition-all ${annualData.taxStandard <= annualData.taxActual ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start mb-4">
                   <h3 className="font-bold text-lg text-slate-800">แบบเหมา 60%</h3>
                   {annualData.taxStandard <= annualData.taxActual && <span className="bg-emerald-200 text-emerald-800 text-xs px-2 py-1 rounded-full font-bold">แนะนำ</span>}
                </div>
                <div className="space-y-2 text-sm">
                   <div className="flex justify-between"><span>รายได้ทั้งปี</span><span className="font-bold">{formatCurrency(annualData.totalIncome)}</span></div>
                   <div className="flex justify-between text-slate-500"><span>หักค่าใช้จ่าย (60%)</span><span>-{formatCurrency(annualData.expenseStandard)}</span></div>
                   <div className="flex justify-between border-t pt-2 mt-2"><span>เงินได้สุทธิ</span><span className="font-bold">{formatCurrency(annualData.netIncomeStandard)}</span></div>
                   <div className="flex justify-between text-lg font-bold text-indigo-700 mt-4 pt-2 border-t border-dashed border-slate-300"><span>ภาษีที่ต้องจ่าย</span><span>{formatCurrency(annualData.taxStandard)}</span></div>
                </div>
             </div>

             {/* Method 2: Actual */}
             <div className={`p-6 rounded-3xl border-2 transition-all ${annualData.taxActual < annualData.taxStandard ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start mb-4">
                   <h3 className="font-bold text-lg text-slate-800">แบบหักตามจริง</h3>
                   {annualData.taxActual < annualData.taxStandard && <span className="bg-emerald-200 text-emerald-800 text-xs px-2 py-1 rounded-full font-bold">แนะนำ</span>}
                </div>
                <div className="space-y-2 text-sm">
                   <div className="flex justify-between"><span>รายได้ทั้งปี</span><span className="font-bold">{formatCurrency(annualData.totalIncome)}</span></div>
                   <div className="flex justify-between text-slate-500"><span>ค่าใช้จ่ายจริง</span><span>-{formatCurrency(annualData.actualExpense)}</span></div>
                   <div className="flex justify-between border-t pt-2 mt-2"><span>เงินได้สุทธิ</span><span className="font-bold">{formatCurrency(annualData.netIncomeActual)}</span></div>
                   <div className="flex justify-between text-lg font-bold text-indigo-700 mt-4 pt-2 border-t border-dashed border-slate-300"><span>ภาษีที่ต้องจ่าย</span><span>{formatCurrency(annualData.taxActual)}</span></div>
                </div>
             </div>
          </div>

          {/* AI Advisor */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-4"><Sparkles className="text-yellow-400"/> AI Tax Planner</h3>
                {aiAnalysis ? (
                   <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/10 leading-relaxed text-slate-200 whitespace-pre-line">
                      {aiAnalysis}
                   </div>
                ) : (
                   <p className="text-slate-400">กดปุ่มเพื่อขอคำแนะนำการวางแผนภาษีจากข้อมูลจริงของคุณ</p>
                )}
                <button 
                   onClick={handleAnalyzeAnnual} 
                   disabled={isAiLoading}
                   className="mt-6 bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                   {isAiLoading ? <Loader className="animate-spin"/> : <Zap/>} วิเคราะห์แผนภาษี
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { transactions, invoices, customers, vendors, loadingData } = useDataSync(user);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (authLoading || loadingData) return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-slate-50 text-indigo-600 font-sarabun">
      <Loader className="animate-spin mb-4" size={40} />
      <p className="text-sm font-medium animate-pulse">Initializing System...</p>
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-slate-50 font-sans text-slate-800 overflow-hidden font-sarabun">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        .font-sarabun { font-family: 'Sarabun', sans-serif !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media print {
          body * { visibility: hidden; }
          #invoice-preview-area, #invoice-preview-area * { visibility: visible; }
          #invoice-preview-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; }
          @page { size: auto; margin: 0mm; }
        }
      `}</style>
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white shadow-2xl transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
           <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-400"><Wallet/> MerchantTax</h1>
           <button onClick={()=>setSidebarOpen(false)} className="lg:hidden"><X/></button>
        </div>
        <nav className="p-4 space-y-1 mt-2 flex-1">
          <NavButton active={activeTab==='dashboard'} onClick={()=>{setActiveTab('dashboard');setSidebarOpen(false)}} icon={<PieChart size={20}/>} label="ภาพรวมธุรกิจ"/>
          <NavButton active={activeTab==='records'} onClick={()=>{setActiveTab('records');setSidebarOpen(false)}} icon={<FileText size={20}/>} label="บันทึกรายรับ-รายจ่าย"/>
          <NavButton active={activeTab==='invoice'} onClick={()=>{setActiveTab('invoice');setSidebarOpen(false)}} icon={<Printer size={20}/>} label="ออกใบกำกับภาษี"/>
          <NavButton active={activeTab==='taxes'} onClick={()=>{setActiveTab('taxes');setSidebarOpen(false)}} icon={<Calculator size={20}/>} label="ภาษีและ 50 ทวิ"/>
        </nav>
        <div className="p-4 bg-slate-800/50 m-4 rounded-xl border border-slate-700 text-xs">
           <div className="flex items-center gap-2 mb-2 text-slate-300 font-bold">
              <Home size={14} className="text-indigo-400"/> Shop ID: {APP_ID}
           </div>
           <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg w-fit">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Status: Connected
           </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 p-4 lg:px-8 flex items-center gap-3 z-10 sticky top-0">
           <button onClick={()=>setSidebarOpen(true)} className="lg:hidden p-1 rounded hover:bg-slate-100"><Menu/></button>
           <h2 className="font-bold text-slate-800 text-lg">{activeTab==='dashboard'?'Business Overview':activeTab==='records'?'Accounting Records':activeTab==='invoice'?'Invoice Generator':'Tax Reporting'}</h2>
        </header>
        <div className="flex-1 overflow-auto p-4 lg:p-6 scroll-smooth w-full h-full">
           {activeTab==='dashboard' && <Dashboard transactions={transactions}/>}
           {activeTab==='records' && <RecordManager user={user} transactions={transactions} vendors={vendors}/>}
           {activeTab==='invoice' && <InvoiceGenerator user={user} invoices={invoices} customers={customers}/>}
           {activeTab==='taxes' && <TaxReport transactions={transactions}/>}
        </div>
      </main>
    </div>
  );
}
