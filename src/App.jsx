import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PieChart, Wallet, FileText, Calculator, Save, TrendingUp, TrendingDown, 
  Download, Trash2, Edit, Menu, X, Printer, 
  CheckCircle, Loader, User, Package, Search, Clock, List, Settings, PlusCircle, Tag,
  Store, Database, Image as ImageIcon, BarChart2, Activity, ShoppingBag, Eye, EyeOff, Inbox, XCircle, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, AlertTriangle, Calendar, Info, MapPin, Building, Layers, ArrowRightLeft, Percent, ClipboardList, Briefcase,
  Camera, Sparkles, ScanText, Zap, ChevronRight, Truck, Ticket, CreditCard, FileUp, Hash, Copy, FileCheck, Box, History, AlertCircle, ShoppingCart, Truck as TruckIcon,
  RefreshCw, Plus, FileSpreadsheet, DownloadCloud, Users, Layers as LayersIcon, Filter, ArrowRight, FileJson, FileType, SaveAll
} from 'lucide-react';

// --- Import Firebase ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, serverTimestamp, updateDoc, setDoc, getDocs, where, increment, writeBatch } from 'firebase/firestore';

// --- Configuration & Global Variables ---
const firebaseConfig = {
  apiKey: "AIzaSyC9kT4Pji_e-i3VCm1jlSoy0fBe1PLWHm0",
  authDomain: "merchant-tax-app.firebaseapp.com",
  projectId: "merchant-tax-app",
  storageBucket: "merchant-tax-app.firebasestorage.app",
  messagingSenderId: "168794198420",
  appId: "1:168794198420:web:d792a54ffac979dd95bf81"
};

const PROD_APP_ID = 'Data2026';
const TEST_APP_ID = 'Test2026';

const CONSTANTS = {
  IDS: { PROD: PROD_APP_ID, DEV: TEST_APP_ID },
  SHOPS: ['eats and use', 'bubee bubee', 'ไม่ระบุ'],
  CATEGORIES: {
    INCOME: ['รายได้จากการขายสินค้า', 'รายได้จากการให้บริการ', 'รายได้ค่านายหน้า/ตัวแทน', 'รายได้อื่นๆ (ดอกเบี้ย, เงินปันผล)'],
    EXPENSE: ['ค่าใช้จ่ายทั่วไป', 'ต้นทุนสินค้า', 'สินค้าเสียหาย/หมดอายุ', 'ค่าบริการ/จ้างทำของ', 'ค่าโฆษณา (ในประเทศ)', 'ค่าโฆษณา (ภ.พ.36)', 'ค่าธรรมเนียม Platform', 'ค่าขนส่ง', 'ค่าเช่า', 'เงินเดือน', 'ภาษี/เบี้ยปรับ', 'ส่วนลดร้านค้า'],
    STOCK: ['อาหารและเครื่องดื่ม', 'ของใช้ส่วนตัว', 'ผลิตภัณฑ์ในครัวเรือน', 'ผลิตภัณฑ์ดูแลผ้า', 'แม่และเด็ก', 'สุขภาพและความงาม', 'สัตว์เลี้ยง', 'ขนมและของว่าง', 'เครื่องปรุง/วัตถุดิบ', 'อื่นๆ']
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
        if (showToast) showToast("ดาวน์โหลดสำเร็จ", "success");
    } catch (e) { console.error(e); if (showToast) showToast("เกิดข้อผิดพลาดในการสร้าง PDF", "error"); }
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

// --- Main Sub Components ---

function Dashboard({ transactions, invoices }) {
  const [selectedChannel, setSelectedChannel] = useState('all');

  const analytics = useMemo(() => {
    const filteredTrans = transactions.filter(t => 
        selectedChannel === 'all' || 
        (t.channel || 'หน้าร้าน').toUpperCase() === selectedChannel.toUpperCase()
    );

    const inc = filteredTrans.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.total) || 0), 0);
    const exp = filteredTrans.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.total) || 0), 0);
    
    const unpaid = invoices.filter(inv => inv.status !== 'paid').reduce((s, inv) => s + (Number(inv.total) || 0), 0);
    return { inc, exp, net: inc - exp, unpaid };
  }, [transactions, invoices, selectedChannel]);

  return (
    <div className="space-y-6 animate-fadeIn text-left font-sarabun w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800 text-left">Performance Dashboard</h2>
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
            <StatCard title="รายรับรวม" value={analytics.inc} color="emerald" icon={<TrendingUp />} subtitle="รายได้สุทธิ" />
            <StatCard title="รายจ่ายรวม" value={analytics.exp} color="rose" icon={<TrendingDown />} subtitle="ต้นทุนและค่าใช้จ่าย" />
            <StatCard title="กำไรสุทธิ" value={analytics.net} color="indigo" icon={<Wallet />} subtitle="กำไรหลังหักรายจ่าย" />
            <StatCard title="ลูกหนี้ค้างชำระ" value={analytics.unpaid} color="amber" icon={<Clock />} subtitle="Pending Payments" />
        </div>
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-center min-h-[300px] w-full text-center">
            <div className="text-center text-slate-300">
                <PieChart size={64} className="mx-auto mb-4 opacity-20"/>
                <p className="font-bold">กราฟแสดงสัดส่วนรายจ่าย (กำลังประมวลผล...)</p>
            </div>
        </div>
    </div>
  );
}

function DataImporter({ appId, showToast, user }) {
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
        date: ['เวลาการชำระสินค้า', 'Payment Time'],
        price: ['ราคาขาย', 'Deal Price'],
        qty: ['จำนวน', 'Quantity'],
        transFee: ['Transaction Fee'],
        commFee: ['ค่าคอมมิชชั่น', 'Commission Fee'],
        servFee: ['ค่าบริการ', 'Service Fee'],
        shipping: ['ที่อยู่ในการจัดส่ง', 'Shipping Address'],
        buyer: ['ชื่อผู้รับ', 'Receiver Name'],
        product: ['ชื่อสินค้า', 'Product Name']
    },
    lazada: {
        orderId: ['Order No.', 'Order Number', 'เลขที่สั่งซื้อ'],
        status: ['Status', 'สถานะ'],
        date: ['Order Creation Date', 'วันที่สร้างคำสั่งซื้อ', 'วันที่ชำระเงิน'],
        price: ['Unit Price', 'ราคาต่อชิ้น', 'paid_price'],
        qty: ['Quantity', 'จำนวน'],
        transFee: ['Payment Fee', 'ค่าธุรกรรม'],
        commFee: ['Commission', 'ค่าคอมมิชชั่น'],
        servFee: ['Service Fee', 'ค่าธรรมเนียม'],
        shipping: ['Shipping Address', 'ที่อยู่จัดส่ง'],
        buyer: ['Customer Name', 'ชื่อลูกค้า'],
        product: ['Seller SKU', 'Product Name']
    },
    tiktok: {
        orderId: ['Order ID', 'หมายเลขคำสั่งซื้อ'],
        status: ['Order Status', 'สถานะ'],
        date: ['Payment Time', 'Order Creation Time', 'วันที่ชำระเงิน'],
        price: ['Product Price', 'ราคาขาย'],
        qty: ['Quantity', 'จำนวน'],
        transFee: ['Transaction Fee', 'ค่าธรรมเนียมธุรกรรม'],
        commFee: ['Platform Commission', 'ค่าคอมมิชชั่น'],
        servFee: ['Service Fee', 'ค่าธรรมเนียมบริการ'],
        shipping: ['Shipping Address', 'ที่อยู่จัดส่ง'],
        buyer: ['Buyer Name', 'ชื่อผู้ซื้อ'],
        product: ['Product Name', 'ชื่อสินค้า']
    }
  };

  const cleanNum = (val) => { if (typeof val === 'number') return val; if (!val) return 0; return parseFloat(String(val).replace(/[^0-9.-]+/g, "")) || 0; };
  
  const findVal = (row, kws) => { 
    if (!kws) return undefined;
    const k = Object.keys(row).find(x => kws.some(kw => x.replace(/\s/g, '').toLowerCase().includes(kw.replace(/\s/g, '').toLowerCase()))); 
    return k ? row[k] : undefined; 
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
        const raw = window.XLSX.utils.sheet_to_json(ws);
        const ordersMap = {};
        let skipped = 0; let totalAmt = 0; let totalFees = 0;

        const schema = PLATFORM_SCHEMAS[platform] || PLATFORM_SCHEMAS.shopee;

        raw.forEach(row => {
          const orderId = String(findVal(row, schema.orderId) || '');
          const status = String(findVal(row, schema.status) || '').toLowerCase();
          const isCompleted = status.includes('สำเร็จ') || status.includes('completed') || status.includes('delivered') || status.includes('shipped') || status === '';
          const dateVal = findVal(row, schema.date);
          
          if (!orderId || !isCompleted || !dateVal) { skipped++; return; }
          
          const price = cleanNum(findVal(row, schema.price));
          const qty = cleanNum(findVal(row, schema.qty)) || 1;
          const transFee = cleanNum(findVal(row, schema.transFee));
          const comm = cleanNum(findVal(row, schema.commFee));
          const serv = cleanNum(findVal(row, schema.servFee));
          const infra = parseFloat(fixedInfraFee || 0);
          
          const shippingAddress = findVal(row, schema.shipping);
          const buyerName = findVal(row, schema.buyer);

          if (!ordersMap[orderId]) {
            const rowTotalFees = transFee + comm + serv + infra;
            ordersMap[orderId] = { 
              type: 'income', date: normalizeDate(dateVal), orderId, 
              total: price * qty, 
              platformFee: rowTotalFees,
              transactionFee: transFee, infrastructureFee: infra, commissionFee: comm, serviceFee: serv,
              description: findVal(row, schema.product), channel: platform.toUpperCase(), category: 'รายได้จากการขายสินค้า', 
              items: [{ desc: `${findVal(row, schema.product)}`, qty, amount: price * qty, price, sellPrice: price, buyPrice: 0 }],
              partnerName: buyerName,
              shippingAddress: shippingAddress || '',
              partnerAddress: shippingAddress || '',
              grandTotal: (price * qty) - rowTotalFees
            };
            totalAmt += (price * qty); 
            totalFees += rowTotalFees;
          } else {
            ordersMap[orderId].total += (price * qty);
            ordersMap[orderId].grandTotal = ordersMap[orderId].total - ordersMap[orderId].platformFee;
            ordersMap[orderId].items.push({ 
              desc: `${findVal(row, schema.product)}`, qty, amount: price * qty, price, sellPrice: price, buyPrice: 0 
            });
            totalAmt += (price * qty);
          }
        });
        const final = Object.values(ordersMap);
        setImportedData(final);
        setStats({ totalRows: raw.length, processed: final.length, skipped, totalAmount: totalAmt, totalFees });
        showToast(`นำเข้าสำเร็จ ${final.length} รายการ`, 'success');
      } catch (e) { showToast("ไม่สามารถอ่านไฟล์ได้", "error"); }
    };
    reader.readAsBinaryString(file);
  };

  const saveToFirebase = async () => {
    if (!user || importedData.length === 0) return;
    setLoading(true);
    try {
      const batch = writeBatch(dbInstance);
      for (const item of importedData) {
        const docRef = doc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'transactions_income')); 
        batch.set(docRef, { ...item, createdAt: serverTimestamp(), userId: user.uid });
      }
      await batch.commit();
      showToast(`บันทึกเรียบร้อย ${importedData.length} รายการ`, "success");
      setImportedData([]);
    } catch (e) { showToast("Error: " + e.message, "error"); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sarabun text-left pb-10 w-full h-full">
      <div className="flex justify-between items-center text-left">
        <h3 className="text-2xl font-bold flex items-center gap-2 text-left"><Sparkles className="text-indigo-600"/> Import Data</h3>
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
          <p className="text-xs font-black text-indigo-600 uppercase tracking-widest text-left">Configuration ({platform.toUpperCase()} Schema)</p>
          <div className="flex items-center gap-4 text-left">
            <div className="flex items-center gap-3 text-left">
              <label className="text-sm font-bold text-slate-600 whitespace-nowrap text-left">ค่าธรรมเนียมโครงสร้างพื้นฐานแพลตฟอร์ม:</label>
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
              <p className="text-[10px] text-slate-400 font-medium text-left">/ หมายเลขคำสั่งซื้อ (คำนวณ 1 ครั้งต่อออเดอร์)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col gap-4 text-left">
          <div className="space-y-2 text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">Upload Excel File ({platform.toUpperCase()})</p>
            <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current.click()} className="w-full py-10 border-2 border-dashed border-indigo-200 rounded-3xl flex flex-col items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors text-center">
              <FileUp size={48} className="mb-2"/>
              <p className="font-bold">คลิกเพื่ออัปโหลดไฟล์ Excel</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase">Supports .xlsx, .xls</p>
            </button>
          </div>
          {stats.processed > 0 && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2 text-left">
               <p className="text-[10px] font-bold text-emerald-600 uppercase text-left">Import Stats</p>
               <div className="grid grid-cols-2 gap-2 text-xs text-left">
                  <p className="text-slate-500 text-left">สำเร็จ:</p><p className="font-bold text-emerald-700 text-right">{stats.processed} รายการ</p>
                  <p className="text-slate-500 text-left">ข้าม/ผิดพลาด:</p><p className="font-bold text-rose-500 text-right">{stats.skipped} รายการ</p>
                  <div className="col-span-2 border-t border-emerald-100 my-1 text-center"></div>
                  <p className="text-slate-500 font-bold text-left">รายรับสุทธิ:</p><p className="font-bold text-indigo-600 text-right">{formatCurrency(stats.totalAmount - stats.totalFees)}</p>
               </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-2 bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col text-left">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50 text-left">
            <div className="flex items-center gap-2 text-left">
               <span className="font-bold text-slate-800 text-left">ตัวอย่างข้อมูล</span>
               <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{importedData.length} Items</span>
            </div>
            {importedData.length > 0 && (
              <button 
                onClick={saveToFirebase} 
                disabled={loading} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all disabled:opacity-50 text-center"
              >
                {loading ? <Loader className="animate-spin" size={14}/> : <Save size={14}/>}
                บันทึกลงระบบ
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto max-h-[400px] text-left">
            <table className="w-full text-xs text-left">
              <thead className="bg-white text-slate-400 font-bold uppercase tracking-wider sticky top-0 border-b text-left">
                <tr>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Order ID / Description</th>
                  <th className="p-4 text-right">Net Income (฿)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-left">
                {importedData.length === 0 ? (
                  <tr><td colSpan="3" className="p-10 text-center text-slate-300 font-bold text-center">กรุณาเลือกประเภทแพลตฟอร์มและอัปโหลดไฟล์เพื่อเริ่มต้น</td></tr>
                ) : importedData.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 group text-left">
                    <td className="p-4 text-slate-500 whitespace-nowrap text-left">{formatDate(it.date)}</td>
                    <td className="p-4 text-left">
                      <p className="font-bold text-slate-700 text-left">{it.orderId}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[300px] text-left">{it.description}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-black text-indigo-600 text-right">{formatCurrency(it.grandTotal)}</p>
                      <p className="text-[9px] text-slate-400 text-right">หักค่าธรรมเนียม: {formatCurrency(it.platformFee)}</p>
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

function StockManager({ appId, stockBatches, showToast, user }) {
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
    productName: '', skuManual: '', category: CONSTANTS.CATEGORIES.STOCK[0], quantity: '', costPerUnit: 0, sellPrice: 0, date: formatDateISO(new Date())
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
                  const foundKey = keys.find(k => {
                    const cleanKey = k.toString().trim().toLowerCase().replace(/\s/g, '');
                    return keywords.some(kw => {
                      const cleanKw = kw.toLowerCase().replace(/\s/g, '');
                      return cleanKey === cleanKw || cleanKey.includes(cleanKw) || cleanKw.includes(cleanKey);
                    });
                  });
                  return foundKey ? row[foundKey] : undefined;
                };

                jsonData.forEach((row) => {
                    const name = findInRow(row, ['ชื่อสินค้า', 'productname', 'name']);
                    const skuInput = findInRow(row, ['เลข SKU', 'รหัสตัวเลือกสินค้า', 'sku']);
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
                          category: 'Imported' 
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
        createdAt: serverTimestamp() 
      };

      await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches'), batchData);
      
      if (totalCost > 0) {
        await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'transactions_expense'), { 
          type: 'expense', 
          category: 'ต้นทุนสินค้า', 
          description: `ซื้อสต็อก: ${newStock.productName}`, 
          total: totalCost, 
          date: normalizeDate(newStock.date), 
          userId: user.uid, 
          createdAt: serverTimestamp(), 
          isFromInventory: true 
        });
      }

      showToast("บันทึกสินค้าใหม่สำเร็จ", "success");
      setShowAddStockModal(false);
      setNewStock({ productName: '', skuManual: '', category: CONSTANTS.CATEGORIES.STOCK[0], quantity: '', costPerUnit: 0, sellPrice: 0, date: formatDateISO(new Date()) });
    } catch (e) { showToast("บันทึกไม่สำเร็จ", "error"); }
    setIsProcessing(false);
  };

  const handleDeleteInventory = async () => {
    if (!deleteStockConfirm || !user) return;
    setIsProcessing(true);
    try {
      const batchWriter = writeBatch(dbInstance);
      deleteStockConfirm.batches.forEach(b => {
        const docRef = doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches', b.id);
        batchWriter.delete(docRef);
      });
      await batchWriter.commit();
      showToast(`ลบ "${deleteStockConfirm.name}" เรียบร้อย`, "success");
      setDeleteStockConfirm(null);
    } catch (e) { showToast("ลบไม่สำเร็จ", "error"); }
    setIsProcessing(false);
  };

  const handleDeleteBatch = async () => {
    if (!deleteBatchConfirm || !user) return;
    setIsProcessing(true);
    try {
      await deleteDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches', deleteBatchConfirm.id));
      showToast("ลบรายการ Lot สำเร็จ", "success");
      setDeleteBatchConfirm(null);
      if (viewHistory && viewHistory.batches.length <= 1) setViewHistory(null);
    } catch (e) { showToast("ลบไม่สำเร็จ", "error"); }
    setIsProcessing(false);
  };

  const inventory = useMemo(() => {
    const map = {};
    stockBatches.forEach(batch => {
      const name = batch.productName || 'ไม่ระบุชื่อสินค้า';
      if (!map[name]) { map[name] = { name, sku: batch.sku || '-', totalQty: 0, totalValue: 0, batches: [], category: batch.category || 'ทั่วไป' }; }
      const remaining = Number(batch.quantity) - Number(batch.sold || 0);
      if (remaining >= 0) {
        map[name].totalQty += remaining;
        map[name].totalValue += (remaining * Number(batch.costPerUnit || 0));
        map[name].batches.push({ ...batch, remaining });
      }
    });
    // แสดงสินค้าทั้งหมดที่มี totalQty ตั้งแต่ 0 ขึ้นไป เพื่อแสดงรายการ Master
    return Object.values(map)
      .filter(item => item.totalQty >= 0) 
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a,b) => b.totalQty - a.totalQty);
  }, [stockBatches, searchTerm]);

  return (
    <div className="space-y-6 animate-fadeIn font-sarabun text-left w-full h-full pb-20">
      <div className="flex justify-between items-center flex-wrap gap-4 text-left">
        <h3 className="text-2xl font-bold flex items-center gap-2 text-left text-slate-800"><Box className="text-indigo-600"/> คลังสินค้า (FIFO)</h3>
        <div className="flex items-center gap-2 text-left">
          <div className="relative w-64 text-left">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
            <input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800" placeholder="ค้นชื่อสินค้า หรือ SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
          </div>
          <input type="file" ref={importFileInputRef} hidden accept=".xlsx, .xls" onChange={handleStockImport} />
          <button onClick={() => importFileInputRef.current.click()} disabled={isProcessing} className="bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all text-center">
            {isProcessing ? <Loader className="animate-spin" size={18}/> : <FileSpreadsheet size={18}/>} Import Excel
          </button>
          <button onClick={() => setShowAddStockModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all text-center">
            <Plus size={18}/> เพิ่มรายชิ้น
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="col-span-2 bg-white rounded-[40px] border shadow-sm overflow-hidden flex flex-col h-[600px] text-left">
          <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center text-left">
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-widest text-left">Inventory List</h4>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">{inventory.length} SKUs</span>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar text-left">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-400 text-[10px] font-bold uppercase sticky top-0 border-b z-10 text-left">
                <tr><th className="p-5 text-left">SKU / Product Name</th><th className="p-5 text-center">Category</th><th className="p-5 text-right">Remaining Qty</th><th className="p-5 text-right">Inv. Value</th><th className="p-5 text-center">Manage</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-left">
                {inventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors cursor-pointer group text-left">
                        <td className="p-5 text-left" onClick={() => setViewHistory(item)}>
                        <p className="text-[10px] font-mono text-indigo-500 font-bold mb-0.5 text-left">{item.sku}</p>
                        <p className="font-bold text-slate-800 text-left">{item.name}</p>
                        </td>
                        <td className="p-5 text-center" onClick={() => setViewHistory(item)}>
                            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold text-center">{item.category}</span>
                        </td>
                        <td className="p-5 text-right font-black text-slate-900 text-right" onClick={() => setViewHistory(item)}>{item.totalQty.toLocaleString()}</td>
                        <td className="p-5 text-right font-bold text-indigo-600 text-right" onClick={() => setViewHistory(item)}>{formatCurrency(item.totalValue)}</td>
                        <td className="p-5 text-center">
                            <div className="flex justify-center gap-2 text-center">
                            <button onClick={(e) => { e.stopPropagation(); openEditCategory(item); }} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-amber-500 text-center" title="แก้ไขหมวดหมู่"><Edit size={16}/></button>
                            <button onClick={(e) => { e.stopPropagation(); setViewHistory(item); }} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 text-center" title="ดูประวัติ Lot"><LayersIcon size={16}/></button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteStockConfirm(item); }} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-rose-600 text-center" title="ลบสินค้า"><Trash2 size={16}/></button>
                            </div>
                        </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-6 text-left"><div className="bg-slate-900 p-8 rounded-[40px] shadow-xl text-white relative overflow-hidden text-left"><div className="absolute top-0 right-0 p-8 opacity-10 text-right"><Box size={120}/></div><p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 text-left">Total Assets Value</p><h2 className="text-4xl font-black mb-2 text-left">{formatCurrency(inventory.reduce((s,i)=>s+i.totalValue, 0))}</h2><div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4 text-left"><div className="text-left"><p className="text-[10px] text-slate-500 uppercase font-bold text-left">Total Units</p><p className="text-xl font-bold text-left">{inventory.reduce((s,i)=>s+i.totalQty, 0).toLocaleString()}</p></div><div className="text-left"><p className="text-[10px] text-slate-500 uppercase font-bold text-left">Total Batches</p><p className="text-xl font-bold text-left">{stockBatches.length}</p></div></div></div></div>
      </div>
      {showAddStockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[600] flex items-center justify-center p-4 text-left">
           <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh] text-left">
              <div className="p-6 border-b flex justify-between items-center text-left"><h3 className="text-xl font-black text-slate-800 flex items-center gap-2 text-left"><PlusCircle className="text-indigo-600"/> ลงรายการใหม่</h3><button onClick={() => setShowAddStockModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-center"><X/></button></div>
              <form onSubmit={handleAddStock} className="p-8 space-y-6 overflow-y-auto text-left">
                 <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-400 text-left">ชื่อสินค้า</label>
                    <input required value={newStock.productName} onChange={e=>setNewStock({...newStock, productName: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border-0 font-bold outline-none text-slate-800" placeholder="ชื่อสินค้า..." />
                 </div>
                 <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-bold uppercase text-slate-400 text-left">เลข SKU / บาร์โค้ด</label>
                        <input value={newStock.skuManual} onChange={e=>setNewStock({...newStock, skuManual: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border-0 font-mono text-sm font-bold outline-none text-indigo-600" placeholder="ระบุ SKU..." />
                    </div>
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-bold uppercase text-slate-400 text-left">หมวดหมู่</label>
                        <select value={newStock.category} onChange={e=>setNewStock({...newStock, category: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border-0 font-bold outline-none text-slate-700">
                            {CONSTANTS.CATEGORIES.STOCK.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-4 text-left">
                    <div className="space-y-2 bg-emerald-50 p-4 rounded-3xl border border-emerald-100 text-left">
                        <label className="text-[10px] font-bold uppercase text-emerald-600 text-left">จำนวนรับเข้า</label>
                        <input type="number" value={newStock.quantity} onChange={e=>setNewStock({...newStock, quantity: e.target.value})} className="w-full bg-white p-3 rounded-xl border-0 text-lg font-black text-center text-emerald-700 outline-none" placeholder="0" />
                    </div>
                    <div className="space-y-2 bg-indigo-50 p-4 rounded-3xl border border-indigo-100 text-left">
                        <label className="text-[10px] font-bold uppercase text-indigo-600 text-left">ราคาต้นทุน</label>
                        <input type="number" step="0.01" value={newStock.costPerUnit} onChange={e=>setNewStock({...newStock, costPerUnit: e.target.value})} className="w-full bg-white p-3 rounded-xl border-0 text-lg font-black text-center text-indigo-700 outline-none" placeholder="0.00" />
                    </div>
                    <div className="space-y-2 bg-rose-50 p-4 rounded-3xl border border-rose-100 text-left">
                        <label className="text-[10px] font-bold uppercase text-rose-600 text-left">ราคาขาย</label>
                        <input type="number" step="0.01" value={newStock.sellPrice} onChange={e=>setNewStock({...newStock, sellPrice: e.target.value})} className="w-full bg-white p-3 rounded-xl border-0 text-lg font-black text-center text-rose-700 outline-none" placeholder="0.00" />
                    </div>
                 </div>
                 <div className="pt-4 text-center">
                    <button type="submit" disabled={isProcessing} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 text-center disabled:opacity-50 disabled:cursor-not-allowed">
                        {isProcessing ? <Loader className="animate-spin" size={24}/> : <Save size={24}/>} 
                        {isProcessing ? 'กำลังบันทึก...' : 'บันทึกเข้าคลังสินค้า'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
      {viewHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[40px] w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 text-left">
            <div className="p-6 border-b flex justify-between items-center text-left"><div><h3 className="text-xl font-bold text-slate-800 text-left">Lot History: {viewHistory.name}</h3><p className="text-xs text-slate-400 text-left">รายละเอียดต้นทุนรอบการซื้อ</p></div><button onClick={() => setViewHistory(null)} className="p-2 hover:bg-slate-100 rounded-full text-center"><X/></button></div>
            <div className="flex-1 overflow-auto p-6 space-y-4 text-left">
              {viewHistory.batches
                .filter(b => b.quantity > 0) 
                .sort((a,b)=>normalizeDate(a.date)-normalizeDate(b.date))
                .map((b, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4 text-left">
                    <div className="flex justify-between items-start text-left">
                        <div>
                            <p className="text-[10px] font-bold text-indigo-600 uppercase text-left">Lot {i+1} - รับเข้า {formatDate(b.date)}</p>
                            <p className="text-base font-black text-indigo-600 text-left">{formatCurrency(b.costPerUnit)} / หน่วย</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">ราคาขายตั้งไว้: {formatCurrency(b.sellPrice || 0)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-xs text-slate-400 font-bold text-right">สินค้าคงเหลือ</p>
                                <p className="text-xl font-black text-slate-900 text-right">{b.remaining} / {b.quantity}</p>
                            </div>
                            <button onClick={() => setDeleteBatchConfirm(b)} className="p-2 text-rose-300 hover:text-rose-600 hover:bg-white rounded-xl transition-all" title="ลบเฉพาะรายการนี้"><Trash2 size={18}/></button>
                        </div>
                    </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t bg-slate-50 rounded-b-[40px] text-center"><button onClick={()=>setViewHistory(null)} className="w-full py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 text-center">ปิด</button></div>
          </div>
        </div>
      )}
      {showEditCategoryModal && targetProductEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[700] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[32px] p-8 max-sm w-full text-center shadow-2xl animate-in zoom-in-95"><div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 text-center"><Edit size={32}/></div><h3 className="text-xl font-bold mb-2 text-center text-slate-800">แก้ไขหมวดหมู่สินค้า</h3><p className="text-sm font-bold text-indigo-600 mb-6 text-center">{targetProductEdit.name}</p><div className="text-left mb-6"><label className="text-xs font-bold text-slate-400 uppercase mb-2 block">เลือกหมวดหมู่ใหม่</label><select value={tempCategory} onChange={(e) => setTempCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100">{CONSTANTS.CATEGORIES.STOCK.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div><div className="flex gap-3 text-center"><button onClick={() => setShowEditCategoryModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button><button onClick={handleUpdateCategory} disabled={isProcessing} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 text-center flex items-center justify-center gap-2">{isProcessing && <Loader className="animate-spin" size={16}/>} บันทึก</button></div></div>
        </div>
      )}
      {deleteStockConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[700] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[32px] p-8 max-sm w-full text-center shadow-2xl animate-in zoom-in-95"><div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-center"><Trash2 size={32}/></div><h3 className="text-xl font-bold mb-2 text-center text-slate-800">ยืนยันลบสินค้า?</h3><p className="text-xs text-slate-400 mb-6 text-center">คุณกำลังจะลบ <b>"{deleteStockConfirm.name}"</b><br/>การกระทำนี้จะลบประวัติล็อตสินค้าทั้งหมดของรายการนี้ และไม่สามารถกู้คืนได้</p><div className="flex gap-3 text-center"><button onClick={() => setDeleteStockConfirm(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button><button onClick={handleDeleteInventory} disabled={isProcessing} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100 text-center flex items-center justify-center gap-2">{isProcessing && <Loader className="animate-spin" size={16}/>} ยืนยันลบ</button></div></div>
        </div>
      )}
      {deleteBatchConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[800] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[32px] p-8 max-sm w-full text-center shadow-2xl animate-in zoom-in-95"><div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-center"><AlertCircle size={32}/></div><h3 className="text-xl font-bold mb-2 text-center text-slate-800">ยืนยันลบ Lot นี้?</h3><p className="text-xs text-slate-400 mb-6 text-center">คุณกำลังจะลบรายการซื้อเข้าเมื่อวันที่ <b>{formatDate(deleteBatchConfirm.date)}</b><br/>จำนวน {deleteBatchConfirm.quantity} หน่วย</p><div className="flex gap-3 text-center"><button onClick={() => setDeleteBatchConfirm(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button><button onClick={handleDeleteBatch} disabled={isProcessing} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100 text-center flex items-center justify-center gap-2">{isProcessing && <Loader className="animate-spin" size={16}/>} ยืนยันลบ</button></div></div>
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

  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem('merchant_seller_info') || '{}'); setSellerInfo(saved); } catch (e) { setSellerInfo({}); } }, []);

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

  const handleDeleteRecord = async () => {
    if (!deleteConfirm || !user) return;
    try {
      const coll = deleteConfirm.sourceType === 'batch' ? 'inventory_batches' : (deleteConfirm.sourceType === 'income' ? 'transactions_income' : 'transactions_expense');
      await deleteDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', coll, deleteConfirm.id));
      showToast("ลบข้อมูลสำเร็จ", "success");
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
    });
  }, [invoices, startDate, endDate, selectedBranch]);

  const filteredExpenses = useMemo(() => {
    return transactions.filter(t => {
      const d = normalizeDate(t.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      const dateMatch = d >= start && d <= end;
      const branchMatch = selectedBranch === 'all' || selectedBranch === '00000';
      return t.type === 'expense' && dateMatch && branchMatch;
    });
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
        movements.push({ 
          id: b.id,
          sourceType: 'batch',
          date: d, 
          sku: b.sku || '-', 
          name: b.productName, 
          type: 'IN (ซื้อเข้า)', 
          qty: Number(b.quantity), 
          price: Number(b.costPerUnit),
          total: Number(b.quantity) * Number(b.costPerUnit)
        }); 
      } 
    });

    transactions.filter(t => t.type === 'income').forEach(t => { 
      const d = normalizeDate(t.date); 
      if (d >= start && d <= end) { 
        t.items?.forEach(item => { 
          movements.push({ 
            id: t.id,
            sourceType: 'income',
            date: d, 
            sku: t.orderId || '-', 
            name: item.desc, 
            type: 'OUT (ขายออก)', 
            qty: Number(item.qty), 
            price: Number(item.sellPrice),
            total: Number(item.qty) * Number(item.sellPrice)
          }); 
        }); 
      } 
    });

    return movements.sort((a, b) => b.date - a.date);
  }, [stockBatches, transactions, startDate, endDate]);

  const vatAnalysis = useMemo(() => {
    const outputVat = filteredInvoices.reduce((s, inv) => s + ((Number(inv.vat) || 0) * (inv.docType === 'credit_note' ? -1 : 1)), 0);
    const outputBase = filteredInvoices.reduce((s, inv) => s + ((Number(inv.preVat) || 0) * (inv.docType === 'credit_note' ? -1 : 1)), 0);
    const inputVat = filteredExpenses.reduce((s, t) => s + (t.isNonCreditableVat ? 0 : ((Number(t.total) || 0) * 7 / 107)), 0);
    const inputBase = filteredExpenses.reduce((s, t) => s + (t.isNonCreditableVat ? 0 : ((Number(t.total) || 0) * 100 / 107)), 0);
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
      const total = Number(row.total) || 0; 
      const vat = row.isNonCreditableVat ? 0 : total * 7 / 107; 
      const base = row.isNonCreditableVat ? total : total * 100 / 107; 
      return { base: acc.base + base, vat: acc.vat + vat, total: acc.total + total }; 
    }, { base: 0, vat: 0, total: 0 });
  }, [filteredExpenses]);

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
      const body = filteredInvoices.map((inv, i) => { 
        const mult = inv.docType === 'credit_note' ? -1 : 1; 
        return [ i + 1, formatDate(inv.date), inv.invNo + (inv.docType === 'credit_note' ? " (ใบลดหนี้)" : ""), inv.customerName, inv.taxId || '-', (inv.branch === '00000' || !inv.branch) ? 'สำนักงานใหญ่' : `สาขา ${inv.branch}`, toFixedNum((inv.preVat || 0) * mult), toFixedNum((inv.vat || 0) * mult), toFixedNum((inv.total || 0) * mult) ]; 
      });
      const footer = [ "รวมทั้งสิ้น", "", "", "", "", "", toFixedNum(salesFooter.base), toFixedNum(salesFooter.vat), toFixedNum(salesFooter.total) ];
      dataRows = [...headerRows, tableHeader, ...body, footer];
    } else if (reportTab === 'purchase') {
      fileName = `Purchase_Tax_Report_${startDate}.xlsx`;
      const tableHeader = ["ลำดับ", "วันที่", "เลขที่ใบกำกับภาษี", "ชื่อผู้ขายสินค้า/ผู้ให้บริการ", "เลขผู้เสียภาษี", "สถานประกอบการ", "มูลค่าสินค้า/บริการ", "ภาษีมูลค่าเพิ่ม", "ยอดรวม"];
      const body = filteredExpenses.map((row, i) => {
        const total = Number(row.total) || 0;
        const vat = row.isNonCreditableVat ? 0 : total * 7 / 107;
        const base = row.isNonCreditableVat ? total : total * 100 / 107;
        return [ i + 1, formatDate(row.date), row.orderId || '-', row.partnerName || '-', row.partnerTaxId || '-', (row.partnerBranch === '00000' || !row.partnerBranch) ? 'สำนักงานใหญ่' : `สาขา ${row.partnerBranch}`, toFixedNum(base), toFixedNum(vat), toFixedNum(total) ];
      });
      const footer = [ "รวมทั้งสิ้น", "", "", "", "", "", toFixedNum(purchaseFooter.base), toFixedNum(purchaseFooter.vat), toFixedNum(purchaseFooter.total) ];
      dataRows = [...headerRows, tableHeader, ...body, footer];
    } else if (reportTab === 'inventory') {
      fileName = `Stock_Movement_${startDate}.xlsx`;
      const tableHeader = ["วันที่", "SKU / Ref", "รายการสินค้า", "ประเภท", "จำนวน", "ราคาต่อหน่วย", "มูลค่ารวม"];
      dataRows = [...headerRows, tableHeader, ...filteredMovement.map(m => [formatDate(m.date), m.sku, m.name, m.type, m.qty, toFixedNum(m.price), toFixedNum(m.total)])];
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
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start gap-6 relative group">
        <button onClick={openEditModal} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors no-print"><Edit size={18} /></button>
        <div className="space-y-3 flex-1 text-left">
           <div className="flex items-center gap-3 text-left"><div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg"><Store size={24}/></div><h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-left">{sellerInfo.sellerName || 'ร้านค้า (ยังไม่ระบุ)'}</h2></div>
           <div className="pl-1 space-y-1 text-left">
              <p className="text-xs text-slate-500 font-medium text-left">ที่อยู่จดทะเบียน: {[sellerInfo.sellerAddress, fmtAddr.sub(sellerInfo.sellerSubDistrict), fmtAddr.dist(sellerInfo.sellerDistrict), fmtAddr.prov(sellerInfo.sellerProvince), sellerInfo.sellerZipCode].filter(Boolean).join(' ')}</p>
              <div className="flex items-center gap-4 pt-2 text-left">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase text-left">TAX Identification Number</span>
                  <p className="text-sm font-black text-indigo-600 tracking-wider text-left">{sellerInfo.sellerTaxId || '-'}</p>
                </div>
                <div className="w-px h-8 bg-slate-100"></div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase text-left">Branch Code</span>
                  <p className="text-sm font-black text-slate-700 text-left">{sellerInfo.sellerBranchId === '00000' ? 'สำนักงานใหญ่ (00000)' : `สาขาที่ ${sellerInfo.sellerBranchId || '-'}`}</p>
                </div>
              </div>
           </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1 mt-8 md:mt-0">
          <h1 className="text-2xl font-black text-indigo-600 uppercase tracking-tight">
            {reportTab === 'sales' ? 'รายงานภาษีขาย' : reportTab === 'purchase' ? 'รายงานภาษีซื้อ' : 'ทะเบียนคุมสินค้า'}
          </h1>
          <p className="text-sm font-bold text-slate-400 mb-2">ประจำเดือน {getThaiMonthYear(startDate)}</p>
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 no-print">
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-white border-0 rounded-xl px-3 py-2 text-xs font-bold outline-none shadow-sm shrink-0"/>
            <ArrowRight size={14} className="text-slate-300 shrink-0"/>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-white border-0 rounded-xl px-3 py-2 text-xs font-bold outline-none shadow-sm shrink-0"/>
          </div>
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
            <ClipboardList size={16} className="text-indigo-600"/>
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
      </div>

      <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden flex flex-col min-h-[500px] text-left">
        <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center text-left">
          <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm text-left">รายละเอียดรายการตามช่วงเวลา</h4>
          <button onClick={handleExportExcel} disabled={isExporting} className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-white px-4 py-2 rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 transition-all disabled:opacity-50 no-print text-center">
            {isExporting ? <Loader size={14} className="animate-spin"/> : <FileSpreadsheet size={14}/>} Export Excel (สรรพากร)
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
              <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 text-left">
                <tr>
                  <td colSpan="5" className="p-5 text-right uppercase tracking-widest text-xs opacity-60 text-right">รวมทั้งสิ้น (Grand Total)</td>
                  <td className="p-5 text-right text-white text-right">{formatCurrency(salesFooter.base)}</td>
                  <td className="p-5 text-right text-indigo-400 text-right">{formatCurrency(salesFooter.vat)}</td>
                </tr>
              </tfoot>
            </table>
          )}
          
          {reportTab === 'purchase' && (
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-400 text-[10px] font-bold uppercase sticky top-0 border-b z-10 text-left">
                <tr>
                  <th className="p-5 text-left">วันที่</th>
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
                  const total = Number(row.total) || 0;
                  const vat = row.isNonCreditableVat ? 0 : total * 7 / 107;
                  const base = row.isNonCreditableVat ? total : total * 100 / 107;
                  return (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors text-left">
                      <td className="p-5 text-xs text-slate-500 whitespace-nowrap text-left">{formatDate(row.date)}</td>
                      <td className="p-5 font-bold text-slate-800 text-left">{row.orderId || '-'}</td>
                      <td className="p-5 text-left">
                        <p className="font-bold text-left">{row.partnerName || '-'}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1 text-left">{row.description}</p>
                      </td>
                      <td className="p-5 font-mono text-xs text-left">{row.partnerTaxId || '-'}</td>
                      <td className="p-5 text-[10px] font-bold text-slate-500 text-left">{(row.partnerBranch === '00000' || !row.partnerBranch) ? 'สำนักงานใหญ่' : `สาขาที่ ${row.partnerBranch}`}</td>
                      <td className="p-5 text-right font-medium text-right">{formatCurrency(base)}</td>
                      <td className="p-5 text-right text-rose-500 font-bold text-right">{formatCurrency(vat)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 text-left">
                <tr>
                  <td colSpan="5" className="p-5 text-right uppercase tracking-widest text-xs opacity-60 text-right">รวมทั้งสิ้น (Grand Total)</td>
                  <td className="p-5 text-right text-white text-right">{formatCurrency(purchaseFooter.base)}</td>
                  <td className="p-5 text-right text-rose-400 text-right">{formatCurrency(purchaseFooter.vat)}</td>
                </tr>
              </tfoot>
            </table>
          )}

          {reportTab === 'inventory' && (
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-400 text-[10px] font-bold uppercase sticky top-0 border-b z-10 text-left">
                <tr><th className="p-5 text-left">วันที่</th><th className="p-5 text-left">Ref / SKU</th><th className="p-5 text-left">รายการสินค้า</th><th className="p-5 text-left">ประเภท</th><th className="p-5 text-center">จำนวน</th><th className="p-5 text-right">ราคา/หน่วย</th><th className="p-5 text-right">มูลค่ารวม</th><th className="p-5 text-center no-print">จัดการ</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-left">
                {filteredMovement.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors text-left">
                    <td className="p-5 text-xs text-slate-500 whitespace-nowrap text-left">{formatDate(m.date)}</td>
                    <td className="p-5 font-mono text-[10px] text-left">{m.sku}</td>
                    <td className="p-5 font-bold text-left">{m.name}</td>
                    <td className="p-5 text-left">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${m.type.includes('IN') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="p-5 text-center font-black text-center">{m.qty}</td>
                    <td className="p-5 text-right text-right">{formatCurrency(m.price)}</td>
                    <td className="p-5 text-right font-black text-right">{formatCurrency(m.total)}</td>
                    <td className="p-5 text-center no-print text-center">
                       <button onClick={() => setDeleteConfirm(m)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors text-center" title="ลบรายการต้นทาง"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
                {filteredMovement.length === 0 && (
                  <tr><td colSpan="8" className="p-20 text-center text-slate-300 font-bold text-center">ไม่พบความเคลื่อนไหวในช่วงเวลาที่เลือก</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[32px] p-8 max-sm w-full text-center shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-center">
              <Trash2 size={32}/>
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-800 text-center">ลบข้อมูลต้นทาง?</h3>
            <p className="text-xs text-slate-400 mb-6 text-center">
              ระบบจะลบข้อมูล <b>{deleteConfirm.name}</b> ออกจากฐานข้อมูล ({deleteConfirm.sourceType === 'batch' ? 'คลังสินค้า' : 'รายการขาย'}) และไม่สามารถกู้คืนได้
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
                <div className="text-left"><label className="text-xs font-bold block mb-1 text-left">เลขผู้เสียภาษี</label><input className="w-full border rounded-lg p-2.5 text-sm font-mono text-left" value={tempSellerData.sellerTaxId} onChange={e=>setTempSellerData({...tempSellerData, sellerTaxId: e.target.value})} /></div>
                <div className="col-span-2 text-left"><label className="text-xs font-bold block mb-1 text-left">ที่อยู่ (เลขที่/ถนน)</label><textarea className="w-full border rounded-lg p-2.5 text-sm resize-none text-left" rows="2" value={tempSellerData.sellerAddress} onChange={e=>setTempSellerData({...tempSellerData, sellerAddress: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold block mb-1 text-left">ตำบล/แขวง</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" value={tempSellerData.sellerSubDistrict} onChange={e=>setTempSellerData({...tempSellerData, sellerSubDistrict: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold block mb-1 text-left">อำเภอ/เขต</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" value={tempSellerData.sellerDistrict} onChange={e=>setTempSellerData({...tempSellerData, sellerDistrict: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold block mb-1 text-left">จังหวัด</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" value={tempSellerData.sellerProvince} onChange={e=>setTempSellerData({...tempSellerData, sellerProvince: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold block mb-1 text-left">รหัสไปรษณีย์</label><input className="w-full border rounded-lg p-2.5 text-sm font-mono text-left" value={tempSellerData.sellerZipCode} onChange={e=>setTempSellerData({...tempSellerData, sellerZipCode: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold block mb-1 text-left">รหัสสาขา (5 หลัก)</label><input className="w-full border rounded-lg p-2.5 text-sm font-mono text-left" placeholder="00000" value={tempSellerData.sellerBranchId} onChange={e=>setTempSellerData({...tempSellerData, sellerBranchId: e.target.value})} /></div>
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
  const [partners, setPartners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
   
  const [formData, setFormData] = useState({ 
    type: 'income', date: formatDateISO(new Date()), description: '', total: 0, channel: 'หน้าร้าน', 
    transactionFee: '', commissionFee: '', serviceFee: '', infrastructureFee: '', couponDiscount: '', cashCoupon: '',
    whtAmount: '', isNonCreditableVat: false,
    category: 'รายได้จากการขายสินค้า', orderId: '', partnerName: '', partnerTaxId: '', partnerAddress: '', partnerBranch: '00000',
    items: [{ desc: '', qty: 1, buyPrice: 0, sellPrice: 0 }] 
  });

  useEffect(() => { if (!user) return; const unsub = onSnapshot(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'partners'), (snap) => { setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() }))); }); return () => unsub(); }, [user, appId]);

  const uniqueInventory = useMemo(() => {
    const map = {};
    stockBatches.forEach(batch => {
      const name = batch.productName; if (!name) return;
      const remaining = Number(batch.quantity) - Number(batch.sold || 0);
      if (!map[name]) map[name] = { name, sku: batch.sku || '-', qty: 0, sellPrice: batch.sellPrice || 0 };
      map[name].qty += Math.max(0, remaining);
      if (batch.sellPrice > 0) map[name].sellPrice = batch.sellPrice;
    });
    return Object.values(map);
  }, [stockBatches]);

  const filteredStock = useMemo(() => {
    return uniqueInventory.filter(item => 
      // If income: only show available qty > 0. If expense: show all to allow restock/purchase.
      (formData.type === 'income' ? item.qty > 0 : true) && 
      (
        item.name.toLowerCase().includes(stockSearchTerm.toLowerCase()) || 
        item.sku.toLowerCase().includes(stockSearchTerm.toLowerCase())
      )
    );
  }, [uniqueInventory, stockSearchTerm, formData.type]);
   
  const handleDelete = async (id, type) => { 
    try { 
      const coll = type === 'income' ? 'transactions_income' : 'transactions_expense'; 
      await deleteDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', coll, id)); 
      showToast("ลบรายการสำเร็จ", "success"); 
      setDeleteConfirmId(null); 
    } catch (e) { showToast("ไม่สามารถลบได้", "error"); } 
  };

  const selectPartner = (p) => { setFormData({ ...formData, partnerName: p.name || '', partnerTaxId: p.taxId || '', partnerAddress: p.address || '', partnerBranch: p.branch || '00000' }); setShowPartnerModal(false); };
  
  const selectStockItem = (item, index) => { 
    const newItems = [...formData.items]; 
    newItems[index].desc = item.name;
    if (formData.type === 'income') {
        newItems[index].sellPrice = item.sellPrice || 0;
    }
    // For expense mode, we pop the description but leave buyPrice for user input or last cost
    setFormData({ ...formData, items: newItems }); 
    setShowStockSelectModal(false); 
    setStockSearchTerm('');
  };

  const addLineItem = () => { setFormData({ ...formData, items: [...formData.items, { desc: '', qty: 1, buyPrice: 0, sellPrice: 0 }] }); };
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
    const totalFees = formData.type === 'income' ? (transFee + infraFee + commFee + servFee) : 0;
    const totalDiscounts = couponDisc + cashCpn;
    const grandTotal = formData.type === 'income' ? Math.max(0, subTotal - totalFees - totalDiscounts - wht) : subTotal - totalDiscounts - wht;
    return { subTotal, totalFees, totalDiscounts, wht, grandTotal };
  }, [formData]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!user) return;
    try {
      const coll = formData.type === 'income' ? 'transactions_income' : 'transactions_expense';
      const { subTotal, totalFees, grandTotal } = financialSummary;
      const dataToSave = { ...formData, total: subTotal, platformFee: totalFees, grandTotal, date: normalizeDate(formData.date), description: formData.items.map(i => i.desc).join(', '), userId: user.uid, createdAt: serverTimestamp() };
      if (formData.partnerName) {
        const existingPartner = partners.find(p => p.taxId === formData.partnerTaxId && p.name === formData.partnerName);
        if (!existingPartner) { await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'partners'), { name: formData.partnerName, taxId: formData.partnerTaxId, address: formData.partnerAddress, branch: formData.partnerBranch, type: formData.type === 'income' ? 'buyer' : 'seller', createdAt: serverTimestamp() }); }
      }
      await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', coll), dataToSave);
      showToast("บันทึกสำเร็จ", "success");
      setFormData({ type: 'income', date: formatDateISO(new Date()), description: '', total: 0, channel: 'หน้าร้าน', transactionFee: '', commissionFee: '', serviceFee: '', infrastructureFee: '', couponDiscount: '', cashCoupon: '', whtAmount: '', isNonCreditableVat: false, category: 'รายได้จากการขายสินค้า', orderId: '', partnerName: '', partnerTaxId: '', partnerAddress: '', partnerBranch: '00000', items: [{ desc: '', qty: 1, buyPrice: 0, sellPrice: 0 }] });
    } catch (e) { showToast("Error: " + e.message, "error"); }
  };

  const filteredHistory = useMemo(() => {
    const docStatusMap = {};
    invoices.forEach(inv => { if (inv.orderId) { if (!docStatusMap[inv.orderId]) docStatusMap[inv.orderId] = []; docStatusMap[inv.orderId].push({ type: inv.docType, no: inv.invNo }); } });
    return transactions.filter(t => (t.partnerName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (t.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) || (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())).map(t => ({ ...t, issuedDocs: docStatusMap[t.orderId] || [] })).sort((a,b) => normalizeDate(b.date) - normalizeDate(a.date));
  }, [transactions, invoices, searchTerm]);

  return (
    <div className="flex flex-col h-full animate-fadeIn font-sarabun text-left w-full h-full pb-10">
      <div className="flex justify-between items-end mb-8 border-b pb-4 text-left">
        <div className="space-y-1 text-left"><h2 className="text-3xl font-black text-slate-800 text-left">Records Manager</h2><p className="text-sm text-slate-400 font-medium text-left">บันทึกรายการรายรับ-รายจ่าย และประวัติการทำรายการ</p></div>
        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit text-left"><button onClick={()=>setSubTab('new')} className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all text-center ${subTab==='new'?'bg-white shadow-md text-indigo-600 scale-[1.02]':'text-slate-500 hover:text-slate-700'}`}>เพิ่มรายการใหม่</button><button onClick={()=>setSubTab('history')} className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all text-center ${subTab==='history'?'bg-white shadow-md text-indigo-600 scale-[1.02]':'text-slate-500 hover:text-slate-700'}`}>ประวัติรายการ</button></div>
      </div>
      {showPartnerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[700] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[40px] w-full max-w-md flex flex-col shadow-2xl animate-in zoom-in-95 max-h-[70vh] text-left">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 text-left"><h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 text-left"><Users size={20} className="text-indigo-600"/> เลือกคู่ค้า</h3><button onClick={()=>setShowPartnerModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-center"><X/></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-left">{partners.length > 0 ? partners.map(p => (<div key={p.id} onClick={()=>selectPartner(p)} className="p-4 rounded-2xl border hover:bg-indigo-50 cursor-pointer border-slate-100 transition-colors group text-left"><div className="flex justify-between items-center text-left"><div><p className="font-bold text-slate-800 group-hover:text-indigo-700 text-left">{p.name}</p><p className="text-[10px] text-slate-400 font-mono text-left">TAX: {p.taxId}</p></div><ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 text-center"/></div></div>)) : <div className="text-center py-10 text-slate-400 text-sm font-bold text-center">ไม่พบข้อมูลคู่ค้า</div>}</div>
          </div>
        </div>
      )}
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
                                <span className="text-[9px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-tighter text-left">SKU: {item.sku}</span>
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
      {subTab === 'new' ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start text-left">
          <div className="xl:col-span-3 space-y-8 text-left">
            <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-8 text-left">
              <div className="flex flex-col md:flex-row gap-6 items-center text-left"><div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit shrink-0 text-left"><button onClick={()=>setFormData({...formData, type:'income', category: 'รายได้จากการขายสินค้า'})} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all text-center ${formData.type==='income'?'bg-emerald-600 text-white shadow-lg':'text-slate-400'}`}><TrendingUp size={18}/> รายรับ</button><button onClick={()=>setFormData({...formData, type:'expense', category: 'ต้นทุนสินค้า'})} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all text-center ${formData.type==='expense'?'bg-rose-600 text-white shadow-lg':'text-slate-400'}`}><TrendingDown size={18}/> รายจ่าย</button></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full text-left"><div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">วันที่</label><input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none text-left"/></div><div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">ช่องทาง</label><select value={formData.channel} onChange={e=>setFormData({...formData, channel: e.target.value})} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 outline-none text-left">{CONSTANTS.CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}</select></div><div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Order ID</label><input placeholder="ระบุเลขที่..." value={formData.orderId} onChange={e=>setFormData({...formData, orderId: e.target.value})} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 outline-none text-left"/></div><div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">หมวดหมู่</label><select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 outline-none text-left">{(formData.type === 'income' ? CONSTANTS.CATEGORIES.INCOME : CONSTANTS.CATEGORIES.EXPENSE).map(c => <option key={c} value={c}>{c}</option>)}</select></div></div></div>
              <div className="pt-6 border-t space-y-4 text-left"><div className="flex justify-between items-center text-left"><h4 className="text-sm font-black text-slate-800 flex items-center gap-2 text-left"><Users size={18} className="text-indigo-600"/> {formData.type === 'income' ? 'ข้อมูลลูกค้า' : 'ข้อมูลผู้ขาย'}</h4><button type="button" onClick={()=>setShowPartnerModal(true)} className="text-[10px] bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-bold hover:bg-indigo-100 transition-colors text-center">ดึงจากฐานข้อมูลคู่ค้า</button></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left"><input value={formData.partnerName} onChange={e=>setFormData({...formData, partnerName: e.target.value})} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-sm font-bold outline-none text-left" placeholder="ชื่อ..." /><input value={formData.partnerTaxId} onChange={e=>setFormData({...formData, partnerTaxId: e.target.value})} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-sm font-mono outline-none text-left" placeholder="เลขผู้เสียภาษี..." /><input value={formData.partnerAddress} onChange={e=>setFormData({...formData, partnerAddress: e.target.value})} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-sm outline-none text-left" placeholder="ที่อยู่ในการจัดส่ง..." /></div></div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-6 text-left"><div className="flex justify-between items-center text-left"><div className="flex items-center gap-3 text-left"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl text-center"><ShoppingCart size={20}/></div><h4 className="text-lg font-black text-slate-800 text-left">รายการสินค้า</h4></div><button type="button" onClick={addLineItem} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all scale-100 hover:scale-[1.02] active:scale-95 text-center"><Plus size={18}/> เพิ่มรายการ</button></div>
              <div className="overflow-x-auto text-left"><table className="w-full text-sm text-left"><thead><tr className="border-b border-slate-100 text-left"><th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest pl-2 text-left">Description</th><th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center w-28 text-center">Quantity</th><th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right w-40 text-right">Unit Price</th><th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right w-40 pr-2 text-right">Total</th><th className="pb-4 w-12 text-center"></th></tr></thead><tbody className="divide-y divide-slate-50 text-left">{formData.items.map((item, index) => (<tr key={index} className="group transition-colors hover:bg-slate-50/50 text-left"><td className="py-4 pl-2 text-left"><div className="relative text-left"><input value={item.desc} onChange={e=>updateLineItem(index, 'desc', e.target.value)} className="w-full bg-transparent p-2 rounded-xl text-sm font-bold border-0 focus:ring-0 outline-none text-slate-700 text-left" placeholder="ชื่อสินค้าหรือบริการ..." /><button type="button" onClick={()=>setShowStockSelectModal(index)} className="absolute -top-3 right-0 text-[9px] text-indigo-600 font-black opacity-0 group-hover:opacity-100 transition-opacity uppercase bg-white border px-2 py-0.5 rounded-full shadow-sm text-center">Pick from Stock</button></div></td><td className="py-4 text-center"><div className="flex justify-center text-center"><input type="number" value={item.qty} onChange={e=>updateLineItem(index, 'qty', e.target.value)} className="w-20 bg-slate-100/50 p-2 rounded-xl border-0 text-sm text-center font-black outline-none text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-center"/></div></td><td className="py-4 text-right"><div className="relative flex items-center justify-end text-right"><span className="absolute left-3 text-slate-400 font-bold text-xs text-left">฿</span><input type="number" value={formData.type === 'income' ? item.sellPrice : item.buyPrice} onChange={e=>updateLineItem(index, formData.type === 'income' ? 'sellPrice' : 'buyPrice', e.target.value)} className="w-full bg-slate-100/50 p-2 rounded-xl border-0 text-sm text-right font-black outline-none text-slate-800 pl-8 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-right"/></div></td><td className="py-4 text-right pr-2 text-right"><p className="font-black text-slate-900 text-sm text-right">{formatCurrency((formData.type === 'income' ? item.sellPrice : item.buyPrice) * item.qty)}</p></td><td className="py-4 text-center"><button type="button" onClick={()=>removeLineItem(index)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors disabled:opacity-0 text-center" disabled={formData.items.length === 1}><Trash2 size={16}/></button></td></tr>))}</tbody></table></div>
            </div>
          </div>
          <div className="xl:col-span-1 space-y-6 sticky top-0 text-left"><div className="bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden flex flex-col text-left"><div className="p-8 bg-indigo-600 text-white flex justify-between items-center text-left"><div><p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-left">Grand Total (ยอดสุทธิ)</p><h3 className="text-4xl font-black text-left">{formatCurrency(financialSummary.grandTotal)}</h3></div><div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-center"><Wallet size={24}/></div></div><div className="p-8 space-y-6 text-white/90 text-left"><div className="space-y-4 text-left"><div className="flex justify-between items-center text-sm text-left"><span className="opacity-60 text-left">Subtotal (ก่อนหัก)</span><span className="font-bold text-right">{formatCurrency(financialSummary.subTotal)}</span></div>{formData.type === 'income' && (<div className="pt-4 border-t border-white/10 space-y-3 text-left"><p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest text-left">Platform Fees & Costs</p><div className="grid grid-cols-2 gap-3 text-left"><div className="space-y-1 text-left"><label className="text-[9px] font-bold opacity-40 uppercase text-left">Trans. Fee</label><input type="number" value={formData.transactionFee} onChange={e=>setFormData({...formData, transactionFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" /></div><div className="space-y-1 text-left"><label className="text-[9px] font-bold opacity-40 uppercase text-left">Infra Fee</label><input type="number" value={formData.infrastructureFee} onChange={e=>setFormData({...formData, infrastructureFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" /></div><div className="space-y-1 text-left"><label className="text-[9px] font-bold opacity-40 uppercase text-left">Comm. Fee</label><input type="number" value={formData.commissionFee} onChange={e=>setFormData({...formData, commissionFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" /></div><div className="space-y-1 text-left"><label className="text-[9px] font-bold opacity-40 uppercase text-left">Service Fee</label><input type="number" value={formData.serviceFee} onChange={e=>setFormData({...formData, serviceFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" /></div></div></div>)}<div className="pt-4 border-t border-white/10 space-y-3 text-left"><p className="text-[10px] font-black uppercase text-rose-400 tracking-widest text-left">Discounts (ส่วนลด)</p><div className="grid grid-cols-2 gap-3 text-left"><div className="space-y-1 text-left"><label className="text-[9px] font-bold opacity-40 uppercase text-left">Platform Disc.</label><input type="number" value={formData.couponDiscount} onChange={e=>setFormData({...formData, couponDiscount: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" /></div><div className="space-y-1 text-left"><label className="text-[9px] font-bold opacity-40 uppercase text-left">Cash Coupon</label><input type="number" value={formData.cashCoupon} onChange={e=>setFormData({...formData, cashCoupon: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" /></div></div></div><div className="pt-4 border-t border-white/10 space-y-3 text-left"><p className="text-[10px] font-black uppercase text-amber-400 tracking-widest text-left">Tax (ภาษีและการปรับปรุง)</p><div className="grid grid-cols-1 gap-3 text-left"><div className="space-y-1 text-left"><label className="text-[9px] font-bold opacity-40 uppercase text-left">หัก ณ ที่จ่าย (WHT Amount)</label><input type="number" value={formData.whtAmount} onChange={e=>setFormData({...formData, whtAmount: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none text-left" placeholder="0.00" /></div>{formData.type === 'expense' && (<label className="flex items-center gap-2 cursor-pointer mt-2 w-fit group text-left"><input type="checkbox" checked={formData.isNonCreditableVat} onChange={e=>setFormData({...formData, isNonCreditableVat: e.target.checked})} className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 cursor-pointer" /><span className="text-[10px] font-bold opacity-80 group-hover:opacity-100 transition-opacity text-left">ภาษีซื้อต้องห้าม (Non-creditable VAT)</span></label>)}</div></div></div><div className="pt-6 border-t border-white/20 text-left"><button onClick={handleSubmit} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-95 group text-center"><Save size={24} className="text-indigo-600 transition-transform group-hover:scale-110 text-center"/> บันทึกรายการ</button><p className="text-[10px] text-white/30 mt-4 text-center">ระบบจะบันทึกลงฐานข้อมูลและหักลบสต็อก FIFO อัตโนมัติ</p></div></div></div></div>
        </div>
      ) : (
        <div className="space-y-6 text-left">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-left">
             <div className="relative flex-1 max-w-md w-full text-left"><Search className="absolute left-4 top-3.5 text-slate-400 text-center" size={18}/><input className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm text-left" placeholder="ค้นหาประวัติ: ชื่อลูกค้า, Order ID, รายละเอียด..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
             <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0 text-left"><span className="text-[10px] font-black uppercase text-slate-400 px-3 text-center">History ({filteredHistory.length})</span></div>
          </div>
          <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden text-left"><div className="overflow-x-auto text-left"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left"><tr><th className="p-6 text-left">วันที่ / ช่องทาง</th><th className="p-6 text-left">รายการ/เลขที่</th><th className="p-6 text-left">คู่ค้า</th><th className="p-6 text-right text-right">ยอดรวม</th><th className="p-6 text-center text-center">จัดการ</th></tr></thead><tbody className="divide-y divide-slate-50 text-left">{filteredHistory.map(t => (<tr key={t.id} className="group hover:bg-slate-50/80 transition-colors text-left"><td className="p-6 text-left"><p className="font-black text-slate-700 text-left">{formatDate(t.date)}</p><span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase text-center">{t.channel || 'หน้าร้าน'}</span></td><td className="p-6 text-left"><p className="font-bold text-slate-800 line-clamp-1 text-left">{t.description || '-'}</p><div className="flex items-center flex-wrap gap-2 mt-1 text-left"><p className="text-[10px] font-mono text-slate-400 text-left">ID: {t.orderId || '-'}</p>{t.issuedDocs && t.issuedDocs.length > 0 && t.issuedDocs.map((doc, idx) => (<span key={idx} className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-center ${doc.type === 'invoice' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>{doc.type === 'invoice' ? 'ออกใบกำกับแล้ว' : 'ลดหนี้แล้ว'}: {doc.no}</span>))}</div></td><td className="p-6 text-left"><p className="font-bold text-indigo-600 text-left">{t.partnerName || 'คู่ค้าทั่วไป'}</p><p className="text-[10px] text-slate-400 truncate max-w-[150px] text-left">Addr: {t.partnerAddress || '-'}</p></td><td className="p-6 text-right"><div className={`inline-flex flex-col items-end px-4 py-2 rounded-2xl text-right ${t.type==='income'?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}><p className="text-[10px] font-black uppercase opacity-60 leading-none mb-1 text-right">{t.type==='income'?'Income':'Expense'}</p><p className="text-base font-black leading-none text-right">{formatCurrency(t.grandTotal || t.total)}</p></div></td><td className="p-6 text-center"><div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all text-center"><button onClick={()=>setViewItem(t)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all shadow-sm text-center"><Eye size={18}/></button><button onClick={()=>onIssueInvoice(t)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-emerald-600 hover:shadow-md transition-all shadow-sm text-center"><Printer size={18}/></button><button onClick={()=>setDeleteConfirmId({id: t.id, type: t.type})} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:shadow-md transition-all shadow-sm text-center"><Trash2 size={18}/></button></div></td></tr>))}</tbody></table></div></div>
        </div>
      )}
      {viewItem && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[40px] w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 text-left">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 text-left"><div className="text-left"><h3 className="text-2xl font-black text-slate-800 flex items-center gap-2 text-left"><Hash className="text-indigo-600"/> รายละเอียดรายการ</h3><div className="flex items-center gap-4 mt-1 text-left"><p className="text-xs text-slate-400 font-mono text-left">ID: {viewItem.orderId || '-'}</p><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-center ${viewItem.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{viewItem.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</span><span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold text-center">{viewItem.channel || 'หน้าร้าน'}</span></div></div><button onClick={()=>setViewItem(null)} className="p-2 hover:bg-slate-200 rounded-full text-center"><X/></button></div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 text-left">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                <div className="space-y-6 text-left"><h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2 text-left"><Info size={18} className="text-indigo-600"/> ข้อมูลพื้นฐาน</h4><div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-sm space-y-4 text-left"><div className="text-left"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">วันที่ทำรายการ</p><p className="font-bold text-slate-800 text-left">{formatDate(viewItem.date)}</p></div><div className="text-left"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">หมวดหมู่</p><p className="font-bold text-slate-800 text-left">{viewItem.category || '-'}</p></div><div className="pt-2 border-t text-left"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">{viewItem.type === 'income' ? 'ลูกค้า' : 'ผู้ขาย'}</p><p className="font-bold text-slate-800 text-base text-left">{viewItem.partnerName || '-'}</p><p className="text-[10px] font-mono text-indigo-500 font-bold text-left">TAX: {viewItem.partnerTaxId || '-'}</p><div className="mt-2 p-3 bg-white/50 rounded-xl border border-slate-100 text-left"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1 text-left">ที่อยู่จัดส่ง (Shipping Address)</p><p className="text-xs text-slate-600 leading-relaxed text-left">{viewItem.shippingAddress || viewItem.partnerAddress || viewItem.address || 'ไม่ระบุที่อยู่'}</p></div></div></div></div>
                <div className="space-y-6 text-left"><h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2 text-left"><Zap size={18} className="text-amber-500"/> รายละเอียดค่าใช้จ่าย/หักลด</h4><div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-sm space-y-3 text-left"><div className="flex justify-between text-left text-left"><span className="text-slate-500 text-left">ค่าธรรมเนียมธุรกรรม</span><span className="font-bold text-right">{formatCurrency(viewItem.transactionFee || 0)}</span></div><div className="flex justify-between text-left text-left"><span className="text-slate-500 text-left">ค่าโครงสร้างพื้นฐาน</span><span className="font-bold text-right">{formatCurrency(viewItem.infrastructureFee || 0)}</span></div><div className="flex justify-between text-left text-left"><span className="text-slate-500 text-left">ค่าคอมมิชชั่น/บริการ</span><span className="font-bold text-right">{formatCurrency((viewItem.commissionFee || 0) + (viewItem.serviceFee || 0))}</span></div><div className="flex justify-between border-t pt-2 font-bold text-indigo-600 text-left text-left"><span>รวมค่าธรรมเนียม Platform</span><span>{formatCurrency(viewItem.platformFee || 0)}</span></div><div className="pt-2 border-t space-y-2 text-left text-left"><div className="flex justify-between text-rose-500 text-left text-left"><span className="text-[10px] font-bold uppercase text-left">ส่วนลดคูปอง</span><span className="font-bold text-right text-right">-{formatCurrency(viewItem.couponDiscount || 0)}</span></div><div className="flex justify-between text-orange-500 text-left text-left"><span className="text-[10px] font-bold uppercase text-left">คูปองเงินสด</span><span className="font-bold text-right text-right">-{formatCurrency(viewItem.cashCoupon || 0)}</span></div><div className="flex justify-between text-rose-600 text-left text-left"><span className="text-[10px] font-bold uppercase text-left">หัก ณ ที่จ่าย (WHT)</span><span className="font-bold text-right text-right">-{formatCurrency(viewItem.whtAmount || 0)}</span></div></div>{viewItem.isNonCreditableVat && (
                          <div className="mt-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black border border-rose-100 flex items-center gap-2 text-left">
                              <AlertTriangle size={14} className="text-center"/>
                              รายการนี้เป็น "ภาษีซื้อต้องห้าม" (ไม่นำไปขอคืนภาษี)
                          </div>
                      )}</div></div>
                <div className="space-y-6 text-left"><h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2 text-left"><Wallet size={18} className="text-emerald-500"/> สรุปยอดเงินสุทธิ</h4><div className="bg-slate-900 text-white p-7 rounded-[32px] shadow-xl text-left"><div className="flex justify-between items-center text-sm opacity-60 text-left"><span>มูลค่าสินค้ารวม</span><span>{formatCurrency(viewItem.total)}</span></div><div className="flex justify-between items-center text-sm opacity-60 mt-1 text-left"><span>หักค่าธรรมเนียม & ส่วนลด & WHT</span><span>{formatCurrency((viewItem.platformFee || 0) + (viewItem.couponDiscount || 0) + (viewItem.cashCoupon || 0) + (viewItem.whtAmount || 0))}</span></div><div className="flex justify-between items-center pt-3 mt-4 border-t-2 border-white/20 text-left"><span className="font-black text-indigo-400 uppercase tracking-wider text-left">เงินเข้าสุทธิ</span><span className="text-4xl font-black text-right">{formatCurrency(viewItem.grandTotal || viewItem.total)}</span></div><div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-left"><p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-left">เอกสารที่ออกแล้ว (Linked Documents)</p>{viewItem.issuedDocs && viewItem.issuedDocs.length > 0 ? viewItem.issuedDocs.map((doc, idx) => (<div key={idx} className="flex justify-between items-center text-xs font-bold border-b border-white/5 pb-1 text-left"><div className="flex items-center gap-2 text-left">{doc.type === 'invoice' ? <FileText size={12} className="text-indigo-400 text-center"/> : <FileType size={12} className="text-rose-400 text-center"/>}<span className={doc.type === 'invoice' ? 'text-indigo-200' : 'text-rose-200'}>{doc.type === 'invoice' ? 'INV' : 'CN'}</span></div><span className="text-white/80 font-mono text-right">{doc.no}</span></div>)) : (<div className="flex items-center gap-2 text-xs font-bold text-slate-500 text-left"><Clock size={14} className="text-center"/> ยังไม่ออกเอกสารภาษี</div>)}</div></div></div>
              </div>
              {viewItem.items && (<div className="space-y-4 text-left"><h4 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2 text-left"><List size={18} className="text-indigo-600"/> รายการสินค้า/บริการ</h4><div className="overflow-hidden border border-slate-100 rounded-3xl text-left"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 text-left"><tr><th className="p-4 text-left">รายละเอียดสินค้า</th><th className="p-4 text-center text-center">จำนวน</th><th className="p-4 text-right text-right">ราคาต่อหน่วย</th><th className="p-4 text-right text-right">ยอดรวม</th></tr></thead><tbody className="divide-y divide-slate-50 text-left">{viewItem.items.map((it, idx) => (<tr key={idx} className="hover:bg-slate-50/50 text-left"><td className="p-4 font-bold text-slate-700 text-left">{it.desc}</td><td className="p-4 text-center font-black text-center">{it.qty}</td><td className="p-4 text-right text-right">{formatCurrency(viewItem.type === 'income' ? it.sellPrice : it.buyPrice)}</td><td className="p-4 text-right font-black text-slate-900 text-right">{formatCurrency((viewItem.type === 'income' ? it.sellPrice : it.buyPrice) * it.qty)}</td></tr>))}</tbody></table></div></div>)}
            </div>
            <div className="p-6 border-t bg-slate-50 flex gap-4 text-center"><button onClick={()=>setViewItem(null)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-colors text-center">ปิดหน้านี้</button><button onClick={()=>{onIssueInvoice(viewItem); setViewItem(null);}} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-center"><Printer size={20}/> ออกเอกสารภาษี (Invoice)</button></div>
          </div>
        </div>
      )}
      {deleteConfirmId && (<div className="fixed inset-0 bg-black/60 z-[900] flex items-center justify-center p-4 text-left"><div className="bg-white rounded-[32px] p-8 max-sm w-full text-center shadow-2xl animate-in zoom-in-95 text-center"><div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-center"><Trash2 size={32}/></div><h3 className="text-xl font-bold mb-2 text-center text-slate-800">ยืนยันการลบรายการ?</h3><p className="text-xs text-slate-400 mb-8 text-center uppercase tracking-widest font-black">รายการประเภท: {deleteConfirmId.type}</p><div className="flex gap-3 text-center"><button onClick={()=>setDeleteConfirmId(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button><button onClick={()=>handleDelete(deleteConfirmId.id, deleteConfirmId.type)} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100 text-center">ยืนยันลบ</button></div></div></div>)}
    </div>
  );
}

function InvoiceGenerator({ user, transactions, invoices = [], appId = "merchant-tax-dev-v1", showToast, preFillData }) {
  const [mode, setMode] = useState('history'); 
  const savedSeller = useMemo(() => { try { return JSON.parse(localStorage.getItem('merchant_seller_info') || '{}'); } catch (e) { return {}; } }, []);
  const initialInvData = { docType: 'invoice', refInvNo: '', creditNoteReason: '', customerName: '', address: '', taxId: '', branch: '00000', orderId: '', custSubDistrict: '', custDistrict: '', custProvince: '', custZipCode: '', items: [{ desc: '', qty: 1, unit: 'ชิ้น', price: 0 }], date: formatDateISO(new Date()), invNo: '', sellerName: savedSeller.sellerName || '', sellerAddress: savedSeller.sellerAddress || '', sellerTaxId: savedSeller.sellerTaxId || '', sellerBranchId: savedSeller.sellerBranchId || '00000', sellerPhone: savedSeller.sellerPhone || '', sellerEmail: savedSeller.sellerEmail || '', sellerSubDistrict: savedSeller.sellerSubDistrict || '', sellerDistrict: savedSeller.sellerDistrict || '', sellerProvince: savedSeller.sellerProvince || '', sellerZipCode: savedSeller.sellerZipCode || '', discount: 0, notes: 'สินค้าซื้อแล้วไม่รับเปลี่ยนหรือคืนเงิน', vatType: 'excluded', logo: '', signature: '', status: 'unpaid' };

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

  const handleLoadTransaction = (data) => {
    if (!data) return;
    const totalDisc = (Number(data.couponDiscount) || 0) + (Number(data.cashCoupon) || 0);
    const mappedItems = (data.items || []).map(it => ({ 
      desc: it.desc || it.description || '', 
      qty: Number(it.qty) || 1, 
      unit: 'ชิ้น', 
      price: data.type === 'income' ? (Number(it.sellPrice) || Number(it.price) || 0) : (Number(it.buyPrice) || Number(it.price) || 0) 
    }));
    const customerAddress = data.shippingAddress || data.partnerAddress || data.address || '';
    
    setInvData(prev => ({ 
        ...prev, 
        sellerName: prev.sellerName || savedSeller.sellerName || '',
        sellerAddress: prev.sellerAddress || savedSeller.sellerAddress || '',
        sellerTaxId: prev.sellerTaxId || savedSeller.sellerTaxId || '',
        sellerBranchId: prev.sellerBranchId || savedSeller.sellerBranchId || '00000',
        sellerPhone: prev.sellerPhone || savedSeller.sellerPhone || '',
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

  useEffect(() => { if (mode === 'create' && !editingDocId) { const dateStr = invData.date.replace(/-/g, ''); const prefix = invData.docType === 'credit_note' ? 'CN-' : 'INV-'; const count = invoices.filter(inv => inv.invNo && inv.invNo.startsWith(prefix + dateStr)).length + 1; setInvData(prev => ({ ...prev, invNo: prefix + dateStr + "-" + String(count).padStart(3, '0') })); } }, [invData.date, invData.docType, invoices, mode, editingDocId]);
  useEffect(() => { if (user) { const unsubSellers = onSnapshot(query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'seller_profiles')), (snap) => setSellerProfiles(snap.docs.map(d=>({id:d.id, ...d.data()})))); const unsubCustomers = onSnapshot(query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'partners')), (snap) => setCustomers(snap.docs.map(d=>({id:d.id, ...d.data(), customerName: d.data().name})))); return () => { unsubSellers(); unsubCustomers(); }; } }, [user, appId]);

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
        const profileData = { sellerName: invData.sellerName, sellerAddress: invData.sellerAddress, sellerTaxId: invData.sellerTaxId, sellerBranchId: invData.sellerBranchId, sellerPhone: invData.sellerPhone, sellerEmail: invData.sellerEmail, sellerSubDistrict: invData.sellerSubDistrict, sellerDistrict: invData.sellerDistrict, sellerProvince: invData.sellerProvince, sellerZipCode: invData.sellerZipCode, logo: invData.logo, signature: invData.signature, createdAt: serverTimestamp() };
        await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'seller_profiles'), profileData);
        showToast("บันทึกเป็นโปรไฟล์ใหม่เรียบร้อย", "success");
    } catch (e) { showToast("ไม่สามารถบันทึกโปรไฟล์ได้", "error"); }
  };

  const combinedDocs = useMemo(() => {
      const issuedDocsMap = {};
      invoices.forEach(inv => { if (inv.orderId) { if (!issuedDocsMap[inv.orderId]) issuedDocsMap[inv.orderId] = []; issuedDocsMap[inv.orderId].push(inv.docType); } });
      const normalizedInvoices = invoices.map(inv => ({ ...inv, source: 'invoice', displayStatus: inv.docType === 'credit_note' ? 'ใบลดหนี้' : 'ออกใบกำกับแล้ว', searchStr: (inv.invNo || '') + (inv.customerName || '') + (inv.orderId || '') }));
      const pendingTransactions = transactions.filter(t => t.type === 'income' && !issuedDocsMap[t.orderId]).map(t => ({ ...t, invNo: t.orderId || '-', customerName: t.partnerName || 'คู่ค้าทั่วไป', total: t.total, displayStatus: 'รอออกใบกำกับ', source: 'transaction', searchStr: (t.orderId || '') + (t.partnerName || '') }));
      return [...normalizedInvoices, ...pendingTransactions].filter(d => { const searchInput = invoiceSearch.toLowerCase(); return d.searchStr.toLowerCase().includes(searchInput); }).sort((a, b) => normalizeDate(b.date) - normalizeDate(a.date)); 
  }, [invoices, transactions, invoiceSearch]);

  const handleDownloadPDF = async () => downloadInvoicePDF('invoice-preview-area', invData.invNo, showToast);
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
            <div className="p-6 border-b flex justify-between items-center text-left"><h3 className="font-bold text-lg flex items-center gap-2 text-indigo-700 text-left"><Settings size={20} className="text-center"/> ตั้งค่าผู้ขาย & โปรไฟล์</h3><button onClick={()=>setShowSellerEditModal(false)} className="text-center"><X size={20}/></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="text-left"><label className="text-xs font-bold text-slate-500 text-left">โลโก้ร้านค้า</label><div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-center" onClick={() => logoInputRef.current?.click()}>{invData.logo ? <img src={invData.logo} className="h-20 object-contain" alt="Preview" /> : <ImageIcon size={40} className="text-slate-300 text-center"/>}<input type="file" ref={logoInputRef} hidden accept="image/*" onChange={handleLogoUpload} /></div></div>
                <div className="text-left"><label className="text-xs font-bold text-slate-500 text-left">ลายเซ็น (Signature)</label><div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-center" onClick={() => signatureInputRef.current?.click()}>{invData.signature ? <img src={invData.signature} className="h-20 object-contain" alt="Preview" /> : <Edit size={40} className="text-slate-300 text-center"/>}<input type="file" ref={signatureInputRef} hidden accept="image/*" onChange={handleSignatureUpload} /></div></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">ชื่อร้านค้า</label><input className="w-full border rounded-lg p-2.5 text-sm font-bold text-left" value={invData.sellerName} onChange={e=>setInvData({...invData, sellerName: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">เลขผู้เสียภาษี</label><input className="w-full border rounded-lg p-2.5 text-sm font-mono text-left" value={invData.sellerTaxId} onChange={e=>setInvData({...invData, sellerTaxId: e.target.value})} /></div>
                <div className="col-span-2 text-left"><label className="text-xs font-bold text-left block mb-1 text-left">ที่อยู่/บ้านเลขที่/ถนน</label><textarea className="w-full border rounded-lg p-2.5 text-sm resize-none text-left" rows="2" value={invData.sellerAddress} onChange={e=>setInvData({...invData, sellerAddress: e.target.value})} placeholder="เลขที่, หมู่บ้าน/อาคาร, ถนน..." /></div>
                <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">ตำบล/แขวง</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" value={invData.sellerSubDistrict} onChange={e=>setInvData({...invData, sellerSubDistrict: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">อำเภอ/เขต</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" value={invData.sellerDistrict} onChange={e=>setInvData({...invData, sellerDistrict: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">จังหวัด</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" value={invData.sellerProvince} onChange={e=>setInvData({...invData, sellerProvince: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">รหัสไปรษณีย์</label><input className="w-full border rounded-lg p-2.5 text-sm font-mono text-left" value={invData.sellerZipCode} onChange={e=>setInvData({...invData, sellerZipCode: e.target.value})} /></div>
                <div className="text-left"><label className="text-xs font-bold text-left block mb-1 text-left">เบอร์โทรศัพท์</label><input className="w-full border rounded-lg p-2.5 text-sm text-left" value={invData.sellerPhone} onChange={e=>setInvData({...invData, sellerPhone: e.target.value})} /></div>
              </div>
              <div className="pt-4 border-t text-left">
                <div className="flex justify-between items-center mb-3 text-left"><h4 className="text-xs font-bold text-slate-500 uppercase text-left">โปรไฟล์ที่บันทึก</h4><button onClick={handleSaveAsNewProfile} className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1 hover:bg-emerald-100 transition-colors text-center"><SaveAll size={12}/> บันทึกเป็นโปรไฟล์ใหม่</button></div>
                <div className="space-y-2 text-left">{sellerProfiles.map(s => (<div key={s.id} className="flex items-center gap-2 text-left"><div onClick={()=>{setInvData(p=>({...p, ...s})); setShowSellerEditModal(false);}} className="flex-1 p-3 bg-slate-50 border rounded-xl cursor-pointer hover:border-indigo-300 font-medium text-left">{s.sellerName}</div><button type="button" onClick={(e) => { e.stopPropagation(); setProfileToDelete(s); }} className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100 text-center"><Trash2 size={16}/></button></div>))}</div>
              </div>
            </div>
            <div className="p-4 border-t flex gap-3 text-center"><button onClick={()=>setShowSellerEditModal(false)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-center">ปิด</button></div>
          </div>
          {profileToDelete && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[900] flex items-center justify-center p-4 text-left"><div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 text-center"><div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-center"><Trash2 size={32}/></div><h3 className="text-xl font-bold mb-2 text-center text-slate-800">ยืนยันลบโปรไฟล์?</h3><p className="text-xs text-slate-400 mb-6 text-center">คุณกำลังจะลบข้อมูล <b>"{profileToDelete.sellerName}"</b><br/>การกระทำนี้จะไม่สามารถกู้คืนได้</p><div className="flex gap-3 text-center"><button onClick={() => setProfileToDelete(null)} type="button" className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button><button onClick={()=>handleDeleteProfile(profileToDelete.id)} type="button" className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100 text-center">ยืนยันลบ</button></div></div></div>)}
        </div>
      )}

      {showCustomerModal && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-sarabun text-left"><div className="bg-white rounded-3xl w-full max-w-md h-[70vh] flex flex-col shadow-2xl animate-fadeIn text-left"><div className="p-6 border-b flex justify-between items-center text-left"><h3 className="font-bold text-lg flex items-center gap-2 text-rose-600 text-left"><User size={20} className="text-center text-rose-500"/> เลือกข้อมูลลูกค้า/คู่ค้า</h3><button onClick={()=>setShowCustomerModal(false)} className="text-center text-slate-500"><X size={20}/></button></div><div className="flex-1 overflow-y-auto p-4 space-y-2 text-left">{customers.map(c => (<div key={c.id} onClick={()=>{setInvData(p=>({...p, customerName: c.customerName, address: c.address, taxId: c.taxId, branch: c.branch, custSubDistrict: c.custSubDistrict || '', custDistrict: c.custDistrict || '', custProvince: c.custProvince || '', custZipCode: c.custZipCode || ''})); setShowCustomerModal(false);}} className="p-4 rounded-xl border border-slate-100 hover:bg-rose-50 cursor-pointer shadow-sm text-left"><p className="font-bold text-left">{c.customerName}</p><p className="text-[10px] text-indigo-500 font-mono text-left">TAX: {c.taxId}</p><p className="text-xs text-slate-400 truncate text-left">{c.address}</p></div>))}</div></div></div>)}
       
      <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit print:hidden self-center md:self-start text-left">
        <button onClick={() => setMode('create')} className={"px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all text-center " + (mode==='create'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700')}><FileText size={18}/> ออกเอกสาร</button>
        <button onClick={() => setMode('history')} className={"px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all text-center " + (mode==='history'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700')}><Clock size={18}/> ประวัติเอกสาร</button>
      </div>

      {mode === 'history' ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-fadeIn h-full flex flex-col text-left">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 text-left">
                <h3 className="font-bold text-slate-700 text-xl flex-shrink-0 text-left">ประวัติเอกสาร</h3>
                <div className="relative w-full md:w-64 text-left"><Search className="absolute left-3 top-2.5 text-slate-400 text-center" size={16}/><input className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-left" placeholder="ค้นหาเอกสาร..." value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} /></div>
            </div>
            <div className="rounded-2xl border border-slate-100 overflow-x-auto flex-1 custom-scrollbar text-left">
                <table className="w-full text-sm text-left whitespace-nowrap text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs sticky top-0 z-10 text-left">
                        <tr><th className="p-4 text-left">Date</th><th className="p-4 text-left">No. / Order ID</th><th className="p-4 text-left">Customer</th><th className="p-4 text-right text-right">Total</th><th className="p-4 text-center text-center">Status</th><th className="p-4 text-center text-center">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-left">
                        {combinedDocs.map((docItem, idx) => (
                            <tr key={idx} className="hover:bg-indigo-50/30 even:bg-slate-50/50 text-left">
                                <td className="p-4 text-slate-500 text-xs text-left">{formatDate(docItem.date)}</td>
                                <td className="p-4 text-slate-700 font-bold text-left"><p className="text-left">{docItem.invNo}</p>{docItem.orderId && <p className="text-[9px] text-slate-400 font-mono text-left">Ref: {docItem.orderId}</p>}</td>
                                <td className="p-4 text-left">{docItem.customerName}</td>
                                <td className="p-4 text-right font-bold text-right">{formatCurrency(docItem.total * (docItem.docType === 'credit_note' ? -1 : 1))}</td>
                                <td className="p-4 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase text-center ${docItem.source === 'invoice' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>{docItem.displayStatus}</span></td>
                                <td className="p-4 text-center"><div className="flex justify-center gap-2 text-center">{docItem.source === 'transaction' ? (<button onClick={() => handleLoadTransaction(docItem)} className="text-white bg-indigo-600 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 text-center"><PlusCircle size={14} className="text-center"/> สร้างเอกสาร</button>) : (<><button onClick={() => handleEditInvoice(docItem)} className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold text-center">ดู/พิมพ์</button><button onClick={() => handleCreateCreditNote(docItem)} className="text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold text-center" title="สร้างใบลดหนี้">ลดหนี้</button></>)}</div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        <>
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 print:hidden space-y-6 text-left">
                <div className="flex justify-between border-b border-slate-100 pb-4 text-left"><div className="text-left"><h3 className="font-bold text-slate-800 text-xl flex items-center gap-2 text-left">Document Editor</h3><p className="text-slate-400 text-sm text-left">สร้างเอกสารใบกำกับภาษี หรือ ใบเสนอราคา/ลดหนี้</p></div><div className="text-right flex flex-col items-end gap-2 text-right"><button onClick={handleNewInvoice} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 text-center"><PlusCircle size={14} className="text-center"/> New Document</button><div className="text-right"><p className="text-xs text-slate-400 font-bold uppercase text-right">DOC ID</p><div className="flex items-center gap-2 justify-end text-right"><p className="text-2xl font-bold text-indigo-600 font-mono text-right">{invData.invNo}</p></div></div></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between text-left">
                        <div className="text-left"><div className="flex justify-between items-start mb-4 text-left"><h4 className="font-bold text-indigo-700 flex items-center gap-2 text-left"><Store size={18} className="text-center"/> ข้อมูลผู้ขาย</h4><button onClick={()=>setShowSellerEditModal(true)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-center">แก้ไข/ตั้งค่า</button></div><div className="flex gap-4 items-start text-left">{invData.logo && <div className="w-16 h-16 rounded-lg bg-white p-1 border border-slate-200 flex-shrink-0 text-center"><img src={invData.logo} className="w-full h-full object-contain" alt="Logo"/></div>}<div className="text-sm text-slate-600 text-left flex-1"><p className="font-bold text-slate-800 text-base text-left">{invData.sellerName || 'กรุณาระบุชื่อร้านค้า'}</p><div className="text-xs mt-1 text-left flex-1"><p className="text-left">{[invData.sellerAddress, fmtAddr.sub(invData.sellerSubDistrict)].filter(Boolean).join(' ')}</p><p className="text-left">{[fmtAddr.dist(invData.sellerDistrict), fmtAddr.prov(invData.sellerProvince), invData.sellerZipCode].filter(Boolean).join(' ')}</p></div></div></div></div>
                        <div className="mt-4 pt-4 border-t flex gap-2 text-center"><button onClick={()=>setInvData({...invData, vatType: 'excluded'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border text-center ${invData.vatType==='excluded' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-800'}`}>แยก VAT (Excluded)</button><button onClick={()=>setInvData({...invData, vatType: 'included'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border text-center ${invData.vatType==='included' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-800'}`}>รวม VAT (Included)</button><button onClick={()=>setInvData({...invData, vatType: 'none'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border text-center ${invData.vatType==='none' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-800'}`}>ไม่มี VAT</button></div>
                    </div>
                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                        <div className="grid grid-cols-2 gap-3 text-left">
                            <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm text-left"><label className="text-[10px] font-bold text-indigo-600 mb-1 flex items-center gap-1 text-left">ประเภทเอกสาร</label><select value={invData.docType} onChange={e => setInvData({...invData, docType: e.target.value})} className="w-full border-0 p-1 text-sm font-bold text-slate-700 bg-transparent focus:ring-0 text-left cursor-pointer"><option value="invoice">ใบกำกับภาษี / ใบเสร็จรับเงิน</option><option value="credit_note">ใบลดหนี้ (Credit Note)</option></select></div>
                            <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm text-left"><label className="text-[10px] font-bold text-indigo-600 mb-1 flex items-center gap-1 text-left">วันที่เอกสาร</label><input type="date" className="w-full border-0 p-1 text-sm font-bold text-slate-700 bg-transparent focus:ring-0 text-left" value={invData.date} onChange={e => setInvData({ ...invData, date: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-left">
                            {invData.docType === 'credit_note' && (<div className="bg-white p-3 rounded-xl border border-rose-200 shadow-sm text-left"><label className="text-[10px] font-bold text-rose-500 mb-1 flex items-center gap-1 text-left">อ้างอิงใบเดิม</label><input className="w-full border-0 p-1 text-sm font-mono text-rose-600 bg-transparent focus:ring-0 text-left" placeholder="INV-XXXXXXXX" value={invData.refInvNo} onChange={e => setInvData({ ...invData, refInvNo: e.target.value })} /></div>)}
                            <div className={`bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-left ${invData.docType !== 'credit_note' ? 'col-span-2' : ''}`}><label className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1 text-left">Order ID</label><input className="w-full border-0 p-1 text-sm font-mono text-indigo-600 bg-transparent focus:ring-0 text-left" placeholder="เลขคำสั่งซื้อ" value={invData.orderId} onChange={e => setInvData({ ...invData, orderId: e.target.value })} /></div>
                        </div>
                        <div className="flex justify-between items-center text-left"><h4 className="font-bold text-sm text-rose-600 text-left">ข้อมูลลูกค้า/คู่ค้า</h4><button onClick={()=>setShowCustomerModal(true)} className="text-[10px] bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-bold text-center">เลือกจากฐานข้อมูล</button></div>
                        <div className="text-left"><label className="text-[10px] text-slate-500 font-bold mb-1 block text-left">ชื่อลูกค้า / บริษัท</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm text-left" value={invData.customerName} onChange={e=>setInvData({...invData, customerName: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-2 text-left"><div className="col-span-2 text-left"><label className="text-[10px] text-slate-500 font-bold mb-1 block text-left">ที่อยู่</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm text-left" value={invData.address} onChange={e=>setInvData({...invData, address: e.target.value})} /></div></div>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left"><h4 className="font-bold text-sm text-slate-600 mb-2 text-left">รายการสินค้า</h4>{invData.items.map((it, i) => (<div key={i} className="flex gap-2 mb-2 items-center text-left"><span className="text-xs text-slate-400 w-4 text-left">{i+1}.</span><input className="flex-[3] border-0 rounded p-2 text-sm shadow-sm text-left" value={it.desc} onChange={e=>updateItem(i,'desc',e.target.value)}/><input className="w-20 border-0 rounded p-2 text-sm text-center shadow-sm text-center" type="number" value={it.qty} onChange={e=>updateItem(i,'qty',Number(e.target.value))}/><input className="w-24 border-0 rounded p-2 text-sm text-right shadow-sm text-right" type="number" value={it.price} onChange={e=>updateItem(i,'price',Number(e.target.value))}/><button onClick={()=>setInvData({...invData, items: invData.items.filter((_,idx)=>idx!==i)})} className="text-rose-400 p-2 text-center"><Trash2 size={16}/></button></div>))}<button onClick={()=>setInvData({...invData, items:[...invData.items, {desc:'', qty:1, unit:'ชิ้น', price:0}]})} className="mt-2 text-[10px] bg-indigo-600 text-white px-4 py-1.5 rounded-lg flex items-center gap-1 w-fit font-bold shadow-md text-center"><PlusCircle size={14}/> เพิ่มรายการ</button></div>
                <div className="flex gap-4 text-center"><button onClick={handleSaveInvoice} className={"flex-1 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all text-center " + (editingDocId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700') + " flex items-center justify-center gap-2 text-center"}><Save size={18}/> {editingDocId ? 'อัปเดตข้อมูล' : 'บันทึกเอกสาร'}</button><button onClick={handleDownloadPDF} className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all text-center"><Download size={18}/> Download ZIP</button></div>
            </div>
            <div className="overflow-x-auto pb-10 flex justify-center print:p-0 print:absolute print:left-0 print:top-0 print:w-full print:h-full print:z-50 print:bg-white text-left">
                <div id="invoice-preview-area" className="shadow-2xl print:shadow-none bg-white p-[30px] w-[210mm] min-h-[296mm] text-sm font-sarabun text-slate-900 leading-relaxed relative box-border text-left" style={{ transform: 'scale(1.0)', transformOrigin: 'top center' }}>
                    <div className="flex justify-between items-start mb-8 text-left">
                      <div className="w-[70%] flex items-start gap-5 text-left">{invData.logo && (<img src={invData.logo} className="w-[90px] h-[90px] object-contain flex-shrink-0 text-center" alt="Logo"/>)}<div className="flex flex-col justify-center flex-1 text-left"><h2 className="text-xl font-bold text-slate-900 mb-1 leading-tight text-left">{invData.sellerName}</h2><div className="text-xs leading-relaxed space-y-1 mt-1 text-left"><p className="text-slate-600 text-left">{[invData.sellerAddress, fmtAddr.sub(invData.sellerSubDistrict)].filter(Boolean).join(' ')}</p><p className="text-slate-600 text-left">{[fmtAddr.dist(invData.sellerDistrict), fmtAddr.prov(invData.sellerProvince), invData.sellerZipCode].filter(Boolean).join(' ')}</p><p className="text-slate-700 text-left"><b>เลขผู้เสียภาษี:</b> {invData.sellerTaxId} <span className="ml-2"><b>สาขา:</b> {invData.sellerBranchId}</span></p><p className="text-slate-700 text-left"><b>โทร:</b> {invData.sellerPhone}</p></div></div></div>
                      <div className="text-right w-[30%] flex flex-col items-end text-right"><div className="text-lg font-bold uppercase mb-0 text-right">{invData.docType === 'credit_note' ? 'ใบลดหนี้ / CREDIT NOTE' : 'ใบกำกับภาษี / ใบเสร็จรับเงิน'}</div><div className="status-badge text-lg font-bold uppercase mb-3 text-right">ต้นฉบับ (Original)</div><div className="border border-slate-300 p-2 w-full max-w-[200px] text-right"><div className="grid grid-cols-[max-content_1fr] gap-x-2 items-center text-right mb-1"><span className="font-bold text-slate-500 text-xs text-left">เลขที่ (No.)</span><span className="font-bold text-right text-[10px]">{invData.invNo}</span></div><div className="grid grid-cols-[max-content_1fr] gap-x-2 items-center text-right mb-1"><span className="font-bold text-slate-500 text-xs text-left">วันที่ (Date)</span><span className="text-right text-[10px] text-right">{formatDate(invData.date)}</span></div>{invData.docType === 'credit_note' && invData.refInvNo && (<div className="grid grid-cols-[max-content_1fr] gap-x-2 items-center text-right mb-1"><span className="font-bold text-slate-500 text-xs text-left">อ้างอิง</span><span className="text-right text-[10px] font-bold text-rose-600 text-right">{invData.refInvNo}</span></div>)}{invData.orderId && (<div className="grid grid-cols-[max-content_1fr] gap-x-2 items-center text-right"><span className="font-bold text-slate-500 text-xs text-left">Order ID</span><span className="text-right text-[10px] font-mono text-right">{invData.orderId}</span></div>)}</div></div>
                    </div>
                    <div className="border border-slate-300 p-4 mb-4 flex flex-col gap-1 text-left text-left"><div className="text-xs font-bold text-slate-400 uppercase mb-1 text-left">ลูกค้า (Customer)</div><p className="font-bold text-base text-left">{invData.customerName}</p><p className="text-slate-600 text-sm leading-relaxed text-left">{invData.address}</p><p className="text-slate-600 text-xs text-left">เลขผู้เสียภาษี: {invData.taxId || '-'}</p></div>
                    <table className="w-full mb-6 border-collapse text-left text-[10px] text-left"><thead><tr className="bg-slate-100 text-slate-800 font-bold uppercase text-center"><th className="py-2 border-y border-slate-300 w-10 text-center">No.</th><th className="py-2 border-y border-slate-300 text-left pl-2 text-left">Description</th><th className="py-2 border-y border-slate-300 w-14 text-center text-center">Qty</th><th className="py-2 border-y border-slate-300 w-20 text-right text-right">Price</th><th className="py-2 border-y border-slate-300 w-24 text-right text-right">Amount</th></tr></thead><tbody>{invData.items.map((it, i) => (<tr key={i} className="text-left"><td className="py-1.5 border-b border-slate-200 text-center">{i+1}</td><td className="py-1.5 border-b border-slate-200 pl-2 text-left">{it.desc}</td><td className="py-1.5 border-b border-slate-200 text-center">{it.qty}</td><td className="py-1.5 border-b border-slate-200 text-right">{formatCurrency(it.price)}</td><td className="p-1.5 border-b border-slate-200 text-right pr-2 font-bold">{formatCurrency(it.qty * it.price)}</td></tr>))}</tbody></table>
                    <div className="flex justify-between items-start text-left"><div className="flex-1 mt-4 mr-4 text-left"><div className="bg-white p-2 border border-slate-400 text-center font-bold text-slate-900 text-[11px] text-center">({THBText(totals.total)})</div><div className="mt-8 text-[10px] text-slate-500 text-left text-left">หมายเหตุ: {invData.notes}</div></div><div className="w-[45%] text-right text-[10px] space-y-1 text-right"><div className="flex justify-between px-2 text-right"><span>รวมสินค้า (Subtotal)</span><span>{formatCurrency(totals.sub)}</span></div>{invData.discount > 0 && <div className="flex justify-between px-2 text-rose-600 text-right"><span>ส่วนลด (Discount)</span><span>-{formatCurrency(invData.discount)}</span></div>}<div className="flex justify-between px-2 pt-1 border-t border-slate-200 text-right"><span>รวมก่อนภาษี (Net Before VAT)</span><span>{formatCurrency(totals.preVat)}</span></div><div className="flex justify-between px-2 text-right"><span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span><span>{formatCurrency(totals.vat)}</span></div><div className="flex justify-between font-bold border-t-2 border-black pt-1 text-base text-right"><span>ยอดเงินสุทธิ (Grand Total)</span><span>{formatCurrency(totals.total)}</span></div></div></div>
                    <div className="mt-20 grid grid-cols-2 gap-10 text-center">
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
  const [currentAppId, setCurrentAppId] = useState(localStorage.getItem('merchant_app_id') || CONSTANTS.IDS.PROD);
  const [toasts, setToasts] = useState([]);
  const [preFillInvoice, setPreFillInvoice] = useState(null);
  const [showIdDeleteTool, setShowIdDeleteTool] = useState(false);
  const [targetIdToDelete, setTargetIdToDelete] = useState('');

  const addToast = (message, type = 'success') => { const id = Date.now() + Math.random(); setToasts(prev => [...prev, { id, message, type }]); setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000); };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  const toggleAppMode = () => { const ids = Object.values(CONSTANTS.IDS); const nextId = ids[(ids.indexOf(currentAppId) + 1) % ids.length]; setCurrentAppId(nextId); localStorage.setItem('merchant_app_id', nextId); addToast(`ฐานข้อมูล: ${nextId}`, "success"); };

  useEffect(() => { const initAuth = async () => { try { await signInAnonymously(authInstance); onAuthStateChanged(authInstance, (newUser) => setUser(newUser)); } catch (e) { addToast("Connection Failed", "error"); } }; initAuth(); }, []);
   
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
      const invMatch = invoices.find(inv => inv.invNo === targetIdToDelete || inv.id === targetIdToDelete);
      const transMatch = transactions.find(t => t.orderId === targetIdToDelete || t.id === targetIdToDelete);
      if (invMatch) { await deleteDoc(doc(dbInstance, 'artifacts', currentAppId, 'public', 'data', 'invoices', invMatch.id)); addToast("ลบใบกำกับสำเร็จ", "success"); } 
      else if (transMatch) { const coll = transMatch.type === 'income' ? 'transactions_income' : 'transactions_expense'; await deleteDoc(doc(dbInstance, 'artifacts', currentAppId, 'public', 'data', coll, transMatch.id)); addToast("ลบรายการสำเร็จ", "success"); } 
      else { addToast("ไม่พบข้อมูล", "error"); }
      setTargetIdToDelete(''); setShowIdDeleteTool(false);
    } catch(e) { addToast("ลบไม่สำเร็จ", "error"); }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard transactions={transactions} invoices={invoices} />;
      case 'records': return <RecordManager user={user} transactions={transactions} invoices={invoices} appId={currentAppId} stockBatches={stockBatches} showToast={addToast} onIssueInvoice={(t)=>{setPreFillInvoice(t); setActiveTab('invoice');}} />;
      case 'import': return <DataImporter appId={currentAppId} showToast={addToast} user={user} />;
      case 'stock': return <StockManager appId={currentAppId} stockBatches={stockBatches} showToast={addToast} user={user} />;
      case 'invoice': return <InvoiceGenerator user={user} invoices={invoices} transactions={transactions} appId={currentAppId} showToast={addToast} preFillData={preFillInvoice} />;
      case 'reports': return <TaxReports transactions={transactions} invoices={invoices} stockBatches={stockBatches} showToast={addToast} appId={currentAppId} user={user} />;
      default: return <Dashboard transactions={transactions} invoices={invoices} />;
    }
  };

  if (loading && !user) return <LoadingScreen />;

  return (
    <div className="flex w-full h-screen bg-slate-50 font-sarabun text-slate-800 overflow-hidden text-left">
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {showIdDeleteTool && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 text-center"><div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-center"><AlertCircle size={40} className="text-center"/></div><h3 className="text-2xl font-black text-center mb-2 text-center text-slate-800 text-center">ระบุ ID ที่ต้องการลบ</h3><input value={targetIdToDelete} onChange={e=>setTargetIdToDelete(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 mb-6 font-bold text-center text-lg text-slate-800 text-center" placeholder="ID หรือ INV No." /><div className="flex gap-4 text-center"><button onClick={()=>setShowIdDeleteTool(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 text-center">ยกเลิก</button><button onClick={forceDeleteById} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold text-center">ยืนยัน</button></div></div>
        </div>
      )}
      <aside className="w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800 shadow-2xl h-full shrink-0 text-left">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3 text-left"><div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg text-center"><Wallet size={20} className="text-white text-center"/></div><h1 className="text-xl font-bold tracking-tight text-left">MerchantTax</h1></div>
        <nav className="p-6 space-y-4 flex-1 overflow-y-auto text-left"><NavButton active={activeTab === 'dashboard'} onClick={()=>{setActiveTab('dashboard');}} icon={<PieChart size={18} className="text-center"/>} label="แดชบอร์ด" /><p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 opacity-50 text-left">Operations</p><NavButton active={activeTab === 'records'} onClick={()=>{setActiveTab('records');}} icon={<Store size={18} className="text-center"/>} label="บันทึกขาย/หน้าร้าน" /><NavButton active={activeTab === 'import'} onClick={()=>{setActiveTab('import');}} icon={<FileUp size={18} className="text-center"/>} label="Bulk Import" /><NavButton active={activeTab === 'stock'} onClick={()=>{setActiveTab('stock');}} icon={<Box size={18} className="text-center"/>} label="คลังสินค้า FIFO" /><NavButton active={activeTab === 'invoice'} onClick={()=>{setActiveTab('invoice'); setPreFillInvoice(null);}} icon={<Printer size={18} className="text-center"/>} label="ใบกำกับภาษี Pro" /><NavButton active={activeTab === 'reports'} onClick={()=>{setActiveTab('reports');}} icon={<ClipboardList size={18} className="text-center"/>} label="รายงานภาษีและบัญชี" /></nav>
        <div className="p-4 bg-black/20 border-t border-slate-800 space-y-2 text-left"><button onClick={toggleAppMode} className="w-full py-3 px-4 rounded-xl text-[10px] font-bold flex items-center justify-start gap-2 bg-slate-800 text-indigo-300 ring-1 ring-slate-700 hover:bg-slate-700 transition-all text-left"><Database size={14} className="text-center"/> DB Instance: {currentAppId}</button><button onClick={()=>setShowIdDeleteTool(true)} className="w-full py-3 px-4 rounded-xl text-[10px] font-bold flex items-center justify-start gap-2 bg-rose-900/30 text-rose-300 ring-1 ring-rose-800/50 hover:bg-rose-900/50 transition-all text-left"><Trash2 size={14} className="text-center"/> ลบทิ้งด้วย ID</button></div>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden relative text-left">
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 p-5 lg:px-10 flex justify-between items-center z-10 h-20 shrink-0 text-left"><div className="flex items-center gap-4 text-left"><h2 className="font-bold text-slate-800 text-sm uppercase tracking-widest text-left">{activeTab.replace('_', ' ')}</h2></div>{loading && <div className="text-[10px] font-black text-indigo-600 flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 animate-pulse text-left"><Loader size={12} className="animate-spin text-center"/> SYNCING</div>}</header>
        <div className="flex-1 overflow-auto p-6 lg:p-10 relative bg-[#f8fafc] text-left">{renderContent()}</div>
      </main>
    </div>
  );
}
