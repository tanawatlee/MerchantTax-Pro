import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PieChart, Wallet, FileText, Calculator, Save, TrendingUp, TrendingDown, 
  Download, Trash2, Edit, Menu, X, Printer, 
  CheckCircle, Loader, User, Package, Search, Clock, List, Settings, PlusCircle, Tag,
  Store, Database, ImageIcon, BarChart2, Activity, ShoppingBag, Eye, EyeOff, Inbox, XCircle, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, AlertTriangle, Calendar, Info, MapPin, Building, Layers, ArrowRightLeft, Percent, ClipboardList, Briefcase,
  Camera, Sparkles, ScanText, Zap, ChevronRight, Truck, Ticket, CreditCard, FileUp, Hash, Copy, FileCheck, Box, History, AlertCircle, ShoppingCart, Truck as TruckIcon,
  RefreshCw, Plus, FileSpreadsheet, DownloadCloud, Users, Layers as LayersIcon, Filter, ArrowRight, FileJson, FileType, SaveAll,
  TrendingUp as ProfitIcon, Star, HandCoins, Landmark, LogOut, Lock, Mail
} from 'lucide-react';

// --- Import Firebase ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, serverTimestamp, updateDoc, setDoc, getDocs, where, increment, writeBatch, getDoc } from 'firebase/firestore';

// --- Configuration & Global Variables ---
const firebaseConfig = {
  apiKey: "AIzaSyD7HhMBqvWqWoRKj1CU-ysr7YcQv19Micg",
  authDomain: "eats-and-use-pro-analytics-pos.firebaseapp.com",
  projectId: "eats-and-use-pro-analytics-pos",
  storageBucket: "eats-and-use-pro-analytics-pos.firebasestorage.app",
  messagingSenderId: "832797285616",
  appId: "1:832797285616:web:f324bcb93359500818f635",
  measurementId: "G-01TCMPZRW1"
};

const PROD_APP_ID = 'Data2026';
const TEST_APP_ID = 'Test2026';

const CONSTANTS = {
  IDS: { PROD: PROD_APP_ID, DEV: TEST_APP_ID },
  SHOPS: ['eats and use', 'bubee bubee', 'ไม่ระบุ'],
  CATEGORIES: {
    INCOME: ['รายได้จากการขายสินค้า', 'รายได้จากการให้บริการ', 'รายได้ค่านายหน้า/ตัวแทน', 'รายได้อื่นๆ (ดอกเบี้ย, เงินปันผล)'],
    EXPENSE: ['ค่าใช้จ่ายทั่วไป', 'ต้นทุนสินค้า', 'วัสดุสิ้นเปลือง (Packing)', 'สินค้าเสียหาย/หมดอายุ', 'ค่าบริการ/จ้างทำของ', 'ค่าโฆษณา (ในประเทศ)', 'ค่าโฆษณา (ภ.พ.36)', 'ค่าธรรมเนียม Platform', 'ค่าขนส่ง', 'ค่าเช่า', 'เงินเดือน', 'ภาษี/เบี้ยปรับ', 'ส่วนลดร้านค้า'],
    STOCK: ['อาหาร and เครื่องดื่ม', 'ของใช้ส่วนตัว', 'ผลิตภัณฑ์ในครัวเรือน', 'ผลิตภัณฑ์ดูแลผ้า', 'แม่ and เด็ก', 'สุขภาพ and ความงาม', 'สัตว์เลี้ยง', 'ขนม and ของว่าง', 'เครื่องปรุง/วัตถุดิบ', 'อื่นๆ']
  },
  CHANNELS: ['Shopee', 'Lazada', 'TikTok', 'Line Shopping', 'Facebook', 'หน้าร้าน'],
  VAT_RATES: { INCLUDED: 'included', EXCLUDED: 'excluded', NONE: 'none' }
};

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap'); 
  .font-sarabun { font-family: 'Sarabun', sans-serif !important; } 
  ::-webkit-scrollbar { width: 6px; height: 6px; } 
  ::-webkit-scrollbar-track { background: transparent; } 
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; } 
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; } 
    
  html, body, #root {
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    max-width: none !important;
    overflow: hidden !important;
    background-color: #f8fafc;
  }

  @media print { 
    body * { visibility: hidden; } 
    #invoice-preview-area, #invoice-preview-area * { visibility: visible; } 
    #invoice-preview-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 10mm; background: white; transform: scale(1) !important; }
    .print-break { page-break-after: always; break-after: page; }
    .no-print { display: none !important; } 
  }
`;

const fbaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const authInstance = getAuth(fbaseApp);
const dbInstance = getFirestore(fbaseApp);

// --- Utilities ---
const normalizeDate = (dateInput) => {
  if (!dateInput || String(dateInput).trim() === '' || dateInput === "undefined" || dateInput === "null") return null;
  if (typeof dateInput === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateInput * 86400000);
  }
  if (typeof dateInput.toDate === 'function') return dateInput.toDate();
  if (dateInput instanceof Date) {
    if (dateInput.getFullYear() <= 1970) return null;
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }
  if (typeof dateInput === 'string') {
    const cleanStr = dateInput.trim();
    const parts = cleanStr.split(/[\/\-\s:]/);
    if (parts.length >= 3) {
      let d, m, y;
      if (parts[0].length === 4) {
        y = parseInt(parts[0]); m = parseInt(parts[1]); d = parseInt(parts[2]);
      } else {
        d = parseInt(parts[0]); m = parseInt(parts[1]); y = parseInt(parts[2]);
      }
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        if (y > 2400) y -= 543;
        return new Date(y, m - 1, d, 0, 0, 0); 
      }
    }
  }
  const fallback = new Date(dateInput);
  if (isNaN(fallback.getTime())) return null;
  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
};

const formatCurrency = (amount) => {
  const val = parseFloat(amount);
  return new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(isNaN(val) ? 0 : val);
};

const fmtAddr = {
  sub: (t) => t ? (/^\s*แขวง/.test(t) ? t.trim() : t.replace(/^\s*(ต\.|ตำบล)?\s*/, 'ตำบล')) : '',
  dist: (t) => t ? (/^\s*เขต/.test(t) ? t.trim() : t.replace(/^\s*(อ\.|อำเภอ)?\s*/, 'อำเภอ')) : '',
  prov: (t) => t ? (/^\s*กรุงเทพ/.test(t) ? 'กรุงเทพมหานคร' : t.replace(/^\s*(จ\.|จังหวัด)?\s*/, 'จังหวัด')) : ''
};

const formatDate = (dateInput) => {
  const date = normalizeDate(dateInput);
  if (!date) return 'ไม่พบข้อมูลวันที่';
  return new Intl.DateTimeFormat('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
};

const formatDateISO = (dateInput) => {
  const date = dateInput ? normalizeDate(dateInput) : new Date();
  if (!date || isNaN(date.getTime())) return new Date().toLocaleDateString('sv-SE');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const sortNewestFirst = (a, b) => {
  // ยึดลำดับที่บันทึก (เวลาที่ถูกสร้างในระบบ) เป็นหลัก
  const createdA = a.createdAt?.seconds || 0;
  const createdB = b.createdAt?.seconds || 0;
  if (createdA !== createdB && createdA !== 0 && createdB !== 0) return createdB - createdA;
  
  // หากไม่มี Timestamp ให้ใช้วันที่ที่ระบุในเอกสาร
  const timeA = normalizeDate(a.date)?.getTime() || 0;
  const timeB = normalizeDate(b.date)?.getTime() || 0;
  return timeB - timeA;
};

const sortOldestFirst = (a, b) => {
  // ยึดลำดับที่บันทึก (เวลาที่ถูกสร้างในระบบ) เป็นหลัก
  const createdA = a.createdAt?.seconds || 0;
  const createdB = b.createdAt?.seconds || 0;
  if (createdA !== createdB && createdA !== 0 && createdB !== 0) return createdA - createdB;
  
  // หากไม่มี Timestamp ให้ใช้วันที่ที่ระบุในเอกสาร
  const timeA = normalizeDate(a.date)?.getTime() || 0;
  const timeB = normalizeDate(b.date)?.getTime() || 0;
  return timeA - timeB;
};

const generateNextDocId = (items, prefix, field) => {
  const max = items.reduce((m, item) => {
    if (item[field] && item[field].startsWith(prefix)) {
      const num = parseInt(item[field].replace(prefix, ''), 10);
      return !isNaN(num) && num > m ? num : m;
    }
    return m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(5, '0')}`;
};

const THBText = (amount) => {
    if (!amount || isNaN(amount)) return 'ศูนย์บาทถ้วน';
    amount = parseFloat(amount).toFixed(2);
    const [baht, satang] = amount.split('.');
    const numbers = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
    const convert = (numStr) => {
        let text = '';
        const len = numStr.length;
        for (let i = 0; i < len; i++) {
            const digit = parseInt(numStr[i]);
            const pos = len - i - 1;
            if (digit === 0) continue;
            if (pos % 6 === 1 && digit === 2) text += 'ยี่';
            else if (pos % 6 === 1 && digit === 1) text += '';
            else if (pos % 6 === 0 && digit === 1 && i > 0 && len > 1) text += 'เอ็ด';
            else text += numbers[digit];
            if (pos % 6 === 1) text += 'สิบ';
            else text += units[pos % 6];
        }
        return text;
    };
    let text = "";
    if (baht === "0") { text = "ศูนย์"; } else { text = convert(baht); }
    text += 'บาท';
    if (parseInt(satang) === 0) { text += 'ถ้วน'; } else {
        const satangText = convert(satang);
        text += (satangText || 'ศูนย์') + 'สตางค์';
    }
    return text;
};

// --- Shared UI Components ---
function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 text-indigo-600 font-sarabun text-center fixed inset-0 z-[9999]">
      <div className="bg-white p-8 rounded-[40px] shadow-xl flex flex-col items-center">
        <Loader className="animate-spin mb-4 text-indigo-600" size={48} />
        <p className="text-lg font-bold">กำลังเตรียมฐานข้อมูลระบบ...</p>
        <p className="text-xs text-slate-400 mt-2">Connecting to Merchant Services</p>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={"w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group " + (active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white')}>
      <div className={"transition-transform duration-200 " + (active ? 'scale-110' : 'group-hover:scale-110')}>{icon}</div>
      <span className="font-medium tracking-wide text-xs">{label}</span>
    </button>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none text-left">
        {toasts.map(t => (
            <div key={t.id} className={"pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border animate-in slide-in-from-right-full duration-300 bg-white " + (t.type === 'error' ? 'border-rose-100 text-rose-600' : 'border-emerald-100 text-emerald-600')}>
                {t.type === 'error' ? <XCircle size={20}/> : <CheckCircle size={20}/>}
                <p className="text-sm font-bold">{t.message}</p>
                <button onClick={() => removeToast(t.id)} className="ml-2 text-slate-300 hover:text-slate-500"><X size={14}/></button>
            </div>
        ))}
    </div>
  );
}

function StatCard({ title, value, color, icon, subtitle }) {
  const styles = { emerald: { bg: "bg-emerald-50", text: "text-emerald-600" }, rose: { bg: "bg-rose-50", text: "text-rose-600" }, indigo: { bg: "bg-indigo-50", text: "text-indigo-600" }, amber: { bg: "bg-amber-50", text: "text-amber-600" } };
  const currentStyle = styles[color] || styles.indigo;
  return (
    <div className="rounded-3xl p-6 transition-all duration-300 border border-slate-100 bg-white hover:shadow-lg w-full text-left">
      <div className="flex justify-between items-start mb-4">
         <div className="text-left">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 text-left">{title}</p>
            <h3 className={"text-2xl font-bold tracking-tight " + currentStyle.text + " text-left"}>{formatCurrency(value)}</h3>
         </div>
         <div className={"p-3 rounded-2xl " + currentStyle.bg + " " + currentStyle.text}>{icon}</div>
      </div>
      <p className="text-slate-400 text-xs text-left">{subtitle}</p>
    </div>
  );
}

// --- Login Component ---
function LoginScreen({ authInstance, addToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(authInstance, email, password);
        addToast('เข้าสู่ระบบสำเร็จ', 'success');
      } else {
        await createUserWithEmailAndPassword(authInstance, email, password);
        addToast('สมัครสมาชิกสำเร็จ', 'success');
      }
    } catch (err) {
      let msg = 'เกิดข้อผิดพลาด: ' + err.message;
      if (err.code === 'auth/invalid-credential') msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      if (err.code === 'auth/email-already-in-use') msg = 'อีเมลนี้ถูกใช้งานแล้ว';
      if (err.code === 'auth/weak-password') msg = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      addToast(msg, 'error');
    }
    setLoading(false);
  };

  const handleAnonymous = async () => {
    setLoading(true);
    try {
      await signInAnonymously(authInstance);
      addToast('เข้าสู่ระบบโหมดผู้เยี่ยมชม', 'success');
    } catch (err) {
      addToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-slate-50 font-sarabun p-4 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/50 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-200/50 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md z-10 text-left border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg">
            <Wallet size={32} className="text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-800 text-center mb-2">MerchantTax</h2>
        <p className="text-sm text-slate-500 text-center mb-8">{isLogin ? 'เข้าสู่ระบบเพื่อจัดการร้านค้าของคุณ' : 'สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน'}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-slate-500 uppercase">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all" placeholder="your@email.com" />
            </div>
          </div>
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-slate-500 uppercase">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all" placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all flex justify-center items-center gap-2 mt-2 disabled:opacity-50">
            {loading ? <Loader className="animate-spin" size={20} /> : (isLogin ? <CheckCircle size={20} /> : <PlusCircle size={20} />)}
            {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-px bg-slate-100 flex-1"></div>
          <span className="text-xs text-slate-400 font-bold uppercase">หรือ</span>
          <div className="h-px bg-slate-100 flex-1"></div>
        </div>

        <button type="button" onClick={handleAnonymous} disabled={loading} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-2xl font-bold transition-all flex justify-center items-center gap-2 mt-6">
          <User size={18} /> เข้าใช้งานแบบไม่ระบุตัวตน (Demo)
        </button>

        <p className="text-center mt-6 text-sm text-slate-500">
          {isLogin ? 'ยังไม่มีบัญชีใช่ไหม? ' : 'มีบัญชีอยู่แล้ว? '}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 font-bold hover:underline">
            {isLogin ? 'สมัครเลย' : 'เข้าสู่ระบบ'}
          </button>
        </p>
      </div>
    </div>
  );
}

// --- Main Sub Components ---

function Dashboard({ transactions, invoices, stockBatches }) {
  const [selectedChannel, setSelectedChannel] = useState('all');

  const analytics = useMemo(() => {
    const filteredTrans = transactions.filter(t => 
        selectedChannel === 'all' || 
        (t.channel || 'หน้าร้าน').toUpperCase() === selectedChannel.toUpperCase()
    );

    const inc = filteredTrans.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.total) || 0), 0);
    const exp = filteredTrans.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.total) || 0), 0);
    
    // คำนวณเจ้าหนี้การค้า (Supplier Debt)
    const supplierDebt = stockBatches
        .filter(b => b.paymentStatus === 'credit')
        .reduce((sum, b) => sum + (Number(b.quantity) * Number(b.costPerUnit)), 0);

    // คำนวณกำไรสุทธิแบบ Real-time (Income - Platform Fees - COGS)
    const netProfit = filteredTrans.filter(t => t.type === 'income').reduce((sum, t) => {
        const platformFees = Number(t.platformFee) || 0;
        const cogs = (t.items || []).reduce((itemSum, item) => {
            const batch = stockBatches.find(b => 
                (b.sku && b.sku !== '-' && b.sku === item.sku) || 
                (b.productName === item.desc)
            );
            return itemSum + (Number(item.qty) * Number(batch?.costPerUnit || 0));
        }, 0);
        return sum + (Number(t.total) - platformFees - cogs);
    }, 0);

    return { inc, exp, netProfit, supplierDebt };
  }, [transactions, invoices, stockBatches, selectedChannel]);

  const monthlyStats = useMemo(() => {
    const mData = {};
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
        mData[key] = { name: key, income: 0, expense: 0 };
    }
    
    transactions.forEach(t => {
        if (selectedChannel !== 'all' && (t.channel || 'หน้าร้าน').toUpperCase() !== selectedChannel.toUpperCase()) return;
        
        const d = normalizeDate(t.date);
        if (!d) return;
        const key = d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
        if (mData[key]) {
            const amt = Number(t.total) || 0;
            if (t.type === 'income') mData[key].income += amt;
            else mData[key].expense += amt;
        }
    });
    
    const maxVal = Math.max(...Object.values(mData).map(m => Math.max(m.income, m.expense, 1)));
    return { data: Object.values(mData), maxVal };
  }, [transactions, selectedChannel]);

  return (
    <div className="space-y-6 animate-fadeIn text-left font-sarabun w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 text-left">Financial Intelligence</h2>
                <p className="text-xs text-slate-400">วิเคราะห์ผลกำไรสุทธิและสภาพคล่องทางการเงิน</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 shrink-0">
                <Filter size={16} className="text-indigo-600"/>
                <span className="text-xs font-bold text-slate-500">ช่องทาง:</span>
                <select 
                    value={selectedChannel} 
                    onChange={e => setSelectedChannel(e.target.value)} 
                    className="bg-transparent border-0 text-sm font-bold text-slate-800 outline-none cursor-pointer focus:ring-0 p-0 pr-4"
                >
                    <option value="all">รวมทุกช่องทาง</option>
                    {CONSTANTS.CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="IMPORTED">IMPORTED</option>
                </select>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <StatCard title="รายรับ (ยอดขาย)" value={analytics.inc} color="indigo" icon={<TrendingUp />} subtitle="รายรับรวมก่อนหักค่าธรรมเนียม" />
            <StatCard title="กำไรสุทธิ (Real Net)" value={analytics.netProfit} color="emerald" icon={<ProfitIcon />} subtitle="หักต้นทุนและค่าธรรมเนียมแล้ว" />
            <StatCard title="เจ้าหนี้ค้างจ่าย" value={analytics.supplierDebt} color="amber" icon={<Landmark />} subtitle="ยอดค้างชำระ Supplier (Credit)" />
            <StatCard title="รายจ่ายปฏิบัติการ" value={analytics.exp} color="rose" icon={<TrendingDown />} subtitle="ค่าใช้จ่ายที่ไม่ใช่ต้นทุนสินค้า" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col min-h-[350px] w-full">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart2 className="text-indigo-600"/> กำไรสุทธิแยกตามช่องทาง (Performance by Channel)</h3>
                <div className="flex-1 flex flex-col justify-end text-slate-300 w-full mt-4">
                    <div className="flex h-48 items-end gap-2 w-full">
                        {monthlyStats.data.map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="flex w-full items-end justify-center gap-1 h-full relative">
                                     <div className="w-1/3 bg-indigo-500 rounded-t-md relative group-hover:bg-indigo-400 transition-colors cursor-pointer" style={{ height: `${(m.income / monthlyStats.maxVal) * 100}%`, minHeight: '4px' }}>
                                         <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 px-1.5 py-0.5 rounded shadow-sm z-10">{formatCurrency(m.income)}</span>
                                     </div>
                                     <div className="w-1/3 bg-rose-400 rounded-t-md relative group-hover:bg-rose-300 transition-colors cursor-pointer" style={{ height: `${(m.expense / monthlyStats.maxVal) * 100}%`, minHeight: '4px' }}>
                                         <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 px-1.5 py-0.5 rounded shadow-sm z-10">{formatCurrency(m.expense)}</span>
                                     </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">{m.name}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center gap-4 mt-6 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-3 h-3 rounded bg-indigo-500"></span> รายรับ (Income)</div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-3 h-3 rounded bg-rose-400"></span> รายจ่าย (Expense)</div>
                    </div>
                </div>
            </div>
            <div className="bg-slate-900 p-8 rounded-[40px] shadow-xl text-white flex flex-col justify-between">
                <div>
                    <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Liquidity Alert</h4>
                    <p className="text-sm font-bold mb-6">สรุปสถานะการเงินที่ต้องจัดการคนเดียว</p>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-xs opacity-60">หนี้ค้างชำระ:</span>
                            <span className="text-sm font-black text-amber-400">{formatCurrency(analytics.supplierDebt)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-xs opacity-60">สินค้าใกล้หมด (SKUs):</span>
                            <span className="text-sm font-black text-rose-400">
                                {stockBatches.filter(b => (Number(b.quantity) - Number(b.sold)) < 10).length}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="pt-6">
                    <button onClick={() => window.print()} className="w-full bg-indigo-600 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20">
                        <Printer size={16}/> พิมพ์รายงานการเงินสรุป
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}

function DataImporter({ appId, showToast, user, stockBatches }) {
  const [platform, setPlatform] = useState('shopee');
  const [importedData, setImportedData] = useState([]);
  const [stats, setStats] = useState({ totalRows: 0, processed: 0, skipped: 0, totalAmount: 0, totalFees: 0 });
  const [loading, setLoading] = useState(false);
  const [fixedInfraFee, setFixedInfraFee] = useState(''); 
  const fileInputRef = useRef(null);

  const PLATFORM_SCHEMAS = {
    shopee: {
        orderId: ['หมายเลขคำสั่งซื้อ', 'Order ID'],
        status: ['สถานะการสั่งซื้อ', 'Order Status'],
        date: ['เวลาการชำระสินค้า', 'Payment Time', 'เวลาที่ทำการสั่งซื้อ', 'เวลาชำระเงิน'],
        price: ['ราคาขาย', 'Deal Price', 'ราคาต่อชิ้น'],
        qty: ['จำนวน', 'Quantity'],
        transFee: ['Transaction Fee', 'ค่าธรรมเนียมการทำธุรกรรม', 'ค่าธรรมเนียมธุรกรรม'],
        commFee: ['ค่าคอมมิชชั่น', 'Commission Fee'],
        servFee: ['ค่าบริการ', 'Service Fee'],
        shipping: ['ที่อยู่ในการจัดส่ง', 'Shipping Address'],
        buyer: ['ชื่อผู้รับ', 'Receiver Name', 'ชื่อผู้ซื้อ'],
        product: ['ชื่อสินค้า', 'Product Name'],
        sku: ['Product SKU', 'SKU', 'Seller SKU', 'รหัสตัวเลือกสินค้า', 'Option SKU', 'รหัสสินค้า', 'Variation SKU', 'เลข SKU'],
        courier: ['ตัวเลือกการจัดส่ง', 'Shipping Option'],
        trackingNo: ['หมายเลขติดตามพัสดุ', 'Tracking Number'],
        shippingFeeByBuyer: ['ค่าจัดส่งที่ชำระโดยผู้ซื้อ', 'Shipping Fee Paid by Buyer'],
        shippingFeeSubsidy: ['ค่าจัดส่งที่ Shopee ออกให้โดยประมาณ', 'Estimated Shopee Shipping Rebate', 'เงินสนับสนุนค่าจัดส่ง'],
        estimatedShippingFee: ['ค่าจัดส่งโดยประมาณ', 'Estimated Shipping Fee', 'ค่าจัดส่งตามที่เกิดขึ้นจริง', 'Actual Shipping Fee'],
        returnShippingFee: ['ค่าจัดส่งสินค้าคืน', 'Return Shipping Fee']
    },
    lazada: {
        orderId: ['Order No.', 'Order Number', 'เลขที่สั่งซื้อ', 'หมายเลขคำสั่งซื้อ'],
        status: ['Status', 'สถานะ', 'สถานะคำสั่งซื้อ'],
        date: ['Order Creation Date', 'วันที่สร้างคำสั่งซื้อ', 'วันที่ชำระเงิน', 'Create Time'],
        price: ['Unit Price', 'ราคาต่อชิ้น', 'paid_price', 'ราคาขาย'],
        qty: ['Quantity', 'จำนวน', 'Qty'],
        transFee: ['Payment Fee', 'ค่าธุรกรรม', 'Transaction Fee'],
        commFee: ['Commission', 'ค่าคอมมิชชั่น', 'Commission Fee'],
        servFee: ['Service Fee', 'ค่าธรรมเนียม', 'ค่าธรรมเนียมการชำระเงิน'],
        shipping: ['Shipping Address', 'ที่อยู่จัดส่ง', 'Billing Address'],
        buyer: ['Customer Name', 'ชื่อลูกค้า', 'Buyer Name'],
        product: ['Product Name', 'ชื่อสินค้า', 'Item Name'],
        sku: ['Product SKU', 'SKU', 'Seller SKU', 'รหัสตัวเลือกสินค้า', 'Option SKU', 'รหัสสินค้า', 'Seller SKU ID'],
        courier: ['Delivery Provider', 'ผู้ให้บริการจัดส่ง', 'Shipping Provider'],
        trackingNo: ['Tracking Code', 'หมายเลขติดตามพัสดุ', 'Tracking Number'],
        shippingFeeByBuyer: ['Shipping Fee (Paid By Customer)', 'ค่าจัดส่งที่ลูกค้าชำระ', 'ค่าจัดส่ง (ชำระโดยลูกค้า)', 'Customer Shipping Fee'],
        shippingFeeSubsidy: ['Shipping Fee Voucher (by Lazada)', 'คูปองส่วนลดค่าจัดส่ง (จากลาซาด้า)', 'Promotional Value'],
        estimatedShippingFee: ['ค่าจัดส่งโดยประมาณ', 'Estimated Shipping Fee', 'Shipping Fee (Paid By Seller)', 'ค่าจัดส่ง (ชำระโดยผู้ขาย)', 'ค่าจัดส่งที่ผู้ขายชำระ'],
        returnShippingFee: ['Return Shipping Fee', 'ค่าจัดส่งสินค้าคืน']
    },
    tiktok: {
        orderId: ['Order ID', 'หมายเลขคำสั่งซื้อ', 'Order number'],
        status: ['Order Status', 'สถานะ', 'สถานะคำสั่งซื้อ'],
        date: ['Payment Time', 'Order Creation Time', 'วันที่ชำระเงิน', 'เวลาชำระเงิน', 'Created Time', 'เวลาที่สร้างคำสั่งซื้อ', 'เวลาที่สร้าง'],
        price: ['Product Price', 'ราคาขาย', 'Unit Price', 'ราคาปกติ'],
        qty: ['Quantity', 'จำนวน', 'Qty'],
        transFee: ['Transaction Fee', 'ค่าธรรมเนียมธุรกรรม', 'Payment Fee'],
        commFee: ['Platform Commission', 'ค่าคอมมิชชั่น', 'Commission'],
        servFee: ['Service Fee', 'ค่าธรรมเนียมบริการ', 'Affiliate Commission'],
        shipping: ['Shipping Address', 'ที่อยู่จัดส่ง', 'Detail Address'],
        buyer: ['Buyer Name', 'ชื่อผู้ซื้อ', 'Customer Name'],
        product: ['Product Name', 'ชื่อสินค้า'],
        sku: ['Product SKU', 'SKU', 'Seller SKU', 'รหัสสินค้าในร้าน', 'Option SKU', 'รหัสสินค้า', 'Seller SKU ID'],
        courier: ['Shipping Provider', 'ผู้จัดส่ง', 'Delivery Option'],
        trackingNo: ['Tracking ID', 'หมายเลขติดตามพัสดุ', 'Tracking Number'],
        shippingFeeByBuyer: ['Customer Shipping Fee', 'ค่าจัดส่งที่ลูกค้าชำระ', 'Shipping Fee Paid by Customer'],
        shippingFeeSubsidy: ['Platform Shipping Subsidy', 'ส่วนลดค่าจัดส่งจากแพลตฟอร์ม', 'Shipping Discount'],
        estimatedShippingFee: ['Estimated Shipping Fee', 'ค่าจัดส่งโดยประมาณ', 'Shipping fee borne by seller', 'ค่าจัดส่งที่เรียกเก็บจากผู้ขาย'],
        returnShippingFee: ['Return Shipping Fee', 'ค่าจัดส่งสินค้าคืน']
    }
  };

  const cleanNum = (val) => { 
      if (typeof val === 'number') return val; 
      if (!val) return 0; 
      const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
      return isNaN(parsed) ? 0 : parsed;
  };
  
  const findVal = (row, kws) => { 
    if (!kws) return undefined;
    const keys = Object.keys(row);
    const cleanKws = kws.map(kw => kw.toString().replace(/\s/g, '').toLowerCase());
    
    // 1. Exact Match (Cleaned)
    let foundKey = keys.find(x => {
        const cleanKey = x.toString().replace(/\s/g, '').toLowerCase();
        return cleanKws.some(ckw => cleanKey === ckw);
    });

    // 2. Partial Match (Includes)
    if (!foundKey) {
        foundKey = keys.find(x => {
            const cleanKey = x.toString().replace(/\s/g, '').toLowerCase();
            return cleanKws.some(ckw => cleanKey.includes(ckw) || ckw.includes(cleanKey));
        });
    }

    return foundKey ? row[foundKey] : undefined; 
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.XLSX) {
      setLoading(true);
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      script.onload = () => { setLoading(false); parseFile(file); };
      document.body.appendChild(script);
    } else { parseFile(file); }
  };

  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = window.XLSX.read(bstr, { type: 'binary', cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = window.XLSX.utils.sheet_to_json(ws, { defval: '' }); // ใส่ defval ป้องกัน undefined
        const ordersMap = {};
        let skipped = 0; let totalAmt = 0; let totalFees = 0;

        const schema = PLATFORM_SCHEMAS[platform] || PLATFORM_SCHEMAS.shopee;

        raw.forEach(row => {
          const orderId = String(findVal(row, schema.orderId) || '');
          const status = String(findVal(row, schema.status) || '').toLowerCase();
          
          // เปลี่ยนมาใช้การ "กีดกัน" (Exclude) สถานะที่ยังไม่เกิดรายได้แทนการ "ครอบคลุม" (Include)
          // เพื่อให้รองรับสถานะภาษาไทยของ TikTok/Lazada เช่น รอจัดส่ง, กำลังจัดส่ง, เสร็จสิ้น, ที่ต้องจัดส่ง
          const isCancelledOrUnpaid = status.includes('ยกเลิก') || status.includes('cancel') || 
                                      status.includes('unpaid') || status.includes('รอชำระเงิน') ||
                                      status.includes('ไม่สำเร็จ') || status.includes('คืนสินค้า');
                                      
          const isCompleted = status === '' || !isCancelledOrUnpaid;
                              
          const dateVal = findVal(row, schema.date);
          
          if (!orderId || !isCompleted || !dateVal) { skipped++; return; }
          
          const price = Math.abs(cleanNum(findVal(row, schema.price)));
          const qty = cleanNum(findVal(row, schema.qty)) || 1;
          
          // ดึงค่าธรรมเนียมและแปลงเป็นบวก (Absolute Value) ป้องกัน NaN
          const transFee = Math.abs(cleanNum(findVal(row, schema.transFee)));
          const comm = Math.abs(cleanNum(findVal(row, schema.commFee)));
          const serv = Math.abs(cleanNum(findVal(row, schema.servFee)));
          const skuVal = String(findVal(row, schema.sku) || '-').trim();
          const infra = parseFloat(fixedInfraFee || 0) || 0;
          
          const shippingAddress = String(findVal(row, schema.shipping) || '');
          const buyerName = String(findVal(row, schema.buyer) || 'ลูกค้า ' + platform);
          const courier = String(findVal(row, schema.courier) || '-').trim();
          const trackingNo = String(findVal(row, schema.trackingNo) || '-').trim();
          
          const shippingFeeByBuyer = Math.abs(cleanNum(findVal(row, schema.shippingFeeByBuyer)));
          const shippingFeeSubsidy = Math.abs(cleanNum(findVal(row, schema.shippingFeeSubsidy)));
          const estimatedShippingFee = Math.abs(cleanNum(findVal(row, schema.estimatedShippingFee)));
          const returnShippingFee = Math.abs(cleanNum(findVal(row, schema.returnShippingFee)));

          // รวมยอดสินค้าในแถวนี้
          const lineTotal = price * qty;

          if (!ordersMap[orderId]) {
            const rowTotalFees = transFee + comm + serv + infra;
            ordersMap[orderId] = { 
              type: 'income', 
              date: normalizeDate(dateVal), 
              orderId, 
              total: lineTotal, 
              platformFee: rowTotalFees,
              transactionFee: transFee, 
              infrastructureFee: infra, 
              commissionFee: comm, 
              serviceFee: serv,
              description: String(findVal(row, schema.product) || 'สินค้าจาก ' + platform).substring(0, 100), 
              channel: platform.toUpperCase(), 
              category: 'รายได้จากการขายสินค้า', 
              items: [{ desc: String(findVal(row, schema.product) || 'สินค้า').trim(), qty, amount: lineTotal, price, sellPrice: price, buyPrice: 0, sku: skuVal }],
              partnerName: buyerName,
              shippingAddress: shippingAddress,
              partnerAddress: shippingAddress,
              courier: courier,
              trackingNo: trackingNo,
              shippingFee: shippingFeeByBuyer,
              shippingFeeSubsidy: shippingFeeSubsidy,
              estimatedShippingFee: estimatedShippingFee,
              returnShippingFee: returnShippingFee,
              grandTotal: lineTotal - rowTotalFees
            };
            totalAmt += lineTotal; 
            totalFees += rowTotalFees;
          } else {
            // ถ้าออเดอร์นี้มีหลายบรรทัด (เช่น Lazada 1 Order มีหลาย Item)
            ordersMap[orderId].total += lineTotal;
            
            // นำค่าธรรมเนียมมาบวกทบกัน (กรณีไฟล์แยกค่าธรรมเนียมตามบรรทัด)
            ordersMap[orderId].transactionFee += transFee;
            ordersMap[orderId].commissionFee += comm;
            ordersMap[orderId].serviceFee += serv;
            ordersMap[orderId].platformFee += (transFee + comm + serv);
            
            ordersMap[orderId].grandTotal = ordersMap[orderId].total - ordersMap[orderId].platformFee;
            ordersMap[orderId].shippingFee = Math.max(ordersMap[orderId].shippingFee || 0, shippingFeeByBuyer);
            ordersMap[orderId].shippingFeeSubsidy = Math.max(ordersMap[orderId].shippingFeeSubsidy || 0, shippingFeeSubsidy);
            ordersMap[orderId].estimatedShippingFee = Math.max(ordersMap[orderId].estimatedShippingFee || 0, estimatedShippingFee);
            ordersMap[orderId].returnShippingFee = Math.max(ordersMap[orderId].returnShippingFee || 0, returnShippingFee);
            ordersMap[orderId].items.push({ 
              desc: String(findVal(row, schema.product) || 'สินค้า').trim(), qty, amount: lineTotal, price, sellPrice: price, buyPrice: 0, sku: skuVal
            });
            totalAmt += lineTotal;
            totalFees += (transFee + comm + serv);
          }
        });
        const final = Object.values(ordersMap).sort(sortNewestFirst);
        setImportedData(final);
        setStats({ totalRows: raw.length, processed: final.length, skipped, totalAmount: totalAmt, totalFees });
        showToast(`นำเข้าสำเร็จ ${final.length} รายการ (ข้าม ${skipped} แถว)`, 'success');
      } catch (e) { 
        console.error("Parse error:", e);
        showToast("ไม่สามารถอ่านไฟล์ได้ โปรดตรวจสอบรูปแบบ Excel", "error"); 
      }
    };
    reader.readAsBinaryString(file);
  };

  const saveToFirebase = async () => {
    if (!user || importedData.length === 0) return;
    setLoading(true);
    try {
      const batch = writeBatch(dbInstance);
      const stockSnap = [...stockBatches]; 
      
      let currentIncMax = transactions.filter(t => t.type === 'income').reduce((m, t) => {
          if (t.sysDocId && t.sysDocId.startsWith('INC-')) {
              const num = parseInt(t.sysDocId.replace('INC-', ''), 10);
              return !isNaN(num) && num > m ? num : m;
          }
          return m;
      }, 0);

      // เรียงเก่าไปใหม่ก่อนจ่ายเลข เพื่อให้รายการใหม่สุดได้เลขมากที่สุดเสมอ
      const sortedForSave = [...importedData].sort(sortOldestFirst);

      for (const trans of sortedForSave) {
        
        // --- Generate System Doc ID ---
        currentIncMax++;
        const sysDocId = `INC-${String(currentIncMax).padStart(5, '0')}`;

        const docRef = doc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'transactions_income')); 
        batch.set(docRef, { ...trans, sysDocId, createdAt: serverTimestamp(), userId: user.uid });

        for (const item of trans.items) {
            let needed = Number(item.qty);
            const batches = stockSnap
                .filter(b => {
                    const bSku = String(b.sku || '').trim().toLowerCase();
                    const iSku = String(item.sku || '').trim().toLowerCase();
                    const bName = String(b.productName || '').trim().toLowerCase();
                    const iName = String(item.desc || '').trim().toLowerCase();
                    return (iSku !== '-' && iSku !== '' && bSku === iSku) || (bName === iName);
                })
                .filter(b => (Number(b.quantity) - Number(b.sold || 0) > 0))
                .sort((a,b) => normalizeDate(a.date) - normalizeDate(b.date));

            for (const b of batches) {
                if (needed <= 0) break;
                const remaining = Number(b.quantity) - Number(b.sold || 0);
                const take = Math.min(needed, remaining);
                
                const batchRef = doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches', b.id);
                batch.update(batchRef, { sold: increment(take) });
                
                const snapIdx = stockSnap.findIndex(s => s.id === b.id);
                if (snapIdx !== -1) stockSnap[snapIdx].sold = (Number(stockSnap[snapIdx].sold) || 0) + take;
                
                needed -= take;
            }
        }
      }

      await batch.commit();
      showToast(`เปิดใช้งานข้อมูล ${importedData.length} รายการ and หักสต็อกเรียบร้อย`, "success");
      setImportedData([]);
    } catch (e) { showToast("Error: " + e.message, "error"); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sarabun text-left pb-10 w-full h-full">
      <div className="flex justify-between items-center text-left">
        <h3 className="text-2xl font-bold flex items-center gap-2 text-left"><Sparkles className="text-indigo-600"/> Import & Activate Data</h3>
        <div className="flex gap-2">
            {['shopee', 'lazada', 'tiktok'].map(p => (
              <button key={p} onClick={() => setPlatform(p)} className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${platform === p ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-800'}`}>
                {p.toUpperCase()}
              </button>
            ))}
        </div>
      </div>
       
      <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex items-center gap-6 text-left">
        <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600 border border-indigo-100 text-center"><Settings size={24}/></div>
        <div className="flex-1 space-y-1 text-left">
          <p className="text-xs font-black text-indigo-600 uppercase tracking-widest text-left">Activation Configuration</p>
          <div className="flex items-center gap-4 text-left">
            <div className="flex items-center gap-3 text-left">
              <label className="text-sm font-bold text-slate-600 whitespace-nowrap text-left">ค่าธรรมเนียม PLATFORM:</label>
              <div className="relative text-left">
                <input 
                  type="number" 
                  value={fixedInfraFee} 
                  onChange={(e) => setFixedInfraFee(e.target.value)} 
                  className="bg-white border border-indigo-200 rounded-xl px-4 py-2 text-sm font-bold w-32 focus:ring-2 focus:ring-indigo-200 outline-none text-right pr-8 text-slate-800"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-2 text-slate-400 text-xs font-bold text-right">฿</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col gap-4 text-left">
          <div className="space-y-2 text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">Step 1: Upload Excel File</p>
            <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current.click()} className="w-full py-10 border-2 border-dashed border-indigo-200 rounded-3xl flex flex-col items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors text-center">
              <FileUp size={48} className="mb-2"/>
              <p className="font-bold">คลิกเพื่ออัปโหลดไฟล์ Excel</p>
            </button>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col text-left">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50 text-left">
            <span className="font-bold text-slate-800 text-left">Step 2: ยืนยันเพื่อบันทึกและหักสต็อก</span>
            {importedData.length > 0 && (
              <button 
                onClick={saveToFirebase} 
                disabled={loading} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all disabled:opacity-50 text-center"
              >
                {loading ? <Loader className="animate-spin" size={14}/> : <CheckCircle size={14}/>}
                บันทึกและเปิดใช้งาน (Activate)
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto max-h-[400px] text-left">
            <table className="w-full text-xs text-left">
              <thead className="bg-white text-slate-400 font-bold uppercase tracking-wider sticky top-0 border-b text-left">
                <tr>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Description</th>
                  <th className="p-4 text-left">SKU Mapping</th>
                  <th className="p-4 text-right">Income (฿)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-left">
                {importedData.length === 0 ? (
                  <tr><td colSpan="4" className="p-10 text-center text-slate-300 font-bold text-center">กรุณาเลือกประเภทแพลตฟอร์ม and อัปโหลดไฟล์เพื่อเริ่มต้น</td></tr>
                ) : importedData.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 group text-left">
                    <td className="p-4 text-slate-500 whitespace-nowrap text-left">{formatDate(it.date)}</td>
                    <td className="p-4 text-left">
                      <p className="font-bold text-slate-700 text-left">{it.orderId}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px] text-left">{it.description}</p>
                    </td>
                    <td className="p-4 text-left">
                        <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-[10px] font-mono font-bold">{it.items[0]?.sku || '-'}</span>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-black text-indigo-600 text-right">{formatCurrency(it.grandTotal)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StockManager({ appId, stockBatches, showToast, user, transactions }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewHistory, setViewHistory] = useState(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [deleteStockConfirm, setDeleteStockConfirm] = useState(null);
  const [deleteBatchConfirm, setDeleteBatchConfirm] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [targetProductEdit, setTargetProductEdit] = useState(null);
  const [tempCategory, setTempCategory] = useState('');

  const fileInputRef = useRef(null);
  const importFileInputRef = useRef(null);
  const [newStock, setNewStock] = useState({
    productName: '', skuManual: '', category: CONSTANTS.CATEGORIES.STOCK[0], quantity: '', costPerUnit: 0, sellPrice: 0, date: formatDateISO(new Date()), paymentStatus: 'paid'
  });

  const generateAutoSKU = () => {
    const datePart = new Date().toISOString().slice(2,10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `MT-${datePart}-${randomPart}`;
  };

  const openEditCategory = (item) => {
    setTargetProductEdit(item);
    setTempCategory(item.category || CONSTANTS.CATEGORIES.STOCK[0]);
    setShowEditCategoryModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!targetProductEdit || !user) return;
    setIsProcessing(true);
    try {
      const batchWriter = writeBatch(dbInstance);
      targetProductEdit.batches.forEach(b => {
            const docRef = doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches', b.id);
            batchWriter.update(docRef, { category: tempCategory });
      });

      await batchWriter.commit();
      showToast(`อัปเดตหมวดหมู่ "${targetProductEdit.name}" เรียบร้อย`, "success");
      setShowEditCategoryModal(false);
      setTargetProductEdit(null);
    } catch (e) {
      showToast("เกิดข้อผิดพลาดในการอัปเดต", "error");
    }
    setIsProcessing(false);
  };

  const handleRecalculateStock = async () => {
    if (!window.confirm('ยืนยันการดึงข้อมูลประวัติการขายทั้งหมดมาคำนวณตัดสต็อก (FIFO) ใหม่?')) return;
    setIsProcessing(true);
    try {
      // รีเซ็ตยอดขายของทุกล็อตให้เป็น 0 บนหน่วยความจำก่อน
      let localBatches = stockBatches.map(b => ({ ...b, sold: 0 }));
      
      // ดึงประวัติรายรับทั้งหมดและเรียงจากเก่าไปใหม่
      const incomeTrans = transactions.filter(t => t.type === 'income').sort((a, b) => normalizeDate(a.date) - normalizeDate(b.date));

      // คำนวณหักลบ FIFO ใหม่ทั้งหมด
      incomeTrans.forEach(trans => {
        (trans.items || []).forEach(item => {
          let needed = Number(item.qty);
          if (needed <= 0) return;
          
          const targetBatches = localBatches
            .filter(b => {
              const bSku = String(b.sku || '').trim().toLowerCase();
              const iSku = String(item.sku || '').trim().toLowerCase();
              const bName = String(b.productName || '').trim().toLowerCase();
              const iName = String(item.desc || '').trim().toLowerCase();
              return (iSku !== '-' && iSku !== '' && bSku === iSku) || (bName === iName);
            })
            .sort((a,b) => normalizeDate(a.date) - normalizeDate(b.date));

          for (let i = 0; i < targetBatches.length; i++) {
            if (needed <= 0) break;
            const b = targetBatches[i];
            const remaining = Number(b.quantity) - Number(b.sold);
            if (remaining > 0) {
              const take = Math.min(needed, remaining);
              b.sold += take;
              needed -= take;
            }
          }
        });
      });

      // บันทึกยอดที่คำนวณใหม่ลง Firestore
      let opsCount = 0;
      let currentBatch = writeBatch(dbInstance);
      for (const lb of localBatches) {
        const docRef = doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches', lb.id);
        currentBatch.update(docRef, { sold: lb.sold });
        opsCount++;
        // ป้องกันการ commit เกินขีดจำกัดของ Firebase Batch (500 ops)
        if (opsCount >= 400) {
          await currentBatch.commit();
          currentBatch = writeBatch(dbInstance);
          opsCount = 0;
        }
      }
      if (opsCount > 0) {
        await currentBatch.commit();
      }
      showToast('ซิงค์และดึงข้อมูลคำนวณสต็อกใหม่เรียบร้อยแล้ว', 'success');
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการคำนวณสต็อก', 'error');
    }
    setIsProcessing(false);
  };

  const handleStockImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const processFile = (f) => {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const dataBuffer = new Uint8Array(evt.target.result);
                const wb = window.XLSX.read(dataBuffer, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const jsonData = window.XLSX.utils.sheet_to_json(ws);
                const batch = writeBatch(dbInstance);
                let count = 0;

                const findInRow = (row, keywords) => {
                  const keys = Object.keys(row);
                  const cleanKws = keywords.map(kw => kw.toString().replace(/\s/g, '').toLowerCase());
                  
                  let foundKey = keys.find(k => {
                    const cleanKey = k.toString().replace(/\s/g, '').toLowerCase();
                    return cleanKws.some(ckw => cleanKey === ckw);
                  });

                  if (!foundKey) {
                      foundKey = keys.find(k => {
                        const cleanKey = k.toString().replace(/\s/g, '').toLowerCase();
                        return cleanKws.some(ckw => cleanKey.includes(ckw) || ckw.includes(cleanKey));
                      });
                  }
                  return foundKey ? row[foundKey] : undefined;
                };

                jsonData.forEach((row) => {
                    const name = findInRow(row, ['ชื่อสินค้า', 'productname', 'name']);
                    const skuInput = findInRow(row, ['Product SKU', 'เลข SKU', 'รหัสตัวเลือกสินค้า', 'sku', 'Seller SKU']);
                    const priceVal = findInRow(row, ['ราคาขาย', 'ราคา']);
                    const qtyVal = findInRow(row, ['จำนวน', 'คงเหลือ', 'quantity', 'qty']);
                    
                    const qty = (qtyVal !== undefined && qtyVal !== "") ? Number(qtyVal) : 0; 
                    const sellPrice = (priceVal !== undefined && priceVal !== "") ? Number(priceVal) : 0;
                    const finalSku = (skuInput && skuInput.toString().trim() !== "") ? String(skuInput).trim() : "0";

                    const dateVal = findInRow(row, ['วันที่', 'date']);
                    
                    if (name && name.toString().trim() !== "") {
                        const date = normalizeDate(dateVal) || new Date();
                        const newRef = doc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches'));
                        
                        batch.set(newRef, { 
                          productName: String(name).trim(), 
                          sku: finalSku, 
                          quantity: qty, 
                          costPerUnit: 0, 
                          sellPrice: sellPrice, 
                          date: date, 
                          sold: 0, 
                          userId: user.uid, 
                          createdAt: serverTimestamp(), 
                          category: 'Imported',
                          paymentStatus: 'paid'
                        });
                        count++;
                    }
                });

                if (count > 0) {
                    await batch.commit();
                    showToast(`นำเข้าคลังสินค้าสำเร็จ ${count} รายการ`, "success");
                } else {
                    showToast("ไม่พบข้อมูลสินค้าที่ถูกต้องในไฟล์ (โปรดระบุคอลัมน์ 'ชื่อสินค้า')", "error");
                }
            } catch (error) { 
                console.error("Import Error:", error);
                showToast("เกิดข้อผิดพลาดในการนำเข้าไฟล์", "error"); 
            }
            setIsProcessing(false);
            if (importFileInputRef.current) importFileInputRef.current.value = '';
        };
        reader.readAsArrayBuffer(f);
    };

    if (!window.XLSX) {
        setIsProcessing(true);
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        script.onload = () => processFile(file);
        document.body.appendChild(script);
    } else { 
        processFile(file); 
    }
  };

  const handleAddStock = async (e) => {
    if (e) e.preventDefault();
    if (!user || !newStock.productName) {
      showToast("กรุณาระบุชื่อสินค้า", "error");
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const finalSKU = newStock.skuManual || generateAutoSKU();
      const quantityNum = Number(newStock.quantity) || 0;
      
      const costPerUnitNum = Number(newStock.costPerUnit) || 0;
      const sellPriceNum = Number(newStock.sellPrice) || 0;
      const totalCost = quantityNum * costPerUnitNum;

      const batchData = { 
        productName: newStock.productName.trim(), 
        sku: finalSKU.trim(), 
        category: newStock.category, 
        quantity: quantityNum, 
        costPerUnit: costPerUnitNum, 
        sellPrice: sellPriceNum, 
        date: normalizeDate(newStock.date), 
        sold: 0, 
        userId: user.uid, 
        createdAt: serverTimestamp(),
        paymentStatus: newStock.paymentStatus || 'paid'
      };

      const stockRef = await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches'), batchData);
      
      if (totalCost > 0) {
        // --- Generate System Doc ID for Stock Expense ---
        const sysDocId = generateNextDocId(transactions.filter(t => t.type === 'expense'), 'COG-', 'sysDocId');

        await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'transactions_expense'), { 
          sysDocId,
          type: 'expense', 
          category: 'ต้นทุนสินค้า', 
          description: `ซื้อสต็อก: ${newStock.productName}`, 
          total: totalCost, 
          date: normalizeDate(newStock.date), 
          userId: user.uid, 
          createdAt: serverTimestamp(), 
          isFromInventory: true,
          status: newStock.paymentStatus === 'paid' ? 'paid' : 'unpaid',
          linkedLotId: stockRef.id
        });
      }

      showToast("บันทึกสินค้าใหม่สำเร็จ", "success");
      setShowAddStockModal(false);
      setNewStock({ productName: '', skuManual: '', category: CONSTANTS.CATEGORIES.STOCK[0], quantity: '', costPerUnit: 0, sellPrice: 0, date: formatDateISO(new Date()), paymentStatus: 'paid' });
    } catch (e) { showToast("บันทึกไม่สำเร็จ", "error"); }
    setIsProcessing(false);
  };

  const handleDeleteInventory = async (e) => {
    if (!deleteStockConfirm || !user) return;
    setIsProcessing(true);
    try {
      const batchWriter = writeBatch(dbInstance);
      const expenseIdsToConsider = new Set();

      deleteStockConfirm.batches.forEach(b => {
        const docRef = doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches', b.id);
        batchWriter.delete(docRef);
        if (b.parentExpenseId) expenseIdsToConsider.add(b.parentExpenseId);
      });

      expenseIdsToConsider.forEach(expId => {
          const expRef = doc(dbInstance, 'artifacts', appId, 'public', 'data', 'transactions_expense', expId);
          batchWriter.delete(expRef);
      });

      await batchWriter.commit();
      showToast(`ลบ "${deleteStockConfirm.name}" and ข้อมูลที่เกี่ยวข้องเรียบร้อย`, "success");
      setDeleteStockConfirm(null);
    } catch (e) { showToast("ลบไม่สำเร็จ", "error"); }
    setIsProcessing(false);
  };

  const handleDeleteBatch = async () => {
    if (!deleteBatchConfirm || !user) return;
    setIsProcessing(true);
    try {
      const batchWriter = writeBatch(dbInstance);
      
      batchWriter.delete(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches', deleteBatchConfirm.id));
      
      if (deleteBatchConfirm.parentExpenseId) {
          batchWriter.delete(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'transactions_expense', deleteBatchConfirm.parentExpenseId));
      }

      await batchWriter.commit();
      showToast("ลบรายการ Lot and ข้อมูลรายจ่ายที่เกี่ยวข้องสำเร็จ", "success");
      setDeleteBatchConfirm(null);
      
      // If we deleted the only batch we were looking at, close history view
      if (viewHistory && viewHistory.batches.length <= 1) setViewHistory(null);
      else if (viewHistory) {
          // Update viewHistory local state to reflect deletion
          setViewHistory({
              ...viewHistory,
              batches: viewHistory.batches.filter(b => b.id !== deleteBatchConfirm.id)
          });
      }
    } catch (e) { showToast("ลบไม่สำเร็จ", "error"); }
    setIsProcessing(false);
  };

  const inventory = useMemo(() => {
    const map = {};
    stockBatches.forEach(batch => {
      const nameKey = batch.productName || 'ไม่ระบุชื่อสินค้า';
      const skuKey = (batch.sku && batch.sku !== '-') ? batch.sku : '';
      const groupKey = skuKey ? `${skuKey}::${nameKey}` : nameKey;

      if (!map[groupKey]) { 
          map[groupKey] = { 
              name: nameKey, 
              sku: batch.sku || '-', 
              totalQty: 0, 
              totalValue: 0, 
              totalPotentialProfit: 0,
              batches: [], 
              category: batch.category || 'ทั่วไป' 
          }; 
      }
      
      const remaining = Number(batch.quantity) - Number(batch.sold || 0);
      const costPerUnit = Number(batch.costPerUnit || 0);
      const sellPrice = Number(batch.sellPrice || 0);
      const profitPerUnit = sellPrice - costPerUnit;

      map[groupKey].totalQty += remaining;
      map[groupKey].totalValue += (Math.max(0, remaining) * costPerUnit);
      map[groupKey].totalPotentialProfit += (Math.max(0, remaining) * profitPerUnit);
      map[groupKey].batches.push({ ...batch, remaining });
    });

    return Object.values(map)
      .filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          item.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a,b) => b.totalQty - a.totalQty);
  }, [stockBatches, searchTerm]);

  return (
    <div className="space-y-6 animate-fadeIn font-sarabun text-left w-full h-full pb-20">
      <div className="flex justify-between items-center flex-wrap gap-4 text-left">
        <h3 className="text-2xl font-bold flex items-center gap-2 text-left text-slate-800"><Box className="text-indigo-600"/> คลังสินค้า & มาร์จิ้น (Performance)</h3>
        <div className="flex items-center gap-2 text-left">
          <div className="relative w-64 text-left">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
            <input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800" placeholder="ค้นชื่อสินค้า หรือ SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
          </div>
          <button onClick={handleRecalculateStock} disabled={isProcessing} className="bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all text-center" title="ดึงข้อมูลประวัติการขายมาคำนวณยอดคงเหลือใหม่">
            {isProcessing ? <Loader className="animate-spin" size={18}/> : <RefreshCw size={18}/>} ซิงค์ข้อมูลสต็อก
          </button>
          <input type="file" ref={importFileInputRef} hidden accept=".xlsx, .xls" onChange={handleStockImport} />
          <button onClick={() => importFileInputRef.current.click()} disabled={isProcessing} className="bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all text-center">
            {isProcessing ? <Loader className="animate-spin" size={18}/> : <FileSpreadsheet size={18}/>} Import Excel
          </button>
          <button onClick={() => setShowAddStockModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all text-center">
            <Plus size={18}/> เพิ่มล็อตซื้อเข้า
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="col-span-2 bg-white rounded-[40px] border shadow-sm overflow-hidden flex flex-col h-[650px] text-left">
          <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center text-left">
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-widest text-left">Stock Performance Table</h4>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">{inventory.length} SKUs Active</span>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar text-left">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-400 text-[10px] font-bold uppercase sticky top-0 border-b z-10 text-left">
                <tr>
                    <th className="p-5 text-left">Product / SKU</th>
                    <th className="p-5 text-right">Avg Cost</th>
                    <th className="p-5 text-right">Sell Price</th>
                    <th className="p-5 text-center">Margin (%)</th>
                    <th className="p-5 text-right">Qty</th>
                    <th className="p-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-left">
                {inventory.map((item, idx) => {
                    const avgCost = item.totalQty > 0 ? item.totalValue / item.totalQty : 0;
                    const currentSellPrice = item.batches[item.batches.length - 1]?.sellPrice || 0;
                    const margin = currentSellPrice > 0 ? ((currentSellPrice - avgCost) / currentSellPrice) * 100 : 0;
                    
                    return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors cursor-pointer group text-left">
                            <td className="p-5 text-left" onClick={() => setViewHistory(item)}>
                                <div className="flex items-center gap-2">
                                    {margin > 30 && <Star size={14} className="text-amber-400 fill-amber-400"/>}
                                    <div>
                                        <p className="text-[10px] font-mono text-indigo-500 font-bold mb-0.5 text-left">{item.sku}</p>
                                        <p className="font-bold text-slate-800 text-left">{item.name}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase text-left">{item.category}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-5 text-right font-bold text-slate-500 text-right">{formatCurrency(avgCost)}</td>
                            <td className="p-5 text-right font-black text-indigo-600 text-right">{formatCurrency(currentSellPrice)}</td>
                            <td className="p-5 text-center">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${margin > 20 ? 'bg-emerald-100 text-emerald-700' : margin > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {margin.toFixed(1)}%
                                </span>
                            </td>
                            <td className="p-5 text-right font-black text-slate-900 text-right">{item.totalQty.toLocaleString()}</td>
                            <td className="p-5 text-center">
                                <div className="flex justify-center gap-2 text-center">
                                    <button onClick={(e) => { e.stopPropagation(); setViewHistory(item); }} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 text-center" title="ดูประวัติราคาต้นทุน"><History size={16}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); openEditCategory(item); }} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-amber-600 text-center" title="แก้ไขหมวดหมู่"><Tag size={16}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteStockConfirm(item); }} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-rose-600 text-center" title="ลบสินค้า"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-6 text-left">
            <div className="bg-slate-900 p-8 rounded-[40px] shadow-xl text-white relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-right"><ProfitIcon size={120}/></div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 text-left">Potential Profit (Inventory Value)</p>
                <h2 className="text-4xl font-black mb-2 text-left">{formatCurrency(inventory.reduce((s,i)=>s+i.totalPotentialProfit, 0))}</h2>
                <p className="text-xs text-slate-500 text-left">กำไรคาดการณ์ทั้งหมด หากขายสินค้าที่มีอยู่ได้ในราคาปัจจุบัน</p>
                <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4 text-left">
                    <div className="text-left"><p className="text-[10px] text-slate-500 uppercase font-bold text-left">Asset Value (Cost)</p><p className="text-xl font-bold text-left">{formatCurrency(inventory.reduce((s,i)=>s+i.totalValue, 0))}</p></div>
                    <div className="text-left"><p className="text-[10px] text-slate-500 uppercase font-bold text-left">Total Stock Qty</p><p className="text-xl font-bold text-left">{inventory.reduce((s,i)=>s+i.totalQty, 0).toLocaleString()}</p></div>
                </div>
            </div>
            
            <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 text-left">
                <div className="flex items-center gap-3 mb-4 text-left">
                    <div className="p-2 bg-white rounded-xl text-amber-500 shadow-sm text-center"><HandCoins size={20}/></div>
                    <h4 className="font-black text-amber-800 text-sm uppercase tracking-wider text-left">Supplier Credit (ค้างจ่าย)</h4>
                </div>
                <p className="text-xs text-amber-700/70 font-medium mb-1 text-left">ยอดค้างชำระเจ้าหนี้การค้า</p>
                <p className="text-2xl font-black text-amber-800 text-left">
                    {formatCurrency(stockBatches.filter(b => b.paymentStatus === 'credit').reduce((s,b) => s + (Number(b.quantity) * Number(b.costPerUnit)), 0))}
                </p>
            </div>
        </div>
      </div>

      {showAddStockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[600] flex items-center justify-center p-4 text-left">
           <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh] text-left">
              <div className="p-6 border-b flex justify-between items-center text-left"><h3 className="text-xl font-black text-slate-800 flex items-center gap-2 text-left"><PlusCircle className="text-indigo-600"/> ลงรายการสั่งซื้อเข้าคลัง</h3><button onClick={() => setShowAddStockModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-center"><X/></button></div>
              <form onSubmit={handleAddStock} className="p-8 space-y-6 overflow-y-auto text-left">
                 <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-400 text-left">ชื่อสินค้า</label>
                    <input required value={newStock.productName} onChange={e=>setNewStock({...newStock, productName: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border-0 font-bold outline-none text-slate-800" placeholder="ระบุชื่อสินค้า..." />
                 </div>
                 <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-bold uppercase text-slate-400 text-left">เลข SKU / บาร์โค้ด</label>
                        <input value={newStock.skuManual} onChange={e=>setNewStock({...newStock, skuManual: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border-0 font-mono text-sm font-bold outline-none text-indigo-600" placeholder="ระบุ SKU..." />
                    </div>
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-bold uppercase text-slate-400 text-left">ประเภทการชำระ</label>
                        <select value={newStock.paymentStatus} onChange={e=>setNewStock({...newStock, paymentStatus: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border-0 font-bold outline-none text-slate-700">
                            <option value="paid">จ่ายสด / โอนทันที</option>
                            <option value="credit">เครดิต (ค้างจ่าย)</option>
                        </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-4 text-left">
                    <div className="space-y-2 bg-emerald-50 p-4 rounded-3xl border border-emerald-100 text-left">
                        <label className="text-[10px] font-bold uppercase text-emerald-600 text-left">จำนวนรับเข้า</label>
                        <input type="number" value={newStock.quantity} onChange={e=>setNewStock({...newStock, quantity: e.target.value})} className="w-full bg-white p-3 rounded-xl border-0 text-lg font-black text-center text-emerald-700 outline-none" placeholder="0" />
                    </div>
                    <div className="space-y-2 bg-indigo-50 p-4 rounded-3xl border border-indigo-100 text-left">
                        <label className="text-[10px] font-bold uppercase text-indigo-600 text-left">ราคาต้นทุน/หน่วย</label>
                        <input type="number" step="0.01" value={newStock.costPerUnit} onChange={e=>setNewStock({...newStock, costPerUnit: e.target.value})} className="w-full bg-white p-3 rounded-xl border-0 text-lg font-black text-center text-indigo-700 outline-none" placeholder="0.00" />
                    </div>
                    <div className="space-y-2 bg-rose-50 p-4 rounded-3xl border border-rose-100 text-left">
                        <label className="text-[10px] font-bold uppercase text-rose-600 text-left">ราคาขาย/หน่วย</label>
                        <input type="number" step="0.01" value={newStock.sellPrice} onChange={e=>setNewStock({...newStock, sellPrice: e.target.value})} className="w-full bg-white p-3 rounded-xl border-0 text-lg font-black text-center text-rose-700 outline-none" placeholder="0.00" />
                    </div>
                 </div>
                 <button type="submit" disabled={isProcessing} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 text-center disabled:opacity-50">
                    {isProcessing ? <Loader className="animate-spin" size={24}/> : <Save size={24}/>} บันทึกสต็อกเข้า
                 </button>
              </form>
           </div>
        </div>
      )}
      
      {viewHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[40px] w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 text-left">
            <div className="p-6 border-b flex justify-between items-center text-left">
                <div className="text-left">
                    <h3 className="text-xl font-bold text-slate-800 text-left">Cost Tracking: {viewHistory.name}</h3>
                    <p className="text-xs text-slate-400 text-left">ประวัติราคาต้นทุนและกำไรของสินค้าแต่ละล็อต</p>
                </div>
                <button onClick={() => setViewHistory(null)} className="p-2 hover:bg-slate-100 rounded-full text-center"><X/></button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4 text-left">
              {viewHistory.batches
                .filter(b => b.quantity > 0) 
                .sort(sortNewestFirst)
                .map((b, i) => {
                    const isLowest = b.costPerUnit === Math.min(...viewHistory.batches.map(v => v.costPerUnit));
                    const margin = b.sellPrice > 0 ? ((b.sellPrice - b.costPerUnit) / b.sellPrice) * 100 : 0;
                    
                    return (
                        <div key={i} className={`p-5 rounded-3xl border transition-all ${isLowest ? 'border-emerald-200 bg-emerald-50/50 shadow-sm' : 'border-slate-100 bg-slate-50/50'}`}>
                            <div className="flex justify-between items-start text-left">
                                <div className="space-y-1 text-left">
                                    <div className="flex items-center gap-2 text-left">
                                        <p className="text-[10px] font-bold text-indigo-600 uppercase text-left">Lot {i+1} - รับเข้า {formatDate(b.date)}</p>
                                        {isLowest && <span className="text-[8px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black uppercase">Best Cost</span>}
                                        {b.paymentStatus === 'credit' && <span className="text-[8px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Credit</span>}
                                    </div>
                                    <p className="text-xl font-black text-slate-900 text-left">{formatCurrency(b.costPerUnit)} <span className="text-xs font-bold text-slate-400">/ หน่วย</span></p>
                                    <div className="flex items-center gap-4 text-left">
                                        <p className="text-[10px] text-slate-500 font-bold">ราคาขาย: {formatCurrency(b.sellPrice || 0)}</p>
                                        <p className={`text-[10px] font-black ${margin > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Margin: {margin.toFixed(1)}%</p>
                                    </div>
                                </div>
                                <div className="text-right text-right">
                                    <p className="text-[10px] text-slate-400 font-black uppercase text-right">คงเหลือ / ทั้งหมด</p>
                                    <p className="text-xl font-black text-slate-900 text-right">{b.remaining} <span className="text-slate-300">/ {b.quantity}</span></p>
                                    <button onClick={() => setDeleteBatchConfirm(b)} className="mt-2 p-2 text-rose-300 hover:text-rose-600 transition-all text-center"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="p-6 border-t bg-slate-50 rounded-b-[40px] text-center"><button onClick={()=>setViewHistory(null)} className="w-full py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 text-center">ปิด</button></div>
          </div>
        </div>
      )}

      {/* Popup ยืนยันการลบทั้งสินค้า (Inventory level) */}
      {deleteStockConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-center">
              <Trash2 size={32}/>
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-800 text-center">ลบข้อมูลสินค้าทั้งหมด?</h3>
            <p className="text-xs text-slate-400 mb-6 text-center leading-relaxed">
              ระบบจะลบข้อมูล <b>"{deleteStockConfirm.name}"</b> ออกจากคลังสินค้าทุกล็อต<br/>
              และลบรายการต้นทางที่เชื่อมโยงกันทั้งหมด (รายจ่ายสต็อก)<br/>
              <span className="text-rose-600 font-bold underline">การกระทำนี้ไม่สามารถกู้คืนได้</span>
            </p>
            <div className="flex gap-3 text-center">
              <button onClick={() => setDeleteStockConfirm(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button>
              <button onClick={handleDeleteInventory} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg text-center">ยืนยันลบ</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup ยืนยันการลบล็อตสินค้า (Batch level - Cost Tracking view) */}
      {deleteBatchConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-center">
              <Trash2 size={32}/>
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-800 text-center">ลบล็อตสินค้า (Batch)?</h3>
            <p className="text-xs text-slate-400 mb-6 text-center leading-relaxed">
              ยืนยันการลบล็อตสินค้าวันที่ <b>{formatDate(deleteBatchConfirm.date)}</b><br/>
              จำนวนคงเหลือ: <b>{deleteBatchConfirm.remaining}</b> หน่วย<br/>
              <span className="text-rose-600 font-bold underline">รายการรายจ่ายที่เชื่อมโยงจะถูกลบออกด้วย</span>
            </p>
            <div className="flex gap-3 text-center">
              <button onClick={() => setDeleteBatchConfirm(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button>
              <button onClick={handleDeleteBatch} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg text-center">ยืนยันลบ</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal แก้ไขหมวดหมู่สินค้า */}
      {showEditCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[32px] p-8 max-md w-full shadow-2xl animate-in zoom-in-95 text-left">
            <div className="flex justify-between items-center mb-6 text-left">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 text-left"><Tag className="text-indigo-600"/> แก้ไขหมวดหมู่</h3>
              <button onClick={()=>setShowEditCategoryModal(false)} className="text-center"><X/></button>
            </div>
            <div className="space-y-4 text-left">
              <p className="text-xs text-slate-400 font-bold uppercase text-left">Product: {targetProductEdit?.name}</p>
              <select 
                value={tempCategory} 
                onChange={e=>setTempCategory(e.target.value)}
                className="w-full bg-slate-50 p-4 rounded-2xl border-0 font-bold outline-none text-slate-800 text-left"
              >
                {CONSTANTS.CATEGORIES.STOCK.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="Imported">Imported</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
              <div className="flex gap-3 pt-4 text-center">
                <button onClick={() => setShowEditCategoryModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button>
                <button onClick={handleUpdateCategory} disabled={isProcessing} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 text-center">
                  {isProcessing ? <Loader className="animate-spin" size={16}/> : <Save size={16}/>} บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaxReports({ transactions, invoices, stockBatches, showToast, appId, user }) {
  const [reportTab, setReportTab] = useState('sales');
  const [startDate, setStartDate] = useState(formatDateISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [endDate, setEndDate] = useState(formatDateISO(new Date()));
  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [sellerInfo, setSellerInfo] = useState({});
  const [showEditSeller, setShowEditSeller] = useState(false);
  const [tempSellerData, setTempSellerData] = useState({});
  const [selectedBranch, setSelectedBranch] = useState('all');

  const [expenseMode, setExpenseMode] = useState('standard');
  const [pitDeductions, setPitDeductions] = useState({ spouse: false, children: 0, parents: 0, lifeInsurance: 0, socialSecurity: 0, otherDeductions: 0 });

  useEffect(() => { 
    try { 
      const savedInfo = JSON.parse(localStorage.getItem('merchant_seller_info') || '{}'); 
      setSellerInfo(savedInfo); 
      const savedDeductions = JSON.parse(localStorage.getItem('merchant_pit_deductions'));
      if (savedDeductions) setPitDeductions(savedDeductions);
      const savedExpMode = localStorage.getItem('merchant_pit_exp_mode');
      if (savedExpMode) setExpenseMode(savedExpMode);
    } catch (e) { setSellerInfo({}); } 
  }, []);

  useEffect(() => {
    localStorage.setItem('merchant_pit_deductions', JSON.stringify(pitDeductions));
    localStorage.setItem('merchant_pit_exp_mode', expenseMode);
  }, [pitDeductions, expenseMode]);

  const handleSaveSeller = (e) => { 
    e.preventDefault(); 
    localStorage.setItem('merchant_seller_info', JSON.stringify(tempSellerData)); 
    setSellerInfo(tempSellerData); 
    setShowEditSeller(false); 
    if (showToast) showToast("บันทึกเรียบร้อย", "success"); 
  };

  const openEditModal = () => { 
    setTempSellerData(sellerInfo); 
    setShowEditSeller(true); 
  };

  const setQuickRange = (range) => {
    const now = new Date();
    let start, end = new Date();
    switch(range) {
        case 'today': start = new Date(); break;
        case 'thisMonth': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'lastMonth': 
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1); 
            end = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        case '3months': start = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
        case 'year': start = new Date(now.getFullYear(), 0, 1); break;
        default: return;
    }
    setStartDate(formatDateISO(start));
    setEndDate(formatDateISO(end));
  };

  const handleDeleteRecord = async () => {
    if (!deleteConfirm || !user) return;
    try {
      const batchWriter = writeBatch(dbInstance);
      
      if (deleteConfirm.sourceType === 'batch') {
          batchWriter.delete(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches', deleteConfirm.id));
          const batchData = stockBatches.find(b => b.id === deleteConfirm.id);
          if (batchData && batchData.parentExpenseId) {
              batchWriter.delete(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'transactions_expense', batchData.parentExpenseId));
          }
      } else {
          const coll = deleteConfirm.sourceType === 'income' ? 'transactions_income' : 'transactions_expense';
          batchWriter.delete(doc(dbInstance, 'artifacts', appId, 'public', 'data', coll, deleteConfirm.id));
          
          if (deleteConfirm.sourceType === 'expense') {
              stockBatches.filter(b => b.parentExpenseId === deleteConfirm.id).forEach(b => {
                  batchWriter.delete(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches', b.id));
              });
          } else if (deleteConfirm.sourceType === 'income') {
              const saleDoc = transactions.find(t => t.id === deleteConfirm.id);
              if (saleDoc && saleDoc.items) {
                  for (const item of saleDoc.items) {
                      let toReturn = Number(item.qty);
                      const affectedLots = stockBatches
                        .filter(b => (String(b.sku).trim().toLowerCase() === String(item.sku).trim().toLowerCase() || String(b.productName).trim().toLowerCase() === String(item.desc).trim().toLowerCase()) && Number(b.sold) > 0)
                        .sort(sortNewestFirst);

                      for (const lot of affectedLots) {
                          if (toReturn <= 0) break;
                          const canTakeBack = Math.min(toReturn, Number(lot.sold));
                          batchWriter.update(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches', lot.id), { sold: increment(-canTakeBack) });
                          toReturn -= canTakeBack;
                      }
                  }
              }
          }
      }

      await batchWriter.commit();
      showToast("ลบข้อมูล and รายการเชื่อมโยงสำเร็จ", "success");
      setDeleteConfirm(null);
    } catch (e) { showToast("ลบไม่สำเร็จ", "error"); }
  };

  const getThaiMonthYear = (dateStr) => {
    const d = normalizeDate(dateStr);
    if (!d) return "";
    return new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(d);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const d = normalizeDate(inv.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      const dateMatch = d >= start && d <= end;
      const branchMatch = selectedBranch === 'all' || (inv.branch || '00000') === selectedBranch;
      return dateMatch && branchMatch;
    }).sort(sortNewestFirst);
  }, [invoices, startDate, endDate, selectedBranch]);

  const filteredExpenses = useMemo(() => {
    // 1. ดึงรายการรายจ่ายปกติที่ผู้ใช้บันทึก
    const normalExpenses = transactions.filter(t => {
      const d = normalizeDate(t.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      const dateMatch = d >= start && d <= end;
      const branchMatch = selectedBranch === 'all' || selectedBranch === '00000';
      return t.type === 'expense' && dateMatch && branchMatch;
    });

    // 2. ดึงรายการรายรับที่มี "ค่าธรรมเนียมแพลตฟอร์ม" เพื่อแปลงเป็นภาษีซื้ออัตโนมัติ
    const incomeWithFees = transactions.filter(t => {
      const d = normalizeDate(t.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      const dateMatch = d >= start && d <= end;
      const branchMatch = selectedBranch === 'all' || selectedBranch === '00000';
      return t.type === 'income' && dateMatch && branchMatch && (Number(t.platformFee) > 0);
    });

    // 3. สร้าง Virtual Record สำหรับค่าธรรมเนียมแพลตฟอร์ม
    const autoPlatformFees = incomeWithFees.map(t => ({
        id: `auto-fee-${t.id}`,
        sysDocId: t.sysDocId ? `FEE-${t.sysDocId.replace('INC-', '')}` : 'AUTO-FEE',
        type: 'expense',
        date: t.date,
        taxInvoiceNo: t.orderId ? `FEE-${t.orderId}` : 'AUTO-FEE',
        partnerName: t.channel ? `Platform (${t.channel})` : 'Platform',
        partnerTaxId: '-', // แจ้งให้ทราบว่าเป็น Auto Generate
        partnerBranch: '00000',
        description: `ค่าธรรมเนียมแพลตฟอร์ม ออเดอร์ ${t.orderId || '-'}`,
        total: Number(t.platformFee),
        couponDiscount: 0,
        cashCoupon: 0,
        vatType: 'included', // ค่าธรรมเนียม Platform รวม VAT 7% มาแล้วเสมอ
        isNonCreditableVat: false
    }));

    // นำทั้ง 2 ส่วนมารวมกันและเรียงลำดับตามวันที่
    return [...normalExpenses, ...autoPlatformFees].sort(sortNewestFirst);
  }, [transactions, startDate, endDate, selectedBranch]);

  const filteredMovement = useMemo(() => {
    const movements = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    stockBatches.forEach(b => { 
      const d = normalizeDate(b.date); 
      if (d >= start && d <= end && b.quantity > 0) { 
        const parentExp = transactions.find(t => t.id === b.parentExpenseId);
        const refIdToUse = parentExp?.sysDocId || b.parentExpenseId || 'LOT-IN';
        movements.push({ 
          id: b.id,
          sourceType: 'batch',
          date: d, 
          sku: b.sku || '-', 
          refId: refIdToUse, 
          name: b.productName, 
          type: 'IN (รับเข้า)', 
          qty: Number(b.quantity), 
          price: Number(b.costPerUnit),
          total: Number(b.quantity) * Number(b.costPerUnit)
        }); 
      } 
    });

    transactions.filter(t => t.type === 'income').forEach(t => { 
      const d = normalizeDate(t.date); 
      if (d >= start && d <= end) { 
        (t.items || []).forEach(item => { 
          movements.push({ 
            id: t.id,
            sourceType: 'income',
            date: d, 
            sku: String(item.sku || '-').trim(), 
            refId: t.sysDocId || t.orderId || '-', 
            name: String(item.desc || item.description || t.description).trim(), 
            type: 'OUT (จ่ายออก)', 
            qty: Number(item.qty), 
            price: Number(item.sellPrice || item.price || 0),
            total: Number(item.qty) * Number(item.sellPrice || item.price || 0)
          }); 
        }); 
      } 
    });

    // 1. เรียงตามวันที่ (เก่าไปใหม่) เพื่อคำนวณยอดยกไป
    movements.sort((a, b) => a.date - b.date);

    // 2. คำนวณยอดคงเหลือแยกตาม SKU (ฟอร์มรายงานสินค้าและวัตถุดิบสรรพากร)
    const balances = {};
    const enrichedMovements = movements.map(m => {
        if (!balances[m.sku]) balances[m.sku] = { qty: 0, amount: 0 };
        
        let receiveQty = 0, receivePrice = 0, receiveTotal = 0;
        let issueQty = 0, issuePrice = 0, issueTotal = 0;

        if (m.type.includes('IN')) {
            receiveQty = m.qty;
            receivePrice = m.price;
            receiveTotal = m.total;
            balances[m.sku].qty += receiveQty;
            balances[m.sku].amount += receiveTotal;
        } else {
            issueQty = m.qty;
            issuePrice = m.price; // ราคาขาย
            
            // คำนวณต้นทุนขาย (Cost of Issue) แบบ Average Cost สำหรับรายงาน
            const avgCost = balances[m.sku].qty > 0 ? balances[m.sku].amount / balances[m.sku].qty : 0;
            issueTotal = issueQty * avgCost; // ใช้ต้นทุนแทนราคาขายในช่อง "จ่ายรวม" สำหรับคุมสต็อก
            
            balances[m.sku].qty -= issueQty;
            balances[m.sku].amount -= issueTotal;
        }

        return {
            ...m,
            receiveQty, receivePrice, receiveTotal,
            issueQty, issuePrice, issueTotal, // issueTotal คือต้นทุน
            balanceQty: balances[m.sku].qty,
            balanceTotal: balances[m.sku].amount
        };
    });

    return enrichedMovements.reverse();
  }, [stockBatches, transactions, startDate, endDate]);

  const movementTotals = useMemo(() => {
    return filteredMovement.reduce((acc, m) => ({
        qty: acc.qty + (Number(m.qty) || 0),
        total: acc.total + (Number(m.total) || 0)
    }), { qty: 0, total: 0 });
  }, [filteredMovement]);

  const getExpenseTaxDetails = (row) => {
    const sub = Number(row.total) || 0;
    const disc = Number(row.couponDiscount) || 0; 
    const baseAmt = Math.max(0, sub - disc);
    
    let vat = 0, base = 0, total = 0;
    
    if (row.vatType === 'excluded') {
        vat = row.isNonCreditableVat ? 0 : baseAmt * 0.07;
        base = baseAmt;
        total = baseAmt + (baseAmt * 0.07);
    } else if (row.vatType === 'none') {
        vat = 0;
        base = baseAmt;
        total = baseAmt;
    } else { // included or legacy default
        vat = row.isNonCreditableVat ? 0 : baseAmt * 7 / 107;
        base = row.isNonCreditableVat ? baseAmt : baseAmt * 100 / 107;
        total = baseAmt;
    }
    
    return { base, vat, total };
  };

  const vatAnalysis = useMemo(() => {
    const outputVat = filteredInvoices.reduce((s, inv) => s + ((Number(inv.vat) || 0) * (inv.docType === 'credit_note' ? -1 : 1)), 0);
    const outputBase = filteredInvoices.reduce((s, inv) => s + ((Number(inv.preVat) || 0) * (inv.docType === 'credit_note' ? -1 : 1)), 0);
    const inputVat = filteredExpenses.reduce((s, t) => s + (t.isNonCreditableVat ? 0 : getExpenseTaxDetails(t).vat), 0);
    const inputBase = filteredExpenses.reduce((s, t) => s + (t.isNonCreditableVat ? 0 : getExpenseTaxDetails(t).base), 0);
    return { outputVat, outputBase, inputVat, inputBase, net: outputVat - inputVat };
  }, [filteredInvoices, filteredExpenses]);

  const salesFooter = useMemo(() => {
    return filteredInvoices.reduce((acc, inv) => { 
      const mult = inv.docType === 'credit_note' ? -1 : 1; 
      return { 
        base: acc.base + ((Number(inv.preVat) || 0) * mult), 
        vat: acc.vat + ((Number(inv.vat) || 0) * mult), 
        total: acc.total + ((Number(inv.total) || 0) * mult) 
      }; 
    }, { base: 0, vat: 0, total: 0 });
  }, [filteredInvoices]);

  const purchaseFooter = useMemo(() => {
    return filteredExpenses.reduce((acc, row) => { 
      const taxDetails = getExpenseTaxDetails(row);
      return { base: acc.base + taxDetails.base, vat: acc.vat + taxDetails.vat, total: acc.total + taxDetails.total }; 
    }, { base: 0, vat: 0, total: 0 });
  }, [filteredExpenses]);

  const pitAnalysis = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    let totalIncome = 0;
    let totalWHT = 0;
    let actualExpense = 0;

    transactions.forEach(t => {
        const d = normalizeDate(t.date);
        if (!d || d < start || d > end) return;
        
        if (selectedBranch !== 'all' && (t.branch || '00000') !== selectedBranch && (t.partnerBranch || '00000') !== selectedBranch) return;

        if (t.type === 'income') {
            totalIncome += Number(t.total) || 0;
            totalWHT += Number(t.whtAmount) || 0;
        } else if (t.type === 'expense') {
            actualExpense += Number(t.total) || 0;
        }
    });

    const standardExpense = totalIncome * 0.6;
    const usedExpense = expenseMode === 'standard' ? standardExpense : actualExpense;
    
    let totalDeductions = 60000;
    if (pitDeductions.spouse) totalDeductions += 60000;
    totalDeductions += (Number(pitDeductions.children) || 0) * 30000;
    totalDeductions += (Number(pitDeductions.parents) || 0) * 30000;
    totalDeductions += (Number(pitDeductions.lifeInsurance) || 0);
    totalDeductions += (Number(pitDeductions.socialSecurity) || 0);
    totalDeductions += (Number(pitDeductions.otherDeductions) || 0);

    const netIncome = Math.max(0, totalIncome - usedExpense - totalDeductions);

    let calculatedTax = 0;
    const brackets = [
        { min: 0, max: 150000, rate: 0, cap: 150000 },
        { min: 150000, max: 300000, rate: 0.05, cap: 150000 },
        { min: 300000, max: 500000, rate: 0.10, cap: 200000 },
        { min: 500000, max: 750000, rate: 0.15, cap: 250000 },
        { min: 750000, max: 1000000, rate: 0.20, cap: 250000 },
        { min: 1000000, max: 2000000, rate: 0.25, cap: 1000000 },
        { min: 2000000, max: 5000000, rate: 0.30, cap: 3000000 },
        { min: 5000000, max: Infinity, rate: 0.35, cap: Infinity }
    ];

    const steps = [];
    for (const b of brackets) {
        if (netIncome > b.min) {
            const amountInBracket = Math.min(netIncome - b.min, b.cap);
            const taxForBracket = amountInBracket * b.rate;
            calculatedTax += taxForBracket;
            steps.push({ range: `${formatCurrency(b.min)} - ${b.max === Infinity ? 'ขึ้นไป' : formatCurrency(b.max)}`, rate: `${(b.rate * 100).toFixed(0)}%`, amount: amountInBracket, tax: taxForBracket });
        }
    }

    const actualGrossTax = totalIncome > 120000 ? totalIncome * 0.005 : 0;
    const finalTax = Math.max(calculatedTax, actualGrossTax);
    const isGrossTaxApplied = finalTax === actualGrossTax && actualGrossTax > 0;

    const payableTax = finalTax - totalWHT;

    return { totalIncome, actualExpense, standardExpense, usedExpense, totalDeductions, netIncome, calculatedTax, grossTax: actualGrossTax, finalTax, isGrossTaxApplied, totalWHT, payableTax, steps };
  }, [transactions, startDate, endDate, selectedBranch, expenseMode, pitDeductions]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    if (showToast) showToast("กำลังเตรียมไฟล์...", "success");
    if (!window.XLSX) { 
      const script = document.createElement('script'); 
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; 
      await new Promise((resolve) => { script.onload = resolve; document.body.appendChild(script); }); 
    }
    
    let fileName = ""; 
    let dataRows = [];
    const toFixedNum = (num) => Number(Number(num).toFixed(2));
    
    const headerRows = [ 
      [`รายงาน${reportTab === 'sales' ? 'ภาษีขาย' : reportTab === 'purchase' ? 'ภาษีซื้อ' : 'คลังสินค้า'}`], 
      [`ประจำเดือนภาษี: ${getThaiMonthYear(startDate)}`],
      [`ระหว่างวันที่: ${formatDate(startDate)} ถึง ${formatDate(endDate)}`], 
      [`ชื่อผู้ประกอบการ: ${sellerInfo.sellerName || '-'}`], 
      [`ชื่อสถานประกอบการ: ${sellerInfo.sellerName || '-'}`],
      [`เลขประจำตัวผู้เสียภาษีอากร: ${sellerInfo.sellerTaxId || '-'}  สาขา: ${sellerInfo.sellerBranchId === '00000' ? 'สำนักงานใหญ่' : sellerInfo.sellerBranchId || '00000'}`],
      [`ที่อยู่: ${[sellerInfo.sellerAddress, fmtAddr.sub(sellerInfo.sellerSubDistrict), fmtAddr.dist(sellerInfo.sellerDistrict), fmtAddr.prov(sellerInfo.sellerProvince), sellerInfo.sellerZipCode].filter(Boolean).join(' ')}`],
      [] 
    ];

    if (reportTab === 'sales') {
      fileName = `Sales_Tax_Report_${startDate}.xlsx`;
      const tableHeader = ["ลำดับ", "วันที่", "เลขที่ใบกำกับภาษี", "ชื่อผู้ซื้อสินค้า/ผู้รับบริการ", "เลขผู้เสียภาษี", "สถานประกอบการ", "มูลค่าสินค้า/บริการ", "ภาษีมูลค่าเพิ่ม", "ยอดรวม"];
      const sortedInvoices = [...filteredInvoices].sort(sortOldestFirst);
      const body = sortedInvoices.map((inv, i) => { 
        const mult = inv.docType === 'credit_note' ? -1 : 1; 
        return [ i + 1, formatDate(inv.date), inv.invNo + (inv.docType === 'credit_note' ? " (ใบลดหนี้)" : ""), inv.customerName, inv.taxId || '-', (inv.branch === '00000' || !inv.branch) ? 'สำนักงานใหญ่' : `สาขา ${inv.branch}`, toFixedNum((inv.preVat || 0) * mult), toFixedNum((inv.vat || 0) * mult), toFixedNum((inv.total || 0) * mult) ]; 
      });
      const footer = [ "รวมทั้งสิ้น", "", "", "", "", "", toFixedNum(salesFooter.base), toFixedNum(salesFooter.vat), toFixedNum(salesFooter.total) ];
      dataRows = [...headerRows, tableHeader, ...body, footer];
    } else if (reportTab === 'purchase') {
      fileName = `Purchase_Tax_Report_${startDate}.xlsx`;
      const tableHeader = ["ลำดับ", "วันที่", "เลขระบบ (SYS ID)", "เลขที่ใบกำกับภาษี", "ชื่อผู้ขายสินค้า/ผู้ให้บริการ", "เลขผู้เสียภาษี", "สถานประกอบการ", "มูลค่าสินค้า/บริการ", "ภาษีมูลค่าเพิ่ม", "ยอดรวม"];
      const sortedExpenses = [...filteredExpenses].sort(sortOldestFirst);
      const body = sortedExpenses.map((row, i) => {
        const taxDetails = getExpenseTaxDetails(row);
        return [ i + 1, formatDate(row.date), row.sysDocId || '-', row.taxInvoiceNo || row.orderId || '-', row.partnerName || '-', row.partnerTaxId || '-', (row.partnerBranch === '00000' || !row.partnerBranch) ? 'สำนักงานใหญ่' : `สาขาที่ ${row.partnerBranch}`, toFixedNum(taxDetails.base), toFixedNum(taxDetails.vat), toFixedNum(taxDetails.total) ];
      });
      const footer = [ "รวมทั้งสิ้น", "", "", "", "", "", "", toFixedNum(purchaseFooter.base), toFixedNum(purchaseFooter.vat), toFixedNum(purchaseFooter.total) ];
      dataRows = [...headerRows, tableHeader, ...body, footer];
    } else if (reportTab === 'inventory') {
      fileName = `Stock_Movement_${startDate}.xlsx`;
      const tableHeader = ["วันที่", "อ้างอิง (Ref)", "Product SKU", "รายการสินค้า", "รับ-จำนวน", "รับ-ราคา/หน่วย", "รับ-มูลค่ารวม", "จ่าย-จำนวน", "จ่าย-ต้นทุนรวม", "คงเหลือ-จำนวน", "คงเหลือ-มูลค่ารวม"];
      const sortedMovement = [...filteredMovement].reverse();
      dataRows = [...headerRows, tableHeader, ...sortedMovement.map(m => [
        formatDate(m.date), m.refId, m.sku, m.name, 
        m.receiveQty > 0 ? m.receiveQty : '-', m.receivePrice > 0 ? toFixedNum(m.receivePrice) : '-', m.receiveTotal > 0 ? toFixedNum(m.receiveTotal) : '-',
        m.issueQty > 0 ? m.issueQty : '-', m.issueTotal > 0 ? toFixedNum(m.issueTotal) : '-',
        m.balanceQty, toFixedNum(m.balanceTotal)
      ])];
    }

    try {
      const ws = window.XLSX.utils.aoa_to_sheet(dataRows);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Report");
      window.XLSX.writeFile(wb, fileName);
    } catch (e) { showToast("เกิดข้อผิดพลาดในการส่งออก", "error"); }
    setIsExporting(false);
  };

  const TabBtn = ({ id, label, icon }) => (
    <button onClick={() => setReportTab(id)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${reportTab === id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}>
        {icon} {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-fadeIn text-left font-sarabun w-full h-full pb-10">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-2 border-b pb-4 gap-4 text-left no-print">
        <div className="space-y-1 text-left">
          <h2 className="text-3xl font-black text-slate-800 text-left">Tax & Accounting</h2>
          <p className="text-sm text-slate-400 font-medium text-left">รายงานภาษีซื้อ-ขาย, ทะเบียนคุมสินค้า และสรุป ภ.พ.30</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center no-print">
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl font-bold text-xs shrink-0">
              <Filter size={16}/> รอบระยะเวลา
            </div>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto shrink-0">
                {['today', 'thisMonth', 'lastMonth', '3months', 'year'].map(r => (
                    <button key={r} onClick={() => setQuickRange(r)} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all whitespace-nowrap">
                        {r === 'today' ? 'วันนี้' : r === 'thisMonth' ? 'เดือนนี้' : r === 'lastMonth' ? 'เดือนที่แล้ว' : r === '3months' ? '3 เดือน' : 'ปีนี้'}
                    </button>
                ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shrink-0 w-full xl:w-auto overflow-x-auto">
              <Calendar size={14} className="text-slate-400 ml-2 shrink-0"/>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-transparent border-0 text-xs font-bold outline-none text-slate-700 w-28 cursor-pointer focus:ring-0"/>
              <span className="text-slate-300"><ArrowRight size={12}/></span>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-transparent border-0 text-xs font-bold outline-none text-slate-700 w-28 cursor-pointer focus:ring-0"/>
          </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start gap-6 relative group">
        <button onClick={openEditModal} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors no-print"><Edit size={18} /></button>
        <div className="space-y-3 flex-1 text-left">
           <div className="flex items-center gap-3 text-left">
               <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg"><Store size={24}/></div>
               <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-left">{sellerInfo.sellerName || 'ร้านค้า (ยังไม่ระบุ)'}</h2>
           </div>
           <div className="pl-1 space-y-1 text-left">
              <p className="text-xs text-slate-500 font-medium text-left">ที่อยู่จดทะเบียน: {[sellerInfo.sellerAddress, fmtAddr.sub(sellerInfo.sellerSubDistrict), fmtAddr.dist(sellerInfo.sellerDistrict), fmtAddr.prov(sellerInfo.sellerProvince), sellerInfo.sellerZipCode].filter(Boolean).join(' ')}</p>
              <div className="flex items-center gap-4 pt-2 text-left">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase text-left">TAX Identification Number</span>
                  <p className="text-sm font-black text-indigo-600 tracking-wider text-left">{sellerInfo.sellerTaxId || '-'}</p>
                </div>
                <div className="w-px h-8 bg-slate-100"></div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase text-left">Branch</span>
                  <p className="text-sm font-black text-slate-700 text-left">
                    {sellerInfo.sellerBranchId === '00000' ? 'สำนักงานใหญ่' : `สาขาที่ ${sellerInfo.sellerBranchId || '-'}`}
                    {sellerInfo.sellerBranchName && ` (${sellerInfo.sellerBranchName})`}
                  </p>
                </div>
              </div>
           </div>
        </div>
        <div className="text-right flex flex-col items-end justify-center h-full gap-1 mt-4 md:mt-0 no-print">
          <h1 className="text-xl font-black text-indigo-700 uppercase tracking-tight bg-indigo-50 px-6 py-4 rounded-2xl border border-indigo-100 text-center flex items-center justify-center h-full">
            {reportTab === 'sales' ? 'รายงานภาษีขาย (Sales Tax)' : reportTab === 'purchase' ? 'รายงานภาษีซื้อ (Purchase Tax)' : reportTab === 'inventory' ? 'ทะเบียนคุมสินค้า (Inventory)' : 'สรุป ภ.พ.30'}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print text-left">
        <div className="bg-emerald-600 p-6 rounded-[32px] text-white shadow-xl shadow-emerald-100 relative overflow-hidden text-left">
          <TrendingUp size={80} className="absolute -bottom-4 -right-4 opacity-10"/>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-left">Output VAT (ภาษีขาย)</p>
          <h4 className="text-3xl font-black mt-1 text-left">{formatCurrency(vatAnalysis.outputVat)}</h4>
          <p className="text-xs mt-2 opacity-80 text-left">มูลค่าสินค้ารวม: {formatCurrency(vatAnalysis.outputBase)}</p>
        </div>
        <div className="bg-rose-500 p-6 rounded-[32px] text-white shadow-xl shadow-rose-100 relative overflow-hidden text-left">
          <TrendingDown size={80} className="absolute -bottom-4 -right-4 opacity-10"/>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-left">Input VAT (ภาษีซื้อ)</p>
          <h4 className="text-3xl font-black mt-1 text-left">{formatCurrency(vatAnalysis.inputVat)}</h4>
          <p className="text-xs mt-2 opacity-80 text-left">มูลค่าสินค้ารวม: {formatCurrency(vatAnalysis.inputBase)}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden text-left">
          <Calculator size={80} className="absolute -bottom-4 -right-4 opacity-10"/>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 text-left">Net Tax (ภาษีที่ต้องชำระ)</p>
          <h4 className="text-3xl font-black mt-1 text-left">{formatCurrency(Math.abs(vatAnalysis.net))}</h4>
          <p className={`text-xs mt-2 font-bold text-left ${vatAnalysis.net >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {vatAnalysis.net >= 0 ? 'ต้องชำระเพิ่ม (ภ.พ.30)' : 'ภาษีชำระเกิน (ขอคืน/เครดิต)'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center text-left">
          <div className="flex items-center gap-2 mb-2 text-left">
            <span className="text-indigo-600"><ClipboardList size={16}/></span>
            <p className="text-[10px] font-black text-slate-400 uppercase text-left">สรุปจำนวนเอกสาร</p>
          </div>
          <div className="space-y-2 text-left">
            <div className="flex justify-between text-xs text-left"><span className="text-slate-500">บิลขาย/ลดหนี้:</span><span className="font-bold text-slate-800">{filteredInvoices.length} รายการ</span></div>
            <div className="flex justify-between text-xs text-left"><span className="text-slate-500">บิลซื้อ/จ่าย:</span><span className="font-bold text-slate-800">{filteredExpenses.length} รายการ</span></div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap no-print text-left">
        <TabBtn id="sales" label="ภาษีขาย (Sales Tax)" icon={<FileText size={18}/>} />
        <TabBtn id="purchase" label="ภาษีซื้อ (Purchase Tax)" icon={<ShoppingCart size={18}/>} />
        <TabBtn id="inventory" label="คุมสินค้า (Stock)" icon={<Box size={18}/>} />
        <TabBtn id="pp30" label="สรุป ภ.พ.30" icon={<Calculator size={18}/>} />
        <TabBtn id="pit90" label="ภ.ง.ด. 90/94 (บุคคลธรรมดา)" icon={<User size={18}/>} />
      </div>

      <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden flex flex-col min-h-[500px] text-left">
        <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center text-left">
          <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm text-left">รายละเอียดรายการ</h4>
          <button onClick={handleExportExcel} disabled={isExporting} className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-white px-4 py-2 rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 transition-all disabled:opacity-50 no-print text-center">
            {isExporting ? <Loader size={14} className="animate-spin"/> : <FileSpreadsheet size={14}/>} Export Excel
          </button>
        </div>
        <div className="overflow-x-auto flex-1 custom-scrollbar text-left">
          {reportTab === 'sales' && (
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-400 text-[10px] font-bold uppercase sticky top-0 border-b z-10 text-left">
                <tr>
                  <th className="p-5 text-left">วันที่</th>
                  <th className="p-5 text-left">เลขที่ใบกำกับภาษี</th>
                  <th className="p-5 text-left">ชื่อผู้ซื้อสินค้า/ผู้รับบริการ</th>
                  <th className="p-5 text-left">เลขผู้เสียภาษี</th>
                  <th className="p-5 text-left">สถานประกอบการ</th>
                  <th className="p-5 text-right">มูลค่าสินค้า</th>
                  <th className="p-5 text-right">ภาษีมูลค่าเพิ่ม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-left">
                {filteredInvoices.map((row, i) => {
                    const mult = row.docType === 'credit_note' ? -1 : 1;
                    return (
                     <tr key={i} className="hover:bg-slate-50/80 transition-colors text-left">
                      <td className="p-5 text-xs text-slate-500 whitespace-nowrap text-left">{formatDate(row.date)}</td>
                      <td className="p-5 font-bold text-slate-800 text-left">{row.invNo} {row.docType === 'credit_note' && <span className="text-rose-500 text-[10px] ml-1">(ลดหนี้)</span>}</td>
                      <td className="p-5 text-left">{row.customerName}</td>
                      <td className="p-5 font-mono text-xs text-left">{row.taxId || '-'}</td>
                      <td className="p-5 text-[10px] font-bold text-slate-500 text-left">{(row.branch === '00000' || !row.branch) ? 'สำนักงานใหญ่' : `สาขาที่ ${row.branch}`}</td>
                      <td className="p-5 text-right font-medium text-right">{formatCurrency((row.preVat || 0) * mult)}</td>
                      <td className="p-5 text-right text-indigo-600 font-bold text-right">{formatCurrency((row.vat || 0) * mult)}</td>
                    </tr>
                    );
                })}
              </tbody>
              {filteredInvoices.length > 0 && (
                <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 text-left">
                    <tr>
                        <td colSpan="5" className="p-5 text-right uppercase tracking-widest text-xs opacity-60 text-right">รวมยอดสุทธิ</td>
                        <td className="p-5 text-right text-white text-right">{formatCurrency(salesFooter.base)}</td>
                        <td className="p-5 text-right text-indigo-400 text-right">{formatCurrency(salesFooter.vat)}</td>
                    </tr>
                </tfoot>
              )}
            </table>
          )}
          
          {reportTab === 'purchase' && (
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-400 text-[10px] font-bold uppercase sticky top-0 border-b z-10 text-left">
                <tr>
                  <th className="p-5 text-left">วันที่</th>
                  <th className="p-5 text-left">เลขระบบ (SYS ID)</th>
                  <th className="p-5 text-left">เลขที่ใบกำกับภาษี</th>
                  <th className="p-5 text-left">ชื่อผู้ขายสินค้า/ผู้ให้บริการ</th>
                  <th className="p-5 text-left">เลขผู้เสียภาษี</th>
                  <th className="p-5 text-left">สถานประกอบการ</th>
                  <th className="p-5 text-right">มูลค่าสินค้า</th>
                  <th className="p-5 text-right">ภาษีมูลค่าเพิ่ม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-left">
                {filteredExpenses.map((row, i) => {
                  const taxDetails = getExpenseTaxDetails(row);
                  return (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors text-left">
                      <td className="p-5 text-xs text-slate-500 whitespace-nowrap text-left">{formatDate(row.date)}</td>
                      <td className="p-5 font-mono text-xs font-bold text-indigo-600 text-left">{row.sysDocId || '-'}</td>
                      <td className="p-5 font-bold text-slate-800 text-left">{row.taxInvoiceNo || row.orderId || '-'}</td>
                      <td className="p-5 text-left">
                        <p className="font-bold text-left">{row.partnerName || '-'}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1 text-left">{row.description}</p>
                      </td>
                      <td className="p-5 font-mono text-xs text-left">{row.partnerTaxId || '-'}</td>
                      <td className="p-5 text-[10px] font-bold text-slate-500 text-left">{(row.partnerBranch === '00000' || !row.partnerBranch) ? 'สำนักงานใหญ่' : `สาขาที่ ${row.partnerBranch}`}</td>
                      <td className="p-5 text-right font-medium text-right">{formatCurrency(taxDetails.base)}</td>
                      <td className="p-5 text-right text-rose-500 font-bold text-right">{formatCurrency(taxDetails.vat)}</td>
                    </tr>
                  );
                })}
              </tbody>
              {filteredExpenses.length > 0 && (
                <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 text-left">
                    <tr>
                        <td colSpan="6" className="p-5 text-right uppercase tracking-widest text-xs opacity-60 text-right">รวมยอดสุทธิ</td>
                        <td className="p-5 text-right text-white text-right">{formatCurrency(purchaseFooter.base)}</td>
                        <td className="p-5 text-right text-rose-400 text-right">{formatCurrency(purchaseFooter.vat)}</td>
                    </tr>
                </tfoot>
              )}
            </table>
          )}

          {reportTab === 'inventory' && (
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-400 text-[10px] font-bold uppercase sticky top-0 border-b z-10 text-left">
                <tr>
                  <th className="p-5 text-left">วันที่</th>
                  <th className="p-5 text-left">อ้างอิง (Ref)</th>
                  <th className="p-5 text-left">รายการสินค้า</th>
                  <th className="p-5 text-center bg-emerald-50/50 text-emerald-600">รับ-จำนวน</th>
                  <th className="p-5 text-right bg-emerald-50/50 text-emerald-600">รับ-มูลค่า</th>
                  <th className="p-5 text-center bg-rose-50/50 text-rose-600">จ่าย-จำนวน</th>
                  <th className="p-5 text-right bg-rose-50/50 text-rose-600">จ่าย-ต้นทุนรวม</th>
                  <th className="p-5 text-center bg-indigo-50/50 text-indigo-600">คงเหลือ</th>
                  <th className="p-5 text-right bg-indigo-50/50 text-indigo-600">มูลค่าคงเหลือ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-left">
                {filteredMovement.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors text-left">
                    <td className="p-5 text-xs text-slate-500 whitespace-nowrap text-left">{formatDate(m.date)}</td>
                    <td className="p-5 text-xs font-mono text-slate-500 text-left">{m.refId}</td>
                    <td className="p-5 text-left">
                      <p className="font-bold text-slate-700">{m.name}</p>
                      <p className="text-[10px] text-slate-400">SKU: {m.sku}</p>
                    </td>
                    <td className="p-5 text-center font-bold text-emerald-600">{m.receiveQty > 0 ? m.receiveQty : '-'}</td>
                    <td className="p-5 text-right text-emerald-600">{m.receiveTotal > 0 ? formatCurrency(m.receiveTotal) : '-'}</td>
                    <td className="p-5 text-center font-bold text-rose-600">{m.issueQty > 0 ? m.issueQty : '-'}</td>
                    <td className="p-5 text-right text-rose-600">{m.issueTotal > 0 ? formatCurrency(m.issueTotal) : '-'}</td>
                    <td className="p-5 text-center font-black text-indigo-600">{m.balanceQty}</td>
                    <td className="p-5 text-right font-black text-indigo-600">{formatCurrency(m.balanceTotal)}</td>
                  </tr>
                ))}
              </tbody>
              {filteredMovement.length === 0 && (
                <tbody><tr><td colSpan="9" className="p-10 text-center text-slate-400 font-bold">ไม่พบความเคลื่อนไหวในช่วงเวลานี้</td></tr></tbody>
              )}
            </table>
          )}

          {reportTab === 'pp30' && (
            <div className="p-8 max-w-3xl mx-auto my-4 bg-white border border-slate-200 rounded-3xl text-sm shadow-sm font-sarabun">
                <div className="text-center mb-8 border-b border-slate-200 pb-4">
                    <h3 className="font-black text-2xl text-slate-800 tracking-tight">สรุปแบบแสดงรายการภาษีมูลค่าเพิ่ม (ภ.พ. 30)</h3>
                    <p className="text-slate-500 mt-2">รอบระยะเวลา: {formatDate(startDate)} ถึง {formatDate(endDate)}</p>
                    <p className="text-[10px] text-rose-500 font-bold mt-1">*สามารถใช้ตัวเลขด้านล่างนี้เพื่อไปกรอกในระบบ E-Filing ของกรมสรรพากรได้ทันที</p>
                </div>
                
                <div className="space-y-1">
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                        <span className="font-bold text-slate-600">1. ยอดขายเดือนนี้ (Sales Amount)</span>
                        <span className="font-mono text-base">{formatCurrency(vatAnalysis.outputBase)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                        <span className="font-bold text-slate-600 ml-4 text-xs">2. หัก ยอดขายที่เสียภาษีอัตราร้อยละ 0</span>
                        <span className="font-mono text-base">0.00</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                        <span className="font-bold text-slate-600 ml-4 text-xs">3. หัก ยอดขายที่ได้รับยกเว้นภาษี</span>
                        <span className="font-mono text-base">0.00</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-slate-200 bg-indigo-50/50 px-4 rounded-xl mt-2">
                        <span className="font-black text-indigo-700">4. ยอดขายที่ต้องเสียภาษี (1 - 2 - 3)</span>
                        <span className="font-black font-mono text-lg text-indigo-700">{formatCurrency(vatAnalysis.outputBase)}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-slate-200 bg-emerald-50 px-4 rounded-xl mt-2">
                        <span className="font-black text-emerald-700">5. ภาษีขายเดือนนี้ (Output Tax)</span>
                        <span className="font-black font-mono text-lg text-emerald-700">{formatCurrency(vatAnalysis.outputVat)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-slate-100 mt-6">
                        <span className="font-bold text-slate-600">6. ยอดซื้อที่มีสิทธิหักภาษีซื้อ (Purchase Amount)</span>
                        <span className="font-mono text-base">{formatCurrency(vatAnalysis.inputBase)}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-slate-200 bg-emerald-50 px-4 rounded-xl mt-2">
                        <span className="font-black text-emerald-700">7. ภาษีซื้อเดือนนี้ (Input Tax)</span>
                        <span className="font-black font-mono text-lg text-emerald-700">{formatCurrency(vatAnalysis.inputVat)}</span>
                    </div>
                    
                    <div className="mt-8 border-t-4 border-slate-800 pt-6 px-4">
                        {vatAnalysis.net >= 0 ? (
                            <div className="flex justify-between items-center">
                                <span className="font-black text-xl text-rose-600">ภาษีที่ต้องชำระ (5 - 7)</span>
                                <span className="font-black font-mono text-3xl text-rose-600">{formatCurrency(vatAnalysis.net)}</span>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <span className="font-black text-xl text-emerald-600">ภาษีที่ชำระเกิน (7 - 5)</span>
                                <span className="font-black font-mono text-3xl text-emerald-600">{formatCurrency(Math.abs(vatAnalysis.net))}</span>
                            </div>
                        )}
                        <p className="text-right text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-bold">Auto-calculated by MerchantTax Engine</p>
                    </div>
                </div>
            </div>
          )}

          {reportTab === 'pit90' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 p-4 md:p-8 text-left">
                <div className="xl:col-span-1 space-y-6">
                   <h3 className="font-black text-xl text-slate-800 border-b pb-4">ตั้งค่าลดหย่อนภาษี</h3>
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase">รูปแบบการหักค่าใช้จ่าย</label>
                         <div className="flex bg-slate-100 p-1 rounded-xl w-full">
                            <button onClick={()=>setExpenseMode('standard')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${expenseMode === 'standard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>เหมาจ่าย 60%</button>
                            <button onClick={()=>setExpenseMode('actual')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${expenseMode === 'actual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>ตามจริง</button>
                         </div>
                         <p className="text-[10px] text-slate-400 mt-1">
                            สิทธิเหมาจ่าย: {formatCurrency(pitAnalysis.standardExpense)} | ค่าใช้จ่ายจริง: {formatCurrency(pitAnalysis.actualExpense)}
                         </p>
                         {pitAnalysis.standardExpense > pitAnalysis.actualExpense && expenseMode === 'actual' && (
                            <p className="text-[10px] text-rose-500 font-bold">*คำแนะนำ: ปัจจุบันหักแบบเหมาจ่ายคุ้มกว่า</p>
                         )}
                      </div>

                      <div className="space-y-3 pt-4 border-t">
                         <label className="text-xs font-bold text-slate-500 uppercase">รายการลดหย่อน (Deductions)</label>
                         <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-sm font-bold text-slate-700">ผู้มีเงินได้ (อัตโนมัติ)</span>
                            <span className="text-sm font-black text-indigo-600">60,000</span>
                         </div>
                         <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer">
                            <span className="text-sm font-bold text-slate-700">คู่สมรสไม่มีเงินได้ (60k)</span>
                            <input type="checkbox" checked={pitDeductions.spouse} onChange={e=>setPitDeductions({...pitDeductions, spouse: e.target.checked})} className="w-5 h-5 rounded text-indigo-600 border-slate-300" />
                         </label>
                         <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-sm font-bold text-slate-700">บุตร (คนละ 30k)</span>
                            <input type="number" min="0" value={pitDeductions.children} onChange={e=>setPitDeductions({...pitDeductions, children: parseInt(e.target.value)||0})} className="w-16 bg-white border border-slate-200 rounded-lg p-1 text-center font-bold outline-none text-indigo-600 focus:border-indigo-400" />
                         </div>
                         <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-sm font-bold text-slate-700">บิดามารดา (คนละ 30k)</span>
                            <input type="number" min="0" max="4" value={pitDeductions.parents} onChange={e=>setPitDeductions({...pitDeductions, parents: parseInt(e.target.value)||0})} className="w-16 bg-white border border-slate-200 rounded-lg p-1 text-center font-bold outline-none text-indigo-600 focus:border-indigo-400" />
                         </div>
                         <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-700">ประกันชีวิต / ประกันสังคม / กองทุน</span>
                            <input type="number" value={pitDeductions.lifeInsurance} onChange={e=>setPitDeductions({...pitDeductions, lifeInsurance: parseInt(e.target.value)||0})} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-right font-bold outline-none text-indigo-600 focus:border-indigo-400" placeholder="0" />
                         </div>
                         <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-700">ลดหย่อนอื่นๆ (เช่น บริจาค, E-Receipt)</span>
                            <input type="number" value={pitDeductions.otherDeductions} onChange={e=>setPitDeductions({...pitDeductions, otherDeductions: parseInt(e.target.value)||0})} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-right font-bold outline-none text-indigo-600 focus:border-indigo-400" placeholder="0" />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="xl:col-span-2 space-y-6">
                   <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-xl relative overflow-hidden">
                       <Calculator size={140} className="absolute -right-10 -bottom-10 opacity-10 text-white" />
                       <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Estimated Net Tax Payable (ภ.ง.ด. 90/94)</p>
                       <h3 className="text-4xl md:text-5xl font-black mb-4">
                          {pitAnalysis.payableTax <= 0 ? 'ไม่มีภาษีต้องชำระ' : formatCurrency(pitAnalysis.payableTax)}
                       </h3>
                       {pitAnalysis.payableTax < 0 && (
                           <p className="text-emerald-400 font-bold bg-emerald-400/10 w-fit px-4 py-2 rounded-xl">สามารถขอคืนภาษีได้ {formatCurrency(Math.abs(pitAnalysis.payableTax))} บาท</p>
                       )}
                       {pitAnalysis.payableTax > 0 && pitAnalysis.totalWHT > 0 && (
                           <p className="text-amber-400 text-sm font-bold bg-amber-400/10 w-fit px-4 py-2 rounded-xl">มีหัก ณ ที่จ่ายไว้แล้ว {formatCurrency(pitAnalysis.totalWHT)} บาท (คำนวณหักลบแล้ว)</p>
                       )}
                   </div>

                   <div className="bg-slate-50 p-6 md:p-8 rounded-[32px] border border-slate-100 space-y-3 text-sm shadow-sm">
                       <div className="flex justify-between items-center py-2 border-b border-slate-200">
                           <span className="font-bold text-slate-600">1. รวมรายได้ประเมิน 40(8)</span>
                           <span className="font-mono font-bold text-base text-slate-800">{formatCurrency(pitAnalysis.totalIncome)}</span>
                       </div>
                       <div className="flex justify-between items-center py-2 border-b border-slate-200">
                           <span className="font-bold text-slate-600">2. หัก ค่าใช้จ่าย ({expenseMode === 'standard' ? 'เหมา 60%' : 'ตามจริง'})</span>
                           <span className="font-mono font-bold text-base text-rose-600">-{formatCurrency(pitAnalysis.usedExpense)}</span>
                       </div>
                       <div className="flex justify-between items-center py-2 border-b border-slate-200">
                           <span className="font-bold text-slate-600">3. หัก ค่าลดหย่อนรวม</span>
                           <span className="font-mono font-bold text-base text-rose-600">-{formatCurrency(pitAnalysis.totalDeductions)}</span>
                       </div>
                       <div className="flex justify-between items-center py-5 border-b border-slate-200 bg-white px-5 rounded-2xl shadow-sm my-3 border border-indigo-50">
                           <span className="font-black text-indigo-700">4. เงินได้สุทธิเพื่อคำนวณภาษี</span>
                           <span className="font-mono font-black text-xl text-indigo-700">{formatCurrency(pitAnalysis.netIncome)}</span>
                       </div>
                       
                       <div className="py-2">
                           <span className="font-bold text-slate-600 block mb-3">5. คำนวณภาษีตามขั้นบันได</span>
                           <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs shadow-sm">
                               <table className="w-full text-left bg-white">
                                   <thead className="bg-slate-100 text-slate-500 font-bold uppercase">
                                       <tr><th className="p-3 pl-5">ขั้นเงินได้สุทธิ</th><th className="p-3 text-center">อัตราภาษี</th><th className="p-3 text-right">เงินได้ในขั้น</th><th className="p-3 pr-5 text-right">ภาษีสะสม</th></tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-50">
                                       {pitAnalysis.steps.map((s, idx) => (
                                           <tr key={idx} className="hover:bg-slate-50/50">
                                               <td className="p-3 pl-5 text-slate-600 font-medium">{s.range}</td>
                                               <td className="p-3 text-center font-black text-indigo-600 bg-indigo-50/30">{s.rate}</td>
                                               <td className="p-3 text-right font-mono text-slate-600">{formatCurrency(s.amount)}</td>
                                               <td className="p-3 pr-5 text-right font-black text-slate-800">{formatCurrency(s.tax)}</td>
                                           </tr>
                                       ))}
                                       {pitAnalysis.steps.length === 0 && (
                                           <tr><td colSpan="4" className="p-6 text-center text-slate-400 font-bold">ยอดเงินได้สุทธิอยู่ในเกณฑ์ได้รับการยกเว้นภาษี</td></tr>
                                       )}
                                   </tbody>
                               </table>
                           </div>
                       </div>

                       <div className="flex justify-between items-center py-3 border-b border-slate-200 mt-2">
                           <span className="font-bold text-slate-600">6. ภาษีที่คำนวณได้ {pitAnalysis.isGrossTaxApplied ? '(ใช้ฐาน 0.5% ของรายได้)' : '(ฐานขั้นบันได)'}</span>
                           <span className="font-mono font-black text-base text-slate-800">{formatCurrency(pitAnalysis.finalTax)}</span>
                       </div>
                       <div className="flex justify-between items-center py-3 border-b border-slate-200">
                           <span className="font-bold text-slate-600">7. หัก ภาษีถูกหัก ณ ที่จ่าย (WHT)</span>
                           <span className="font-mono font-bold text-base text-emerald-600">-{formatCurrency(pitAnalysis.totalWHT)}</span>
                       </div>
                       <div className="flex justify-between items-center py-5 bg-indigo-50 px-5 rounded-2xl mt-4 border border-indigo-100">
                           <span className="font-black text-slate-800 text-lg">สรุปภาษีสุทธิ</span>
                           <span className={`font-mono font-black text-2xl ${pitAnalysis.payableTax <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                               {formatCurrency(pitAnalysis.payableTax)}
                           </span>
                       </div>
                   </div>
                </div>
            </div>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[32px] p-8 max-sm w-full text-center shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-center">
              <Trash2 size={32}/>
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-800 text-center">ลบข้อมูลรายการคุมสินค้า?</h3>
            <p className="text-xs text-slate-400 mb-6 text-center leading-relaxed">
              ระบบจะลบข้อมูล <b>"{deleteConfirm.name}"</b> ออกจากทะเบียนคุมสินค้า<br/>
              และลบรายการต้นทางที่เชื่อมโยงกันทั้งหมด (คืนยอดสต็อก/ลบบัญชี)<br/>
              <span className="text-rose-600 font-bold underline">การกระทำนี้ไม่สามารถกู้คืนได้</span>
            </p>
            <div className="flex gap-3 text-center">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button>
              <button onClick={handleDeleteRecord} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg text-center">ยืนยันลบ</button>
            </div>
          </div>
        </div>
      )}
      
      {showEditSeller && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-3xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl animate-fadeIn text-left">
            <div className="p-6 border-b flex justify-between items-center text-left"><h3 className="font-bold text-lg flex items-center gap-2 text-indigo-700 text-left"><Settings/> ตั้งค่าข้อมูลผู้ประกอบการ</h3><button onClick={()=>setShowEditSeller(false)} className="text-center"><X/></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="text-left"><label className="text-xs font-bold block mb-1 text-left">ชื่อร้านค้า</label><input className="w-full border rounded-lg p-2.5 text-sm font-bold text-left" value={tempSellerData.sellerName} onChange={e=>setTempSellerData({...tempSellerData, sellerName: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold block mb-1 text-left">เลขประจำตัวผู้เสียภาษี</label><input className="w-full border rounded-lg p-2.5 text-sm font-mono text-left" value={tempSellerData.sellerTaxId} onChange={e=>setTempSellerData({...tempSellerData, sellerTaxId: e.target.value})} /></div>
                <div className="col-span-2 text-left"><label className="text-xs font-bold block mb-1 text-left">ที่อยู่ (เลขที่/ถนน)</label><textarea className="w-full border rounded-lg p-2.5 text-sm resize-none text-left" rows="2" value={tempSellerData.sellerAddress} onChange={e=>setTempSellerData({...tempSellerData, sellerAddress: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold block mb-1 text-left">ตำบล/แขวง</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" value={tempSellerData.sellerSubDistrict} onChange={e=>setTempSellerData({...tempSellerData, sellerSubDistrict: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold block mb-1 text-left">อำเภอ/เขต</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" value={tempSellerData.sellerDistrict} onChange={e=>setTempSellerData({...tempSellerData, sellerDistrict: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold block mb-1 text-left">จังหวัด</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" value={tempSellerData.sellerProvince} onChange={e=>setTempSellerData({...tempSellerData, sellerProvince: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold block mb-1 text-left">รหัสไปรษณีย์</label><input className="w-full border rounded-lg p-2.5 text-sm font-mono text-left" value={tempSellerData.sellerZipCode} onChange={e=>setTempSellerData({...tempSellerData, sellerZipCode: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="text-left"><label className="text-xs font-bold block mb-1 text-left">รหัสสาขา (5 หลัก)</label><input className="w-full border rounded-lg p-2.5 text-sm font-mono text-left" placeholder="00000" value={tempSellerData.sellerBranchId} onChange={e=>setTempSellerData({...tempSellerData, sellerBranchId: e.target.value})} /></div>
                  <div className="text-left"><label className="text-xs font-bold block mb-1 text-left">ชื่อสาขา</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" placeholder="สำนักงานใหญ่" value={tempSellerData.sellerBranchName} onChange={e=>setTempSellerData({...tempSellerData, sellerBranchName: e.target.value})} /></div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex gap-3 text-center"><button onClick={()=>setShowEditSeller(false)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold text-center">ยกเลิก</button><button onClick={handleSaveSeller} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg text-center">บันทึกข้อมูลหลัก</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordManager({ user, transactions, invoices, appId, stockBatches, showToast, onIssueInvoice }) {
  const [subTab, setSubTab] = useState('new');
  const [viewItem, setViewItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showStockSelectModal, setShowStockSelectModal] = useState(false);
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [partnerSearchTerm, setPartnerSearchTerm] = useState('');
  const [partnerTab, setPartnerTab] = useState('all');
  const [partners, setPartners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
   
  const [formData, setFormData] = useState({ 
    type: 'income', date: formatDateISO(new Date()), description: '', total: 0, channel: 'หน้าร้าน', 
    transactionFee: '', commissionFee: '', serviceFee: '', infrastructureFee: '', couponDiscount: '', cashCoupon: '',
    whtAmount: '', isNonCreditableVat: false, vatType: 'none', shippingFee: '', estimatedShippingFee: '', shippingFeeSubsidy: '', returnShippingFee: '',
    category: 'รายได้จากการขายสินค้า', orderId: '', taxInvoiceNo: '',
    partnerName: '', partnerTaxId: '', partnerAddress: '', partnerBranch: '00000', partnerBranchName: '',
    items: [{ desc: '', qty: 1, buyPrice: 0, sellPrice: 0, sku: '', category: '' }] 
  });

  // --- Summary Filters State ---
  const [summaryStartDate, setSummaryStartDate] = useState(formatDateISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [summaryEndDate, setSummaryEndDate] = useState(formatDateISO(new Date()));
  const [summaryChannel, setSummaryChannel] = useState('all');
  const [summaryCategory, setSummaryCategory] = useState('all');
  
  // --- History Advanced Filters & Pagination State ---
  const [histType, setHistType] = useState('all');
  const [histStartDate, setHistStartDate] = useState('');
  const [histEndDate, setHistEndDate] = useState('');
  const [histPage, setHistPage] = useState(1);
  const histItemsPerPage = 20;

  const handleSavePartnerManual = async () => {
    if (!formData.partnerName) {
      showToast("กรุณาระบุชื่อคู่ค้า/ลูกค้า", "error");
      return;
    }
    try {
      await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'partners'), {
        name: formData.partnerName,
        taxId: formData.partnerTaxId,
        address: formData.partnerAddress,
        branch: formData.partnerBranch,
        branchName: formData.partnerBranchName,
        type: formData.type === 'income' ? 'buyer' : 'seller',
        createdAt: serverTimestamp()
      });
      showToast("บันทึกข้อมูลใหม่ลงฐานข้อมูลสำเร็จ", "success");
    } catch (e) {
      showToast("บันทึกข้อมูลไม่สำเร็จ", "error");
    }
  };

  const setSummaryQuickRange = (range) => {
    const now = new Date();
    let start, end = new Date();
    switch(range) {
        case 'thisMonth': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'lastMonth': 
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1); 
            end = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        case '3months': start = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
        case 'year': start = new Date(now.getFullYear(), 0, 1); break;
        default: return;
    }
    setSummaryStartDate(formatDateISO(start));
    setSummaryEndDate(formatDateISO(end));
  };

  useEffect(() => { if (!user) return; const unsub = onSnapshot(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'partners'), (snap) => { setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() }))); }); return () => unsub(); }, [user, appId]);

  const uniqueInventory = useMemo(() => {
    const map = {};
    stockBatches.forEach(batch => {
      const name = batch.productName; if (!name) return;
      const remaining = Number(batch.quantity) - Number(batch.sold || 0);
      if (!map[name]) map[name] = { name, sku: batch.sku || '-', qty: 0, sellPrice: batch.sellPrice || 0, category: batch.category || '' };
      map[name].qty += Math.max(0, remaining);
      if (batch.sellPrice > 0) map[name].sellPrice = batch.sellPrice;
    });
    return Object.values(map);
  }, [stockBatches]);

  const filteredStock = useMemo(() => {
    return uniqueInventory.filter(item => 
      (formData.type === 'income' ? item.qty > 0 : true) && 
      (
        item.name.toLowerCase().includes(stockSearchTerm.toLowerCase()) || 
        item.sku.toLowerCase().includes(stockSearchTerm.toLowerCase())
      )
    );
  }, [uniqueInventory, stockSearchTerm, formData.type]);

  const filteredPartners = useMemo(() => {
      return partners.filter(p => {
          const matchSearch = (p.name || '').toLowerCase().includes(partnerSearchTerm.toLowerCase()) || 
                              (p.taxId || '').toLowerCase().includes(partnerSearchTerm.toLowerCase());
          const matchTab = partnerTab === 'all' || p.type === partnerTab || (!p.type); 
          return matchSearch && matchTab;
      }).sort((a,b) => (a.name || '').localeCompare(b.name || ''));
  }, [partners, partnerSearchTerm, partnerTab]);
   
  const handleDelete = async (id, type) => { 
    try { 
      const batchWriter = writeBatch(dbInstance);
      const coll = type === 'income' ? 'transactions_income' : 'transactions_expense'; 
      
      batchWriter.delete(doc(dbInstance, 'artifacts', appId, 'public', 'data', coll, id));

      if (type === 'expense') {
          const associatedLots = stockBatches.filter(b => b.parentExpenseId === id);
          associatedLots.forEach(lot => {
              batchWriter.delete(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches', lot.id));
          });
      } else if (type === 'income') {
          const saleDoc = transactions.find(t => t.id === id);
          if (saleDoc && saleDoc.items) {
              for (const item of saleDoc.items) {
                  let toReturn = Number(item.qty);
                  const affectedLots = stockBatches
                    .filter(b => (String(b.sku).toLowerCase() === String(item.sku).toLowerCase() || String(b.productName).toLowerCase() === String(item.desc).toLowerCase()) && Number(b.sold) > 0)
                    .sort(sortNewestFirst);

                  for (const lot of affectedLots) {
                      if (toReturn <= 0) break;
                      const canTakeBack = Math.min(toReturn, Number(lot.sold));
                      batchWriter.update(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches', lot.id), { sold: increment(-canTakeBack) });
                      toReturn -= canTakeBack;
                  }
              }
          }
      }

      await batchWriter.commit();
      showToast("ลบรายการ and คืนยอดสต็อกเรียบร้อย", "success"); 
      setDeleteConfirmId(null); 
    } catch (e) { showToast("ไม่สามารถลบได้", "error"); } 
  };

  const selectPartner = (p) => { 
    setFormData({ ...formData, partnerName: p.name || '', partnerTaxId: p.taxId || '', partnerAddress: p.address || '', partnerBranch: p.branch || '00000', partnerBranchName: p.branchName || '' }); 
    setShowPartnerModal(false); 
    setPartnerSearchTerm('');
  };
  
  const selectStockItem = (item, index) => { 
    const newItems = [...formData.items]; 
    newItems[index].desc = item.name;
    newItems[index].sku = item.sku;
    newItems[index].category = item.category;
    if (formData.type === 'income') {
        newItems[index].sellPrice = item.sellPrice || 0;
    }
    setFormData({ ...formData, items: newItems }); 
    setShowStockSelectModal(false); 
    setStockSearchTerm('');
  };

  const addLineItem = () => { setFormData({ ...formData, items: [...formData.items, { desc: '', qty: 1, buyPrice: 0, sellPrice: 0, sku: '', category: '' }] }); };
  const removeLineItem = (index) => { if (formData.items.length === 1) return; const newItems = formData.items.filter((_, i) => i !== index); setFormData({ ...formData, items: newItems }); };
  const updateLineItem = (index, field, value) => { const newItems = [...formData.items]; newItems[index][field] = value; setFormData({ ...formData, items: newItems }); };

  const financialSummary = useMemo(() => {
    const subTotal = formData.items.reduce((sum, item) => sum + ((formData.type === 'income' ? Number(item.sellPrice) : Number(item.buyPrice)) * (Number(item.qty) || 0)), 0);
    const transFee = parseFloat(formData.transactionFee) || 0;
    const infraFee = parseFloat(formData.infrastructureFee) || 0;
    const commFee = parseFloat(formData.commissionFee) || 0;
    const servFee = parseFloat(formData.serviceFee) || 0;
    const couponDisc = parseFloat(formData.couponDiscount) || 0;
    const cashCpn = parseFloat(formData.cashCoupon) || 0;
    const wht = parseFloat(formData.whtAmount) || 0;
    const shippingFee = parseFloat(formData.shippingFee) || 0;
    const totalFees = formData.type === 'income' ? (transFee + infraFee + commFee + servFee) : 0;
    const totalDiscounts = couponDisc + cashCpn;
    
    let grandTotal = 0;
    let vatAmount = 0;

    if (formData.type === 'income') {
        let vatBase = subTotal + shippingFee - couponDisc;
        if (formData.vatType === 'excluded') {
            vatAmount = vatBase * 0.07;
            grandTotal = (vatBase * 1.07) - totalFees - cashCpn - wht;
        } else {
            if (formData.vatType === 'included') vatAmount = vatBase * 7 / 107;
            grandTotal = vatBase - totalFees - cashCpn - wht;
        }
    } else {
        let vatBase = subTotal - couponDisc;
        if (formData.vatType === 'excluded') {
            let vatAmt = vatBase * 0.07;
            vatAmount = vatAmt;
            grandTotal = vatBase + vatAmt - cashCpn - wht;
        } else {
            if (formData.vatType === 'included') vatAmount = vatBase * 7 / 107;
            grandTotal = subTotal - totalDiscounts - wht;
        }
    }
    
    return { subTotal, totalFees, totalDiscounts, wht, grandTotal, shippingFee, vatAmount };
  }, [formData]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!user) return;
    try {
      const coll = formData.type === 'income' ? 'transactions_income' : 'transactions_expense';
      const { subTotal, totalFees, grandTotal, totalDiscounts, shippingFee } = financialSummary;

      // --- Generate System Doc ID ---
      let prefix = '';
      if (formData.type === 'income') prefix = 'INC-';
      else prefix = (formData.category === 'ต้นทุนสินค้า') ? 'COG-' : 'EXP-';
      
      const sysDocId = generateNextDocId(transactions.filter(t => t.type === formData.type), prefix, 'sysDocId');
      
      const mainRef = doc(collection(dbInstance, 'artifacts', appId, 'public', 'data', coll));
      const dataToSave = { 
        sysDocId, // เพิ่มการบันทึกเลขรันเอกสารลงฐานข้อมูลอัตโนมัติ
        ...formData, 
        shippingFee: parseFloat(formData.shippingFee) || 0,
        estimatedShippingFee: parseFloat(formData.estimatedShippingFee) || 0,
        shippingFeeSubsidy: parseFloat(formData.shippingFeeSubsidy) || 0,
        returnShippingFee: parseFloat(formData.returnShippingFee) || 0,
        total: subTotal, platformFee: totalFees, grandTotal, date: normalizeDate(formData.date), description: formData.items.map(i => i.desc).join(', '), userId: user.uid, createdAt: serverTimestamp() 
      };
      
      if (formData.partnerName) {
        const existingPartner = partners.find(p => p.taxId === formData.partnerTaxId && p.name === formData.partnerName);
        if (!existingPartner) { await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'partners'), { name: formData.partnerName, taxId: formData.partnerTaxId, address: formData.partnerAddress, branch: formData.partnerBranch, branchName: formData.partnerBranchName, type: formData.type === 'income' ? 'buyer' : 'seller', createdAt: serverTimestamp() }); }
      }
      
      const batchWriter = writeBatch(dbInstance);
      batchWriter.set(mainRef, dataToSave);

      if (formData.type === 'expense' && formData.category === 'ต้นทุนสินค้า') {
        for (const item of formData.items) {
            const itemTotal = Number(item.buyPrice) * Number(item.qty);
            const proportion = subTotal > 0 ? (itemTotal / subTotal) : 0;
            const itemDiscount = totalDiscounts * proportion;
            
            let itemAmountForCost = itemTotal - itemDiscount;
            if (formData.vatType === 'excluded') {
                itemAmountForCost = itemAmountForCost * 1.07;
            }
            
            const trueCostUnit = item.qty > 0 ? itemAmountForCost / item.qty : 0;

            const batchDocRef = doc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches'));
            batchWriter.set(batchDocRef, {
                productName: String(item.desc).trim(),
                sku: String(item.sku || '-').trim(),
                quantity: Number(item.qty),
                costPerUnit: trueCostUnit, 
                sellPrice: Number(item.sellPrice || 0),
                date: normalizeDate(formData.date),
                sold: 0,
                userId: user.uid,
                createdAt: serverTimestamp(),
                category: item.category || 'อื่นๆ',
                parentExpenseId: mainRef.id,
                paymentStatus: formData.status === 'unpaid' ? 'credit' : 'paid'
            });
        }
      } else if (formData.type === 'income') {
          const stockSnap = [...stockBatches];
          for (const item of formData.items) {
              let needed = Number(item.qty);
              const lots = stockSnap
                .filter(b => (String(b.sku).trim().toLowerCase() === String(item.sku).trim().toLowerCase() || String(b.productName).trim().toLowerCase() === String(item.desc).trim().toLowerCase()))
                .filter(b => (Number(b.quantity) - Number(b.sold || 0) > 0))
                .sort((a,b) => normalizeDate(a.date) - normalizeDate(b.date));

              for (const lot of lots) {
                  if (needed <= 0) break;
                  const remaining = Number(lot.quantity) - Number(lot.sold || 0);
                  const take = Math.min(needed, remaining);
                  const lotRef = doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches', lot.id);
                  batchWriter.update(lotRef, { sold: increment(take) });
                  
                  const snapIdx = stockSnap.findIndex(s => s.id === lot.id);
                  if (snapIdx !== -1) stockSnap[snapIdx].sold = (Number(stockSnap[snapIdx].sold) || 0) + take;
                  needed -= take;
              }
          }
      }

      await batchWriter.commit();
      showToast("บันทึกสำเร็จ and ประมวลผลสต็อกเรียบร้อย", "success");
      setFormData({ type: 'income', date: formatDateISO(new Date()), description: '', total: 0, channel: 'หน้าร้าน', transactionFee: '', commissionFee: '', serviceFee: '', infrastructureFee: '', couponDiscount: '', cashCoupon: '', whtAmount: '', isNonCreditableVat: false, vatType: 'none', shippingFee: '', estimatedShippingFee: '', shippingFeeSubsidy: '', returnShippingFee: '', category: 'รายได้จากการขายสินค้า', orderId: '', taxInvoiceNo: '', partnerName: '', partnerTaxId: '', partnerAddress: '', partnerBranch: '00000', partnerBranchName: '', items: [{ desc: '', qty: 1, buyPrice: 0, sellPrice: 0, sku: '', category: '' }] });
    } catch (e) { showToast("Error: " + e.message, "error"); }
  };

  const filteredHistory = useMemo(() => {
    const docStatusMap = {};
    invoices.forEach(inv => { if (inv.orderId) { if (!docStatusMap[inv.orderId]) docStatusMap[inv.orderId] = []; docStatusMap[inv.orderId].push({ type: inv.docType, no: inv.invNo }); } });
    
    return transactions.filter(t => {
        // 1. Text Search
        const matchSearch = (t.partnerName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (t.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (t.taxInvoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchSearch) return false;

        // 2. Type Filter
        if (histType !== 'all' && t.type !== histType) return false;

        // 3. Date Filter
        const d = normalizeDate(t.date);
        if (histStartDate && d < new Date(histStartDate)) return false;
        if (histEndDate) {
            const end = new Date(histEndDate);
            end.setHours(23,59,59,999);
            if (d > end) return false;
        }

        return true;
    }).map(t => ({ ...t, issuedDocs: docStatusMap[t.orderId] || [] })).sort(sortNewestFirst);
  }, [transactions, invoices, searchTerm, histType, histStartDate, histEndDate]);

  // Reset page when filters change
  useEffect(() => { setHistPage(1); }, [searchTerm, histType, histStartDate, histEndDate]);

  // History Quick Stats
  const histStats = useMemo(() => {
      let inc = 0, exp = 0;
      filteredHistory.forEach(t => {
          const amt = Number(t.grandTotal) || Number(t.total) || 0;
          if(t.type === 'income') inc += amt; else exp += amt;
      });
      return { inc, exp, count: filteredHistory.length };
  }, [filteredHistory]);

  // Pagination Logic
  const histTotalPages = Math.max(1, Math.ceil(filteredHistory.length / histItemsPerPage));
  const currentHistData = filteredHistory.slice((histPage - 1) * histItemsPerPage, histPage * histItemsPerPage);

  const expenseSummary = useMemo(() => {
    let explicitExpenseTotal = 0;
    let platformFeeTotal = 0;
    let estShippingTotal = 0;
    let buyerShippingTotal = 0;
    let subsidyShippingTotal = 0;
    let returnShippingTotal = 0;
    let discountTotal = 0;
    let whtTotal = 0;
    let transactionCount = 0;

    const categories = {};

    const start = new Date(summaryStartDate || '2000-01-01');
    start.setHours(0,0,0,0);
    const end = new Date(summaryEndDate || '2099-12-31');
    end.setHours(23,59,59,999);

    const filteredTrans = transactions.filter(t => {
        const d = normalizeDate(t.date);
        if (!d || d < start || d > end) return false;
        
        if (summaryChannel !== 'all') {
            if ((t.channel || 'หน้าร้าน').toUpperCase() !== summaryChannel.toUpperCase()) return false;
        }
        
        if (summaryCategory !== 'all') {
            if (t.type !== 'expense' || t.category !== summaryCategory) return false;
        }
        
        return true;
    });

    filteredTrans.forEach(t => {
        transactionCount++;
        if (t.type === 'expense') {
            const amt = Number(t.grandTotal) || Number(t.total) || 0;
            explicitExpenseTotal += amt;
            const cat = t.category || 'อื่นๆ';
            categories[cat] = (categories[cat] || 0) + amt;
        } else if (t.type === 'income') {
            platformFeeTotal += (Number(t.platformFee) || 0);
            estShippingTotal += (Number(t.estimatedShippingFee) || 0);
            buyerShippingTotal += (Number(t.shippingFee) || 0);
            subsidyShippingTotal += (Number(t.shippingFeeSubsidy) || 0);
            returnShippingTotal += (Number(t.returnShippingFee) || 0);
            discountTotal += (Number(t.couponDiscount) || 0) + (Number(t.cashCoupon) || 0);
            whtTotal += (Number(t.whtAmount) || 0);
        }
    });

    const hiddenCosts = platformFeeTotal + estShippingTotal + returnShippingTotal + discountTotal;
    const totalBusinessCost = explicitExpenseTotal + hiddenCosts;
    const shippingBalance = (buyerShippingTotal + subsidyShippingTotal) - (estShippingTotal + returnShippingTotal);

    const topCategories = Object.entries(categories)
        .map(([name, value]) => ({ name, value, percentage: explicitExpenseTotal > 0 ? (value / explicitExpenseTotal) * 100 : 0 }))
        .sort((a, b) => b.value - a.value);
        
    return { 
        explicitExpenseTotal, platformFeeTotal, estShippingTotal, buyerShippingTotal, 
        subsidyShippingTotal, returnShippingTotal, discountTotal, totalBusinessCost, 
        hiddenCosts, shippingBalance, whtTotal, topCategories, count: transactionCount 
    };
  }, [transactions, summaryStartDate, summaryEndDate, summaryChannel, summaryCategory]);

  return (
    <div className="space-y-6 animate-fadeIn font-sarabun text-left w-full h-full pb-10">
      
      {/* Top Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b pb-4 gap-4 text-left">
        <div className="space-y-1 text-left">
          <h2 className="text-3xl font-black text-slate-800 text-left">Records Manager</h2>
          <p className="text-sm text-slate-400 font-medium text-left">บันทึกรายการรายรับ-รายจ่าย and ประวัติการทำรายการ</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit text-left overflow-x-auto max-w-full">
          <button onClick={()=>setSubTab('new')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap text-center ${subTab==='new'?'bg-white shadow-md text-indigo-600 scale-[1.02]':'text-slate-500 hover:text-slate-700'}`}>เพิ่มรายการใหม่</button>
          <button onClick={()=>setSubTab('history')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap text-center ${subTab==='history'?'bg-white shadow-md text-indigo-600 scale-[1.02]':'text-slate-500 hover:text-slate-700'}`}>ประวัติรายการ</button>
          <button onClick={()=>setSubTab('summary')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap text-center ${subTab==='summary'?'bg-white shadow-md text-indigo-600 scale-[1.02]':'text-slate-500 hover:text-slate-700'}`}>สรุปค่าใช้จ่ายเชิงลึก</button>
        </div>
      </div>

      {/* Partner Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[700] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[40px] w-full max-w-lg flex flex-col shadow-2xl animate-in zoom-in-95 max-h-[85vh] text-left">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 text-left">
                <div className="text-left">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 text-left"><Users size={20} className="text-indigo-600"/> เลือกคู่ค้า</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase text-left">Partner Search Performance Mode</p>
                </div>
                <button onClick={()=>setShowPartnerModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-center"><X/></button>
            </div>
            <div className="p-4 bg-white border-b sticky top-0 z-10 text-left">
                <div className="relative group text-left">
                    <Search className="absolute left-4 top-3 text-slate-300 group-focus-within:text-indigo-500 transition-colors text-center" size={20}/>
                    <input autoFocus value={partnerSearchTerm} onChange={e=>setPartnerSearchTerm(e.target.value)} className="w-full bg-slate-50 p-3 pl-12 rounded-2xl border-0 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-left" placeholder="ค้นหาชื่อคู่ค้า หรือ เลขผู้เสียภาษี..." />
                </div>
                <div className="flex bg-slate-100 p-1 mt-3 rounded-xl">
                    <button onClick={() => setPartnerTab('buyer')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center ${partnerTab === 'buyer' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ลูกค้า (รายรับ)</button>
                    <button onClick={() => setPartnerTab('seller')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center ${partnerTab === 'seller' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ผู้ขาย (รายจ่าย)</button>
                    <button onClick={() => setPartnerTab('all')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center ${partnerTab === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ทั้งหมด</button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-left">
                {filteredPartners.length > 0 ? filteredPartners.map((p, idx) => (
                    <div key={idx} onClick={()=>selectPartner(p)} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 cursor-pointer transition-all group flex justify-between items-center bg-white shadow-sm text-left">
                        <div className="space-y-1 text-left">
                            <p className="font-black text-slate-800 group-hover:text-indigo-700 text-sm transition-colors text-left">{p.name}</p>
                            <div className="flex items-center gap-3 text-left">
                                <span className="text-[9px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-tighter text-left">TAX: {p.taxId}</span>
                                <div className="flex items-center gap-1 text-indigo-500 font-bold text-[10px]">
                                    <MapPin size={10}/>
                                    <span>สาขา: {p.branch === '00000' || !p.branch ? 'สำนักงานใหญ่' : p.branch} {p.branchName && `(${p.branchName})`}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right shrink-0 text-right">
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors text-center"/>
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300 text-center">
                        <Users size={48} className="opacity-10 mb-2 text-center"/>
                        <p className="text-sm font-bold text-center">ไม่พบข้อมูลคู่ค้าที่ค้นหา</p>
                    </div>
                )}
            </div>
            <div className="p-4 border-t bg-slate-50/50 rounded-b-[40px] text-center">
                <p className="text-[9px] text-slate-400 font-bold uppercase text-center">Showing {filteredPartners.length} of {partners.length} partners</p>
            </div>
          </div>
        </div>
      )}

      {/* Stock Select Modal */}
      {showStockSelectModal !== false && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[700] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[40px] w-full max-w-lg flex flex-col shadow-2xl animate-in zoom-in-95 max-h-[85vh] text-left">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 text-left">
                <div className="text-left">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 text-left"><Box size={20} className="text-indigo-600"/> เลือกจากคลังสินค้า</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase text-left">{formData.type === 'income' ? 'Performance Picking Mode' : 'Restock / Purchase Mode'}</p>
                </div>
                <button onClick={()=>setShowStockSelectModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-center"><X/></button>
            </div>
            <div className="p-4 bg-white border-b sticky top-0 z-10 text-left">
                <div className="relative group text-left">
                    <Search className="absolute left-4 top-3 text-slate-300 group-focus-within:text-indigo-500 transition-colors text-center" size={20}/>
                    <input autoFocus value={stockSearchTerm} onChange={e=>setStockSearchTerm(e.target.value)} className="w-full bg-slate-50 p-3 pl-12 rounded-2xl border-0 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-left" placeholder="ค้นหาชื่อสินค้า หรือ SKU..." />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-left">
                {filteredStock.length > 0 ? filteredStock.map((item, idx) => (
                    <div key={idx} onClick={()=>selectStockItem(item, showStockSelectModal)} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 cursor-pointer transition-all group flex justify-between items-center bg-white shadow-sm text-left">
                        <div className="space-y-1 text-left">
                            <p className="font-black text-slate-800 group-hover:text-indigo-700 text-sm transition-colors text-left">{item.name}</p>
                            <div className="flex items-center gap-2 text-left">
                                <span className="text-[9px] font-mono font-bold text-indigo-500 mb-0.5 bg-indigo-50 w-fit px-1.5 rounded">SKU: {item.sku}</span>
                                <span className="text-[9px] font-black text-indigo-500 text-left">฿ {formatCurrency(item.sellPrice)}</span>
                            </div>
                        </div>
                        <div className="text-right shrink-0 text-right">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase text-center ${item.qty > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                คงเหลือ: {item.qty}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300 text-center">
                        <Search size={48} className="opacity-10 mb-2 text-center"/>
                        <p className="text-sm font-bold text-center">ไม่พบข้อมูลสินค้าที่มีในคลัง</p>
                    </div>
                )}
            </div>
            <div className="p-4 border-t bg-slate-50/50 rounded-b-[40px] text-center">
                <p className="text-[9px] text-slate-400 font-bold uppercase text-center">Showing {filteredStock.length} of {uniqueInventory.length} products</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs Content */}
      {subTab === 'new' ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start text-left">
          <div className="xl:col-span-3 space-y-8 text-left">
            <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-8 text-left">
              <div className="flex flex-col md:flex-row gap-6 items-center text-left">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit shrink-0 text-left">
                  <button onClick={()=>setFormData({...formData, type:'income', category: 'รายได้จากการขายสินค้า'})} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all text-center ${formData.type==='income'?'bg-emerald-600 text-white shadow-lg':'text-slate-400'}`}><TrendingUp size={18}/> รายรับ</button>
                  <button onClick={()=>setFormData({...formData, type:'expense', category: 'ต้นทุนสินค้า'})} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all text-center ${formData.type==='expense'?'bg-rose-600 text-white shadow-lg':'text-slate-400'}`}><TrendingDown size={18}/> รายจ่าย</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full text-left">
                  <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">วันที่</label><input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none text-left"/></div>
                  <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">ช่องทาง</label><select value={formData.channel} onChange={e=>setFormData({...formData, channel: e.target.value})} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 outline-none text-left">{CONSTANTS.CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{formData.type === 'expense' ? 'เลขที่ใบกำกับภาษี (ถ้ามี)' : 'Order ID'}</label><input placeholder="ระบุเลขที่..." value={formData.type === 'expense' ? formData.taxInvoiceNo : formData.orderId} onChange={e=>setFormData({...formData, [formData.type === 'expense' ? 'taxInvoiceNo' : 'orderId']: e.target.value})} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 outline-none text-left"/></div>
                  <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">หมวดหมู่</label><select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 outline-none text-left">{(formData.type === 'income' ? CONSTANTS.CATEGORIES.INCOME : CONSTANTS.CATEGORIES.EXPENSE).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
              </div>
              <div className="pt-6 border-t space-y-4 text-left">
                <div className="flex justify-between items-center text-left">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 text-left"><Users size={18} className="text-indigo-600"/> {formData.type === 'income' ? 'ข้อมูลลูกค้า' : 'ข้อมูลผู้ขาย'}</h4>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleSavePartnerManual} className="text-[10px] bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full font-bold hover:bg-emerald-100 transition-colors text-center flex items-center gap-1"><SaveAll size={12}/> บันทึกข้อมูลใหม่</button>
                    <button type="button" onClick={()=>{setShowPartnerModal(true); setPartnerTab(formData.type === 'income' ? 'buyer' : 'seller');}} className="text-[10px] bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-bold hover:bg-indigo-100 transition-colors text-center">ดึงจากฐานข้อมูลคู่ค้า</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-left">
                  <input value={formData.partnerName} onChange={e=>setFormData({...formData, partnerName: e.target.value})} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-sm font-bold outline-none text-left" placeholder="ชื่อคู่ค้า..." />
                  <input value={formData.partnerTaxId} onChange={e=>setFormData({...formData, partnerTaxId: e.target.value})} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-sm font-mono outline-none text-left" placeholder="เลขผู้เสียภาษี..." />
                  <input value={formData.partnerBranch} onChange={e=>setFormData({...formData, partnerBranch: e.target.value})} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-sm font-mono outline-none text-left" placeholder="รหัสสาขา..." />
                  <input value={formData.partnerBranchName} onChange={e=>setFormData({...formData, partnerBranchName: e.target.value})} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-sm font-bold outline-none text-left" placeholder="ชื่อสาขา..." />
                  <input value={formData.partnerAddress} onChange={e=>setFormData({...formData, partnerAddress: e.target.value})} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-sm outline-none text-left" placeholder="ที่อยู่..." />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-6 text-left">
              <div className="flex justify-between items-center text-left">
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl text-center"><ShoppingCart size={20}/></div>
                  <h4 className="text-lg font-black text-slate-800 text-left">รายการสินค้า</h4>
                </div>
                <button type="button" onClick={addLineItem} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all scale-100 hover:scale-[1.02] active:scale-95 text-center"><Plus size={18}/> เพิ่มรายการ</button>
              </div>
              <div className="overflow-x-auto text-left">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest pl-2 text-left">Description</th>
                      <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center w-28 text-center">Quantity</th>
                      <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right w-40 text-right">Unit Price</th>
                      <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right w-40 pr-2 text-right">Total</th>
                      <th className="pb-4 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-left">
                    {formData.items.map((item, index) => (
                      <tr key={index} className="group transition-colors hover:bg-slate-50/50 text-left">
                        <td className="py-4 pl-2 text-left">
                          <div className="relative text-left">
                            <input value={item.desc} onChange={e=>updateLineItem(index, 'desc', e.target.value)} className="w-full bg-transparent p-2 rounded-xl text-sm font-bold border-0 focus:ring-0 outline-none text-slate-700 text-left" placeholder="ชื่อสินค้าหรือบริการ..." />
                            <button type="button" onClick={()=>setShowStockSelectModal(index)} className="absolute -top-3 right-0 text-[9px] text-indigo-600 font-black opacity-0 group-hover:opacity-100 transition-opacity uppercase bg-white border px-2 py-0.5 rounded-full shadow-sm text-center">Pick from Stock</button>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex justify-center text-center">
                            <input type="number" value={item.qty} onChange={e=>updateLineItem(index, 'qty', e.target.value)} className="w-20 bg-slate-100/50 p-2 rounded-xl border-0 text-sm text-center font-black outline-none text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-center"/>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="relative flex items-center justify-end text-right">
                            <span className="absolute left-3 text-slate-400 font-bold text-xs text-left">฿</span>
                            <input type="number" value={formData.type === 'income' ? item.sellPrice : item.buyPrice} onChange={e=>updateLineItem(index, formData.type === 'income' ? 'sellPrice' : 'buyPrice', e.target.value)} className="w-full bg-slate-100/50 p-2 rounded-xl border-0 text-sm text-right font-black outline-none text-slate-800 pl-8 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-right"/>
                          </div>
                        </td>
                        <td className="py-4 text-right pr-2 text-right">
                          <p className="font-black text-slate-900 text-sm text-right">{formatCurrency((formData.type === 'income' ? item.sellPrice : item.buyPrice) * item.qty)}</p>
                        </td>
                        <td className="py-4 text-center">
                          <button type="button" onClick={()=>removeLineItem(index)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors disabled:opacity-0 text-center" disabled={formData.items.length === 1}><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="xl:col-span-1 space-y-6 sticky top-0 text-left">
            <div className="bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden flex flex-col text-left">
              <div className="p-8 bg-indigo-600 text-white flex justify-between items-center text-left">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-left">{formData.type === 'income' ? 'Grand Total (ยอดสุทธิ)' : 'Net Payable (ยอดจ่ายสุทธิ)'}</p>
                  <h3 className="text-4xl font-black text-left">{formatCurrency(financialSummary.grandTotal)}</h3>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-center"><Wallet size={24}/></div>
              </div>
              <div className="p-8 space-y-6 text-white/90 text-left">
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center text-sm text-left">
                    <span className="opacity-60 text-left">{formData.type === 'income' ? 'Subtotal (ก่อนหัก)' : 'Subtotal (มูลค่าสินค้ารวม)'}</span>
                    <span className="font-bold text-right">{formatCurrency(financialSummary.subTotal)}</span>
                  </div>
                  
                  {formData.vatType !== 'none' && (
                      <div className="flex justify-between items-center text-sm text-indigo-300 mt-2 text-left">
                          <span className="opacity-80 text-left">{formData.vatType === 'included' ? 'ภาษีมูลค่าเพิ่ม 7% (รวมในยอด)' : '+ ภาษีมูลค่าเพิ่ม 7% (แยกเพิ่ม)'}</span>
                          <span className="font-bold text-right">{formatCurrency(financialSummary.vatAmount)}</span>
                      </div>
                  )}

                  {formData.type === 'income' && financialSummary.shippingFee > 0 && (
                      <div className="flex justify-between items-center text-sm text-emerald-300 text-left mt-2">
                          <span className="opacity-80 text-left">+ ค่าจัดส่ง</span>
                          <span className="font-bold text-right">{formatCurrency(financialSummary.shippingFee)}</span>
                      </div>
                  )}

                  {formData.type === 'income' && (
                    <div className="pt-4 border-t border-white/10 space-y-3 text-left">
                      <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest text-left">ค่าจัดส่ง (Shipping Details)</p>
                      <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-bold opacity-40 uppercase text-left">เรียกเก็บจากผู้ซื้อ (คิด VAT)</label>
                          <input type="number" value={formData.shippingFee} onChange={e=>setFormData({...formData, shippingFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-bold opacity-40 uppercase text-left">ค่าจัดส่งโดยประมาณ</label>
                          <input type="number" value={formData.estimatedShippingFee} onChange={e=>setFormData({...formData, estimatedShippingFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-bold opacity-40 uppercase text-left">Platform ออกให้ (Subsidy)</label>
                          <input type="number" value={formData.shippingFeeSubsidy} onChange={e=>setFormData({...formData, shippingFeeSubsidy: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-bold opacity-40 uppercase text-left">ค่าจัดส่งสินค้าคืน</label>
                          <input type="number" value={formData.returnShippingFee} onChange={e=>setFormData({...formData, returnShippingFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {formData.type === 'income' && (
                    <div className="pt-4 border-t border-white/10 space-y-3 text-left">
                      <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest text-left">Platform Fees and Costs</p>
                      <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="space-y-1 text-left"><label className="text-[9px] font-bold opacity-40 uppercase text-left">Trans. Fee</label><input type="number" value={formData.transactionFee} onChange={e=>setFormData({...formData, transactionFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" /></div>
                        <div className="space-y-1 text-left"><label className="text-[9px] font-bold opacity-40 uppercase text-left">Infra Fee</label><input type="number" value={formData.infrastructureFee} onChange={e=>setFormData({...formData, infrastructureFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" /></div>
                        <div className="space-y-1 text-left"><label className="text-[9px] font-bold opacity-40 uppercase text-left">Comm. Fee</label><input type="number" value={formData.commissionFee} onChange={e=>setFormData({...formData, commissionFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" /></div>
                        <div className="space-y-1 text-left"><label className="text-[9px] font-bold opacity-40 uppercase text-left">Service Fee</label><input type="number" value={formData.serviceFee} onChange={e=>setFormData({...formData, serviceFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" /></div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/10 space-y-3 text-left">
                    <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest text-left">Discounts (ส่วนลด)</p>
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="space-y-1 text-left"><label className="text-[9px] font-bold opacity-40 uppercase text-left">Platform Disc.</label><input type="number" value={formData.couponDiscount} onChange={e=>setFormData({...formData, couponDiscount: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" /></div>
                      <div className="space-y-1 text-left"><label className="text-[9px] font-bold opacity-40 uppercase text-left">Cash Coupon</label><input type="number" value={formData.cashCoupon} onChange={e=>setFormData({...formData, cashCoupon: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" /></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-3 text-left">
                    <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest text-left">VAT & Tax (ภาษี and การปรับปรุง)</p>
                    <div className="grid grid-cols-1 gap-3 text-left">
                      <div className="space-y-2 text-left">
                        <label className="text-[9px] font-bold opacity-40 uppercase text-left">ประเภทภาษี (VAT Type)</label>
                        <div className="flex bg-white/5 p-1 rounded-xl w-full text-left">
                          <button type="button" onClick={() => setFormData({...formData, vatType: 'none'})} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${formData.vatType === 'none' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/40'}`}>ไม่มี VAT</button>
                          <button type="button" onClick={() => setFormData({...formData, vatType: 'included'})} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${formData.vatType === 'included' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/40'}`}>รวม VAT</button>
                          <button type="button" onClick={() => setFormData({...formData, vatType: 'excluded'})} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${formData.vatType === 'excluded' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/40'}`}>แยก VAT</button>
                        </div>
                      </div>
                      <div className="space-y-1 text-left">
                        <label className="text-[9px] font-bold opacity-40 uppercase text-left">หัก ณ ที่จ่าย (WHT Amount)</label>
                        <input type="number" value={formData.whtAmount} onChange={e=>setFormData({...formData, whtAmount: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" />
                      </div>
                      {formData.type === 'expense' && (
                        <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit group text-left">
                          <input type="checkbox" checked={formData.isNonCreditableVat} onChange={e=>setFormData({...formData, isNonCreditableVat: e.target.checked})} className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 cursor-pointer" />
                          <span className="text-[10px] font-bold opacity-80 group-hover:opacity-100 transition-opacity text-left">ภาษีซื้อต้องห้าม (Non-creditable VAT)</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/20 text-left">
                  <button onClick={handleSubmit} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-95 group text-center">
                    <Save size={24} className="text-indigo-600 transition-transform group-hover:scale-110 text-center"/> บันทึกรายการ
                  </button>
                  <p className="text-[10px] text-white/30 mt-4 text-center">ระบบจะบันทึกลงฐานข้อมูล and หักลบสต็อก FIFO อัตโนมัติ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : subTab === 'summary' ? (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Filter Bar for Summary */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl font-bold text-xs shrink-0">
                <Filter size={16}/> ตัวกรองข้อมูล
              </div>
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto shrink-0">
                  {['thisMonth', 'lastMonth', '3months', 'year', 'all'].map(r => (
                      <button key={r} onClick={() => {
                          if(r === 'all') {
                              setSummaryStartDate('2000-01-01');
                              setSummaryEndDate('2099-12-31');
                          } else {
                              setSummaryQuickRange(r);
                          }
                      }} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all whitespace-nowrap">
                          {r === 'thisMonth' ? 'เดือนนี้' : r === 'lastMonth' ? 'เดือนที่แล้ว' : r === '3months' ? '3 เดือน' : r === 'all' ? 'ทั้งหมด' : 'ปีนี้'}
                      </button>
                  ))}
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shrink-0">
                  <Calendar size={14} className="text-slate-400 ml-1 shrink-0"/>
                  <input type="date" value={summaryStartDate} onChange={e=>setSummaryStartDate(e.target.value)} className="bg-transparent border-0 text-xs font-bold outline-none text-slate-700 w-28 cursor-pointer focus:ring-0"/>
                  <span className="text-slate-300"><ArrowRight size={12}/></span>
                  <input type="date" value={summaryEndDate} onChange={e=>setSummaryEndDate(e.target.value)} className="bg-transparent border-0 text-xs font-bold outline-none text-slate-700 w-28 cursor-pointer focus:ring-0"/>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex-1 xl:flex-none">
                  <Store size={14} className="text-slate-400 shrink-0"/>
                  <select value={summaryChannel} onChange={e=>setSummaryChannel(e.target.value)} className="bg-transparent border-0 text-xs font-bold outline-none text-slate-700 w-full cursor-pointer focus:ring-0">
                      <option value="all">ทุกช่องทาง</option>
                      {CONSTANTS.CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="IMPORTED">IMPORTED</option>
                  </select>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex-1 xl:flex-none">
                  <Tag size={14} className="text-slate-400 shrink-0"/>
                  <select value={summaryCategory} onChange={e=>setSummaryCategory(e.target.value)} className="bg-transparent border-0 text-xs font-bold outline-none text-slate-700 w-full cursor-pointer max-w-[180px] focus:ring-0">
                      <option value="all">ทุกหมวดหมู่ (รวมต้นทุนแฝง)</option>
                      {CONSTANTS.CATEGORIES.EXPENSE.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
             <div className="bg-gradient-to-br from-rose-500 to-orange-500 p-6 rounded-3xl text-white shadow-xl shadow-rose-200 relative overflow-hidden flex flex-col justify-center">
                <TrendingDown size={80} className="absolute -bottom-4 -right-4 opacity-20"/>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Business Costs</p>
                <h3 className="text-3xl font-black mb-1">{formatCurrency(expenseSummary.totalBusinessCost)}</h3>
                <p className="text-xs opacity-90">ต้นทุนและค่าใช้จ่ายรวมทั้งหมด</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">Direct Expenses</p>
                        <h3 className="text-2xl font-black text-slate-800">{formatCurrency(expenseSummary.explicitExpenseTotal)}</h3>
                    </div>
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><List size={18}/></div>
                </div>
                <p className="text-[10px] text-slate-500">ค่าใช้จ่ายที่บันทึกโดยตรง</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">Platform Fees</p>
                        <h3 className="text-2xl font-black text-indigo-600">{formatCurrency(expenseSummary.platformFeeTotal)}</h3>
                    </div>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Zap size={18}/></div>
                </div>
                <p className="text-[10px] text-slate-500">ค่าธรรมเนียมที่แพลตฟอร์มหัก</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">Shipping Balance</p>
                        <h3 className={`text-2xl font-black ${expenseSummary.shippingBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {expenseSummary.shippingBalance > 0 ? '+' : ''}{formatCurrency(expenseSummary.shippingBalance)}
                        </h3>
                    </div>
                    <div className={`p-2 rounded-xl ${expenseSummary.shippingBalance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><Truck size={18}/></div>
                </div>
                <p className="text-[10px] text-slate-500">ส่วนต่างค่าจัดส่ง (รับ - จ่ายจริง)</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Left Column: Direct Expenses Breakdown */}
             <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl"><PieChart size={24}/></div>
                    <div>
                        <h4 className="text-lg font-black text-slate-800">ค่าใช้จ่ายแยกตามหมวดหมู่</h4>
                        <p className="text-xs text-slate-400 font-medium">Direct Expense Breakdown</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5">
                    {expenseSummary.topCategories.length > 0 ? expenseSummary.topCategories.map((cat, idx) => (
                        <div key={idx} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <p className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>{cat.name}
                                </p>
                                <div className="text-right">
                                    <p className="font-black text-slate-900">{formatCurrency(cat.value)}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{cat.percentage.toFixed(1)}%</p>
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className="bg-slate-400 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${cat.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-slate-300">
                            <Inbox size={48} className="opacity-20 mb-3"/>
                            <p className="text-sm font-bold">ยังไม่มีข้อมูลรายจ่ายทางตรง</p>
                        </div>
                    )}
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 text-left animate-fadeIn h-full flex flex-col">
          
          {/* Top Filter & Search Row */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
             <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full xl:w-auto">
                 <div className="relative w-full md:w-80 text-left shrink-0">
                     <Search className="absolute left-4 top-3 text-slate-400 text-center" size={18}/>
                     <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm text-left" placeholder="ค้นหา: ชื่อ, เลขระบบ, Order ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                 </div>
                 <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                    <button onClick={() => setHistType('all')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${histType === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ทั้งหมด</button>
                    <button onClick={() => setHistType('income')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${histType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>รายรับ</button>
                    <button onClick={() => setHistType('expense')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${histType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>รายจ่าย</button>
                 </div>
                 <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 shrink-0">
                      <Calendar size={14} className="text-slate-400 ml-2 shrink-0"/>
                      <input type="date" value={histStartDate} onChange={e=>setHistStartDate(e.target.value)} className="bg-transparent border-0 text-xs font-bold outline-none text-slate-700 w-28 cursor-pointer focus:ring-0" placeholder="Start Date"/>
                      <span className="text-slate-300"><ArrowRight size={12}/></span>
                      <input type="date" value={histEndDate} onChange={e=>setHistEndDate(e.target.value)} className="bg-transparent border-0 text-xs font-bold outline-none text-slate-700 w-28 cursor-pointer focus:ring-0" placeholder="End Date"/>
                      {(histStartDate || histEndDate) && (
                          <button onClick={()=>{setHistStartDate(''); setHistEndDate('');}} className="p-1 text-slate-400 hover:text-rose-500 mr-1"><X size={14}/></button>
                      )}
                 </div>
             </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">รวมรายรับ (Filtered)</p>
                      <p className="text-xl font-black text-emerald-700">{formatCurrency(histStats.inc)}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg text-emerald-500 shadow-sm"><TrendingUp size={20}/></div>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/70">รวมรายจ่าย (Filtered)</p>
                      <p className="text-xl font-black text-rose-700">{formatCurrency(histStats.exp)}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg text-rose-500 shadow-sm"><TrendingDown size={20}/></div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center text-white">
                  <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">จำนวนรายการ</p>
                      <p className="text-xl font-black">{histStats.count.toLocaleString()} <span className="text-xs text-slate-400 font-medium">รายการ</span></p>
                  </div>
                  <div className="p-2 bg-white/10 rounded-lg text-indigo-300"><List size={20}/></div>
              </div>
          </div>

          <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden text-left flex flex-col flex-1">
            <div className="overflow-x-auto text-left flex-1 custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left sticky top-0 z-10 border-b">
                        <tr>
                            <th className="p-5 text-left">วันที่ / ช่องทาง</th>
                            <th className="p-5 text-left">รายการ/เลขที่อ้างอิง</th>
                            <th className="p-5 text-left">คู่ค้า</th>
                            <th className="p-5 text-right text-right">ยอดรวม</th>
                            <th className="p-5 text-center text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-left">
                        {currentHistData.length > 0 ? currentHistData.map(t => (
                        <tr key={t.id} className="group hover:bg-slate-50/80 transition-colors text-left">
                            <td className="p-5 text-left">
                                <p className="font-black text-slate-700 text-left">{formatDate(t.date)}</p>
                                <p className="text-[10px] font-mono font-bold text-indigo-600 mt-0.5">{t.sysDocId || 'NO-REF'}</p>
                                <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 uppercase text-center">{t.channel || 'หน้าร้าน'}</span>
                            </td>
                            <td className="p-5 text-left">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800 line-clamp-1 text-left">{t.description || '-'}</p>
                                    {t.status === 'unpaid' && <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200">ค้างชำระ</span>}
                                </div>
                                <div className="flex items-center flex-wrap gap-2 mt-1 text-left">
                                    <p className="text-[10px] font-mono text-slate-400 text-left">Ref/Order: {t.orderId || t.taxInvoiceNo || '-'}</p>
                                    {t.issuedDocs && t.issuedDocs.length > 0 && t.issuedDocs.map((doc, idx) => (<span key={idx} className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-center ${doc.type === 'invoice' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-700'}`}>{doc.type === 'invoice' ? 'ออกใบกำกับแล้ว' : 'ลดหนี้แล้ว'}: {doc.no}</span>))}
                                </div>
                            </td>
                            <td className="p-5 text-left">
                                <p className="font-bold text-indigo-600 text-left">{t.partnerName || 'คู่ค้าทั่วไป'}</p>
                                <p className="text-[10px] text-slate-400 truncate max-w-[150px] text-left">Addr: {t.partnerAddress || '-'}</p>
                            </td>
                            <td className="p-5 text-right">
                                <div className={`inline-flex flex-col items-end px-3 py-1.5 rounded-2xl text-right ${t.type==='income'?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>
                                    <p className="text-[9px] font-black uppercase opacity-60 leading-none mb-1 text-right">{t.type==='income'?'Income':'Expense'}</p>
                                    <p className="text-base font-black leading-none text-right">{formatCurrency(t.grandTotal || t.total)}</p>
                                </div>
                            </td>
                            <td className="p-5 text-center">
                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all text-center">
                                    <button onClick={()=>setViewItem(t)} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all shadow-sm text-center"><Eye size={16}/></button>
                                    {t.type === 'income' && (<button onClick={()=>onIssueInvoice(t)} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 hover:shadow-md transition-all shadow-sm text-center" title="ออกใบกำกับภาษี"><Printer size={16}/></button>)}
                                    <button onClick={()=>setDeleteConfirmId({id: t.id, type: t.type})} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 hover:shadow-md transition-all shadow-sm text-center" title="ลบทิ้ง (คืนสต็อก)"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                        )) : (
                            <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination Controls */}
            {histTotalPages > 1 && (
                <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500">แสดงรายการ {((histPage - 1) * histItemsPerPage) + 1} - {Math.min(histPage * histItemsPerPage, filteredHistory.length)} จากทั้งหมด {filteredHistory.length} รายการ</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setHistPage(p => Math.max(1, p - 1))} disabled={histPage === 1} className="px-3 py-1.5 bg-white border rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">ย้อนกลับ</button>
                        <span className="text-xs font-bold text-slate-600 px-2">หน้า {histPage} / {histTotalPages}</span>
                        <button onClick={() => setHistPage(p => Math.min(histTotalPages, p + 1))} disabled={histPage === histTotalPages} className="px-3 py-1.5 bg-white border rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">ถัดไป</button>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}
      
      {/* View Item Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[40px] w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 text-left">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 text-left">
              <div className="text-left">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2 text-left"><Hash className="text-indigo-600"/> รายละเอียดรายการ</h3>
                <div className="flex items-center gap-3 mt-2 text-left">
                  <span className="text-sm font-black text-indigo-700 bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-lg tracking-wider">SYS ID: {viewItem.sysDocId || 'NO-REF'}</span>
                  <p className="text-[10px] text-slate-400 font-mono text-left bg-slate-100 px-2 py-1 rounded-md">Ref: {viewItem.orderId || viewItem.taxInvoiceNo || '-'}</p>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold text-center ${viewItem.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{viewItem.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</span>
                  <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold text-center">{viewItem.channel || 'หน้าร้าน'}</span>
                </div>
              </div>
              <button onClick={()=>setViewItem(null)} className="p-2 hover:bg-slate-200 rounded-full text-center"><X/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 text-left">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                <div className="space-y-6 text-left"><h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2 text-left"><Info size={18} className="text-indigo-600"/> ข้อมูลพื้นฐาน</h4><div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-sm space-y-4 text-left"><div className="text-left"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">วันที่ทำรายการ</p><p className="font-bold text-slate-800 text-left">{formatDate(viewItem.date)}</p></div><div className="text-left"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">หมวดหมู่</p><p className="font-bold text-slate-800 text-left">{viewItem.category || '-'}</p></div><div className="pt-2 border-t text-left"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">{viewItem.type === 'income' ? 'ลูกค้า' : 'ผู้ขาย'}</p><p className="font-bold text-slate-800 text-base text-left">{viewItem.partnerName || '-'}</p><div className="flex flex-wrap gap-2 mt-1 text-left"><p className="text-[10px] font-mono text-indigo-500 font-bold text-left">TAX: {viewItem.partnerTaxId || '-'}</p><p className="text-[10px] font-bold text-indigo-400 text-left">สาขา: {viewItem.partnerBranch === '00000' || !viewItem.partnerBranch ? 'สำนักงานใหญ่' : viewItem.partnerBranch} {viewItem.partnerBranchName && `(${viewItem.partnerBranchName})`}</p></div>
                
                <div className="mt-2 p-3 bg-white/50 rounded-xl border border-slate-100 text-left">
                  <div className="flex items-center gap-1 mb-1">
                      <TruckIcon size={12} className="text-slate-400"/>
                      <p className="text-[9px] font-bold text-slate-400 uppercase text-left">ข้อมูลจัดส่ง (Shipping Details)</p>
                  </div>
                  {((viewItem.courier && viewItem.courier !== '-') || (viewItem.trackingNo && viewItem.trackingNo !== '-')) && (
                      <div className="flex flex-wrap gap-2 mb-2 mt-1">
                          {viewItem.courier && viewItem.courier !== '-' && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold">ขนส่ง: {viewItem.courier}</span>}
                          {viewItem.trackingNo && viewItem.trackingNo !== '-' && <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono">Tracking: {viewItem.trackingNo}</span>}
                      </div>
                  )}
                  <p className="text-xs text-slate-600 leading-relaxed text-left">{viewItem.shippingAddress || viewItem.partnerAddress || viewItem.address || 'ไม่ระบุที่อยู่'}</p>
                </div>
                
                </div></div></div>
                <div className="space-y-6 text-left">
                  <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2 text-left"><Zap size={18} className="text-amber-500"/> รายละเอียดค่าใช้จ่าย/หักลด</h4>
                  <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-sm space-y-3 text-left">
                    <div className="flex justify-between text-left text-left"><span className="text-slate-500 text-left">ค่าธรรมเนียมธุรกรรม</span><span className="font-bold text-right">{formatCurrency(viewItem.transactionFee || 0)}</span></div>
                    <div className="flex justify-between text-left text-left"><span className="text-slate-500 text-left">ค่าโครงสร้างพื้นฐาน</span><span className="font-bold text-right">{formatCurrency(viewItem.infrastructureFee || 0)}</span></div>
                    <div className="flex justify-between text-left text-left"><span className="text-slate-500 text-left">ค่าคอมมิชชั่น/บริการ</span><span className="font-bold text-right">{formatCurrency((Number(viewItem.commissionFee) || 0) + (Number(viewItem.serviceFee) || 0))}</span></div>
                    <div className="flex justify-between border-t pt-2 font-bold text-indigo-600 text-left text-left"><span>รวมค่าธรรมเนียม Platform</span><span>{formatCurrency(viewItem.platformFee || 0)}</span></div>
                    <div className="pt-2 border-t space-y-2 text-left text-left">
                      <div className="flex justify-between text-rose-500 text-left text-left"><span className="text-[10px] font-bold uppercase text-left">ส่วนลดคูปอง</span><span className="font-bold text-right text-right">-{formatCurrency(viewItem.couponDiscount || 0)}</span></div>
                      <div className="flex justify-between text-orange-500 text-left text-left"><span className="text-[10px] font-bold uppercase text-left">คูปองเงินสด</span><span className="font-bold text-right text-right">-{formatCurrency(viewItem.cashCoupon || 0)}</span></div>
                      <div className="flex justify-between text-rose-600 text-left text-left"><span className="text-[10px] font-bold uppercase text-left">หัก ณ ที่จ่าย (WHT)</span><span className="font-bold text-right text-right">-{formatCurrency(viewItem.whtAmount || 0)}</span></div>
                      
                      {viewItem.type === 'income' && (
                          <>
                              <div className="flex justify-between text-emerald-500 pt-2 border-t text-left">
                                  <span className="text-[10px] font-bold uppercase text-left">ค่าจัดส่งที่ผู้ซื้อชำระ</span>
                                  <span className="font-bold text-right text-right">+{formatCurrency(viewItem.shippingFee || 0)}</span>
                              </div>
                              <div className="flex justify-between text-slate-500 text-left">
                                  <span className="text-[10px] font-bold uppercase text-left">ค่าจัดส่งโดยประมาณ</span>
                                  <span className="font-bold text-right text-right">{formatCurrency(viewItem.estimatedShippingFee || 0)}</span>
                              </div>
                              <div className="flex justify-between text-indigo-500 text-left">
                                  <span className="text-[10px] font-bold uppercase text-left">ค่าจัดส่งที่ Platform ออกให้</span>
                                  <span className="font-bold text-right text-right">{formatCurrency(viewItem.shippingFeeSubsidy || 0)}</span>
                              </div>
                              <div className="flex justify-between text-rose-500 text-left">
                                  <span className="text-[10px] font-bold uppercase text-left">ค่าจัดส่งสินค้าคืน</span>
                                  <span className="font-bold text-right text-right">-{formatCurrency(viewItem.returnShippingFee || 0)}</span>
                              </div>
                          </>
                      )}
                    </div>
                    {viewItem.isNonCreditableVat && (
                        <div className="mt-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black border border-rose-100 flex items-center gap-2 text-left">
                            <AlertTriangle size={14} className="text-center"/>
                            รายการนี้เป็น "ภาษีซื้อต้องห้าม" (ไม่นำไปขอคืนภาษี)
                        </div>
                    )}
                  </div>
                </div>
                <div className="space-y-6 text-left"><h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2 text-left"><Wallet size={18} className="text-emerald-500"/> สรุปยอดเงินสุทธิ</h4><div className="bg-slate-900 text-white p-7 rounded-[32px] shadow-xl text-left"><div className="flex justify-between items-center text-sm opacity-60 text-left"><span>มูลค่าสินค้ารวม</span><span>{formatCurrency(viewItem.total)}</span></div>
                
                {viewItem.vatType && viewItem.vatType !== 'none' && (
                    <div className="flex justify-between items-center text-sm text-indigo-300 mt-2 text-left">
                        <span>{viewItem.vatType === 'included' ? 'ภาษีมูลค่าเพิ่ม 7% (รวมในยอด)' : '+ ภาษีมูลค่าเพิ่ม 7% (แยกเพิ่ม)'}</span>
                        <span>{formatCurrency(viewItem.vatType === 'excluded' ? (viewItem.total + (viewItem.type === 'income' ? (viewItem.shippingFee||0) : 0) - (viewItem.couponDiscount||0)) * 0.07 : (viewItem.total + (viewItem.type === 'income' ? (viewItem.shippingFee||0) : 0) - (viewItem.couponDiscount||0)) * 7 / 107)}</span>
                    </div>
                )}
                
                <div className="flex justify-between items-center text-sm opacity-60 mt-4 text-left"><span>{viewItem.type === 'income' ? 'หักค่าธรรมเนียม and ส่วนลด and WHT' : 'หักส่วนลด and WHT'}</span><span>{formatCurrency((viewItem.type === 'income' ? (Number(viewItem.platformFee) || 0) : 0) + (Number(viewItem.couponDiscount) || 0) + (Number(viewItem.cashCoupon) || 0) + (Number(viewItem.whtAmount) || 0))}</span></div><div className="flex justify-between items-center pt-3 mt-4 border-t-2 border-white/20 text-left"><span className="font-black text-indigo-400 uppercase tracking-wider text-left">{viewItem.type === 'income' ? 'เงินเข้าสุทธิ' : 'ยอดจ่ายสุทธิ'}</span><span className="text-4xl font-black text-right">{formatCurrency(viewItem.grandTotal || viewItem.total)}</span></div><div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-left"><p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-left">เอกสารที่ออกแล้ว (Linked Documents)</p>{viewItem.issuedDocs && viewItem.issuedDocs.length > 0 ? viewItem.issuedDocs.map((doc, idx) => (<div key={idx} className="flex justify-between items-center text-xs font-bold border-b border-white/5 pb-1 text-left"><div className="flex items-center gap-2 text-left">{doc.type === 'invoice' ? <FileText size={12} className="text-indigo-400 text-center"/> : <FileType size={12} className="text-rose-400 text-center"/>}<span className={doc.type === 'invoice' ? 'text-indigo-200' : 'text-rose-200'}>{doc.type === 'invoice' ? 'INV' : 'CN'}</span></div><span className="text-white/80 font-mono text-right">{doc.no}</span></div>)) : (<div className="flex items-center gap-2 text-xs font-bold text-slate-500 text-left"><Clock size={14} className="text-center"/> ยังไม่ออกเอกสารภาษี</div>)}</div></div></div>
              </div>
              {viewItem.items && (<div className="space-y-4 text-left"><h4 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2 text-left"><List size={18} className="text-indigo-600"/> รายการสินค้า/บริการ</h4><div className="overflow-hidden border border-slate-100 rounded-3xl text-left"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 text-left"><tr><th className="p-4 text-left">SKU / รายละเอียดสินค้า</th><th className="p-4 text-center text-center">จำนวน</th><th className="p-4 text-right text-right">ราคาต่อหน่วย</th><th className="p-4 text-right text-right">ยอดรวม</th></tr></thead><tbody className="divide-y divide-slate-50 text-left">{viewItem.items.map((it, idx) => (<tr key={idx} className="hover:bg-slate-50/50 text-left">
                <td className="p-4 text-left">
                    <p className="text-[10px] font-mono font-bold text-indigo-500 mb-0.5 bg-indigo-50 w-fit px-1.5 rounded">{it.sku || '-'}</p>
                    <p className="font-bold text-slate-700">{it.desc}</p>
                </td>
                <td className="p-4 text-center font-black text-center">{it.qty}</td><td className="p-4 text-right text-right">{formatCurrency(viewItem.type === 'income' ? it.sellPrice : it.buyPrice)}</td><td className="p-4 text-right font-black text-slate-900 text-right">{formatCurrency((viewItem.type === 'income' ? (Number(it.sellPrice) || 0) : (Number(it.buyPrice) || 0)) * it.qty)}</td></tr>))}</tbody></table></div></div>)}
            </div>
            <div className="p-6 border-t bg-slate-50 flex gap-4 text-center">
              <button onClick={()=>setViewItem(null)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-colors text-center">ปิดหน้านี้</button>
              {viewItem.type === 'income' && (
                <button onClick={()=>{onIssueInvoice(viewItem); setViewItem(null);}} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-center"><Printer size={20}/> ออกเอกสารภาษี (Invoice)</button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Item Confirm Modal */}
      {deleteConfirmId && (<div className="fixed inset-0 bg-black/60 z-[900] flex items-center justify-center p-4 text-left"><div className="bg-white rounded-[32px] p-8 max-sm w-full text-center shadow-2xl animate-in zoom-in-95 text-center"><div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-center"><Trash2 size={32}/></div><h3 className="text-xl font-bold mb-2 text-center text-slate-800">ยืนยันการลบรายการ?</h3><p className="text-xs text-slate-400 mb-8 text-center uppercase tracking-widest font-black">รายการประเภท: {deleteConfirmId.type}</p><div className="flex gap-3 text-center"><button onClick={()=>setDeleteConfirmId(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button><button onClick={()=>handleDelete(deleteConfirmId.id, deleteConfirmId.type)} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100 text-center">ยืนยันลบ</button></div></div></div>)}
    </div>
  );
}

function InvoiceGenerator({ user, transactions, invoices = [], appId = "merchant-tax-dev-v1", showToast, preFillData }) {
  const [mode, setMode] = useState('history'); 
  const savedSeller = useMemo(() => { try { return JSON.parse(localStorage.getItem('merchant_seller_info') || '{}'); } catch (e) { return {}; } }, []);
  const initialInvData = { docType: 'invoice', refInvNo: '', creditNoteReason: '', customerName: '', address: '', taxId: '', branch: '00000', orderId: '', custSubDistrict: '', custDistrict: '', custProvince: '', custZipCode: '', items: [{ desc: '', qty: 1, unit: 'ชิ้น', price: 0 }], date: formatDateISO(new Date()), invNo: '', sellerName: savedSeller.sellerName || '', sellerAddress: savedSeller.sellerAddress || '', sellerTaxId: savedSeller.sellerTaxId || '', sellerBranchId: savedSeller.sellerBranchId || '00000', sellerBranchName: savedSeller.sellerBranchName || '', sellerPhone: savedSeller.sellerPhone || '', sellerEmail: savedSeller.sellerEmail || '', sellerSubDistrict: savedSeller.sellerSubDistrict || '', sellerDistrict: savedSeller.sellerDistrict || '', sellerProvince: savedSeller.sellerProvince || '', sellerZipCode: savedSeller.sellerZipCode || '', discount: 0, notes: 'สินค้าซื้อแล้วไม่รับเปลี่ยนหรือคืนเงิน', vatType: 'excluded', logo: '', signature: '', status: 'unpaid' };

  const [invData, setInvData] = useState(initialInvData);
  const [editingDocId, setEditingDocId] = useState(null);
  const [showSellerEditModal, setShowSellerEditModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [sellerProfiles, setSellerProfiles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerTab, setCustomerTab] = useState('buyer');
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all');

  // --- History Filters State ---
  const [historyStartDate, setHistoryStartDate] = useState('2000-01-01');
  const [historyEndDate, setHistoryEndDate] = useState('2099-12-31');
  const [historyChannel, setHistoryChannel] = useState('all');

  const handleSavePartnerManual = async () => {
    if (!invData.customerName) {
      showToast("กรุณาระบุชื่อลูกค้า/บริษัท", "error");
      return;
    }
    try {
      await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'partners'), {
        name: invData.customerName,
        taxId: invData.taxId,
        address: invData.address,
        branch: invData.branch,
        branchName: '',
        type: 'buyer',
        createdAt: serverTimestamp()
      });
      showToast("บันทึกข้อมูลใหม่ลงฐานข้อมูลสำเร็จ", "success");
    } catch (e) {
      showToast("บันทึกข้อมูลไม่สำเร็จ", "error");
    }
  };

  const setHistoryQuickRange = (range) => {
    const now = new Date();
    let start, end = new Date();
    switch(range) {
        case 'thisMonth': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'lastMonth': 
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1); 
            end = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        case '3months': start = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
        case 'year': start = new Date(now.getFullYear(), 0, 1); break;
        case 'all': start = new Date('2000-01-01'); end = new Date('2099-12-31'); break;
        default: return;
    }
    setHistoryStartDate(formatDateISO(start));
    setHistoryEndDate(formatDateISO(end));
  };

  const handleLoadTransaction = (data) => {
    if (!data) return;
    
    const totalDisc = Number(data.couponDiscount) || 0; 
    
    const mappedItems = (data.items || []).map(it => ({ 
      desc: it.desc || it.description || '', 
      qty: Number(it.qty) || 1, 
      unit: 'ชิ้น', 
      price: data.type === 'income' ? (Number(it.sellPrice) || Number(it.price) || 0) : (Number(it.buyPrice) || Number(it.price) || 0) 
    }));
    
    if (data.type === 'income' && data.shippingFee && Number(data.shippingFee) > 0) {
        mappedItems.push({
            desc: 'ค่าจัดส่ง (Shipping Fee)',
            qty: 1,
            unit: 'ครั้ง',
            price: Number(data.shippingFee)
        });
    }

    const customerAddress = data.shippingAddress || data.partnerAddress || data.address || '';
    
    setInvData(prev => ({ 
        ...prev, 
        sellerName: prev.sellerName || savedSeller.sellerName || '',
        sellerAddress: prev.sellerAddress || savedSeller.sellerAddress || '',
        sellerTaxId: prev.sellerTaxId || savedSeller.sellerTaxId || '',
        sellerBranchId: prev.sellerBranchId || savedSeller.sellerBranchId || '00000',
        sellerBranchName: prev.sellerBranchName || savedSeller.sellerBranchName || '',
        sellerPhone: prev.sellerPhone || savedSeller.sellerPhone || '',
        sellerEmail: prev.sellerEmail || savedSeller.sellerEmail || '',
        sellerSubDistrict: prev.sellerSubDistrict || savedSeller.sellerSubDistrict || '',
        sellerDistrict: prev.sellerDistrict || savedSeller.sellerDistrict || '',
        sellerProvince: prev.sellerProvince || savedSeller.sellerProvince || '',
        sellerZipCode: prev.sellerZipCode || savedSeller.sellerZipCode || '',
        logo: prev.logo || savedSeller.logo || '',
        signature: prev.signature || savedSeller.signature || '',
        docType: 'invoice', 
        refInvNo: '', 
        customerName: data.partnerName || data.receiverName || '', 
        address: customerAddress, 
        taxId: data.partnerTaxId || data.taxId || '', 
        branch: data.partnerBranch || data.branch || '00000', 
        items: mappedItems.length > 0 ? mappedItems : [{ desc: '', qty: 1, unit: 'ชิ้น', price: 0 }], 
        date: formatDateISO(data.date || new Date()), 
        orderId: data.orderId || '', 
        discount: totalDisc 
    })); 
    setEditingDocId(null);
    setMode('create');
  };

  useEffect(() => { if (preFillData) { handleLoadTransaction(preFillData); } }, [preFillData]);

  const totals = useMemo(() => { 
    const { vatType, items, discount } = invData; 
    const safeItems = items || []; 
    let sub = safeItems.reduce((sum, i) => sum + (Number(i.qty || 0) * Number(i.price || 0)), 0); 
    let baseAmount = Math.max(0, sub - Number(discount)); 
    let vat = 0, total = 0, preVat = 0; 
    if (vatType === 'included') { total = baseAmount; preVat = total * 100 / 107; vat = total - preVat; } 
    else if (vatType === 'excluded') { preVat = baseAmount; vat = preVat * 0.07; total = preVat + vat; } 
    else { preVat = baseAmount; vat = 0; total = preVat; } 
    return { sub, afterDisc: baseAmount, vat, total, preVat }; 
  }, [invData.items, invData.discount, invData.vatType]);

  useEffect(() => { 
      if (mode === 'create' && !editingDocId) { 
          const prefix = invData.docType === 'credit_note' ? 'CN-' : (invData.docType === 'abb' ? 'ABB-' : 'INV-'); 
          const nextId = generateNextDocId(invoices, prefix, 'invNo');
          setInvData(prev => ({ ...prev, invNo: nextId })); 
      } 
  }, [invData.docType, invoices, mode, editingDocId]);
  
  useEffect(() => { if (user) { const unsubSellers = onSnapshot(query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'seller_profiles')), (snap) => setSellerProfiles(snap.docs.map(d=>({id:d.id, ...d.data()})))); const unsubCustomers = onSnapshot(query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'partners')), (snap) => setCustomers(snap.docs.map(d=>({id:d.id, ...d.data(), customerName: d.data().name})))); return () => { unsubSellers(); unsubCustomers(); }; } }, [user, appId]);

  const filteredCustomers = useMemo(() => {
      return customers.filter(c => {
          const matchSearch = (c.customerName || '').toLowerCase().includes(customerSearchTerm.toLowerCase()) || 
                              (c.taxId || '').toLowerCase().includes(customerSearchTerm.toLowerCase());
          const matchTab = customerTab === 'all' || c.type === customerTab || (!c.type);
          return matchSearch && matchTab;
      }).sort((a,b) => (a.customerName || '').localeCompare(b.customerName || ''));
  }, [customers, customerSearchTerm, customerTab]);

  const handleSaveInvoice = async () => {
    if (!user) return;
    try {
      const payload = {
        docType: invData.docType || 'invoice',
        refInvNo: invData.refInvNo || '',
        creditNoteReason: invData.creditNoteReason || '',
        customerName: invData.customerName || '',
        address: invData.address || '',
        taxId: invData.taxId || '',
        branch: invData.branch || '00000',
        orderId: invData.orderId || '',
        items: (invData.items || []).map(it => ({ desc: it.desc || '', qty: Number(it.qty) || 0, unit: it.unit || 'ชิ้น', price: Number(it.price) || 0 })),
        date: normalizeDate(invData.date) || new Date(),
        invNo: invData.invNo || '',
        sellerName: invData.sellerName || '',
        sellerAddress: invData.sellerAddress || '',
        sellerTaxId: invData.sellerTaxId || '',
        sellerBranchId: invData.sellerBranchId || '00000',
        sellerBranchName: invData.sellerBranchName || '',
        sellerPhone: invData.sellerPhone || '',
        sellerEmail: invData.sellerEmail || '',
        sellerSubDistrict: invData.sellerSubDistrict || '',
        sellerDistrict: invData.sellerDistrict || '',
        sellerProvince: invData.sellerProvince || '',
        sellerZipCode: invData.sellerZipCode || '',
        notes: invData.notes || '',
        vatType: invData.vatType || 'excluded',
        logo: invData.logo || '',
        signature: invData.signature || '',
        discount: Number(invData.discount) || 0,
        sub: totals.sub,
        afterDisc: totals.afterDisc,
        vat: totals.vat,
        total: totals.total,
        preVat: totals.preVat,
        status: invData.status || 'unpaid'
      };

      const targetId = editingDocId;
      if (targetId) { await setDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'invoices', targetId), { ...payload, updatedAt: serverTimestamp() }, {merge: true}); showToast("อัปเดตสำเร็จ", "success"); } 
      else { await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'invoices'), { ...payload, createdAt: serverTimestamp() }); showToast("บันทึกสำเร็จ", "success"); }
      
      if (payload.orderId) {
          const linkedTrans = transactions.filter(t => t.orderId === payload.orderId && t.type === 'income');
          const batch = writeBatch(dbInstance);
          linkedTrans.forEach(t => { const tRef = doc(dbInstance, 'artifacts', appId, 'public', 'data', 'transactions_income', t.id); batch.update(tRef, { invoiceNo: payload.invNo, isInvoiced: true }); });
          await batch.commit();
      }

      setMode('history'); setEditingDocId(null);
    } catch(e) { console.error(e); showToast("บันทึกไม่สำเร็จ", "error"); }
  };

  const handleSaveAsNewProfile = async () => {
    if (!invData.sellerName) { showToast("กรุณาระบุชื่อร้านค้าเพื่อบันทึกโปรไฟล์", "error"); return; }
    try {
        const profileData = { sellerName: invData.sellerName, sellerAddress: invData.sellerAddress, sellerTaxId: invData.sellerTaxId, sellerBranchId: invData.sellerBranchId, sellerBranchName: invData.sellerBranchName, sellerPhone: invData.sellerPhone, sellerEmail: invData.sellerEmail, sellerSubDistrict: invData.sellerSubDistrict, sellerDistrict: invData.sellerDistrict, sellerProvince: invData.sellerProvince, sellerZipCode: invData.sellerZipCode, logo: invData.logo, signature: invData.signature, createdAt: serverTimestamp() };
        await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'seller_profiles'), profileData);
        showToast("บันทึกเป็นโปรไฟล์ใหม่เรียบร้อย", "success");
    } catch (e) { showToast("ไม่สามารถบันทึกโปรไฟล์ได้", "error"); }
  };

  const combinedDocs = useMemo(() => {
      const issuedDocsMap = {};
      invoices.forEach(inv => { if (inv.orderId && inv.status !== 'cancelled') { if (!issuedDocsMap[inv.orderId]) issuedDocsMap[inv.orderId] = []; issuedDocsMap[inv.orderId].push(inv.docType); } });
      const normalizedInvoices = invoices.map(inv => ({ ...inv, source: 'invoice', displayStatus: inv.status === 'cancelled' ? 'ยกเลิกแล้ว' : (inv.docType === 'credit_note' ? 'ใบลดหนี้' : (inv.docType === 'abb' ? 'ใบกำกับอย่างย่อ' : 'ใบกำกับเต็มรูป')), searchStr: (inv.invNo || '') + (inv.customerName || '') + (inv.orderId || '') }));
      const pendingTransactions = transactions.filter(t => t.type === 'income' && !issuedDocsMap[t.orderId]).map(t => ({ ...t, invNo: t.orderId || '-', customerName: t.partnerName || 'คู่ค้าทั่วไป', total: t.total, displayStatus: 'รอออกใบกำกับ', source: 'transaction', searchStr: (t.orderId || '') + (t.partnerName || '') }));
      return [...normalizedInvoices, ...pendingTransactions].filter(d => { const searchInput = invoiceSearch.toLowerCase(); return d.searchStr.toLowerCase().includes(searchInput); }).sort(sortNewestFirst); 
  }, [invoices, transactions, invoiceSearch]);

  const displayDocs = useMemo(() => {
      const start = new Date(historyStartDate || '2000-01-01');
      start.setHours(0,0,0,0);
      const end = new Date(historyEndDate || '2099-12-31');
      end.setHours(23,59,59,999);

      return combinedDocs.filter(doc => {
          const d = normalizeDate(doc.date);
          if (!d || d < start || d > end) return false;

          if (historyChannel !== 'all' && (doc.channel || 'หน้าร้าน').toUpperCase() !== historyChannel.toUpperCase()) return false;

          if (historyFilter === 'all') return true;
          if (historyFilter === 'pending') return doc.source === 'transaction';
          if (historyFilter === 'cancelled') return doc.status === 'cancelled';
          if (historyFilter === 'invoice') return doc.source === 'invoice' && doc.docType !== 'credit_note' && doc.status !== 'cancelled';
          if (historyFilter === 'credit_note') return doc.source === 'invoice' && doc.docType === 'credit_note' && doc.status !== 'cancelled';
          return true;
      });
  }, [combinedDocs, historyFilter, historyStartDate, historyEndDate, historyChannel]);

  const handleCancelInvoice = async () => {
      if (!cancelConfirmId || !user) return;
      try {
          const batchWriter = writeBatch(dbInstance);
          const invRef = doc(dbInstance, 'artifacts', appId, 'public', 'data', 'invoices', cancelConfirmId.id);
          batchWriter.update(invRef, { status: 'cancelled', updatedAt: serverTimestamp() });
          
          if (cancelConfirmId.orderId) {
              const linkedTrans = transactions.filter(t => t.orderId === cancelConfirmId.orderId && t.type === 'income');
              linkedTrans.forEach(t => { 
                  const tRef = doc(dbInstance, 'artifacts', appId, 'public', 'data', 'transactions_income', t.id); 
                  batchWriter.update(tRef, { invoiceNo: null, isInvoiced: false }); 
              });
          }
          await batchWriter.commit();
          showToast("ยกเลิกเอกสารเรียบร้อยแล้ว", "success");
          setCancelConfirmId(null);
      } catch(e) { 
          showToast("ยกเลิกไม่สำเร็จ", "error"); 
      }
  };

  const handleDownloadPDF = async () => {
    if (!window.html2pdf || !window.JSZip) {
      showToast("กำลังโหลดโปรแกรมช่วยดาวน์โหลด...", "success");
      const loadScript = (src) => new Promise(res => {
        const s = document.createElement('script');
        s.src = src; s.onload = res; document.body.appendChild(s);
      });
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
    }

    try {
      const element = document.getElementById('invoice-preview-area');
      const zip = new window.JSZip();
      const opt = {
        margin: 0,
        filename: `${invData.invNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      showToast("กำลังสร้างไฟล์ Original...", "success");
      const originalBlob = await window.html2pdf().set(opt).from(element).output('blob');
      zip.file(`${invData.invNo}_Original.pdf`, originalBlob);

      const badge = element.querySelector('.status-badge');
      const oldText = badge.innerText;
      badge.innerText = "สำเนา (Copy)";
      
      showToast("กำลังสร้างไฟล์ Copy...", "success");
      const copyBlob = await window.html2pdf().set(opt).from(element).output('blob');
      zip.file(`${invData.invNo}_Copy.pdf`, copyBlob);
      
      badge.innerText = oldText;

      showToast("กำลังรวมไฟล์ ZIP...", "success");
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${invData.invNo}_Documents.zip`;
      link.click();
      
      showToast("ดาวน์โหลดไฟล์ ZIP เรียบร้อยแล้ว", "success");
    } catch (e) {
      console.error(e);
      showToast("เกิดข้อผิดพลาดในการสร้างไฟล์", "error");
    }
  };

  const handleLogoUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setInvData(prev => ({ ...prev, logo: reader.result })); }; reader.readAsDataURL(file); } };
  const handleSignatureUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setInvData(prev => ({ ...prev, signature: reader.result })); }; reader.readAsDataURL(file); } };
  const handleNewInvoice = () => { const currentSavedSeller = JSON.parse(localStorage.getItem('merchant_seller_info') || '{}'); setEditingDocId(null); setInvData({ ...initialInvData, ...currentSavedSeller }); setMode('create'); }
  const handleEditInvoice = (inv) => { setInvData({ ...inv, date: formatDateISO(inv.date) }); setEditingDocId(inv.id); setMode('create'); }
  const handleCreateCreditNote = (inv) => { setEditingDocId(null); setInvData({ ...inv, id: undefined, docType: 'credit_note', refInvNo: inv.invNo, creditNoteReason: '', date: formatDateISO(new Date()), invNo: '' }); setMode('create'); }
  const updateItem = (i, field, val) => { setInvData(prev => ({ ...prev, items: prev.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) })); };

  const handleDeleteProfile = async (id) => {
    try {
      await deleteDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'seller_profiles', id));
      showToast("ลบโปรไฟล์สำเร็จ", "success");
      setProfileToDelete(null);
    } catch (e) { showToast("ลบโปรไฟล์ไม่สำเร็จ", "error"); }
  };

  return (
    <div className="w-full flex flex-col gap-8 relative h-full text-left font-sarabun p-4 bg-slate-50 min-h-screen text-left">
      {showSellerEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-sarabun text-left">
          <div className="bg-white rounded-3xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl animate-fadeIn text-left">
            <div className="p-6 border-b flex justify-between items-center text-left">
              <h3 className="font-bold text-lg flex items-center gap-2 text-indigo-700 text-left"><Settings size={20} className="text-center"/> ตั้งค่าผู้ขาย and โปรไฟล์</h3>
              <button onClick={()=>setShowSellerEditModal(false)} className="text-center"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="text-left"><label className="text-xs font-bold text-slate-500 text-left">โลโก้ร้านค้า</label><div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-center" onClick={() => logoInputRef.current?.click()}>{invData.logo ? <img src={invData.logo} className="h-20 object-contain" alt="Preview" /> : <ImageIcon size={40} className="text-slate-300 text-center"/>}<input type="file" ref={logoInputRef} hidden accept="image/*" onChange={handleLogoUpload} /></div></div>
                <div className="text-left"><label className="text-xs font-bold text-slate-500 text-left">ลายเซ็น (Signature)</label><div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-center" onClick={() => signatureInputRef.current?.click()}>{invData.signature ? <img src={invData.signature} className="h-20 object-contain" alt="Preview" /> : <Edit size={40} className="text-slate-300 text-center"/>}<input type="file" ref={signatureInputRef} hidden accept="image/*" onChange={handleSignatureUpload} /></div></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">ชื่อร้านค้า</label><input className="w-full border rounded-lg p-2.5 text-sm font-bold text-left" value={invData.sellerName} onChange={e=>setInvData({...invData, sellerName: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">เลขประจำตัวผู้เสียภาษี (Tax ID)</label><input className="w-full border rounded-lg p-2.5 text-sm font-mono text-left" value={invData.sellerTaxId} onChange={e=>setInvData({...invData, sellerTaxId: e.target.value})} /></div>
                <div className="col-span-2 text-left"><label className="text-xs font-bold text-left block mb-1 text-left">ที่อยู่/บ้านเลขที่/ถนน</label><textarea className="w-full border rounded-lg p-2.5 text-sm resize-none text-left" rows="2" value={invData.sellerAddress} onChange={e=>setInvData({...invData, sellerAddress: e.target.value})} placeholder="เลขที่, หมู่บ้าน/อาคาร, ถนน..." /></div>
                <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">ตำบล/แขวง</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" value={invData.sellerSubDistrict} onChange={e=>setInvData({...invData, sellerSubDistrict: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">อำเภอ/เขต</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" value={invData.sellerDistrict} onChange={e=>setInvData({...invData, sellerDistrict: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">จังหวัด</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" value={invData.sellerProvince} onChange={e=>setInvData({...invData, sellerProvince: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">รหัสไปรษณีย์</label><input className="w-full border rounded-lg p-2.5 text-sm font-mono text-left" value={invData.sellerZipCode} onChange={e=>setInvData({...invData, sellerZipCode: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">รหัสสาขา (5 หลัก)</label><input className="w-full border rounded-lg p-2.5 text-sm font-mono text-left" placeholder="00000" value={invData.sellerBranchId} onChange={e=>setInvData({...invData, sellerBranchId: e.target.value})} /></div>
                  <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">ชื่อสาขา</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" placeholder="สำนักงานใหญ่" value={invData.sellerBranchName} onChange={e=>setInvData({...invData, sellerBranchName: e.target.value})} /></div>
                </div>
                <div className="text-left col-span-2"><label className="text-xs font-bold text-left block mb-1 text-left">เบอร์โทรศัพท์</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" value={invData.sellerPhone} onChange={e=>setInvData({...invData, sellerPhone: e.target.value})} /></div>
              </div>
              <div className="pt-4 border-t text-left">
                <div className="flex justify-between items-center mb-3 text-left"><h4 className="text-xs font-bold text-slate-500 uppercase text-left">โปรไฟล์ที่บันทึก</h4><button onClick={handleSaveAsNewProfile} className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1 hover:bg-emerald-100 transition-colors text-center"><SaveAll size={12}/> บันทึกเป็นโปรไฟล์ใหม่</button></div>
                <div className="space-y-2 text-left">{sellerProfiles.map(s => (<div key={s.id} className="flex items-center gap-2 text-left"><div onClick={()=>{setInvData(p=>({...p, ...s})); setShowSellerEditModal(false);}} className="flex-1 p-3 bg-slate-50 border rounded-xl cursor-pointer hover:border-indigo-300 font-medium text-left">{s.sellerName}</div><button type="button" onClick={(e) => { e.stopPropagation(); setProfileToDelete(s); }} className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100 text-center"><Trash2 size={16}/></button></div>))}</div>
              </div>
            </div>
            <div className="p-4 border-t flex gap-3 text-center">
                <button onClick={()=>setShowSellerEditModal(false)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-center">ปิด</button>
            </div>
          </div>
          {profileToDelete && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[900] flex items-center justify-center p-4 text-left"><div className="bg-white rounded-[32px] p-8 max-sm w-full text-center shadow-2xl animate-in zoom-in-95 text-center"><div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-center"><Trash2 size={32}/></div><h3 className="text-xl font-bold mb-2 text-center text-slate-800">ยืนยันลบโปรไฟล์?</h3><p className="text-xs text-slate-400 mb-6 text-center">คุณกำลังจะลบข้อมูล <b>"{profileToDelete.sellerName}"</b><br/>การกระทำนี้จะไม่สามารถกู้คืนได้</p><div className="flex gap-3 text-center"><button onClick={() => setProfileToDelete(null)} type="button" className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button><button onClick={()=>handleDeleteProfile(profileToDelete.id)} type="button" className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100 text-center">ยืนยันลบ</button></div></div></div>)}
        </div>
      )}

      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-sarabun text-left">
            <div className="bg-white rounded-3xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl animate-fadeIn text-left">
                <div className="p-6 border-b flex justify-between items-center text-left">
                    <div className="text-left">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-rose-600 text-left"><User size={20} className="text-center text-rose-500"/> เลือกข้อมูลคู่ค้า</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase text-left">Performance Picker Mode</p>
                    </div>
                    <button onClick={()=>setShowCustomerModal(false)} className="text-center text-slate-500 hover:text-slate-700 transition-colors"><X size={20}/></button>
                </div>
                <div className="p-4 bg-white border-b sticky top-0 z-10 text-left">
                    <div className="relative group text-left mb-3">
                        <Search className="absolute left-4 top-3 text-slate-300 group-focus-within:text-indigo-500 transition-colors text-center" size={20}/>
                        <input autoFocus value={customerSearchTerm} onChange={e=>setCustomerSearchTerm(e.target.value)} className="w-full bg-slate-50 p-3 pl-12 rounded-2xl border-0 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-left" placeholder="ค้นหาชื่อคู่ค้า หรือ เลขผู้เสียภาษี..." />
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setCustomerTab('buyer')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center ${customerTab === 'buyer' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ลูกค้า (ผู้ซื้อ)</button>
                        <button onClick={() => setCustomerTab('seller')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center ${customerTab === 'seller' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>คู่ค้า (ผู้ขาย)</button>
                        <button onClick={() => setCustomerTab('all')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center ${customerTab === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ทั้งหมด</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-left">
                    {filteredCustomers.length > 0 ? filteredCustomers.map((c, idx) => (
                        <div key={idx} onClick={()=>{setInvData(p=>({...p, customerName: c.customerName, address: c.address, taxId: c.taxId, branch: c.branch || '00000', sellerBranchName: c.branchName || ''})); setShowCustomerModal(false); setCustomerSearchTerm('');}} className="p-4 rounded-2xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/50 cursor-pointer transition-all group flex justify-between items-center bg-white shadow-sm text-left">
                            <div className="space-y-1 text-left">
                                <p className="font-black text-slate-800 group-hover:text-rose-700 text-sm transition-colors text-left">{c.customerName}</p>
                                <div className="flex items-center gap-3 text-left">
                                    <span className="text-[9px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-tighter text-left">TAX: {c.taxId}</span>
                                    <div className="flex items-center gap-1 text-indigo-500 font-bold text-[10px]">
                                        <Building size={10}/>
                                        <span>สาขา: {c.branch === '00000' || !c.branch ? 'สำนักงานใหญ่' : c.branch} {c.branchName && `(${c.branchName})`}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-1 text-left">{c.address}</p>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-rose-500 transition-colors text-center"/>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-300 text-center">
                            <User size={48} className="opacity-10 mb-2 text-center"/>
                            <p className="text-sm font-bold text-center">ไม่พบข้อมูลคู่ค้าที่ค้นหา</p>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t bg-slate-50 rounded-b-3xl text-center">
                    <p className="text-[9px] text-slate-400 font-bold uppercase text-center">Showing {filteredCustomers.length} of {customers.length} partners</p>
                </div>
            </div>
        </div>
      )}
        
      <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit print:hidden self-center md:self-start text-left">
        <button onClick={() => setMode('create')} className={"px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all text-center " + (mode==='create'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700')}><FileText size={18}/> ออกเอกสาร</button>
        <button onClick={() => setMode('history')} className={"px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all text-center " + (mode==='history'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700')}><Clock size={18}/> ประวัติเอกสาร</button>
      </div>

      {mode === 'history' ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-fadeIn h-full flex flex-col text-left">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2"><Filter size={18} className="text-indigo-600"/> ตัวกรองประวัติเอกสาร</h3>
                     <div className="relative w-full md:w-72 text-left shrink-0"><Search className="absolute left-3 top-2.5 text-slate-400 text-center" size={16}/><input className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-left" placeholder="ค้นหาชื่อ, เลขที่, Order ID..." value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} /></div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto shrink-0">
                        <button onClick={() => setHistoryFilter('all')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${historyFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ทั้งหมด</button>
                        <button onClick={() => setHistoryFilter('pending')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${historyFilter === 'pending' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>รอออกเอกสาร</button>
                        <button onClick={() => setHistoryFilter('invoice')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${historyFilter === 'invoice' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ใบกำกับ/ABB</button>
                        <button onClick={() => setHistoryFilter('credit_note')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${historyFilter === 'credit_note' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ใบลดหนี้</button>
                        <button onClick={() => setHistoryFilter('cancelled')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${historyFilter === 'cancelled' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ยกเลิก</button>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto shrink-0">
                          {['thisMonth', 'lastMonth', '3months', 'year', 'all'].map(r => (
                              <button key={r} onClick={() => setHistoryQuickRange(r)} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all whitespace-nowrap">
                                  {r === 'thisMonth' ? 'เดือนนี้' : r === 'lastMonth' ? 'เดือนที่แล้ว' : r === '3months' ? '3 เดือน' : r === 'all' ? 'ทั้งหมด' : 'ปีนี้'}
                              </button>
                          ))}
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shrink-0">
                          <Calendar size={14} className="text-slate-400 ml-1 shrink-0"/>
                          <input type="date" value={historyStartDate === '2000-01-01' ? '' : historyStartDate} onChange={e=>setHistoryStartDate(e.target.value || '2000-01-01')} className="bg-transparent border-0 text-xs font-bold outline-none text-slate-700 w-28 cursor-pointer focus:ring-0"/>
                          <span className="text-slate-300"><ArrowRight size={12}/></span>
                          <input type="date" value={historyEndDate === '2099-12-31' ? '' : historyEndDate} onChange={e=>setHistoryEndDate(e.target.value || '2099-12-31')} className="bg-transparent border-0 text-xs font-bold outline-none text-slate-700 w-28 cursor-pointer focus:ring-0"/>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0 flex-1 min-w-[120px]">
                          <Store size={14} className="text-slate-400 shrink-0"/>
                          <select value={historyChannel} onChange={e=>setHistoryChannel(e.target.value)} className="bg-transparent border-0 text-xs font-bold outline-none text-slate-700 w-full cursor-pointer focus:ring-0">
                              <option value="all">ทุกช่องทาง</option>
                              {CONSTANTS.CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                              <option value="IMPORTED">IMPORTED</option>
                          </select>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-xs font-bold text-slate-500">พบเอกสารทั้งหมด: {displayDocs.length} รายการ</span>
            </div>
            
            <div className="rounded-2xl border border-slate-100 overflow-x-auto flex-1 custom-scrollbar text-left">
                <table className="w-full text-sm text-left whitespace-nowrap text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs sticky top-0 z-10 text-left">
                        <tr><th className="p-4 text-left">Date</th><th className="p-4 text-left">No. / Order ID</th><th className="p-4 text-left">Customer</th><th className="p-4 text-right text-right">Total</th><th className="p-4 text-center text-center">Status</th><th className="p-4 text-center text-center">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-left">
                        {displayDocs.length > 0 ? displayDocs.map((docItem, idx) => {
                            let badgeClass = 'bg-slate-100 text-slate-600';
                            if (docItem.status === 'cancelled') badgeClass = 'bg-slate-200 text-slate-500';
                            else if (docItem.source === 'transaction') badgeClass = 'bg-amber-100 text-amber-700';
                            else if (docItem.docType === 'credit_note') badgeClass = 'bg-blue-100 text-blue-700';
                            else badgeClass = 'bg-emerald-100 text-emerald-700';
                            
                            return (
                            <tr key={idx} className={`hover:bg-indigo-50/30 even:bg-slate-50/50 text-left ${docItem.status === 'cancelled' ? 'opacity-50' : ''}`}>
                                <td className="p-4 text-slate-500 text-xs text-left">{formatDate(docItem.date)}</td>
                                <td className="p-4 text-slate-700 font-bold text-left">
                                    <p className={`text-left ${docItem.status === 'cancelled' ? 'line-through' : ''}`}>{docItem.invNo}</p>
                                    {docItem.orderId && <p className="text-[9px] text-slate-400 font-mono text-left">Ref: {docItem.orderId}</p>}
                                </td>
                                <td className="p-4 text-left">{docItem.customerName}</td>
                                <td className="p-4 text-right font-bold text-right">{formatCurrency(docItem.total * (docItem.docType === 'credit_note' ? -1 : 1))}</td>
                                <td className="p-4 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase text-center ${badgeClass}`}>{docItem.displayStatus}</span></td>
                                <td className="p-4 text-center"><div className="flex justify-center gap-2 text-center">{docItem.source === 'transaction' ? (<button onClick={() => handleLoadTransaction(docItem)} className="text-white bg-indigo-600 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 text-center"><PlusCircle size={14} className="text-center"/> สร้างเอกสาร</button>) : (<><button onClick={() => handleEditInvoice(docItem)} className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold text-center">ดู/พิมพ์</button>{docItem.status !== 'cancelled' && <><button onClick={() => handleCreateCreditNote(docItem)} className="text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-center" title="สร้างใบลดหนี้">ลดหนี้</button><button onClick={() => setCancelConfirmId(docItem)} className="text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold text-center" title="ยกเลิกเอกสาร">ยกเลิก</button></>}</>)}</div></td>
                            </tr>
                        )}) : (
                            <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold">ไม่พบเอกสารในหมวดหมู่นี้ หรือ ในช่วงเวลาที่เลือก</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {cancelConfirmId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 text-left">
                  <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 text-center">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-center">
                      <XCircle size={32}/>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-slate-800 text-center">ยืนยันยกเลิกเอกสาร?</h3>
                    <p className="text-xs text-slate-400 mb-6 text-center leading-relaxed">
                      เอกสารเลขที่ <b>{cancelConfirmId.invNo}</b> จะถูกทำเครื่องหมายว่า "ยกเลิกแล้ว"<br/>
                      และออเดอร์ <b>{cancelConfirmId.orderId}</b> จะสามารถนำมาออกเอกสารใหม่ได้<br/>
                      <span className="text-rose-600 font-bold underline">เอกสารจะไม่ถูกลบออกจากระบบเพื่อการตรวจสอบ</span>
                    </p>
                    <div className="flex gap-3 text-center">
                      <button onClick={() => setCancelConfirmId(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ปิด</button>
                      <button onClick={handleCancelInvoice} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg text-center">ยืนยันยกเลิก</button>
                    </div>
                  </div>
                </div>
            )}
        </div>
      ) : (
        <>
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 print:hidden space-y-6 text-left">
                <div className="flex justify-between border-b border-slate-100 pb-4 text-left"><div className="text-left"><h3 className="font-bold text-slate-800 text-xl flex items-center gap-2 text-left">Document Editor</h3><p className="text-slate-400 text-sm text-left">สร้างเอกสารใบกำกับภาษี หรือ ใบเสนอราคา/ลดหนี้</p></div><div className="text-right flex flex-col items-end gap-2 text-right"><button onClick={handleNewInvoice} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 text-center"><PlusCircle size={14} className="text-center"/> New Document</button><div className="text-right"><p className="text-xs text-slate-400 font-bold uppercase text-right">DOC ID</p><div className="flex items-center gap-2 justify-end text-right"><p className="text-2xl font-bold text-indigo-600 font-mono text-right">{invData.invNo}</p></div></div></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between text-left">
                        <div className="text-left"><div className="flex justify-between items-start mb-4 text-left"><h4 className="font-bold text-indigo-700 flex items-center gap-2 text-left"><Store size={18} className="text-center"/> ข้อมูลผู้ขาย</h4><button onClick={()=>setShowSellerEditModal(true)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-center">แก้ไข/ตั้งค่า</button></div><div className="flex gap-4 items-start text-left">{invData.logo && <div className="w-16 h-16 rounded-lg bg-white p-1 border border-slate-200 flex-shrink-0 text-center"><img src={invData.logo} className="w-full h-full object-contain" alt="Logo"/></div>}<div className="text-sm text-slate-600 text-left flex-1"><p className="font-bold text-slate-800 text-base text-left">{invData.sellerName || 'กรุณาระบุชื่อร้านค้า'}</p><div className="text-xs mt-1 text-left flex-1"><p className="text-left"><b>Tax ID:</b> {invData.sellerTaxId || '-'}</p><p className="text-left"><b>สาขา:</b> {invData.sellerBranchId === '00000' || !invData.sellerBranchId ? 'สำนักงานใหญ่' : invData.sellerBranchId} {invData.sellerBranchName && `(${invData.sellerBranchName})`}</p><p className="text-left">{[invData.sellerAddress, fmtAddr.sub(invData.sellerSubDistrict)].filter(Boolean).join(' ')}</p><p className="text-left">{[fmtAddr.dist(invData.sellerDistrict), fmtAddr.prov(invData.sellerProvince), invData.sellerZipCode].filter(Boolean).join(' ')}</p></div></div></div></div>
                        <div className="mt-4 pt-4 border-t flex gap-2 text-center"><button onClick={()=>setInvData({...invData, vatType: 'excluded'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border text-center ${invData.vatType==='excluded' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-800'}`}>แยก VAT (Excluded)</button><button onClick={()=>setInvData({...invData, vatType: 'included'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border text-center ${invData.vatType==='included' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-800'}`}>รวม VAT (Included)</button><button onClick={()=>setInvData({...invData, vatType: 'none'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border text-center ${invData.vatType==='none' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-800'}`}>ไม่มี VAT</button></div>
                    </div>
                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                        <div className="grid grid-cols-2 gap-3 text-left">
                            <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm text-left">
                                <label className="text-[10px] font-bold text-indigo-600 mb-1 flex items-center gap-1 text-left">ประเภทเอกสาร</label>
                                <select value={invData.docType} onChange={e => setInvData({...invData, docType: e.target.value})} className="w-full border-0 p-1 text-sm font-bold text-slate-700 bg-transparent focus:ring-0 text-left cursor-pointer">
                                    <option value="invoice">ใบกำกับภาษี / ใบเสร็จรับเงิน</option>
                                    <option value="abb">ใบกำกับภาษีอย่างย่อ (ABB)</option>
                                    <option value="credit_note">ใบลดหนี้ (Credit Note)</option>
                                </select>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm text-left"><label className="text-[10px] font-bold text-indigo-600 mb-1 flex items-center gap-1 text-left">วันที่เอกสาร</label><input type="date" className="w-full border-0 p-1 text-sm font-bold text-slate-700 bg-transparent focus:ring-0 text-left" value={invData.date} onChange={e => setInvData({ ...invData, date: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-left">
                            {invData.docType === 'credit_note' && (<div className="bg-white p-3 rounded-xl border border-rose-200 shadow-sm text-left"><label className="text-[10px] font-bold text-rose-500 mb-1 flex items-center gap-1 text-left">อ้างอิงใบเดิม</label><input className="w-full border-0 p-1 text-sm font-mono text-rose-600 bg-transparent focus:ring-0 text-left" placeholder="INV-XXXXXXXX" value={invData.refInvNo} onChange={e => setInvData({ ...invData, refInvNo: e.target.value })} /></div>)}
                            <div className={`bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-left ${invData.docType !== 'credit_note' ? 'col-span-2' : ''}`}><label className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1 text-left">Order ID</label><input className="w-full border-0 p-1 text-sm font-mono text-indigo-600 bg-transparent focus:ring-0 text-left" placeholder="เลขคำสั่งซื้อ" value={invData.orderId} onChange={e => setInvData({ ...invData, orderId: e.target.value })} /></div>
                        </div>
                        <div className="flex justify-between items-center text-left">
                            <h4 className="font-bold text-sm text-rose-600 text-left">ข้อมูลลูกค้า/คู่ค้า</h4>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={handleSavePartnerManual} className="text-[10px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold text-center flex items-center gap-1"><SaveAll size={12}/> บันทึกข้อมูลใหม่</button>
                                <button type="button" onClick={()=>setShowCustomerModal(true)} className="text-[10px] bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-bold text-center">เลือกจากฐานข้อมูล</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-left">
                            <div className="col-span-2 text-left"><label className="text-[10px] text-slate-500 font-bold mb-1 block text-left">ชื่อลูกค้า / บริษัท</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm text-left" value={invData.customerName} onChange={e=>setInvData({...invData, customerName: e.target.value})} /></div>
                            <div className="text-left"><label className="text-[10px] text-slate-500 font-bold mb-1 block text-left">Tax ID</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm font-mono text-left" value={invData.taxId} onChange={e=>setInvData({...invData, taxId: e.target.value})} /></div>
                            <div className="text-left"><label className="text-[10px] text-slate-500 font-bold mb-1 block text-left">สาขา</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm font-mono text-left" value={invData.branch} onChange={e=>setInvData({...invData, branch: e.target.value})} /></div>
                            <div className="col-span-2 text-left"><label className="text-xs font-bold text-slate-500 mb-1 block text-left">ที่อยู่</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm text-left" value={invData.address} onChange={e=>setInvData({...invData, address: e.target.value})} /></div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                  <h4 className="font-bold text-sm text-slate-600 mb-2 text-left">รายการสินค้า</h4>
                  {invData.items.map((it, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-center text-left">
                      <span className="text-xs text-slate-400 w-4 text-left">{i+1}.</span>
                      <input className="flex-[3] border-0 rounded p-2 text-sm shadow-sm text-left" value={it.desc} onChange={e=>updateItem(i,'desc',e.target.value)}/>
                      <input className="w-20 border-0 rounded p-2 text-sm text-center shadow-sm text-center" type="number" value={it.qty} onChange={e=>updateItem(i,'qty',Number(e.target.value))}/>
                      <input className="w-24 border-0 rounded p-2 text-sm text-right shadow-sm text-right" type="number" value={it.price} onChange={e=>updateItem(i,'price',Number(e.target.value))}/>
                      <button onClick={()=>setInvData({...invData, items: invData.items.filter((_,idx)=>idx!==i)})} className="text-rose-400 p-2 text-center"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  <button onClick={()=>setInvData({...invData, items:[...invData.items, {desc:'', qty:1, unit:'ชิ้น', price:0}]})} className="mt-2 text-[10px] bg-indigo-600 text-white px-4 py-1.5 rounded-lg flex items-center gap-1 w-fit font-bold shadow-md text-center"><PlusCircle size={14}/> เพิ่มรายการ</button>
                </div>
                <div className="flex gap-4 text-center">
                  <button onClick={handleSaveInvoice} className={"flex-1 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all text-center " + (editingDocId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700') + " flex items-center justify-center gap-2 text-center"}><Save size={18}/> {editingDocId ? 'อัปเดตข้อมูล' : 'บันทึกเอกสาร'}</button>
                  <button onClick={handleDownloadPDF} className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all text-center"><Download size={18}/> Download ZIP</button>
                </div>
            </div>
            <div className="overflow-x-auto pb-10 flex justify-center print:p-0 print:absolute print:left-0 print:top-0 print:w-full print:h-full print:z-50 print:bg-white text-left">
                <div id="invoice-preview-area" className="shadow-2xl print:shadow-none bg-white p-[30px] w-[210mm] min-h-[296mm] text-sm font-sarabun text-slate-900 leading-relaxed relative box-border text-left overflow-hidden" style={{ transform: 'scale(1.0)', transformOrigin: 'top center' }}>
                    
                    {invData.status === 'cancelled' && (
                        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none opacity-10 transform -rotate-45 print:opacity-20">
                            <span className="text-8xl font-black text-rose-600 border-8 border-rose-600 px-8 py-4 rounded-3xl tracking-widest whitespace-nowrap">ยกเลิก / CANCELLED</span>
                        </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-8 text-left relative z-10">
                      <div className="w-[70%] flex items-start gap-5 text-left">{invData.logo && (<img src={invData.logo} className="w-[90px] h-[90px] object-contain flex-shrink-0 text-center" alt="Logo"/>)}<div className="flex flex-col justify-center flex-1 text-left"><h2 className="text-xl font-bold text-slate-900 mb-1 leading-tight text-left">{invData.sellerName}</h2><div className="text-xs leading-relaxed space-y-1 mt-1 text-left"><p className="text-slate-600 text-left">{[invData.sellerAddress, fmtAddr.sub(invData.sellerSubDistrict)].filter(Boolean).join(' ')}</p><p className="text-slate-600 text-left">{[fmtAddr.dist(invData.sellerDistrict), fmtAddr.prov(invData.sellerProvince), invData.sellerZipCode].filter(Boolean).join(' ')}</p><p className="text-slate-700 text-left"><b>เลขผู้เสียภาษี:</b> {invData.sellerTaxId} <span className="ml-2"><b>สาขา:</b> {invData.sellerBranchId === '00000' || !invData.sellerBranchId ? 'สำนักงานใหญ่' : invData.sellerBranchId} {invData.sellerBranchName && `(${invData.sellerBranchName})`}</span></p><p className="text-slate-700 text-left"><b>โทร:</b> {invData.sellerPhone}</p></div></div></div>
                      <div className="text-right w-[30%] flex flex-col items-end text-right"><div className="text-lg font-bold uppercase mb-0 text-right">{invData.docType === 'credit_note' ? 'ใบลดหนี้ / CREDIT NOTE' : (invData.docType === 'abb' ? 'ใบกำกับภาษีอย่างย่อ' : 'ใบกำกับภาษี / ใบเสร็จรับเงิน')}</div><div className={`status-badge text-lg font-bold uppercase mb-3 text-right ${invData.status === 'cancelled' ? 'text-rose-600' : ''}`}>{invData.status === 'cancelled' ? 'ยกเลิกแล้ว (Cancelled)' : 'ต้นฉบับ (Original)'}</div><div className="border border-slate-300 p-2 w-full max-w-[200px] text-right"><div className="grid grid-cols-[max-content_1fr] gap-x-2 items-center text-right mb-1"><span className="font-bold text-slate-500 text-xs text-left">เลขที่ (No.)</span><span className="font-bold text-right text-[10px]">{invData.invNo}</span></div><div className="grid grid-cols-[max-content_1fr] gap-x-2 items-center text-right mb-1"><span className="font-bold text-slate-500 text-xs text-left">วันที่ (Date)</span><span className="text-right text-[10px] text-right">{formatDate(invData.date)}</span></div>{invData.docType === 'credit_note' && invData.refInvNo && (<div className="grid grid-cols-[max-content_1fr] gap-x-2 items-center text-right mb-1"><span className="font-bold text-slate-500 text-xs text-left">อ้างอิง</span><span className="text-right text-[10px] font-bold text-rose-600 text-right">{invData.refInvNo}</span></div>)}{invData.orderId && (<div className="grid grid-cols-[max-content_1fr] gap-x-2 items-center text-right"><span className="font-bold text-slate-500 text-xs text-left">Order ID</span><span className="text-right text-[10px] font-mono text-right">{invData.orderId}</span></div>)}</div></div>
                    </div>
                    <div className="border border-slate-300 p-4 mb-4 flex flex-col gap-1 text-left text-left relative z-10">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1 text-left">ลูกค้า (Customer)</div>
                        <p className="font-bold text-base text-left">{invData.customerName || 'ลูกค้าทั่วไป (เงินสด)'}</p>
                        {invData.docType !== 'abb' && (
                            <>
                                <p className="text-slate-600 text-sm leading-relaxed text-left">{invData.address}</p>
                                <div className="flex gap-4 text-xs text-slate-600"><p>เลขผู้เสียภาษี: {invData.taxId || '-'}</p><p>สาขา: {invData.branch === '00000' || !invData.branch ? 'สำนักงานใหญ่' : invData.branch}</p></div>
                            </>
                        )}
                    </div>
                    <table className="w-full mb-6 border-collapse text-left text-[10px] text-left relative z-10"><thead><tr className="bg-slate-100 text-slate-800 font-bold uppercase text-center"><th className="py-2 border-y border-slate-300 w-10 text-center">No.</th><th className="py-2 border-y border-slate-300 text-left pl-2 text-left">Description</th><th className="py-2 border-y border-slate-300 w-14 text-center text-center">Qty</th><th className="py-2 border-y border-slate-300 w-20 text-right text-right">Price</th><th className="py-2 border-y border-slate-300 w-24 text-right text-right">Amount</th></tr></thead><tbody>{invData.items.map((it, i) => (<tr key={i} className="text-left"><td className="py-1.5 border-b border-slate-200 text-center">{i+1}</td><td className="py-1.5 border-b border-slate-200 pl-2 text-left">{it.desc}</td><td className="py-1.5 border-b border-slate-200 text-center">{it.qty}</td><td className="py-1.5 border-b border-slate-200 text-right">{formatCurrency(it.price)}</td><td className="p-1.5 border-b border-slate-200 text-right pr-2 font-bold">{formatCurrency(it.qty * it.price)}</td></tr>))}</tbody></table>
                    <div className="flex justify-between items-start text-left relative z-10"><div className="flex-1 mt-4 mr-4 text-left"><div className="bg-white p-2 border border-slate-400 text-center font-bold text-slate-900 text-[11px] text-center">({THBText(totals.total)})</div><div className="mt-8 text-[10px] text-slate-500 text-left text-left">หมายเหตุ: {invData.notes}</div></div><div className="w-[45%] text-right text-[10px] space-y-1 text-right"><div className="flex justify-between px-2 text-right"><span>รวมสินค้า (Subtotal)</span><span>{formatCurrency(totals.sub)}</span></div>{invData.discount > 0 && <div className="flex justify-between px-2 text-rose-600 text-right"><span>ส่วนลด (Discount)</span><span>-{formatCurrency(invData.discount)}</span></div>}<div className="flex justify-between px-2 pt-1 border-t border-slate-200 text-right"><span>รวมก่อนภาษี (Net Before VAT)</span><span>{formatCurrency(totals.preVat)}</span></div><div className="flex justify-between px-2 text-right"><span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span><span>{formatCurrency(totals.vat)}</span></div><div className="flex justify-between font-bold border-t-2 border-black pt-1 text-base text-right"><span>ยอดเงินสุทธิ (Grand Total)</span><span>{formatCurrency(totals.total)}</span></div></div></div>
                    <div className="mt-20 grid grid-cols-2 gap-10 text-center relative z-10">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-14 flex items-center justify-center mb-1 relative w-full text-center">
                                {invData.signature && <img src={invData.signature} className="max-h-full object-contain text-center" alt="Signature"/>}
                            </div>
                            <div className="w-full text-[10px] space-y-1 text-center">
                                <p className="mb-1 text-center">(...........................................................................)</p>
                                <p className="font-bold text-slate-700 text-center">{invData.docType === 'credit_note' ? 'ผู้อนุมัติ / Authorized Signature' : 'ผู้รับเงิน / Authorized Signature'}</p>
                                <p className="mt-1 text-center">วันที่ (Date): {formatDate(invData.date)}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="h-14 flex items-center justify-center mb-1 w-full text-center">
                            </div>
                            <div className="w-full text-[10px] space-y-1 text-center">
                                <p className="mb-1 text-center">(...........................................................................)</p>
                                <p className="font-bold text-slate-700 text-center">{invData.docType === 'credit_note' ? 'ผู้รับเอกสาร / Document Received By' : 'ผู้รับสินค้า / Received By'}</p>
                                <p className="mt-1 text-center text-center">วันที่ (Date): .......................................</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
}

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stockBatches, setStockBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentAppId, setCurrentAppId] = useState(localStorage.getItem('merchant_app_id') || CONSTANTS.IDS.PROD);
  const [toasts, setToasts] = useState([]);
  const [preFillInvoice, setPreFillInvoice] = useState(null);
  const [showIdDeleteTool, setShowIdDeleteTool] = useState(false);
  const [targetIdToDelete, setTargetIdToDelete] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [showMigrateConfirm, setShowMigrateConfirm] = useState(false);

  const addToast = (message, type = 'success') => { const id = Date.now() + Math.random(); setToasts(prev => [...prev, { id, message, type }]); setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000); };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  const toggleAppMode = () => { const ids = Object.values(CONSTANTS.IDS); const nextId = ids[(ids.indexOf(currentAppId) + 1) % ids.length]; setCurrentAppId(nextId); localStorage.setItem('merchant_app_id', nextId); addToast(`ฐานข้อมูล: ${nextId}`, "success"); };

  useEffect(() => { 
    const unsubscribe = onAuthStateChanged(authInstance, (newUser) => { 
        setUser(newUser); 
        setAuthLoading(false);
    }); 
    return () => unsubscribe(); 
  }, []);
   
  useEffect(() => {
    if (!user || !currentAppId) return;
    setLoading(true);
    const path = (coll) => collection(dbInstance, 'artifacts', currentAppId, 'public', 'data', coll);
    const errorFn = (e) => { console.error("Firestore error:", e); addToast("Sync Error", "error"); };
    const unsubInc = onSnapshot(query(path('transactions_income')), (s) => setTransactions(prev => [...prev.filter(t=>t.type!=='income'), ...s.docs.map(d=>({id:d.id, ...d.data(), type:'income', date: normalizeDate(d.data().date)}))]), errorFn);
    const unsubExp = onSnapshot(query(path('transactions_expense')), (s) => setTransactions(prev => [...prev.filter(t=>t.type!=='expense'), ...s.docs.map(d=>({id:d.id, ...d.data(), type:'expense', date: normalizeDate(d.data().date)}))]), errorFn);
    const unsubInv = onSnapshot(query(path('invoices')), (s) => { setInvoices(s.docs.map(d=>({id:d.id, ...d.data(), date: normalizeDate(d.data().date)}))); setLoading(false); }, errorFn);
    const unsubStock = onSnapshot(query(path('inventory_batches')), (s) => setStockBatches(s.docs.map(d=>({id:d.id, ...d.data()}))), errorFn);
    return () => { unsubInc(); unsubExp(); unsubInv(); unsubStock(); };
  }, [user, currentAppId]);

  const forceDeleteById = async () => {
    if (!targetIdToDelete) return;
    try {
      const batchWriter = writeBatch(dbInstance);
      const invMatch = invoices.find(inv => inv.invNo === targetIdToDelete || inv.id === targetIdToDelete);
      const transMatch = transactions.find(t => t.orderId === targetIdToDelete || t.id === targetIdToDelete || t.taxInvoiceNo === targetIdToDelete);
      
      if (invMatch) { 
          batchWriter.delete(doc(dbInstance, 'artifacts', currentAppId, 'public', 'data', 'invoices', invMatch.id)); 
          addToast("ลบใบกำกับสำเร็จ", "success"); 
      } else if (transMatch) { 
          const coll = transMatch.type === 'income' ? 'transactions_income' : 'transactions_expense'; 
          batchWriter.delete(doc(dbInstance, 'artifacts', currentAppId, 'public', 'data', coll, transMatch.id)); 
          
          if (transMatch.type === 'expense') {
              stockBatches.filter(b => b.parentExpenseId === transMatch.id).forEach(lot => {
                  batchWriter.delete(doc(dbInstance, 'artifacts', currentAppId, 'public', 'data', 'inventory_batches', lot.id));
              });
          } else {
              // คืนสต็อก LIFO เมื่อลบ Income
              for (const item of (transMatch.items || [])) {
                  let toReturn = Number(item.qty);
                  const lots = stockBatches
                    .filter(b => (String(b.sku).toLowerCase() === String(item.sku).toLowerCase() || String(b.productName).toLowerCase() === String(item.desc).toLowerCase()) && Number(b.sold) > 0)
                    .sort(sortNewestFirst);
                  for (const lot of lots) {
                      if (toReturn <= 0) break;
                      const back = Math.min(toReturn, Number(lot.sold));
                      batchWriter.update(doc(dbInstance, 'artifacts', currentAppId, 'public', 'data', 'inventory_batches', lot.id), { sold: increment(-back) });
                      toReturn -= back;
                  }
              }
          }
          addToast("ลบรายการ and คืนยอดสต็อกสำเร็จ", "success"); 
      } else { 
          addToast("ไม่พบข้อมูล", "error"); 
          return;
      }
      await batchWriter.commit();
      setTargetIdToDelete(''); setShowIdDeleteTool(false);
    } catch(e) { addToast("ลบไม่สำเร็จ", "error"); }
  };

  const executeMigration = async () => {
    setShowMigrateConfirm(false);
    setIsMigrating(true);
    try {
      addToast("กำลังดำเนินการรันเลขเอกสารใหม่...", "success");
      let batchWriter = writeBatch(dbInstance);
      let opsCount = 0;

      const safeUpdate = async (collectionName, docId, data) => {
        const ref = doc(dbInstance, 'artifacts', currentAppId, 'public', 'data', collectionName, docId);
        batchWriter.update(ref, data);
        opsCount++;
        if (opsCount >= 400) {
          await batchWriter.commit();
          batchWriter = writeBatch(dbInstance);
          opsCount = 0;
        }
      };

      const getMaxId = (items, prefix, field) => {
        return items.reduce((max, item) => {
          if (item[field] && item[field].startsWith(prefix)) {
            const num = parseInt(item[field].replace(prefix, ''), 10);
            return !isNaN(num) && num > max ? num : max;
          }
          return max;
        }, 0);
      };

      // 1. อัปเดตรายรับ (เฉพาะที่ยังไม่มีเลขระบบ)
      const allIncomes = transactions.filter(t => t.type === 'income');
      let currentIncCount = getMaxId(allIncomes, 'INC-', 'sysDocId');
      const missingIncomes = allIncomes.filter(t => !t.sysDocId || !t.sysDocId.startsWith('INC-')).sort(sortOldestFirst);
      for (const t of missingIncomes) {
        currentIncCount++;
        await safeUpdate('transactions_income', t.id, { sysDocId: `INC-${String(currentIncCount).padStart(5, '0')}` });
      }

      // 2. อัปเดตรายจ่าย (แยก COG และ EXP - เฉพาะที่ยังไม่มีเลขระบบ)
      const allExpenses = transactions.filter(t => t.type === 'expense');
      let currentCogCount = getMaxId(allExpenses, 'COG-', 'sysDocId');
      let currentExpCount = getMaxId(allExpenses, 'EXP-', 'sysDocId');
      const missingExpenses = allExpenses.filter(t => !t.sysDocId || (!t.sysDocId.startsWith('COG-') && !t.sysDocId.startsWith('EXP-'))).sort(sortOldestFirst);
      
      for (const t of missingExpenses) {
        if (t.category === 'ต้นทุนสินค้า' || t.isFromInventory) {
          currentCogCount++;
          await safeUpdate('transactions_expense', t.id, { sysDocId: `COG-${String(currentCogCount).padStart(5, '0')}` });
        } else {
          currentExpCount++;
          await safeUpdate('transactions_expense', t.id, { sysDocId: `EXP-${String(currentExpCount).padStart(5, '0')}` });
        }
      }

      // 3. อัปเดตใบกำกับภาษี (Invoice - เฉพาะที่ยังไม่มีเลข)
      const allInvs = invoices.filter(i => i.docType === 'invoice' || !i.docType);
      let currentInvCount = getMaxId(allInvs, 'INV-', 'invNo');
      const missingInvs = allInvs.filter(i => !i.invNo || !i.invNo.startsWith('INV-')).sort(sortOldestFirst);
      for (const i of missingInvs) {
        currentInvCount++;
        await safeUpdate('invoices', i.id, { invNo: `INV-${String(currentInvCount).padStart(5, '0')}` });
      }

      // 4. อัปเดตใบลดหนี้ (CN - เฉพาะที่ยังไม่มีเลข)
      const allCns = invoices.filter(i => i.docType === 'credit_note');
      let currentCnCount = getMaxId(allCns, 'CN-', 'invNo');
      const missingCns = allCns.filter(i => !i.invNo || !i.invNo.startsWith('CN-')).sort(sortOldestFirst);
      for (const i of missingCns) {
        currentCnCount++;
        await safeUpdate('invoices', i.id, { invNo: `CN-${String(currentCnCount).padStart(5, '0')}` });
      }

      // 5. อัปเดตใบกำกับอย่างย่อ (ABB - เฉพาะที่ยังไม่มีเลข)
      const allAbbs = invoices.filter(i => i.docType === 'abb');
      let currentAbbCount = getMaxId(allAbbs, 'ABB-', 'invNo');
      const missingAbbs = allAbbs.filter(i => !i.invNo || !i.invNo.startsWith('ABB-')).sort(sortOldestFirst);
      for (const i of missingAbbs) {
        currentAbbCount++;
        await safeUpdate('invoices', i.id, { invNo: `ABB-${String(currentAbbCount).padStart(5, '0')}` });
      }

      if (opsCount > 0) {
        await batchWriter.commit();
      }

      addToast("อัปเดตเลขเอกสารเฉพาะรายการที่ขาดหายเรียบร้อยแล้ว!", "success");
    } catch (error) {
      console.error(error);
      addToast("เกิดข้อผิดพลาดในการอัปเดตข้อมูล", "error");
    } finally {
      setIsMigrating(false);
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard transactions={transactions} invoices={invoices} stockBatches={stockBatches} />;
      case 'records': return <RecordManager user={user} transactions={transactions} invoices={invoices} appId={currentAppId} stockBatches={stockBatches} showToast={addToast} onIssueInvoice={(t)=>{setPreFillInvoice(t); setActiveTab('invoice');}} />;
      case 'import': return <DataImporter appId={currentAppId} showToast={addToast} user={user} stockBatches={stockBatches} />;
      case 'stock': return <StockManager appId={currentAppId} stockBatches={stockBatches} showToast={addToast} user={user} transactions={transactions} />;
      case 'invoice': return <InvoiceGenerator user={user} invoices={invoices} transactions={transactions} appId={currentAppId} showToast={addToast} preFillData={preFillInvoice} />;
      case 'reports': return <TaxReports transactions={transactions} invoices={invoices} stockBatches={stockBatches} showToast={addToast} appId={currentAppId} user={user} />;
      default: return <Dashboard transactions={transactions} invoices={invoices} stockBatches={stockBatches} />;
    }
  };

  if (authLoading) return <LoadingScreen />;
  if (!user) return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <LoginScreen authInstance={authInstance} addToast={addToast} />
    </>
  );

  return (
    <div className="flex w-full h-screen bg-slate-50 font-sarabun text-slate-800 overflow-hidden text-left">
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Migration Loading Modal */}
      {isMigrating && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-center">
          <div className="bg-white rounded-[40px] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
              <RefreshCw size={40} className="animate-spin" />
            </div>
            <h3 className="text-2xl font-black mb-2 text-slate-800">กำลังอัปเดตข้อมูล</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              กำลังจัดเรียงและรันเลขเอกสารใหม่<br/>
              ให้สอดคล้องกันทั้งหมด...<br/>
              <span className="text-rose-500 font-bold mt-2 inline-block">กรุณารอสักครู่ ห้ามปิดหน้าต่างนี้</span>
            </p>
          </div>
        </div>
      )}

      {/* Migration Confirm Modal */}
      {showMigrateConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 text-center">
              <RefreshCw size={32}/>
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-800 text-center">ยืนยันรันเลขเอกสาร?</h3>
            <p className="text-xs text-slate-400 mb-6 text-center leading-relaxed">
              ฟังก์ชันนี้จะหารายการที่ <b>ยังไม่มีเลขเอกสาร</b><br/>
              แล้วจัดเรียงเพื่อรันเลขที่เอกสารต่อจากเลขล่าสุด<br/>
              <span className="text-amber-600 font-bold underline">เลขเอกสารเดิมจะไม่ถูกเปลี่ยนแปลง</span>
            </p>
            <div className="flex gap-3 text-center">
              <button onClick={() => setShowMigrateConfirm(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button>
              <button onClick={executeMigration} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg text-center transition-colors">ยืนยันรันเลข</button>
            </div>
          </div>
        </div>
      )}

      {showIdDeleteTool && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 text-center"><div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-center"><AlertCircle size={40} className="text-center"/></div><h3 className="text-2xl font-black text-center mb-2 text-center text-slate-800 text-center">ระบุ ID ที่ต้องการลบ</h3><input value={targetIdToDelete} onChange={e=>setTargetIdToDelete(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 mb-6 font-bold text-center text-lg text-slate-800 text-center" placeholder="ID, INV No. หรือ Tax Invoice No." /><div className="flex gap-4 text-center"><button onClick={()=>setShowIdDeleteTool(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 text-center">ยกเลิก</button><button onClick={forceDeleteById} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold text-center">ยืนยัน</button></div></div>
        </div>
      )}
      <aside className="w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800 shadow-2xl h-full shrink-0 text-left">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3 text-left"><div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg text-center"><Wallet size={20} className="text-white text-center"/></div><h1 className="text-xl font-bold tracking-tight text-left">MerchantTax</h1></div>
        <nav className="p-6 space-y-4 flex-1 overflow-y-auto text-left"><NavButton active={activeTab === 'dashboard'} onClick={()=>{setActiveTab('dashboard');}} icon={<PieChart size={18} className="text-center"/>} label="แดชบอร์ด" /><p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 opacity-50 text-left">Operations</p><NavButton active={activeTab === 'records'} onClick={()=>{setActiveTab('records');}} icon={<Store size={18} className="text-center"/>} label="บันทึกขาย/หน้าร้าน" /><NavButton active={activeTab === 'import'} onClick={()=>{setActiveTab('import');}} icon={<FileUp size={18} className="text-center"/>} label="Bulk Import" /><NavButton active={activeTab === 'stock'} onClick={()=>{setActiveTab('stock');}} icon={<Box size={18} className="text-center"/>} label="คลังสินค้า FIFO" /><NavButton active={activeTab === 'invoice'} onClick={()=>{setActiveTab('invoice'); setPreFillInvoice(null);}} icon={<Printer size={18} className="text-center"/>} label="ใบกำกับภาษี Pro" /><NavButton active={activeTab === 'reports'} onClick={()=>{setActiveTab('reports');}} icon={<ClipboardList size={18} className="text-center"/>} label="รายงานภาษี and บัญชี" /></nav>
        <div className="p-4 bg-black/20 border-t border-slate-800 space-y-2 text-left">
          <button onClick={toggleAppMode} className="w-full py-3 px-4 rounded-xl text-[10px] font-bold flex items-center justify-start gap-2 bg-slate-800 text-indigo-300 ring-1 ring-slate-700 hover:bg-slate-700 transition-all text-left"><Database size={14} className="text-center"/> DB Instance: {currentAppId}</button>
          
          <button onClick={() => setShowMigrateConfirm(true)} disabled={isMigrating} className={`w-full py-3 px-4 rounded-xl text-[10px] font-bold flex items-center justify-start gap-2 ring-1 transition-all text-left mt-2 ${isMigrating ? 'bg-amber-900/50 text-amber-500 ring-amber-800/50 cursor-not-allowed' : 'bg-amber-900/30 text-amber-300 ring-amber-800/50 hover:bg-amber-900/50'}`}>
            {isMigrating ? <Loader size={14} className="text-center animate-spin"/> : <RefreshCw size={14} className="text-center"/>} 
            {isMigrating ? 'กำลังรันเลขเอกสาร...' : 'รันเลขเอกสารที่ตกหล่น'}
          </button>

          <button onClick={()=>setShowIdDeleteTool(true)} className="w-full py-3 px-4 rounded-xl text-[10px] font-bold flex items-center justify-start gap-2 bg-rose-900/30 text-rose-300 ring-1 ring-rose-800/50 hover:bg-rose-900/50 transition-all text-left mt-2"><Trash2 size={14} className="text-center"/> ลบทิ้งด้วย ID</button>
          <button onClick={()=>signOut(authInstance)} className="w-full py-3 px-4 rounded-xl text-[10px] font-bold flex items-center justify-start gap-2 bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700 transition-all text-left mt-2"><LogOut size={14} className="text-center"/> ออกจากระบบ</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden relative text-left">
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 p-5 lg:px-10 flex justify-between items-center z-10 h-20 shrink-0 text-left"><div className="flex items-center gap-4 text-left"><h2 className="font-bold text-slate-800 text-sm uppercase tracking-widest text-left">{activeTab.replace('_', ' ')}</h2></div>{loading && <div className="text-[10px] font-black text-indigo-600 flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 animate-pulse text-left"><Loader size={12} className="animate-spin text-center"/> SYNCING</div>}</header>
        <div className="flex-1 overflow-auto p-6 lg:p-10 relative bg-[#f8fafc] text-left">{renderContent()}</div>
      </main>
    </div>
  );
}
