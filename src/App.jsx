import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PieChart, Wallet, FileText, Calculator, Save, TrendingUp, TrendingDown, 
  Download, Trash2, Edit, Menu, X, Printer, 
  CheckCircle, Loader, User, Package, Search, Clock, List, Settings, PlusCircle, Tag,
  Store, Code, Database, Image as ImageIcon, BarChart2, Activity, ShoppingBag, Eye, EyeOff, Inbox, XCircle, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, AlertTriangle, Calendar, Info, MapPin, Building, Layers, ArrowRightLeft, Percent, ClipboardList, Briefcase,
  Camera, Sparkles, ScanText, Zap, ChevronRight, Truck, Ticket, CreditCard
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
  IDS: { 
    PROD: 'eatsanduse', 
    DEV: 'merchant-tax-dev-v1',
    Y2026: 'eatsanduse-2026'
  },
  SHOPS: ['eats and use', 'bubee bubee', 'ไม่ระบุ'],
  CATEGORIES: {
    INCOME: [
      'รายได้จากการขายสินค้า',
      'รายได้จากการให้บริการ',
      'รายได้ค่านายหน้า/ตัวแทน',
      'รายได้อื่นๆ (ดอกเบี้ย, เงินปันผล)'
    ],
    EXPENSE: ['ค่าใช้จ่ายทั่วไป', 'ต้นทุนสินค้า', 'สินค้าเสียหาย/หมดอายุ', 'ค่าบริการ/จ้างทำของ', 'ค่าโฆษณา (ในประเทศ)', 'ค่าโฆษณา (ภ.พ.36)', 'ค่าธรรมเนียม Platform', 'ค่าขนส่ง', 'ค่าเช่า', 'เงินเดือน', 'ภาษี/เบี้ยปรับ', 'ส่วนลดร้านค้า'],
    STOCK: [
      'อาหารและเครื่องดื่ม (Food & Beverage)',
      'ของใช้ส่วนตัว (Personal Care)',
      'ผลิตภัณฑ์ในครัวเรือน (Household)',
      'ผลิตภัณฑ์ดูแลผ้า (Fabric Care)',
      'แม่และเด็ก (Mother & Baby)',
      'สุขภาพและความงาม (Health & Beauty)',
      'สัตว์เลี้ยง (Pet Care)',
      'ขนมและของว่าง (Snacks)',
      'เครื่องปรุง/วัตถุดิบ (Cooking Essentials)',
      'อาหารสดและอาหารแช่แข็ง (Fresh & Frozen Food)',
      'อื่นๆ (Others)'
    ]
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
    #invoice-preview-area, #invoice-preview-modal-area, #tax-report-print-area, #tax-report-print-area *, #annual-tax-print-area, #annual-tax-print-area *, #inventory-tax-report-area, #inventory-tax-report-area *, #financial-position-print-area, #financial-position-print-area * { visibility: visible; } 
    #tax-report-print-area, #annual-tax-print-area, #inventory-tax-report-area, #financial-position-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 10mm; background: white; }
    .no-print { display: none !important; } 
  }
`;

// --- Firebase Initialization ---
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
const authInstance = getAuth(firebaseApp);
const dbInstance = getFirestore(firebaseApp);

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
    if (baht === "0") {
        text = "ศูนย์";
    } else {
        text = convert(baht);
    }
    
    text += 'บาท';
    if (parseInt(satang) === 0) {
        text += 'ถ้วน';
    } else {
        const satangText = convert(satang);
        text += (satangText || 'ศูนย์') + 'สตางค์';
    }
    return text;
};

const calculateProgressiveTax = (taxableIncome) => {
  let tax = 0;
  const brackets = [
    { limit: 150000, rate: 0 },
    { limit: 300000, rate: 0.05 },
    { limit: 500000, rate: 0.10 },
    { limit: 750000, rate: 0.15 },
    { limit: 1000000, rate: 0.20 },
    { limit: 2000000, rate: 0.25 },
    { limit: 5000000, rate: 0.30 },
    { limit: Infinity, rate: 0.35 }
  ];

  let remaining = taxableIncome;
  let prevLimit = 0;

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const rangeSize = bracket.limit - prevLimit;
    const amountInBracket = Math.min(remaining, rangeSize);
    tax += amountInBracket * bracket.rate;
    remaining -= amountInBracket;
    prevLimit = bracket.limit;
  }
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

const downloadInvoicePDF = async (elementId, invNo, showToast) => {
    const element = document.getElementById(elementId); 
    if (!element) return;
    if (showToast) showToast("กำลังเตรียมไฟล์ PDF...", "success");
    const loadScript = (src) => new Promise(res => { const s = document.createElement('script'); s.src = src; s.onload = res; document.body.appendChild(s); });
    if (!window.html2pdf) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
    if (!window.JSZip) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
    const zip = new window.JSZip();
    const generatePDFBlob = async (statusLabel, scale = 2) => {
        const badge = element.querySelector('.status-badge');
        if (badge) badge.innerText = statusLabel;
        await new Promise(res => setTimeout(res, 300)); 
        const opt = { 
            margin: 0, 
            image: { type: 'jpeg', quality: 0.98 }, 
            html2canvas: { scale: scale, useCORS: true }, 
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
        };
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
        if (showToast) showToast("ดาวน์โหลดสำเร็จ", "success");
    } catch (e) { 
        console.error(e);
        if (showToast) showToast("เกิดข้อผิดพลาด", "error"); 
    }
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
        {trend === 0 ? '' : isPos ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
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

const InvoicePreviewModal = ({ transaction, onClose, showToast }) => {
    const savedSeller = JSON.parse(localStorage.getItem('merchant_seller_info') || '{}');
    const items = Array.isArray(transaction.items) && transaction.items.length > 0 
        ? transaction.items 
        : [{ desc: transaction.description || "รายการสินค้า/บริการ", amount: transaction.total || 0, qty: 1, price: transaction.total || 0 }];
    const discount = Number(transaction.discount || transaction.shopDiscount || 0);
    const sub = items.reduce((sum, item) => sum + (Number(item.amount || item.price * item.qty) || 0), 0);
    const afterDisc = sub - discount;
    let vat = 0, total = 0, preVat = 0;
    const vatType = transaction.vatType || 'included'; 
    if (vatType === 'included') { total = afterDisc; preVat = total * 100 / 107; vat = total - preVat; } 
    else if (vatType === 'excluded') { preVat = afterDisc; vat = preVat * 0.07; total = preVat + vat; } 
    else { preVat = afterDisc; vat = 0; total = preVat; }
    const handleDownload = () => downloadInvoicePDF('invoice-preview-modal-area', transaction.invNo || "DRAFT", showToast);
    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto font-sarabun text-left">
            <div className="bg-white rounded-[32px] w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl animate-fadeIn overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50 text-left">
                    <div className="text-left w-full">
                        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><Printer className="text-indigo-600"/> Reprint Invoice</h3>
                        <p className="text-xs text-slate-500">รูปแบบเอกสารเดียวกับเมนูออกใบกำกับภาษี</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X/></button>
                </div>
                <div className="flex-1 overflow-auto bg-slate-200 p-4 md:p-10 flex justify-center">
                    <div id="invoice-preview-modal-area" className="shadow-2xl bg-white p-[30px] w-[210mm] min-h-[296mm] text-sm font-sarabun text-slate-900 leading-relaxed relative box-border text-left">
                        <div className="flex justify-between items-start mb-8 text-left">
                            <div className="w-[65%] flex items-center gap-5 text-left">
                                {savedSeller.logo && (<img src={savedSeller.logo} className="w-[90px] h-[90px] object-contain flex-shrink-0 text-left" alt="Logo"/>)}
                                <div className="flex flex-col justify-center text-left">
                                    <h2 className="text-xl font-bold text-slate-900 mb-1 leading-tight text-left">{savedSeller.sellerName || 'ชื่อร้านค้า'}</h2>
                                    <p className="text-slate-600 text-xs leading-snug mb-1 text-left">
                                        {[savedSeller.sellerAddress, savedSeller.sellerSubDistrict, savedSeller.sellerDistrict, savedSeller.sellerProvince, savedSeller.sellerZipCode].filter(Boolean).join(' ')}
                                    </p>
                                    <div className="text-xs text-slate-700 leading-snug text-left">
                                        <p className="text-left"><b>เลขผู้เสียภาษี:</b> {savedSeller.sellerTaxId || '-'} <b>สาขา:</b> {savedSeller.sellerBranchId || '-'}</p>
                                        <p className="text-left"><b>โทร:</b> {savedSeller.sellerPhone || '-'} {savedSeller.sellerEmail && <><b>Email:</b> {savedSeller.sellerEmail}</>}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right w-[35%] flex flex-col items-end text-right">
                                <div className="text-lg font-bold uppercase mb-1 text-right">ใบกำกับภาษี / ใบเสร็จรับเงิน</div>
                                <div className="border border-slate-300 p-2 w-full max-w-[200px] text-right">
                                    <div className="flex justify-between mb-1 text-right"><span className="font-bold text-slate-500 text-xs">เลขที่ (No.)</span><span className="font-bold">{transaction.invNo || "DRAFT"}</span></div>
                                    <div className="flex justify-between mb-1 text-right"><span className="font-bold text-slate-500 text-xs">วันที่ (Date)</span><span>{formatDate(transaction.date)}</span></div>
                                    <div className="flex justify-between text-right"><span className="font-bold text-slate-500 text-xs">อ้างอิง (Ref.)</span><span>{transaction.orderId || "-"}</span></div>
                                </div>
                                <div className="mt-2 text-right">
                                    <span className="px-3 py-1 border rounded text-xs font-bold uppercase border-black text-black status-badge">ต้นฉบับ (Original)</span>
                                </div>
                            </div>
                        </div>
                        <div className="border border-slate-300 p-4 mb-4 flex gap-4 text-left">
                            <div className="flex-1 text-left">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1 text-left">ลูกค้า (Customer)</div>
                                <p className="font-bold text-base mb-1 text-left">{transaction.customerName || "ลูกค้าทั่วไป"}</p>
                                <p className="text-slate-600 text-sm leading-loose mb-2 whitespace-pre-wrap text-left">
                                    {transaction.address || transaction.customerAddress || "-"}
                                </p>
                            </div>
                            <div className="w-[40%] border-l border-slate-200 pl-6 flex flex-col justify-center text-sm text-left">
                                <div className="grid grid-cols-[max-content_10px_1fr] gap-y-1.5 text-left">
                                    <span className="font-bold text-slate-500 text-left">เลขผู้เสียภาษี</span><span className="text-center">:</span><span className="text-left">{transaction.taxId || transaction.customerTaxId || "-"}</span>
                                    <span className="font-bold text-slate-500 text-left">สาขาที่</span><span className="text-center">:</span><span className="text-left">{transaction.branch || transaction.customerBranch || "-"}</span>
                                </div>
                            </div>
                        </div>
                        <table className="w-full mb-6 border-collapse text-left">
                            <thead>
                                <tr className="bg-slate-100 text-slate-800 font-bold text-xs uppercase text-center">
                                    <th className="py-2 border-y border-slate-300 w-12 text-center">ลำดับ<br/>No.</th>
                                    <th className="py-2 border-y border-slate-300 text-left pl-4 text-left">รายการสินค้า / บริการ<br/>Description</th>
                                    <th className="py-2 border-y border-slate-300 w-20 text-center">จำนวน<br/>Qty</th>
                                    <th className="py-2 border-y border-slate-300 w-24 text-right">หน่วยละ<br/>Unit Price</th>
                                    <th className="py-2 border-y border-slate-300 w-28 text-right">จำนวนเงิน<br/>Amount</th>
                                </tr>
                            </thead>
                            <tbody className="text-left">
                                {items.map((it, i) => (
                                    <tr key={"item-" + i} className="text-left">
                                        <td className="py-2 border-b border-slate-200 text-center align-top">{i+1}</td>
                                        <td className="py-2 border-b border-slate-200 pl-4 align-top text-left">{it.desc}</td>
                                        <td className="py-2 border-b border-slate-200 text-center align-top">{it.qty || 1}</td>
                                        <td className="py-2 border-b border-slate-200 text-right pr-2 align-top">{formatCurrency(Number(it.price || it.amount)/(it.qty||1))}</td>
                                        <td className="py-2 border-b border-slate-200 text-right pr-2 font-bold align-top">{formatCurrency(Number(it.amount || it.price))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex justify-between items-start">
                            <div className="flex-1 mt-4 mr-4">
                                <div className="bg-white p-2.5 rounded-sm border border-slate-400 text-center font-bold text-slate-900 text-[13px] leading-tight shadow-sm">
                                    ({THBText(total)})
                                </div>
                            </div>
                            <div className="w-[40%] text-right">
                                <div className="grid grid-cols-[auto_auto] gap-y-2 text-right text-sm text-right">
                                    <span className="font-bold text-slate-600 text-right">รวมเป็นเงิน</span><span className="font-medium">{formatCurrency(sub)}</span>
                                    {discount > 0 && <><span className="font-bold text-rose-600 text-right">หักส่วนลด</span><span className="text-rose-600">-{formatCurrency(discount)}</span></>}
                                    <span className="font-bold text-slate-600 text-right">มูลค่าสินค้า (Pre-VAT)</span><span className="font-medium">{formatCurrency(preVat)}</span>
                                    <span className="font-bold text-slate-600 text-right">ภาษีมูลค่าเพิ่ม 7%</span><span className="font-medium">{formatCurrency(vat)}</span>
                                    <div className="col-span-2 border-t border-black my-1 text-right"></div>
                                    <span className="font-bold text-slate-900 text-lg text-right">จำนวนเงินทั้งสิ้น</span><span className="font-bold text-slate-900 text-lg">{formatCurrency(total)}</span>
                                    <div className="col-span-2 border-t-2 border-black my-0.5 text-right"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-12 px-8 absolute bottom-10 w-[calc(100%-60px)] text-center">
                            <div className="text-center w-[40%] text-slate-700">
                                <div className="border-b border-dotted border-slate-400 h-8 mb-2 text-center"></div>
                                <p className="text-xs font-bold text-center">ผู้รับวางบิล / ผู้รับของ</p>
                                <p className="text-xs font-bold text-slate-400 uppercase text-center">(Receiver Signature)</p>
                            </div>
                            <div className="text-center w-[40%] text-slate-700">
                                <div className="h-12 flex items-center justify-center relative">
                                    {(transaction.signature || savedSeller.signature) && <img src={transaction.signature || savedSeller.signature} className="h-16 object-contain absolute bottom-4" alt="Signature"/>}
                                    <div className="border-b border-dotted border-slate-400 w-full mb-2"></div>
                                </div>
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

// --- Financial Position (Balance Sheet) Component ---
const FinancialPosition = ({ transactions, invoices, inventoryLots, sellerInfo }) => {
  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const cashAndRetainedEarnings = totalIncome - totalExpense;

    const accountsReceivable = invoices.filter(inv => inv.type === 'invoice' && inv.status !== 'paid').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

    const inventoryValue = inventoryLots.reduce((sum, lot) => sum + ((Number(lot.remainingQty) || 0) * (Number(lot.costPerUnit) || 0)), 0);

    const totalAssets = Math.max(0, cashAndRetainedEarnings) + accountsReceivable + inventoryValue;

    const salesVat = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.vat) || 0), 0);
    const purchaseVat = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.vat) || 0), 0);
    const vatPayable = Math.max(0, salesVat - purchaseVat);

    const totalLiabilities = vatPayable; 

    const ownersEquity = totalAssets - totalLiabilities;

    return { cashAndRetainedEarnings, accountsReceivable, inventoryValue, totalAssets, vatPayable, totalLiabilities, ownersEquity };
  }, [transactions, invoices, inventoryLots]);

  return (
    <div className="space-y-6 animate-fadeIn font-sarabun text-left pb-10">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4 no-print">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Briefcase className="text-indigo-600"/> Financial Position (สรุปฐานะการเงิน)</h3>
          <p className="text-slate-500 text-sm">งบดุลย่อเพื่อวิเคราะห์ความมั่งคั่งและสภาพคล่องของกิจการ</p>
        </div>
        <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md"><Printer size={16}/> พิมพ์งบดุล</button>
      </div>

      <div id="financial-position-print-area" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100 h-full">
            <h4 className="text-lg font-bold text-emerald-800 mb-6 flex items-center justify-between">
              1. สินทรัพย์ (Assets) 
              <span className="text-xs font-normal text-emerald-600">"สิ่งที่เรามี"</span>
            </h4>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-50 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">เงินสดและกำไรสะสม</p>
                  <p className="text-lg font-bold text-slate-700">{formatCurrency(stats.cashAndRetainedEarnings)}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><Wallet size={20}/></div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-50 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">ลูกหนี้การค้า (รอเก็บเงิน)</p>
                  <p className="text-lg font-bold text-slate-700">{formatCurrency(stats.accountsReceivable)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600"><FileText size={20}/></div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-50 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">สินค้าคงคลัง (มูลค่าทุน)</p>
                  <p className="text-lg font-bold text-slate-700">{formatCurrency(stats.inventoryValue)}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl text-orange-600"><Package size={20}/></div>
              </div>
              <div className="pt-6 border-t border-emerald-200 mt-6 flex justify-between items-end">
                <span className="text-sm font-bold text-emerald-800 uppercase">รวมสินทรัพย์ทั้งสิ้น</span>
                <span className="text-3xl font-black text-emerald-600">{formatCurrency(stats.totalAssets)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-rose-50/50 p-6 rounded-[32px] border border-rose-100">
            <h4 className="text-lg font-bold text-rose-800 mb-6 flex items-center justify-between">
              2. หนี้สิน (Liabilities)
              <span className="text-xs font-normal text-rose-600">"สิ่งที่เราติดค้าง"</span>
            </h4>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-50 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">ภาษีมูลค่าเพิ่มค้างจ่าย (Net VAT)</p>
                  <p className="text-lg font-bold text-slate-700">{formatCurrency(stats.vatPayable)}</p>
                </div>
                <div className="p-3 bg-rose-100 rounded-xl text-rose-600"><TrendingDown size={20}/></div>
              </div>
              <div className="pt-6 border-t border-rose-200 mt-4 flex justify-between items-end">
                <span className="text-sm font-bold text-rose-800 uppercase">รวมหนี้สินทั้งสิ้น</span>
                <span className="text-2xl font-bold text-rose-600">{formatCurrency(stats.totalLiabilities)}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 text-white p-8 rounded-[32px] shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">3. ส่วนของเจ้าของ (Owner's Equity)</h4>
              <p className="text-4xl font-black text-white">{formatCurrency(stats.ownersEquity)}</p>
              <p className="text-indigo-300 text-xs mt-4 leading-relaxed">มูลค่าความมั่งคั่งสุทธิของกิจการ ณ ปัจจุบัน (สินทรัพย์ - หนี้สิน)</p>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-10"><Briefcase size={180}/></div>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-start gap-4">
             <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Info size={24}/></div>
             <div>
                <h5 className="font-bold text-slate-700 mb-1">คำแนะนำการวิเคราะห์</h5>
                <p className="text-xs text-slate-500 leading-loose">
                  สมการบัญชี: {formatCurrency(stats.totalAssets)} (สินทรัพย์) = {formatCurrency(stats.totalLiabilities)} (หนี้สิน) + {formatCurrency(stats.ownersEquity)} (ทุน) <br/>
                  หากส่วนของเจ้าของเป็นบวกและเพิ่มขึ้นอย่างต่อเนื่อง แสดงว่าธุรกิจมีการเติบโตและมีความมั่นคงสูง.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Annual Tax Calculator Component ---
const AnnualTaxCalculator = ({ user, transactions, showToast }) => {
  const [deductionType, setDeductionType] = useState('standard'); 
  const [personalAllowance, setPersonalAllowance] = useState(60000);
  const [otherDeductions, setOtherDeductions] = useState(0);

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const actualExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const standardExpense = income * 0.60;
    const deductibleExpense = deductionType === 'standard' ? standardExpense : actualExpense;
    const taxableIncomeBase = Math.max(0, income - deductibleExpense - personalAllowance - otherDeductions);
    const tax = calculateProgressiveTax(taxableIncomeBase);
    return { income, actualExpense, standardExpense, deductibleExpense, taxableIncomeBase, tax };
  }, [transactions, deductionType, personalAllowance, otherDeductions]);

  return (
    <div className="space-y-6 animate-fadeIn font-sarabun text-left pb-10">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4 no-print">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Calculator className="text-indigo-600"/> Annual Personal Income Tax (PIT)</h3>
          <p className="text-slate-500 text-sm">ประมาณการภาษีเงินได้บุคคลธรรมดาประจำปี (ภ.ง.ด. 90)</p>
        </div>
        <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md no-print"><Printer size={16}/> พิมพ์รายงาน</button>
      </div>

      <div id="annual-tax-print-area" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <h4 className="font-bold text-lg text-slate-700 border-b pb-4">ขั้นตอนที่ 1: รายได้และค่าใช้จ่าย</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-indigo-50 p-6 rounded-3xl">
                    <p className="text-xs font-bold text-indigo-400 uppercase mb-1">รายได้รวม (40(8))</p>
                    <p className="text-3xl font-bold text-indigo-700">{formatCurrency(stats.income)}</p>
                </div>
                <div className="p-2 space-y-3">
                    <label className="text-sm font-bold text-slate-600 block">รูปแบบการหักค่าใช้จ่าย</label>
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl no-print">
                        <button onClick={() => setDeductionType('standard')} className={"flex-1 py-2 rounded-lg text-xs font-bold transition-all " + (deductionType === 'standard' ? 'bg-white shadow text-indigo-600' : 'text-slate-500')}>เหมา 60%</button>
                        <button onClick={() => setDeductionType('actual')} className={"flex-1 py-2 rounded-lg text-xs font-bold transition-all " + (deductionType === 'actual' ? 'bg-white shadow text-indigo-600' : 'text-slate-500')}>ตามจริง</button>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1"><Info size={12}/> {deductionType === 'standard' ? 'เหมาะสำหรับร้านขายของอุปโภคบริโภคทั่วไป' : 'ต้องมีเอกสารใบกำกับภาษีซื้อครบถ้วน'}</div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">หักค่าใช้จ่าย ({deductionType === 'standard' ? 'เหมา' : 'ตามจริง'})</span><span className="font-bold text-rose-600">-{formatCurrency(stats.deductibleExpense)}</span></div>
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200"><span className="text-slate-700">รายได้หลังหักค่าใช้จ่าย</span><span className="text-indigo-600">{formatCurrency(stats.income - stats.deductibleExpense)}</span></div>
                </div>
                
                <div className="space-y-4">
                    <h5 className="font-bold text-sm text-slate-700 flex items-center gap-2"><Percent size={14} className="text-indigo-500"/> รายการลดหย่อนเพิ่มเติม</h5>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">ค่าลดหย่อนส่วนตัว</label>
                            <input type="number" className="w-full bg-slate-50 border-0 rounded-xl p-2.5 text-sm font-bold text-slate-700" value={personalAllowance} onChange={e => setPersonalAllowance(Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">ลดหย่อนอื่นๆ (ประกัน, SSF, ฯลฯ)</label>
                            <input type="number" className="w-full bg-slate-50 border-0 rounded-xl p-2.5 text-sm font-bold text-slate-700" value={otherDeductions} onChange={e => setOtherDeductions(Number(e.target.value))} />
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 text-white p-8 rounded-[40px] shadow-xl relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                    <h4 className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">เงินได้สุทธิที่ต้องนำไปคำนวณ</h4>
                    <p className="text-4xl font-bold">{formatCurrency(stats.taxableIncomeBase)}</p>
                    <p className="text-indigo-300 text-xs mt-4">คำนวณตามบัญชีอัตราภาษีเงินได้บุคคลธรรมดา พ.ศ. 2567</p>
                </div>
                <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10">
                    <p className="text-indigo-200 text-xs font-bold uppercase mb-1">ภาษีที่ต้องชำระทั้งสิ้น</p>
                    <p className="text-4xl font-black text-emerald-400">{formatCurrency(stats.tax)}</p>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-indigo-300 uppercase">Avg. Tax Rate</span>
                        <span className="text-sm font-bold">{stats.income > 0 ? ((stats.tax / stats.income) * 100).toFixed(2) : 0}%</span>
                    </div>
                </div>
            </div>
            <div className="absolute -left-10 -bottom-10 opacity-10"><Calculator size={200}/></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><BarChart2 size={18}/> Progressive Tax Breakdown</h4>
            <div className="space-y-4">
              {[
                { label: '0 - 150k (ยกเว้น)', limit: 150000, rate: 0 },
                { label: '150k - 300k (5%)', limit: 300000, rate: 5 },
                { label: '300k - 500k (10%)', limit: 500000, rate: 10 },
                { label: '500k - 750k (15%)', limit: 750000, rate: 15 },
                { label: '750k - 1M (20%)', limit: 1000000, rate: 20 },
                { label: '1M - 2M (25%)', limit: 2000000, rate: 25 },
                { label: '2M - 5M (30%)', limit: 5000000, rate: 30 },
                { label: '5M ขึ้นไป (35%)', limit: Infinity, rate: 35 }
              ].map((b, i) => {
                const isActive = stats.taxableIncomeBase > (i === 0 ? 0 : [0, 150000, 300000, 500000, 750000, 1000000, 2000000, 5000000][i]);
                return (
                  <div key={i} className={"flex justify-between items-center p-2.5 rounded-xl transition-all " + (isActive ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'opacity-40')}>
                    <span className="text-[10px] font-bold text-slate-600">{b.label}</span>
                    {isActive && <CheckCircle size={12} className="text-indigo-500"/>}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100">
             <h4 className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2"><Info size={16}/> คำแนะนำทางภาษี</h4>
             <p className="text-emerald-700 text-xs leading-loose">
                หากรายได้สุทธิของคุณเกิน 150,000 บาท คุณเริ่มมีภาระภาษี การวางแผนหักค่าใช้จ่าย "ตามจริง" อาจช่วยลดภาษีได้มากกว่าหากคุณมีต้นทุนสินค้าที่สูงเกินกว่า 60% ของยอดขาย.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Central Analytics Component with Selectors ---
const CentralAnalytics = ({ user, showToast }) => {
  const [multiYearData, setMultiYearData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [baseId, setBaseId] = useState(CONSTANTS.IDS.PROD);
  const [compId, setCompId] = useState(CONSTANTS.IDS.Y2026);
  const getLabel = (id) => {
    if (id === CONSTANTS.IDS.PROD) return 'Production (2025)';
    if (id === CONSTANTS.IDS.DEV) return 'Dev Mode';
    if (id === CONSTANTS.IDS.Y2026) return 'Y2026 Database';
    return id;
  };
  const fetchCrossYearData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const selectedYears = [ { id: baseId, label: getLabel(baseId) }, { id: compId, label: getLabel(compId) } ];
      const results = await Promise.all(selectedYears.map(async (year) => {
        const qInc = query(collection(dbInstance, 'artifacts', year.id, 'public', 'data', 'transactions_income'));
        const qExp = query(collection(dbInstance, 'artifacts', year.id, 'public', 'data', 'transactions_expense'));
        const [snapInc, snapExp] = await Promise.all([getDocs(qInc), getDocs(qExp)]);
        const income = snapInc.docs.reduce((sum, d) => sum + (Number(d.data().total) || 0), 0);
        const expense = snapExp.docs.reduce((sum, d) => sum + (Number(d.data().total) || 0), 0);
        return { label: year.label, income, expense, profit: income - expense };
      }));
      setMultiYearData(results);
    } catch (e) {
      showToast("ไม่สามารถโหลดข้อมูลเปรียบเทียบได้", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchCrossYearData(); }, [user, baseId, compId]);
  return (
    <div className="space-y-6 animate-fadeIn font-sarabun text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Layers className="text-indigo-600"/> Analytics Comparison</h3>
          <p className="text-slate-500 text-sm">เลือกจับคู่ฐานข้อมูลเพื่อวิเคราะห์ผลประกอบการ</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar">
            <div className="flex flex-col px-2 min-w-[140px]">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Base Database</span>
                <select value={baseId} onChange={e => setBaseId(e.target.value)} className="bg-transparent border-0 p-0 text-xs font-bold text-indigo-600 focus:ring-0 cursor-pointer">
                    {Object.values(CONSTANTS.IDS).map(id => <option key={`base-${id}`} value={id}>{getLabel(id)}</option>)}
                </select>
            </div>
            <div className="p-2 bg-slate-50 rounded-full text-slate-400"><ArrowRightLeft size={14}/></div>
            <div className="flex flex-col px-2 min-w-[140px]">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Compare With</span>
                <select value={compId} onChange={e => setCompId(e.target.value)} className="bg-transparent border-0 p-0 text-xs font-bold text-indigo-600 focus:ring-0 cursor-pointer">
                    {Object.values(CONSTANTS.IDS).map(id => <option key={`comp-${id}`} value={id}>{getLabel(id)}</option>)}
                </select>
            </div>
            <button onClick={fetchCrossYearData} className="ml-2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95">
                <Clock size={16}/>
            </button>
        </div>
      </div>
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader className="animate-spin mb-4" size={32}/>
          <p>กำลังดึงข้อมูลเปรียบเทียบ...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500"/> รายรับเปรียบเทียบ (Income)</h4>
            <div className="space-y-6">
              {multiYearData.map((d, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-600">{d.label}</span>
                    <span className="text-indigo-600">{formatCurrency(d.income)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-inner" style={{width: `${Math.min((d.income / Math.max(...multiYearData.map(x=>x.income))) * 100, 100)}%`}}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><Wallet size={18} className="text-indigo-500"/> กำไรสุทธิ (Net Profit)</h4>
            <div className="space-y-6">
              {multiYearData.map((d, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-600">{d.label}</span>
                    <span className={d.profit >= 0 ? "text-emerald-600" : "text-rose-600"}>{formatCurrency(d.profit)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                    <div className={"h-full rounded-full transition-all duration-1000 shadow-inner " + (d.profit >= 0 ? "bg-emerald-500" : "bg-rose-500")} style={{width: `${Math.min((Math.abs(d.profit) / Math.max(...multiYearData.map(x=>Math.abs(x.profit)))) * 100, 100)}%`}}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-8 rounded-[40px] shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                  <h4 className="text-xl font-bold mb-3 flex items-center gap-2"><Info size={20}/> ข้อมูลการวิเคราะห์</h4>
                  <p className="text-indigo-100 text-sm leading-relaxed max-w-2xl opacity-90">
                      หน้านี้ทำการดึงข้อมูลแบบ Real-time จากฐานข้อมูล {multiYearData.length} ตัวที่คุณเลือก 
                      ช่วยให้คุณเห็นประสิทธิภาพการดำเนินงานข้ามฐานข้อมูลได้ทันที โดยไม่ต้องสลับโหมดการทำงานหลัก.
                  </p>
                  <div className="mt-6 flex gap-4">
                    <div className="bg-white/10 px-4 py-2 rounded-2xl">
                        <p className="text-[10px] text-indigo-300 font-bold uppercase">Base Avg</p>
                        <p className="text-lg font-bold">{formatCurrency(multiYearData[0]?.income / 12)} /mo</p>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-2xl">
                        <p className="text-[10px] text-indigo-300 font-bold uppercase">Comp Avg</p>
                        <p className="text-lg font-bold">{formatCurrency(multiYearData[1]?.income / 12)} /mo</p>
                    </div>
                  </div>
              </div>
              <div className="absolute -right-10 -bottom-10 opacity-10"><BarChart2 size={240}/></div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Dashboard Component ---
const Dashboard = ({ transactions, invoices }) => {
  const [period, setPeriod] = useState('month'); 
  const [showValues, setShowValues] = useState(true);
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
    const filterTrans = (range) => transactions.filter(t => t.date >= range.start && t.date <= range.end);
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
    const unpaidTotal = invoices.filter(inv => inv.type === 'invoice' && inv.status !== 'paid').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    return { totalIncome, totalExpense, incomeTrend, expenseTrend, netProfit, profitMargin, operatingRatio, trendData, unpaidTotal };
  }, [transactions, invoices, period]);

  return (
    <div className="space-y-6 w-full max-w-[2400px] mx-auto pb-10 animate-fadeIn p-4 md:p-6 bg-slate-50/50 text-left">
        <div className="flex flex-row justify-between items-center gap-4 text-left border-b border-slate-100 pb-4 mb-2">
            <div className="text-left">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">แดชบอร์ดผลงาน (Performance)</h2>
                <p className="text-slate-500 text-xs md:text-sm">วิเคราะห์ผลประกอบการแบบ Real-time</p>
            </div>
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                {['day', 'week', 'month', 'year', 'all'].map(p => (
                  <button key={p} onClick={() => setPeriod(p)} className={"whitespace-nowrap px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all " + (period === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50')}>
                    {p === 'day' ? 'วันนี้' : p === 'week' ? 'สัปดาห์นี้' : p === 'month' ? 'เดือนนี้' : p === 'year' ? 'ปีนี้' : 'ทั้งหมด'}
                  </button>
                ))}
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
                        <h3 className="font-bold text-slate-700 flex items-center gap-2 text-left text-left"><Activity className="text-rose-500"/> Financial Health (Operating Ratio)</h3>
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
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[400px] text-left">
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
    </div>
  );
};

// --- RecordManager Component ---
const RecordManager = ({ user, transactions, invoices, appId, showToast }) => {
  const [subTab, setSubTab] = useState('new'); 
  const [histFilterType, setHistFilterType] = useState('all');
  const [deleteId, setDeleteId] = useState(null); 
  const [isDeleting, setIsDeleting] = useState(false);
  const [historySearch, setHistorySearch] = useState(''); 
  const [editingId, setEditingId] = useState(null);
  const [previewInvoiceTransaction, setPreviewInvoiceTransaction] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [stockProducts, setStockProducts] = useState([]);
  const [inventoryLots, setInventoryLots] = useState([]); 
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState('year'); 
  const currentYear = new Date().getFullYear();
  const [draftStatus, setDraftStatus] = useState(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  
  // AI Billing States
  const [isAIScanning, setIsAIScanning] = useState(false);
  const billingScanRef = useRef(null);

  const initialForm = { 
    type: 'income', shop: CONSTANTS.SHOPS[0], date: new Date().toISOString().split('T')[0], description: '', 
    amount: '', vatType: 'included', whtRate: 0, channel: CONSTANTS.CHANNELS[0], orderId: '', 
    category: CONSTANTS.CATEGORIES.INCOME[0], taxInvoiceNo: '', vendorName: '', vendorTaxId: '', 
    vendorBranch: '00000', vendorBranchName: '', vendorAddress: '', isTaxInvoiceReq: false, 
    customerName: '', customerTaxId: '', customerBranch: '00000', customerAddress: '',
    expenseDiscount: '', voucherDiscount: '', grossAmount: '', items: [{ desc: '', qty: 1, amount: '' }],
    customerShipping: '', platformFee: '', shippingCost: '', shopDiscount: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [magicPrompt, setMagicPrompt] = useState('');
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isEcommerceMode, setIsEcommerceMode] = useState(false);

  const groupedProducts = useMemo(() => {
    const filtered = stockProducts.filter(p =>
      p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
    const groups = {};
    filtered.forEach(product => {
      const cat = product.category || 'อื่นๆ';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(product);
    });
    return groups;
  }, [stockProducts, productSearchTerm]);

  useEffect(() => {
    const savedDraft = localStorage.getItem('merchant_draft_record');
    if (savedDraft && subTab === 'new' && !editingId) {
        try {
            const draft = JSON.parse(savedDraft);
            if (draft.amount || draft.description || (draft.items && draft.items.length > 1) || draft.items[0].desc) {
                setFormData(prev => ({...prev, ...draft}));
                setDraftStatus('restored');
                showToast("กู้คืนข้อมูลล่าสุดอัตโนมัติ", "success");
            }
        } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (subTab === 'new' && !editingId) {
        const timeout = setTimeout(() => {
            if (formData.amount || formData.description || (formData.items.length > 0 && formData.items[0].desc)) {
                localStorage.setItem('merchant_draft_record', JSON.stringify(formData));
                setDraftStatus('saved');
            }
        }, 1000);
        return () => clearTimeout(timeout);
    }
  }, [formData, subTab, editingId]);

  useEffect(() => { setIsEcommerceMode(formData.type === 'income' && ['Shopee', 'Lazada', 'TikTok'].includes(formData.channel)); }, [formData.channel, formData.type]);
  useEffect(() => {
      if (user) {
          const unsubVendors = onSnapshot(query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'vendors')), (snap) => setVendors(snap.docs.map(d=>({id:d.id, ...d.data()}))));
          const unsubCustomers = onSnapshot(query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'customers')), (snap) => setCustomers(snap.docs.map(d=>({id:d.id, ...d.data()}))));
          const unsubStock = onSnapshot(query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'products')), (snap) => setStockProducts(snap.docs.map(d=>({id:d.id, ...d.data()}))));
          const unsubLots = onSnapshot(query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_lots')), (snap) => setInventoryLots(snap.docs.map(d=>({id:d.id, ...d.data()}))));
          return () => { unsubVendors(); unsubCustomers(); unsubStock(); unsubLots(); };
      }
  }, [user, appId]);

  const historyStats = useMemo(() => {
    const filtered = transactions.filter(t => {
        if (histFilterType !== 'all' && t.type !== histFilterType) return false;
        const searchMatch = !historySearch || t.description?.toLowerCase().includes(historySearch.toLowerCase()) || t.amount?.toString().includes(historySearch) || t.orderId?.toLowerCase().includes(historySearch.toLowerCase());
        if (!searchMatch) return false;
        const d = normalizeDate(t.date);
        if (d.getFullYear() !== selectedYear) return false;
        const now = new Date();
        if (viewMode === 'day') return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
        else if (viewMode === 'week') return getWeekNumber(d) === getWeekNumber(now);
        else if (viewMode === 'month') return d.getMonth() === now.getMonth();
        return true; 
    });
    const totalAmount = filtered.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const count = filtered.length;
    const avg = count > 0 ? totalAmount / count : 0;
    const trendMap = {}; filtered.forEach(t => { const d = normalizeDate(t.date); const dateKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; if (!trendMap[dateKey]) trendMap[dateKey] = { date: d, income: 0, expense: 0 }; if (t.type === 'income') trendMap[dateKey].income += Number(t.total); else trendMap[dateKey].expense += Number(t.total); });
    const trendData = Object.values(trendMap).sort((a,b) => a.date - b.date).slice(-14);
    return { totalAmount, count, avg, trendData, filtered };
  }, [transactions, histFilterType, selectedYear, viewMode, historySearch]);
    
  const calculated = useMemo(() => { 
      let baseAmount = 0;
      if (formData.items.length > 0) { baseAmount = formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0); } 
      else { baseAmount = parseFloat(formData.amount) || 0; }
      const expDiscount = parseFloat(formData.expenseDiscount) || 0;
      const voucherDiscount = parseFloat(formData.voucherDiscount) || 0;
      const totalAfterDiscount = baseAmount - expDiscount - voucherDiscount;
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
      return { net, vat, total: formData.vatType === 'excluded' ? net + vat : finalAmount, baseAmount, estimatedPayout, totalAfterDiscount }; 
  }, [formData]);
  
  const saveVendorProfile = async () => {
      if (!formData.vendorName) { showToast("กรุณาระบุชื่อร้านค้า", "error"); return; }
      try {
          await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'vendors'), {
              vendorName: formData.vendorName, vendorTaxId: formData.vendorTaxId || '', vendorBranch: formData.vendorBranch || '', vendorBranchName: formData.vendorBranchName || '', vendorAddress: formData.vendorAddress || '', createdAt: serverTimestamp()
          });
          showToast("บันทึกข้อมูลคู่ค้าเรียบร้อย", "success");
      } catch (e) { showToast("บันทึกไม่สำเร็จ", "error"); }
  };

  const saveCustomerProfile = async () => {
    if (!formData.customerName) { showToast("กรุณาระบุชื่อลูกค้า", "error"); return; }
    try {
        await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'customers'), {
            customerName: formData.customerName,
            taxId: formData.customerTaxId || '',
            branch: formData.customerBranch || '00000',
            address: formData.customerAddress || '',
            createdAt: serverTimestamp()
        });
        showToast("บันทึกข้อมูลลูกค้าเรียบร้อย", "success");
    } catch (e) { showToast("บันทึกไม่สำเร็จ", "error"); }
  };

  const handleScanExpense = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsAIScanning(true);
    showToast("AI Billing Assistant กำลังอ่านบิล...", "success");

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      const prompt = `Extract transaction from image. Return JSON: { vendorName, vendorTaxId, vendorAddress, taxInvoiceNo, amount, items: [{desc, qty, amount}], date, category }.`;
      try {
        const result = await SmartTaxAI.generate(prompt, base64, true);
        if (result) {
          setFormData(prev => ({ ...prev, ...result, type: 'expense' }));
          showToast("สแกนบิลสำเร็จ", "success");
        } else {
          showToast("AI อ่านไม่สำเร็จ", "error");
        }
      } catch (err) {
        showToast("เกิดข้อผิดพลาด", "error");
      } finally {
        setIsAIScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateStockFIFO = async (items, transactionType, transDate, totalDiscount = 0) => {
      const totalLineItemsAmount = items.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      for (const item of items) {
          if (!item.desc) continue;
          const product = stockProducts.find(p => p.name === item.desc);
          if (!product) continue;
          const qtyChange = Number(item.qty) || 1;
          if (transactionType === 'income') {
              let remainingToDeduct = qtyChange;
              const productLots = inventoryLots.filter(l => l.productId === product.id && l.remainingQty > 0)
                .sort((a, b) => (a.lotDate ? normalizeDate(a.lotDate) : normalizeDate(a.createdAt)) - (b.lotDate ? normalizeDate(b.lotDate) : normalizeDate(b.createdAt)));
              for (const lot of productLots) {
                  if (remainingToDeduct <= 0) break;
                  const deductAmount = Math.min(remainingToDeduct, lot.remainingQty);
                  await updateDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_lots', lot.id), { remainingQty: lot.remainingQty - deductAmount });
                  remainingToDeduct -= deductAmount;
              }
              await updateDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'products', product.id), { stock: increment(-qtyChange) });
          } else {
              const itemAmount = parseFloat(item.amount) || 0;
              const discountRatio = totalLineItemsAmount > 0 ? itemAmount / totalLineItemsAmount : 0;
              const allocatedDiscount = discountRatio * totalDiscount;
              const netItemCost = Math.max(0, itemAmount - allocatedDiscount);
              await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_lots'), { 
                  productId: product.id, productName: product.name, initialQty: qtyChange, remainingQty: qtyChange, 
                  cost: netItemCost, costPerUnit: netItemCost / qtyChange, lotDate: transDate, createdAt: serverTimestamp() 
              });
              await updateDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'products', product.id), { stock: increment(qtyChange), cost: netItemCost / qtyChange });
          }
      }
  };

  const handleSubmit = async (e) => { 
      e.preventDefault(); 
      if (!user) return; 
      try { 
          const dateObj = new Date(formData.date);
          const dataToSave = { 
              ...formData, ...calculated, amount: calculated.baseAmount, date: dateObj, userId: user.uid,
              customerShipping: parseFloat(formData.customerShipping) || 0, platformFee: parseFloat(formData.platformFee) || 0,
              shippingCost: parseFloat(formData.shippingCost) || 0, shopDiscount: parseFloat(formData.shopDiscount) || 0,
              expenseDiscount: parseFloat(formData.expenseDiscount) || 0,
              voucherDiscount: parseFloat(formData.voucherDiscount) || 0,
          };
          const collectionName = formData.type === 'income' ? 'transactions_income' : 'transactions_expense';
          if (editingId) { await setDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', collectionName, editingId), { ...dataToSave, updatedAt: serverTimestamp() }, {merge: true}); } 
          else {
              await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', collectionName), { ...dataToSave, createdAt: serverTimestamp() });
              await updateStockFIFO(formData.items, formData.type, dateObj, (parseFloat(formData.expenseDiscount) || 0) + (parseFloat(formData.voucherDiscount) || 0));
          }
          showToast("บันทึกสำเร็จ", "success");
          setFormData(initialForm); setEditingId(null);
      } catch (error) { showToast("บันทึกไม่สำเร็จ", "error"); } 
  };

  const handleEdit = (item) => { 
      setFormData({ ...initialForm, ...item, date: formatDateISO(item.date), amount: item.amount || item.total, items: item.items || [{ desc: item.description, qty: 1, amount: item.amount }] }); 
      setEditingId(item.id); setSubTab('new'); 
  };
  const handleAddItem = () => { setFormData({ ...formData, items: [...formData.items, { desc: '', qty: 1, amount: '' }] }); };
  const handleRemoveItem = (index) => { if (formData.items.length > 1) { setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) }); } };
  const handleItemChange = (index, field, value) => {
      const newItems = [...formData.items]; newItems[index][field] = value;
      if (formData.type === 'income') {
          if (field === 'desc') { 
              const matchedProduct = stockProducts.find(p => p.name === value); 
              if (matchedProduct) { 
                  newItems[index].price = matchedProduct.price; newItems[index].amount = matchedProduct.price * newItems[index].qty; 
              } 
          } else if (field === 'qty') {
              newItems[index].amount = (newItems[index].price || 0) * value;
          }
      }
      setFormData({ ...formData, items: newItems });
  };
  const handleSelectProduct = (product) => {
    setFormData(prev => {
        let currentItems = prev.items;
        if (currentItems.length === 1 && !currentItems[0].desc && !currentItems[0].amount) { currentItems = []; }
        return { ...prev, items: [ ...currentItems, { desc: product.name, qty: 1, amount: product.price, price: product.price } ] };
    });
    showToast(`เพิ่ม ${product.name} แล้ว`, 'success');
  };
  const handleMagicFill = async () => { if (!magicPrompt) return; setIsMagicLoading(true); const prompt = `Extract transaction data from Thai text: "${magicPrompt}". Return JSON: { type: "income"|"expense", items: [{ desc: string, amount: number }], channel: string, date: "YYYY-MM-DD" }.`; try { const data = await SmartTaxAI.generate(prompt, null, true); if (data) setFormData(prev => ({ ...prev, ...data })); } catch (error) { showToast("AI Failed", "error"); } finally { setIsMagicLoading(false); } };

  return (
    <div className="flex flex-col h-full lg:h-[calc(100vh-88px)] relative text-left font-sarabun">
        {deleteId && <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 text-center"><div className="bg-white rounded-3xl p-8 max-sm w-full shadow-2xl animate-fadeIn"><Trash2 size={48} className="mx-auto text-rose-500 mb-4 bg-rose-50 p-3 rounded-full"/><h3 className="text-xl font-bold mb-6 text-slate-800">ยืนยันการลบ?</h3><div className="flex gap-3 mt-6"><button onClick={()=>setDeleteId(null)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold">ยกเลิก</button><button onClick={async ()=>{const item = transactions.find(t=>t.id===deleteId); await deleteDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', item.type==='income'?'transactions_income':'transactions_expense', deleteId)); setDeleteId(null); showToast("ลบสำเร็จ", "success");}} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold">ลบรายการ</button></div></div></div>}
        {previewInvoiceTransaction && (<InvoicePreviewModal transaction={previewInvoiceTransaction} onClose={()=>setPreviewInvoiceTransaction(null)} showToast={showToast}/>)}
        
        {/* Updated Vendor Selection Modal (Performance Style) */}
        {showVendorModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-[32px]">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Store className="text-indigo-600"/> Vendor Selection (Performance)</h3>
                  <p className="text-sm text-slate-500">เลือกคู่ค้าจากประวัติเพื่อความรวดเร็วในการบันทึก</p>
                </div>
                <button onClick={() => setShowVendorModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="p-6 pb-0">
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input 
                    className="w-full bg-slate-100 border-0 rounded-2xl pl-12 pr-4 py-3 text-base font-medium focus:ring-2 focus:ring-indigo-500 transition-all" 
                    placeholder="ค้นหาคู่ค้า (ชื่อ, เลขผู้เสียภาษี)..." 
                    value={vendorSearch} 
                    onChange={e => setVendorSearch(e.target.value)} 
                    autoFocus 
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendors.filter(v => v.vendorName?.toLowerCase().includes(vendorSearch.toLowerCase()) || v.vendorTaxId?.includes(vendorSearch)).map(v => (
                    <div 
                      key={v.id} 
                      onClick={() => {
                        setFormData(p => ({...p, vendorName: v.vendorName, vendorTaxId: v.vendorTaxId, vendorBranch: v.vendorBranch, vendorBranchName: v.vendorBranchName || '', vendorAddress: v.vendorAddress}));
                        setShowVendorModal(false);
                      }} 
                      className="bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer hover:border-indigo-500 hover:shadow-xl transition-all group relative flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Building size={20}/>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-bold uppercase tracking-tighter">
                          Branch: {v.vendorBranch || '00000'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{v.vendorName}</h4>
                        <div className="flex items-center gap-2 text-slate-400 mt-1">
                          <CreditCard size={14}/>
                          <span className="text-xs font-mono">{v.vendorTaxId || 'ไม่ระบุเลขผู้เสียภาษี'}</span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-50 mt-1 flex items-start gap-2 text-slate-500">
                        <MapPin size={14} className="mt-0.5 shrink-0"/>
                        <p className="text-xs leading-relaxed line-clamp-2">{v.vendorAddress || 'ไม่มีที่อยู่'}</p>
                      </div>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="text-indigo-400" />
                      </div>
                    </div>
                  ))}
                  {vendors.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-300">
                      <Inbox size={48} className="mx-auto mb-4 opacity-20"/>
                      <p className="font-bold">ไม่พบข้อมูลคู่ค้า</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 border-t bg-slate-50 flex justify-end items-center rounded-b-[32px]">
                <button onClick={() => setShowVendorModal(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all">ปิด</button>
              </div>
            </div>
          </div>
        )}

        {/* Updated Customer Selection Modal (Performance Style) */}
        {showCustomerModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-[32px]">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><User className="text-rose-600"/> Customer Selection (Performance)</h3>
                  <p className="text-sm text-slate-500">เลือกลูกค้าจากฐานข้อมูลเพื่อความรวดเร็ว</p>
                </div>
                <button onClick={() => setShowCustomerModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="p-6 pb-0">
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input 
                    className="w-full bg-slate-100 border-0 rounded-2xl pl-12 pr-4 py-3 text-base font-medium focus:ring-2 focus:ring-rose-500 transition-all" 
                    placeholder="ค้นหาลูกค้า (ชื่อ, เลขผู้เสียภาษี)..." 
                    value={customerSearch} 
                    onChange={e => setCustomerSearch(e.target.value)} 
                    autoFocus 
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customers.filter(c => c.customerName?.toLowerCase().includes(customerSearch.toLowerCase()) || c.taxId?.includes(customerSearch)).map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setFormData(p => ({...p, customerName: c.customerName, customerTaxId: c.taxId, customerBranch: c.branch, customerAddress: c.address}));
                        setShowCustomerModal(false);
                      }} 
                      className="bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer hover:border-rose-500 hover:shadow-xl transition-all group relative flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
                          <User size={20}/>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-bold uppercase tracking-tighter">
                          Branch: {c.branch || '00000'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-rose-600 transition-colors">{c.customerName}</h4>
                        <div className="flex items-center gap-2 text-slate-400 mt-1">
                          <CreditCard size={14}/>
                          <span className="text-xs font-mono">{c.taxId || 'ไม่ระบุเลขผู้เสียภาษี'}</span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-50 mt-1 flex items-start gap-2 text-slate-500">
                        <MapPin size={14} className="mt-0.5 shrink-0"/>
                        <p className="text-xs leading-relaxed line-clamp-2">{c.address || 'ไม่มีที่อยู่'}</p>
                      </div>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="text-rose-400" />
                      </div>
                    </div>
                  ))}
                  {customers.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-300">
                      <Inbox size={48} className="mx-auto mb-4 opacity-20"/>
                      <p className="font-bold">ไม่พบข้อมูลลูกค้า</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 border-t bg-slate-50 flex justify-end items-center rounded-b-[32px]">
                <button onClick={() => setShowCustomerModal(false)} className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all">ปิด</button>
              </div>
            </div>
          </div>
        )}

        {showProductSelector && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[32px] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-6 border-b flex justify-between items-center"><div><h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Store className="text-indigo-600"/> Product Catalog (POS)</h3><p className="text-sm text-slate-500">เลือกสินค้าเพื่อเพิ่มลงในรายการขาย</p></div><button onClick={() => setShowProductSelector(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button></div>
                    <div className="p-6 pb-0"><div className="relative"><Search className="absolute left-4 top-3.5 text-slate-400" size={20} /><input className="w-full bg-slate-100 border-0 rounded-2xl pl-12 pr-4 py-3 text-base font-medium focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="ค้นหาสินค้า (ชื่อ, SKU)..." value={productSearchTerm} onChange={e => setProductSearchTerm(e.target.value)} autoFocus /></div>
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar"><button onClick={() => setProductSearchTerm('')} className={"px-4 py-2 rounded-xl text-sm font-bold shadow-md whitespace-nowrap " + (productSearchTerm === '' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600')}>ทั้งหมด</button>
                    {[...new Set(stockProducts.map(p => p.category))].filter(Boolean).map(c => (<button key={c} onClick={() => setProductSearchTerm(c)} className={"px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all " + (productSearchTerm === c ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}>{c}</button>))}</div></div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">{Object.entries(groupedProducts).length > 0 ? Object.entries(groupedProducts).map(([category, items]) => (
                          <div key={category} className="mb-8 last:mb-0"><h5 className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 uppercase tracking-wide sticky top-0 bg-white z-10"><Tag size={14} className="text-indigo-500"/> {category} <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-md text-[10px] ml-1">{items.length}</span></h5><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                  {items.map(product => (<div key={product.id} onClick={() => handleSelectProduct(product)} className="bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all group relative flex flex-col h-full"><div className="aspect-square bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-slate-300 relative overflow-hidden">{product.image ? <img src={product.image} className="w-full h-full object-cover" alt="" /> : <Package size={32} />}{product.stock <= 0 && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">สินค้าหมด</span></div>}</div><h4 className="font-bold text-slate-700 text-sm line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">{product.name}</h4><p className="text-xs text-slate-400 mb-2">{product.sku}</p><div className="mt-auto flex justify-between items-end"><div><p className="text-[10px] text-slate-400">ราคา</p><p className="font-bold text-indigo-600 text-lg">{formatCurrency(product.price)}</p></div><div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${product.stock > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>คงเหลือ {product.stock}</div></div><div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><div className="bg-indigo-600 text-white p-1.5 rounded-full shadow-lg"><PlusCircle size={16} /></div></div></div>))}</div></div>
                        )) : (<div className="flex flex-col items-center justify-center h-full text-slate-300 py-10"><Inbox size={48} className="mb-4 opacity-20"/><p className="font-bold">ไม่พบสินค้าในหมวดหมู่นี้</p></div>)}</div>
                    <div className="p-4 border-t bg-slate-50 flex justify-between items-center rounded-b-[32px]"><div className="flex items-center gap-3"><div className="bg-indigo-100 p-2 rounded-full text-indigo-600"><ShoppingBag size={20}/></div><div><p className="text-xs font-bold text-slate-500">รายการในตะกร้า</p><p className="text-lg font-bold text-slate-800">{formData.items.length} รายการ</p></div></div><button onClick={() => setShowProductSelector(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all">เสร็จสิ้น</button></div>
                </div>
            </div>
        )}
        <div className="flex gap-1 p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl w-fit mb-6 self-center md:self-start border border-slate-200">
            <button onClick={()=>setSubTab('new')} className={"px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 " + (subTab==='new'?'bg-white text-indigo-600 shadow-sm':'text-slate-500')}><Store size={16}/> หน้าขาย (POS)</button>
            <button onClick={()=>setSubTab('history')} className={"px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 " + (subTab==='history'?'bg-white text-indigo-600 shadow-sm':'text-slate-500')}><BarChart2 size={16}/> Performance</button>
        </div>
        {subTab === 'new' ? (
          <div className="flex flex-col gap-6 animate-fadeIn text-left h-full">
            {/* --- SMART AI CONTROL PANEL (TOP) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><Zap size={24}/></div>
                            <div>
                                <h4 className="font-bold text-slate-800">AI Command Center</h4>
                                <p className="text-xs text-slate-400">สั่งการด้วยคำพูดหรือรูปภาพ</p>
                            </div>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl relative w-44">
                            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ${formData.type === 'income' ? 'left-1' : 'left-[calc(50%+2px)]'}`}></div>
                            <button onClick={()=>setFormData({...formData, type:'income', category: CONSTANTS.CATEGORIES.INCOME[0]})} className={`relative z-10 flex-1 py-1.5 text-[10px] font-bold ${formData.type==='income'?'text-emerald-600':'text-slate-500'}`}>รายรับ</button>
                            <button onClick={()=>setFormData({...formData, type:'expense', category: CONSTANTS.CATEGORIES.EXPENSE[0]})} className={`relative z-10 flex-1 py-1.5 text-[10px] font-bold ${formData.type==='expense'?'text-rose-600':'text-slate-500'}`}>รายจ่าย</button>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <div className="absolute left-3 top-3 text-indigo-400"><Sparkles size={16}/></div>
                            <input 
                                className="w-full bg-slate-50 border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all" 
                                placeholder="พิมพ์คำสั่ง AI เช่น 'จ่ายค่าไฟ 500 บาท'..." 
                                value={magicPrompt} 
                                onChange={e=>setMagicPrompt(e.target.value)}
                                onKeyDown={e=>e.key==='Enter'&&handleMagicFill()}
                            />
                            <button onClick={handleMagicFill} className="absolute right-2 top-2 bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all">
                                {isMagicLoading ? <Loader size={14} className="animate-spin"/> : 'Auto Fill'}
                            </button>
                        </div>
                        {formData.type === 'expense' && (
                            <button 
                                type="button"
                                onClick={() => billingScanRef.current?.click()}
                                disabled={isAIScanning}
                                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
                            >
                                {isAIScanning ? <Loader className="animate-spin" size={18}/> : <Camera size={18}/>}
                                <span className="whitespace-nowrap">{isAIScanning ? 'กำลังอ่าน...' : 'สแกนบิล'}</span>
                            </button>
                        )}
                        <input type="file" ref={billingScanRef} hidden accept="image/*" onChange={handleScanExpense} />
                    </div>
                </div>

                <div className="bg-indigo-600 p-6 rounded-[32px] text-white flex items-center justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">ยอดเงินสุทธิที่กำลังบันทึก</p>
                        <h3 className="text-4xl font-black">{formatCurrency(calculated.total)}</h3>
                        <p className="text-indigo-100 text-[10px] mt-2 flex items-center gap-1 opacity-80"><Info size={12}/> รวมส่วนลดและภาษีเรียบร้อยแล้ว</p>
                    </div>
                    <div className="relative z-10 text-right">
                        <button onClick={handleSubmit} className="bg-white text-indigo-600 h-16 w-16 rounded-3xl flex items-center justify-center shadow-2xl hover:scale-105 transition-transform active:scale-95 group">
                            <Save size={28} className="group-hover:rotate-12 transition-transform"/>
                        </button>
                        <p className="text-[9px] font-bold mt-2 uppercase tracking-tighter opacity-60">คลิกเพื่อบันทึก</p>
                    </div>
                    <div className="absolute -right-10 -bottom-10 opacity-10"><Zap size={200}/></div>
                </div>
            </div>

            {/* --- MAIN FORM AREA --- */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
                {/* Left Column: Transaction Details & Items */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Transaction Info Card */}
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                        <h5 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
                            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><FileText size={16}/></div>
                            ข้อมูลการทำรายการ
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">วันที่รายการ</label>
                                <div className="relative">
                                    <input type="date" className="w-full bg-slate-50 border-0 rounded-2xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all" value={formData.date} onChange={e=>setFormData({...formData,date:e.target.value})}/>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ร้านค้า / สาขา</label>
                                <div className="relative">
                                    <select className="w-full bg-slate-50 border-0 rounded-2xl p-3 text-sm font-bold appearance-none" value={formData.shop} onChange={e=>setFormData({...formData, shop: e.target.value})}>
                                        {CONSTANTS.SHOPS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16}/>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">หมวดหมู่บัญชี</label>
                                <div className="relative">
                                    <select className="w-full bg-slate-50 border-0 rounded-2xl p-3 text-sm font-bold appearance-none" value={formData.category} onChange={e=>setFormData({...formData,category:e.target.value})}>
                                        {(formData.type==='income'?CONSTANTS.CATEGORIES.INCOME:CONSTANTS.CATEGORIES.EXPENSE).map(c=><option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16}/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Line Items Card */}
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h5 className="font-bold text-slate-800 flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><List size={16}/></div>
                                รายการสินค้าและบริการ
                            </h5>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowProductSelector(true)} className="text-[10px] bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-all flex items-center gap-1.5">
                                    <ShoppingBag size={14}/> Catalog
                                </button>
                                <button type="button" onClick={handleAddItem} className="text-[10px] bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-1.5">
                                    <PlusCircle size={14}/> เพิ่มแถว
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {formData.items.map((item, idx) => {
                                const isLinked = stockProducts.some(p => p.name === item.desc);
                                return (
                                    <div key={idx} className={`flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border ${isLinked ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'} transition-all group relative`}>
                                        <div className="flex-[4]">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase">รายละเอียด</label>
                                                {isLinked && <span className="text-[8px] bg-indigo-600 text-white px-1.5 rounded-full font-bold">LINKED STOCK</span>}
                                            </div>
                                            <input required className="w-full bg-white border-0 rounded-xl px-3 py-2 text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-200" placeholder="ระบุรายการ..." value={item.desc} onChange={e => handleItemChange(idx, 'desc', e.target.value)} list={`products-list-${idx}`}/>
                                            <datalist id={`products-list-${idx}`}>{stockProducts.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</datalist>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-20">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1 text-center">จำนวน</label>
                                                <input required type="number" className="w-full bg-white border-0 rounded-xl px-3 py-2 text-sm text-center font-bold shadow-sm focus:ring-2 focus:ring-indigo-200" value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} />
                                            </div>
                                            <div className="w-32">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1 text-right">ยอดรวม</label>
                                                <input required type="number" className="w-full bg-white border-0 rounded-xl px-3 py-2 text-sm text-right font-bold text-indigo-600 shadow-sm focus:ring-2 focus:ring-indigo-200" placeholder="0.00" value={item.amount} onChange={e => handleItemChange(idx, 'amount', e.target.value)} />
                                            </div>
                                            {formData.items.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveItem(idx)} className="self-end mb-1 p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                                    <Trash2 size={18}/>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* E-commerce Platform Details Card (Income Only) */}
                    {isEcommerceMode && (
                        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-indigo-100 animate-in slide-in-from-top duration-300">
                            <h5 className="font-bold text-indigo-700 mb-6 flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Truck size={16}/></div>
                                Platform & Logistics Details (รายรับออนไลน์)
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ค่าส่งจากลูกค้า (+)</label>
                                    <input type="number" className="w-full bg-slate-50 border-0 rounded-2xl p-3 text-sm font-bold text-emerald-600" placeholder="0.00" value={formData.customerShipping} onChange={e=>setFormData({...formData, customerShipping: e.target.value})} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ส่วนลดร้านค้า (-)</label>
                                    <input type="number" className="w-full bg-slate-50 border-0 rounded-2xl p-3 text-sm font-bold text-rose-600" placeholder="0.00" value={formData.shopDiscount} onChange={e=>setFormData({...formData, shopDiscount: e.target.value})} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ค่าธรรมเนียม (-)</label>
                                    <input type="number" className="w-full bg-slate-50 border-0 rounded-2xl p-3 text-sm font-bold text-slate-600" placeholder="0.00" value={formData.platformFee} onChange={e=>setFormData({...formData, platformFee: e.target.value})} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ค่าส่งถูกหัก (-)</label>
                                    <input type="number" className="w-full bg-slate-50 border-0 rounded-2xl p-3 text-sm font-bold text-slate-600" placeholder="0.00" value={formData.shippingCost} onChange={e=>setFormData({...formData, shippingCost: e.target.value})} />
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end gap-2 text-xs">
                                <span className="font-bold text-slate-400">กำไรหลังหักค่าธรรมเนียม (Est. Payout):</span>
                                <span className="font-black text-indigo-600">{formatCurrency(calculated.estimatedPayout)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Customer/Vendor & Summary */}
                <div className="space-y-6">
                    {/* Entity Info Card (Customer/Vendor) */}
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <h5 className="font-bold text-slate-800 flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${formData.type==='income'?'bg-rose-50 text-rose-600':'bg-amber-50 text-amber-600'}`}>
                                    {formData.type === 'income' ? <User size={16}/> : <Store size={16}/>}
                                </div>
                                {formData.type === 'income' ? 'ข้อมูลลูกค้า' : 'ข้อมูลคู่ค้า'}
                            </h5>
                            <button type="button" onClick={formData.type === 'income' ? ()=>setShowCustomerModal(true) : ()=>setShowVendorModal(true)} className="text-[10px] font-bold text-indigo-600 hover:underline">
                                เลือกเก่า
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {formData.type === 'income' ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <input type="checkbox" id="taxReq" className="w-4 h-4 rounded text-indigo-600" checked={formData.isTaxInvoiceReq} onChange={e => setFormData({...formData, isTaxInvoiceReq: e.target.checked})} />
                                        <label htmlFor="taxReq" className="text-xs font-bold text-slate-600 cursor-pointer">ออกใบกำกับภาษีเต็มรูป</label>
                                    </div>
                                    {formData.isTaxInvoiceReq && (
                                        <div className="space-y-3 animate-in fade-in duration-300">
                                            <input className="w-full bg-slate-50 border-0 rounded-xl px-3 py-2.5 text-sm font-medium" placeholder="ชื่อลูกค้า / บริษัท" value={formData.customerName} onChange={e=>setFormData({...formData, customerName: e.target.value})} />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input className="w-full bg-slate-50 border-0 rounded-xl px-3 py-2.5 text-sm font-medium" placeholder="เลขผู้เสียภาษี" value={formData.customerTaxId} onChange={e=>setFormData({...formData, customerTaxId: e.target.value})} />
                                                <input className="w-full bg-slate-50 border-0 rounded-xl px-3 py-2.5 text-sm font-medium" placeholder="สาขา" value={formData.customerBranch} onChange={e=>setFormData({...formData, customerBranch: e.target.value})} />
                                            </div>
                                            <textarea className="w-full bg-slate-50 border-0 rounded-xl px-3 py-2.5 text-sm font-medium h-20" placeholder="ที่อยู่..." value={formData.customerAddress} onChange={e=>setFormData({...formData, customerAddress: e.target.value})} />
                                            <div className="pt-2">
                                              <button onClick={saveCustomerProfile} type="button" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200">
                                                <Save size={14}/> บันทึกข้อมูลลูกค้า
                                              </button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-1.5 pt-2 border-t border-slate-50">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Order ID / Ref.</label>
                                        <input className="w-full bg-slate-50 border-0 rounded-xl px-3 py-2.5 text-sm font-bold text-indigo-600" placeholder="เลขที่อ้างอิง..." value={formData.orderId} onChange={e=>setFormData({...formData, orderId: e.target.value})} />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <input className="w-full bg-slate-50 border-0 rounded-xl px-3 py-2.5 text-sm font-medium" placeholder="ชื่อร้านค้า / คู่ค้า" value={formData.vendorName} onChange={e=>setFormData({...formData, vendorName: e.target.value})} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input className="w-full bg-slate-50 border-0 rounded-xl px-3 py-2.5 text-sm font-medium" placeholder="เลขผู้เสียภาษี" value={formData.vendorTaxId} onChange={e=>setFormData({...formData, vendorTaxId: e.target.value})} />
                                        <input className="w-full bg-slate-50 border-0 rounded-xl px-3 py-2.5 text-sm font-medium" placeholder="สาขา" value={formData.vendorBranch} onChange={e=>setFormData({...formData, vendorBranch: e.target.value})} />
                                    </div>
                                    <textarea className="w-full bg-slate-50 border-0 rounded-xl px-3 py-2.5 text-sm font-medium h-20" placeholder="ที่อยู่คู่ค้า..." value={formData.vendorAddress} onChange={e=>setFormData({...formData, vendorAddress: e.target.value})} />
                                    <div className="pt-2 border-t border-slate-50">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">เลขที่ใบกำกับภาษี (Ref.)</label>
                                        <input className="w-full bg-slate-50 border-0 rounded-xl px-3 py-2.5 text-sm font-bold text-indigo-600 mt-1" placeholder="INV-XXXX" value={formData.taxInvoiceNo} onChange={e=>setFormData({...formData, taxInvoiceNo: e.target.value})}/>
                                    </div>
                                    <div className="pt-2">
                                      <button onClick={saveVendorProfile} type="button" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200">
                                        <Save size={14}/> บันทึกข้อมูลคู่ค้า
                                      </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Advanced Financials Card */}
                    <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-xl">
                        <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Settings size={14}/> Financial Adjustments
                        </h5>
                        
                        <div className="space-y-5">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-400">รูปแบบภาษี (VAT)</span>
                                <select className="bg-slate-800 border-0 rounded-lg px-2 py-1 text-xs font-bold outline-none cursor-pointer" value={formData.vatType} onChange={e=>setFormData({...formData,vatType:e.target.value})}>
                                    <option value="included">รวมในยอด (Included)</option>
                                    <option value="excluded">คิดแยก (Excluded)</option>
                                    <option value="none">ไม่มี (None)</option>
                                </select>
                            </div>

                            {formData.type === 'expense' && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-orange-500/20 text-orange-400 rounded-md"><Tag size={12}/></div>
                                            <span className="text-xs font-bold">ส่วนลดเงินสด</span>
                                        </div>
                                        <input type="number" className="bg-transparent border-b border-white/20 w-24 text-right font-bold text-orange-400 focus:border-orange-400 outline-none" placeholder="0.00" value={formData.expenseDiscount} onChange={e=>setFormData({...formData, expenseDiscount: e.target.value})} />
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-rose-500/20 text-rose-400 rounded-md"><Ticket size={12}/></div>
                                            <span className="text-xs font-bold">ส่วนลด Voucher</span>
                                        </div>
                                        <input type="number" className="bg-transparent border-b border-white/20 w-24 text-right font-bold text-rose-400 focus:border-rose-400 outline-none" placeholder="0.00" value={formData.voucherDiscount} onChange={e=>setFormData({...formData, voucherDiscount: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/10 space-y-2">
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>ฐานภาษี (Tax Base)</span>
                                    <span>{formatCurrency(calculated.net)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                                    <span>{formatCurrency(calculated.vat)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-black pt-2 text-white">
                                    <span>รวมสุทธิ</span>
                                    <span className="text-indigo-400">{formatCurrency(calculated.total)}</span>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSubmit} className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                            <Save size={20}/> บันทึกรายการทั้งหมด
                        </button>
                    </div>
                </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden animate-fadeIn text-left">
            <div className="p-6 border-b border-slate-100 space-y-4"><div className="flex flex-col md:flex-row justify-between items-center gap-4"><div><h3 className="font-bold text-slate-800 flex items-center gap-2 text-xl"><BarChart2 className="text-indigo-600"/> Performance & History</h3><p className="text-slate-500 text-sm">วิเคราะห์เจาะลึกรายการบันทึกย้อนหลัง</p></div><div className="flex flex-wrap gap-2"><div className="flex bg-slate-100 p-1 rounded-xl"><button onClick={()=>setSelectedYear(currentYear-1)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedYear === currentYear-1 ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>ปีย้อนหลัง ({currentYear-1})</button><button onClick={()=>setSelectedYear(currentYear)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedYear === currentYear ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>ปีปัจจุบัน ({currentYear})</button></div><select className="bg-slate-50 border-none rounded-xl text-sm font-bold py-2 px-4 text-slate-600" value={histFilterType} onChange={e=>setHistFilterType(e.target.value)}><option value="all">รวมทุกประเภท</option><option value="income">รายรับ (Income)</option><option value="expense">รายจ่าย (Expense)</option></select><button className="bg-emerald-50 text-emerald-600 p-2 rounded-xl hover:bg-emerald-100 flex items-center gap-2 px-4 text-sm font-bold shadow-sm transition-all"><FileText size={18}/> Export</button></div></div>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between"><div className="flex bg-indigo-50/50 p-1 rounded-xl w-full md:w-auto">{['day', 'week', 'month', 'year'].map(m => (<button key={m} onClick={() => setViewMode(m)} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${viewMode === m ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400 hover:bg-indigo-100'}`}>{m === 'day' ? 'รายวัน' : m === 'week' ? 'รายสัปดาห์' : m === 'month' ? 'รายเดือน' : 'ทั้งปี'}</button>))}</div><div className="relative w-full md:w-64"><Search className="absolute left-3 top-2.5 text-slate-400" size={16}/><input className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all" placeholder="ค้นหารายการ, ยอดเงิน..." value={historySearch} onChange={e=>setHistorySearch(e.target.value)}/></div></div></div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6"><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"><div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 relative overflow-hidden group"><div className="relative z-10"><p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">จำนวนรายการ (Volume)</p><h4 className="text-3xl font-bold text-indigo-700">{formatCompactNumber(historyStats.count)} <span className="text-sm font-medium text-indigo-400">รายการ</span></h4></div><div className="absolute -right-2 -bottom-2 text-indigo-200 opacity-20 group-hover:scale-110 transition-transform"><List size={80}/></div></div><div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 relative overflow-hidden group"><div className="relative z-10"><p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">มูลค่ารวม (Total Value)</p><h4 className="text-3xl font-bold text-emerald-700">{formatCurrency(historyStats.totalAmount)}</h4></div><div className="absolute -right-2 -bottom-2 text-emerald-200 opacity-20 group-hover:scale-110 transition-transform"><Wallet size={80}/></div></div><div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 relative overflow-hidden group"><div className="relative z-10"><p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">เฉลี่ยต่อบิล (Avg. Ticket)</p><h4 className="text-3xl font-bold text-amber-700">{formatCurrency(historyStats.avg)}</h4></div><div className="absolute -right-2 -bottom-2 text-emerald-200 opacity-20 group-hover:scale-110 transition-transform"><Tag size={80}/></div></div></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"><div className="lg:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm"><div className="flex justify-between items-center mb-6"><h4 className="font-bold text-slate-700 text-sm flex items-center gap-2"><Activity size={16}/> Activity Trend (Filtered)</h4></div><div className="flex items-end gap-3 h-40">{historyStats.trendData.length > 0 ? historyStats.trendData.map((d, i) => { const maxVal = Math.max(...historyStats.trendData.map(x => Math.max(x.income, x.expense))) || 1; return (<div key={i} className="flex-1 flex flex-col justify-end gap-1 h-full group relative"><div className="w-full bg-emerald-400 rounded-t opacity-90 group-hover:opacity-100 transition-all shadow-sm" style={{height: `${Math.max((d.income/maxVal)*100, 2)}%`}}></div><div className="w-full bg-rose-400 rounded-t opacity-90 group-hover:opacity-100 transition-all shadow-sm" style={{height: `${Math.max((d.expense/maxVal)*100, 2)}%`}}></div><div className="text-[9px] text-center text-slate-400 font-bold mt-1">{d.date.getDate()}</div><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 shadow-xl transition-opacity"><div className="font-bold border-b border-slate-600 pb-1 mb-1">{formatDate(d.date)}</div><div className="text-emerald-300">In: {formatCurrency(d.income)}</div><div className="text-rose-300">Ex: {formatCurrency(d.expense)}</div></div></div>) }) : <div className="w-full h-full flex items-center justify-center text-slate-400">ไม่มีข้อมูลในช่วงนี้</div>}</div></div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><h4 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2"><PieChart size={16}/> Top Categories</h4></div></div>
                <h4 className="font-bold text-slate-700 text-lg mb-4 flex items-center gap-2"><List size={20}/> Transaction Logs <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-2">Year: {selectedYear} / View: {viewMode.toUpperCase()}</span></h4>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200"><tr><th className="p-4 border-r border-slate-200 w-[50px] text-center">ลำดับ</th><th className="p-4 w-[120px]">Date</th><th className="p-4 w-[100px]">Type</th><th className="p-4">Description</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center w-[100px]">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{historyStats.filtered.sort((a,b) => b.date - a.date).map((t, idx) => (<tr key={t.id + "-hist-" + idx} className="hover:bg-slate-50 transition-colors"><td className="p-4 text-center border-r border-slate-50 text-slate-400 text-xs">{idx + 1}</td><td className="p-4 text-slate-500 text-xs font-mono">{formatDate(t.date)}</td><td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{t.type}</span></td><td className="p-4"><div className="font-bold text-slate-700">{t.description}</div><div className="flex gap-2 mt-1"><span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{t.category}</span>{t.orderId && <span className="text-[10px] text-indigo-400 font-mono">Ref: {t.orderId}</span>}</div></td><td className={`p-4 text-right font-bold ${t.type==='income'?'text-emerald-600':'text-rose-600'}`}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.total)}</td><td className="p-4 text-center"><div className="flex justify-center gap-2">{t.type === 'income' && (<button onClick={() => setPreviewInvoiceTransaction(t)} className="text-slate-300 hover:text-indigo-600" title="Reprint Invoice"><Printer size={14}/></button>)}<button onClick={()=>handleEdit(t)} className="text-slate-300 hover:text-orange-500"><Edit size={14}/></button><button onClick={(e)=>setDeleteId(t.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button></div></td></tr>))}{historyStats.filtered.length === 0 && (<tr><td colSpan="6" className="p-8 text-center text-slate-300">ไม่พบรายการในช่วงนี้</td></tr>)}</tbody></table></div>
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
  const initialInvData = { docType: 'ใบกำกับภาษี / ใบเสร็จรับเงิน', customerName: '', address: '', taxId: '', branch: '00000', orderId: '', custSubDistrict: '', custDistrict: '', custProvince: '', custZipCode: '', customerPhone: '', customerEmail: '', items: [{ desc: '', qty: 1, unit: 'ชิ้น', price: 0 }], date: formatDateISO(new Date()), invNo: '', sellerName: savedSeller.sellerName || '', sellerAddress: savedSeller.sellerAddress || '', sellerTaxId: savedSeller.sellerTaxId || '', sellerBranchId: savedSeller.sellerBranchId || '00000', sellerPhone: savedSeller.sellerPhone || '', sellerEmail: savedSeller.sellerEmail || '', sellerSubDistrict: savedSeller.sellerSubDistrict || '', sellerDistrict: savedSeller.sellerDistrict || '', sellerProvince: savedSeller.sellerProvince || '', sellerZipCode: savedSeller.sellerZipCode || '', discount: 0, notes: 'สินค้าซื้อแล้วไม่รับเปลี่ยนหรือคืนเงิน', vatType: 'excluded', logo: '', signature: '', status: 'unpaid' };
  const [invData, setInvData] = useState(initialInvData);
  const [editingDocId, setEditingDocId] = useState(null);
  const [docTypeStatus, setDocTypeStatus] = useState('original');
  const [showSellerEditModal, setShowSellerEditModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [sellerProfiles, setSellerProfiles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deleteId, setDeleteId] = useState(null); 
  const [invoiceSearch, setInvoiceSearch] = useState(''); 
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const [draftStatus, setDraftStatus] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    const savedDraft = localStorage.getItem('merchant_draft_inv');
    if (savedDraft && mode === 'create' && !editingDocId) {
        try { const draft = JSON.parse(savedDraft); if (draft.customerName || (draft.items && draft.items[0].desc)) { setInvData(prev => ({...prev, ...draft})); setDraftStatus('restored'); showToast("กู้คืนใบกำกับภาษีร่างล่าสุด", "success"); } } catch(e) {}
    }
  }, [mode]);
  useEffect(() => {
    if (mode === 'create' && !editingDocId) {
        const timeout = setTimeout(() => { if (invData.customerName || (invData.items.length > 0 && invData.items[0].desc)) { localStorage.setItem('merchant_draft_inv', JSON.stringify(invData)); setDraftStatus('saved'); } }, 1000);
        return () => localStorage.removeItem('merchant_draft_inv'); 
    }
  }, [invData, mode, editingDocId]);

  const totals = useMemo(() => {
    const { vatType, items, discount } = invData;
    const safeItems = items || [];
    let sub = safeItems.reduce((s, i) => s + (i.qty * i.price), 0);
    let afterDisc = sub - Number(discount);
    let vat = 0, total = 0, preVat = 0;
    if (vatType === 'included') { total = afterDisc; preVat = total * 100 / 107; vat = total - preVat; } 
    else if (vatType === 'excluded') { preVat = afterDisc; vat = preVat * 0.07; total = preVat + vat; } 
    else { preVat = afterDisc; vat = 0; total = preVat; }
    return { sub, afterDisc, vat, total, preVat };
  }, [invData.items, invData.discount, invData.vatType]);

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
          const unsubSellers = onSnapshot(query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'seller_profiles')), (snap) => setSellerProfiles(snap.docs.map(d=>({id:d.id, ...d.data()}))));
          const unsubCustomers = onSnapshot(query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'customers')), (snap) => setCustomers(snap.docs.map(d=>({id:d.id, ...d.data()}))));
          return () => { unsubSellers(); unsubCustomers(); };
      }
  }, [user, appId]);

  const handleSaveInvoice = async () => {
    if (!user) return;
    try {
      const payload = { ...invData, ...totals, date: new Date(invData.date), type: docType };
      if (editingDocId) await setDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'invoices', editingDocId), { ...payload, updatedAt: serverTimestamp() }, {merge: true}); 
      else await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'invoices'), { ...payload, createdAt: serverTimestamp(), status: 'unpaid' });
      localStorage.removeItem('merchant_draft_inv'); setDraftStatus(null); showToast("บันทึกสำเร็จ", "success"); setMode('history'); setEditingDocId(null);
    } catch(e) { showToast("บันทึกไม่สำเร็จ", "error"); }
  };
  const handleDownloadPDF = async () => downloadInvoicePDF('invoice-preview-area', invData.invNo, showToast);
  const handleLogoUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setInvData(prev => ({ ...prev, logo: reader.result })); }; reader.readAsDataURL(file); } };
  const handleSignatureUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setInvData(prev => ({ ...prev, signature: reader.result })); }; reader.readAsDataURL(file); } };
  const handleNewInvoice = () => { const currentSavedSeller = JSON.parse(localStorage.getItem('merchant_seller_info') || '{}'); setEditingDocId(null); setInvData({ ...initialInvData, ...currentSavedSeller }); setMode('create'); }
  const handleEditInvoice = (inv) => { setInvData({ ...inv, date: formatDateISO(inv.date) }); setEditingDocId(inv.id); setMode('create'); }
  const updateItem = (i, field, val) => { const newItems = [...invData.items]; newItems[i][field] = val; setInvData({...invData, items: newItems}); };
  const saveSellerProfile = async () => { if(!invData.sellerName) return; await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'seller_profiles'), { sellerName: invData.sellerName, sellerAddress: invData.sellerAddress, sellerTaxId: invData.sellerTaxId, sellerBranchId: invData.sellerBranchId, sellerPhone: invData.sellerPhone, sellerEmail: invData.sellerEmail, logo: invData.logo, signature: invData.signature, sellerSubDistrict: invData.sellerSubDistrict, sellerDistrict: invData.sellerDistrict, sellerProvince: invData.sellerProvince, sellerZipCode: invData.sellerZipCode }); showToast("บันทึกโปรไฟล์สำเร็จ", "success"); };
  const filteredInvoices = useMemo(() => { return invoices.filter(inv => { const searchLower = (inv.invNo || '').toLowerCase(); const customerLower = (inv.customerName || '').toLowerCase(); const orderLower = (inv.orderId || '').toLowerCase(); const searchInput = invoiceSearch.toLowerCase(); const matchSearch = searchLower.includes(searchInput) || customerLower.includes(searchInput) || orderLower.includes(searchInput); const matchStatus = filterStatus === 'all' || (inv.status || 'unpaid') === filterStatus; return matchSearch && matchStatus; }).sort((a, b) => sortOrder === 'newest' ? (new Date(b.date) - new Date(a.date)) : (new Date(a.date) - new Date(b.date))); }, [invoices, invoiceSearch, filterStatus, sortOrder]);

  return (
    <div className="w-full flex flex-col gap-8 relative h-full text-left font-sarabun">
      {showSellerEditModal && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-sarabun text-left"><div className="bg-white rounded-3xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl animate-fadeIn"><div className="p-6 border-b flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2 text-indigo-700 text-left"><Settings/> ตั้งค่าผู้ขาย & โปรไฟล์</h3><button onClick={()=>setShowSellerEditModal(false)}><X/></button></div><div className="flex-1 overflow-y-auto p-6 space-y-4 text-left"><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 text-left">โลโก้ร้านค้า</label><div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-center" onClick={() => logoInputRef.current?.click()}>{invData.logo ? <img src={invData.logo} className="h-24 object-contain" alt="Preview" /> : <ImageIcon size={48} className="text-slate-300"/>}<input type="file" ref={logoInputRef} hidden accept="image/*" onChange={handleLogoUpload} /></div></div><div><label className="text-xs font-bold text-slate-500 text-left">ลายเซ็น (Signature)</label><div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-center" onClick={() => signatureInputRef.current?.click()}>{invData.signature ? <img src={invData.signature} className="h-24 object-contain" alt="Signature Preview" /> : <Edit size={48} className="text-slate-300"/>}<input type="file" ref={signatureInputRef} hidden accept="image/*" onChange={handleSignatureUpload} /></div></div></div><div className="grid grid-cols-2 gap-4 text-left"><div><label className="text-xs font-bold text-left block mb-1">ชื่อร้านค้า</label><input className="w-full border rounded-lg p-2.5 mt-1 text-left" value={invData.sellerName} onChange={e=>setInvData({...invData, sellerName: e.target.value})} /></div><div><label className="text-xs font-bold text-left block mb-1">เลขผู้เสียภาษี</label><input className="w-full border rounded-lg p-2.5 mt-1 text-left" value={invData.sellerTaxId} onChange={e=>setInvData({...invData, sellerTaxId: e.target.value})} /></div><div className="col-span-2 text-left"><label className="text-xs font-bold text-left block mb-1">ที่อยู่ (บ้านเลขที่, ถนน)</label><input className="w-full border rounded-lg p-2.5 mt-1 text-left" value={invData.sellerAddress} onChange={e=>setInvData({...invData, sellerAddress: e.target.value})} /></div><div><label className="text-xs font-bold text-left block mb-1">แขวง/ตำบล</label><input className="w-full border rounded-lg p-2.5 mt-1 text-left" value={invData.sellerSubDistrict} onChange={e=>setInvData({...invData, sellerSubDistrict: e.target.value})} /></div><div><label className="text-xs font-bold text-left block mb-1">เขต/อำเภอ</label><input className="w-full border rounded-lg p-2.5 mt-1 text-left" value={invData.sellerDistrict} onChange={e=>setInvData({...invData, sellerDistrict: e.target.value})} /></div><div><label className="text-xs font-bold text-left block mb-1">จังหวัด</label><input className="w-full border rounded-lg p-2.5 mt-1 text-left" value={invData.sellerProvince} onChange={e=>setInvData({...invData, sellerProvince: e.target.value})} /></div><div><label className="text-xs font-bold text-left block mb-1">รหัสไปรษณีย์</label><input className="w-full border rounded-lg p-2.5 mt-1 text-left" value={invData.sellerZipCode} onChange={e=>setInvData({...invData, sellerZipCode: e.target.value})} /></div></div><div className="pt-4 border-t text-left"><h4 className="text-xs font-bold text-slate-400 mb-2 uppercase text-left">เลือกจากโปรไฟล์เก่า</h4><div className="space-y-2 text-left">{sellerProfiles.map(s => (<div key={s.id} onClick={()=>{setInvData(p=>({...p, ...s})); setShowSellerEditModal(false);}} className="p-3 bg-slate-50 border rounded-xl cursor-pointer hover:border-indigo-300 font-medium text-left">{s.sellerName}</div>))}</div></div></div><div className="p-4 border-t flex gap-3 text-center"><button onClick={saveSellerProfile} className="flex-1 bg-white border border-indigo-200 text-indigo-700 py-3 rounded-xl font-bold shadow-sm text-center">บันทึกโปรไฟล์ใหม่</button><button onClick={()=>setShowSellerEditModal(false)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-center">เสร็จสิ้น</button></div></div></div>)}
      {showCustomerModal && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-sarabun text-left"><div className="bg-white rounded-3xl w-full max-w-md h-[70vh] flex flex-col shadow-2xl animate-fadeIn text-left"><div className="p-6 border-b flex justify-between items-center text-left"><h3 className="font-bold text-lg flex items-center gap-2 text-rose-600 text-left"><User className="text-rose-500"/> เลือกข้อมูลลูกค้า</h3><button onClick={()=>setShowCustomerModal(false)}><X/></button></div><div className="flex-1 overflow-y-auto p-4 space-y-2 text-left">{customers.map(c => (<div key={c.id} onClick={()=>{setInvData(p=>({...p, customerName: c.customerName, address: c.address, taxId: c.taxId, branch: c.branch, custSubDistrict: c.custSubDistrict || '', custDistrict: c.custDistrict || '', custProvince: c.custProvince || '', custZipCode: c.custZipCode || ''})); setShowCustomerModal(false);}} className="p-4 rounded-xl border border-slate-100 hover:bg-rose-50 cursor-pointer shadow-sm text-left"><p className="font-bold text-left">{c.customerName}</p><p className="text-xs text-slate-400 truncate text-left">{c.address}</p></div>))}</div></div></div>)}
      {deleteId && (<div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 font-sarabun text-center"><div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-fadeIn"><div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} className="text-rose-500"/></div><h3 className="text-xl font-bold mb-6 text-slate-800">ลบเอกสารใบนี้?</h3><div className="flex gap-3 text-center"><button onClick={()=>setDeleteId(null)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-center">ยกเลิก</button><button onClick={async ()=>{await deleteDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'invoices', deleteId)); setDeleteId(null); showToast("ลบเรียบร้อย", "success");}} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold text-center">ยืนยันลบ</button></div></div></div>)}
      <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit print:hidden self-center"><button onClick={() => setMode('create')} className={"px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all " + (mode==='create'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700')}><FileText size={18}/> ออกเอกสาร</button><button onClick={() => setMode('history')} className={"px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all " + (mode==='history'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700')}><Clock size={18}/> ประวัติเอกสาร</button></div>
      {mode === 'history' ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-fadeIn h-full flex flex-col text-left"><div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4"><h3 className="font-bold text-slate-700 text-xl flex-shrink-0 text-left">Document History</h3><div className="flex wrap gap-2 w-full md:w-auto justify-end"><select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="all">สถานะ: ทั้งหมด</option><option value="paid">ชำระแล้ว (Paid)</option><option value="unpaid">รอดำเนินการ (Unpaid)</option></select><select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100" value={sortOrder} onChange={e=>setSortOrder(e.target.value)}><option value="newest">วันที่: ใหม่ล่าสุด</option><option value="oldest">วันที่: เก่าสุด</option></select><div className="relative w-full md:w-64"><Search className="absolute left-3 top-2.5 text-slate-400" size={16}/><input className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm" placeholder="ค้นหาเอกสาร..." value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} /></div></div></div><div className="rounded-2xl border border-slate-100 overflow-x-auto flex-1 custom-scrollbar text-left"><table className="w-full text-sm text-left whitespace-nowrap text-left"><thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs sticky top-0 z-10 text-left"><tr><th className="p-4 text-left">Date</th><th className="p-4 text-left">No.</th><th className="p-4 text-left">Customer</th><th className="p-4 text-right">Total</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Action</th></tr></thead><tbody className="divide-y divide-slate-50 text-left">{filteredInvoices.map((inv, idx) => (<tr key={inv.id + "-" + idx} className="hover:bg-indigo-50/30 even:bg-slate-50/50 text-left"><td className="p-4 text-slate-500 text-xs text-left">{formatDate(inv.date)}</td><td className="p-4 text-slate-700 font-bold text-left">{inv.invNo}</td><td className="p-4 text-left">{inv.customerName}</td><td className="p-4 text-right font-bold">{formatCurrency(inv.total)}</td><td className="p-4 text-center"><button onClick={async ()=>{await updateDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'invoices', inv.id), { status: inv.status === 'paid' ? 'unpaid' : 'paid' });}} className={"px-3 py-1 rounded-full text-[10px] font-bold border transition-all " + (inv.status === 'paid' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-orange-100 text-orange-600 border-orange-200')}>{inv.status === 'paid' ? 'Paid' : 'Unpaid'}</button></td><td className="p-4 text-center"><div className="flex justify-center gap-2 text-center"><button onClick={() => handleEditInvoice(inv)} className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-100 transition-all flex items-center gap-1 text-center"><Edit size={12}/> Edit/Print</button><button onClick={()=>setDeleteId(inv.id)} className="p-1.5 text-slate-300 hover:text-rose-500 text-center"><Trash2 size={14}/></button></div></td></tr>))}</tbody></table></div></div>
      ) : (
        <><div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 print:hidden space-y-6 text-left"><div className="flex justify-between border-b border-slate-100 pb-4 text-left"><div><h3 className="font-bold text-slate-800 text-xl flex items-center gap-2 text-left">Document Editor</h3><p className="text-slate-400 text-sm text-left">สร้างเอกสารใบกำกับภาษี หรือ ใบเสนอราคา</p></div><div className="text-right flex flex-col items-end gap-2 text-right"><button onClick={handleNewInvoice} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 text-right"><PlusCircle size={14}/> New Document</button><div><p className="text-xs text-slate-400 font-bold uppercase text-right">DOC ID</p><div className="flex items-center gap-2 justify-end"><p className="text-2xl font-bold text-indigo-600 font-mono text-right">{invData.invNo}</p>{draftStatus === 'saved' && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 rounded-full font-bold">Draft Saved</span>}</div></div></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left"><div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between text-left"><div className="text-left"><div className="flex justify-between items-start mb-4 text-left"><h4 className="font-bold text-indigo-700 flex items-center gap-2 text-left"><Store size={18}/> ข้อมูลผู้ขาย</h4><button onClick={()=>setShowSellerEditModal(true)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-left">แก้ไข/ตั้งค่า</button></div><div className="flex gap-4 items-start text-left">{invData.logo && <div className="w-16 h-16 rounded-lg bg-white p-1 border border-slate-200 flex-shrink-0 text-left"><img src={invData.logo} className="w-full h-full object-contain" alt="Logo"/></div>}<div className="text-sm text-slate-600 text-left"><p className="font-bold text-slate-800 text-base text-left">{invData.sellerName || 'กรุณาระบุชื่อร้านค้า'}</p><p className="text-xs mt-1 text-left">{[invData.sellerAddress, invData.sellerSubDistrict, invData.sellerDistrict, invData.sellerProvince, invData.sellerZipCode].filter(Boolean).join(' ')}</p></div></div></div><div className="mt-4 pt-4 border-t flex gap-2 text-center"><button onClick={()=>setInvData({...invData, vatType: 'excluded'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border ${invData.vatType==='excluded' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white'}`}>แยก VAT (Excluded)</button><button onClick={()=>setInvData({...invData, vatType: 'included'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border ${invData.vatType==='included' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white'}`}>รวม VAT (Included)</button><button onClick={()=>setInvData({...invData, vatType: 'none'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border ${invData.vatType==='none' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white'}`}>ไม่มี VAT</button></div></div><div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-left"><div className="grid grid-cols-2 gap-3 text-left"><div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm text-left"><label className="text-[10px] font-bold text-indigo-600 mb-1 flex items-center gap-1 text-left">วันที่เอกสาร</label><input type="date" className="w-full border-0 p-1 text-sm font-bold text-slate-700 bg-transparent focus:ring-0 text-left" value={invData.date} onChange={e => setInvData({ ...invData, date: e.target.value })} /></div><div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-left"><label className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1 text-left">Order ID</label><input className="w-full border-0 p-1 text-sm font-mono text-indigo-600 bg-transparent focus:ring-0 text-left" placeholder="เลขคำสั่งซื้อ" value={invData.orderId} onChange={e => setInvData({ ...invData, orderId: e.target.value })} /></div></div><div className="flex justify-between items-center text-left"><h4 className="font-bold text-sm text-rose-600 text-left">ข้อมูลลูกค้า</h4><button onClick={()=>setShowCustomerModal(true)} className="text-[10px] bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-bold text-left">เลือกเก่า</button></div><div className="text-left"><label className="text-[10px] text-slate-500 font-bold mb-1 block text-left">ชื่อลูกค้า / บริษัท</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm text-left" value={invData.customerName} onChange={e=>setInvData({...invData, customerName: e.target.value})} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left"><div className="text-left"><label className="text-[10px] text-slate-500 font-bold mb-1 block text-left">บ้านเลขที่/ถนน</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm text-left" value={invData.address} onChange={e=>setInvData({...invData, address: e.target.value})} /></div><div className="text-left"><label className="text-[10px] text-slate-500 font-bold mb-1 block text-left">ตำบล</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm text-left" value={invData.custSubDistrict} onChange={e=>setInvData({...invData, custSubDistrict: e.target.value})} /></div><div className="text-left"><label className="text-[10px] text-slate-500 font-bold mb-1 block text-left">อำเภอ</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm text-left" value={invData.custDistrict} onChange={e=>setInvData({...invData, custDistrict: e.target.value})} /></div><div className="text-left"><label className="text-[10px] text-slate-500 font-bold mb-1 block text-left">จังหวัด</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm text-left" value={invData.custProvince} onChange={e=>setInvData({...invData, custProvince: e.target.value})} /></div></div></div></div><div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left"><h4 className="font-bold text-sm text-slate-600 mb-2 text-left">รายการสินค้า</h4>{(invData.items || []).map((it, i) => (<div key={i} className="flex gap-2 mb-2 items-center text-left"><span className="text-xs text-slate-400 w-4 text-left">{i+1}.</span><input className="flex-[3] border-0 rounded p-2 text-sm shadow-sm text-left" value={it.desc} onChange={e=>updateItem(i,'desc',e.target.value)}/><input className="w-20 border-0 rounded p-2 text-sm text-center shadow-sm text-center" type="number" value={it.qty} onChange={e=>updateItem(i,'qty',Number(e.target.value))}/><input className="w-24 border-0 rounded p-2 text-sm text-right shadow-sm text-right" type="number" value={it.price} onChange={e=>updateItem(i,'price',Number(e.target.value))}/><button onClick={()=>setInvData({...invData, items: invData.items.filter((_,idx)=>idx!==i)})} className="text-rose-400 p-2 text-center"><Trash2 size={16}/></button></div>))}<button onClick={()=>setInvData({...invData, items:[...(invData.items||[]), {desc:'', qty:1, unit:'ชิ้น', price:0}]})} className="mt-2 text-[10px] bg-indigo-600 text-white px-4 py-1.5 rounded-lg flex items-center gap-1 w-fit font-bold shadow-md text-center"><PlusCircle size={14}/> เพิ่มรายการ</button></div><div className="flex gap-4 text-center"><button onClick={handleSaveInvoice} className={"flex-1 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all " + (editingDocId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700') + " flex items-center justify-center gap-2 text-center"}><Save size={18}/> {editingDocId ? 'Update Document' : 'Save Document'}</button><button onClick={handleDownloadPDF} className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all text-center"><Download size={18}/> Download ZIP</button></div></div><div className="overflow-x-auto pb-10 flex justify-center print:p-0 print:absolute print:left-0 print:top-0 print:w-full print:h-full print:z-50 print:bg-white text-left"><div id="invoice-preview-area" className="shadow-2xl print:shadow-none bg-white p-[30px] w-[210mm] min-h-[296mm] text-sm font-sarabun text-slate-900 leading-relaxed relative box-border text-left">
          <div className="flex justify-between items-start mb-8 text-left"><div className="w-[65%] flex items-center gap-5 text-left">{invData.logo && (<img src={invData.logo} className="w-[90px] h-[90px] object-contain flex-shrink-0 text-left" alt="Logo"/>)}<div className="flex flex-col justify-center text-left"><h2 className="text-xl font-bold text-slate-900 mb-1 leading-tight text-left">{invData.sellerName}</h2><p className="text-slate-600 text-xs leading-snug mb-1 text-left">{[invData.sellerAddress, invData.sellerSubDistrict, invData.sellerDistrict, invData.sellerProvince, invData.sellerZipCode].filter(Boolean).join(' ')}</p><div className="text-xs text-slate-700 leading-snug text-left"><p className="text-left"><b>เลขผู้เสียภาษี:</b> {invData.sellerTaxId} <b>สาขา:</b> {invData.sellerBranchId}</p><p className="text-left"><b>โทร:</b> {invData.sellerPhone} {invData.sellerEmail && <><b>Email:</b> {invData.sellerEmail}</>}</p></div></div></div><div className="text-right w-[35%] flex flex-col items-end text-right"><div className="text-lg font-bold uppercase mb-1 text-right">ใบกำกับภาษี / ใบเสร็จรับเงิน</div><div className="border border-slate-300 p-2 w-full max-w-[200px] text-right"><div className="flex justify-between mb-1 text-right"><span className="font-bold text-slate-500 text-xs">เลขที่ (No.)</span><span className="font-bold">{invData.invNo}</span></div><div className="flex justify-between text-right"><span className="font-bold text-slate-500 text-xs">วันที่ (Date)</span><span>{formatDate(invData.date)}</span></div><div className="flex justify-between text-right"><span className="font-bold text-slate-500 text-xs">อ้างอิง (Ref.)</span><span>{invData.orderId || "-"}</span></div></div><div className="mt-2 text-right"><span className={"px-3 py-1 border rounded text-xs font-bold uppercase " + (docTypeStatus === 'original' ? 'border-black text-black' : 'border-slate-300 text-slate-400') + " text-right"}>{docTypeStatus === 'original' ? 'ต้นฉบับ (Original)' : 'สำเนา (Copy)'}</span></div></div></div>
          <div className="border border-slate-300 p-4 mb-4 flex gap-4 text-left"><div className="flex-1 text-left"><div className="text-xs font-bold text-slate-400 uppercase mb-1 text-left">ลูกค้า (Customer)</div><p className="font-bold text-base mb-1 text-left">{invData.customerName}</p><p className="text-slate-600 text-sm leading-loose mb-2 whitespace-pre-wrap text-left">{[invData.address, invData.custSubDistrict, invData.custDistrict, invData.custProvince, invData.custZipCode].filter(Boolean).join(' ')}</p></div><div className="w-[40%] border-l border-slate-200 pl-6 flex flex-col justify-center text-sm text-left"><div className="grid grid-cols-[max-content_10px_1fr] gap-y-1.5 text-left"><span className="font-bold text-slate-500 text-left">เลขผู้เสียภาษี</span><span className="text-center">:</span><span className="text-left">{invData.taxId}</span><span className="font-bold text-slate-500 text-left">สาขาที่</span><span className="text-center">:</span><span className="text-left">{invData.branch}</span></div></div></div>
          <table className="w-full mb-6 border-collapse text-left"><thead><tr className="bg-slate-100 text-slate-800 font-bold text-xs uppercase text-center"><th className="py-2 border-y border-slate-300 w-12 text-center">ลำดับ<br/>No.</th><th className="py-2 border-y border-slate-300 text-left pl-4 text-left">รายการสินค้า / บริการ<br/>Description</th><th className="py-2 border-y border-slate-300 w-20 text-center">จำนวน<br/>Qty</th><th className="py-2 border-y border-slate-300 w-24 text-right">หน่วยละ<br/>Unit Price</th><th className="py-2 border-y border-slate-300 w-28 text-right">จำนวนเงิน<br/>Amount</th></tr></thead><tbody className="text-left">{invData.items.map((it, i) => (<tr key={"item-" + i} className="text-left"><td className="py-2 border-b border-slate-200 text-center align-top">{i+1}</td><td className="py-2 border-b border-slate-200 pl-4 align-top text-left">{it.desc}</td><td className="py-2 border-b border-slate-200 text-center align-top">{it.qty}</td><td className="py-2 border-b border-slate-200 text-right pr-2 align-top">{formatCurrency(it.price)}</td><td className="py-2 border-b border-slate-200 text-right pr-2 font-bold align-top">{formatCurrency(it.qty * it.price)}</td></tr>))}</tbody></table>
          <div className="flex justify-between items-start">
              <div className="flex-1 mt-4 mr-4"><div className="bg-white p-2.5 rounded-sm border border-slate-400 text-center font-bold text-slate-900 text-[13px] leading-tight shadow-sm">({THBText(totals.total)})</div></div>
              <div className="w-[40%] text-right"><div className="grid grid-cols-[auto_auto] gap-y-2 text-right text-sm text-right"><span className="font-bold text-slate-600 text-right">รวมเป็นเงิน</span><span className="font-medium">{formatCurrency(totals.sub)}</span>{invData.discount > 0 && <><span className="font-bold text-rose-600 text-right">หักส่วนลด</span><span className="text-rose-600">-{formatCurrency(invData.discount)}</span></>}<span className="font-bold text-slate-600 text-right">มูลค่าสินค้า (Pre-VAT)</span><span className="font-medium">{formatCurrency(totals.preVat)}</span><span className="font-bold text-slate-600 text-right">ภาษีมูลค่าเพิ่ม 7%</span><span className="font-medium">{formatCurrency(totals.vat)}</span><div className="col-span-2 border-t border-black my-1 text-right"></div><span className="font-bold text-slate-900 text-lg text-right">จำนวนเงินทั้งสิ้น</span><span className="font-bold text-slate-900 text-lg">{formatCurrency(totals.total)}</span><div className="col-span-2 border-t-2 border-black my-0.5 text-right"></div></div></div>
          </div>
          <div className="flex justify-between mt-12 px-8 absolute bottom-10 w-[calc(100%-60px)] text-center"><div className="text-center w-[40%] text-slate-700"><div className="border-b border-dotted border-slate-400 h-8 mb-2 text-center"></div><p className="text-xs font-bold text-center">ผู้รับวางบิล / ผู้รับของ</p><p className="text-xs font-bold text-slate-400 uppercase text-center">(Receiver Signature)</p></div><div className="text-center w-[40%] text-slate-700"><div className="h-12 flex items-center justify-center relative">{invData.signature && <img src={invData.signature} className="h-16 object-contain absolute bottom-4" alt="Signature"/>}<div className="border-b border-dotted border-slate-400 w-full mb-2"></div></div><p className="text-xs font-bold">ผู้รับเงิน / ผู้ออกใบกำกับภาษี</p><p className="text-xs text-slate-400 uppercase">(Authorized Signature)</p></div></div>
        </div></div></>)}
    </div>
  );
};

const StockManager = ({ appId, showToast }) => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [inventoryLots, setInventoryLots] = useState([]); 
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [activeView, setActiveView] = useState('inventory'); 
  const productImgRef = useRef(null);
  const initialProduct = { name: '', sku: '', category: CONSTANTS.CATEGORIES.STOCK[0], cost: '', price: '', stock: 0, image: '', expiryDate: '' };
  const initialAdj = { productId: '', qty: 1, reason: 'damaged', note: '' };
  const [formData, setFormData] = useState(initialProduct);
  const [adjData, setAdjData] = useState(initialAdj);

  useEffect(() => {
    const unsubProducts = onSnapshot(query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'products')), (snap) => { setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const unsubLots = onSnapshot(query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_lots')), (snap) => { setInventoryLots(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => { unsubProducts(); unsubLots(); };
  }, [appId]);

  const handleImgUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setFormData(prev => ({ ...prev, image: reader.result })); }; reader.readAsDataURL(file); } };
  const handleSave = async () => {
    try {
      const autoSKU = formData.sku || `SKU-P-${Date.now().toString().slice(-8)}`;
      const data = { ...formData, sku: autoSKU, cost: Number(formData.cost), price: Number(formData.price), stock: Number(formData.stock) };
      if (editingProduct) { await updateDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'products', editingProduct.id), { name: data.name, sku: data.sku, category: data.category, price: data.price, cost: data.cost, image: data.image, updatedAt: serverTimestamp() }); showToast("อัปเดตข้อมูลสำเร็จ", "success"); } 
      else { 
        const docRef = await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'products'), { ...data, createdAt: serverTimestamp() }); 
        if (data.stock > 0) { await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_lots'), { productId: docRef.id, productName: data.name, initialQty: Number(data.stock), remainingQty: Number(data.stock), cost: data.cost * data.stock, costPerUnit: Number(data.cost), expiryDate: formData.expiryDate || '', lotDate: new Date(), createdAt: serverTimestamp(), note: 'Initial Stock' }); } 
        showToast("เพิ่มสินค้าสำเร็จ", "success"); 
      }
      setShowModal(false); setFormData(initialProduct); setEditingProduct(null);
    } catch (e) { showToast("บันทึกไม่สำเร็จ", "error"); }
  };
  const handleAdjustmentSave = async () => {
    if (!adjData.productId || adjData.qty <= 0) return;
    try {
      const product = products.find(p => p.id === adjData.productId);
      if (product.stock < adjData.qty) { showToast("สต็อกไม่พอ", "error"); return; }
      let remainingToDeduct = Number(adjData.qty);
      const productLots = inventoryLots.filter(l => l.productId === adjData.productId && l.remainingQty > 0).sort((a, b) => (a.lotDate ? normalizeDate(a.lotDate) : normalizeDate(a.createdAt)) - (b.lotDate ? normalizeDate(b.lotDate) : normalizeDate(b.createdAt)));
      for (const lot of productLots) { if (remainingToDeduct <= 0) break; const deductAmount = Math.min(remainingToDeduct, lot.remainingQty); await updateDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_lots', lot.id), { remainingQty: lot.remainingQty - deductAmount }); remainingToDeduct -= deductAmount; }
      await updateDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'products', adjData.productId), { stock: increment(-adjData.qty) });
      await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'transactions_expense'), { type: 'expense', category: 'สินค้าเสียหาย/หมดอายุ', description: `ตัดสต็อกเสีย: ${product.name} (${adjData.reason})`, total: 0, date: new Date(), note: adjData.note, createdAt: serverTimestamp() });
      showToast("ตัดสต็อกเรียบร้อย", "success"); setShowAdjModal(false);
    } catch (e) { showToast("ล้มเหลว", "error"); }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase()));
  const totalVal = inventoryLots.reduce((sum, lot) => sum + ((Number(lot.remainingQty) || 0) * (Number(lot.costPerUnit) || 0)), 0);
  const getProductTaxInfo = (productId) => {
    const productLots = inventoryLots.filter(l => l.productId === productId);
    const totalIn = productLots.reduce((sum, l) => sum + l.initialQty, 0);
    const totalQty = productLots.reduce((sum, l) => sum + l.remainingQty, 0);
    const totalOut = totalIn - totalQty;
    const totalCostValue = productLots.reduce((sum, l) => sum + (l.remainingQty * l.costPerUnit), 0);
    const avgCostPerUnit = totalQty > 0 ? totalCostValue / totalQty : 0;
    return { totalIn, totalOut, totalQty, totalCostValue, avgCostPerUnit };
  };
  const exportInventoryExcel = () => {
    const header = [['ลำดับ', 'รหัสสินค้า (SKU)', 'ชื่อสินค้า', 'หมวดหมู่', 'สินค้าเข้า (In)', 'สินค้าออก (Out)', 'คงเหลือ (Balance)', 'ต้นทุนเฉลี่ย/หน่วย', 'มูลค่าทุนรวม']];
    const data = filteredProducts.map((p, i) => { const info = getProductTaxInfo(p.id); return [i + 1, p.sku, p.name, p.category, info.totalIn, info.totalOut, info.totalQty, info.avgCostPerUnit.toFixed(2), info.totalCostValue.toFixed(2)]; });
    const infoRows = [ ['รายงานสรุปสินค้าคงคลังเพื่อการยื่นภาษี (Movement Report)'], [`ข้อมูล ณ วันที่: ${formatDate(new Date())}`], [`มูลค่ารวมทั้งสิ้น: ${formatCurrency(totalVal)}`], [] ];
    exportToExcel(`Inventory_Tax_Report_${formatDateISO(new Date())}.xlsx`, data, infoRows.concat(header));
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 h-full flex flex-col animate-fadeIn text-left font-sarabun">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"><div><h3 className="font-bold text-slate-800 text-2xl flex items-center gap-2"><Package className="text-indigo-600" size={28}/> FIFO Inventory Pro</h3><p className="text-slate-500 text-sm">เจาะลึกล็อตต้นทุนรายสินค้า (First-In, First-Out Tracking)</p></div><div className="flex gap-2"><button onClick={() => setShowAdjModal(true)} className="bg-rose-50 text-rose-600 px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 border border-rose-100 hover:bg-rose-100 transition-all active:scale-95"><AlertTriangle size={18}/> ตัดสต็อกเสีย</button><button onClick={() => { setEditingProduct(null); setFormData(initialProduct); setShowModal(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"><PlusCircle size={20}/> เพิ่มสินค้า</button></div></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"><div className="bg-indigo-50/40 p-6 rounded-3xl border border-indigo-100 flex items-center gap-5"><div className="p-4 bg-indigo-100 rounded-2xl text-indigo-600 shadow-inner"><Database size={24}/></div><div><p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">มูลค่าทุน FIFO รวม</p><p className="text-2xl font-bold text-indigo-700">{formatCurrency(totalVal)}</p></div></div><div className="bg-emerald-50/40 p-6 rounded-3xl border border-emerald-100 flex items-center gap-5"><div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600 shadow-inner"><ShoppingBag size={24}/></div><div><p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">สินค้าในคลัง</p><p className="text-2xl font-bold text-emerald-700">{products.length} <span className="text-sm font-normal">รายการ</span></p></div></div><div className="bg-rose-50/40 p-6 rounded-3xl border border-rose-100 flex items-center gap-5"><div className="p-4 bg-rose-100 rounded-2xl text-rose-600 shadow-inner"><AlertTriangle size={24}/></div><div><p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">ใกล้หมดอายุ (30 วัน)</p><p className="text-2xl font-bold text-rose-700">{inventoryLots.filter(l => l.remainingQty > 0 && l.expiryDate && new Date(l.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}</p></div></div></div>
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center"><div className="flex bg-slate-100 p-1 rounded-2xl no-print"><button onClick={() => setActiveView('inventory')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'inventory' ? 'bg-white shadow text-indigo-600' : 'text-slate-50'}`}><Package size={14}/> การจัดการล็อต (FIFO)</button><button onClick={() => setActiveView('tax_report')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'tax_report' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}><ClipboardList size={14}/> รายงานเพื่อยื่นภาษี</button></div><div className="relative flex-1 w-full no-print"><Search className="absolute left-4 top-3 text-slate-400" size={18}/><input className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl pl-11 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all" placeholder="ค้นหาตามชื่อ, SKU หรือหมวดหมู่..." value={search} onChange={e => setSearch(e.target.value)} /></div>{activeView === 'tax_report' && (<div className="flex gap-2 no-print"><button onClick={exportInventoryExcel} className="bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 border border-emerald-100 hover:bg-emerald-100"><Download size={14}/> Excel</button><button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-slate-900 shadow-md"><Printer size={14}/> Print</button></div>)}</div>
      <div className="flex-1 overflow-auto rounded-3xl border border-slate-100 custom-scrollbar shadow-sm bg-white" id="inventory-tax-report-area">{activeView === 'inventory' ? (
          <table className="w-full text-sm text-left border-collapse"><thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] sticky top-0 z-20 border-b border-slate-100"><tr><th className="p-5 w-16"></th><th className="p-5">สินค้า</th><th className="p-5">หมวดหมู่</th><th className="p-5 text-right">ราคาขาย</th><th className="p-5 text-center">คงเหลือรวม</th><th className="p-5 text-center no-print">จัดการ</th></tr></thead><tbody className="divide-y divide-slate-50">{filteredProducts.map((p) => {
                const isExpanded = expandedProductId === p.id;
                const productLots = inventoryLots.filter(l => l.productId === p.id && l.remainingQty > 0).sort((a,b) => (a.lotDate ? normalizeDate(a.lotDate) : normalizeDate(a.createdAt)) - (b.lotDate ? normalizeDate(b.lotDate) : normalizeDate(b.createdAt)));
                return (<React.Fragment key={p.id}><tr onClick={() => setExpandedProductId(isExpanded ? null : p.id)} className={`cursor-pointer transition-all ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}><td className="p-5 text-center">{isExpanded ? <ChevronUp className="text-indigo-600" size={20}/> : <ChevronDown className="text-slate-300" size={20}/>}</td><td className="p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-100">{p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={16}/>}</div><div><div className="font-bold text-slate-700">{p.name}</div><div className="text-[10px] text-slate-400 font-mono">{p.sku}</div></div></div></td><td className="p-5"><span className="bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-tighter">{p.category}</span></td><td className="p-5 text-right font-bold text-indigo-600">{formatCurrency(p.price)}</td><td className="p-5 text-center"><span className={`px-3 py-1 rounded-full font-bold text-[10px] ${p.stock < 10 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>{p.stock}</span></td><td className="p-5 text-center no-print"><div className="flex justify-center gap-1" onClick={e => e.stopPropagation()}><button onClick={() => { setEditingProduct(p); setFormData(p); setShowModal(true); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Edit size={18}/></button><button onClick={async () => { if(confirm("ลบข้อมูลสินค้านี้ทั้งหมด?")) await deleteDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'products', p.id)); }} className="p-2 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={18}/></button></div></td></tr>{isExpanded && (<tr className="bg-slate-50/50"><td colSpan="6" className="p-0 border-b border-indigo-100"><div className="p-6 pl-20 animate-fadeIn space-y-4"><div className="flex items-center gap-2 text-xs font-bold text-indigo-500"><Info size={14}/> รายละเอียดล็อตสินค้า (FIFO Queue)</div><div className="grid grid-cols-1 gap-2">{productLots.map((lot, idx) => { const isExpiring = lot.expiryDate && new Date(lot.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); return (<div key={lot.id} className="flex flex-wrap items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">{idx === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" title="ล็อตที่กำลังถูกระบายออกเป็นอันดับแรก"></div>}<div className="flex gap-8 items-center"><div className="text-[10px] font-bold text-slate-400"><p className="uppercase">ลำดับล็อต</p><p className="text-sm text-slate-700 font-mono">#{idx + 1} {idx === 0 && <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1 rounded ml-1">TOP</span>}</p></div><div className="text-[10px] font-bold text-slate-400"><p className="uppercase">วันที่บันทึกรายการ</p><p className="text-xs text-slate-600">{formatDate(lot.lotDate || lot.createdAt)}</p></div><div className="text-[10px] font-bold text-slate-400"><p className="uppercase">ทุน/ชิ้น</p><p className="text-xs text-slate-600">{formatCurrency(lot.costPerUnit)}</p></div><div className="text-[10px] font-bold text-slate-400"><p className="uppercase">วันหมดอายุ</p><p className={`text-xs font-bold ${isExpiring ? 'text-rose-500' : 'text-slate-600'}`}>{lot.expiryDate ? formatDate(new Date(lot.expiryDate)) : '-'}</p></div></div><div className="flex items-center gap-6"><div className="text-right"><p className="text-[9px] font-bold text-slate-400 uppercase">คงเหลือในล็อต</p><p className="text-lg font-bold text-indigo-600">{lot.remainingQty} <span className="text-[10px] text-slate-300 font-normal">/ {lot.initialQty}</span></p></div><div className="text-right border-l pl-6 border-slate-100"><p className="text-[9px] font-bold text-slate-400 uppercase">มูลค่าต้นทุน</p><p className="text-sm font-bold text-slate-800">{formatCurrency(lot.remainingQty * lot.costPerUnit)}</p></div></div></div>) })} {productLots.length === 0 && (<div className="text-center py-6 text-slate-400 italic text-xs">ไม่มีล็อตสินค้าคงเหลือในขณะนี้</div>)}</div></div></td></tr>)}</React.Fragment>)
              })}</tbody></table>) : (
          <div className="animate-fadeIn"><div className="p-8 border-b bg-slate-50/50 hidden print:block text-center"><h1 className="text-2xl font-bold text-slate-900 mb-2">รายงานสินค้าคงคลังและมูลค่าต้นทุน</h1><p className="text-sm text-slate-600 font-bold">ข้อมูลสรุปเพื่อการจัดทำบัญชีและยื่นภาษี ณ วันที่ {formatDate(new Date())}</p></div><table className="w-full text-left border-collapse"><thead className="bg-slate-900 text-white font-bold uppercase text-[10px] sticky top-0 z-20"><tr><th className="p-4 w-12 text-center border-r border-slate-700">ลำดับ</th><th className="p-4 border-r border-slate-700">รหัสสินค้า (SKU)</th><th className="p-4 border-r border-slate-700">ชื่อสินค้า</th><th className="p-4 text-center border-r border-slate-700">สินค้าเข้า (In)</th><th className="p-4 text-center border-r border-slate-700">สินค้าออก (Out)</th><th className="p-4 text-center border-r border-slate-700">คงเหลือ (Balance)</th><th className="p-4 text-right border-r border-slate-700">ทุนเฉลี่ย/หน่วย</th><th className="p-4 text-right">มูลค่าทุนรวม</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredProducts.map((p, idx) => { const info = getProductTaxInfo(p.id); return (<tr key={`tax-${p.id}`} className="hover:bg-slate-50 transition-colors"><td className="p-4 text-center text-slate-400 font-mono border-r">{idx + 1}</td><td className="p-4 font-mono text-slate-600 border-r">{p.sku}</td><td className="p-4 font-bold text-slate-800 border-r">{p.name}</td><td className="p-4 text-center text-emerald-600 font-bold border-r bg-emerald-50/30">{info.totalIn}</td><td className="p-4 text-center text-rose-600 font-bold border-r bg-rose-50/30">{info.totalOut}</td><td className="p-4 text-center font-bold text-slate-700 border-r">{info.totalQty}</td><td className="p-4 text-right text-slate-500 border-r">{formatCurrency(info.avgCostPerUnit)}</td><td className="p-4 text-right font-black text-indigo-700">{formatCurrency(info.totalCostValue)}</td></tr>); })}</tbody><tfoot className="bg-slate-50"><tr className="font-black text-slate-900 border-t-2 border-slate-200"><td colSpan="3" className="p-4 text-right text-sm uppercase">มูลค่ารวมสินค้าคงคลังทั้งสิ้น</td><td className="p-4 text-center text-sm text-emerald-700">{filteredProducts.reduce((sum, p) => sum + getProductTaxInfo(p.id).totalIn, 0)}</td><td className="p-4 text-center text-sm text-rose-700">{filteredProducts.reduce((sum, p) => sum + getProductTaxInfo(p.id).totalOut, 0)}</td><td className="p-4 text-center text-sm">{filteredProducts.reduce((sum, p) => sum + getProductTaxInfo(p.id).totalQty, 0)}</td><td className="p-4 border-r"></td><td className="p-4 text-right text-lg text-indigo-800">{formatCurrency(totalVal)}</td></tr></tfoot></table></div>
        )}</div>
      {showModal && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print"><div className="bg-white rounded-[40px] p-10 w-full max-lg shadow-2xl relative animate-in zoom-in-95 duration-200"><h3 className="text-2xl font-bold mb-8 flex items-center gap-2">{editingProduct ? <Edit/> : <PlusCircle/>} ข้อมูลสินค้าใหม่</h3><div className="space-y-6 mb-10"><div className="flex gap-6 items-start"><div onClick={() => productImgRef.current?.click()} className="w-28 h-28 rounded-[24px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all overflow-hidden relative shrink-0 group">{formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <><ImageIcon className="text-slate-300" size={28}/><p className="text-[9px] font-bold text-slate-400 mt-2">ใส่ภาพ</p></>}<input type="file" ref={productImgRef} hidden accept="image/*" onChange={handleImgUpload} /></div><div className="flex-1 space-y-4"><div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ชื่อสินค้าปลีก</label><input className="w-full bg-slate-50 border-0 rounded-2xl p-3.5 text-sm font-bold mt-1" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="ชื่อสินค้า..." /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Auto SKU</label><input className="w-full bg-slate-50 border-0 rounded-2xl p-3.5 text-sm font-bold mt-1" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} placeholder="ว่างไว้เพื่อเจนรหัสออโต้" /></div></div></div><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">หมวดหมู่</label><select className="w-full bg-slate-50 border-0 rounded-2xl p-3.5 text-sm font-bold mt-1 appearance-none" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>{CONSTANTS.CATEGORIES.STOCK.map(c => <option key={c} value={c}>{c}</option>)}</select></div><div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ราคาขาย</label><input type="number" className="w-full bg-slate-50 border-0 rounded-2xl p-3.5 text-sm font-bold text-right text-indigo-600 mt-1" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} /></div></div>{!editingProduct && (<div className="bg-indigo-50/50 p-6 rounded-[28px] space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-indigo-400 uppercase ml-1">ต้นทุนล็อตแรก</label><input type="number" className="w-full bg-white border-0 rounded-xl p-3 text-sm font-bold text-right" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} /></div><div><label className="text-[10px] font-bold text-indigo-400 uppercase ml-1">จำนวนยอดยกมา</label><input type="number" className="w-full bg-white border-0 rounded-xl p-3 text-sm font-bold text-center" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} /></div></div><div><label className="text-[10px] font-bold text-indigo-400 uppercase ml-1 flex items-center gap-1"><Calendar size={12}/> วันหมดอายุของสต็อกนี้</label><input type="date" className="w-full bg-white border-0 rounded-xl p-3 text-sm font-bold mt-1" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} /></div></div>)}</div><div className="flex gap-3"><button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600">ยกเลิก</button><button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100">บันทึกข้อมูล</button></div></div></div>)}
      {showAdjModal && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print"><div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200"><h3 className="text-xl font-bold mb-6 text-rose-600 flex items-center gap-2"><AlertTriangle/> ตัดสต็อกชำรุด</h3><div className="space-y-4 mb-8"><div><label className="text-[10px] font-bold text-slate-400 uppercase">สินค้า</label><select className="w-full bg-slate-50 border-0 rounded-2xl p-3.5 text-sm font-bold" value={adjData.productId} onChange={e => setAdjData({ ...adjData, productId: e.target.value })}><option value="">-- เลือกสินค้า --</option>{products.filter(p=>p.stock > 0).map(p => <option key={p.id} value={p.id}>{p.name} (เหลือ {p.stock})</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-slate-400 uppercase">จำนวน</label><input type="number" className="w-full bg-slate-50 border-0 rounded-2xl p-3.5 text-sm font-bold text-center" value={adjData.qty} onChange={e => setAdjData({ ...adjData, qty: e.target.value })} /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase">เหตุผล</label><select className="w-full bg-slate-50 border-0 rounded-2xl p-3.5 text-sm font-bold" value={adjData.reason} onChange={e => setAdjData({ ...adjData, reason: e.target.value })}><option value="damaged">เสียหาย</option><option value="expired">หมดอายุ</option><option value="lost">สูญหาย</option></select></div></div></div><div className="flex gap-3"><button onClick={() => setShowAdjModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold">ยกเลิก</button><button onClick={handleAdjustmentSave} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold">ยืนยันตัดสต็อก</button></div></div></div>)}
    </div>
  );
};

const TaxReport = ({ transactions, invoices }) => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth());
    const [activeReport, setActiveReport] = useState('sales'); 
    const [showOperatorForm, setShowOperatorForm] = useState(false);
    const [operatorInfo, setOperatorInfo] = useState(() => { const saved = JSON.parse(localStorage.getItem('merchant_seller_info') || '{}'); return { name: saved.sellerName || '', taxId: saved.sellerTaxId || '', address: saved.sellerAddress || '', branchCode: saved.sellerBranchId || '00000', isHeadOffice: (saved.sellerBranchId === '00000' || !saved.sellerBranchId) }; });
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const taxData = useMemo(() => {
      const start = new Date(year, month, 1); const end = new Date(year, month + 1, 0, 23, 59, 59);
      const periodTrans = (transactions || []).filter(t => { const d = normalizeDate(t.date); return d >= start && d <= end; });
      const sales = periodTrans.filter(t => t.type === 'income').map(t => ({ ...t, itemNames: Array.isArray(t.items) ? t.items.map(it => it.desc || "ไม่ระบุ").join(', ') : (t.description || '-') })).sort((a, b) => normalizeDate(a.date) - normalizeDate(b.date)); 
      const purchases = periodTrans.filter(t => t.type === 'expense' && t.vatType !== 'none').map(t => ({ ...t, itemNames: Array.isArray(t.items) ? t.items.map(it => it.desc || "ไม่ระบุ").join(', ') : (t.description || '-') })).sort((a, b) => normalizeDate(a.date) - normalizeDate(b.date)); 
      const salesTotalBase = sales.reduce((sum, t) => sum + (Number(t.net) || Number(t.amount) || 0), 0);
      const salesTotalVat = sales.reduce((sum, t) => sum + (Number(t.vat) || 0), 0);
      const purchaseTotalBase = purchases.reduce((sum, t) => sum + (Number(t.net) || Number(t.amount) || 0), 0);
      const purchaseTotalVat = purchases.reduce((sum, t) => sum + (Number(t.vat) || 0), 0);
      const vatPayable = salesTotalVat - purchaseTotalVat;
      const productStats = {};
      periodTrans.forEach(t => {
          const items = Array.isArray(t.items) ? t.items : [{ desc: t.description, qty: 1, amount: t.total, price: t.total }];
          items.forEach(it => {
              const key = `${t.category || "ไม่ระบุ"}_${it.desc || "ไม่ทราบรายการ"}`;
              if (!productStats[key]) productStats[key] = { category: t.category || "ไม่ระบุ", name: it.desc || "ไม่ทราบรายการ", salesQty: 0, salesAmt: 0, purchaseQty: 0, purchaseAmt: 0 };
              if (t.type === 'income') { productStats[key].salesQty += (Number(it.qty) || 1); productStats[key].salesAmt += (Number(it.amount || it.price * it.qty) || 0); } 
              else { productStats[key].purchaseQty += (Number(it.qty) || 1); productStats[key].purchaseAmt += (Number(it.amount || it.price * it.qty) || 0); }
          });
      });
      return { sales, purchases, products: Object.values(productStats).sort((a,b) => String(a?.category || "").localeCompare(String(b?.category || ""))), salesTotalBase, salesTotalVat, purchaseTotalBase, purchaseTotalVat, vatPayable };
    }, [transactions, year, month]);
    const reportTitle = activeReport === 'sales' ? 'รายงานภาษีขาย' : activeReport === 'purchase' ? 'รายงานภาษีซื้อ' : 'รายงานสรุปสินค้าและวัตถุดิบ';
    const exportTaxReport = () => {
        const fileName = `${activeReport === 'sales' ? 'Output' : activeReport === 'purchase' ? 'Input' : 'Product'}_Tax_Report_${months[month]}_${year}.xlsx`;
        let header = [], data = [];
        const infoRows = [ [`${reportTitle}`], [`เดือนภาษี: ${months[month]} พ.ศ. ${year + 543}`], [`ผู้ประกอบการ: ${operatorInfo.name || '-'} เลขประจำตัวผู้เสียภาษี: ${operatorInfo.taxId || '-'}`], [`ที่อยู่: ${operatorInfo.address || '-'}`], [`สถานประกอบการ: ${operatorInfo.isHeadOffice ? 'สำนักงานใหญ่' : 'สาขาที่ ' + operatorInfo.branchCode}`], [] ];
        if (activeReport === 'sales') { header = [['ลำดับ', 'วันที่', 'เลขที่ใบกำกับภาษี', 'ชื่อผู้ซื้อสินค้า/ผู้รับบริการ', 'รายการสินค้า', 'เลขผู้เสียภาษี', 'สาขา', 'มูลค่าสินค้า (Tax Base)', 'ภาษีมูลค่าเพิ่ม (VAT)', 'จำนวนเงินรวม']]; data = taxData.sales.map((t, i) => [i + 1, formatDate(t.date), t.invNo || t.orderId || '-', t.customerName || 'ลูกค้าทั่วไป', t.itemNames, t.customerTaxId || '-', t.customerBranch === '00000' ? 'สำนักงานใหญ่' : (t.customerBranch || '-'), t.net || t.amount, t.vat || 0, t.total]); } 
        else if (activeReport === 'purchase') { header = [['ลำดับ', 'วันที่', 'เลขใบกำกับภาษี', 'ชื่อผู้ขายสินค้า/ผู้ให้บริการ', 'รายการสินค้า', 'เลขผู้เสียภาษี', 'สาขา', 'มูลค่าสินค้า (Tax Base)', 'ภาษีมูลค่าเพิ่ม (VAT)', 'จำนวนเงินรวม']]; data = taxData.purchases.map((t, i) => [i + 1, formatDate(t.date), t.taxInvoiceNo || '-', t.vendorName || 'ไม่ระบุชื่อคู่ค้า', t.itemNames, t.vendorTaxId || '-', t.vendorBranch === '00000' ? 'สำนักงานใหญ่' : (t.vendorBranch || '-'), t.net || t.amount, t.vat || 0, t.total]); } 
        else { header = [['ลำดับ', 'หมวดหมู่', 'ชื่อสินค้า', 'จำนวนที่ขาย', 'ยอดขายรวม', 'จำนวนที่ซื้อ', 'ยอดซื้อรวม']]; data = taxData.products.map((p, i) => [i + 1, p.category, p.name, p.salesQty.toFixed(2), p.salesAmt, p.purchaseQty.toFixed(2), p.purchaseAmt]); }
        exportToExcel(fileName, data, infoRows.concat(header));
    };

    return (
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col animate-fadeIn text-left font-sarabun">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-100 pb-6 no-print"><div><h3 className="font-bold text-slate-800 text-xl flex items-center gap-2"><Calculator className="text-indigo-600"/> รายงานภาษีมูลค่าเพิ่ม & ตรวจสอบสินค้า</h3><p className="text-slate-500 text-sm">แสดงข้อมูลครบถ้วนสำหรับ ภ.พ.30 และการตรวจสอบภายใน</p></div><div className="flex gap-2"><button onClick={() => setShowOperatorForm(!showOperatorForm)} className={"px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 " + (showOperatorForm ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}><Building size={16}/> {showOperatorForm ? 'ปิดแก้ไข' : 'ข้อมูลผู้ประกอบการ'}</button><select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-slate-50 border-none rounded-xl text-sm font-bold py-2 px-4 text-slate-600">{months.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-slate-50 border-none rounded-xl text-sm font-bold py-2 px-4 text-slate-600">{[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}</select><button onClick={exportTaxReport} className="bg-emerald-50 text-emerald-600 p-2 rounded-xl hover:bg-emerald-100 flex items-center gap-2 px-4 text-sm font-bold shadow-sm transition-all"><Download size={18}/> Export Excel</button><button onClick={() => window.print()} className="bg-slate-800 text-white p-2 rounded-xl hover:bg-slate-900 flex items-center gap-2 px-4 text-sm font-bold shadow-sm transition-all"><Printer size={18}/> Print Report</button></div></div>
          {showOperatorForm && (<div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top no-print"><div className="lg:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">ชื่อสถานประกอบการ</label><input className="w-full bg-white border-slate-200 rounded-xl p-2.5 text-sm font-bold mt-1" value={operatorInfo.name} onChange={e => setOperatorInfo({...operatorInfo, name: e.target.value})} placeholder="ระบุชื่อบริษัท/ร้านค้า" /></div><div><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">เลขผู้เสียภาษี (13 หลัก)</label><input className="w-full bg-white border-slate-200 rounded-xl p-2.5 text-sm font-bold mt-1" value={operatorInfo.taxId} onChange={e => setOperatorInfo({...operatorInfo, taxId: e.target.value})} placeholder="0000000000000" /></div><div className="lg:col-span-3"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">ที่อยู่จดทะเบียนภาษีมูลค่าเพิ่ม</label><input className="w-full bg-white border-slate-200 rounded-xl p-2.5 text-sm font-bold mt-1" value={operatorInfo.address} onChange={e => setOperatorInfo({...operatorInfo, address: e.target.value})} placeholder="บ้านเลขที่, ถนน, ตำบล..." /></div><div><label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">สถานประกอบการ</label><div className="flex gap-2 items-center h-[42px]"><label className="flex items-center gap-1.5 text-sm cursor-pointer font-bold text-slate-700"><input type="checkbox" className="rounded text-indigo-600" checked={operatorInfo.isHeadOffice} onChange={e => setOperatorInfo({...operatorInfo, isHeadOffice: e.target.checked, branchCode: e.target.checked ? '00000' : operatorInfo.branchCode})} /> สำนักงานใหญ่</label>{!operatorInfo.isHeadOffice && (<input className="w-20 bg-white border-slate-200 rounded-lg p-1.5 text-sm font-bold text-center" value={operatorInfo.branchCode} onChange={e => setOperatorInfo({...operatorInfo, branchCode: e.target.value})} placeholder="00001" />)}</div></div></div>)}
          <div id="tax-report-print-area" className="flex-1 flex flex-col min-h-0"><div className="mb-6 border-b-2 border-slate-900 pb-6 text-center md:text-left"><h1 className="text-2xl font-bold text-slate-900 mb-2 uppercase tracking-tight">{reportTitle}</h1><div className="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 text-sm text-slate-700 font-medium"><p><strong>เดือนภาษี:</strong> {months[month]} <strong>ปี:</strong> {year + 543}</p><p className="md:text-right"><strong>ชื่อผู้ประกอบการ:</strong> {operatorInfo.name || '-'}</p><p><strong>ที่อยู่สถานประกอบการ:</strong> {operatorInfo.address || '-'}</p><p className="md:text-right"><strong>เลขประจำตัวผู้เสียภาษี:</strong> {operatorInfo.taxId || '-'}</p><p><strong>สถานประกอบการ:</strong> {operatorInfo.isHeadOffice ? 'สำนักงานใหญ่' : `สาขาเลขที่ ${operatorInfo.branchCode}`}</p></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 no-print"><div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden"><div className="absolute top-0 right-0 p-3 opacity-10 text-emerald-600"><TrendingUp size={60}/></div><p className="text-xs font-bold text-emerald-600 uppercase mb-4 tracking-wider">1. ภาษีขาย (Output Tax)</p><div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-slate-500">ยอดขายรวม</span><span className="font-bold text-slate-700">{formatCurrency(taxData.salesTotalBase)}</span></div><div className="flex justify-between items-end pt-2 border-t border-emerald-50"><span className="text-sm font-bold text-emerald-700">ภาษีขายต้องนำส่ง</span><span className="text-xl font-bold text-emerald-600">{formatCurrency(taxData.salesTotalVat)}</span></div></div></div><div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden"><div className="absolute top-0 right-0 p-3 opacity-10 text-rose-600"><TrendingDown size={60}/></div><p className="text-xs font-bold text-rose-600 uppercase mb-4 tracking-wider">2. ภาษีซื้อ (Input Tax)</p><div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-slate-500">ยอดทุนรวม</span><span className="font-bold text-slate-700">{formatCurrency(taxData.purchaseTotalBase)}</span></div><div className="flex justify-between items-end pt-2 border-t border-rose-50"><span className="text-sm font-bold text-rose-700">ภาษีซื้อขอคืนได้</span><span className="text-xl font-bold text-emerald-600">{formatCurrency(taxData.purchaseTotalVat)}</span></div></div></div><div className={`col-span-1 md:col-span-2 p-6 rounded-2xl border shadow-md flex flex-col justify-center relative overflow-hidden ${taxData.vatPayable > 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-emerald-50 border-emerald-100'}`}><p className={`text-xs font-bold uppercase mb-2 relative z-10 ${taxData.vatPayable > 0 ? 'text-indigo-600' : 'text-emerald-600'}`}>3. ภาษีมูลค่าเพิ่มสุทธิ (Net VAT)</p><div className="flex justify-between items-end pt-2 relative z-10 mt-auto"><span className={`text-sm font-bold ${taxData.vatPayable > 0 ? 'text-indigo-800' : 'text-emerald-800'}`}>{taxData.vatPayable > 0 ? 'ต้องชำระภาษีเพิ่ม (Payable)' : 'มีสิทธิขอคืนภาษี (Refundable)'}</span><span className={`text-3xl font-bold ${taxData.vatPayable > 0 ? 'text-indigo-600' : 'text-emerald-600'}`}>{formatCurrency(Math.abs(taxData.vatPayable))}</span></div><div className={`absolute -right-5 -bottom-5 opacity-10 ${taxData.vatPayable > 0 ? 'text-indigo-600' : 'text-emerald-600'}`}><Wallet size={100}/></div></div></div>
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit mb-4 self-center md:self-start no-print"><button onClick={() => setActiveReport('sales')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeReport === 'sales' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><FileText size={16}/> รายงานภาษีขาย</button><button onClick={() => setActiveReport('purchase')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeReport === 'purchase' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><FileText size={16}/> รายงานภาษีซื้อ</button><button onClick={() => setActiveReport('products')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeReport === 'products' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List size={16}/> สรุปตามสินค้า</button></div>
              <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 custom-scrollbar shadow-sm bg-white text-[11px]">{activeReport === 'products' ? (
                    <table className="w-full text-left whitespace-nowrap border-collapse"><thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200"><tr><th className="p-4 w-[50px] border-r border-slate-200 text-center">ลำดับ</th><th className="p-4 border-r border-slate-200">หมวดหมู่</th><th className="p-4 border-r border-slate-200">สินค้า</th><th className="p-4 text-center border-r border-slate-200">ขาย (Qty)</th><th className="p-4 text-right border-r border-slate-200">ยอดขาย</th><th className="p-4 text-center border-r border-slate-200">ซื้อ (Qty)</th><th className="p-4 text-right">ยอดซื้อ</th></tr></thead><tbody className="divide-y divide-slate-100">{taxData.products.map((p, i) => (<tr key={i} className="hover:bg-slate-50 transition-colors"><td className="p-4 text-center border-r border-slate-50">{i + 1}</td><td className="p-4 border-r border-slate-50"><span className="bg-slate-100 px-2 py-0.5 rounded font-bold">{p.category}</span></td><td className="p-4 font-bold border-r border-slate-50">{p.name}</td><td className="p-4 text-center font-bold text-emerald-600 border-r border-slate-50">{p.salesQty.toFixed(2)}</td><td className="p-4 text-right border-r border-slate-50">{formatCurrency(p.salesAmt)}</td><td className="p-4 text-center font-bold text-rose-600 border-r border-slate-50">{p.purchaseQty.toFixed(2)}</td><td className="p-4 text-right">{formatCurrency(p.purchaseAmt)}</td></tr>))}</tbody></table>
                  ) : (<table className="w-full text-left border-collapse"><thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200"><tr><th className="p-4 border-r border-slate-200 w-[50px] text-center">ลำดับ</th><th className="p-4 border-r border-slate-200 w-[100px]">วันที่</th><th className="p-4 border-r border-slate-200 w-[120px]">เลขใบกำกับ</th><th className="p-4 border-r border-slate-200">ผู้ซื้อ/ผู้ขาย</th><th className="p-4 border-r border-slate-200">รายการสินค้า</th><th className="p-4 border-r border-slate-200 w-[130px]">เลขผู้เสียภาษี</th><th className="p-4 border-r border-slate-200 text-right w-[100px]">มูลค่า</th><th className="p-4 border-r border-slate-200 text-right w-[80px]">VAT</th><th className="p-4 text-right w-[100px]">รวมเงิน</th></tr></thead><tbody className="divide-y divide-slate-100">{(activeReport === 'sales' ? taxData.sales : taxData.purchases).map((t, i) => (<tr key={i} className="hover:bg-slate-50 transition-colors"><td className="p-4 border-r border-slate-50 text-center">{i + 1}</td><td className="p-4 border-r border-slate-50 text-slate-500 font-mono">{formatDate(t.date)}</td><td className="p-4 border-r border-slate-50 font-mono font-bold text-slate-800">{activeReport === 'sales' ? (t.invNo || '-') : (t.taxInvoiceNo || '-')}</td><td className="p-4 border-r border-slate-50 font-bold">{activeReport === 'sales' ? (t.customerName || 'ลูกค้าทั่วไป') : (t.vendorName || 'ไม่ระบุ')}</td><td className="p-4 border-r border-slate-50 truncate max-w-[150px]" title={t.itemNames}>{t.itemNames}</td><td className="p-4 border-r border-slate-50 text-slate-500 font-mono">{activeReport === 'sales' ? (t.customerTaxId || '-') : (t.vendorTaxId || '-')}</td><td className="p-4 border-r border-slate-50 text-right text-slate-600">{formatCurrency(t.net || t.amount)}</td><td className="p-4 border-r border-slate-50 text-right font-bold text-slate-800">{formatCurrency(t.vat || 0)}</td><td className="p-4 text-right font-bold text-indigo-600">{formatCurrency(t.total)}</td></tr>))}</tbody><tfoot><tr className="bg-slate-900 text-white font-bold"><td colSpan="6" className="p-4 text-right text-[12px]">รวมทั้งสิ้น</td><td className="p-4 text-right text-[12px]">{formatCurrency(activeReport === 'sales' ? taxData.salesTotalBase : taxData.purchaseTotalBase)}</td><td className="p-4 text-right text-[12px]">{formatCurrency(activeReport === 'sales' ? taxData.salesTotalVat : taxData.purchaseTotalVat)}</td><td className="p-4 text-right text-[12px]">{formatCurrency((activeReport === 'sales' ? taxData.salesTotalBase : taxData.purchaseTotalBase) + (activeReport === 'sales' ? taxData.salesTotalVat : taxData.purchaseTotalVat))}</td></tr></tfoot></table>)}</div></div></div>);
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [inventoryLots, setInventoryLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appId, setAppId] = useState(localStorage.getItem('merchant_app_id') || CONSTANTS.IDS.DEV);
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => { const id = Date.now(); setToasts(prev => [...prev, { id, message, type }]); setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000); };
  const removeToast = (id) => { setToasts(prev => prev.filter(t => t.id !== id)); };
  const toggleAppMode = () => { const ids = Object.values(CONSTANTS.IDS); const currentIndex = ids.indexOf(appId); const nextIndex = (currentIndex + 1) % ids.length; const newId = ids[nextIndex]; setAppId(newId); localStorage.setItem('merchant_app_id', newId); setLoading(true); addToast("ฐานข้อมูล: " + newId, 'success'); };
  const currentModeLabel = useMemo(() => { if (appId === CONSTANTS.IDS.DEV) return 'Dev Mode'; if (appId === CONSTANTS.IDS.PROD) return 'Production'; if (appId === CONSTANTS.IDS.Y2026) return 'Database 2026'; return appId; }, [appId]);
  
  useEffect(() => { 
    const initAuth = async () => { 
      try { await signInAnonymously(authInstance); } catch (e) { console.error(e); } 
    }; 
    initAuth(); 
    onAuthStateChanged(authInstance, setUser); 
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const qInc = query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'transactions_income'));
    const qExp = query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'transactions_expense'));
    const qInv = query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'invoices'));
    const qLots = query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_lots'));
    const unsubInc = onSnapshot(qInc, (s) => setTransactions(prev => [...prev.filter(t=>t.type!=='income'), ...s.docs.map(d=>({id:d.id, ...d.data(), date: normalizeDate(d.data().date)}))]));
    const unsubExp = onSnapshot(qExp, (s) => setTransactions(prev => [...prev.filter(t=>t.type!=='expense'), ...s.docs.map(d=>({id:d.id, ...d.data(), date: normalizeDate(d.data().date)}))]));
    const unsubInv = onSnapshot(qInv, (s) => setInvoices(s.docs.map(d=>({id:d.id, ...d.data(), date: normalizeDate(d.data().date)}))));
    const unsubLots = onSnapshot(qLots, (s) => { setInventoryLots(s.docs.map(d=>({id:d.id, ...d.data()}))); setLoading(false); });
    return () => { unsubInc(); unsubExp(); unsubInv(); unsubLots(); };
  }, [user, appId]);

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard transactions={transactions} invoices={invoices} />;
      case 'analytics': return <CentralAnalytics user={user} showToast={addToast} />;
      case 'annual_tax': return <AnnualTaxCalculator user={user} transactions={transactions} showToast={addToast} />;
      case 'financial_position': return <FinancialPosition transactions={transactions} invoices={invoices} inventoryLots={inventoryLots} />;
      case 'records': return <RecordManager user={user} transactions={transactions} invoices={invoices} appId={appId} showToast={addToast} />;
      case 'invoice': return <InvoiceGenerator user={user} invoices={invoices} appId={appId} showToast={addToast} />;
      case 'stock': return <StockManager appId={appId} showToast={addToast} transactions={transactions} />;
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
        <div className="p-6 border-b border-slate-800 text-left">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-2 text-left"><Wallet className="text-indigo-400 text-left"/> MerchantTax</h1>
        </div>
        <nav className="p-4 space-y-8 mt-2 flex-1 overflow-y-auto text-left">
          <div className="space-y-2">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Performance</p>
            <div className="space-y-1">
              <NavButton active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setSidebarOpen(false);}} icon={<PieChart size={20} />} label="แดชบอร์ดผลงาน (Performance)" />
              <NavButton active={activeTab === 'analytics'} onClick={() => {setActiveTab('analytics'); setSidebarOpen(false);}} icon={<Layers size={20} />} label="วิเคราะห์ข้ามปี (YoY)" />
              <NavButton active={activeTab === 'annual_tax'} onClick={() => {setActiveTab('annual_tax'); setSidebarOpen(false);}} icon={<Calculator size={20} />} label="ภาษีประจำปี (PIT)" />
              <NavButton active={activeTab === 'financial_position'} onClick={() => {setActiveTab('financial_position'); setSidebarOpen(false);}} icon={<Briefcase size={20} />} label="สรุปฐานะการเงิน (Financial)" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operations</p>
            <div className="space-y-1">
              <NavButton active={activeTab === 'records'} onClick={() => {setActiveTab('records'); setSidebarOpen(false);}} icon={<Store size={20} />} label="POS / ขายหน้าร้าน" />
              <NavButton active={activeTab === 'invoice'} onClick={() => {setActiveTab('invoice'); setSidebarOpen(false);}} icon={<Printer size={20} />} label="ใบกำกับภาษี (Pro)" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Back Office</p>
            <div className="space-y-1">
              <NavButton active={activeTab === 'stock'} onClick={() => {setActiveTab('stock'); setSidebarOpen(false);}} icon={<Package size={20} />} label="สต็อกสินค้า" />
              <NavButton active={activeTab === 'taxes'} onClick={() => {setActiveTab('taxes'); setSidebarOpen(false);}} icon={<Calculator size={20} />} label="รายงานภาษี" />
            </div>
          </div>
        </nav>
        <div className="p-6 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800 text-left">
          <div className="mb-2 text-[10px] uppercase font-bold text-slate-500 ml-1">Database Instance</div>
          <button onClick={toggleAppMode} className={"w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all bg-slate-800 text-indigo-300 ring-1 ring-slate-700 hover:bg-slate-700 hover:text-white"}><Database size={14}/> {currentModeLabel}</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full text-left">
        <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 p-4 lg:px-8 flex justify-between items-center z-10 sticky top-0 text-left">
          <div className="flex items-center gap-3 text-left">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 rounded-md hover:bg-slate-100 transition-colors text-left"><Menu size={24} /></button>
            <h2 className="font-semibold text-slate-800 text-lg text-left">{activeTab.toUpperCase()}</h2>
          </div>
          <div className="flex items-center gap-3 text-right">
            {loading && <div className="text-xs font-bold text-indigo-600 flex items-center gap-1 animate-pulse text-right"><Loader size={12} className="animate-spin text-right"/> Syncing...</div>}
          </div>
        </header>
        <div className="flex-1 overflow-auto p-2 lg:p-6 relative scroll-smooth w-full text-left">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
