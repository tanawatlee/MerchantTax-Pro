import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PieChart, Wallet, FileText, Calculator, Save, TrendingUp, TrendingDown, 
  Download, Trash2, Edit, Menu, X, Printer, 
  CheckCircle, Loader, User, Package, Search, Clock, List, Settings, PlusCircle, Tag,
  Store, Database, ImageIcon, BarChart2, Activity, ShoppingBag, Eye, EyeOff, Inbox, XCircle, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, AlertTriangle, Calendar, Info, MapPin, Building, Layers, ArrowRightLeft, Percent, ClipboardList, Briefcase,
  Camera, Sparkles, ScanText, Zap, ChevronRight, Truck, Ticket, CreditCard, FileUp, Hash, Copy, FileCheck, Box, History, AlertCircle, ShoppingCart, Truck as TruckIcon,
  RefreshCw, Plus, FileSpreadsheet, DownloadCloud, Users, Layers as LayersIcon, Filter, ArrowRight, FileJson, FileType, SaveAll,
  TrendingUp as ProfitIcon, Star, HandCoins, Landmark, LogOut, Lock, Mail, Key, Gift, Wand2, BookOpen, Lightbulb, Receipt, FileMinus, Cloud
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
    INCOME: ['รายได้จากการขายสินค้า', 'รายได้จากค่าจัดส่ง (ลูกค้าจ่าย)', 'รายได้จากการให้บริการ', 'รายได้ค่านายหน้า/ตัวแทน', 'รายได้อื่นๆ (ดอกเบี้ย, เงินปันผล)'],
    EXPENSE: ['ค่าใช้จ่ายทั่วไป', 'ต้นทุนสินค้า', 'ค่าแพ็คกิ้ง/บรรจุภัณฑ์', 'อุปกรณ์/เครื่องใช้สำนักงาน', 'ค่าน้ำมัน (ซื้อของเข้าร้าน)', 'ค่าขนส่งพัสดุ (ส่งลูกค้า)', 'สินค้าเสียหาย/หมดอายุ', 'ค่าบริการ/จ้างทำของ', 'ค่าโฆษณา (ในประเทศ)', 'ค่าโฆษณา (ภ.พ.36)', 'ค่าธรรมเนียม Platform', 'ค่าเช่า', 'เงินเดือน', 'ภาษี/เบี้ยปรับ', 'ส่วนลดร้านค้า'],
    STOCK: ['อาหาร and เครื่องดื่ม', 'ของใช้ส่วนตัว', 'ผลิตภัณฑ์ในครัวเรือน', 'ผลิตภัณฑ์ดูแลผ้า', 'แม่ and เด็ก', 'สุขภาพ and ความงาม', 'สัตว์เลี้ยง', 'ขนม and ของว่าง', 'เครื่องปรุง/วัตถุดิบ', 'บรรจุภัณฑ์/อุปกรณ์แพ็ค', 'อื่นๆ']
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
    color-scheme: light; /* ☀️ บังคับธีมสว่าง ป้องกันไอคอนและช่องป้อนข้อมูลกลายเป็นสีดำทึบ */
  }

  input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(0) !important;
      opacity: 1;
      cursor: pointer;
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
    let cleanStr = dateInput.trim();
    
    const thaiMonths = { 
        'ม.ค.': '01', 'มกราคม': '01', 'jan': '01',
        'ก.พ.': '02', 'กุมภาพันธ์': '02', 'feb': '02',
        'มี.ค.': '03', 'มีนาคม': '03', 'mar': '03',
        'เม.ย.': '04', 'เมษายน': '04', 'apr': '04',
        'พ.ค.': '05', 'พฤษภาคม': '05', 'may': '05',
        'มิ.ย.': '06', 'มิถุนายน': '06', 'jun': '06',
        'ก.ค.': '07', 'กรกฎาคม': '07', 'jul': '07',
        'ส.ค.': '08', 'สิงหาคม': '08', 'aug': '08',
        'ก.ย.': '09', 'กันยายน': '09', 'sep': '09',
        'ต.ค.': '10', 'ตุลาคม': '10', 'oct': '10',
        'พ.ย.': '11', 'พฤศจิกายน': '11', 'nov': '11',
        'ธ.ค.': '12', 'ธันวาคม': '12', 'dec': '12' 
    };
    
    for (const [th, num] of Object.entries(thaiMonths)) {
        if (cleanStr.toLowerCase().includes(th)) {
            cleanStr = cleanStr.replace(new RegExp(th, 'gi'), `-${num}-`);
            break;
        }
    }

    const parts = cleanStr.split(/[\/\-\s:]+/).filter(p => p.length > 0);
    if (parts.length >= 3) {
      let d, m, y;
      if (parts[0].length === 4) {
        y = parseInt(parts[0]); m = parseInt(parts[1]); d = parseInt(parts[2]);
      } else {
        d = parseInt(parts[0]); m = parseInt(parts[1]); y = parseInt(parts[2]);
      }
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        if (y > 2400) y -= 543; // แปลง พ.ศ. เป็น ค.ศ.
        if (y > 0 && y < 100) y += 2000; // แปลงปีแบบ 2 หลัก (เช่น 24 -> 2024)
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
  const timeA = normalizeDate(a.date)?.getTime() || 0;
  const timeB = normalizeDate(b.date)?.getTime() || 0;
  
  if (timeA !== timeB) return timeB - timeA;

  const createdA = a.createdAt?.seconds || 0;
  const createdB = b.createdAt?.seconds || 0;
  return createdB - createdA;
};

const sortOldestFirst = (a, b) => {
  const timeA = normalizeDate(a.date)?.getTime() || 0;
  const timeB = normalizeDate(b.date)?.getTime() || 0;
  
  if (timeA !== timeB) return timeA - timeB;

  const createdA = a.createdAt?.seconds || 0;
  const createdB = b.createdAt?.seconds || 0;
  return createdA - createdB;
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

const generateDateBasedDocId = (items, prefix, dateInput, field) => {
  const dateStr = formatDateISO(dateInput).replace(/-/g, '');
  const fullPrefix = `${prefix}${dateStr}-`;
  const max = items.reduce((m, item) => {
    if (item[field] && String(item[field]).startsWith(fullPrefix)) {
      const num = parseInt(String(item[field]).replace(fullPrefix, ''), 10);
      return !isNaN(num) && num > m ? num : m;
    }
    return m;
  }, 0);
  return `${fullPrefix}${String(max + 1).padStart(5, '0')}`;
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

const matchItemToBatch = (itemSku, itemName, batchSku, batchName) => {
    const iSku = String(itemSku || '').trim().toLowerCase();
    const bSku = String(batchSku || '').trim().toLowerCase();
    const iName = String(itemName || '').trim().toLowerCase();
    const bName = String(batchName || '').trim().toLowerCase();

    const hasValidItemSku = iSku !== '' && iSku !== '-';
    
    if (hasValidItemSku) {
        return bSku === iSku;
    } else {
        return bName === iName;
    }
};

const calculatePromotions = (currentItems, allPromotions) => {
    let totalDiscount = 0;
    let newFreeItems = [];
    let appliedNames = [];
    
    const cleanItems = currentItems.filter(it => !it.desc.startsWith('[แถมฟรี]'));
    const subtotal = cleanItems.reduce((sum, it) => sum + (Number(it.price || it.sellPrice || it.buyPrice || 0) * Number(it.qty || 0)), 0);

    allPromotions.filter(p => p.isActive).forEach(promo => {
        if (promo.type === 'threshold_discount' || promo.type === 'shopee_voucher') {
            if (subtotal >= Number(promo.minAmount)) {
                totalDiscount += Number(promo.discountAmount);
                appliedNames.push(promo.name);
            }
        } 
        else if (promo.type === 'percentage_discount' || (promo.type === 'shopee_bundle' && promo.bundleType === 'percentage')) {
            let threshold = promo.type === 'shopee_bundle' ? (Number(promo.minQty) || 1) : Number(promo.minAmount);
            let meetsCondition = false;
            
            if (promo.type === 'shopee_bundle') {
                const totalQty = cleanItems.reduce((q, it) => q + Number(it.qty), 0);
                meetsCondition = totalQty >= threshold;
            } else {
                meetsCondition = subtotal >= threshold;
            }

            if (meetsCondition) {
                totalDiscount += (subtotal * Number(promo.discountPercentage)) / 100;
                appliedNames.push(promo.name);
            }
        } 
        else if (promo.type === 'shopee_bundle' && promo.bundleType === 'amount') {
            const totalQty = cleanItems.reduce((q, it) => q + Number(it.qty), 0);
            if (totalQty >= Number(promo.minQty)) {
                totalDiscount += Number(promo.discountAmount);
                appliedNames.push(promo.name);
            }
        }
        else if (promo.type === 'buy_x_get_y' || promo.type === 'shopee_addon') {
            const targetSku = promo.type === 'shopee_addon' ? promo.addonMainSku : promo.targetSku;
            const targetItem = cleanItems.find(it => (it.sku && it.sku !== '-' && it.sku === targetSku) || it.desc === targetSku);
            
            if (targetItem && Number(targetItem.qty) >= (Number(promo.minQty) || 1)) {
                const multiplier = Math.floor(Number(targetItem.qty) / (Number(promo.minQty) || 1));
                if (multiplier > 0) {
                    if (promo.type === 'buy_x_get_y') {
                        newFreeItems.push({
                            desc: `[แถมฟรี] ${promo.freeSku}`, sku: promo.freeSku, qty: multiplier * Number(promo.freeQty),
                            price: 0, sellPrice: 0, buyPrice: 0, unit: 'ชิ้น'
                        });
                        appliedNames.push(promo.name);
                    } else if (promo.type === 'shopee_addon') {
                        appliedNames.push(`Add-on: ${promo.name}`);
                    }
                }
            }
        }
    });

    return { totalDiscount, newFreeItems, appliedNames: [...new Set(appliedNames)] };
};

const callGeminiAPI = async (prompt, isJson = true, imageBase64 = null) => {
    const userApiKey = localStorage.getItem('gemini_api_key');
    let url = "";
    
    if (userApiKey && userApiKey.trim() !== "") {
        const customKey = userApiKey.trim();
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${customKey}`;
    } else {
        const apiKey = "";
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    }

    const parts = [{ text: prompt }];
    
    if (imageBase64) {
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        const mimeType = imageBase64.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
        parts.push({ inlineData: { mimeType, data: base64Data } });
    }
    
    const payload = { contents: [{ role: "user", parts }] };
    if (isJson) payload.generationConfig = { responseMimeType: "application/json" };
    
    let delay = 1000;
    for (let i = 0; i < 5; i++) {
        try {
            const res = await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const data = await res.json();
            let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (isJson) {
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(text);
            }
            return text;
        } catch (e) {
            if (i === 4) throw e;
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
        }
    }
};

const decryptPdfFallback = async (arrayBuffer, password) => {
    if (!window.pdfjsLib) {
        await new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            s.onload = resolve; document.head.appendChild(s);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
    if (!window.jspdf) {
        await new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
            s.onload = resolve; document.head.appendChild(s);
        });
    }

    const typedarray = new Uint8Array(arrayBuffer);
    const loadingTask = window.pdfjsLib.getDocument({ data: typedarray, password: password });
    const pdf = await loadingTask.promise;
    
    const pdfDoc = new window.jspdf.jsPDF('p', 'mm', 'a4');
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (pageNum > 1) pdfDoc.addPage();
        
        const pdfWidth = pdfDoc.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdfDoc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }
    
    const pdfBase64 = pdfDoc.output('datauristring');
    return pdfBase64.split(',')[1];
};

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

function TaxGuide() {
    const iconProps = { size: 28 };
    
    const colors = {
        rose: "text-rose-600 bg-rose-50 border-rose-100 shadow-rose-100",
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100",
        purple: "text-purple-600 bg-purple-50 border-purple-100 shadow-purple-100",
        teal: "text-teal-600 bg-teal-50 border-teal-100 shadow-teal-100",
        blue: "text-blue-600 bg-blue-50 border-blue-100 shadow-blue-100",
        orange: "text-orange-600 bg-orange-50 border-orange-100 shadow-orange-100",
        pink: "text-pink-600 bg-pink-50 border-pink-100 shadow-pink-100"
    };

    const textColors = {
        rose: "text-rose-600",
        indigo: "text-indigo-600",
        amber: "text-amber-600",
        emerald: "text-emerald-600",
        purple: "text-purple-600",
        teal: "text-teal-600",
        blue: "text-blue-600",
        orange: "text-orange-600",
        pink: "text-pink-600"
    };

    const tips = [
        {
            title: "การจัดแฟ้มเอกสารบัญชี (Filing)",
            icon: <Briefcase {...iconProps}/>,
            color: "orange",
            content: "การจัดเอกสารให้ตรงตามหลักบัญชี ควรแยกเป็น 4 แฟ้มหลักเพื่อความง่ายในการตรวจสอบ:\n\n1. แฟ้มรายได้: ใบกำกับภาษีขาย/บิลขาย (เรียงตามเลขที่), รายงานยอดขาย Shopee\n2. แฟ้มต้นทุนสินค้า: บิลซื้อของมาขาย, ค่าแพ็กเกจจิ้ง (กล่อง/เทป), ค่าน้ำมัน(เฉพาะขาไปรับของ)\n3. แฟ้มค่าใช้จ่าย: ค่าธรรมเนียม, โฆษณา, ค่าน้ำไฟ, เงินเดือน, ค่าน้ำมัน(วิ่งไปส่งของ/บริหาร)\n4. แฟ้มภาษี: แบบ ภ.พ.30, ใบหัก ณ ที่จ่าย (50 ทวิ)\n\n💡 ทริค: บิลรายจ่ายทุกใบ ควรเย็บแม็กติดกับ 'สลิปโอนเงิน' เสมอ เพื่อเป็นหลักฐานว่าจ่ายจริง"
        },
        {
            title: "บิลที่มี 'ของใช้ส่วนตัว' ปนมาด้วย",
            icon: <FileMinus {...iconProps}/>,
            color: "pink",
            content: "กรณีไปซื้อของเข้าร้าน แล้วเผลอหยิบของส่วนตัวรวมในบิลใบกำกับภาษีเดียวกัน (Mixed Receipt)\n\n✅ วิธีที่ถูกต้อง: สรรพากรห้ามนำของส่วนตัวมาเคลมภาษีเด็ดขาด!\n1. ให้เอาปากกา 'ขีดฆ่า' รายการของส่วนตัวทิ้งในบิลกระดาษ\n2. กดเครื่องคิดเลขบวกเฉพาะยอดเงินของ 'สินค้าที่ใช้ในร้านจริงๆ'\n3. นำยอดใหม่ที่บวกได้มากรอกลงแอป MerchantTax (ไม่ต้องสนใจยอดรวมท้ายบิลกระดาษ) เพื่อให้ระบบคำนวณ VAT ซื้อเฉพาะส่วนที่เคลมได้จริง"
        },
        {
            title: "การยกเลิกเอกสาร (ห้ามลบทิ้งถาวร)",
            icon: <Trash2 {...iconProps}/>,
            color: "rose",
            content: "ตามหลักสรรพากร การลบเอกสารทิ้งถาวรจะทำให้เกิดปัญหา 'เลขเอกสารฟันหลอ' (Missing Sequence) ซึ่งเป็นจุดที่มักถูกสรรพากรเพ่งเล็ง\n\n✅ วิธีที่ถูกต้อง: ให้ใช้ปุ่ม 'ยกเลิกรายการ (❌)' ที่หน้าประวัติแทน ระบบจะคงเลขเอกสารนั้นไว้ ทำการขีดฆ่า และดึงยอดสต็อกกลับเข้าคลังให้อัตโนมัติ เพื่อให้ตรวจสอบที่มาที่ไปได้เสมอ"
        },
        {
            title: "บันทึกตัดสต็อกผิดรุ่น/ผิดรสชาติ",
            icon: <ArrowRightLeft {...iconProps}/>,
            color: "indigo",
            content: "หากลูกค้าสั่งรสมินต์ แต่คุณเผลอตัดสต็อกรสสตรอว์เบอร์รี ไม่จำเป็นต้องกลับไปไล่ลบหรือแก้ไขบิลเก่าให้เหนื่อยและเสี่ยงข้อมูลรวน\n\n✅ วิธีที่ถูกต้อง: ไปที่เมนู 'คลังสินค้า FIFO' > กดปุ่ม '⇄ ปรับปรุงสต็อก' ที่ท้ายสินค้า > เลือกแท็บ '⇄ สลับ/โอนย้าย' > เลือกจำนวนและระบุสินค้าปลายทางที่ต้องการสลับยอด ระบบจะปรับสต็อกให้ตรง 100% ทันทีโดยไม่กระทบกำไรขาดทุน"
        },
        {
            title: "เปลี่ยนไซส์/แพ็คสินค้า (Repacking)",
            icon: <Package {...iconProps}/>,
            color: "amber",
            content: "กรณีของไซส์ใหญ่หมด แล้วต้องหยิบไซส์เล็กหลายชิ้นส่งไปแทนเพื่อให้ปริมาณเท่าเดิม (เช่น สั่ง 500g 1 ถุง แต่ส่ง 150g 4 ถุง)\n\n✅ วิธีที่ 1: เข้าไปกด 👁️ แก้ไข 'รายการสินค้าในบิลขายใบนั้น' ให้ตรงกับของที่ส่งจริง (สต็อกจะตัดเป๊ะ)\n✅ วิธีที่ 2: หากไม่อยากแก้บิล ให้ไปที่ 'คลังสินค้า FIFO' > กดปรับปรุงสต็อก 2 รอบ (กด '+ เพิ่มสต็อก' ไซส์ใหญ่กลับมา และ กด '- ลบสต็อก' ไซส์เล็กออกไปตามที่ส่งจริง)"
        },
        {
            title: "ค่าน้ำมันรถ สำหรับซื้อของ/ส่งของ",
            icon: <TruckIcon {...iconProps}/>,
            color: "emerald",
            content: "บิลค่าน้ำมันถือเป็นต้นทุนในการบริหารกิจการ แต่ในแง่ของภาษีมูลค่าเพิ่ม (VAT) มีกฎหมายข้อห้ามเฉพาะเอาไว้\n\n⚠️ ข้อควรระวัง: หากรถที่ใช้เป็น 'รถยนต์นั่งส่วนบุคคล' (รถเก๋ง หรือ รถกระบะ 4 ประตู) ภาษีซื้อจากบิลค่าน้ำมันจะไม่สามารถขอคืนได้! ตอนบันทึก ให้เลือกประเภท 'รวม/แยก VAT' ตามบิล แต่ต้องติ๊ก ✅ 'ภาษีซื้อต้องห้าม' เสมอ เพื่อป้องกันสรรพากรประเมินเบี้ยปรับ"
        },
        {
            title: "ค่าอาหารเลี้ยงทีมงาน/สังสรรค์",
            icon: <Users {...iconProps}/>,
            color: "purple",
            content: "การเลี้ยงอาหารพนักงานสามารถนำมาหักเป็นค่าใช้จ่ายของกิจการได้ (เลือกลงหมวด: 'ค่าใช้จ่ายทั่วไป' หรือสวัสดิการ) เพื่อลดหย่อนภาษีเงินได้กำไรสุทธิประจำปี\n\n⚠️ ข้อควรระวัง: ตามกฎหมาย ค่าอาหารและเครื่องดื่มเพื่อการสังสรรค์/เลี้ยงรับรอง ถือเป็น 'ภาษีซื้อต้องห้าม' เด็ดขาด (แม้จะได้ใบกำกับภาษีเต็มรูปมาก็ตาม) ดังนั้นตอนบันทึกบิลนี้ ต้องติ๊ก ✅ 'ภาษีซื้อต้องห้าม' เสมอ"
        },
        {
            title: "การปรับปรุงค่าส่ง/ค่าธรรมเนียมย้อนหลัง",
            icon: <RefreshCw {...iconProps}/>,
            color: "blue",
            content: "เมื่อถูก Platform เรียกเก็บค่าส่งเพิ่ม หรือคืนเงินให้ย้อนหลัง ข้ามเดือนมาแล้ว \n\n✅ วิธีที่ถูกต้อง: ห้ามกลับไปแก้บิลขายเดิม! แต่ให้บันทึกเป็นรายการใหม่ในวันที่เกิดรายการจริง\n- หากถูกเก็บเพิ่ม: ลงเป็น 'รายจ่าย' (หมวดค่าจัดส่ง/ค่าธรรมเนียม) พร้อมระบุอ้างอิง Order ID\n- หากได้เงินคืน: ลงเป็น 'รายรับ' (หมวดรายได้อื่นๆ) พร้อมระบุอ้างอิง Order ID"
        },
        {
            title: "บิลเงินสด / บิลที่ไม่มี VAT",
            icon: <Receipt {...iconProps}/>,
            color: "teal",
            content: "สำหรับการซื้อของจากร้านทั่วไป หรือบิลที่เขียนด้วยมือ ซึ่งไม่มีรูปแบบเป็นใบกำกับภาษีเต็มรูปที่ถูกต้อง\n\n✅ วิธีที่ถูกต้อง: ในหน้า 'บันทึกรายจ่าย' ให้ติ๊กทำเครื่องหมายที่ช่อง ✅ 'บิลเงินสด' ระบบจะทำการปิดช่องกรอกเลขใบกำกับ และบังคับเลือกประเภทภาษีเป็น 'ไม่มี VAT' ให้อัตโนมัติ เพื่อป้องกันการเผลอนำยอดไปยื่นขอคืนภาษีซื้อ"
        }
    ];

    return (
        <div className="space-y-6 animate-fadeIn font-sarabun text-left w-full h-full pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b pb-4 gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2"><BookOpen className="text-indigo-600"/> คู่มือ & เคล็ดลับภาษี</h2>
                    <p className="text-sm text-slate-400 font-medium">รวมข้อควรระวังและวิธีลงบัญชีที่ถูกต้อง (ตามมาตรฐานกรมสรรพากร)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {tips.map((tip, idx) => (
                    <div key={idx} className={`bg-white rounded-3xl p-6 border shadow-sm hover:shadow-lg transition-all relative overflow-hidden group border-slate-100 hover:border-${tip.color}-200`}>
                        <div className={`absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity ${textColors[tip.color]}`}>
                            {React.cloneElement(tip.icon, { size: 120 })}
                        </div>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border shadow-sm ${colors[tip.color]}`}>
                            {tip.icon}
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-3 leading-tight">{tip.title}</h3>
                        <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                            {tip.content}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 md:p-8 rounded-[32px] border border-indigo-100 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                <div className="p-4 bg-white rounded-full text-amber-500 shadow-md shrink-0">
                    <Lightbulb size={40}/>
                </div>
                <div>
                    <h4 className="text-lg font-black text-indigo-900 mb-2">ทำไมระบบบัญชีที่ดีถึงสำคัญ?</h4>
                    <p className="text-sm text-indigo-800/80 leading-relaxed font-medium">
                        การจัดการสต็อกและการลงรายการรายรับ-รายจ่ายที่ถูกต้องตั้งแต่ต้น จะช่วยป้องกันการถูกประเมินภาษีและเบี้ยปรับย้อนหลังจามกรมสรรพากร 
                        และที่สำคัญที่สุดคือ ทำให้เราเห็น <b>"กำไรสุทธิ (Net Profit)"</b> ที่แท้จริงของธุรกิจ 
                        <br/>ระบบ MerchantTax ถูกออกแบบมาเพื่อเป็นเครื่องมือกั้นข้อผิดพลาดเหล่านี้ และช่วยให้ผู้ประกอบการทำงานได้ง่ายและปลอดภัยที่สุดครับ
                    </p>
                </div>
            </div>
        </div>
    );
}

function Dashboard({ transactions, invoices, stockBatches, showToast }) {
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedShop, setSelectedShop] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [dashTab, setDashTab] = useState('performance');
  const [aiSummary, setAiSummary] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
      setAiSummary(null);
  }, [dashTab, selectedChannel, selectedShop, selectedMonth]);

  const analytics = useMemo(() => {
    let perfSales = 0;
    let perfCogs = 0;
    let perfFees = 0;
    let perfExp = 0;

    let cashSettled = 0;
    let cashPending = 0;
    let cashExp = 0;
    let cashShipping = 0;
    let cashFees = 0;
    let cashCogs = 0; 
    let cashGrossSales = 0; 

    transactions.forEach(t => {
        if (t.isFromReconciliation && t.category !== 'ค่าธรรมเนียม Platform') return; 
        
        if (selectedChannel !== 'all' && (t.channel || 'หน้าร้าน').toUpperCase() !== selectedChannel.toUpperCase()) return;
        if (selectedShop !== 'all' && String(t.shopName || 'ไม่ระบุ').toLowerCase() !== String(selectedShop).toLowerCase()) return;

        const orderD = normalizeDate(t.date);
        const settleD = t.settlementDate ? normalizeDate(t.settlementDate) : (t.paymentStatus === 'settled' || t.status === 'paid' ? orderD : null);

        let matchOrderMonth = true;
        let matchSettleMonth = true;

        if (selectedMonth !== 'all') {
            const oMonth = orderD ? `${orderD.getFullYear()}-${String(orderD.getMonth() + 1).padStart(2, '0')}` : '';
            matchOrderMonth = oMonth === selectedMonth;

            const sMonth = settleD ? `${settleD.getFullYear()}-${String(settleD.getMonth() + 1).padStart(2, '0')}` : '';
            matchSettleMonth = sMonth === selectedMonth;
        }

        if (t.type === 'income') {
            const fee = Number(t.platformFee) || 0;
            const ship = Number(t.shippingFee) || 0;
            
            if (!t.isCancelled) {
                const expectedAmt = t.grandTotal || t.total;
                const settledAmt = t.actualSettledAmt !== undefined ? t.actualSettledAmt : expectedAmt;
                
                const cogs = (t.items || []).reduce((itemSum, item) => {
                    const batch = stockBatches.find(b => matchItemToBatch(item.sku, item.desc, b.sku, b.productName));
                    return itemSum + (Number(item.qty) * Number(batch?.costPerUnit || 0));
                }, 0);

                if (matchOrderMonth) {
                    perfSales += expectedAmt;
                    perfFees += fee;
                    perfCogs += cogs;
                }

                if (matchSettleMonth && (t.paymentStatus === 'settled' || t.status === 'paid')) {
                    cashSettled += settledAmt;
                    cashShipping += ship;
                    cashFees += fee;
                    cashCogs += cogs; 
                    cashGrossSales += Math.max(0, (Number(t.total) || 0) - (Number(t.refundAmount) || 0)); 
                }
            } else {
                if (matchOrderMonth && fee > 0) {
                    perfFees += fee;
                    perfExp += fee; 
                }
                
                const cancelSettleD = t.settlementDate ? normalizeDate(t.settlementDate) : (t.cancelledAt ? normalizeDate(t.cancelledAt) : orderD);
                let matchCancelSettleMonth = true;
                if (selectedMonth !== 'all') {
                    const cMonth = cancelSettleD ? `${cancelSettleD.getFullYear()}-${String(cancelSettleD.getMonth() + 1).padStart(2, '0')}` : '';
                    matchCancelSettleMonth = cMonth === selectedMonth;
                }
                
                if (matchCancelSettleMonth && fee > 0) {
                    cashFees += fee; 
                    cashExp += fee; 
                }
            }
        } else if (t.type === 'expense') {
            if (!t.isCancelled) {
                const amt = Number(t.total) || 0;
                if (matchOrderMonth) {
                    perfExp += amt;
                    if (t.category === 'ค่าธรรมเนียม Platform') perfFees += amt;
                }
                if (matchSettleMonth && t.status === 'paid') {
                    cashExp += amt;
                    if (t.category === 'ค่าธรรมเนียม Platform') cashFees += amt;
                }
            }
        }
    });

    transactions.forEach(t => {
         if (t.isCancelled || t.isFromReconciliation) return;
         if (selectedChannel !== 'all' && (t.channel || 'หน้าร้าน').toUpperCase() !== selectedChannel.toUpperCase()) return;
         if (selectedShop !== 'all' && String(t.shopName || 'ไม่ระบุ').toLowerCase() !== String(selectedShop).toLowerCase()) return;
         
         if (t.type === 'income' && t.paymentStatus === 'pending_platform') {
             cashPending += (t.actualSettledAmt !== undefined ? t.actualSettledAmt : (t.grandTotal || t.total));
         }
    });
    
    const supplierDebt = stockBatches
        .filter(b => b.paymentStatus === 'credit')
        .reduce((sum, b) => sum + (Number(b.quantity) * Number(b.costPerUnit)), 0);

    return { 
        perf: { sales: perfSales, cogs: perfCogs, fees: perfFees, expense: perfExp, netProfit: perfSales - perfCogs - perfExp },
        cash: { settled: cashSettled, pending: cashPending, expense: cashExp, netCash: cashSettled - cashExp, shipping: cashShipping, fees: cashFees, supplierDebt, cogs: cashCogs, grossSales: cashGrossSales }
    };
  }, [transactions, stockBatches, selectedChannel, selectedShop, selectedMonth]);

  const monthlyStats = useMemo(() => {
    const mData = {};
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
        mData[key] = { name: key, perfSales: 0, perfExp: 0, perfNet: 0, cashIn: 0, cashOut: 0, cashNet: 0 };
    }
    
    transactions.forEach(t => {
        if (t.isFromReconciliation && t.category !== 'ค่าธรรมเนียม Platform') return; 
        
        if (selectedChannel !== 'all' && (t.channel || 'หน้าร้าน').toUpperCase() !== selectedChannel.toUpperCase()) return;
        if (selectedShop !== 'all' && String(t.shopName || 'ไม่ระบุ').toLowerCase() !== String(selectedShop).toLowerCase()) return;
        
        const orderD = normalizeDate(t.date);
        const settleD = t.settlementDate ? normalizeDate(t.settlementDate) : (t.paymentStatus === 'settled' || t.status === 'paid' ? orderD : null);

        const oKey = orderD ? orderD.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }) : null;
        const sKey = settleD ? settleD.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }) : null;

        if (t.type === 'income') {
            const fee = Number(t.platformFee) || 0;
            
            if (!t.isCancelled) {
                const expectedAmt = t.grandTotal || t.total;
                const settledAmt = t.actualSettledAmt !== undefined ? t.actualSettledAmt : expectedAmt;
                
                const cogs = (t.items || []).reduce((sum, item) => {
                    const batch = stockBatches.find(b => matchItemToBatch(item.sku, item.desc, b.sku, b.productName));
                    return sum + (Number(item.qty) * Number(batch?.costPerUnit || 0));
                }, 0);

                if (oKey && mData[oKey]) {
                    mData[oKey].perfSales += expectedAmt;
                    mData[oKey].perfNet += (expectedAmt - cogs);
                }
                
                if (sKey && mData[sKey] && (t.paymentStatus === 'settled' || t.status === 'paid')) {
                    mData[sKey].cashIn += settledAmt;
                }
            } else {
                if (fee > 0) {
                    if (oKey && mData[oKey]) {
                        mData[oKey].perfExp += fee;
                        mData[oKey].perfNet -= fee;
                    }
                    
                    const cancelSettleD = t.settlementDate ? normalizeDate(t.settlementDate) : (t.cancelledAt ? normalizeDate(t.cancelledAt) : orderD);
                    const cKey = cancelSettleD ? cancelSettleD.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }) : null;
                    if (cKey && mData[cKey]) {
                        mData[cKey].cashOut += fee;
                    }
                }
            }
        } else if (t.type === 'expense') {
            if (!t.isCancelled) {
                const amt = Number(t.total) || 0;
                if (oKey && mData[oKey]) {
                    mData[oKey].perfExp += amt;
                    mData[oKey].perfNet -= amt;
                }
                if (sKey && mData[sKey] && t.status === 'paid') {
                    mData[sKey].cashOut += amt;
                }
            }
        }
    });

    Object.values(mData).forEach(m => {
        m.cashNet = m.cashIn - m.cashOut;
    });
    
    const maxPerf = Math.max(...Object.values(mData).map(m => Math.max(m.perfSales, m.perfExp, 1)));
    const maxCash = Math.max(...Object.values(mData).map(m => Math.max(m.cashIn, m.cashOut, 1)));

    return { data: Object.values(mData), maxPerf, maxCash };
  }, [transactions, selectedChannel, selectedShop, stockBatches]);

  const topSellers = useMemo(() => {
    const salesMap = {};
    transactions.filter(t => t.type === 'income' && !t.isCancelled && !t.isFromReconciliation).forEach(t => {
        if (selectedChannel !== 'all' && (t.channel || 'หน้าร้าน').toUpperCase() !== selectedChannel.toUpperCase()) return;
        if (selectedShop !== 'all' && String(t.shopName || 'ไม่ระบุ').toLowerCase() !== String(selectedShop).toLowerCase()) return;
        if (selectedMonth !== 'all') {
            const d = normalizeDate(t.date);
            if (!d) return;
            const tMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (tMonth !== selectedMonth) return;
        }

        (t.items || []).forEach(item => {
            const key = (item.sku && item.sku !== '-') ? item.sku : item.desc;
            if (!salesMap[key]) salesMap[key] = { name: item.desc, sku: item.sku, qty: 0, total: 0 };
            salesMap[key].qty += Number(item.qty);
            salesMap[key].total += (Number(item.qty) * Number(item.sellPrice || item.price || 0));
        });
    });
    return Object.values(salesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [transactions, selectedChannel, selectedShop, selectedMonth]);

  const lowStockItems = useMemo(() => {
    const stockMap = {};
    stockBatches.forEach(b => {
        const key = (b.sku && b.sku !== '-') ? b.sku : b.productName;
        if (!stockMap[key]) stockMap[key] = { name: b.productName, sku: b.sku, remaining: 0 };
        stockMap[key].remaining += (Number(b.quantity) - Number(b.sold || 0));
    });
    return Object.values(stockMap)
      .filter(item => item.remaining < 10)
      .sort((a, b) => a.remaining - b.remaining)
      .slice(0, 5);
  }, [stockBatches]);

  const generateAiSummary = async () => {
      setIsGeneratingAi(true);
      try {
          const prompt = dashTab === 'performance' ? `
          คุณคือผู้บริหารฝ่ายการเงิน (CFO) วิเคราะห์ข้อมูลสรุปยอดขายร้านค้าประจำวัน (อิงตามวันสั่งซื้อ)
          ข้อมูลภาพรวม (ร้านค้า: ${selectedShop === 'all' ? 'ทุกร้าน' : selectedShop}, ช่องทาง: ${selectedChannel === 'all' ? 'ทุกช่องทาง' : selectedChannel}, เดือน: ${selectedMonth === 'all' ? 'ทุกเดือน' : selectedMonth}):
          - ยอดขายรวม: ${analytics.perf.sales} บาท
          - กำไรสุทธิ: ${analytics.perf.netProfit} บาท
          - รายจ่าย: ${analytics.perf.expense} บาท
          - สินค้าขายดี 3 อันดับแรก: ${topSellers.slice(0,3).map(s => s.name).join(', ') || 'ไม่มีข้อมูล'}
          
          ช่วยเขียน Executive Summary สั้นๆ 2-3 ประโยค เป็นภาษาไทย เพื่อรายงานเจ้าของร้านแบบกระชับ อ่านง่าย และให้คำแนะนำ 1 ข้อ
          ตอบกลับเป็นข้อความ JSON format เท่านั้น: { "summary": "ข้อความสรุป..." }
          ` : `
          คุณคือผู้บริหารฝ่ายการเงิน (CFO) วิเคราะห์กระแสเงินสดร้านค้าประจำวัน (อิงตามวันโอนเงิน)
          ข้อมูลภาพรวม (ร้านค้า: ${selectedShop === 'all' ? 'ทุกร้าน' : selectedShop}, ช่องทาง: ${selectedChannel === 'all' ? 'ทุกช่องทาง' : selectedChannel}, เดือน: ${selectedMonth === 'all' ? 'ทุกเดือน' : selectedMonth}):
          - เงินเข้าแล้ว: ${analytics.cash.settled} บาท
          - รอเงินโอนจากแพลตฟอร์ม: ${analytics.cash.pending} บาท
          - รายจ่ายที่จ่ายแล้ว: ${analytics.cash.expense} บาท
          - กระแสเงินสดสุทธิ: ${analytics.cash.netCash} บาท
          
          ช่วยเขียน Executive Summary สั้นๆ 2-3 ประโยค เป็นภาษาไทย สรุปสภาพคล่องทางการเงิน และให้คำแนะนำ 1 ข้อ
          ตอบกลับเป็นข้อความ JSON format เท่านั้น: { "summary": "ข้อความสรุป..." }
          `;
          const res = await callGeminiAPI(prompt, true);
          if (res && res.summary) setAiSummary(res.summary);
      } catch (e) {
          console.error(e);
          if (showToast) showToast("เกิดข้อผิดพลาดในการวิเคราะห์ AI (โปรดตรวจสอบ API Key หรือลองใหม่อีกครั้ง)", "error");
      }
      setIsGeneratingAi(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left font-sarabun w-full">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 text-left">Financial Intelligence</h2>
                <p className="text-xs text-slate-400">วิเคราะห์ผลกำไรสุทธิและสภาพคล่องทางการเงิน</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl shadow-sm border border-slate-100 flex-1 xl:flex-none">
                    <Store size={14} className="text-indigo-600 shrink-0"/>
                    <select 
                        value={selectedShop} 
                        onChange={e => setSelectedShop(e.target.value)} 
                        className="bg-transparent border-0 text-xs font-bold text-slate-800 outline-none cursor-pointer focus:ring-0 p-0 w-full"
                    >
                        <option value="all">ทุกร้านค้า</option>
                        {CONSTANTS.SHOPS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl shadow-sm border border-slate-100 flex-1 xl:flex-none">
                    <Filter size={14} className="text-indigo-600 shrink-0"/>
                    <select 
                        value={selectedChannel} 
                        onChange={e => setSelectedChannel(e.target.value)} 
                        className="bg-transparent border-0 text-xs font-bold text-slate-800 outline-none cursor-pointer focus:ring-0 p-0 w-full"
                    >
                        <option value="all">ทุกช่องทาง</option>
                        {CONSTANTS.CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="IMPORTED">IMPORTED</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl shadow-sm border border-slate-100 flex-1 xl:flex-none">
                    <Calendar size={14} className="text-indigo-600 shrink-0"/>
                    <input 
                        type="month" 
                        value={selectedMonth === 'all' ? '' : selectedMonth} 
                        onChange={e => setSelectedMonth(e.target.value || 'all')} 
                        className="bg-transparent border-0 text-xs font-bold text-slate-800 outline-none cursor-pointer focus:ring-0 p-0 w-full"
                    />
                    {selectedMonth !== 'all' && (
                        <button onClick={() => setSelectedMonth('all')} className="text-slate-400 hover:text-rose-500 shrink-0">
                            <X size={12}/>
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit overflow-x-auto shadow-inner border border-slate-200/50">
            <button onClick={() => setDashTab('performance')} className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${dashTab === 'performance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <TrendingUp size={16}/> ผลประกอบการ (อิงวันสั่งซื้อ)
            </button>
            <button onClick={() => setDashTab('cashflow')} className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${dashTab === 'cashflow' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Wallet size={16}/> กระแสเงินสด (อิงวันรับเงิน)
            </button>
        </div>

        {/* Executive AI Summary Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-800 rounded-[32px] p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <Wand2 size={120} className="absolute -left-10 -bottom-10 opacity-10 text-indigo-400" />
            <div className="flex-1 relative z-10 w-full text-left">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="text-amber-400" size={20} />
                    <h3 className="font-black text-lg text-indigo-100 uppercase tracking-widest">Executive AI Summary</h3>
                </div>
                {aiSummary ? (
                    <p className="text-sm md:text-base leading-relaxed text-indigo-50 font-medium whitespace-pre-line">{aiSummary}</p>
                ) : (
                    <p className="text-sm text-slate-400">ให้ AI สรุป{dashTab === 'performance' ? 'ผลประกอบการ' : 'สภาพคล่องทางการเงิน'}และให้คำแนะนำประจำวันจาก Data จริงของคุณ</p>
                )}
            </div>
            <button onClick={generateAiSummary} disabled={isGeneratingAi} className="relative z-10 shrink-0 w-full md:w-auto bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isGeneratingAi ? <Loader size={18} className="animate-spin" /> : <Activity size={18} />}
                {isGeneratingAi ? 'กำลังวิเคราะห์ข้อมูล...' : 'วิเคราะห์ภาพรวมธุรกิจ'}
            </button>
        </div>

        {/* --------------------- PERFORMANCE TAB (อิงวันสั่งซื้อ) --------------------- */}
        {dashTab === 'performance' && (
            <div className="space-y-6 animate-fadeIn">
                <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl flex gap-3 items-start shadow-sm">
                    <Info className="text-indigo-500 shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="text-sm font-black text-indigo-800">วิธีการคำนวณ: เกณฑ์สิทธิ์ (Accrual Basis)</p>
                        <p className="text-xs text-indigo-600/80 mt-1 leading-relaxed font-medium">
                            คำนวณรายรับและรายจ่ายโดยยึดตาม <b>"วันที่ลูกค้ากดสั่งซื้อ"</b> (Order Date) หรือวันที่เกิดรายการจริง <br/>
                            เพื่อวัดผล <b>ยอดขายและกำไรสุทธิที่แท้จริง</b> ของเดือนนั้นๆ แม้แพลตฟอร์มจะยังไม่โอนเงินเข้าบัญชีก็ตาม
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                    <StatCard title="ยอดขายรวม (Sales)" value={analytics.perf.sales} color="indigo" icon={<TrendingUp />} subtitle="รายรับรวมตามวันที่ลูกค้าสั่งซื้อ" />
                    <StatCard title="รายจ่าย (Expense)" value={analytics.perf.expense} color="rose" icon={<TrendingDown />} subtitle="ค่าใช้จ่ายตามวันที่เกิดรายการ" />
                    <StatCard title="กำไรสุทธิ (Net Profit)" value={analytics.perf.netProfit} color="emerald" icon={<ProfitIcon />} subtitle="หักต้นทุนและค่าธรรมเนียมแพลตฟอร์ม" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col w-full">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart2 className="text-indigo-600"/> กราฟผลประกอบการ (Sales vs Expense)</h3>
                        <div className="flex-1 flex flex-col justify-end text-slate-300 w-full mt-4 min-h-[250px]">
                            <div className="flex h-48 items-end gap-2 w-full">
                                {monthlyStats.data.map((m, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div className="flex w-full items-end justify-center gap-1 h-full relative">
                                             <div className="w-1/3 bg-indigo-500 rounded-t-md relative group-hover:bg-indigo-400 transition-colors cursor-pointer" style={{ height: `${(m.perfSales / monthlyStats.maxPerf) * 100}%`, minHeight: '4px' }}>
                                                 <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 px-1.5 py-0.5 rounded shadow-sm z-10">{formatCurrency(m.perfSales)}</span>
                                             </div>
                                             <div className="w-1/3 bg-rose-400 rounded-t-md relative group-hover:bg-rose-300 transition-colors cursor-pointer" style={{ height: `${(m.perfExp / monthlyStats.maxPerf) * 100}%`, minHeight: '4px' }}>
                                                 <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 px-1.5 py-0.5 rounded shadow-sm z-10">{formatCurrency(m.perfExp)}</span>
                                             </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">{m.name}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center gap-4 mt-6 border-t border-slate-100 pt-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-3 h-3 rounded bg-indigo-500"></span> ยอดขายรวม (Sales)</div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-3 h-3 rounded bg-rose-400"></span> รายจ่าย (Expense)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col w-full h-full">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Star className="text-amber-500 fill-amber-500"/> สินค้ายอดฮิต (Top Sellers)</h3>
                        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                            {topSellers.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">{idx + 1}</div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-black text-indigo-600">{item.qty.toLocaleString()} <span className="text-[10px] text-slate-500">ชิ้น</span></p>
                                    </div>
                                </div>
                            ))}
                            {topSellers.length === 0 && <div className="h-full flex items-center justify-center"><p className="text-sm text-slate-400">ยังไม่มีข้อมูลการขาย</p></div>}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 w-full">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Calendar className="text-indigo-600"/> สรุปผลประกอบการรายเดือนย้อนหลัง (Performance Summary)</h3>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                                <tr>
                                    <th className="p-4 rounded-tl-2xl border-b border-slate-100">เดือน (Month)</th>
                                    <th className="p-4 text-right border-b border-slate-100 text-indigo-600">ยอดขายรวม (Sales)</th>
                                    <th className="p-4 text-right border-b border-slate-100 text-rose-500">รายจ่าย (Expense)</th>
                                    <th className="p-4 text-right rounded-tr-2xl border-b border-slate-100 text-emerald-600">กำไรสุทธิ (Net Profit)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[...monthlyStats.data].reverse().map((m, i) => (
                                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="p-4 font-bold text-slate-700">{m.name}</td>
                                        <td className="p-4 text-right font-black text-indigo-600">{formatCurrency(m.perfSales)}</td>
                                        <td className="p-4 text-right font-bold text-rose-500">{formatCurrency(m.perfExp)}</td>
                                        <td className="p-4 text-right font-black">
                                            <span className={m.perfNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                {m.perfNet > 0 ? '+' : ''}{formatCurrency(m.perfNet)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* --------------------- CASH FLOW TAB (อิงวันรับเงิน) --------------------- */}
        {dashTab === 'cashflow' && (
            <div className="space-y-6 animate-fadeIn">
                <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl flex gap-3 items-start shadow-sm">
                    <Info className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="text-sm font-black text-emerald-800">วิธีการคำนวณ: เกณฑ์เงินสด (Cash Basis)</p>
                        <p className="text-xs text-emerald-600/80 mt-1 leading-relaxed font-medium">
                            คำนวณเฉพาะเงินที่เข้า-ออกบัญชีจริง โดยยึดตาม <b>"วันที่เงินโอนสำเร็จ"</b> (Settlement Date) <br/>
                            เพื่อดู <b>สภาพคล่องทางการเงิน (Cash Flow)</b> ใช้เทียบยอดกับ Statement ธนาคาร และประเมินฐานภาษีที่ต้องยื่น
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
                    <StatCard title="เงินเข้าแล้ว (Settled)" value={analytics.cash.settled} color="emerald" icon={<Wallet />} subtitle="โอนเข้าบัญชีเรียบร้อยแล้ว" />
                    <StatCard title="รอเงินโอน (Pending)" value={analytics.cash.pending} color="amber" icon={<Clock />} subtitle="ยอดค้างรับรวมจาก Platform" />
                    <StatCard title="จ่ายออกแล้ว (Cash Out)" value={analytics.cash.expense} color="rose" icon={<TrendingDown />} subtitle="รายจ่ายที่ชำระเงินแล้ว" />
                    <StatCard title="กระแสเงินสดสุทธิ (Net Cash)" value={analytics.cash.netCash} color="indigo" icon={<ProfitIcon />} subtitle="เงินเข้า หัก เงินออก" />
                </div>

                {/* NEW: แถบแสดงข้อมูลอ้างอิง (ต้นทุนสินค้าที่แฝงอยู่ในเงินที่รับเข้า) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full shadow-sm">
                    <div className="flex items-start md:items-center gap-3">
                        <div className="p-2 bg-slate-200 rounded-xl text-slate-500 shrink-0"><Box size={20}/></div>
                        <div>
                            <p className="text-sm font-black text-slate-700">ต้นทุนสินค้าของยอดเงินที่เข้าแล้ว (Settled COGS)</p>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">ตัวเลขสำหรับใช้อ้างอิง (ไม่นำไปหักลบกับยอด Net Cash เพื่อไม่ให้นับรายจ่ายซ้ำซ้อนกับบิลตอนซื้อของเข้า)</p>
                        </div>
                    </div>
                    <div className="text-left md:text-right w-full md:w-auto">
                        <p className="text-xl font-black text-slate-700">{formatCurrency(analytics.cash.cogs)}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Reference Only</p>
                    </div>
                </div>

                {/* Taxable Income Calculation Section */}
                <div className="bg-indigo-50/80 border border-indigo-100 rounded-[32px] p-6 md:p-8 flex flex-col xl:flex-row gap-6 items-center justify-between shadow-sm w-full">
                    <div className="flex flex-col gap-2 w-full xl:w-1/5 shrink-0">
                        <div className="w-12 h-12 bg-white rounded-2xl text-indigo-600 shadow-sm flex items-center justify-center mb-2"><Calculator size={24}/></div>
                        <h3 className="text-xl font-black text-indigo-900">ฐานภาษีรายได้<br/>(Taxable Income)</h3>
                        <p className="text-[10px] text-indigo-600/70 font-medium leading-relaxed">สรุปยอดประเมินรายได้เพื่อยื่นภาษีตามหลักสรรพากร (อิงตามบิลที่รับเงินแล้ว)</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-4/5 flex-wrap lg:flex-nowrap">
                        <div className="bg-white p-4 lg:p-5 rounded-[24px] shadow-sm border border-slate-100 flex-1 w-full relative">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ยอดขาย (ก่อนหักธรรมเนียม)</p>
                            <p className="text-lg lg:text-xl font-black text-slate-800">{formatCurrency(analytics.cash.grossSales)}</p>
                            <p className="text-[9px] text-slate-400 mt-1">ยอดขายสินค้าสุทธิ</p>
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center z-10 hidden sm:flex"><Plus size={12} className="text-indigo-600"/></div>
                        </div>
                        
                        <div className="bg-white p-4 lg:p-5 rounded-[24px] shadow-sm border border-slate-100 flex-1 w-full relative">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ค่าจัดส่ง (ลูกค้าจ่าย)</p>
                            <p className="text-lg lg:text-xl font-black text-slate-800">{formatCurrency(analytics.cash.shipping)}</p>
                            <p className="text-[9px] text-slate-400 mt-1">รวมในฐานภาษีรายได้</p>
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center z-10 hidden sm:flex"><ArrowRight size={12} className="text-white"/></div>
                        </div>
                        
                        <div className="bg-indigo-600 p-4 lg:p-5 rounded-[24px] shadow-md border border-indigo-500 flex-[1.2] w-full text-white transform sm:scale-105 origin-center z-10">
                            <p className="text-[10px] font-bold text-indigo-200 uppercase mb-1">ยอดประเมินเสียภาษีรวม</p>
                            <p className="text-xl lg:text-2xl font-black">{formatCurrency(analytics.cash.grossSales + analytics.cash.shipping)}</p>
                            <p className="text-[9px] text-indigo-300 mt-1 flex items-center gap-1"><Info size={10}/> นำยอดนี้ไปคำนวณภาษี</p>
                        </div>

                        <div className="bg-rose-50 p-4 lg:p-5 rounded-[24px] shadow-sm border border-rose-100 flex-1 w-full relative ml-0 lg:ml-2">
                            <p className="text-[10px] font-bold text-rose-400 uppercase mb-1">ค่าธรรมเนียม Platform</p>
                            <p className="text-lg lg:text-xl font-black text-rose-600">{formatCurrency(analytics.cash.fees)}</p>
                            <p className="text-[9px] text-rose-500 mt-1 flex items-center gap-1"><AlertTriangle size={10}/> แยกนำไปลงเป็นรายจ่ายทีหลัง</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col min-h-[350px] w-full">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart2 className="text-emerald-600"/> กราฟกระแสเงินสด (Cash In vs Cash Out)</h3>
                        <div className="flex-1 flex flex-col justify-end text-slate-300 w-full mt-4 min-h-[250px]">
                            <div className="flex h-48 items-end gap-2 w-full">
                                {monthlyStats.data.map((m, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div className="flex w-full items-end justify-center gap-1 h-full relative">
                                             <div className="w-1/3 bg-emerald-500 rounded-t-md relative group-hover:bg-emerald-400 transition-colors cursor-pointer" style={{ height: `${(m.cashIn / monthlyStats.maxCash) * 100}%`, minHeight: '4px' }}>
                                                 <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 px-1.5 py-0.5 rounded shadow-sm z-10">{formatCurrency(m.cashIn)}</span>
                                             </div>
                                             <div className="w-1/3 bg-rose-400 rounded-t-md relative group-hover:bg-rose-300 transition-colors cursor-pointer" style={{ height: `${(m.cashOut / monthlyStats.maxCash) * 100}%`, minHeight: '4px' }}>
                                                 <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 px-1.5 py-0.5 rounded shadow-sm z-10">{formatCurrency(m.cashOut)}</span>
                                             </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">{m.name}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center gap-4 mt-6 border-t border-slate-100 pt-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-3 h-3 rounded bg-emerald-500"></span> เงินเข้าแล้ว (Cash In)</div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-3 h-3 rounded bg-rose-400"></span> จ่ายแล้ว (Cash Out)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-900 p-8 rounded-[40px] shadow-xl text-white flex flex-col justify-between w-full h-full">
                        <div>
                            <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-1"><AlertTriangle size={14}/> Liquidity Alert</h4>
                            <p className="text-sm font-bold mb-6">สรุปสถานะความเสี่ยงสภาพคล่อง</p>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs opacity-60">เงินค้างในระบบ (Pending):</span>
                                    <span className="text-sm font-black text-indigo-400">{formatCurrency(analytics.cash.pending)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs opacity-60">หนี้ค้างชำระเจ้าหนี้ (Credit):</span>
                                    <span className="text-sm font-black text-amber-400">{formatCurrency(analytics.cash.supplierDebt)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs opacity-60">สินค้าใกล้หมด (SKUs):</span>
                                    <span className="text-sm font-black text-rose-400">
                                        {lowStockItems.length > 0 ? lowStockItems.length : 0} รายการ
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

                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 w-full mt-6">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Wallet className="text-emerald-600"/> สรุปกระแสเงินสดรายเดือนย้อนหลัง (Cash Flow Summary)</h3>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                                <tr>
                                    <th className="p-4 rounded-tl-2xl border-b border-slate-100">เดือนที่รับเงิน (Month)</th>
                                    <th className="p-4 text-right border-b border-slate-100 text-emerald-600">เงินเข้าแล้ว (Cash In)</th>
                                    <th className="p-4 text-right border-b border-slate-100 text-rose-500">จ่ายออกแล้ว (Cash Out)</th>
                                    <th className="p-4 text-right rounded-tr-2xl border-b border-slate-100 text-indigo-600">กระแสเงินสดสุทธิ (Net Cash)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[...monthlyStats.data].reverse().map((m, i) => (
                                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="p-4 font-bold text-slate-700">{m.name}</td>
                                        <td className="p-4 text-right font-black text-emerald-600">{formatCurrency(m.cashIn)}</td>
                                        <td className="p-4 text-right font-bold text-rose-500">{formatCurrency(m.cashOut)}</td>
                                        <td className="p-4 text-right font-black">
                                            <span className={m.cashNet >= 0 ? 'text-indigo-600' : 'text-rose-600'}>
                                                {m.cashNet > 0 ? '+' : ''}{formatCurrency(m.cashNet)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

// --- NEW COMPONENT: Monthly Report ---
function MonthlyReport({ transactions, stockBatches, showToast }) {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [isExporting, setIsExporting] = useState(false);

    const reportData = useMemo(() => {
        let gmv = 0;
        let totalSales = 0;
        let totalOrders = 0;
        let totalExpenseOrders = 0;
        let totalPlatformFees = 0;
        let totalShippingFees = 0;
        let totalDiscounts = 0;
        let totalCogs = 0;
        let totalDirectExpenses = 0;
        
        let feeBreakdown = {
            transaction: 0,
            commission: 0,
            service: 0,
            infrastructure: 0,
            affiliate: 0
        };

        const dailySales = {};
        const productSales = {};

        transactions.forEach(t => {
            const tDate = normalizeDate(t.date);
            if (!tDate) return;
            
            const tMonthStr = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
            if (tMonthStr !== selectedMonth) return;

            if (t.isFromReconciliation && t.category !== 'ค่าธรรมเนียม Platform') return;

            if (t.type === 'income' && !t.isCancelled) {
                totalOrders++;
                gmv += Number(t.total || 0);

                const expectedAmt = t.grandTotal || t.total || 0;
                totalSales += expectedAmt;
                
                totalPlatformFees += Number(t.platformFee || 0);
                totalShippingFees += Number(t.shippingFee || 0);
                totalDiscounts += (Number(t.couponDiscount || 0) + Number(t.cashCoupon || 0));

                feeBreakdown.transaction += Number(t.transactionFee || 0);
                feeBreakdown.commission += Number(t.commissionFee || 0);
                feeBreakdown.service += Number(t.serviceFee || 0);
                feeBreakdown.infrastructure += Number(t.infrastructureFee || 0);
                feeBreakdown.affiliate += Number(t.affiliateFee || 0);

                const dayStr = String(tDate.getDate()).padStart(2, '0');
                if (!dailySales[dayStr]) dailySales[dayStr] = 0;
                dailySales[dayStr] += expectedAmt;

                (t.items || []).forEach(item => {
                    const qty = Number(item.qty) || 0;
                    
                    const batch = stockBatches.find(b => matchItemToBatch(item.sku, item.desc, b.sku, b.productName));
                    const cost = Number(batch?.costPerUnit || 0);
                    totalCogs += (qty * cost);

                    const prodKey = (item.sku && item.sku !== '-') ? item.sku : item.desc;
                    const prodName = item.desc;
                    if (!productSales[prodKey]) {
                        productSales[prodKey] = { name: prodName, sku: item.sku || '-', qty: 0, revenue: 0 };
                    }
                    productSales[prodKey].qty += qty;
                    productSales[prodKey].revenue += (qty * Number(item.sellPrice || item.price || 0));
                });
            } else if (t.type === 'expense' && !t.isCancelled) {
                totalExpenseOrders++;
                const expAmt = Number(t.total || 0);
                if (t.category === 'ค่าธรรมเนียม Platform') {
                    totalPlatformFees += expAmt;
                } else {
                    totalDirectExpenses += expAmt;
                }
            }
        });

        const [year, month] = selectedMonth.split('-');
        const daysInMonth = new Date(year, month, 0).getDate();
        const chartData = [];
        let maxDailySale = 0;
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dayStr = String(i).padStart(2, '0');
            const amount = dailySales[dayStr] || 0;
            if (amount > maxDailySale) maxDailySale = amount;
            chartData.push({ day: dayStr, amount });
        }

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        const netProfit = totalSales - totalCogs - totalPlatformFees - totalDirectExpenses;
        const aov = totalOrders > 0 ? totalSales / totalOrders : 0;

        return {
            gmv, totalSales, totalOrders, totalExpenseOrders, totalPlatformFees, totalShippingFees, totalDiscounts, 
            totalCogs, totalDirectExpenses, netProfit, aov, feeBreakdown,
            chartData, maxDailySale, topProducts
        };
    }, [transactions, selectedMonth, stockBatches]);

    const monthlyStockData = useMemo(() => {
        if (!selectedMonth) return [];
        const [year, month] = selectedMonth.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const stockMap = {};

        const initItem = (sku, rawName) => {
            const name = rawName.replace('[แถมฟรี] ', '').replace('[แถมฟรี]', '').replace('[ของแจก/โปรโมท] ', '').replace('[ของแจก/โปรโมท]', '').trim();
            const key = sku && sku !== '-' ? sku : name;
            if (!stockMap[key]) {
                stockMap[key] = { sku: sku || '-', name, beginQty: 0, inQty: 0, outQty: 0, endQty: 0 };
            }
            return key;
        };

        // 1. คำนวณรับเข้า (Inbound)
        stockBatches.forEach(b => {
            const bDate = normalizeDate(b.date);
            if (!bDate) return;
            const key = initItem(b.sku, b.productName);
            
            if (bDate < startDate) {
                stockMap[key].beginQty += (Number(b.quantity) || 0);
            } else if (bDate >= startDate && bDate <= endDate) {
                stockMap[key].inQty += (Number(b.quantity) || 0);
            }
        });

        // 2. คำนวณจ่ายออก (Outbound จาก Transactions Income)
        // --- 🔴 THE ULTIMATE FIX 2: ตัดบิล Reconciliation ออกจากการคำนวณจ่ายออก เพื่อไม่ให้กระทบยอดสต็อกกายภาพ
        transactions.forEach(t => {
            if (t.type !== 'income' || t.isCancelled || t.isFromReconciliation) return;
            const tDate = normalizeDate(t.date);
            if (!tDate) return;

            (t.items || []).forEach(item => {
                const key = initItem(item.sku, item.desc);
                if (tDate < startDate) {
                    stockMap[key].beginQty -= (Number(item.qty) || 0);
                } else if (tDate >= startDate && tDate <= endDate) {
                    stockMap[key].outQty += (Number(item.qty) || 0);
                }
            });
        });

        // 3. หักลบหาคงเหลือ (Ending Balance)
        return Object.values(stockMap).map(item => {
            item.endQty = item.beginQty + item.inQty - item.outQty;
            return item;
        }).filter(item => item.beginQty !== 0 || item.inQty !== 0 || item.outQty !== 0 || item.endQty !== 0)
          .sort((a, b) => b.endQty - a.endQty);

    }, [transactions, stockBatches, selectedMonth]);

    const handleExportMonthlyExcel = async () => {
        setIsExporting(true);
        if (showToast) showToast("กำลังเตรียมไฟล์ Excel...", "success");
        
        if (!window.XLSX) { 
            const script = document.createElement('script'); 
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; 
            await new Promise((resolve) => { script.onload = resolve; document.body.appendChild(script); }); 
        }

        try {
            const wb = window.XLSX.utils.book_new();

            const summaryData = [
                ["สรุปผลประกอบการประจำเดือน", selectedMonth],
                [],
                ["หัวข้อ", "จำนวนเงิน (บาท) / ข้อมูล"],
                ["ยอดสั่งซื้อรวม (GMV)", reportData.gmv],
                ["ยอดขายสุทธิ (Net Sales)", reportData.totalSales],
                ["จำนวนบิลรายรับ (Income Orders)", reportData.totalOrders],
                ["จำนวนบิลรายจ่าย (Expense Orders)", reportData.totalExpenseOrders],
                ["ยอดซื้อเฉลี่ยต่อบิล (AOV)", reportData.aov],
                [],
                ["กำไรสุทธิ (Net Profit)", reportData.netProfit],
                ["ต้นทุนสินค้า (COGS)", reportData.totalCogs],
                ["ค่าธรรมเนียม Platform", reportData.totalPlatformFees],
                ["รายจ่ายอื่นๆ (Direct Exp.)", reportData.totalDirectExpenses],
            ];
            const wsSummary = window.XLSX.utils.aoa_to_sheet(summaryData);
            window.XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

            const dailyData = [
                ["วันที่", "ยอดขาย (บาท)"]
            ];
            reportData.chartData.forEach(d => {
                dailyData.push([`${selectedMonth}-${d.day}`, d.amount]);
            });
            const wsDaily = window.XLSX.utils.aoa_to_sheet(dailyData);
            window.XLSX.utils.book_append_sheet(wb, wsDaily, "Daily Sales");

            const topProdData = [
                ["อันดับ", "ชื่อสินค้า", "SKU", "ขายแล้ว (ชิ้น)", "ยอดขาย (บาท)"]
            ];
            reportData.topProducts.forEach((p, i) => {
                topProdData.push([i + 1, p.name, p.sku, p.qty, p.revenue]);
            });
            const wsTopProd = window.XLSX.utils.aoa_to_sheet(topProdData);
            window.XLSX.utils.book_append_sheet(wb, wsTopProd, "Top Products");

            const stockData = [
                ["SKU", "ชื่อสินค้า", "ยอดยกมา (เริ่มต้น)", "รับเข้า (ชิ้น)", "ขายออก (ชิ้น)", "คงเหลือ (สิ้นเดือน)"]
            ];
            monthlyStockData.forEach(s => {
                stockData.push([s.sku, s.name, s.beginQty, s.inQty, s.outQty, s.endQty]);
            });
            const wsStock = window.XLSX.utils.aoa_to_sheet(stockData);
            window.XLSX.utils.book_append_sheet(wb, wsStock, "Stock Movement");

            window.XLSX.writeFile(wb, `Monthly_Report_${selectedMonth}.xlsx`);
            if (showToast) showToast("ดาวน์โหลดไฟล์สำเร็จ", "success");
        } catch (e) {
            console.error(e);
            if (showToast) showToast("เกิดข้อผิดพลาดในการส่งออกไฟล์", "error");
        }
        setIsExporting(false);
    };

    const changeMonth = (offset) => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const newDate = new Date(year, month - 1 + offset, 1);
        setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
    };

    return (
        <div className="space-y-6 animate-fadeIn font-sarabun text-left w-full h-full pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><BarChart2 className="text-indigo-600"/> สรุปยอดธุรกิจรายเดือน</h2>
                    <p className="text-sm text-slate-400 font-medium">รายงานประสิทธิภาพการขาย ต้นทุน และกำไรที่แท้จริง</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                        <button onClick={() => changeMonth(-1)} className="p-2 bg-white rounded-xl hover:bg-indigo-50 hover:text-indigo-600 shadow-sm transition-colors text-slate-500"><ChevronDown className="rotate-90" size={18}/></button>
                        <input 
                            type="month" 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-0 text-sm font-black text-slate-700 outline-none cursor-pointer focus:ring-0 px-2"
                        />
                        <button onClick={() => changeMonth(1)} className="p-2 bg-white rounded-xl hover:bg-indigo-50 hover:text-indigo-600 shadow-sm transition-colors text-slate-500"><ChevronUp className="rotate-90" size={18}/></button>
                    </div>
                    <button onClick={handleExportMonthlyExcel} disabled={isExporting} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl text-xs font-bold transition-all border border-emerald-200 flex items-center gap-2 disabled:opacity-50 shadow-sm whitespace-nowrap">
                        {isExporting ? <Loader size={16} className="animate-spin" /> : <FileSpreadsheet size={16}/>} Export Excel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
                    <ShoppingCart size={80} className="absolute -bottom-4 -right-4 opacity-10"/>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 text-indigo-300">ยอดสั่งซื้อรวม (GMV)</p>
                    <h3 className="text-3xl font-black">{formatCurrency(reportData.gmv)}</h3>
                    <p className="text-xs font-medium opacity-80 mt-2 flex items-center gap-1">ก่อนหักส่วนลด/ค่าส่ง</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
                    <TrendingUp size={80} className="absolute -bottom-4 -right-4 opacity-20"/>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">ยอดขายสุทธิ (Net Sales)</p>
                    <h3 className="text-3xl font-black">{formatCurrency(reportData.totalSales)}</h3>
                    <p className="text-xs font-medium opacity-90 mt-2 flex items-center gap-1"><Package size={12}/> AOV: {formatCurrency(reportData.aov)}/บิล</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">กำไรสุทธิ (Net Profit)</p>
                    <h3 className={`text-3xl font-black ${reportData.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {reportData.netProfit >= 0 ? '+' : ''}{formatCurrency(reportData.netProfit)}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-2">หลังหักทุนและค่าธรรมเนียม</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">ค่าธรรมเนียม Platform รวม</p>
                    <h3 className="text-3xl font-black text-rose-500">{formatCurrency(reportData.totalPlatformFees)}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-2">คิดเป็น {(reportData.totalSales > 0 ? (reportData.totalPlatformFees / reportData.totalSales) * 100 : 0).toFixed(1)}% ของยอดขาย</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                        <ClipboardList size={16} className="text-indigo-600"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">สรุปจำนวนเอกสาร</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-1">
                            <span className="text-slate-500 text-xs">รายรับ (Income)</span>
                            <span className="font-black text-emerald-600">{reportData.totalOrders.toLocaleString()} <span className="text-[10px] font-medium text-slate-400">บิล</span></span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 text-xs">รายจ่าย (Expense)</span>
                            <span className="font-black text-rose-500">{reportData.totalExpenseOrders.toLocaleString()} <span className="text-[10px] font-medium text-slate-400">บิล</span></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PieChart className="text-indigo-500" size={18}/> โครงสร้างรายได้และต้นทุน</h3>
                        
                        {reportData.totalSales > 0 ? (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold"><span className="text-emerald-600">กำไรสุทธิ (Net Profit)</span><span className="text-emerald-700">{(reportData.netProfit / reportData.totalSales * 100).toFixed(1)}%</span></div>
                                    <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{width: `${Math.max(0, (reportData.netProfit / reportData.totalSales * 100))}%`}}></div></div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold"><span className="text-amber-500">ต้นทุนสินค้า (COGS)</span><span className="text-amber-600">{(reportData.totalCogs / reportData.totalSales * 100).toFixed(1)}%</span></div>
                                    <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-amber-400 h-2 rounded-full" style={{width: `${Math.min(100, (reportData.totalCogs / reportData.totalSales * 100))}%`}}></div></div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold"><span className="text-rose-500">ค่าธรรมเนียมแพลตฟอร์ม</span><span className="text-rose-600">{(reportData.totalPlatformFees / reportData.totalSales * 100).toFixed(1)}%</span></div>
                                    <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-rose-400 h-2 rounded-full" style={{width: `${Math.min(100, (reportData.totalPlatformFees / reportData.totalSales * 100))}%`}}></div></div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold"><span className="text-slate-500">รายจ่ายอื่นๆ (Direct Exp.)</span><span className="text-slate-600">{(reportData.totalDirectExpenses / reportData.totalSales * 100).toFixed(1)}%</span></div>
                                    <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-slate-400 h-2 rounded-full" style={{width: `${Math.min(100, (reportData.totalDirectExpenses / reportData.totalSales * 100))}%`}}></div></div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-10 text-center text-slate-400 text-sm font-bold bg-slate-50 rounded-2xl">ไม่มีข้อมูลยอดขายในเดือนนี้</div>
                        )}
                        
                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">ยอดสั่งซื้อรวม (GMV)</span><span className="font-bold text-slate-700">{formatCurrency(reportData.gmv)}</span></div>
                            <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">หัก ส่วนลด / บวก ค่าจัดส่ง</span><span className="font-bold text-indigo-400">{(reportData.totalSales - reportData.gmv) > 0 ? '+' : ''}{formatCurrency(reportData.totalSales - reportData.gmv)}</span></div>
                            <div className="flex justify-between text-sm mb-2"><span className="font-bold text-slate-700">ยอดขายสุทธิ (Net Sales)</span><span className="font-black text-indigo-600">{formatCurrency(reportData.totalSales)}</span></div>
                            <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">หัก ต้นทุนสินค้ารวม</span><span className="font-bold text-amber-600">-{formatCurrency(reportData.totalCogs)}</span></div>
                            <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">หัก ค่าธรรมเนียมรวม</span><span className="font-bold text-rose-600">-{formatCurrency(reportData.totalPlatformFees)}</span></div>
                            <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">หัก รายจ่ายอื่นๆ</span><span className="font-bold text-rose-600">-{formatCurrency(reportData.totalDirectExpenses)}</span></div>
                            <div className="flex justify-between text-base pt-2 border-t border-dashed border-slate-200 mt-2"><span className="font-black text-indigo-700">กำไรสุทธิ</span><span className={`font-black ${reportData.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(reportData.netProfit)}</span></div>
                        </div>
                    </div>

                    <div className="bg-rose-50/50 p-6 rounded-[32px] border border-rose-100 shadow-sm">
                        <h3 className="font-bold text-rose-800 mb-4 flex items-center gap-2"><Zap className="text-rose-500" size={18}/> แจกแจงค่าธรรมเนียม Platform</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-rose-50 shadow-sm">
                                <span className="text-slate-600 font-medium text-xs">ค่าธรรมเนียมธุรกรรม</span>
                                <span className="font-bold text-rose-600">{formatCurrency(reportData.feeBreakdown.transaction)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-rose-50 shadow-sm">
                                <span className="text-slate-600 font-medium text-xs">ค่าคอมมิชชั่น</span>
                                <span className="font-bold text-rose-600">{formatCurrency(reportData.feeBreakdown.commission)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-rose-50 shadow-sm">
                                <span className="text-slate-600 font-medium text-xs">ค่าบริการ (Service)</span>
                                <span className="font-bold text-rose-600">{formatCurrency(reportData.feeBreakdown.service)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-rose-50 shadow-sm">
                                <span className="text-slate-600 font-medium text-xs">โครงสร้างพื้นฐานฯ (Infra)</span>
                                <span className="font-bold text-rose-600">{formatCurrency(reportData.feeBreakdown.infrastructure)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 lg:col-span-2">
                    
                    <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-fit">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><Activity className="text-indigo-600"/> กราฟยอดขายรายวัน</h3>
                                <p className="text-xs text-slate-400 mt-1">Daily Sales Trend ({selectedMonth})</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ยอดขายสูงสุดใน 1 วัน</p>
                                <p className="text-xl font-black text-indigo-600">{formatCurrency(reportData.maxDailySale)}</p>
                            </div>
                        </div>

                        <div className="flex-1 w-full min-h-[250px] relative mt-4 pt-4 border-t border-slate-50">
                            <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                                <div className="border-b border-slate-900 w-full h-0"></div>
                                <div className="border-b border-slate-900 w-full h-0"></div>
                                <div className="border-b border-slate-900 w-full h-0"></div>
                                <div className="border-b border-slate-900 w-full h-0"></div>
                            </div>
                            
                            <div className="flex h-48 items-end gap-1 sm:gap-2 w-full relative z-10">
                                {reportData.chartData.map((d, i) => {
                                    const barHeight = reportData.maxDailySale > 0 ? (d.amount / reportData.maxDailySale) * 100 : 0;
                                    const isWeekend = new Date(selectedMonth.split('-')[0], Number(selectedMonth.split('-')[1]) - 1, Number(d.day)).getDay() === 0 || new Date(selectedMonth.split('-')[0], Number(selectedMonth.split('-')[1]) - 1, Number(d.day)).getDay() === 6;
                                    
                                    return (
                                        <div key={i} className="flex flex-col items-center flex-1 group relative h-full">
                                            <div className="w-full flex items-end justify-center h-full">
                                                <div 
                                                    className={`w-full max-w-[24px] rounded-t-md transition-all duration-500 cursor-pointer relative shadow-sm ${isWeekend ? 'bg-amber-300 group-hover:bg-amber-400' : 'bg-indigo-400 group-hover:bg-indigo-600'}`}
                                                    style={{ height: `${barHeight}%`, minHeight: d.amount > 0 ? '4px' : '0px' }}
                                                >
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                        วันที่ {d.day}: {formatCurrency(d.amount)}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`text-[8px] sm:text-[10px] font-bold mt-2 ${isWeekend ? 'text-amber-500' : 'text-slate-400'}`}>{Number(d.day) % 2 !== 0 ? d.day : ''}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><Star className="text-amber-500 fill-amber-500"/> 5 อันดับสินค้าขายดีประจำเดือน</h3>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                                    <tr>
                                        <th className="p-3 rounded-tl-xl border-b border-slate-100 w-10 text-center">No.</th>
                                        <th className="p-3 border-b border-slate-100">ชื่อสินค้า (Product)</th>
                                        <th className="p-3 border-b border-slate-100 text-center">ขายแล้ว (ชิ้น)</th>
                                        <th className="p-3 text-right rounded-tr-xl border-b border-slate-100 text-indigo-600">ยอดขายรวม (฿)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {reportData.topProducts.map((prod, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-3 text-center font-black text-slate-400">{idx + 1}</td>
                                            <td className="p-3">
                                                <p className="font-bold text-slate-700 line-clamp-1">{prod.name}</p>
                                                <p className="text-[10px] font-mono text-slate-400">SKU: {prod.sku}</p>
                                            </td>
                                            <td className="p-3 text-center font-black text-slate-800">{prod.qty.toLocaleString()}</td>
                                            <td className="p-3 text-right font-black text-indigo-600">{formatCurrency(prod.revenue)}</td>
                                        </tr>
                                    ))}
                                    {reportData.topProducts.length === 0 && (
                                        <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-bold">ยังไม่มีข้อมูลการขายในเดือนนี้</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-4">
                    <div>
                        <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><ArrowRightLeft className="text-teal-500"/> รายละเอียดการเคลื่อนไหวสต็อกสินค้า</h3>
                        <p className="text-xs text-slate-400 mt-1">Stock Movement & Balance ({selectedMonth})</p>
                    </div>
                    <div className="text-right">
                        <span className="bg-teal-50 text-teal-600 px-3 py-1.5 rounded-full text-xs font-bold border border-teal-100">{monthlyStockData.length} รายการที่มีความเคลื่อนไหว</span>
                    </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 sticky top-0">
                            <tr>
                                <th className="p-3 rounded-tl-xl border-b border-slate-100">Product / SKU</th>
                                <th className="p-3 text-center border-b border-slate-100 bg-slate-100/50">ยอดยกมา<br/><span className="text-[8px] font-normal">(Beginning)</span></th>
                                <th className="p-3 text-center border-b border-slate-100 bg-emerald-50/50 text-emerald-600">รับเข้า<br/><span className="text-[8px] font-normal">(In)</span></th>
                                <th className="p-3 text-center border-b border-slate-100 bg-rose-50/50 text-rose-600">ขาย/จ่ายออก<br/><span className="text-[8px] font-normal">(Out)</span></th>
                                <th className="p-3 text-right rounded-tr-xl border-b border-slate-100 text-indigo-600">คงเหลือสิ้นเดือน<br/><span className="text-[8px] font-normal">(Ending Balance)</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {monthlyStockData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-3">
                                        <p className="font-bold text-slate-700 line-clamp-1">{item.name}</p>
                                        <p className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</p>
                                    </td>
                                    <td className="p-3 text-center font-bold text-slate-500 bg-slate-50/30">{item.beginQty.toLocaleString()}</td>
                                    <td className="p-3 text-center font-black text-emerald-500 bg-emerald-50/20">{item.inQty > 0 ? `+${item.inQty.toLocaleString()}` : '-'}</td>
                                    <td className="p-3 text-center font-black text-rose-500 bg-rose-50/20">{item.outQty > 0 ? `-${item.outQty.toLocaleString()}` : '-'}</td>
                                    <td className="p-3 text-right font-black text-indigo-600">{item.endQty.toLocaleString()}</td>
                                </tr>
                            ))}
                            {monthlyStockData.length === 0 && (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold">ไม่มีความเคลื่อนไหวของสต็อกในเดือนนี้</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
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
  const [promotions, setPromotions] = useState([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [showAdminTools, setShowAdminTools] = useState(false);

  const [showDriveModal, setShowDriveModal] = useState(false);
  const [tempDriveUrl, setTempDriveUrl] = useState('');

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const restoreFileRef = useRef(null);
  
  const [restoreProgress, setRestoreProgress] = useState({ current: 0, total: 0, status: '' });
  const [restoreError, setRestoreError] = useState('');
  const [restoreFileStats, setRestoreFileStats] = useState(null); 
  const [restoreLogs, setRestoreLogs] = useState([]); 
  const terminalRef = useRef(null); 
  
  const [restoreDataPreview, setRestoreDataPreview] = useState(null);
  const [restoreSearchTerm, setRestoreSearchTerm] = useState('');

  const [showBackupPreview, setShowBackupPreview] = useState(false);
  const [backupStats, setBackupStats] = useState(null);
  const [backupDataPreview, setBackupDataPreview] = useState(null); 
  const [backupSearchTerm, setBackupSearchTerm] = useState(''); 
  const backupPreviewFileRef = useRef(null);

  const [importLogs, setImportLogs] = useState([]);

  const [showHealerModal, setShowHealerModal] = useState(false);
  const [orphanLots, setOrphanLots] = useState([]);
  const [isHealing, setIsHealing] = useState(false);

  const addToast = (message, type = 'success') => { const id = Date.now() + Math.random(); setToasts(prev => [...prev, { id, message, type }]); setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000); };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  const toggleAppMode = () => { const ids = Object.values(CONSTANTS.IDS); const nextId = ids[(ids.indexOf(currentAppId) + 1) % ids.length]; setCurrentAppId(nextId); localStorage.setItem('merchant_app_id', nextId); addToast(`ฐานข้อมูล: ${nextId}`, "success"); };

  useEffect(() => {
    if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [restoreLogs]);

  useEffect(() => { 
    const unsubscribe = onAuthStateChanged(authInstance, (newUser) => { 
        setUser(newUser); 
        setAuthLoading(false);
    }); 
    return () => unsubscribe(); 
  }, []);
   
  useEffect(() => {
    if (!user || !currentAppId) return;
    
    if (isRestoring || isMigrating || isBackingUp) return; 

    setLoading(true);
    const path = (coll) => collection(dbInstance, 'artifacts', currentAppId, 'public', 'data', coll);
    const errorFn = (e) => { console.error("Firestore error:", e); addToast("Sync Error", "error"); };
    const unsubInc = onSnapshot(query(path('transactions_income')), (s) => setTransactions(prev => [...prev.filter(t=>t.type!=='income'), ...s.docs.map(d=>({id:d.id, ...d.data(), type:'income', date: normalizeDate(d.data().date)}))]), errorFn);
    const unsubExp = onSnapshot(query(path('transactions_expense')), (s) => setTransactions(prev => [...prev.filter(t=>t.type!=='expense'), ...s.docs.map(d=>({id:d.id, ...d.data(), type:'expense', date: normalizeDate(d.data().date)}))]), errorFn);
    const unsubInv = onSnapshot(query(path('invoices')), (s) => { setInvoices(s.docs.map(d=>({id:d.id, ...d.data(), date: normalizeDate(d.data().date)}))); setLoading(false); }, errorFn);
    const unsubStock = onSnapshot(query(path('inventory_batches')), (s) => setStockBatches(s.docs.map(d=>({id:d.id, ...d.data()}))), errorFn);
    const unsubPromo = onSnapshot(query(path('promotions')), (s) => setPromotions(s.docs.map(d=>({id:d.id, ...d.data()}))), errorFn);
    const unsubLogs = onSnapshot(query(path('import_logs')), (s) => setImportLogs(s.docs.map(d=>({id:d.id, ...d.data(), date: normalizeDate(d.data().createdAt)}))), errorFn);
    
    return () => { unsubInc(); unsubExp(); unsubInv(); unsubStock(); unsubPromo(); unsubLogs(); };
  }, [user, currentAppId, isRestoring, isMigrating, isBackingUp]);

  const forceDeleteById = async () => {
    if (!targetIdToDelete) return;
    try {
      if (!currentAppId) throw new Error("ไม่พบ App ID");
      const batchWriter = writeBatch(dbInstance);
      const cleanTarget = String(targetIdToDelete).trim().toLowerCase();
      
      const invMatch = invoices.find(inv => 
          String(inv.invNo || '').toLowerCase() === cleanTarget || 
          String(inv.id || '').toLowerCase() === cleanTarget
      );
      
      const transMatch = transactions.find(t => 
          String(t.orderId || '').toLowerCase() === cleanTarget || 
          String(t.id || '').toLowerCase() === cleanTarget || 
          String(t.taxInvoiceNo || '').toLowerCase() === cleanTarget ||
          String(t.sysDocId || '').toLowerCase() === cleanTarget ||
          String(t.linkedOrderNo || '').toLowerCase() === cleanTarget
      );
      
      if (invMatch && invMatch.id) { 
          batchWriter.delete(doc(dbInstance, 'artifacts', String(currentAppId), 'public', 'data', 'invoices', String(invMatch.id))); 
          addToast(`ลบใบกำกับเลขที่ ${invMatch.invNo || invMatch.id} สำเร็จ`, "success"); 
      } else if (transMatch && transMatch.id) { 
          const coll = transMatch.type === 'income' ? 'transactions_income' : 'transactions_expense'; 
          batchWriter.delete(doc(dbInstance, 'artifacts', String(currentAppId), 'public', 'data', coll, String(transMatch.id))); 
          
          if (transMatch.type === 'expense') {
              stockBatches.filter(b => b.parentExpenseId === transMatch.id).forEach(lot => {
                  if (lot && lot.id) {
                      batchWriter.delete(doc(dbInstance, 'artifacts', String(currentAppId), 'public', 'data', 'inventory_batches', String(lot.id)));
                  }
              });
          } else {
              for (const item of (transMatch.items || [])) {
                  let toReturn = Number(item.qty);
                  if (isNaN(toReturn) || toReturn <= 0) continue;
                  const lots = stockBatches
                    .filter(b => (String(b.sku).toLowerCase() === String(item.sku).toLowerCase() || String(b.productName).toLowerCase() === String(item.desc).toLowerCase()) && Number(b.sold) > 0)
                    .sort(sortNewestFirst);
                  for (const lot of lots) {
                      if (toReturn <= 0) break;
                      if (!lot || !lot.id) continue;
                      const back = Math.min(toReturn, Number(lot.sold));
                      batchWriter.set(doc(dbInstance, 'artifacts', String(currentAppId), 'public', 'data', 'inventory_batches', String(lot.id)), { sold: increment(-back) }, { merge: true });
                      toReturn -= back;
                  }
              }
          }
          addToast(`ลบรายการ ${transMatch.sysDocId || transMatch.orderId || transMatch.id} และคืนยอดสต็อกสำเร็จ`, "success"); 
      } else { 
          addToast(`ไม่พบข้อมูลที่ตรงกับ "${targetIdToDelete}"`, "error"); 
          return;
      }
      await batchWriter.commit();
      setTargetIdToDelete(''); setShowIdDeleteTool(false);
    } catch(e) { 
      console.error("Force Delete Error:", e);
      addToast(`ลบไม่สำเร็จ: ${e.message}`, "error"); 
    }
  };

  const handleBackup = async () => {
    if (!user) return;
    setIsBackingUp(true);
    addToast("กำลังรวบรวมข้อมูลเพื่อสำรอง...", "success");
    try {
      const collectionsToBackup = ['transactions_income', 'transactions_expense', 'invoices', 'inventory_batches', 'partners', 'promotions', 'seller_profiles'];
      const backupData = {};
      
      for (const collName of collectionsToBackup) {
        const snap = await getDocs(collection(dbInstance, 'artifacts', currentAppId, 'public', 'data', collName));
        backupData[collName] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestampStr = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
      link.download = `MerchantTax_Backup_${currentAppId}_${timestampStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addToast("สำรองข้อมูล (Backup) สำเร็จ", "success");
    } catch (error) {
      console.error(error);
      addToast("เกิดข้อผิดพลาดในการสำรองข้อมูล", "error");
    }
    setIsBackingUp(false);
  };

  const handlePreviewBackupChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const data = JSON.parse(evt.target.result);
              setBackupDataPreview(data);
              setBackupSearchTerm(''); 
              
              const getLatestDate = (arr) => {
                  if (!arr || arr.length === 0) return { max: null, min: null };
                  let maxTime = 0;
                  let minTime = Infinity;
                  arr.forEach(item => {
                      let time = 0;
                      if (item.date && item.date.seconds) time = item.date.seconds * 1000;
                      else if (item.date) {
                          const d = new Date(item.date);
                          if (!isNaN(d.getTime())) time = d.getTime();
                      } else if (item.createdAt && item.createdAt.seconds) {
                          time = item.createdAt.seconds * 1000;
                      }
                      
                      if (time > 0) {
                          if (time > maxTime) maxTime = time;
                          if (time < minTime) minTime = time;
                      }
                  });
                  return {
                      max: maxTime > 0 ? new Date(maxTime) : null,
                      min: minTime !== Infinity ? new Date(minTime) : null
                  };
              };

              const exp = data['transactions_expense'] || [];
              const inc = data['transactions_income'] || [];
              const inv = data['invoices'] || [];
              const stock = data['inventory_batches'] || [];

              setBackupStats({
                  fileName: file.name,
                  expenseCount: exp.length,
                  latestExpenseDate: getLatestDate(exp),
                  incomeCount: inc.length,
                  latestIncomeDate: getLatestDate(inc),
                  invoiceCount: inv.length,
                  stockCount: stock.length
              });
              setShowBackupPreview(true);
          } catch (err) {
              console.error(err);
              addToast("ไม่สามารถอ่านไฟล์ Backup ได้ ข้อมูลอาจเสียหาย", "error");
          }
          setLoading(false);
          if (backupPreviewFileRef.current) backupPreviewFileRef.current.value = '';
      };
      reader.readAsText(file);
  };

  const backupSearchResults = useMemo(() => {
      if (!backupDataPreview || !backupSearchTerm.trim()) return null;
      const term = backupSearchTerm.toLowerCase();
      const results = [];

      const safeString = (val) => String(val || '').toLowerCase();
      const getBackupItemDate = (item) => {
          if (item.date && item.date.seconds) return new Date(item.date.seconds * 1000);
          if (item.date) return new Date(item.date);
          if (item.createdAt && item.createdAt.seconds) return new Date(item.createdAt.seconds * 1000);
          return null;
      };

      (backupDataPreview.transactions_income || []).forEach(item => {
          if (safeString(item.sysDocId).includes(term) || safeString(item.orderId).includes(term) || safeString(item.partnerName).includes(term) || safeString(item.description).includes(term)) {
              results.push({ category: 'รายรับ', id: item.sysDocId || item.orderId || item.id, detail: item.description || item.partnerName, date: getBackupItemDate(item), amount: item.total || item.grandTotal });
          }
      });

      (backupDataPreview.transactions_expense || []).forEach(item => {
          if (safeString(item.sysDocId).includes(term) || safeString(item.orderId).includes(term) || safeString(item.taxInvoiceNo).includes(term) || safeString(item.partnerName).includes(term) || safeString(item.description).includes(term)) {
              results.push({ category: 'รายจ่าย', id: item.sysDocId || item.taxInvoiceNo || item.id, detail: item.description || item.partnerName, date: getBackupItemDate(item), amount: item.total || item.grandTotal });
          }
      });

      (backupDataPreview.invoices || []).forEach(item => {
          if (safeString(item.invNo).includes(term) || safeString(item.orderId).includes(term) || safeString(item.customerName).includes(term)) {
              results.push({ category: 'เอกสารภาษี', id: item.invNo, detail: item.customerName, date: getBackupItemDate(item), amount: item.total });
          }
      });

      (backupDataPreview.inventory_batches || []).forEach(item => {
          if (safeString(item.productName).includes(term) || safeString(item.sku).includes(term)) {
              results.push({ category: 'สต็อกสินค้า', id: item.sku || '-', detail: item.productName, date: getBackupItemDate(item), amount: item.costPerUnit });
          }
      });

      return results.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)).slice(0, 100);
  }, [backupDataPreview, backupSearchTerm]);

  const restoreSearchResults = useMemo(() => {
      if (!restoreDataPreview) return [];
      const term = restoreSearchTerm.toLowerCase();
      const results = [];

      const safeString = (val) => String(val || '').toLowerCase();
      const getBackupItemDate = (item) => {
          if (item.date && item.date.seconds) return new Date(item.date.seconds * 1000);
          if (item.date) return new Date(item.date);
          if (item.createdAt && item.createdAt.seconds) return new Date(item.createdAt.seconds * 1000);
          return null;
      };

      const checkMatch = (item, fields) => {
          if (!term) return true;
          return fields.some(f => safeString(item[f]).includes(term));
      };

      (restoreDataPreview.transactions_income || []).forEach(item => {
          if (checkMatch(item, ['sysDocId', 'orderId', 'partnerName', 'description'])) {
              results.push({ category: 'รายรับ', id: item.sysDocId || item.orderId || item.id, detail: item.description || item.partnerName, date: getBackupItemDate(item), amount: item.total || item.grandTotal });
          }
      });

      (restoreDataPreview.transactions_expense || []).forEach(item => {
          if (checkMatch(item, ['sysDocId', 'orderId', 'taxInvoiceNo', 'partnerName', 'description'])) {
              results.push({ category: 'รายจ่าย', id: item.sysDocId || item.taxInvoiceNo || item.id, detail: item.description || item.partnerName, date: getBackupItemDate(item), amount: item.total || item.grandTotal });
          }
      });

      (restoreDataPreview.invoices || []).forEach(item => {
          if (checkMatch(item, ['invNo', 'orderId', 'customerName'])) {
              results.push({ category: 'เอกสารภาษี', id: item.invNo, detail: item.customerName, date: getBackupItemDate(item), amount: item.total });
          }
      });

      return results.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)).slice(0, 100);
  }, [restoreDataPreview, restoreSearchTerm]);

  const handleRestoreFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRestoreFile(file);
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const data = JSON.parse(evt.target.result);
            
            const getLatestDate = (arr) => {
                if (!arr || arr.length === 0) return { max: null, min: null };
                let maxTime = 0;
                let minTime = Infinity;
                arr.forEach(item => {
                    let time = 0;
                    if (item.date && item.date.seconds) time = item.date.seconds * 1000;
                    else if (item.date) {
                        const d = new Date(item.date);
                        if (!isNaN(d.getTime())) time = d.getTime();
                    } else if (item.createdAt && item.createdAt.seconds) time = item.createdAt.seconds * 1000;
                    
                    if (time > 0) {
                        if (time > maxTime) maxTime = time;
                        if (time < minTime) minTime = time;
                    }
                });
                return {
                    max: maxTime > 0 ? new Date(maxTime) : null,
                    min: minTime !== Infinity ? new Date(minTime) : null
                };
            };

            const exp = data['transactions_expense'] || [];
            const inc = data['transactions_income'] || [];
            const inv = data['invoices'] || [];
            const stock = data['inventory_batches'] || [];

            setRestoreFileStats({
                fileName: file.name,
                expenseCount: exp.length,
                latestExpenseDate: getLatestDate(exp),
                incomeCount: inc.length,
                latestIncomeDate: getLatestDate(inc),
                invoiceCount: inv.length,
                stockCount: stock.length
            });
            setRestoreDataPreview(data); 
            setRestoreSearchTerm('');
            setShowRestoreConfirm(true);
        } catch (err) {
            console.error(err);
            addToast("ไม่สามารถอ่านไฟล์ Backup ได้ ข้อมูลอาจเสียหาย", "error");
            setRestoreFile(null);
            setRestoreDataPreview(null);
        }
        setLoading(false);
        if (restoreFileRef.current) restoreFileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const executeRestore = async () => {
    if (!restoreFile || !user) return;
    setShowRestoreConfirm(false);
    setIsRestoring(true);
    setRestoreError('');
    setRestoreLogs([{ msg: '➜ เริ่มต้นกระบวนการวิเคราะห์และกู้คืนข้อมูล...', type: 'info', time: new Date().toLocaleTimeString('th-TH') }]);

    const addLog = (msg, type = 'info') => {
        setRestoreLogs(prev => {
            const newLogs = [...prev, { msg, type, time: new Date().toLocaleTimeString('th-TH') }];
            if (newLogs.length > 100) return newLogs.slice(newLogs.length - 100);
            return newLogs;
        });
    };

    const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = "ระบบกำลังกู้คืนข้อมูล ห้ามปิดหน้านี้เด็ดขาด";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    try {
      addLog('➜ กำลังอ่านไฟล์ Backup...', 'info');
      const fileText = await restoreFile.text();
      const restoreData = JSON.parse(fileText);
      
      const reviveTimestamps = (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj.seconds !== undefined && obj.nanoseconds !== undefined) {
          return new Date(obj.seconds * 1000);
        }
        if (obj.type === "firestore/timestamp/1.0" && obj.seconds !== undefined) {
          return new Date(obj.seconds * 1000);
        }
        if (Array.isArray(obj)) return obj.map(reviveTimestamps);
        const newObj = {};
        for (const key in obj) newObj[key] = reviveTimestamps(obj[key]);
        return newObj;
      };

      const sanitizeForFirestore = (obj) => {
          if (obj === undefined || obj === null) return null;
          if (obj instanceof Date) return obj;
          if (Array.isArray(obj)) return obj.map(sanitizeForFirestore).filter(v => v !== null && v !== undefined);
          if (typeof obj === 'object') {
              const newObj = {};
              for (const key in obj) {
                  const val = sanitizeForFirestore(obj[key]);
                  if (val !== undefined && val !== null) {
                      newObj[key] = val;
                  }
              }
              return newObj;
          }
          if (typeof obj === 'number' && isNaN(obj)) return 0;
          return obj;
      };

      addLog('➜ กำลังล้างโครงสร้างข้อมูล (Sanitizing)...', 'info');
      const revivedData = sanitizeForFirestore(reviveTimestamps(restoreData));
      const collectionsToRestore = ['transactions_income', 'transactions_expense', 'invoices', 'inventory_batches', 'partners', 'promotions', 'seller_profiles'];

      addLog('➜ กำลังรวมข้อมูลเพื่อเตรียมส่งออกแบบไร้รอยต่อ...', 'info');
      const uploadQueue = [];
      for (const collName of collectionsToRestore) {
        if (!revivedData[collName] || !Array.isArray(revivedData[collName])) continue;
        for (const item of revivedData[collName]) {
          const docId = item.id || item.sysDocId || item.invNo || doc(collection(dbInstance, 'artifacts', currentAppId, 'public', 'data', collName)).id;
          if (!docId) continue;
          
          const docRef = doc(dbInstance, 'artifacts', currentAppId, 'public', 'data', collName, docId);
          const dataToSet = { ...item };
          delete dataToSet.id;
          uploadQueue.push({ ref: docRef, data: dataToSet, sysDocId: item.sysDocId || item.invNo || item.orderId || docId });
        }
      }

      const totalItems = uploadQueue.length;
      addLog(`✅ พบข้อมูลทั้งหมดที่ต้องกู้คืน: ${totalItems.toLocaleString()} รายการ`, 'success');
      setRestoreProgress({ current: 0, total: totalItems, status: 'เตรียมเชื่อมต่อฐานข้อมูล' });

      addLog('➜ --- เริ่มต้น: เคลียร์ข้อมูลเก่าออกจากระบบ ---', 'info');
      const deleteQueue = [];
      for (const collName of collectionsToRestore) {
        const snap = await getDocs(collection(dbInstance, 'artifacts', currentAppId, 'public', 'data', collName));
        for (const docSnap of snap.docs) {
          deleteQueue.push(docSnap.ref);
        }
      }
      
      addLog(`➜ พบข้อมูลเก่าต้องลบ ${deleteQueue.length.toLocaleString()} รายการ กำลังดำเนินการ...`, 'info');
      const DELETE_CHUNK_SIZE = 100;
      for (let i = 0; i < deleteQueue.length; i += DELETE_CHUNK_SIZE) {
          const chunk = deleteQueue.slice(i, i + DELETE_CHUNK_SIZE);
          let success = false;
          for (let retry = 0; retry < 3; retry++) {
              try {
                  await Promise.all(chunk.map(ref => deleteDoc(ref)));
                  success = true;
                  break;
              } catch (e) {
                  await new Promise(r => setTimeout(r, 1000));
              }
          }
          if (!success) addLog(`⚠️ ไม่สามารถลบข้อมูลเก่าบางส่วนได้ (อาจถูกลบไปแล้ว)`, 'warn');
          await new Promise(r => setTimeout(r, 50));
      }
      addLog('✅ ล้างข้อมูลเก่าสำเร็จ 100%', 'success');

      addLog('➜ --- เริ่มต้น: อัปโหลดข้อมูลใหม่ลงคลาวด์แบบคู่ขนาน ---', 'info');
      setRestoreProgress({ current: 0, total: totalItems, status: 'กำลังเขียนข้อมูลลงคลาวด์...' });
      
      let restoredCount = 0;
      const UPLOAD_CHUNK_SIZE = 50; 
      
      for (let i = 0; i < uploadQueue.length; i += UPLOAD_CHUNK_SIZE) {
          const chunk = uploadQueue.slice(i, i + UPLOAD_CHUNK_SIZE);
          
          let chunkSuccess = false;
          for (let retry = 0; retry < 3; retry++) {
              try {
                  await Promise.all(chunk.map(item => 
                      Promise.race([
                          setDoc(item.ref, item.data),
                          new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), 10000))
                      ])
                  ));
                  chunkSuccess = true;
                  break;
              } catch (err) {
                  addLog(`⚠️ เครือข่ายสะดุดที่รายการ ${i+1}! กำลังลองใหม่ (${retry+1}/3)...`, 'warn');
                  await new Promise(r => setTimeout(r, 2000));
              }
          }

          if (!chunkSuccess) {
              addLog(`❌ ดรอปก้อนข้อมูลช่วงที่ ${i+1} เพราะเชื่อมต่อไม่ได้ (ระบบจะข้ามและรันก้อนต่อไปต่อทันที!)`, 'error');
          } else {
              restoredCount += chunk.length;
              if (restoredCount % 100 === 0 || restoredCount === totalItems) {
                  setRestoreProgress({ current: restoredCount, total: totalItems, status: `กำลังอัปโหลด... (${Math.round((restoredCount/totalItems)*100)}%)` });
                  addLog(`➜ บันทึกสำเร็จรวม ${restoredCount.toLocaleString()} รายการ...`, 'info');
              }
          }
          
          await new Promise(r => setTimeout(r, 50)); 
      }
      
      setRestoreProgress({ current: restoredCount, total: totalItems, status: 'เสร็จสมบูรณ์!' });
      addLog(`✅ 🎉 กู้คืนเสร็จสิ้น! นำเข้าสำเร็จ ${restoredCount.toLocaleString()} จาก ${totalItems.toLocaleString()} รายการ`, 'success');
      
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setRestoreFile(null);
      setRestoreFileStats(null);
      setRestoreDataPreview(null); 
      
      setTimeout(() => {
          window.location.reload();
      }, 3000);

    } catch (error) {
      console.error("Restore failed:", error);
      addLog(`❌ 💥 ข้อผิดพลาดร้ายแรง: ${error.message}`, 'error');
      setRestoreError(error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุระหว่างเชื่อมต่อ");
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setRestoreFile(null);
      setRestoreFileStats(null);
      setRestoreDataPreview(null); 
    }
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

      const getRunningNumDateBased = (items, prefix, dStr, field = 'invNo') => {
          const pfx = `${prefix}${dStr}-`;
          return items.reduce((max, item) => {
              if (item[field] && String(item[field]).startsWith(pfx)) {
                  const n = parseInt(String(item[field]).replace(pfx, ''), 10);
                  return !isNaN(n) && n > max ? n : max;
              }
              return max;
          }, 0);
      };

      const allIncomes = transactions.filter(t => t.type === 'income');
      const missingIncomes = allIncomes.filter(t => !t.sysDocId || !/^INC-\d{8}-\d{5}$/.test(String(t.sysDocId))).sort(sortOldestFirst);
      let incCounters = {};
      for (const t of missingIncomes) {
        const dStr = formatDateISO(t.date).replace(/-/g, '');
        if (incCounters[dStr] === undefined) incCounters[dStr] = getRunningNumDateBased(allIncomes, 'INC-', dStr, 'sysDocId');
        incCounters[dStr]++;
        await safeUpdate('transactions_income', t.id, { sysDocId: `INC-${dStr}-${String(incCounters[dStr]).padStart(5, '0')}` });
      }

      const allExpenses = transactions.filter(t => t.type === 'expense');
      const missingExpenses = allExpenses.filter(t => !t.sysDocId || !/^(COG|EXP)-\d{8}-\d{5}$/.test(String(t.sysDocId))).sort(sortOldestFirst);
      let expCounters = {};
      let cogCounters = {};
      
      for (const t of missingExpenses) {
        const dStr = formatDateISO(t.date).replace(/-/g, '');
        if (t.category === 'ต้นทุนสินค้า' || t.isFromInventory) {
          if (cogCounters[dStr] === undefined) cogCounters[dStr] = getRunningNumDateBased(allExpenses, 'COG-', dStr, 'sysDocId');
          cogCounters[dStr]++;
          await safeUpdate('transactions_expense', t.id, { sysDocId: `COG-${dStr}-${String(cogCounters[dStr]).padStart(5, '0')}` });
        } else {
          if (expCounters[dStr] === undefined) expCounters[dStr] = getRunningNumDateBased(allExpenses, 'EXP-', dStr, 'sysDocId');
          expCounters[dStr]++;
          await safeUpdate('transactions_expense', t.id, { sysDocId: `EXP-${dStr}-${String(expCounters[dStr]).padStart(5, '0')}` });
        }
      }

      const allInvs = invoices.filter(i => i.docType === 'invoice' || !i.docType);
      const missingInvs = allInvs.filter(i => !i.invNo || !/INV-\d{8}-\d{5}/.test(String(i.invNo))).sort(sortOldestFirst);
      let invCounters = {};
      for (const i of missingInvs) {
        const dStr = formatDateISO(i.date).replace(/-/g, '');
        if (invCounters[dStr] === undefined) invCounters[dStr] = getRunningNumDateBased(allInvs, 'INV-', dStr);
        invCounters[dStr]++;
        await safeUpdate('invoices', i.id, { invNo: `INV-${dStr}-${String(invCounters[dStr]).padStart(5, '0')}` });
      }

      const allCns = invoices.filter(i => i.docType === 'credit_note');
      const missingCns = allCns.filter(i => !i.invNo || !/CN-\d{8}-\d{5}/.test(String(i.invNo))).sort(sortOldestFirst);
      let cnCounters = {};
      for (const i of missingCns) {
        const dStr = formatDateISO(i.date).replace(/-/g, '');
        if (cnCounters[dStr] === undefined) cnCounters[dStr] = getRunningNumDateBased(allCns, 'CN-', dStr);
        cnCounters[dStr]++;
        await safeUpdate('invoices', i.id, { invNo: `CN-${dStr}-${String(cnCounters[dStr]).padStart(5, '0')}` });
      }

      const allAbbs = invoices.filter(i => i.docType === 'abb');
      const missingAbbs = allAbbs.filter(i => !i.invNo || !/ABB-\d{8}-\d{5}/.test(String(i.invNo))).sort(sortOldestFirst);
      let abbCounters = {};
      for (const i of missingAbbs) {
        const dStr = formatDateISO(i.date).replace(/-/g, '');
        if (abbCounters[dStr] === undefined) abbCounters[dStr] = getRunningNumDateBased(allAbbs, 'ABB-', dStr);
        abbCounters[dStr]++;
        await safeUpdate('invoices', i.id, { invNo: `ABB-${dStr}-${String(abbCounters[dStr]).padStart(5, '0')}` });
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

  const syncInvoiceDates = async () => {
    setIsMigrating(true);
    try {
      addToast("กำลังตรวจสอบและแก้ไขเลข ABB/วันที่ ให้ตรงกับออเดอร์...", "success");
      let batchWriter = writeBatch(dbInstance);
      let opsCount = 0;
      let updateCount = 0;

      const prefixMap = { credit_note: 'CN-', abb: 'ABB-', quotation: 'QUO-', receipt: 'REC-', invoice: 'INV-' };
      let counters = {};

      const getRunningNum = (pfx) => {
          return invoices.reduce((max, item) => {
              if (item.invNo && String(item.invNo).startsWith(pfx)) {
                  const n = parseInt(String(item.invNo).replace(pfx, ''), 10);
                  return !isNaN(n) && n > max ? n : max;
              }
              return max;
          }, 0);
      };

      for (const inv of invoices) {
        if (inv.orderId) {
          const trans = transactions.find(t => t.orderId === inv.orderId && t.type === 'income');
          if (trans && trans.date) {
            const transD = normalizeDate(trans.date);
            const invD = normalizeDate(inv.date);
            
            const dStr = formatDateISO(transD).replace(/-/g, '');
            const pfx = prefixMap[inv.docType] || 'INV-';
            const expectedPrefix = `${pfx}${dStr}-`;
            
            let needsUpdate = false;
            let updates = {};
            let newInvNo = inv.invNo;

            if (transD && invD && transD.getTime() !== invD.getTime()) {
              needsUpdate = true;
              updates.date = transD;
              updates.orderDate = transD;
            }

            if (inv.invNo && !String(inv.invNo).startsWith(expectedPrefix)) {
              needsUpdate = true;
              if (counters[expectedPrefix] === undefined) {
                  counters[expectedPrefix] = getRunningNum(expectedPrefix);
              }
              counters[expectedPrefix]++;
              newInvNo = `${expectedPrefix}${String(counters[expectedPrefix]).padStart(5, '0')}`;
              updates.invNo = newInvNo;
              
              updates.date = transD;
              updates.orderDate = transD;
            }
            
            if (needsUpdate) {
              const invRef = doc(dbInstance, 'artifacts', currentAppId, 'public', 'data', 'invoices', inv.id);
              batchWriter.update(invRef, updates);
              opsCount++;
              
              if (updates.invNo) {
                  const tRef = doc(dbInstance, 'artifacts', currentAppId, 'public', 'data', 'transactions_income', trans.id);
                  batchWriter.update(tRef, { invoiceNo: newInvNo });
                  opsCount++;
              }

              updateCount++;
              
              if (opsCount >= 400) {
                await batchWriter.commit();
                batchWriter = writeBatch(dbInstance);
                opsCount = 0;
              }
            }
          }
        }
      }
      
      if (opsCount > 0) {
        await batchWriter.commit();
      }
      
      if (updateCount > 0) {
        addToast(`แก้เลขเอกสารและซิงค์วันที่สำเร็จ ${updateCount} รายการ`, "success");
      } else {
        addToast("เลข ABB และวันที่ถูกต้องตรงกันกับออเดอร์อยู่แล้ว", "success");
      }
    } catch (e) {
      console.error(e);
      addToast("เกิดข้อผิดพลาดในการซิงค์ข้อมูล", "error");
    } finally {
      setIsMigrating(false);
    }
  };

  const scanForOrphans = () => {
      const orphans = stockBatches.filter(batch => {
          if (batch.parentExpenseId && batch.category !== 'Imported' && !batch.isOpeningBalance) {
              let expenseStillExists = transactions.some(t => t.id === batch.parentExpenseId);
              
              if (!expenseStillExists) {
                  const bDate = normalizeDate(batch.date)?.getTime();
                  expenseStillExists = transactions.some(t => {
                      if (t.type !== 'expense') return false;
                      const tDate = normalizeDate(t.date)?.getTime();
                      if (!tDate || !bDate || Math.abs(tDate - bDate) > 86400000) return false;
                      return (t.items || []).some(item => item.sku === batch.sku || item.desc === batch.productName);
                  });
              }
              
              return !expenseStillExists; 
          }
          return false;
      });
      setOrphanLots(orphans);
      setShowHealerModal(true);
  };

  const executeHeal = async () => {
      if (orphanLots.length === 0 || !user) return;
      setIsHealing(true);
      try {
          let batch = writeBatch(dbInstance);
          let opsCount = 0;

          for (const lot of orphanLots) {
              const docRef = doc(dbInstance, 'artifacts', currentAppId, 'public', 'data', 'inventory_batches', lot.id);
              batch.delete(docRef);
              opsCount++;

              if (opsCount >= 300) {
                  await batch.commit();
                  batch = writeBatch(dbInstance);
                  opsCount = 0;
              }
          }

          if (opsCount > 0) {
              await batch.commit();
          }

          addToast(`เคลียร์สต็อกตกค้างสำเร็จ ${orphanLots.length} รายการ`, "success");
          setShowHealerModal(false);
      } catch (err) {
          console.error(err);
          addToast("เกิดข้อผิดพลาดในการซ่อมแซมฐานข้อมูล", "error");
      }
      setIsHealing(false);
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard transactions={transactions} invoices={invoices} stockBatches={stockBatches} showToast={addToast} />;
      case 'monthly_report': return <MonthlyReport transactions={transactions} stockBatches={stockBatches} showToast={addToast} />;
      case 'records': return <RecordManager user={user} transactions={transactions} invoices={invoices} appId={currentAppId} stockBatches={stockBatches} showToast={addToast} onIssueInvoice={(t)=>{setPreFillInvoice(t); setActiveTab('invoice');}} promotions={promotions} />;
      case 'import': return <DataImporter appId={currentAppId} showToast={addToast} user={user} stockBatches={stockBatches} transactions={transactions} importLogs={importLogs} />;
      case 'stock': return <StockManager appId={currentAppId} stockBatches={stockBatches} showToast={addToast} user={user} transactions={transactions} />;
      case 'invoice': return <InvoiceGenerator user={user} invoices={invoices} transactions={transactions} appId={currentAppId} showToast={addToast} preFillData={preFillInvoice} promotions={promotions} />;
      case 'reports': return <TaxReports transactions={transactions} invoices={invoices} stockBatches={stockBatches} showToast={addToast} appId={currentAppId} user={user} />;
      case 'promotions': return <PromotionManager appId={currentAppId} promotions={promotions} showToast={addToast} user={user} stockBatches={stockBatches} transactions={transactions} />;
      case 'guide': return <TaxGuide />;
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
      <aside className="w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800 shadow-2xl h-full shrink-0 text-left">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3 text-left"><div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg text-center"><Wallet size={20} className="text-white text-center"/></div><h1 className="text-xl font-bold tracking-tight text-left">MerchantTax</h1></div>
        <nav className="p-6 space-y-4 flex-1 overflow-y-auto text-left">
            <NavButton active={activeTab === 'dashboard'} onClick={()=>{setActiveTab('dashboard');}} icon={<PieChart size={18} className="text-center"/>} label="แดชบอร์ด" />
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 opacity-50 text-left">Analytics</p>
            <NavButton active={activeTab === 'monthly_report'} onClick={()=>{setActiveTab('monthly_report');}} icon={<BarChart2 size={18} className="text-center"/>} label="สรุปยอดรายเดือน (Performance)" />
            <NavButton active={activeTab === 'reports'} onClick={()=>{setActiveTab('reports');}} icon={<ClipboardList size={18} className="text-center"/>} label="รายงานภาษี and บัญชี" />
            
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 opacity-50 text-left">Operations</p>
            <NavButton active={activeTab === 'records'} onClick={()=>{setActiveTab('records');}} icon={<Store size={18} className="text-center"/>} label="บันทึกขาย/หน้าร้าน" />
            <NavButton active={activeTab === 'promotions'} onClick={()=>{setActiveTab('promotions');}} icon={<Gift size={18} className="text-center"/>} label="ปรึกษาโปรโมชั่น (AI)" />
            <NavButton active={activeTab === 'import'} onClick={()=>{setActiveTab('import');}} icon={<FileUp size={18} className="text-center"/>} label="Bulk Import" />
            <NavButton active={activeTab === 'stock'} onClick={()=>{setActiveTab('stock');}} icon={<Box size={18} className="text-center"/>} label="คลังสินค้า FIFO" />
            <NavButton active={activeTab === 'invoice'} onClick={()=>{setActiveTab('invoice'); setPreFillInvoice(null);}} icon={<Printer size={18} className="text-center"/>} label="ใบกำกับภาษี Pro" />
            
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 opacity-50 text-left">Help & Support</p>
            <NavButton active={activeTab === 'guide'} onClick={()=>{setActiveTab('guide');}} icon={<BookOpen size={18} className="text-center"/>} label="คู่มือ & เคล็ดลับภาษี" />
        </nav>
        <div className="p-4 bg-black/20 border-t border-slate-800 space-y-2 text-left">
          <button onClick={toggleAppMode} className="w-full py-3 px-4 rounded-xl text-[10px] font-bold flex items-center justify-start gap-2 bg-slate-800 text-indigo-300 ring-1 ring-slate-700 hover:bg-slate-700 transition-all text-left"><Database size={14} className="text-center"/> DB Instance: {currentAppId}</button>
          
          <button onClick={() => setShowAdminTools(!showAdminTools)} className="w-full py-3 px-4 rounded-xl text-[10px] font-bold flex items-center justify-between gap-2 bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700 transition-all text-left mt-2">
            <div className="flex items-center gap-2"><Settings size={14} className="text-center"/> เครื่องมือขั้นสูง (Admin)</div>
            {showAdminTools ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>

          {showAdminTools && (
            <div className="pl-3 py-1 space-y-2 border-l-2 border-slate-700 ml-2 animate-fadeIn">
              <button onClick={handleBackup} disabled={isBackingUp || isRestoring || isMigrating} className="w-full py-2.5 px-3 rounded-lg text-[10px] font-bold flex items-center justify-start gap-2 text-teal-400 hover:bg-teal-900/30 transition-all text-left">
                {isBackingUp ? <Loader size={14} className="text-center animate-spin"/> : <DownloadCloud size={14} className="text-center"/>} สำรองข้อมูล (Backup)
              </button>

              <button onClick={() => backupPreviewFileRef.current?.click()} disabled={isBackingUp || isRestoring || isMigrating} className="w-full py-2.5 px-3 rounded-lg text-[10px] font-bold flex items-center justify-start gap-2 text-blue-400 hover:bg-blue-900/30 transition-all text-left">
                <Search size={14} className="text-center"/> ตรวจสอบไฟล์ Backup (Preview)
              </button>

              <button onClick={() => restoreFileRef.current?.click()} disabled={isBackingUp || isRestoring || isMigrating} className="w-full py-2.5 px-3 rounded-lg text-[10px] font-bold flex items-center justify-start gap-2 text-orange-400 hover:bg-orange-900/30 transition-all text-left">
                {isRestoring ? <Loader size={14} className="text-center animate-spin"/> : <FileUp size={14} className="text-center"/>} กู้คืนข้อมูล (Restore)
              </button>

              <button onClick={() => setShowMigrateConfirm(true)} disabled={isMigrating} className={`w-full py-2.5 px-3 rounded-lg text-[10px] font-bold flex items-center justify-start gap-2 transition-all text-left ${isMigrating ? 'bg-amber-900/50 text-amber-500 cursor-not-allowed' : 'text-amber-400 hover:bg-amber-900/30'}`}>
                {isMigrating ? <Loader size={14} className="text-center animate-spin"/> : <RefreshCw size={14} className="text-center"/>} 
                {isMigrating ? 'กำลังรันเลข...' : 'รันเลขเอกสารที่ตกหล่น'}
              </button>

              <button onClick={scanForOrphans} className="w-full py-2.5 px-3 rounded-lg text-[10px] font-bold flex items-center justify-start gap-2 text-teal-400 hover:bg-teal-900/30 transition-all text-left">
                <Activity size={14} className="text-center"/> สแกนซ่อมแซมฐานข้อมูล
              </button>

              <button onClick={syncInvoiceDates} disabled={isMigrating} className="w-full py-2.5 px-3 rounded-lg text-[10px] font-bold flex items-center justify-start gap-2 text-emerald-400 hover:bg-emerald-900/30 transition-all text-left">
                <RefreshCw size={14} className="text-center"/> ซิงค์วันที่และแก้เลข ABB
              </button>

              <button onClick={() => { setTempApiKey(localStorage.getItem('gemini_api_key') || ''); setShowApiKeyModal(true); }} className="w-full py-2.5 px-3 rounded-lg text-[10px] font-bold flex items-center justify-start gap-2 text-indigo-400 hover:bg-indigo-900/30 transition-all text-left">
                <Key size={14} className="text-center"/> ตั้งค่า AI API Key
              </button>

              <button onClick={() => { setTempDriveUrl(localStorage.getItem('google_drive_webhook_url') || ''); setShowDriveModal(true); }} className="w-full py-2.5 px-3 rounded-lg text-[10px] font-bold flex items-center justify-start gap-2 text-blue-400 hover:bg-blue-900/30 transition-all text-left">
                <Cloud size={14} className="text-center"/> ตั้งค่าเชื่อมต่อ Google Drive
              </button>

              <button onClick={()=>setShowIdDeleteTool(true)} className="w-full py-2.5 px-3 rounded-lg text-[10px] font-bold flex items-center justify-start gap-2 text-rose-400 hover:bg-rose-900/30 transition-all text-left">
                <Trash2 size={14} className="text-center"/> ลบทิ้งด้วย ID
              </button>
            </div>
          )}

          <button onClick={()=>signOut(authInstance)} className="w-full py-3 px-4 rounded-xl text-[10px] font-bold flex items-center justify-start gap-2 bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700 transition-all text-left mt-2"><LogOut size={14} className="text-center"/> ออกจากระบบ</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden relative text-left">
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 p-5 lg:px-10 flex justify-between items-center z-10 h-20 shrink-0 text-left">
            <div className="flex items-center gap-4 text-left">
                <h2 className="font-bold text-slate-800 text-sm uppercase tracking-widest text-left">{activeTab.replace('_', ' ')}</h2>
            </div>
            <div className="flex items-center gap-3">
                {loading && <div className="text-[10px] font-black text-indigo-600 flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 animate-pulse text-left"><Loader size={12} className="animate-spin text-center"/> SYNCING</div>}
                
                <button onClick={() => window.location.reload()} className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                    <RefreshCw size={12}/> รีเฟรชซิงค์ข้อมูล
                </button>
            </div>
        </header>
        <div className="flex-1 overflow-auto p-6 lg:p-10 relative bg-[#f8fafc] text-left">{renderContent()}</div>
      </main>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Key size={20} className="text-indigo-600"/> ตั้งค่า Gemini API Key</h3>
              <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="space-y-4 text-left">
              <p className="text-xs text-slate-500 leading-relaxed">
                ระบบจำเป็นต้องใช้ API Key ของ Google Gemini ในการประมวลผล AI<br/>
                คุณสามารถรับ Key ฟรีได้ที่ <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold">Google AI Studio</a>
              </p>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">API Key ของคุณ</label>
                <input 
                  type="password" 
                  value={tempApiKey} 
                  onChange={e => setTempApiKey(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-mono mt-1 outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="AIzaSy..." 
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8 text-center">
              <button onClick={() => setShowApiKeyModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">ยกเลิก</button>
              <button 
                onClick={() => { 
                  localStorage.setItem('gemini_api_key', tempApiKey.trim()); 
                  addToast("บันทึก API Key สำเร็จ", "success"); 
                  setShowApiKeyModal(false); 
                }} 
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-colors"
              >
                บันทึก Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Webhook Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Cloud size={20} className="text-blue-600"/> ตั้งค่า Google Drive</h3>
              <button onClick={() => setShowDriveModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="space-y-4 text-left">
              <p className="text-xs text-slate-500 leading-relaxed">
                นำ Web App URL (Webhook) ที่ได้จาก Google Apps Script มาวางที่นี่ <br/>เพื่อเปิดใช้งานระบบ <b>Digital Filing</b> เซฟบิลลง Drive อัตโนมัติ
              </p>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Google Apps Script Webhook URL</label>
                <input 
                  type="text" 
                  value={tempDriveUrl} 
                  onChange={e => setTempDriveUrl(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm mt-1 outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="https://script.google.com/macros/s/..." 
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8 text-center">
              <button onClick={() => setShowDriveModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">ยกเลิก</button>
              <button 
                onClick={() => { 
                  localStorage.setItem('google_drive_webhook_url', tempDriveUrl.trim()); 
                  addToast("บันทึกการเชื่อมต่อ Google Drive สำเร็จ", "success"); 
                  setShowDriveModal(false); 
                }} 
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-colors"
              >
                บันทึก URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Migration Confirm Modal */}
      {showMigrateConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-left">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 text-center border-t-8 border-amber-500">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 shadow-inner">
                    <AlertTriangle size={32}/>
                </div>
                <h3 className="text-xl font-black mb-2 text-slate-800">ยืนยันการรันเลขเอกสารอัตโนมัติ?</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    ระบบจะทำการตรวจสอบข้อมูลทั้งหมดในฐานข้อมูล 
                    และจะทำการสร้าง <b className="text-slate-700">เลขเอกสาร (Document Number)</b> ให้อัตโนมัติ เฉพาะรายการที่ <b>ยังไม่มีเลขที่อ้างอิง</b> เท่านั้น<br/>
                    <br/><span className="text-indigo-600 font-bold">*จะไม่ส่งผลกระทบต่อบิลเก่าที่มีเลขอยู่แล้ว</span>
                </p>
                <div className="flex gap-3 text-center">
                    <button onClick={() => setShowMigrateConfirm(false)} disabled={isMigrating} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors">
                        ยกเลิก
                    </button>
                    <button onClick={executeMigration} disabled={isMigrating} className="flex-[1.5] py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg transition-colors flex justify-center items-center gap-2">
                        {isMigrating ? <Loader className="animate-spin" size={16}/> : <RefreshCw size={16}/>} เริ่มดำเนินการ
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Delete by ID Tool Modal */}
      {showIdDeleteTool && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-left">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 text-center border-t-8 border-rose-500">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Trash2 className="text-rose-500" size={20}/> ลบข้อมูลฉุกเฉิน</h3>
                    <button onClick={() => setShowIdDeleteTool(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed text-left">
                    ป้อน <b>Order ID, INV-No, SYS-ID หรือ Firebase ID</b> เพื่อทำการลบออกจากระบบอย่างถาวร (รวมถึงคืนยอดสต็อกอัตโนมัติ)
                </p>
                <div className="text-left mb-6">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Document Reference ID</label>
                    <input 
                        type="text" 
                        value={targetIdToDelete} 
                        onChange={e => setTargetIdToDelete(e.target.value)} 
                        className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-rose-200" 
                        placeholder="เช่น INV-20241029-00001" 
                    />
                </div>
                <button 
                    onClick={forceDeleteById} 
                    disabled={!targetIdToDelete} 
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                    <Trash2 size={16}/> ยืนยันลบทิ้งถาวร
                </button>
            </div>
        </div>
      )}

      {/* Restore Backup Confirm Modal */}
      {showRestoreConfirm && restoreFileStats && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] p-8 max-w-3xl w-full shadow-2xl animate-in zoom-in-95 border-t-8 border-orange-500 flex flex-col max-h-[90vh]">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner">
                            <FileUp size={24}/>
                        </div>
                        <div className="text-left">
                            <h3 className="text-xl font-black text-slate-800">ยืนยันการกู้คืนข้อมูล (Restore)</h3>
                            <p className="text-xs font-mono text-slate-500 mt-1">ไฟล์: {restoreFileStats.fileName}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowRestoreConfirm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X/></button>
                </div>
                
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl mb-6 text-left">
                    <p className="text-sm font-bold text-rose-700 flex items-center gap-2 mb-1"><AlertTriangle size={16}/> คำเตือนร้ายแรง!</p>
                    <p className="text-xs text-rose-600 leading-relaxed">การกู้คืนข้อมูล จะทำการ <b>"ล้างข้อมูลปัจจุบันทั้งหมด"</b> ในระบบทิ้ง แล้วนำข้อมูลจากไฟล์ Backup นี้เข้าไปแทนที่ การกระทำนี้ไม่สามารถย้อนกลับได้ กรุณาตรวจสอบข้อมูลในไฟล์ Backup ให้แน่ใจก่อนกดยืนยัน</p>
                </div>

                {/* --- Search Box for Restore Preview --- */}
                <div className="relative mb-4 text-left">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                    <input 
                        type="text" 
                        value={restoreSearchTerm}
                        onChange={e => setRestoreSearchTerm(e.target.value)}
                        placeholder="พิมพ์เพื่อค้นหาข้อมูลในไฟล์ Backup (ชื่อคู่ค้า, Order ID, ชื่อสินค้า...)" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-10 text-sm outline-none focus:ring-2 focus:ring-orange-200 transition-shadow"
                    />
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar border border-slate-200 rounded-2xl bg-slate-50 relative min-h-[250px]">
                    {restoreSearchTerm ? (
                        <table className="w-full text-xs text-left">
                            <thead className="bg-white text-slate-500 font-bold sticky top-0 border-b border-slate-200 shadow-sm">
                                <tr>
                                    <th className="p-3">หมวดหมู่</th>
                                    <th className="p-3">รหัส/อ้างอิง</th>
                                    <th className="p-3">รายละเอียด</th>
                                    <th className="p-3">วันที่</th>
                                    <th className="p-3 text-right">ยอดเงิน/ข้อมูล</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {restoreSearchResults.length > 0 ? restoreSearchResults.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-orange-50/50">
                                        <td className="p-3 font-bold text-indigo-600">{item.category}</td>
                                        <td className="p-3 font-mono text-slate-600">{item.id}</td>
                                        <td className="p-3 text-slate-800 font-medium truncate max-w-[200px]" title={item.detail}>{item.detail || '-'}</td>
                                        <td className="p-3 text-slate-500">{item.date ? formatDate(item.date) : '-'}</td>
                                        <td className="p-3 text-right font-black text-slate-700">{formatCurrency(item.amount)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold">ไม่พบข้อมูลที่ค้นหาในไฟล์ Backup นี้</td></tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase">รายรับ (Income)</p>
                                <p className="text-2xl font-black text-emerald-600 my-1">{restoreFileStats.incomeCount.toLocaleString()}</p>
                                <p className="text-[9px] text-slate-500">ข้อมูลล่าสุด: <br/>{restoreFileStats.latestIncomeDate.max ? formatDate(restoreFileStats.latestIncomeDate.max) : '-'}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase">รายจ่าย (Expense)</p>
                                <p className="text-2xl font-black text-rose-600 my-1">{restoreFileStats.expenseCount.toLocaleString()}</p>
                                <p className="text-[9px] text-slate-500">ข้อมูลล่าสุด: <br/>{restoreFileStats.latestExpenseDate.max ? formatDate(restoreFileStats.latestExpenseDate.max) : '-'}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase">บิล/เอกสาร (Invoice)</p>
                                <p className="text-2xl font-black text-indigo-600 my-1">{restoreFileStats.invoiceCount.toLocaleString()}</p>
                                <p className="text-[9px] text-slate-500">พร้อมดึงข้อมูลเข้าสู่ระบบ</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase">สต็อก (Inventory)</p>
                                <p className="text-2xl font-black text-amber-600 my-1">{restoreFileStats.stockCount.toLocaleString()}</p>
                                <p className="text-[9px] text-slate-500">พร้อมอัปเดตยอดยกมา</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowRestoreConfirm(false)} disabled={isRestoring} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors">
                        ยกเลิก
                    </button>
                    <button onClick={executeRestore} disabled={isRestoring} className="flex-[2] py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black shadow-lg transition-colors flex justify-center items-center gap-2">
                        {isRestoring ? <Loader className="animate-spin" size={18}/> : <FileUp size={18}/>} 
                        ยืนยันล้างข้อมูลและกู้คืน (Restore)
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* NEW: Backup Analysis / Preview Modal (ดูเฉยๆ ไม่ทับข้อมูล) */}
      {showBackupPreview && backupStats && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-left">
            <div className="bg-white rounded-[32px] p-8 max-w-4xl w-full shadow-2xl animate-in zoom-in-95 border-t-8 border-blue-500 flex flex-col max-h-[90vh]">
                <div className="flex items-start justify-between mb-6 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                            <Search size={28}/>
                        </div>
                        <div className="text-left">
                            <h3 className="text-xl font-black text-slate-800">ตรวจสอบข้อมูลในไฟล์ Backup</h3>
                            <p className="text-xs font-mono text-slate-500 mt-1">ไฟล์: {backupStats.fileName}</p>
                        </div>
                    </div>
                    <button onClick={() => {setShowBackupPreview(false); setBackupDataPreview(null);}} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-500"><X/></button>
                </div>

                {/* Search Input for Backup Data */}
                <div className="relative mb-4 text-left">
                    <Search className="absolute left-4 top-3 text-slate-400" size={18}/>
                    <input 
                        type="text" 
                        value={backupSearchTerm}
                        onChange={e => setBackupSearchTerm(e.target.value)}
                        placeholder="พิมพ์เพื่อค้นหาข้อมูลในไฟล์ Backup (ชื่อลูกค้า, Order ID, รายการสินค้า...)" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-700"
                    />
                    {backupSearchTerm && (
                        <button onClick={() => setBackupSearchTerm('')} className="absolute right-3 top-3 text-slate-400 hover:text-rose-500"><X size={16}/></button>
                    )}
                </div>

                {/* Data Viewer / Summary Grid */}
                <div className="flex-1 overflow-auto custom-scrollbar border border-slate-200 rounded-2xl bg-slate-50 relative min-h-[300px]">
                    {backupSearchTerm ? (
                        <table className="w-full text-xs text-left">
                            <thead className="bg-white text-slate-500 font-bold sticky top-0 border-b border-slate-200 shadow-sm z-10">
                                <tr>
                                    <th className="p-3 pl-4">หมวดหมู่</th>
                                    <th className="p-3">รหัส/อ้างอิง</th>
                                    <th className="p-3">รายละเอียด</th>
                                    <th className="p-3">วันที่</th>
                                    <th className="p-3 text-right pr-4">ยอดเงิน/ข้อมูล</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {backupSearchResults && backupSearchResults.length > 0 ? backupSearchResults.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="p-3 pl-4 font-bold text-blue-600">{item.category}</td>
                                        <td className="p-3 font-mono text-slate-600">{item.id}</td>
                                        <td className="p-3 text-slate-800 font-medium truncate max-w-[250px]" title={item.detail}>{item.detail || '-'}</td>
                                        <td className="p-3 text-slate-500">{item.date ? formatDate(item.date) : '-'}</td>
                                        <td className="p-3 pr-4 text-right font-black text-slate-700">{formatCurrency(item.amount)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold">ไม่พบข้อมูลที่ค้นหาในไฟล์ Backup นี้</td></tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                                <Info size={18} className="text-blue-500 shrink-0 mt-0.5"/>
                                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                    นี่คือหน้าพรีวิวข้อมูลในไฟล์ Backup เพื่อให้คุณสามารถค้นหาและตรวจสอบเอกสารย้อนหลังได้ 
                                    <b>โดยไม่มีผลกระทบใดๆ กับข้อมูลในระบบปัจจุบัน</b> (ใช้สำหรับการตรวจสอบ/อ้างอิงเท่านั้น)
                                </p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 transition-colors">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">รายรับ (Income)</p>
                                    <p className="text-3xl font-black text-emerald-600 my-1">{backupStats.incomeCount.toLocaleString()}</p>
                                    <p className="text-[9px] text-slate-500 mt-2 border-t border-slate-50 pt-2 font-medium">ล่าสุด: {backupStats.latestIncomeDate.max ? formatDate(backupStats.latestIncomeDate.max) : '-'}</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-rose-200 transition-colors">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">รายจ่าย (Expense)</p>
                                    <p className="text-3xl font-black text-rose-600 my-1">{backupStats.expenseCount.toLocaleString()}</p>
                                    <p className="text-[9px] text-slate-500 mt-2 border-t border-slate-50 pt-2 font-medium">ล่าสุด: {backupStats.latestExpenseDate.max ? formatDate(backupStats.latestExpenseDate.max) : '-'}</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-colors">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">เอกสารภาษี</p>
                                    <p className="text-3xl font-black text-indigo-600 my-1">{backupStats.invoiceCount.toLocaleString()}</p>
                                    <p className="text-[9px] text-slate-500 mt-2 border-t border-slate-50 pt-2 font-medium">พร้อมดึงข้อมูลเข้าสู่ระบบ</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-amber-200 transition-colors">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">คลังสินค้า</p>
                                    <p className="text-3xl font-black text-amber-600 my-1">{backupStats.stockCount.toLocaleString()}</p>
                                    <p className="text-[9px] text-slate-500 mt-2 border-t border-slate-50 pt-2 font-medium">บันทึกต้นทุนและสต็อก</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => {setShowBackupPreview(false); setBackupDataPreview(null);}} className="px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-lg transition-colors">
                        รับทราบและปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Restore Progress Modal */}
      {isRestoring && restoreProgress.total > 0 && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-6 text-left">
            <div className="bg-slate-900 border border-slate-700 rounded-[40px] p-10 max-w-2xl w-full shadow-2xl flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                    <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${(restoreProgress.current / restoreProgress.total) * 100}%` }}></div>
                </div>
                
                <div className="flex items-center gap-6 mb-8 text-left">
                    <div className="relative">
                        <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 text-orange-500">
                            <Database size={36} />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl animate-bounce">
                            <ArrowUp size={16} />
                        </div>
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">System Recovery in Progress</h3>
                        <p className="text-slate-400 text-sm font-medium">กำลังนำเข้าข้อมูลไปยังฐานข้อมูลหลัก กรุณาห้ามปิดเบราว์เซอร์หรือรีเฟรชหน้าต่างนี้โดยเด็ดขาด</p>
                    </div>
                </div>

                <div className="bg-black/40 rounded-2xl p-5 border border-slate-800 mb-8 font-mono text-xs text-left">
                    <div className="flex justify-between text-slate-400 mb-2">
                        <span>สถานะ: <span className="text-orange-400">{restoreProgress.status}</span></span>
                        <span>{restoreProgress.current.toLocaleString()} / {restoreProgress.total.toLocaleString()} Records</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                        <div className="bg-gradient-to-r from-orange-600 to-amber-400 h-full rounded-full transition-all duration-300 relative" style={{ width: `${(restoreProgress.current / restoreProgress.total) * 100}%` }}>
                            <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-[250px] bg-black/80 rounded-2xl border border-slate-700 p-4 font-mono text-[10px] sm:text-xs overflow-y-auto custom-scrollbar" ref={terminalRef}>
                    <div className="space-y-2 text-left">
                        {restoreLogs.map((log, idx) => (
                            <div key={idx} className={`flex gap-3 text-left ${log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : log.type === 'warn' ? 'text-amber-400' : 'text-indigo-300'}`}>
                                <span className="text-slate-600 shrink-0">[{log.time}]</span>
                                <span className="break-all">{log.msg}</span>
                            </div>
                        ))}
                        {restoreError && (
                            <div className="mt-4 p-3 bg-rose-900/30 border border-rose-500/50 rounded-xl text-rose-300 text-left">
                                <b>SYSTEM HALT:</b> {restoreError}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* NEW: Data Healer Modal */}
      {showHealerModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 border-t-8 border-teal-500 flex flex-col max-h-[85vh] text-left">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 text-left">
                        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Activity size={24}/>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">เครื่องมือซ่อมแซมฐานข้อมูล (Data Healer)</h3>
                            <p className="text-xs text-slate-500 font-medium">สแกนหาสต็อกคงค้างหรือข้อมูลที่เชื่อมโยงผิดพลาด</p>
                        </div>
                    </div>
                    <button onClick={() => setShowHealerModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar border border-slate-200 rounded-2xl p-6 bg-slate-50 text-left">
                    {orphanLots.length > 0 ? (
                        <>
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4 text-left">
                                <p className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-1"><AlertTriangle size={16}/> พบสต็อกผีหลอก (Orphan Batches) {orphanLots.length} รายการ!</p>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    ระบบตรวจพบรายการรับเข้าสต็อกที่ <span className="font-bold underline">อ้างอิงถึงบิลรายจ่ายที่ถูกลบทิ้งไปแล้ว</span> 
                                    ทำให้ยอดต้นทุนรวมและสต็อกในระบบเพี้ยน แนะนำให้กดปุ่ม <b>"ล้างสต็อกตกค้าง"</b> ด้านล่างเพื่อซ่อมแซมฐานข้อมูล
                                </p>
                            </div>
                            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl bg-white text-left custom-scrollbar">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                                        <tr>
                                            <th className="p-3 text-left">สินค้า (Product/SKU)</th>
                                            <th className="p-3 text-center">คงเหลือ (qty)</th>
                                            <th className="p-3 text-left">รหัสอ้างอิงที่หาไม่พบ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-left">
                                        {orphanLots.slice(0, 50).map((lot, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 text-left">
                                                <td className="p-3 text-left">
                                                    <p className="font-bold text-slate-700">{lot.productName}</p>
                                                    <p className="text-[10px] font-mono text-slate-400">SKU: {lot.sku || '-'}</p>
                                                </td>
                                                <td className="p-3 text-center font-black text-rose-500">{Number(lot.quantity) - Number(lot.sold)}</td>
                                                <td className="p-3 font-mono text-slate-400 text-left">{lot.parentExpenseId}</td>
                                            </tr>
                                        ))}
                                        {orphanLots.length > 50 && (
                                            <tr><td colSpan="3" className="p-3 text-center text-slate-500 font-bold bg-slate-50">...และรายการอื่นๆ อีก {orphanLots.length - 50} รายการ</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                            <CheckCircle size={64} className="text-emerald-400 mb-4 opacity-50"/>
                            <h4 className="text-lg font-black text-slate-700 mb-1">ฐานข้อมูลสมบูรณ์ดี 100%</h4>
                            <p className="text-sm font-medium">ไม่พบสต็อกค้างที่ผิดปกติ หรือข้อมูลที่เชื่อมโยงผิดพลาด</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-3 text-left">
                    <button onClick={() => setShowHealerModal(false)} className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
                        ปิดหน้าต่าง
                    </button>
                    {orphanLots.length > 0 && (
                        <button onClick={executeHeal} disabled={isHealing} className="px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2">
                            {isHealing ? <Loader className="animate-spin" size={18}/> : <Activity size={18}/>} 
                            {isHealing ? 'กำลังซ่อมแซม...' : 'ยืนยันล้างสต็อกตกค้าง'}
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Drive Upload Input references hidden */}
      <input type="file" className="hidden" ref={restoreFileRef} accept=".json" onChange={handleRestoreFileChange} />
      <input type="file" className="hidden" ref={backupPreviewFileRef} accept=".json" onChange={handlePreviewBackupChange} />

    </div>
  );
}
