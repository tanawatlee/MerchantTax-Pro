import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Wallet, FileText, Calculator, Save, TrendingUp, TrendingDown, 
  AlertCircle, Download, Trash2, Edit, Menu, X, BrainCircuit, Printer, 
  CheckCircle, FileSpreadsheet, Camera, Sparkles, Loader, Filter, 
  Calendar, ChevronDown, BarChart3, Target, User, MapPin, Hash, DollarSign, Store,
  CreditCard, Package, History, Search, FileCheck, FileDown, Phone, Mail, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// --- Import Firebase ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy, where } from 'firebase/firestore';

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
const appId = 'eatsanduse'; 

// --- Helper Functions ---
const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
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

// Gemini API
const callGemini = async (prompt, imageBase64 = null) => {
  const apiKey = "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const parts = [{ text: prompt }];
  if (imageBase64) {
    const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
    const data = imageBase64.split(',')[1];
    parts.push({ inlineData: { mimeType, data } });
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    });
    if (!response.ok) throw new Error('API Request Failed');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) { return null; }
};

// --- Main App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Fixed useEffect Logic ---
  useEffect(() => {
    let unsubTrans = () => {};
    let unsubInv = () => {};

    const initAuth = async () => {
      await signInAnonymously(auth);
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 1. Transactions Listener
        const qTrans = query(collection(db, 'artifacts', appId, 'users', currentUser.uid, 'transactions'));
        unsubTrans = onSnapshot(qTrans, (snapshot) => {
          const transData = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(), 
            date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date) 
          }));
          transData.sort((a, b) => b.date - a.date);
          setTransactions(transData);
        });

        // 2. Invoices Listener
        const qInv = query(collection(db, 'artifacts', appId, 'users', currentUser.uid, 'invoices'));
        unsubInv = onSnapshot(qInv, (snapshot) => {
          const invData = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(), 
            date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date) 
          }));
          invData.sort((a, b) => b.invNo > a.invNo ? -1 : 1);
          setInvoices(invData);
          setLoading(false);
        });

      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubTrans();
      unsubInv();
    };
  }, []);

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard transactions={transactions} />;
      case 'records': return <RecordManager user={user} transactions={transactions} />;
      case 'invoice': return <InvoiceGenerator user={user} invoices={invoices} />;
      case 'taxes': return <TaxReport transactions={transactions} />;
      default: return <Dashboard transactions={transactions} />;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-slate-50 text-indigo-600 font-sarabun">
      <Loader className="animate-spin mb-4" size={40} />
      <p className="text-sm font-medium animate-pulse">กำลังโหลดข้อมูล...</p>
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-slate-50 font-sans text-slate-800 overflow-hidden font-sarabun selection:bg-indigo-100 selection:text-indigo-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        .font-sarabun { font-family: 'Sarabun', sans-serif !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @media print {
          body * { visibility: hidden; }
          #invoice-preview-area, #invoice-preview-area * { visibility: visible; }
          #invoice-preview-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; }
          @page { size: auto; margin: 0mm; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white shadow-2xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-2">
              <Wallet className="text-indigo-400"/> MerchantTax
            </h1>
            <p className="text-[10px] text-slate-400 mt-1 tracking-wider uppercase">Pro Accounting System</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        
        <nav className="p-4 space-y-1 mt-2 flex-1 overflow-y-auto">
          <NavButton active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setSidebarOpen(false);}} icon={<BarChart3 size={20} />} label="ภาพรวมธุรกิจ (Dashboard)" />
          <NavButton active={activeTab === 'records'} onClick={() => {setActiveTab('records'); setSidebarOpen(false);}} icon={<FileText size={20} />} label="บันทึกรายรับ-รายจ่าย" />
          <NavButton active={activeTab === 'invoice'} onClick={() => {setActiveTab('invoice'); setSidebarOpen(false);}} icon={<Printer size={20} />} label="ออกใบกำกับภาษี" />
          <NavButton active={activeTab === 'taxes'} onClick={() => {setActiveTab('taxes'); setSidebarOpen(false);}} icon={<Calculator size={20} />} label="ภาษีและ 50 ทวิ" />
        </nav>

        <div className="p-6 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                 {user?.uid?.slice(0,1).toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                 <p className="text-sm font-medium text-slate-200 truncate">Accountant ID</p>
                 <p className="text-xs text-slate-500 truncate">{user?.uid?.slice(0,8)}...</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* Top Header */}
        <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 p-4 lg:px-8 flex justify-between items-center z-10 sticky top-0">
          <div className="flex items-center gap-3">
             <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-indigo-600 p-1 rounded-md hover:bg-slate-100 transition-colors"><Menu size={24} /></button>
             <h2 className="font-semibold text-slate-800 text-lg flex items-center gap-2 truncate">
               {activeTab === 'dashboard' && <><BarChart3 className="text-indigo-500 hidden sm:block" size={20}/> Business Intelligence</>}
               {activeTab === 'records' && <><FileText className="text-emerald-500 hidden sm:block" size={20}/> Accounting Records</>}
               {activeTab === 'invoice' && <><Printer className="text-blue-500 hidden sm:block" size={20}/> Invoice Generator</>}
               {activeTab === 'taxes' && <><Calculator className="text-rose-500 hidden sm:block" size={20}/> Tax & Reporting</>}
             </h2>
          </div>
          <div className="hidden sm:block text-xs text-slate-400 font-medium px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
             v16.0 Final
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 relative scroll-smooth">
           {renderContent()}
        </div>
      </main>
    </div>
  );
}

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

// --- 1. Dashboard ---
const Dashboard = ({ transactions }) => {
  const [aiAdvice, setAiAdvice] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analytics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentTrans = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; });
    const income = currentTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.total, 0);
    const expense = currentTrans.filter(t => t.type === 'expense').reduce((s, t) => s + t.total, 0);
    
    const prevTrans = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear; });
    const prevIncome = prevTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.total, 0);
    const incomeGrowth = prevIncome === 0 ? 100 : ((income - prevIncome) / prevIncome) * 100;

    const channelMap = {}; currentTrans.filter(t => t.type === 'income').forEach(t => { const ch = t.channel || 'อื่นๆ'; channelMap[ch] = (channelMap[ch] || 0) + t.total; });
    const channels = Object.entries(channelMap).map(([name, value]) => ({ name, value, percent: (value / income) * 100 })).sort((a, b) => b.value - a.value);

    const costMap = {}; currentTrans.filter(t => t.type === 'expense').forEach(t => { const cat = t.category || 'อื่นๆ'; costMap[cat] = (costMap[cat] || 0) + t.total; });
    const costs = Object.entries(costMap).map(([name, value]) => ({ name, value, percent: (value / expense) * 100 })).sort((a, b) => b.value - a.value).slice(0, 5);

    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthTrans = transactions.filter(t => { const td = new Date(t.date); return td.getMonth() === m && td.getFullYear() === y; });
      trend.push({
        label: d.toLocaleDateString('th-TH', { month: 'short' }),
        income: monthTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.total, 0),
        expense: monthTrans.filter(t => t.type === 'expense').reduce((s, t) => s + t.total, 0)
      });
    }
    return { income, expense, profit: income - expense, incomeGrowth, channels, costs, trend };
  }, [transactions]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const summary = { income: analytics.income, growth: analytics.incomeGrowth.toFixed(1), topChannel: analytics.channels[0]?.name || 'None', topCost: analytics.costs[0]?.name || 'None' };
    const prompt = `Act as a Business Analyst. Data: ${JSON.stringify(summary)}. Identify ONE critical insight and ONE actionable recommendation. Output in Thai. Concise.`;
    const result = await callGemini(prompt);
    setAiAdvice(result || "ไม่สามารถวิเคราะห์ได้ในขณะนี้");
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="Total Revenue" subtitle="ยอดขายเดือนนี้" value={analytics.income} trend={analytics.incomeGrowth} color="emerald" icon={<TrendingUp />} />
        <StatCard title="Total Expenses" subtitle="รายจ่ายเดือนนี้" value={analytics.expense} color="rose" icon={<TrendingDown />} />
        <StatCard title="Net Profit" subtitle="กำไรสุทธิ" value={analytics.profit} color="indigo" icon={<Wallet />} subText={`Margin: ${analytics.income > 0 ? ((analytics.profit/analytics.income)*100).toFixed(1) : 0}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
             <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2"><BarChart3 className="text-indigo-500"/> Financial Trend</h3>
             <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border hidden sm:block">Last 6 Months</span>
          </div>
          <div className="h-56 md:h-64 flex items-end justify-between gap-3 px-2">
            {analytics.trend.map((t, i) => {
              const maxVal = Math.max(...analytics.trend.map(d => Math.max(d.income, d.expense))) || 1;
              return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                   <div className="flex gap-1 items-end h-full w-full justify-center">
                      <div className="w-2.5 md:w-5 bg-emerald-400 rounded-t-lg relative hover:bg-emerald-500 transition-all duration-300" style={{ height: `${Math.max(t.income / maxVal * 100, 2)}%` }}></div>
                      <div className="w-2.5 md:w-5 bg-rose-400 rounded-t-lg relative hover:bg-rose-500 transition-all duration-300" style={{ height: `${Math.max(t.expense / maxVal * 100, 2)}%` }}></div>
                   </div>
                   <span className="text-[10px] md:text-xs font-medium text-slate-400">{t.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 text-lg"><Target className="text-purple-500"/> Top Channels</h3>
          <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
             {analytics.channels.length === 0 ? <p className="text-center text-slate-300 mt-10">No data</p> : 
             analytics.channels.map((ch, i) => (
                <div key={i}>
                   <div className="flex justify-between text-sm mb-2"><span className="font-semibold text-slate-600">{ch.name}</span><span className="text-slate-400 text-xs font-medium">{formatCurrency(ch.value)}</span></div>
                   <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: `${ch.percent}%` }}></div></div>
                </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 text-lg"><PieChart className="text-orange-500"/> Top Expenses</h3>
            <div className="space-y-4">
               {analytics.costs.length === 0 ? <p className="text-center text-slate-300 py-4">No data</p> :
               analytics.costs.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-xl">
                     <div className="flex items-center gap-3"><div className={`w-2.5 h-2.5 rounded-full ${i===0?'bg-rose-500':i===1?'bg-orange-500':'bg-slate-300'}`}></div><span className="font-medium text-slate-600">{c.name}</span></div>
                     <span className="font-bold text-slate-700">{formatCurrency(c.value)}</span>
                  </div>
               ))}
            </div>
         </div>

         <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-900/20 group">
            <div className="relative z-10 h-full flex flex-col justify-between">
               <div>
                  <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm"><Sparkles className="text-yellow-300" /></div><h3 className="text-xl font-bold tracking-tight">AI Financial Analyst</h3></div>
                  {aiAdvice ? <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-slate-200 leading-relaxed animate-fadeIn shadow-inner">{aiAdvice}</div> : <p className="text-indigo-200 text-sm leading-relaxed max-w-md">ให้ AI ช่วยวิเคราะห์ข้อมูลเชิงลึก หาความผิดปกติ และแนะนำกลยุทธ์จากข้อมูลจริงใน Dashboard ของคุณเพื่อเพิ่มผลกำไรสูงสุด</p>}
               </div>
               <button onClick={handleAnalyze} disabled={isAnalyzing} className="mt-8 w-fit bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-white/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">{isAnalyzing ? <Loader className="animate-spin" size={18}/> : <BrainCircuit size={18}/>} {isAnalyzing ? "Analyzing..." : "Generate AI Insight"}</button>
            </div>
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, subtitle, value, trend, color, icon, subText }) => {
  const colorClasses = { emerald: "bg-emerald-50 text-emerald-600", rose: "bg-rose-50 text-rose-600", indigo: "bg-indigo-50 text-indigo-600" };
  const textClasses = { emerald: "text-emerald-600", rose: "text-rose-600", indigo: "text-indigo-600" };
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 border border-slate-100 relative overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
         <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p><p className="text-slate-600 text-sm font-medium">{subtitle}</p></div>
         <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>{icon}</div>
      </div>
      <h3 className={`text-3xl md:text-4xl font-bold ${textClasses[color]} mb-2 tracking-tight`}>{formatCurrency(value)}</h3>
      <div className="flex items-center gap-2 text-xs font-medium">{trend !== undefined && <span className={`px-2 py-1 rounded-lg flex items-center gap-1 ${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{trend >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}{Math.abs(trend).toFixed(1)}%</span>}<span className="text-slate-400">{subText}</span></div>
    </div>
  );
};

// --- 2. Record Manager ---
const RecordManager = ({ user, transactions }) => {
  const [formData, setFormData] = useState({ 
    type: 'income', date: new Date().toISOString().split('T')[0], description: '', amount: '', vatType: 'included', whtRate: 0,
    channel: 'Shopee', orderId: '', category: 'สินค้าทั่วไป', taxInvoiceNo: '', vendorName: '', vendorTaxId: '', vendorBranch: '00000'
  });
  const [filterType, setFilterType] = useState('all');
  const calculated = useMemo(() => {
    const amount = parseFloat(formData.amount) || 0;
    let net = 0, vat = 0;
    if (formData.vatType === 'included') { net = amount * 100 / 107; vat = amount - net; } else if (formData.vatType === 'excluded') { net = amount; vat = amount * 0.07; } else { net = amount; vat = 0; }
    const wht = formData.type === 'expense' ? (net * formData.whtRate / 100) : 0;
    return { net, vat, total: formData.vatType === 'excluded' ? net + vat : amount, wht };
  }, [formData]);
  const handleSubmit = async (e) => {
    e.preventDefault(); if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), { ...formData, ...calculated, date: new Date(formData.date), createdAt: serverTimestamp() });
    setFormData(prev => ({ ...prev, description: '', amount: '', orderId: '', taxInvoiceNo: '', vendorName: '', vendorTaxId: '' }));
  };
  const handleDelete = async (id) => await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', id));
  const filteredTransactions = transactions.filter(t => filterType === 'all' || t.type === filterType);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto h-[calc(100vh-140px)]">
      <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 overflow-y-auto flex flex-col">
        <h3 className="font-bold mb-6 flex gap-2 text-slate-800 text-lg items-center"><Edit className="text-indigo-500" size={24}/> New Transaction</h3>
        <div className="bg-slate-100 p-1.5 rounded-xl flex mb-6 shadow-inner">
            <button type="button" onClick={() => setFormData({...formData, type: 'income', category: 'สินค้าทั่วไป'})} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all shadow-sm ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700 shadow-none'}`}>รายรับ</button>
            <button type="button" onClick={() => setFormData({...formData, type: 'expense', category: 'ค่าใช้จ่ายทั่วไป'})} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all shadow-sm ${formData.type === 'expense' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-500 hover:text-slate-700 shadow-none'}`}>รายจ่าย</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 mb-1 block">Date</label><input type="date" className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required /></div><div><label className="text-xs font-bold text-slate-500 mb-1 block">Category</label><select className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{formData.type === 'income' ? ['สินค้าทั่วไป','บริการ','อื่นๆ'].map(c=><option key={c} value={c}>{c}</option>) : ['ค่าใช้จ่ายทั่วไป','ต้นทุนสินค้า','ค่าโฆษณา','ค่าขนส่ง','ค่าเช่า','เงินเดือน','ภาษี'].map(c=><option key={c} value={c}>{c}</option>)}</select></div></div>
          {formData.type === 'income' ? (<div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-3"><div className="grid grid-cols-2 gap-3"><input type="text" className="w-full bg-white border-0 rounded-lg p-2.5 text-sm shadow-sm" placeholder="Order ID" value={formData.orderId} onChange={e => setFormData({...formData, orderId: e.target.value})} /><select className="w-full bg-white border-0 rounded-lg p-2.5 text-sm shadow-sm" value={formData.channel} onChange={e => setFormData({...formData, channel: e.target.value})}><option>Shopee</option><option>Lazada</option><option>TikTok</option><option>หน้าร้าน</option></select></div></div>) : (<div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-3"><input type="text" className="w-full bg-white border-0 rounded-lg p-2.5 text-sm shadow-sm" placeholder="Vendor Name" value={formData.vendorName} onChange={e => setFormData({...formData, vendorName: e.target.value})} /><div className="grid grid-cols-2 gap-3"><input type="text" className="w-full bg-white border-0 rounded-lg p-2.5 text-sm shadow-sm" placeholder="Tax ID" value={formData.vendorTaxId} onChange={e => setFormData({...formData, vendorTaxId: e.target.value})} /><input type="text" className="w-full bg-white border-0 rounded-lg p-2.5 text-sm shadow-sm" placeholder="Branch" value={formData.vendorBranch} onChange={e => setFormData({...formData, vendorBranch: e.target.value})} /></div><input type="text" className="w-full bg-white border-0 rounded-lg p-2.5 text-sm shadow-sm" placeholder="Tax Invoice No." value={formData.taxInvoiceNo} onChange={e => setFormData({...formData, taxInvoiceNo: e.target.value})} /></div>)}
          <div><label className="text-xs font-bold text-slate-500 mb-1 block">Description</label><input type="text" className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required /></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 mb-1 block">Total Amount</label><input type="number" className="w-full bg-slate-50 border-0 rounded-xl p-3 text-lg font-bold text-right text-slate-700" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required /></div><div><label className="text-xs font-bold text-slate-500 mb-1 block">VAT Type</label><select className="w-full bg-slate-50 border-0 rounded-xl p-3 text-sm" value={formData.vatType} onChange={e => setFormData({...formData, vatType: e.target.value})}><option value="included">รวม VAT</option><option value="excluded">แยก VAT</option><option value="none">ไม่มี VAT</option></select></div></div>
          {formData.type === 'expense' && (<div><label className="text-xs font-bold text-slate-500 mb-1 block">WHT</label><select className="w-full bg-yellow-50 border-0 rounded-xl p-3 text-sm text-yellow-800" value={formData.whtRate} onChange={e => setFormData({...formData, whtRate: Number(e.target.value)})}> <option value={0}>ไม่หัก (0%)</option><option value={1}>1% - ขนส่ง</option><option value={3}>3% - บริการ</option><option value={5}>5% - เช่า</option></select></div>)}
          <div className="bg-slate-800 p-4 rounded-xl text-slate-300 text-sm space-y-1 mt-2 shadow-lg"><div className="flex justify-between"><span>Net:</span><span>{formatCurrency(calculated.net)}</span></div><div className="flex justify-between"><span>VAT:</span><span>{formatCurrency(calculated.vat)}</span></div>{calculated.wht > 0 && <div className="flex justify-between text-yellow-400"><span>WHT:</span><span>-{formatCurrency(calculated.wht)}</span></div>}<div className="flex justify-between font-bold text-lg text-white border-t border-slate-600 pt-2 mt-1"><span>Total:</span><span>{formatCurrency(calculated.total - calculated.wht)}</span></div></div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 font-bold shadow-lg transition-all flex items-center justify-center gap-2 mt-4"><Save size={20}/> บันทึกรายการ</button>
        </form>
      </div>
      <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h3 className="font-bold text-slate-700 flex items-center gap-2"><History className="text-slate-400"/> Recent</h3><div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm"><button onClick={()=>setFilterType('all')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType==='all'?'bg-indigo-100 text-indigo-700':'text-slate-500'}`}>All</button><button onClick={()=>setFilterType('income')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType==='income'?'bg-emerald-100 text-emerald-700':'text-slate-500'}`}>In</button><button onClick={()=>setFilterType('expense')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType==='expense'?'bg-rose-100 text-rose-700':'text-slate-500'}`}>Out</button></div></div>
        <div className="flex-1 overflow-auto custom-scrollbar"><table className="w-full text-sm text-left"><thead className="bg-white sticky top-0 z-10 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-100"><tr><th className="p-4 bg-slate-50/80 backdrop-blur">Date</th><th className="p-4 bg-slate-50/80 backdrop-blur">Description</th><th className="p-4 bg-slate-50/80 backdrop-blur text-right">Amount</th><th className="p-4 bg-slate-50/80 backdrop-blur w-10"></th></tr></thead><tbody className="divide-y divide-slate-50">{filteredTransactions.map(t => (<tr key={t.id} className="hover:bg-slate-50 group transition-colors"><td className="p-4 text-slate-500 whitespace-nowrap font-mono text-xs">{formatDate(t.date)}</td><td className="p-4"><div className="font-bold text-slate-700">{t.description}</div><div className="flex flex-wrap gap-2 mt-1">{t.type === 'income' ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-medium">{t.channel}</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 font-medium">{t.category}</span>}{t.taxInvoiceNo && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">INV: {t.taxInvoiceNo}</span>}</div></td><td className={`p-4 text-right font-bold text-base ${t.type==='income'?'text-emerald-500': 'text-rose-500'}`}>{t.type==='income'?'+':'-'}{formatCurrency(t.total)}</td><td className="p-4 text-center"><button onClick={()=>handleDelete(t.id)} className="text-slate-300 hover:text-rose-500 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div>
      </div>
    </div>
  );
};

// --- 3. Invoice Generator ---
const InvoiceGenerator = ({ user, invoices }) => {
  const [mode, setMode] = useState('create'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('month'); 
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [invData, setInvData] = useState({
    docType: 'ใบกำกับภาษี / ใบเสร็จรับเงิน',
    customerName: '', address: '', taxId: '', branch: '00000', customerPO: '', creditTerm: 0,
    customerPhone: '', customerEmail: '', isCustomerHeadOffice: true,
    items: [{ desc: '', qty: 1, unit: 'ชิ้น', price: 0 }],
    date: formatDateISO(new Date()), invNo: '', 
    sellerName: 'บริษัท ตัวอย่าง จำกัด', sellerAddress: '99/99 กทม.', sellerTaxId: '0123456789012', sellerBranchId: '00000', isHeadOffice: true, sellerPhone: '', sellerEmail: '', discount: 0,
  });

  useEffect(() => { if (mode === 'create') { const dateStr = invData.date.replace(/-/g, ''); const count = invoices.filter(inv => inv.invNo && inv.invNo.startsWith(dateStr)).length + 1; setInvData(prev => ({ ...prev, invNo: `${dateStr}-${String(count).padStart(3, '0')}` })); } }, [invData.date, invoices, mode]);
  const filteredInvoices = useMemo(() => invoices.filter(inv => { const searchLower = searchTerm.toLowerCase(); if (!((inv.invNo||'').toLowerCase().includes(searchLower) || (inv.customerName||'').toLowerCase().includes(searchLower))) return false; const d = new Date(inv.date), t = new Date(filterDate); if (filterPeriod === 'day') return d.toDateString() === t.toDateString(); if (filterPeriod === 'month') return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear(); if (filterPeriod === 'year') return d.getFullYear() === t.getFullYear(); return true; }), [invoices, searchTerm, filterPeriod, filterDate]);
  const updateItem = (i, f, v) => { const n = [...invData.items]; n[i][f] = v; setInvData({...invData, items: n}); };
  const addItem = () => setInvData({...invData, items: [...invData.items, { desc: '', qty: 1, unit: 'ชิ้น', price: 0 }]});
  const removeItem = (index) => setInvData({...invData, items: invData.items.filter((_, i) => i !== index)});
  const totals = useMemo(() => { const sub = invData.items.reduce((s, i) => s + (i.qty * i.price), 0); const afterDisc = sub - Number(invData.discount); const vat = afterDisc * 0.07; return { sub, afterDisc, vat, total: afterDisc + vat }; }, [invData.items, invData.discount]);
  const handleSaveInvoice = async () => { if (!user) return; await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'invoices'), { ...invData, ...totals, date: new Date(invData.date), createdAt: serverTimestamp() }); alert(`บันทึกใบกำกับภาษีเลขที่ ${invData.invNo} เรียบร้อยแล้ว`); setMode('history'); };
  const loadInvoice = (inv) => { setInvData({ ...inv, date: formatDateISO(new Date(inv.date)) }); setMode('create'); };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit border border-slate-200 print:hidden self-center">
         <button onClick={() => setMode('create')} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode==='create'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700'}`}><FileText size={18}/> ออกใบกำกับภาษี</button>
         <button onClick={() => setMode('history')} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode==='history'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700'}`}><History size={18}/> ประวัติเอกสาร</button>
      </div>
      {mode === 'history' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-fadeIn"><div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"><h3 className="font-bold text-slate-700 flex items-center gap-2 text-xl"><History className="text-indigo-500"/> Invoice History</h3><div className="flex flex-wrap items-center gap-3"><input type="text" placeholder="Search Invoice No. / Customer" className="pl-4 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl text-sm w-64 focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><select className="bg-slate-50 border-0 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600" value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}><option value="day">รายวัน</option><option value="month">รายเดือน</option><option value="year">รายปี</option><option value="all">ทั้งหมด</option></select></div></div><div className="rounded-2xl border border-slate-100 overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-xs"><tr><th className="p-4">Date</th><th className="p-4">Invoice No.</th><th className="p-4">Customer</th><th className="p-4 text-right">Total</th><th className="p-4 text-center">Action</th></tr></thead><tbody className="divide-y divide-slate-50">{filteredInvoices.map(inv => (<tr key={inv.id} className="hover:bg-indigo-50/30 transition-colors"><td className="p-4 text-slate-500 font-sarabun text-xs">{formatDate(inv.date)}</td><td className="p-4 font-sarabun text-indigo-600 font-bold">{inv.invNo}</td><td className="p-4 font-medium text-slate-700">{inv.customerName}</td><td className="p-4 text-right font-bold text-slate-800">{formatCurrency(inv.total)}</td><td className="p-4 text-center"><button onClick={() => loadInvoice(inv)} className="text-indigo-600 hover:bg-indigo-100 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 mx-auto"><Printer size={14}/> Print</button></td></tr>))}</tbody></table></div></div>
      )}
      {mode === 'create' && (
        <>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 print:hidden space-y-8">
            <div className="flex justify-between items-end border-b border-slate-100 pb-4"><div><h3 className="font-bold text-slate-800 text-xl flex items-center gap-2"><FileText className="text-indigo-500"/> Invoice Editor</h3><p className="text-slate-400 text-sm mt-1">กรอกข้อมูลเพื่อสร้างเอกสาร</p></div><div className="text-right"><span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Doc ID</span><p className="text-2xl font-sarabun font-bold text-indigo-600">{invData.invNo}</p></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                     <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm"><CheckCircle size={16} className="text-indigo-500"/> Details</h4>
                     <div className="space-y-3"><div><label className="text-xs font-bold text-slate-400 mb-1 block">Type</label><select className="w-full border-0 rounded-xl p-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500" value={invData.docType} onChange={e=>setInvData({...invData, docType: e.target.value})}><option>ใบกำกับภาษี / ใบเสร็จรับเงิน</option><option>ใบกำกับภาษีเต็มรูป</option><option>ใบส่งของ / ใบแจ้งหนี้</option></select></div><div><label className="text-xs font-bold text-slate-400 mb-1 block">Date</label><input type="date" className="w-full border-0 rounded-xl p-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500" value={invData.date} onChange={e=>setInvData({...invData, date: e.target.value})} /></div></div>
                  </div>
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100"><h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2 text-sm"><Store size={16}/> Seller</h4><div className="space-y-3"><input className="w-full border-0 rounded-xl p-2.5 text-sm shadow-sm" placeholder="Shop Name" value={invData.sellerName} onChange={e=>setInvData({...invData, sellerName: e.target.value})} /><input className="w-full border-0 rounded-xl p-2.5 text-sm shadow-sm" placeholder="Address" value={invData.sellerAddress} onChange={e=>setInvData({...invData, sellerAddress: e.target.value})} /><div className="grid grid-cols-2 gap-3"><input className="w-full border-0 rounded-xl p-2.5 text-sm shadow-sm" placeholder="Tax ID" value={invData.sellerTaxId} onChange={e=>setInvData({...invData, sellerTaxId: e.target.value})} /><div className="flex items-center gap-2 bg-white px-3 rounded-xl border border-indigo-100"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={invData.isHeadOffice} onChange={e=>setInvData({...invData, isHeadOffice: e.target.checked})} /><span className="text-xs text-indigo-700 font-medium whitespace-nowrap">Head Office</span>{!invData.isHeadOffice && <input className="w-16 border-b border-indigo-200 text-xs p-1 focus:outline-none" placeholder="Branch" value={invData.sellerBranchId} onChange={e=>setInvData({...invData, sellerBranchId: e.target.value})} />}</div></div><div className="grid grid-cols-2 gap-3"><input className="w-full border-0 rounded-xl p-2.5 text-sm shadow-sm" placeholder="Phone" value={invData.sellerPhone} onChange={e=>setInvData({...invData, sellerPhone: e.target.value})} /><input className="w-full border-0 rounded-xl p-2.5 text-sm shadow-sm" placeholder="Email" value={invData.sellerEmail} onChange={e=>setInvData({...invData, sellerEmail: e.target.value})} /></div></div></div>
               </div>
               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 h-full"><h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm"><User size={16} className="text-rose-500"/> Customer</h4><div className="space-y-3"><input className="w-full border-0 rounded-xl p-2.5 text-sm shadow-sm" placeholder="Customer Name" value={invData.customerName} onChange={e=>setInvData({...invData, customerName: e.target.value})} /><input className="w-full border-0 rounded-xl p-2.5 text-sm shadow-sm" placeholder="Address" value={invData.address} onChange={e=>setInvData({...invData, address: e.target.value})} /><div className="grid grid-cols-2 gap-3"><input className="w-full border-0 rounded-xl p-2.5 text-sm shadow-sm" placeholder="Tax ID" value={invData.taxId} onChange={e=>setInvData({...invData, taxId: e.target.value})} /><div className="flex items-center gap-2 bg-white px-3 rounded-xl border border-slate-200"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={invData.isCustomerHeadOffice} onChange={e=>setInvData({...invData, isCustomerHeadOffice: e.target.checked})} /><span className="text-xs text-slate-500 font-medium whitespace-nowrap">Head Office</span>{!invData.isCustomerHeadOffice && <input className="w-16 border-b border-slate-200 text-xs p-1 focus:outline-none" placeholder="Branch" value={invData.branch} onChange={e=>setInvData({...invData, branch: e.target.value})} />}</div></div><div className="grid grid-cols-2 gap-3"><input className="w-full border-0 rounded-xl p-2.5 text-sm shadow-sm" placeholder="Phone" value={invData.customerPhone} onChange={e=>setInvData({...invData, customerPhone: e.target.value})} /><input className="w-full border-0 rounded-xl p-2.5 text-sm shadow-sm" placeholder="Email" value={invData.customerEmail} onChange={e=>setInvData({...invData, customerEmail: e.target.value})} /></div><hr className="border-slate-200 my-2"/><div className="grid grid-cols-2 gap-3"><input className="w-full border-0 rounded-xl p-2.5 text-sm shadow-sm" placeholder="PO Ref." value={invData.customerPO} onChange={e=>setInvData({...invData, customerPO: e.target.value})} /><div className="flex items-center gap-2 bg-white px-3 rounded-xl border border-slate-200"><span className="text-xs text-slate-400 font-bold whitespace-nowrap">Credit (Days)</span><input type="number" className="w-full border-0 p-1 text-sm text-right focus:outline-none font-bold text-slate-700" placeholder="0" value={invData.creditTerm} onChange={e=>setInvData({...invData, creditTerm: Number(e.target.value)})} /></div></div></div></div>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
               <div className="space-y-2">{invData.items.map((it, i) => (<div key={i} className="flex gap-3 items-center group"><span className="text-xs font-sarabun text-slate-300 w-4">{i+1}.</span><input className="flex-[3] border-0 rounded-lg p-2 text-sm shadow-sm" placeholder="Description" value={it.desc} onChange={e=>updateItem(i,'desc',e.target.value)}/><input className="w-20 text-center border-0 rounded-lg p-2 text-sm shadow-sm" placeholder="Unit" value={it.unit} onChange={e=>updateItem(i,'unit',e.target.value)}/><input type="number" className="w-20 text-center border-0 rounded-lg p-2 text-sm shadow-sm" placeholder="Qty" value={it.qty} onChange={e=>updateItem(i,'qty',Number(e.target.value))}/><input type="number" className="w-28 text-right border-0 rounded-lg p-2 text-sm shadow-sm" placeholder="Price" value={it.price} onChange={e=>updateItem(i,'price',Number(e.target.value))}/><button onClick={() => removeItem(i)} className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button></div>))}</div>
               <div className="flex justify-between mt-3"><button onClick={addItem} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-bold flex items-center gap-1"><Package size={14}/> Add Item</button><div className="flex items-center gap-3"><span className="text-sm font-bold text-slate-500">Discount:</span><input type="number" className="w-32 border-0 rounded-lg p-2 text-sm shadow-sm font-bold text-right text-rose-600" placeholder="0.00" value={invData.discount} onChange={e=>setInvData({...invData, discount: Number(e.target.value)})} /></div></div>
            </div>
            <div className="flex gap-4 pt-4"><button onClick={handleSaveInvoice} className="flex-1 bg-emerald-600 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg font-bold"><Save size={20}/> Save</button><button onClick={()=>window.print()} className="bg-slate-800 text-white px-8 py-4 rounded-xl flex items-center gap-2 hover:bg-black shadow-lg font-bold"><Printer size={20}/> Print</button><button onClick={() => { alert('Select "Save as PDF" in print dialog'); window.print(); }} className="bg-rose-600 text-white px-8 py-4 rounded-xl flex items-center gap-2 hover:bg-rose-700 shadow-lg font-bold"><FileDown size={20}/> PDF</button></div>
          </div>

          <div id="invoice-preview-area" className="bg-white p-[40px] shadow-2xl min-h-[29.7cm] relative text-sm font-sarabun text-slate-800 leading-relaxed print:p-0 print:shadow-none mx-auto max-w-[21cm]">
            <div className="flex justify-between items-start mb-10"><div className="w-[55%]"><h2 className="text-3xl font-bold mb-2 text-slate-900">{invData.sellerName}</h2><p className="text-slate-600 w-full leading-snug">{invData.sellerAddress}</p><div className="mt-3 text-sm text-slate-600 space-y-0.5"><p><span className="font-bold text-slate-800">โทร:</span> {invData.sellerPhone} <span className="font-bold text-slate-800 ml-3">อีเมล:</span> {invData.sellerEmail}</p><p><span className="font-bold text-slate-800">เลขผู้เสียภาษี:</span> {invData.sellerTaxId} {invData.isHeadOffice ? '(สำนักงานใหญ่)' : `(สาขาที่ ${invData.sellerBranchId})`}</p></div></div><div className="text-right w-[45%]"><div className="text-xl font-bold uppercase mb-4 border-b-2 border-slate-800 inline-block pb-1 tracking-wide whitespace-nowrap">{invData.docType}</div><div className="space-y-1"><div className="flex justify-end gap-4"><span className="font-bold text-slate-500 uppercase text-xs tracking-wider">NO.</span> <span className="font-sarabun font-bold text-lg">{invData.invNo}</span></div><div className="flex justify-end gap-4"><span className="font-bold text-slate-500 uppercase text-xs tracking-wider">DATE</span> <span className="font-sarabun font-bold text-lg">{formatDate(invData.date)}</span></div></div></div></div>
            <div className="flex gap-6 mb-8"><div className="w-[60%] border border-slate-300 rounded-lg p-4 bg-slate-50/50"><div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2 border-b border-slate-200 pb-1">Customer (ลูกค้า)</div><div className="font-bold text-lg text-slate-900">{invData.customerName}</div><div className="text-slate-600 leading-snug mb-2">{invData.address}</div><div className="text-sm space-y-0.5 text-slate-600"><p><span className="font-bold text-slate-800">โทร:</span> {invData.customerPhone}</p><p><span className="font-bold text-slate-800">เลขผู้เสียภาษี:</span> {invData.taxId} {invData.isCustomerHeadOffice ? '(สำนักงานใหญ่)' : `(สาขาที่ ${invData.branch})`}</p></div></div><div className="w-[40%] space-y-3 pt-2"><div className="flex justify-between border-b border-slate-200 pb-1"><span className="font-bold text-slate-500 text-xs uppercase">PO Reference</span> <span className="font-sarabun font-bold">{invData.customerPO || '-'}</span></div><div className="flex justify-between border-b border-slate-200 pb-1"><span className="font-bold text-slate-500 text-xs uppercase">Payment Term</span> <span className="font-sarabun font-bold">{invData.creditTerm ? `${invData.creditTerm} Days` : 'Cash'}</span></div><div className="flex justify-between border-b border-slate-200 pb-1"><span className="font-bold text-slate-500 text-xs uppercase">Salesperson</span> <span className="font-sarabun font-bold">Admin</span></div></div></div>
            <table className="w-full mb-8 border-collapse"><thead><tr className="bg-slate-100 border-t-2 border-b-2 border-slate-800 text-slate-800 font-bold text-xs uppercase tracking-wide"><th className="py-3 w-12 text-center">#</th><th className="py-3 text-left pl-4">Description</th><th className="py-3 w-20 text-center">Qty</th><th className="py-3 w-20 text-center">Unit</th><th className="py-3 w-32 text-right pr-4">Price/Unit</th><th className="py-3 w-36 text-right pr-4 bg-slate-200">Amount</th></tr></thead><tbody className="text-slate-700">{invData.items.map((it, i) => (<tr key={i} className="border-b border-slate-200"><td className="py-3 text-center text-slate-400">{i+1}</td><td className="py-3 pl-4 font-medium">{it.desc}</td><td className="py-3 text-center">{it.qty}</td><td className="py-3 text-center text-slate-500">{it.unit}</td><td className="py-3 text-right pr-4">{formatCurrency(it.price)}</td><td className="py-3 text-right pr-4 font-bold bg-slate-50">{formatCurrency(it.qty * it.price)}</td></tr>))}{[...Array(Math.max(0, 8 - invData.items.length))].map((_, i) => (<tr key={`e-${i}`} className="border-b border-slate-100 h-10"><td></td><td></td><td></td><td></td><td></td><td className="bg-slate-50/50"></td></tr>))}</tbody></table>
            <div className="flex justify-between items-start mb-16"><div className="w-[55%] pr-8"><div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total in Text</div><div className="bg-slate-100 border border-slate-200 p-3 text-center font-bold text-slate-800 italic rounded mb-6">( {thaiBahtText(totals.total)} )</div></div><div className="w-[40%] space-y-2"><div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-sarabun">{formatCurrency(totals.sub)}</span></div>{invData.discount > 0 && <div className="flex justify-between text-rose-600"><span>Discount</span><span className="font-sarabun">-{formatCurrency(invData.discount)}</span></div>}<div className="flex justify-between text-slate-600"><span>After Discount</span><span className="font-sarabun">{formatCurrency(totals.afterDisc)}</span></div><div className="flex justify-between text-slate-600 border-b border-slate-300 pb-2"><span>VAT 7%</span><span className="font-sarabun">{formatCurrency(totals.vat)}</span></div><div className="flex justify-between font-bold text-xl text-slate-900 pt-1"><span>Grand Total</span><span>{formatCurrency(totals.total)}</span></div></div></div>
            <div className="flex justify-between mt-auto px-4 gap-10"><div className="text-center flex-1"><div className="border-b border-slate-400 mb-2 h-8"></div><p className="font-bold text-sm text-slate-800">ผู้รับวางบิล / ผู้รับของ</p><p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Received By</p><p className="text-xs mt-2 text-slate-500">วันที่ ........./........./.............</p></div><div className="text-center flex-1"><div className="border-b border-slate-400 mb-2 h-10 flex items-end justify-center"><span className="font-bold text-2xl pb-1 text-slate-900 font-sarabun">ธนวรรษ ลีลาศไพบูลย์</span></div><p className="font-bold text-sm text-slate-800">ผู้ออกใบกำกับภาษี / ผู้รับเงิน</p><p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Authorized Signature</p><p className="text-xs mt-2 text-slate-500">วันที่ {formatDate(invData.date)}</p></div></div>
          </div>
        </>
      )}
    </div>
  );
};

// --- 4. Tax Report ---
const TaxReport = ({ transactions }) => {
  const [reportType, setReportType] = useState('vat'); 
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [vatTab, setVatTab] = useState('sales');
  const monthlyData = useMemo(() => {
    const filtered = transactions.filter(t => { const d = new Date(t.date); return d.getFullYear() === year && d.getMonth() === month; });
    const salesTax = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.vat), 0);
    const purchaseTax = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.vat), 0);
    return { filtered, salesTax, purchaseTax, vatRemit: salesTax - purchaseTax };
  }, [transactions, year, month]);
  const exportVATReport = (type) => { const transType = type === 'sales' ? 'income' : 'expense'; const relevantTrans = monthlyData.filtered.filter(t => t.type === transType && t.vatType !== 'none'); let csvContent = "data:text/csv;charset=utf-8,\uFEFFลำดับ,วันที่,เลขที่ใบกำกับ,คู่ค้า/รายละเอียด,มูลค่าสินค้า,จำนวนภาษี,ยอดรวม\n"; relevantTrans.forEach((t, index) => { const dateStr = formatDate(t.date); const invNo = t.taxInvoiceNo || (t.type === 'income' ? t.id.slice(0,8) : '-'); const desc = `"${t.vendorName || t.description}"`; csvContent += `${index+1},${dateStr},${invNo},${desc},${t.net.toFixed(2)},${t.vat.toFixed(2)},${t.total.toFixed(2)}\n`; }); const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", `VAT_Report_${month+1}_${year}.csv`); document.body.appendChild(link); link.click(); };
  const whtTransactions = useMemo(() => transactions.filter(t => t.type === 'expense' && t.wht > 0), [transactions]);
  const print50Twi = (t) => { alert(`กำลังสร้างหนังสือรับรอง 50 ทวิ ให้แก่ ${t.vendorName}\n(ในระบบจริงจะดาวน์โหลดเป็น PDF)`); };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex gap-4 mb-6"><button onClick={() => setReportType('vat')} className={`px-4 py-2 rounded-lg font-bold ${reportType==='vat' ? 'bg-indigo-600 text-white shadow-lg':'bg-white text-slate-600 shadow-sm'}`}>รายงานภาษีมูลค่าเพิ่ม (VAT)</button><button onClick={() => setReportType('wht')} className={`px-4 py-2 rounded-lg font-bold ${reportType==='wht' ? 'bg-purple-600 text-white shadow-lg':'bg-white text-slate-600 shadow-sm'}`}>หัก ณ ที่จ่าย (50 ทวิ)</button></div>
      {reportType === 'vat' && (<div className="space-y-6 animate-fadeIn"><div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4"><span className="font-bold text-slate-700">เลือกเดือนภาษี:</span><select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border-0 bg-slate-100 p-2 rounded w-48 font-bold text-slate-700">{['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'].map((m, i) => <option key={i} value={i}>{m}</option>)}</select><select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border-0 bg-slate-100 p-2 rounded w-32 font-bold text-slate-700"><option value={2024}>2024</option><option value={2025}>2025</option></select></div><div className="md:col-span-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4"><div><h3 className="font-bold text-indigo-900 text-lg">สรุปนำส่ง ภ.พ.30</h3><p className="text-indigo-600 text-sm">เดือน{['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][month]} {year}</p></div><div className="flex gap-10 text-center"><div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">ภาษีขาย</p><p className="font-bold text-emerald-600 text-xl">{formatCurrency(monthlyData.salesTax)}</p></div><div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">ภาษีซื้อ</p><p className="font-bold text-rose-600 text-xl">{formatCurrency(monthlyData.purchaseTax)}</p></div><div className="border-l border-indigo-200 pl-10"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">ต้องชำระ/ขอคืน</p><p className={`font-bold text-3xl ${monthlyData.vatRemit > 0 ? 'text-indigo-700' : 'text-emerald-600'}`}>{formatCurrency(monthlyData.vatRemit)}</p></div></div></div><div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"><div className="flex border-b border-slate-100"><button onClick={() => setVatTab('sales')} className={`flex-1 py-4 font-bold text-sm transition-colors ${vatTab==='sales' ? 'bg-emerald-50/50 text-emerald-700 border-b-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-50'}`}>ภาษีขาย (Sales Tax)</button><button onClick={() => setVatTab('purchase')} className={`flex-1 py-4 font-bold text-sm transition-colors ${vatTab==='purchase' ? 'bg-rose-50/50 text-rose-700 border-b-2 border-rose-500' : 'text-slate-400 hover:bg-slate-50'}`}>ภาษีซื้อ (Purchase Tax)</button></div><div className="p-6"><div className="flex justify-between items-center mb-6"><h4 className="font-bold text-slate-700 flex items-center gap-2"><FileSpreadsheet size={20}/> รายการ{vatTab==='sales'?'ภาษีขาย':'ภาษีซื้อ'}</h4><button onClick={() => exportVATReport(vatTab)} className="px-4 py-2 rounded-lg text-white text-sm bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"><Download size={16}/> CSV</button></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-bold"><tr><th className="p-4">วันที่</th><th className="p-4">เลขที่ใบกำกับ</th><th className="p-4">รายละเอียด</th><th className="p-4 text-right">มูลค่า</th><th className="p-4 text-right">VAT</th><th className="p-4 text-right">รวม</th></tr></thead><tbody className="divide-y divide-slate-50">{monthlyData.filtered.filter(t => t.type === (vatTab === 'sales' ? 'income' : 'expense') && t.vatType !== 'none').map(t => (<tr key={t.id}><td className="p-4">{formatDate(t.date)}</td><td className="p-4">{t.taxInvoiceNo || t.orderId || '-'}</td><td className="p-4">{t.vendorName || t.description}</td><td className="p-4 text-right">{formatCurrency(t.net)}</td><td className="p-4 text-right">{formatCurrency(t.vat)}</td><td className="p-4 text-right font-bold">{formatCurrency(t.total)}</td></tr>))}</tbody></table></div></div></div></div>)}
      {reportType === 'wht' && (<div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"><div className="flex justify-between items-center mb-6"><h3 className="font-bold text-purple-800 flex items-center gap-2"><FileText/> รายการหัก ณ ที่จ่าย</h3></div><table className="w-full text-sm text-left"><thead className="bg-purple-50 text-purple-900 font-bold"><tr><th className="p-4">วันที่</th><th className="p-4">ผู้ถูกหักภาษี</th><th className="p-4 text-right">ยอดเงินได้</th><th className="p-4 text-right">ภาษีที่หัก</th><th className="p-4 text-center">Action</th></tr></thead><tbody className="divide-y divide-purple-50">{whtTransactions.map(t => (<tr key={t.id}><td className="p-4">{formatDate(t.date)}</td><td className="p-4">{t.vendorName} <span className="text-xs text-slate-400">({t.vendorTaxId})</span></td><td className="p-4 text-right">{formatCurrency(t.net)}</td><td className="p-4 text-right font-bold text-rose-500">{formatCurrency(t.wht)}</td><td className="p-4 text-center"><button onClick={() => print50Twi(t)} className="text-purple-600 hover:underline">Print 50 ทวิ</button></td></tr>))}</tbody></table></div>)}
    </div>
  );
};