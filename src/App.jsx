import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PieChart, Wallet, FileText, Calculator, Save, TrendingUp, TrendingDown, 
  Download, Trash2, Edit, Menu, X, Printer, 
  CheckCircle, Loader, User, Package, Search, Clock, List, Settings, PlusCircle, Tag,
  Store, Database, Image as ImageIcon, BarChart2, Activity, ShoppingBag, Eye, EyeOff, Inbox, XCircle, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, AlertTriangle, Calendar, Info, MapPin, Building, Layers, ArrowRightLeft, Percent, ClipboardList, Briefcase,
  Camera, Sparkles, ScanText, Zap, ChevronRight, Truck, Ticket, CreditCard, FileUp, Hash, Copy, FileCheck, Box, History, AlertCircle, ShoppingCart, Truck as TruckIcon,
  RefreshCw, Plus, FileSpreadsheet, DownloadCloud, Users, Layers as LayersIcon, Filter, ArrowRight, FileJson
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
    const numbers = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
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
    // Filter transactions by selected channel
    const filteredTrans = transactions.filter(t => 
        selectedChannel === 'all' || 
        (t.channel || 'หน้าร้าน').toUpperCase() === selectedChannel.toUpperCase()
    );

    const inc = filteredTrans.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.total) || 0), 0);
    const exp = filteredTrans.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.total) || 0), 0);
    
    // Invoices generally apply to total company, but we display unpaid normally
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

  const cleanNum = (val) => { if (typeof val === 'number') return val; if (!val) return 0; return parseFloat(String(val).replace(/[^0-9.-]+/g, "")) || 0; };
  const findVal = (row, kws) => { 
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

        raw.forEach(row => {
          const orderId = String(findVal(row, ['หมายเลขคำสั่งซื้อ', 'Order ID']) || '');
          const status = String(findVal(row, ['สถานะการสั่งซื้อ', 'Order Status']) || '').toLowerCase();
          const isCompleted = status.includes('สำเร็จ') || status.includes('completed') || status.includes('delivered');
          const dateVal = findVal(row, ['เวลาการชำระสินค้า', 'Payment Time']);
          if (!orderId || !isCompleted || !dateVal) { skipped++; return; }
          const price = cleanNum(findVal(row, ['ราคาขาย', 'Deal Price']));
          const qty = cleanNum(findVal(row, ['จำนวน', 'Quantity'])) || 1;
          const transFee = cleanNum(findVal(row, ['Transaction Fee']));
          const comm = cleanNum(findVal(row, ['ค่าคอมมิชชั่น', 'Commission Fee']));
          const serv = cleanNum(findVal(row, ['ค่าบริการ', 'Service Fee']));
          const infra = parseFloat(fixedInfraFee || 0);

          if (!ordersMap[orderId]) {
            ordersMap[orderId] = { 
              type: 'income', date: normalizeDate(dateVal), orderId, total: price * qty, platformFee: transFee + comm + serv + infra,
              transactionFee: transFee, infrastructureFee: infra, commissionFee: comm, serviceFee: serv,
              description: findVal(row, ['ชื่อสินค้า', 'Product Name']), channel: platform.toUpperCase(), category: 'รายได้จากการขายสินค้า', 
              items: [{ desc: `${findVal(row, ['ชื่อสินค้า', 'Product Name'])}`, qty, amount: price * qty, price, sellPrice: price, buyPrice: 0 }],
              partnerName: findVal(row, ['ชื่อผู้รับ']),
              grandTotal: price * qty - (transFee + comm + serv + infra)
            };
            totalAmt += (price * qty); totalFees += (transFee + comm + serv + infra);
          } else {
            ordersMap[orderId].total += (price * qty);
            ordersMap[orderId].items.push({ desc: `${findVal(row, ['ชื่อสินค้า', 'Product Name'])}`, qty, amount: price * qty, price, sellPrice: price, buyPrice: 0 });
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
    <div className="space-y-6 animate-fadeIn font-sarabun text-left pb-10 w-full h-full text-left">
      <div className="flex justify-between items-center text-left">
        <h3 className="text-2xl font-bold flex items-center gap-2 text-left"><Sparkles className="text-indigo-600"/> Import Data</h3>
        <div className="flex gap-2">
            {['shopee', 'lazada', 'tiktok'].map(p => (
              <button key={p} onClick={() => setPlatform(p)} className={`px-4 py-2 rounded-xl text-xs font-bold border-2 ${platform === p ? 'border-indigo-600 bg-indigo-600 text-white' : 'bg-white text-slate-800'}`}>
                {p.toUpperCase()}
              </button>
            ))}
        </div>
      </div>
       
      <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex items-center gap-6 text-left">
        <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600 border border-indigo-100 text-center"><Settings size={24}/></div>
        <div className="flex-1 space-y-1 text-left">
          <p className="text-xs font-black text-indigo-600 uppercase tracking-widest text-left">Configuration (การตั้งค่าการนำเข้า)</p>
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
              <p className="text-[10px] text-slate-400 font-medium text-left">/ หมายเลขคำสั่งซื้อ (จะถูกหักลบอัตโนมัติ)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col gap-4 text-left">
          <div className="space-y-2 text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">Upload Excel File</p>
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
  const [isProcessing, setIsProcessing] = useState(false);
  
  // เพิ่ม State สำหรับการแก้ไขหมวดหมู่
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [targetProductEdit, setTargetProductEdit] = useState(null);
  const [tempCategory, setTempCategory] = useState('');

  const fileInputRef = useRef(null);
  const importFileInputRef = useRef(null);
  const [newStock, setNewStock] = useState({
    productName: '', skuType: 'auto', skuManual: '', productSku: '', variationSku: '', category: CONSTANTS.CATEGORIES.STOCK[0], quantity: '', costPerUnit: '', date: formatDateISO(new Date())
  });

  const generateAutoSKU = () => {
    const datePart = new Date().toISOString().slice(2,10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `MT-${datePart}-${randomPart}`;
  };

  // ฟังก์ชันเปิด Modal แก้ไขหมวดหมู่
  const openEditCategory = (item) => {
    setTargetProductEdit(item);
    setTempCategory(item.category || CONSTANTS.CATEGORIES.STOCK[0]);
    setShowEditCategoryModal(true);
  };

  // ฟังก์ชันบันทึกการแก้ไขหมวดหมู่
  const handleUpdateCategory = async () => {
    if (!targetProductEdit || !user) return;
    setIsProcessing(true);
    try {
      const batchWriter = writeBatch(dbInstance);
      // อัปเดตหมวดหมู่ของทุก Lot ที่เป็นสินค้าตัวเดียวกัน
      targetProductEdit.batches.forEach(b => {
           const docRef = doc(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches', b.id);
           batchWriter.update(docRef, { category: tempCategory });
      });

      await batchWriter.commit();
      showToast(`อัปเดตหมวดหมู่ "${targetProductEdit.name}" เป็น "${tempCategory}" เรียบร้อย`, "success");
      setShowEditCategoryModal(false);
      setTargetProductEdit(null);
    } catch (e) {
      showToast("เกิดข้อผิดพลาดในการอัปเดต: " + e.message, "error");
    }
    setIsProcessing(false);
  };

  // ฟังก์ชันสำหรับการ Import Excel เข้า Stock
  const handleStockImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const processFile = (f) => {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = window.XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = window.XLSX.utils.sheet_to_json(ws);
                const batch = writeBatch(dbInstance);
                let count = 0;

                data.forEach((row) => {
                    const name = row['ชื่อสินค้า'] || row['Product Name'] || row['Name'];
                    const qty = Number(row['จำนวน'] || row['Quantity'] || row['Qty']);
                    const cost = Number(row['ต้นทุน'] || row['Cost'] || row['Cost Per Unit'] || 0);
                    const skuInput = row['SKU'] || row['sku'];
                    
                    if (name && qty > 0) {
                        // สร้าง SKU ถ้าไม่มีมาให้ในไฟล์
                        const finalSku = skuInput || `IMP-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
                        const date = normalizeDate(row['วันที่'] || row['Date']) || new Date();

                        // สร้างรายการ Stock
                        const newRef = doc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches'));
                        batch.set(newRef, {
                            productName: name,
                            sku: finalSku,
                            quantity: qty,
                            costPerUnit: cost,
                            date: date,
                            sold: 0,
                            userId: user.uid,
                            createdAt: serverTimestamp(),
                            category: 'Imported'
                        });
                        
                        // สร้างรายการรายจ่าย (Optional)
                        if (cost > 0) {
                             const expRef = doc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'transactions_expense'));
                             batch.set(expRef, {
                                type: 'expense',
                                category: 'ต้นทุนสินค้า',
                                description: `Import Stock: ${name}`,
                                total: qty * cost,
                                date: date,
                                userId: user.uid,
                                createdAt: serverTimestamp(),
                                isFromInventory: true
                             });
                        }
                        count++;
                    }
                });

                if (count > 0) {
                    await batch.commit();
                    showToast(`นำเข้าสำเร็จ ${count} รายการ`, "success");
                } else {
                    showToast("ไม่พบข้อมูลที่ถูกต้องในไฟล์", "error");
                }
            } catch (error) {
                console.error(error);
                showToast("เกิดข้อผิดพลาด: " + error.message, "error");
            }
            setIsProcessing(false);
            if (importFileInputRef.current) importFileInputRef.current.value = '';
        };
        reader.readAsBinaryString(f);
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
    if (!user || !newStock.productName) return;
    if (isProcessing) return; // ป้องกันการกดซ้ำ
     
    setIsProcessing(true); // เริ่มสถานะกำลังบันทึก
    try {
      const finalSKU = newStock.skuType === 'auto' ? generateAutoSKU() : newStock.skuManual;
      const quantityNum = Number(newStock.quantity) || 0;
      
      // Validation: ป้องกันการบันทึกหากไม่ได้ใส่จำนวน หรือจำนวนเป็น 0
      if (quantityNum <= 0) {
        showToast("กรุณาระบุจำนวนสินค้าให้ถูกต้อง (ต้องมากกว่า 0)", "error");
        setIsProcessing(false);
        return;
      }

      const costPerUnitNum = Number(newStock.costPerUnit) || 0;
      const totalCost = quantityNum * costPerUnitNum;

      const batchData = {
        productName: newStock.productName,
        sku: finalSKU,
        productSku: newStock.productSku || '',
        variationSku: newStock.variationSku || '',
        category: newStock.category,
        quantity: quantityNum,
        costPerUnit: costPerUnitNum,
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
          description: `ซื้อสต็อก: ${newStock.productName} (SKU: ${finalSKU})`,
          total: totalCost,
          date: normalizeDate(newStock.date),
          userId: user.uid,
          createdAt: serverTimestamp(),
          isFromInventory: true
        });
      }

      showToast("บันทึกข้อมูลสินค้าเรียบร้อย", "success");
      setShowAddStockModal(false);
      setNewStock({ productName: '', skuType: 'auto', skuManual: '', productSku: '', variationSku: '', category: CONSTANTS.CATEGORIES.STOCK[0], quantity: '', costPerUnit: '', date: formatDateISO(new Date()) });
    } catch (e) { showToast("เกิดข้อผิดพลาดในการบันทึก", "error"); }
    setIsProcessing(false); // จบสถานะกำลังบันทึก
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
      showToast(`ลบรายการสินค้า "${deleteStockConfirm.name}" เรียบร้อย`, "success");
      setDeleteStockConfirm(null);
    } catch (e) { showToast("ไม่สามารถลบรายการได้", "error"); }
    setIsProcessing(false);
  };

  const inventory = useMemo(() => {
    const map = {};
    stockBatches.forEach(batch => {
      const name = batch.productName || 'ไม่ระบุชื่อสินค้า';
      if (!map[name]) {
        map[name] = { name, sku: batch.sku || '-', totalQty: 0, totalValue: 0, batches: [], category: batch.category || 'ทั่วไป', status: 'In Stock' };
      }
      const remaining = Number(batch.quantity) - Number(batch.sold || 0);
      if (remaining >= 0) {
        map[name].totalQty += remaining;
        map[name].totalValue += (remaining * Number(batch.costPerUnit || 0));
        map[name].batches.push({ ...batch, remaining });
      }
    });
    return Object.values(map)
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a,b) => b.totalQty - a.totalQty);
  }, [stockBatches, searchTerm]);

  return (
    <div className="space-y-6 animate-fadeIn font-sarabun text-left w-full h-full pb-20 text-left">
      <div className="flex justify-between items-center flex-wrap gap-4 text-left">
        <h3 className="text-2xl font-bold flex items-center gap-2 text-left text-slate-800"><Box className="text-indigo-600"/> คลังสินค้า (FIFO)</h3>
        <div className="flex items-center gap-2 text-left">
          <div className="relative w-64 text-left">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
            <input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800" placeholder="ค้นชื่อสินค้า หรือ SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
          </div>
          
          {/* ปุ่ม Import Stock */}
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
                <tr>
                    <th className="p-5 text-left">SKU / Product Name</th>
                    <th className="p-5 text-center">Category</th>
                    <th className="p-5 text-right">Remaining Qty</th>
                    <th className="p-5 text-right">Inv. Value</th>
                    <th className="p-5 text-center">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-left">
                {inventory.map((item, idx) => {
                  const activeLots = item.batches.filter(b => b.remaining > 0).length;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors cursor-pointer group text-left">
                        <td className="p-5 text-left text-left" onClick={() => setViewHistory(item)}>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-6 text-left">
          <div className="bg-slate-900 p-8 rounded-[40px] shadow-xl text-white relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-right"><Box size={120}/></div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 text-left">Total Assets Value</p>
            <h2 className="text-4xl font-black mb-2 text-left">{formatCurrency(inventory.reduce((s,i)=>s+i.totalValue, 0))}</h2>
            <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4 text-left">
              <div className="text-left"><p className="text-[10px] text-slate-500 uppercase font-bold text-left">Total Units</p><p className="text-xl font-bold text-left">{inventory.reduce((s,i)=>s+i.totalQty, 0).toLocaleString()}</p></div>
              <div className="text-left"><p className="text-[10px] text-slate-500 uppercase font-bold text-left">Total Batches</p><p className="text-xl font-bold text-left">{stockBatches.length}</p></div>
            </div>
          </div>
        </div>
      </div>

      {showAddStockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[600] flex items-center justify-center p-4 text-left">
           <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh] text-left">
              <div className="p-6 border-b flex justify-between items-center text-left"><h3 className="text-xl font-black text-slate-800 flex items-center gap-2 text-left text-left"><PlusCircle className="text-indigo-600"/> ลงรายการใหม่</h3><button onClick={() => setShowAddStockModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-center"><X/></button></div>
              <form onSubmit={handleAddStock} className="p-8 space-y-6 overflow-y-auto text-left text-left">
                 <div className="space-y-2 text-left text-left"><label className="text-[10px] font-bold uppercase text-slate-400 text-left">ชื่อสินค้า</label><input required value={newStock.productName} onChange={e=>setNewStock({...newStock, productName: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border-0 font-bold outline-none text-slate-800" /></div>
                 <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-2 bg-emerald-50 p-4 rounded-3xl border border-emerald-100 text-left text-left"><label className="text-[10px] font-bold uppercase text-emerald-600 text-left">จำนวนที่รับเข้า</label><input type="number" value={newStock.quantity} onChange={e=>setNewStock({...newStock, quantity: e.target.value})} className="w-full bg-white p-3 rounded-xl border-0 text-lg font-black text-center text-emerald-700 outline-none" placeholder="0" /></div>
                    <div className="space-y-2 bg-indigo-50 p-4 rounded-3xl border border-indigo-100 text-left text-left"><label className="text-[10px] font-bold uppercase text-indigo-600 text-left">ต้นทุนต่อหน่วย</label><input type="number" step="0.01" value={newStock.costPerUnit} onChange={e=>setNewStock({...newStock, costPerUnit: e.target.value})} className="w-full bg-white p-3 rounded-xl border-0 text-lg font-black text-center text-indigo-700 outline-none" placeholder="0.00" /></div>
                 </div>
                 <div className="pt-4 text-center">
                    <button type="submit" disabled={isProcessing} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 text-center disabled:opacity-50 disabled:cursor-not-allowed">
                        {isProcessing ? <Loader className="animate-spin" size={24}/> : <Save size={24}/>} 
                        {isProcessing ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {viewHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[40px] w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 text-left">
            <div className="p-6 border-b flex justify-between items-center text-left text-left text-left"><div><h3 className="text-xl font-bold text-slate-800 text-left">Lot History: {viewHistory.name}</h3><p className="text-xs text-slate-400 text-left">รายละเอียดต้นทุนรอบการซื้อ</p></div><button onClick={() => setViewHistory(null)} className="p-2 hover:bg-slate-100 rounded-full text-center"><X/></button></div>
            <div className="flex-1 overflow-auto p-6 space-y-4 text-left text-left">
              {viewHistory.batches.sort((a,b)=>normalizeDate(a.date)-normalizeDate(b.date)).map((b, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4 text-left">
                  <div className="flex justify-between items-start text-left text-left">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase text-left">Lot {i+1} - รับเข้า {formatDate(b.date)}</p>
                      <p className="text-base font-black text-indigo-600 text-left">{formatCurrency(b.costPerUnit)} / หน่วย</p>
                    </div>
                    <div className="text-right text-right">
                      <p className="text-xs text-slate-400 font-bold text-right">สินค้าคงเหลือ</p>
                      <p className="text-xl font-black text-slate-900 text-right">{b.remaining} / {b.quantity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t bg-slate-50 rounded-b-[40px] text-center text-center"><button onClick={()=>setViewHistory(null)} className="w-full py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 text-center">ปิด</button></div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && targetProductEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[700] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 text-center"><Edit size={32}/></div>
            <h3 className="text-xl font-bold mb-2 text-center text-slate-800">แก้ไขหมวดหมู่สินค้า</h3>
            <p className="text-sm font-bold text-indigo-600 mb-6 text-center">{targetProductEdit.name}</p>
            
            <div className="text-left mb-6">
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">เลือกหมวดหมู่ใหม่</label>
                <select 
                    value={tempCategory} 
                    onChange={(e) => setTempCategory(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                >
                    {CONSTANTS.CATEGORIES.STOCK.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="flex gap-3 text-center">
              <button onClick={() => setShowEditCategoryModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button>
              <button onClick={handleUpdateCategory} disabled={isProcessing} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 text-center flex items-center justify-center gap-2">
                {isProcessing && <Loader className="animate-spin" size={16}/>} บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for StockManager */}
      {deleteStockConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[700] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-center"><Trash2 size={32}/></div>
            <h3 className="text-xl font-bold mb-2 text-center text-slate-800">ยืนยันลบสินค้า?</h3>
            <p className="text-xs text-slate-400 mb-6 text-center">
              คุณกำลังจะลบ <b>"{deleteStockConfirm.name}"</b><br/>
              การกระทำนี้จะลบประวัติล็อตสินค้าทั้งหมดของรายการนี้ และไม่สามารถกู้คืนได้
            </p>
            <div className="flex gap-3 text-center">
              <button onClick={() => setDeleteStockConfirm(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button>
              <button onClick={handleDeleteInventory} disabled={isProcessing} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100 text-center flex items-center justify-center gap-2">
                {isProcessing && <Loader className="animate-spin" size={16}/>} ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- PROFESSIONAL TAX REPORTS COMPONENT ---
function TaxReports({ transactions, invoices, stockBatches, showToast }) {
  const [reportTab, setReportTab] = useState('sales');
  const [startDate, setStartDate] = useState(formatDateISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [endDate, setEndDate] = useState(formatDateISO(new Date()));
  const [isExporting, setIsExporting] = useState(false);
  
  // เพิ่ม State สำหรับจัดการข้อมูลร้านค้าและการแก้ไข
  const [sellerInfo, setSellerInfo] = useState({});
  const [showEditSeller, setShowEditSeller] = useState(false);
  const [tempSellerData, setTempSellerData] = useState({});
  const [selectedBranch, setSelectedBranch] = useState('all');

  // โหลดข้อมูลจาก localStorage เมื่อเปิดหน้า
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('merchant_seller_info') || '{}');
      setSellerInfo(saved);
    } catch (e) {
      setSellerInfo({});
    }
  }, []);

  // ฟังก์ชันบันทึกข้อมูลลง localStorage
  const handleSaveSeller = (e) => {
    e.preventDefault();
    localStorage.setItem('merchant_seller_info', JSON.stringify(tempSellerData));
    setSellerInfo(tempSellerData);
    setShowEditSeller(false);
    if (showToast) showToast("บันทึกข้อมูลร้านค้าเรียบร้อย", "success");
  };

  const openEditModal = () => {
    setTempSellerData(sellerInfo);
    setShowEditSeller(true);
  };

  // Filtering data by date range & branch
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const d = normalizeDate(inv.date);
      const dateMatch = d >= new Date(startDate) && d <= new Date(endDate);
      const branchMatch = selectedBranch === 'all' || (inv.branch || '00000') === selectedBranch;
      return dateMatch && branchMatch;
    });
  }, [invoices, startDate, endDate, selectedBranch]);

  const filteredExpenses = useMemo(() => {
    return transactions.filter(t => {
      const d = normalizeDate(t.date);
      const dateMatch = d >= new Date(startDate) && d <= new Date(endDate);
      // สมมติว่าค่าใช้จ่ายใน RecordManager ปัจจุบันผูกกับสำนักงานใหญ่ '00000' (เพราะยังไม่มี field ให้กรอกสาขาที่จ่าย)
      const branchMatch = selectedBranch === 'all' || selectedBranch === '00000';
      return t.type === 'expense' && dateMatch && branchMatch;
    });
  }, [transactions, startDate, endDate, selectedBranch]);

  const filteredMovement = useMemo(() => {
    const movements = [];
    stockBatches.forEach(b => { 
      const d = normalizeDate(b.date);
      if (d >= new Date(startDate) && d <= new Date(endDate)) {
        movements.push({ date: d, sku: b.sku, name: b.productName, type: 'IN', qty: b.quantity, price: b.costPerUnit }); 
      }
    });
    transactions.filter(t => t.type === 'income').forEach(t => {
      const d = normalizeDate(t.date);
      if (d >= new Date(startDate) && d <= new Date(endDate)) {
        t.items?.forEach(item => {
          movements.push({ date: d, sku: t.sku || '-', name: item.desc, type: 'OUT', qty: item.qty, price: item.sellPrice });
        });
      }
    });
    return movements.sort((a, b) => b.date - a.date);
  }, [stockBatches, transactions, startDate, endDate]);

  // VAT Calculations
  const vatAnalysis = useMemo(() => {
    const outputVat = filteredInvoices.reduce((s, inv) => s + ((Number(inv.vat) || 0) * (inv.docType === 'credit_note' ? -1 : 1)), 0);
    const outputBase = filteredInvoices.reduce((s, inv) => s + ((Number(inv.preVat) || 0) * (inv.docType === 'credit_note' ? -1 : 1)), 0);
    
    // Purchase VAT calculation (Excluding non-creditable VAT)
    const inputVat = filteredExpenses.reduce((s, t) => s + (t.isNonCreditableVat ? 0 : ((Number(t.total) || 0) * 7 / 107)), 0);
    const inputBase = filteredExpenses.reduce((s, t) => s + (t.isNonCreditableVat ? 0 : ((Number(t.total) || 0) * 100 / 107)), 0);

    return { outputVat, outputBase, inputVat, inputBase, net: outputVat - inputVat };
  }, [filteredInvoices, filteredExpenses]);

  // Calculate Totals for Table Footer
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
      return {
        base: acc.base + base,
        vat: acc.vat + vat,
        total: acc.total + total
      };
    }, { base: 0, vat: 0, total: 0 });
  }, [filteredExpenses]);

  // Handle Export Excel Function
  const handleExportExcel = async () => {
    setIsExporting(true);
    if (showToast) showToast("กำลังเตรียมไฟล์ Excel...", "success");

    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      await new Promise((resolve) => {
        script.onload = resolve;
        document.body.appendChild(script);
      });
    }

    let fileName = "";
    let dataRows = [];

    // Helper to fix decimals
    const toFixedNum = (num) => Number(Number(num).toFixed(2));

    // Prepare Header Information (Reordered as requested)
    const headerRows = [
        [`รายงาน: ${reportTab === 'sales' ? 'ภาษีขาย (Sales Tax Report)' : reportTab === 'purchase' ? 'ภาษีซื้อ (Purchase Tax Report)' : 'ทะเบียนคุมสินค้า (Stock Movement)'}`],
        [`ระหว่างวันที่: ${formatDate(startDate)} ถึง ${formatDate(endDate)}`],
        [sellerInfo.sellerName || 'ชื่อผู้ประกอบการ (ไม่ระบุ)'],
        [[sellerInfo.sellerAddress, sellerInfo.sellerSubDistrict, sellerInfo.sellerDistrict, sellerInfo.sellerProvince, sellerInfo.sellerZipCode].filter(Boolean).join(' ') || 'ที่อยู่ (ไม่ระบุ)'],
        [`เลขประจำตัวผู้เสียภาษี: ${sellerInfo.sellerTaxId || '-'}   สาขา: ${sellerInfo.sellerBranchId || '00000'}`],
        [`สาขาที่รายงาน: ${selectedBranch === 'all' ? 'รวมทุกสาขา' : selectedBranch}`],
        [] // Empty row for spacing
    ];

    if (reportTab === 'sales') {
      fileName = `Sales_Tax_Report_${startDate}_to_${endDate}.xlsx`;
      
      const tableHeader = ["ลำดับ", "วันที่", "เลขที่ใบกำกับ", "ชื่อลูกค้า/บริษัท", "สาขา", "เลขผู้เสียภาษี", "ฐานภาษี (Base)", "ภาษีมูลค่าเพิ่ม (VAT 7%)", "ยอดรวม (Total)"];
      
      const body = filteredInvoices.map((inv, i) => {
        const mult = inv.docType === 'credit_note' ? -1 : 1;
        return [
          i + 1,
          formatDate(inv.date),
          inv.invNo + (inv.docType === 'credit_note' ? " (ใบลดหนี้)" : ""),
          inv.customerName,
          inv.branch || '00000',
          inv.taxId || '-',
          toFixedNum((inv.preVat || 0) * mult),
          toFixedNum((inv.vat || 0) * mult),
          toFixedNum((inv.total || 0) * mult)
        ];
      });

      const footer = [
        "รวมทั้งสิ้น", "", "", "", "", "", 
        toFixedNum(salesFooter.base), 
        toFixedNum(salesFooter.vat), 
        toFixedNum(salesFooter.total)
      ];

      dataRows = [...headerRows, tableHeader, ...body, footer];

    } else if (reportTab === 'purchase') {
      fileName = `Purchase_Tax_Report_${startDate}_to_${endDate}.xlsx`;
      
      const tableHeader = ["ลำดับ", "วันที่", "รายการ", "ผู้ขาย", "สาขา", "มูลค่าสินค้า", "ภาษีซื้อ (VAT 7%)", "ยอดจ่ายสุทธิ"];
      
      const body = filteredExpenses.map((row, i) => [
        i + 1,
        formatDate(row.date),
        row.description + (row.isNonCreditableVat ? " (ภาษีซื้อต้องห้าม)" : ""),
        row.partnerName || '-',
        row.partnerBranch || '00000',
        toFixedNum(row.isNonCreditableVat ? row.total : Number(row.total) * 100 / 107),
        toFixedNum(row.isNonCreditableVat ? 0 : Number(row.total) * 7 / 107),
        toFixedNum(row.total)
      ]);

      const footer = [
        "รวมทั้งสิ้น", "", "", "", "", 
        toFixedNum(purchaseFooter.base),
        toFixedNum(purchaseFooter.vat),
        toFixedNum(purchaseFooter.total)
      ];

      dataRows = [...headerRows, tableHeader, ...body, footer];

    } else if (reportTab === 'inventory') {
      fileName = `Inventory_Movement_${startDate}_to_${endDate}.xlsx`;
      
      const tableHeader = ["ลำดับ", "วันที่", "SKU", "สินค้า", "ประเภท", "จำนวน", "ราคาต่อหน่วย"];
      
      const body = filteredMovement.map((row, i) => [
        i + 1,
        formatDate(row.date),
        row.sku,
        row.name,
        row.type,
        Number(row.qty),
        toFixedNum(row.price)
      ]);

      dataRows = [...headerRows, tableHeader, ...body];
    }

    try {
      const ws = window.XLSX.utils.aoa_to_sheet(dataRows); // Use Array of Arrays for custom layout
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Report");
      window.XLSX.writeFile(wb, fileName);
      if (showToast) showToast("ส่งออกไฟล์สำเร็จ", "success");
    } catch (e) {
      if (showToast) showToast("เกิดข้อผิดพลาดในการส่งออก: " + e.message, "error");
    }
    setIsExporting(false);
  };

  const TabBtn = ({ id, label, icon }) => (
    <button onClick={() => setReportTab(id)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${reportTab === id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}>
        {icon} {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-fadeIn text-left font-sarabun w-full h-full pb-10">
      
      {/* Store Header Info */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start gap-6 relative group">
        <button onClick={openEditModal} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors">
            <Edit size={18} />
        </button>
        <div className="space-y-2">
           <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg"><Store size={24}/></div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{sellerInfo.sellerName || 'ยังไม่ได้ตั้งชื่อร้านค้า (คลิกแก้ไข)'}</h2>
           </div>
           <div className="pl-1 space-y-1">
              <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                {[sellerInfo.sellerAddress, sellerInfo.sellerSubDistrict, sellerInfo.sellerDistrict, sellerInfo.sellerProvince, sellerInfo.sellerZipCode].filter(Boolean).join(' ') || 'ที่อยู่ยังไม่ระบุ'}
              </p>
              <div className="flex items-center gap-4 pt-1">
                 <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">TAX ID: {sellerInfo.sellerTaxId || '-'}</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">Branch: {sellerInfo.sellerBranchId || '00000'}</p>
              </div>
           </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1 mt-8 md:mt-0">
            <h1 className="text-2xl font-black text-indigo-600 uppercase tracking-tight">
               {reportTab === 'sales' ? 'รายงานภาษีขาย (Sales Tax Report)' : reportTab === 'purchase' ? 'รายงานภาษีซื้อ (Purchase Tax Report)' : 'ทะเบียนคุมสินค้า (Stock Register)'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
               <Store size={16} className="text-slate-400 ml-2 shrink-0" />
               <select value={selectedBranch} onChange={e=>setSelectedBranch(e.target.value)} className="bg-white border-0 rounded-xl px-3 py-2 text-xs font-bold outline-none shadow-sm cursor-pointer shrink-0">
                  <option value="all">รวมทุกสาขา</option>
                  <option value="00000">สำนักงานใหญ่ (00000)</option>
                  {Array.from(new Set(invoices.map(i => i.branch).filter(b => b && b !== '00000'))).map(b => (
                      <option key={b} value={b}>สาขา {b}</option>
                  ))}
               </select>
               <div className="w-px h-6 bg-slate-200 mx-1 shrink-0"></div>
               <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-white border-0 rounded-xl px-3 py-2 text-xs font-bold outline-none shadow-sm shrink-0"/>
               <ArrowRight size={14} className="text-slate-300 shrink-0"/>
               <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-white border-0 rounded-xl px-3 py-2 text-xs font-bold outline-none shadow-sm shrink-0"/>
            </div>
        </div>
      </div>

      {/* Accounting Filters */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Filter size={20}/></div>
          <div>
            <h3 className="font-bold text-slate-800">รายงานข้อมูลตามเงื่อนไข</h3>
            <p className="text-xs text-slate-400">กรองข้อมูลรายรับ-รายจ่ายเพื่อสรุปงวดบัญชี</p>
          </div>
        </div>
      </div>

      {/* VAT & Transaction Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-emerald-600 p-6 rounded-[32px] text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
           <TrendingUp size={80} className="absolute -bottom-4 -right-4 opacity-10"/>
           <p className="text-[10px] font-black uppercase tracking-widest opacity-60">ภาษีขายรวม (Output VAT)</p>
           <h4 className="text-3xl font-black mt-1">{formatCurrency(vatAnalysis.outputVat)}</h4>
           <p className="text-xs mt-2 opacity-80">จากฐานรายได้: {formatCurrency(vatAnalysis.outputBase)}</p>
        </div>
        <div className="bg-rose-500 p-6 rounded-[32px] text-white shadow-xl shadow-rose-100 relative overflow-hidden">
           <TrendingDown size={80} className="absolute -bottom-4 -right-4 opacity-10"/>
           <p className="text-[10px] font-black uppercase tracking-widest opacity-60">ภาษีซื้อรวม (Input VAT)</p>
           <h4 className="text-3xl font-black mt-1">{formatCurrency(vatAnalysis.inputVat)}</h4>
           <p className="text-xs mt-2 opacity-80">จากฐานรายจ่าย: {formatCurrency(vatAnalysis.inputBase)}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden">
           <Calculator size={80} className="absolute -bottom-4 -right-4 opacity-10"/>
           <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">VAT สุทธิ (Net Tax)</p>
           <h4 className="text-3xl font-black mt-1">{formatCurrency(Math.abs(vatAnalysis.net))}</h4>
           <p className={`text-xs mt-2 font-bold ${vatAnalysis.net >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {vatAnalysis.net >= 0 ? 'ชำระภาษีเพิ่ม (Due to pay)' : 'ภาษีชำระเกิน (Refund claim)'}
           </p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center">
           <div className="flex items-center gap-2 mb-2">
              <ClipboardList size={16} className="text-indigo-600"/>
              <p className="text-[10px] font-black text-slate-400 uppercase">สรุปรายการ (Count)</p>
           </div>
           <div className="space-y-2">
              <div className="flex justify-between text-xs"><span className="text-slate-500">รวมรายการขาย:</span><span className="font-bold text-slate-800">{filteredInvoices.length} บิล</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">รวมรายการจ่าย:</span><span className="font-bold text-slate-800">{filteredExpenses.length} รายการ</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">การเคลื่อนไหวสต็อก:</span><span className="font-bold text-slate-800">{filteredMovement.length} ครั้ง</span></div>
           </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex gap-4 flex-wrap">
        <TabBtn id="sales" label="รายงานภาษีขาย (Sales)" icon={<FileText size={18}/>} />
        <TabBtn id="purchase" label="รายงานภาษีซื้อ (Purchase)" icon={<ShoppingCart size={18}/>} />
        <TabBtn id="inventory" label="ทะเบียนคุมสินค้า (Movement)" icon={<Box size={18}/>} />
      </div>

      {/* Edit Seller Modal */}
      {showEditSeller && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[800] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Store className="text-indigo-600"/> แก้ไขข้อมูลหัวเอกสาร/ร้านค้า</h3>
              <button onClick={() => setShowEditSeller(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveSeller} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">ชื่อร้านค้า / บริษัท</label>
                <input required className="w-full border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none" value={tempSellerData.sellerName || ''} onChange={e => setTempSellerData({...tempSellerData, sellerName: e.target.value})} placeholder="ระบุชื่อร้าน..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">เลขผู้เสียภาษี</label>
                  <input className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-100 outline-none" value={tempSellerData.sellerTaxId || ''} onChange={e => setTempSellerData({...tempSellerData, sellerTaxId: e.target.value})} placeholder="xxxxxxxxxxxxx" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">สาขา (00000 = สนญ.)</label>
                  <input className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-100 outline-none" value={tempSellerData.sellerBranchId || ''} onChange={e => setTempSellerData({...tempSellerData, sellerBranchId: e.target.value})} placeholder="00000" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">ที่อยู่ (เลขที่, อาคาร, ถนน)</label>
                <input className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none" value={tempSellerData.sellerAddress || ''} onChange={e => setTempSellerData({...tempSellerData, sellerAddress: e.target.value})} placeholder="ระบุที่อยู่..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">แขวง/ตำบล</label>
                  <input className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none" value={tempSellerData.sellerSubDistrict || ''} onChange={e => setTempSellerData({...tempSellerData, sellerSubDistrict: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">เขต/อำเภอ</label>
                  <input className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none" value={tempSellerData.sellerDistrict || ''} onChange={e => setTempSellerData({...tempSellerData, sellerDistrict: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">จังหวัด</label>
                  <input className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none" value={tempSellerData.sellerProvince || ''} onChange={e => setTempSellerData({...tempSellerData, sellerProvince: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">รหัสไปรษณีย์</label>
                  <input className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none" value={tempSellerData.sellerZipCode || ''} onChange={e => setTempSellerData({...tempSellerData, sellerZipCode: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4">
                <Save size={20}/> บันทึกข้อมูล
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
          <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">
            {reportTab === 'sales' ? 'รายละเอียดรายงานภาษีขาย (Sales Journal)' : reportTab === 'purchase' ? 'รายละเอียดรายงานภาษีซื้อ (Purchase Journal)' : 'รายละเอียดความเคลื่อนไหวสินค้า'}
          </h4>
          <div className="flex gap-2">
            <button 
              onClick={handleExportExcel}
              disabled={isExporting}
              className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-white px-4 py-2 rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 transition-all disabled:opacity-50"
            >
               {isExporting ? <Loader size={14} className="animate-spin"/> : <FileSpreadsheet size={14}/>} Export .xlsx
            </button>
            <button className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
               <Download size={14}/> Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          {reportTab === 'sales' && (
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-400 text-[10px] font-bold uppercase sticky top-0 border-b z-10">
                <tr>
                  <th className="p-5">ลำดับ</th>
                  <th className="p-5">วันที่</th>
                  <th className="p-5">เลขที่ใบกำกับ</th>
                  <th className="p-5">ลูกค้า/บริษัท</th>
                  <th className="p-5">สาขา</th>
                  <th className="p-5">เลขผู้เสียภาษี</th>
                  <th className="p-5 text-right">ฐานภาษี</th>
                  <th className="p-5 text-right">VAT 7%</th>
                  <th className="p-5 text-right">ยอดรวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.length === 0 ? (
                  <tr><td colSpan="9" className="p-20 text-center text-slate-300 font-bold">ไม่พบข้อมูลรายงานภาษีขายในช่วงเวลาที่เลือก</td></tr>
                ) : filteredInvoices.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-5 text-xs text-slate-400">{i+1}</td>
                    <td className="p-5 text-xs text-slate-500">{formatDate(row.date)}</td>
                    <td className="p-5 font-bold text-slate-800">
                        {row.invNo}
                        {row.docType === 'credit_note' && <span className="ml-2 px-2 py-0.5 bg-rose-100 text-rose-600 text-[9px] rounded-full uppercase font-black">ใบลดหนี้</span>}
                    </td>
                    <td className="p-5">{row.customerName}</td>
                    <td className="p-5 text-xs font-mono text-slate-500">{row.branch || '00000'}</td>
                    <td className="p-5 text-xs font-mono">{row.taxId || '-'}</td>
                    <td className="p-5 text-right">{formatCurrency((row.preVat || 0) * (row.docType === 'credit_note' ? -1 : 1))}</td>
                    <td className="p-5 text-right text-indigo-600 font-bold">{formatCurrency((row.vat || 0) * (row.docType === 'credit_note' ? -1 : 1))}</td>
                    <td className="p-5 text-right font-black">{formatCurrency((row.total || 0) * (row.docType === 'credit_note' ? -1 : 1))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-black text-slate-800 sticky bottom-0 z-10 border-t-2 border-slate-200">
                <tr>
                  <td colSpan="6" className="p-5 text-right uppercase tracking-widest text-xs">รวมทั้งสิ้น (Grand Total)</td>
                  <td className="p-5 text-right text-indigo-900">{formatCurrency(salesFooter.base)}</td>
                  <td className="p-5 text-right text-indigo-600">{formatCurrency(salesFooter.vat)}</td>
                  <td className="p-5 text-right text-slate-900 text-base">{formatCurrency(salesFooter.total)}</td>
                </tr>
              </tfoot>
            </table>
          )}
          {reportTab === 'purchase' && (
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-400 text-[10px] font-bold uppercase sticky top-0 border-b z-10">
                <tr>
                  <th className="p-5">ลำดับ</th>
                  <th className="p-5">วันที่</th>
                  <th className="p-5">รายการ/รายละเอียด</th>
                  <th className="p-5">ผู้ขาย</th>
                  <th className="p-5">สาขา</th>
                  <th className="p-5 text-right">มูลค่าสินค้า</th>
                  <th className="p-5 text-right text-rose-500">VAT 7%</th>
                  <th className="p-5 text-right">ยอดจ่ายจริง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredExpenses.length === 0 ? (
                  <tr><td colSpan="8" className="p-20 text-center text-slate-300 font-bold">ไม่พบข้อมูลรายงานภาษีซื้อในช่วงเวลาที่เลือก</td></tr>
                ) : filteredExpenses.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-5 text-xs text-slate-400">{i+1}</td>
                    <td className="p-5 text-xs text-slate-500">{formatDate(row.date)}</td>
                    <td className="p-5 font-bold text-slate-800">
                        {row.description}
                        {row.isNonCreditableVat && <span className="ml-2 px-2 py-0.5 bg-rose-100 text-rose-600 text-[9px] rounded-full uppercase font-black">ภาษีซื้อต้องห้าม</span>}
                    </td>
                    <td className="p-5">{row.partnerName || '-'}</td>
                    <td className="p-5 text-xs font-mono text-slate-500">{row.partnerBranch || '00000'}</td>
                    <td className="p-5 text-right">{formatCurrency(row.isNonCreditableVat ? row.total : Number(row.total) * 100 / 107)}</td>
                    <td className="p-5 text-right text-rose-500 font-bold">{formatCurrency(row.isNonCreditableVat ? 0 : Number(row.total) * 7 / 107)}</td>
                    <td className="p-5 text-right font-black">{formatCurrency(row.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-black text-slate-800 sticky bottom-0 z-10 border-t-2 border-slate-200">
                <tr>
                  <td colSpan="5" className="p-5 text-right uppercase tracking-widest text-xs">รวมทั้งสิ้น (Grand Total)</td>
                  <td className="p-5 text-right text-slate-900">{formatCurrency(purchaseFooter.base)}</td>
                  <td className="p-5 text-right text-rose-600">{formatCurrency(purchaseFooter.vat)}</td>
                  <td className="p-5 text-right text-slate-900 text-base">{formatCurrency(purchaseFooter.total)}</td>
                </tr>
              </tfoot>
            </table>
          )}
          {reportTab === 'inventory' && (
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-400 text-[10px] font-bold uppercase sticky top-0 border-b z-10">
                <tr><th className="p-5 text-left">ลำดับ</th><th className="p-5 text-left">วันที่</th><th className="p-5 text-left">SKU</th><th className="p-5 text-left">สินค้า</th><th className="p-5 text-center">ประเภท</th><th className="p-5 text-center">จำนวน</th><th className="p-5 text-right">ราคา/หน่วย</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMovement.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="p-5 text-xs text-slate-400">{i+1}</td>
                    <td className="p-5 text-xs text-slate-500">{formatDate(row.date)}</td>
                    <td className="p-5 font-mono text-xs">{row.sku}</td>
                    <td className="p-5 font-bold">{row.name}</td>
                    <td className="p-5 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold ${row.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{row.type}</span></td>
                    <td className="p-5 text-center font-black">{row.qty}</td>
                    <td className="p-5 text-right">{formatCurrency(row.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// --- RecordManager Component ---
function RecordManager({ user, transactions, appId, stockBatches, showToast, onIssueInvoice }) {
  const [subTab, setSubTab] = useState('new');
  const [viewItem, setViewItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showStockSelectModal, setShowStockSelectModal] = useState(false);
  const [partners, setPartners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
   
  const [formData, setFormData] = useState({ 
    type: 'income', date: formatDateISO(new Date()), description: '', total: 0, channel: 'หน้าร้าน', 
    transactionFee: '', commissionFee: '', serviceFee: '', infrastructureFee: '', couponDiscount: '', cashCoupon: '',
    whtAmount: '', isNonCreditableVat: false,
    category: 'รายได้จากการขายสินค้า', orderId: '', partnerName: '', partnerTaxId: '', partnerAddress: '', partnerBranch: '00000',
    items: [{ desc: '', qty: 1, buyPrice: 0, sellPrice: 0 }] 
  });

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'partners'), (snap) => { 
      setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
    });
    return () => unsub();
  }, [user, appId]);

  const uniqueInventory = useMemo(() => {
    const map = {};
    stockBatches.forEach(batch => {
      const name = batch.productName; if (!name) return;
      const remaining = Number(batch.quantity) - Number(batch.sold || 0);
      if (!map[name]) map[name] = { name, sku: batch.sku || '-', qty: 0 };
      map[name].qty += Math.max(0, remaining);
    });
    return Object.values(map);
  }, [stockBatches]);
   
  const handleDelete = async (id, type) => { 
    try { 
      const coll = type === 'income' ? 'transactions_income' : 'transactions_expense'; 
      await deleteDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', coll, id)); 
      showToast("ลบรายการสำเร็จ", "success"); 
      setDeleteConfirmId(null); 
    } catch (e) { showToast("ไม่สามารถลบได้", "error"); } 
  };

  const selectPartner = (p) => { setFormData({ ...formData, partnerName: p.name || '', partnerTaxId: p.taxId || '', partnerAddress: p.address || '', partnerBranch: p.branch || '00000' }); setShowPartnerModal(false); };
  const selectStockItem = (item, index) => { const newItems = [...formData.items]; newItems[index].desc = item.name; setFormData({ ...formData, items: newItems }); setShowStockSelectModal(false); };
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
     
    // Only count fees if type is income
    const totalFees = formData.type === 'income' ? (transFee + infraFee + commFee + servFee) : 0;
    const totalDiscounts = couponDisc + cashCpn;
    const grandTotal = formData.type === 'income' 
      ? subTotal + totalFees - totalDiscounts - wht
      : subTotal - totalDiscounts - wht;

    return { subTotal, totalFees, totalDiscounts, wht, grandTotal };
  }, [formData]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!user) return;
    try {
      const coll = formData.type === 'income' ? 'transactions_income' : 'transactions_expense';
      const { subTotal, totalFees, grandTotal } = financialSummary;
      
      const dataToSave = { 
        ...formData, 
        total: subTotal, 
        platformFee: totalFees,
        grandTotal, 
        date: normalizeDate(formData.date), 
        description: formData.items.map(i => i.desc).join(', '), 
        userId: user.uid, 
        createdAt: serverTimestamp() 
      };

      if (formData.partnerName) {
        const existingPartner = partners.find(p => p.taxId === formData.partnerTaxId && p.name === formData.partnerName);
        if (!existingPartner) { 
          await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'partners'), { 
            name: formData.partnerName, taxId: formData.partnerTaxId, address: formData.partnerAddress, branch: formData.partnerBranch, 
            type: formData.type === 'income' ? 'buyer' : 'seller', createdAt: serverTimestamp() 
          }); 
        }
      }

      await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', coll), dataToSave);
      showToast("บันทึกข้อมูลเรียบร้อย", "success");
      
      // Stock management: Only if category is "ต้นทุนสินค้า" and type is expense
      for (const item of formData.items) {
        if (!item.desc) continue;
        
        // Validation check for stock quantity
        const itemQty = Number(item.qty) || 0;
        
        if (formData.type === 'expense' && formData.category === 'ต้นทุนสินค้า') {
          if (itemQty <= 0) continue; // ข้ามการสร้าง batch หากจำนวนเป็น 0 หรือติดลบ

          const totalQty = formData.items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
          const trueCostPerUnit = Math.max(0, (Number(item.buyPrice) || 0) - (financialSummary.totalDiscounts / (totalQty || 1)));
          await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'inventory_batches'), { 
            productName: item.desc, quantity: itemQty, costPerUnit: trueCostPerUnit, 
            date: normalizeDate(formData.date), userId: user.uid, sold: 0, category: 'ทั่วไป' 
          });
        }
      }

      setFormData({ 
        type: 'income', date: formatDateISO(new Date()), description: '', total: 0, channel: 'หน้าร้าน', 
        transactionFee: '', commissionFee: '', serviceFee: '', infrastructureFee: '', couponDiscount: '', 
        cashCoupon: '', whtAmount: '', isNonCreditableVat: false, category: 'รายได้จากการขายสินค้า', orderId: '', partnerName: '', 
        partnerTaxId: '', partnerAddress: '', partnerBranch: '00000', 
        items: [{ desc: '', qty: 1, buyPrice: 0, sellPrice: 0 }] 
      });
    } catch (e) { showToast("Error: " + e.message, "error"); }
  };

  const filteredHistory = useMemo(() => {
    return transactions.filter(t => 
      (t.partnerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => normalizeDate(b.date) - normalizeDate(a.date));
  }, [transactions, searchTerm]);

  return (
    <div className="flex flex-col h-full animate-fadeIn font-sarabun text-left w-full h-full pb-10">
      {/* Header & Tabs */}
      <div className="flex justify-between items-end mb-8 border-b pb-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800">Records Manager</h2>
          <p className="text-sm text-slate-400 font-medium">บันทึกรายการรายรับ-รายจ่าย และประวัติการทำรายการ</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
          <button onClick={()=>setSubTab('new')} className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${subTab==='new'?'bg-white shadow-md text-indigo-600 scale-[1.02]':'text-slate-500 hover:text-slate-700'}`}>เพิ่มรายการใหม่</button>
          <button onClick={()=>setSubTab('history')} className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${subTab==='history'?'bg-white shadow-md text-indigo-600 scale-[1.02]':'text-slate-500 hover:text-slate-700'}`}>ประวัติรายการ</button>
        </div>
      </div>

      {/* MODALS */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[700] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md flex flex-col shadow-2xl animate-in zoom-in-95 max-h-[70vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50"><h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><Users size={20} className="text-indigo-600"/> เลือกคู่ค้า</h3><button onClick={()=>setShowPartnerModal(false)} className="p-2 hover:bg-slate-200 rounded-full"><X/></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {partners.length > 0 ? partners.map(p => (
                <div key={p.id} onClick={()=>selectPartner(p)} className="p-4 rounded-2xl border hover:bg-indigo-50 cursor-pointer border-slate-100 transition-colors group">
                  <div className="flex justify-between items-center">
                    <div><p className="font-bold text-slate-800 group-hover:text-indigo-700">{p.name}</p><p className="text-[10px] text-slate-400 font-mono">TAX: {p.taxId}</p></div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400"/>
                  </div>
                </div>
              )) : <div className="text-center py-10 text-slate-400 text-sm font-bold">ไม่พบข้อมูลคู่ค้า</div>}
            </div>
          </div>
        </div>
      )}

      {showStockSelectModal !== false && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[700] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md flex flex-col shadow-2xl animate-in zoom-in-95 max-h-[70vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50"><h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><Box size={20} className="text-indigo-600"/> คลังสินค้า</h3><button onClick={()=>setShowStockSelectModal(false)} className="p-2 hover:bg-slate-200 rounded-full"><X/></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {uniqueInventory.length > 0 ? uniqueInventory.map((item, idx) => (
                <div key={idx} onClick={()=>selectStockItem(item, showStockSelectModal)} className="p-4 rounded-2xl border hover:bg-indigo-50 cursor-pointer border-slate-100 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div><p className="font-bold text-slate-800 group-hover:text-indigo-700">{item.name}</p><p className="text-[10px] text-slate-400 font-mono">{item.sku}</p></div>
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] px-3 py-1 rounded-full font-bold">คงเหลือ: {item.qty}</span>
                  </div>
                </div>
              )) : <div className="text-center py-10 text-slate-400 text-sm font-bold">ไม่พบสินค้าในคลัง</div>}
            </div>
          </div>
        </div>
      )}

      {subTab === 'new' ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
          <div className="xl:col-span-3 space-y-8">
            <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-8">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit shrink-0">
                  <button onClick={()=>setFormData({...formData, type:'income', category: 'รายได้จากการขายสินค้า'})} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all ${formData.type==='income'?'bg-emerald-600 text-white shadow-lg':'text-slate-400'}`}><TrendingUp size={18}/> รายรับ</button>
                  <button onClick={()=>setFormData({...formData, type:'expense', category: 'ต้นทุนสินค้า'})} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all ${formData.type==='expense'?'bg-rose-600 text-white shadow-lg':'text-slate-400'}`}><TrendingDown size={18}/> รายจ่าย</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">วันที่</label>
                    <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ช่องทาง</label>
                    <select value={formData.channel} onChange={e=>setFormData({...formData, channel: e.target.value})} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 outline-none">
                      {CONSTANTS.CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</label>
                    <input placeholder="ระบุเลขที่..." value={formData.orderId} onChange={e=>setFormData({...formData, orderId: e.target.value})} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 outline-none"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">หมวดหมู่</label>
                    <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 outline-none">
                      {(formData.type === 'income' ? CONSTANTS.CATEGORIES.INCOME : CONSTANTS.CATEGORIES.EXPENSE).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2"><Users size={18} className="text-indigo-600"/> {formData.type === 'income' ? 'ข้อมูลลูกค้า' : 'ข้อมูลผู้ขาย'}</h4>
                  <button type="button" onClick={()=>setShowPartnerModal(true)} className="text-[10px] bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-bold hover:bg-indigo-100 transition-colors">ดึงจากฐานข้อมูลคู่ค้า</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input value={formData.partnerName} onChange={e=>setFormData({...formData, partnerName: e.target.value})} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-sm font-bold outline-none" placeholder="ชื่อ..." />
                  <input value={formData.partnerTaxId} onChange={e=>setFormData({...formData, partnerTaxId: e.target.value})} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-sm font-mono outline-none" placeholder="เลขผู้เสียภาษี..." />
                  <input value={formData.partnerAddress} onChange={e=>setFormData({...formData, partnerAddress: e.target.value})} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-sm outline-none" placeholder="ที่อยู่ / สาขา..." />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><ShoppingCart size={20}/></div>
                  <h4 className="text-lg font-black text-slate-800">รายการสินค้า</h4>
                </div>
                <button type="button" onClick={addLineItem} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all scale-100 hover:scale-[1.02] active:scale-95"><Plus size={18}/> เพิ่มรายการ</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest pl-2">Description</th>
                      <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center w-28">Quantity</th>
                      <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right w-40">Unit Price</th>
                      <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right w-40 pr-2">Total</th>
                      <th className="pb-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {formData.items.map((item, index) => (
                      <tr key={index} className="group transition-colors hover:bg-slate-50/50">
                        <td className="py-4 pl-2">
                          <div className="relative">
                            <input value={item.desc} onChange={e=>updateLineItem(index, 'desc', e.target.value)} className="w-full bg-transparent p-2 rounded-xl text-sm font-bold border-0 focus:ring-0 outline-none text-slate-700" placeholder="ชื่อสินค้าหรือบริการ..."/>
                            {formData.category === 'ต้นทุนสินค้า' && <button type="button" onClick={()=>setShowStockSelectModal(index)} className="absolute -top-3 right-0 text-[9px] text-indigo-600 font-black opacity-0 group-hover:opacity-100 transition-opacity uppercase bg-white border px-2 py-0.5 rounded-full shadow-sm">Pick from Stock</button>}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex justify-center">
                            <input type="number" value={item.qty} onChange={e=>updateLineItem(index, 'qty', e.target.value)} className="w-20 bg-slate-100/50 p-2 rounded-xl border-0 text-sm text-center font-black outline-none text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-100"/>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="relative flex items-center justify-end">
                            <span className="absolute left-3 text-slate-400 font-bold text-xs">฿</span>
                            <input type="number" value={formData.type === 'income' ? item.sellPrice : item.buyPrice} onChange={e=>updateLineItem(index, formData.type === 'income' ? 'sellPrice' : 'buyPrice', e.target.value)} className="w-full bg-slate-100/50 p-2 rounded-xl border-0 text-sm text-right font-black outline-none text-slate-800 pl-8 focus:bg-white focus:ring-2 focus:ring-indigo-100"/>
                          </div>
                        </td>
                        <td className="py-4 text-right pr-2">
                          <p className="font-black text-slate-900 text-sm">{formatCurrency((formData.type === 'income' ? item.sellPrice : item.buyPrice) * item.qty)}</p>
                        </td>
                        <td className="py-4">
                          <button type="button" onClick={()=>removeLineItem(index)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors disabled:opacity-0" disabled={formData.items.length === 1}><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="xl:col-span-1 space-y-6 sticky top-0">
            <div className="bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Grand Total</p>
                   <h3 className="text-4xl font-black">{formatCurrency(financialSummary.grandTotal)}</h3>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Wallet size={24}/></div>
              </div>
              
              <div className="p-8 space-y-6 text-white/90">
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-sm">
                      <span className="opacity-60">Subtotal</span>
                      <span className="font-bold">{formatCurrency(financialSummary.subTotal)}</span>
                   </div>
                   
                   {formData.type === 'income' && (
                     <div className="pt-4 border-t border-white/10 space-y-3">
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Platform Fees & Costs</p>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                              <label className="text-[9px] font-bold opacity-40 uppercase">Trans. Fee</label>
                              <input type="number" value={formData.transactionFee} onChange={e=>setFormData({...formData, transactionFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none" placeholder="0.00" />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-bold opacity-40 uppercase">Infra Fee</label>
                              <input type="number" value={formData.infrastructureFee} onChange={e=>setFormData({...formData, infrastructureFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none" placeholder="0.00" />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-bold opacity-40 uppercase">Comm. Fee</label>
                              <input type="number" value={formData.commissionFee} onChange={e=>setFormData({...formData, commissionFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none" placeholder="0.00" />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-bold opacity-40 uppercase">Service Fee</label>
                              <input type="number" value={formData.serviceFee} onChange={e=>setFormData({...formData, serviceFee: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none" placeholder="0.00" />
                           </div>
                        </div>
                     </div>
                   )}

                   <div className="pt-4 border-t border-white/10 space-y-3">
                      <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Discounts (ส่วนลด)</p>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                            <label className="text-[9px] font-bold opacity-40 uppercase">Platform Disc.</label>
                            <input type="number" value={formData.couponDiscount} onChange={e=>setFormData({...formData, couponDiscount: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none" placeholder="0.00" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[9px] font-bold opacity-40 uppercase">Cash Coupon</label>
                            <input type="number" value={formData.cashCoupon} onChange={e=>setFormData({...formData, cashCoupon: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none" placeholder="0.00" />
                         </div>
                      </div>
                   </div>

                   <div className="pt-4 border-t border-white/10 space-y-3">
                      <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Tax (ภาษีและการปรับปรุง)</p>
                      <div className="grid grid-cols-1 gap-3">
                         <div className="space-y-1">
                            <label className="text-[9px] font-bold opacity-40 uppercase">หัก ณ ที่จ่าย (WHT Amount)</label>
                            <input type="number" value={formData.whtAmount} onChange={e=>setFormData({...formData, whtAmount: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold focus:bg-white/10 outline-none" placeholder="0.00" />
                         </div>
                         {formData.type === 'expense' && (
                            <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit group">
                               <input type="checkbox" checked={formData.isNonCreditableVat} onChange={e=>setFormData({...formData, isNonCreditableVat: e.target.checked})} className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 cursor-pointer" />
                               <span className="text-[10px] font-bold opacity-80 group-hover:opacity-100 transition-opacity">ภาษีซื้อต้องห้าม (Non-creditable VAT)</span>
                            </label>
                         )}
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-white/20">
                   <button onClick={handleSubmit} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-95 group">
                      <Save size={24} className="text-indigo-600 transition-transform group-hover:scale-110"/> บันทึกรายการ
                   </button>
                   <p className="text-[10px] text-white/30 mt-4 text-center">ระบบจะบันทึกลงฐานข้อมูลและหักลบสต็อก FIFO อัตโนมัติ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* HISTORY VIEW */
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                <input className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm" placeholder="ค้นหาประวัติ: ชื่อลูกค้า, Order ID, รายละเอียด..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
             </div>
             <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
                <span className="text-[10px] font-black uppercase text-slate-400 px-3">History ({filteredHistory.length})</span>
             </div>
          </div>

          <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="p-6">วันที่ / ช่องทาง</th>
                    <th className="p-6">รายการ/เลขที่</th>
                    <th className="p-6">คู่ค้า</th>
                    <th className="p-6 text-right">ยอดรวม</th>
                    <th className="p-6 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredHistory.map(t => (
                    <tr key={t.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="p-6">
                        <p className="font-black text-slate-700">{formatDate(t.date)}</p>
                        <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase">{t.channel || 'หน้าร้าน'}</span>
                      </td>
                      <td className="p-6">
                        <p className="font-bold text-slate-800 line-clamp-1">{t.description || '-'}</p>
                        <p className="text-[10px] font-mono text-slate-400">ID: {t.orderId || '-'}</p>
                      </td>
                      <td className="p-6">
                        <p className="font-bold text-indigo-600">{t.partnerName || 'คู่ค้าทั่วไป'}</p>
                        <p className="text-[10px] text-slate-400">TAX: {t.partnerTaxId || '-'}</p>
                      </td>
                      <td className="p-6 text-right">
                        <div className={`inline-flex flex-col items-end px-4 py-2 rounded-2xl ${t.type==='income'?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>
                           <p className="text-[10px] font-black uppercase opacity-60 leading-none mb-1">{t.type==='income'?'Income':'Expense'}</p>
                           <p className="text-base font-black leading-none">{formatCurrency(t.grandTotal || t.total)}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                           <button onClick={()=>setViewItem(t)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all shadow-sm"><Eye size={18}/></button>
                           <button onClick={()=>onIssueInvoice(t)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-emerald-600 hover:shadow-md transition-all shadow-sm"><Printer size={18}/></button>
                           <button onClick={()=>setDeleteConfirmId({id: t.id, type: t.type})} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:shadow-md transition-all shadow-sm"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewItem && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 text-left">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 text-left">
               <div className="text-left">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2 text-left"><Hash className="text-indigo-600"/> รายละเอียดรายการ</h3>
                  <div className="flex items-center gap-4 mt-1">
                     <p className="text-xs text-slate-400 font-mono">ID: {viewItem.orderId || '-'}</p>
                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${viewItem.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {viewItem.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                     </span>
                     <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{viewItem.channel || 'หน้าร้าน'}</span>
                  </div>
               </div>
               <button onClick={()=>setViewItem(null)} className="p-2 hover:bg-slate-200 rounded-full"><X/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 text-left">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                <div className="space-y-6 text-left text-left">
                   <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2 text-left"><Info size={18} className="text-indigo-600"/> ข้อมูลพื้นฐาน</h4>
                   <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-sm space-y-4 text-left">
                      <div className="text-left"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">วันที่ทำรายการ</p><p className="font-bold text-slate-800 text-left">{formatDate(viewItem.date)}</p></div>
                      <div className="text-left"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">หมวดหมู่</p><p className="font-bold text-slate-800 text-left">{viewItem.category || '-'}</p></div>
                      <div className="pt-2 border-t text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">{viewItem.type === 'income' ? 'ลูกค้า' : 'ผู้ขาย'}</p>
                        <p className="font-bold text-slate-800 text-base text-left">{viewItem.partnerName || '-'}</p>
                        <p className="text-[10px] font-mono text-indigo-500 font-bold text-left">TAX: {viewItem.partnerTaxId || '-'}</p>
                      </div>
                   </div>
                </div>
                <div className="space-y-6 text-left">
                   <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2 text-left"><Zap size={18} className="text-amber-500"/> รายละเอียดค่าใช้จ่าย/หักลด</h4>
                   <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-sm space-y-3 text-left text-left">
                      <div className="flex justify-between text-left"><span className="text-slate-500 text-left">ค่าธรรมเนียมธุรกรรม</span><span className="font-bold">{formatCurrency(viewItem.transactionFee || 0)}</span></div>
                      <div className="flex justify-between text-left"><span className="text-slate-500 text-left">ค่าโครงสร้างพื้นฐาน</span><span className="font-bold">{formatCurrency(viewItem.infrastructureFee || 0)}</span></div>
                      <div className="flex justify-between text-left"><span className="text-slate-500 text-left">ค่าคอมมิชชั่น/บริการ</span><span className="font-bold">{formatCurrency((viewItem.commissionFee || 0) + (viewItem.serviceFee || 0))}</span></div>
                      <div className="flex justify-between border-t pt-2 font-bold text-indigo-600 text-left text-left"><span>รวมค่าธรรมเนียม Platform</span><span>{formatCurrency(viewItem.platformFee || 0)}</span></div>
                      <div className="pt-2 border-t space-y-2 text-left">
                        <div className="flex justify-between text-rose-500 text-left text-left"><span className="text-[10px] font-bold uppercase text-left">ส่วนลดคูปอง</span><span className="font-bold text-right">-{formatCurrency(viewItem.couponDiscount || 0)}</span></div>
                        <div className="flex justify-between text-orange-500 text-left text-left"><span className="text-[10px] font-bold uppercase text-left">คูปองเงินสด</span><span className="font-bold text-right">-{formatCurrency(viewItem.cashCoupon || 0)}</span></div>
                        <div className="flex justify-between text-rose-600 text-left text-left"><span className="text-[10px] font-bold uppercase text-left">หัก ณ ที่จ่าย (WHT)</span><span className="font-bold text-right">-{formatCurrency(viewItem.whtAmount || 0)}</span></div>
                      </div>
                      {viewItem.isNonCreditableVat && (
                          <div className="mt-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black border border-rose-100 flex items-center gap-2">
                              <AlertTriangle size={14}/>
                              รายการนี้เป็น "ภาษีซื้อต้องห้าม" (ไม่นำไปขอคืนภาษี)
                          </div>
                      )}
                   </div>
                </div>
                <div className="space-y-6 text-left">
                   <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2 text-left"><Wallet size={18} className="text-emerald-500"/> สรุปยอดเงินสุทธิ</h4>
                   <div className="bg-slate-900 text-white p-7 rounded-[32px] shadow-xl text-left text-left">
                      <div className="flex justify-between items-center text-sm opacity-60 text-left"><span>มูลค่าสินค้ารวม</span><span>{formatCurrency(viewItem.total)}</span></div>
                      <div className="flex justify-between items-center text-sm opacity-60 mt-1 text-left"><span>หักค่าธรรมเนียม & ส่วนลด & WHT</span><span>{formatCurrency((viewItem.platformFee || 0) - (viewItem.couponDiscount || 0) - (viewItem.cashCoupon || 0) - (viewItem.whtAmount || 0))}</span></div>
                      <div className="flex justify-between items-center pt-3 mt-4 border-t-2 border-white/20 text-left text-left">
                         <span className="font-black text-indigo-400 uppercase tracking-wider text-left">เงินเข้าสุทธิ</span>
                         <span className="text-4xl font-black text-right">{formatCurrency(viewItem.grandTotal || viewItem.total)}</span>
                      </div>
                      <p className="text-[10px] text-white/40 mt-4 text-center leading-relaxed">ข้อมูลสรุปนี้รวมค่าธรรมเนียมและส่วนลดที่ถูกดึงมาจากระบบและบันทึกไว้ในเอกสาร</p>
                   </div>
                </div>
              </div>
              {viewItem.items && (
                <div className="space-y-4 text-left">
                   <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2 text-left text-left text-left"><List size={18} className="text-indigo-600"/> รายการสินค้า/บริการ</h4>
                   <div className="overflow-hidden border border-slate-100 rounded-3xl text-left">
                      <table className="w-full text-sm text-left">
                         <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 text-left">
                            <tr>
                               <th className="p-4 text-left">รายละเอียดสินค้า</th>
                               <th className="p-4 text-center text-center">จำนวน</th>
                               <th className="p-4 text-right text-right">ราคาต่อหน่วย</th>
                               <th className="p-4 text-right text-right">ยอดรวม</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50 text-left">
                            {viewItem.items.map((it, idx) => (
                               <tr key={idx} className="hover:bg-slate-50/50 text-left">
                                  <td className="p-4 font-bold text-slate-700 text-left">{it.desc}</td>
                                  <td className="p-4 text-center font-black text-center">{it.qty}</td>
                                  <td className="p-4 text-right text-right">{formatCurrency(viewItem.type === 'income' ? it.sellPrice : it.buyPrice)}</td>
                                  <td className="p-4 text-right font-black text-slate-900 text-right">{formatCurrency((viewItem.type === 'income' ? it.sellPrice : it.buyPrice) * it.qty)}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-slate-50 flex gap-4 text-center text-center">
               <button onClick={()=>setViewItem(null)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-colors text-center">ปิดหน้านี้</button>
               <button onClick={()=>{onIssueInvoice(viewItem); setViewItem(null);}} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-center text-center">
                  <Printer size={20}/> ออกเอกสารภาษี (Invoice)
               </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 z-[900] flex items-center justify-center p-4">
           <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-center"><Trash2 size={32}/></div>
              <h3 className="text-xl font-bold mb-2 text-center">ยืนยันการลบรายการ?</h3>
              <p className="text-xs text-slate-400 mb-8 text-center uppercase tracking-widest font-black">รายการประเภท: {deleteConfirmId.type}</p>
              <div className="flex gap-3 text-center">
                 <button onClick={()=>setDeleteConfirmId(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-center">ยกเลิก</button>
                 <button onClick={()=>handleDelete(deleteConfirmId.id, deleteConfirmId.type)} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100 text-center">ยืนยันลบ</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function InvoiceGenerator({ user, invoices = [], transactions = [], appId = "merchant-tax-dev-v1", showToast, preFillData }) {
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

  useEffect(() => { 
    if (preFillData) { 
      const totalDisc = (Number(preFillData.couponDiscount) || 0) + (Number(preFillData.cashCoupon) || 0);
      setInvData(prev => ({ ...prev, docType: 'invoice', refInvNo: '', creditNoteReason: '', customerName: preFillData.partnerName || preFillData.receiverName || '', address: preFillData.partnerAddress || preFillData.shippingAddress || '', taxId: preFillData.partnerTaxId || '', branch: preFillData.partnerBranch || '00000', items: preFillData.items.map(it => ({ desc: it.desc, qty: it.qty, unit: 'ชิ้น', price: preFillData.type === 'income' ? it.sellPrice : it.buyPrice })), date: formatDateISO(preFillData.date || new Date()), orderId: preFillData.orderId || '', discount: totalDisc })); 
      setMode('create'); 
    } 
  }, [preFillData]);

  const totals = useMemo(() => { const { vatType, items, discount } = invData; const safeItems = items || []; let sub = safeItems.reduce((s, i) => s + (Number(i.qty || 0) * Number(i.price || 0)), 0); let afterDisc = sub - Number(discount); let vat = 0, total = 0, preVat = 0; if (vatType === 'included') { total = afterDisc; preVat = total * 100 / 107; vat = total - preVat; } else if (vatType === 'excluded') { preVat = afterDisc; vat = preVat * 0.07; total = preVat + vat; } else { preVat = afterDisc; vat = 0; total = preVat; } return { sub, afterDisc, vat, total, preVat }; }, [invData.items, invData.discount, invData.vatType]);

  useEffect(() => { if (mode === 'create' && !editingDocId) { const dateStr = invData.date.replace(/-/g, ''); const prefix = invData.docType === 'credit_note' ? 'CN-' : 'INV-'; const count = invoices.filter(inv => inv.invNo && inv.invNo.startsWith(prefix + dateStr)).length + 1; setInvData(prev => ({ ...prev, invNo: prefix + dateStr + "-" + String(count).padStart(3, '0') })); } }, [invData.date, invData.docType, invoices, mode, editingDocId]);
  useEffect(() => { if (user) { const unsubSellers = onSnapshot(query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'seller_profiles')), (snap) => setSellerProfiles(snap.docs.map(d=>({id:d.id, ...d.data()})))); const unsubCustomers = onSnapshot(query(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'partners')), (snap) => setCustomers(snap.docs.map(d=>({id:d.id, ...d.data(), customerName: d.data().name})))); return () => { unsubSellers(); unsubCustomers(); }; } }, [user, appId]);

  const handleSaveInvoice = async () => {
    if (!user) return;
    try {
      const payload = { ...invData, ...totals, date: normalizeDate(invData.date), type: 'invoice' };
      const targetId = editingDocId;
      if (targetId) { await setDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'invoices', targetId), { ...payload, updatedAt: serverTimestamp() }, {merge: true}); showToast("อัปเดตสำเร็จ", "success"); } 
      else { await addDoc(collection(dbInstance, 'artifacts', appId, 'public', 'data', 'invoices'), { ...payload, createdAt: serverTimestamp(), status: 'unpaid' }); showToast("บันทึกสำเร็จ", "success"); }
      setMode('history'); setEditingDocId(null);
    } catch(e) { showToast("บันทึกไม่สำเร็จ", "error"); }
  };

  const combinedDocs = useMemo(() => {
      const normalizedInvoices = invoices.map(inv => ({ ...inv, source: 'invoice', searchStr: (inv.invNo || '') + (inv.customerName || '') }));
      const normalizedTransactions = transactions.filter(t => t.type === 'income').map(t => ({ ...t, id: t.id, date: t.date, invNo: t.orderId || '-', customerName: t.partnerName || 'คู่ค้าทั่วไป', total: t.total, status: 'pending_doc', source: 'transaction', searchStr: (t.orderId || '') + (t.partnerName || '') }));
      return [...normalizedInvoices, ...normalizedTransactions].filter(d => { const searchInput = invoiceSearch.toLowerCase(); return d.searchStr.toLowerCase().includes(searchInput); }).sort((a, b) => new Date(b.date) - new Date(a.date)); 
  }, [invoices, transactions, invoiceSearch]);

  const handleDownloadPDF = async () => downloadInvoicePDF('invoice-preview-area', invData.invNo, showToast);
  const handleLogoUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setInvData(prev => ({ ...prev, logo: reader.result })); }; reader.readAsDataURL(file); } };
  const handleSignatureUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setInvData(prev => ({ ...prev, signature: reader.result })); }; reader.readAsDataURL(file); } };
  const handleNewInvoice = () => { const currentSavedSeller = JSON.parse(localStorage.getItem('merchant_seller_info') || '{}'); setEditingDocId(null); setInvData({ ...initialInvData, ...currentSavedSeller }); setMode('create'); }
  const handleEditInvoice = (inv) => { setInvData({ ...inv, date: formatDateISO(inv.date) }); setEditingDocId(inv.id); setMode('create'); }
  const handleCreateCreditNote = (inv) => { setEditingDocId(null); setInvData({ ...inv, id: undefined, docType: 'credit_note', refInvNo: inv.invNo, creditNoteReason: '', date: formatDateISO(new Date()), invNo: '' }); setMode('create'); }
  const updateItem = (i, field, val) => { setInvData(prev => ({ ...prev, items: prev.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) })); };

  return (
    <div className="w-full flex flex-col gap-8 relative h-full text-left font-sarabun p-4 bg-slate-50 min-h-screen text-left">
      {showSellerEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-sarabun text-left">
          <div className="bg-white rounded-3xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl animate-fadeIn text-left">
            <div className="p-6 border-b flex justify-between items-center text-left">
              <h3 className="font-bold text-lg flex items-center gap-2 text-indigo-700 text-left"><Settings/> ตั้งค่าผู้ขาย & โปรไฟล์</h3>
              <button onClick={()=>setShowSellerEditModal(false)}><X/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left text-left">
              <div className="grid grid-cols-2 gap-4 text-left text-left">
                <div>
                  <label className="text-xs font-bold text-slate-500 text-left text-left">โลโก้ร้านค้า</label>
                  <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-center" onClick={() => logoInputRef.current?.click()}>
                    {invData.logo ? <img src={invData.logo} className="h-20 object-contain" alt="Preview" /> : <ImageIcon size={40} className="text-slate-300"/>}
                    <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={handleLogoUpload} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 text-left text-left">ลายเซ็น (Signature)</label>
                  <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-center" onClick={() => signatureInputRef.current?.click()}>
                    {invData.signature ? <img src={invData.signature} className="h-20 object-contain" alt="Preview" /> : <Edit size={40} className="text-slate-300"/>}
                    <input type="file" ref={signatureInputRef} hidden accept="image/*" onChange={handleSignatureUpload} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-left text-left">
                <div><label className="text-xs font-bold text-left block mb-1">ชื่อร้านค้า</label><input className="w-full border rounded-lg p-2.5 text-sm" value={invData.sellerName} onChange={e=>setInvData({...invData, sellerName: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-left block mb-1">เลขผู้เสียภาษี</label><input className="w-full border rounded-lg p-2.5 text-sm font-mono" value={invData.sellerTaxId} onChange={e=>setInvData({...invData, sellerTaxId: e.target.value})} /></div>
                <div className="col-span-2"><label className="text-xs font-bold text-left block mb-1">ที่อยู่/บ้านเลขที่/ถนน</label><input className="w-full border rounded-lg p-2.5 text-sm" value={invData.sellerAddress} onChange={e=>setInvData({...invData, sellerAddress: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-left block mb-1">ตำบล/แขวง</label><input className="w-full border rounded-lg p-2.5 text-sm" value={invData.sellerSubDistrict} onChange={e=>setInvData({...invData, sellerSubDistrict: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-left block mb-1">อำเภอ/เขต</label><input className="w-full border rounded-lg p-2.5 text-sm" value={invData.sellerDistrict} onChange={e=>setInvData({...invData, sellerDistrict: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-left block mb-1">จังหวัด</label><input className="w-full border rounded-lg p-2.5 text-sm" value={invData.sellerProvince} onChange={e=>setInvData({...invData, sellerProvince: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-left block mb-1">รหัสไปรษณีย์</label><input className="w-full border rounded-lg p-2.5 text-sm font-mono" value={invData.sellerZipCode} onChange={e=>setInvData({...invData, sellerZipCode: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-left block mb-1">เบอร์โทรศัพท์</label><input className="w-full border rounded-lg p-2.5 text-sm" value={invData.sellerPhone} onChange={e=>setInvData({...invData, sellerPhone: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-left block mb-1">รหัสสาขา (00000 คือ สำนักงานใหญ่)</label><input className="w-full border rounded-lg p-2.5 text-sm font-mono" value={invData.sellerBranchId} onChange={e=>setInvData({...invData, sellerBranchId: e.target.value})} /></div>
              </div>
              <div className="pt-4 border-t text-left">
                <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase text-left">เลือกจากโปรไฟล์ที่เคยบันทึก</h4>
                <div className="space-y-2 text-left">
                  {sellerProfiles.map(s => (<div key={s.id} onClick={()=>{setInvData(p=>({...p, ...s})); setShowSellerEditModal(false);}} className="p-3 bg-slate-50 border rounded-xl cursor-pointer hover:border-indigo-300 font-medium text-left">{s.sellerName}</div>))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex gap-3 text-center text-center">
              <button onClick={()=>setShowSellerEditModal(false)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-center">บันทึกและปิด</button>
            </div>
          </div>
        </div>
      )}

      {showCustomerModal && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-sarabun text-left text-left text-left"><div className="bg-white rounded-3xl w-full max-w-md h-[70vh] flex flex-col shadow-2xl animate-fadeIn text-left text-left"><div className="p-6 border-b flex justify-between items-center text-left text-left"><h3 className="font-bold text-lg flex items-center gap-2 text-rose-600 text-left text-left"><User className="text-rose-500"/> เลือกข้อมูลลูกค้า/คู่ค้า</h3><button onClick={()=>setShowCustomerModal(false)}><X/></button></div><div className="flex-1 overflow-y-auto p-4 space-y-2 text-left text-left">{customers.map(c => (<div key={c.id} onClick={()=>{setInvData(p=>({...p, customerName: c.customerName, address: c.address, taxId: c.taxId, branch: c.branch, custSubDistrict: c.custSubDistrict || '', custDistrict: c.custDistrict || '', custProvince: c.custProvince || '', custZipCode: c.custZipCode || ''})); setShowCustomerModal(false);}} className="p-4 rounded-xl border border-slate-100 hover:bg-rose-50 cursor-pointer shadow-sm text-left text-left"><p className="font-bold text-left">{c.customerName}</p><p className="text-[10px] text-indigo-500 font-mono text-left">TAX: {c.taxId}</p><p className="text-xs text-slate-400 truncate text-left">{c.address}</p></div>))}</div></div></div>)}
       
      <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit print:hidden self-center md:self-start text-left text-left text-left">
        <button onClick={() => setMode('create')} className={"px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all text-center " + (mode==='create'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700')}><FileText size={18}/> ออกเอกสาร</button>
        <button onClick={() => setMode('history')} className={"px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all text-center " + (mode==='history'?'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200':'text-slate-500 hover:text-slate-700')}><Clock size={18}/> ประวัติเอกสาร</button>
      </div>

      {mode === 'history' ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-fadeIn h-full flex flex-col text-left">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 text-left">
                <h3 className="font-bold text-slate-700 text-xl flex-shrink-0 text-left text-left">ประวัติเอกสาร</h3>
                <div className="relative w-full md:w-64 text-left text-left"><Search className="absolute left-3 top-2.5 text-slate-400" size={16}/><input className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm" placeholder="ค้นหาเอกสาร..." value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} /></div>
            </div>
            <div className="rounded-2xl border border-slate-100 overflow-x-auto flex-1 custom-scrollbar text-left text-left">
                <table className="w-full text-sm text-left whitespace-nowrap text-left text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs sticky top-0 z-10 text-left text-left"><tr><th className="p-4 text-left">Date</th><th className="p-4 text-left">No.</th><th className="p-4 text-left">Customer</th><th className="p-4 text-right">Total</th><th className="p-4 text-center">Action</th></tr></thead>
                    <tbody className="divide-y divide-slate-50 text-left text-left text-left">
                        {combinedDocs.map((docItem, idx) => (
                            <tr key={idx} className="hover:bg-indigo-50/30 even:bg-slate-50/50 text-left text-left">
                                <td className="p-4 text-slate-500 text-xs text-left text-left">{formatDate(docItem.date)}</td>
                                <td className="p-4 text-slate-700 font-bold text-left text-left">
                                    {docItem.invNo}
                                    {docItem.docType === 'credit_note' && <span className="ml-2 px-2 py-0.5 bg-rose-100 text-rose-600 text-[9px] rounded-full uppercase font-black">CN</span>}
                                </td>
                                <td className="p-4 text-left text-left">{docItem.customerName}</td>
                                <td className="p-4 text-right font-bold text-right">{formatCurrency(docItem.total * (docItem.docType === 'credit_note' ? -1 : 1))}</td>
                                <td className="p-4 text-center text-center"><div className="flex justify-center gap-2 text-center text-center">{docItem.source === 'transaction' ? (<button onClick={() => setMode('create')} className="text-white bg-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold text-center">สร้าง</button>) : (<><button onClick={() => handleEditInvoice(docItem)} className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold text-center">พิมพ์</button><button onClick={() => handleCreateCreditNote(docItem)} className="text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold text-center" title="สร้างใบลดหนี้">ลดหนี้</button></>)}</div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        <>
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 print:hidden space-y-6 text-left">
                <div className="flex justify-between border-b border-slate-100 pb-4 text-left text-left text-left"><div><h3 className="font-bold text-slate-800 text-xl flex items-center gap-2 text-left">Document Editor</h3><p className="text-slate-400 text-sm text-left">สร้างเอกสารใบกำกับภาษี หรือ ใบเสนอราคา/ลดหนี้</p></div><div className="text-right flex flex-col items-end gap-2 text-right text-right"><button onClick={handleNewInvoice} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 text-right text-right"><PlusCircle size={14}/> New Document</button><div><p className="text-xs text-slate-400 font-bold uppercase text-right text-right">DOC ID</p><div className="flex items-center gap-2 justify-end text-right text-right"><p className="text-2xl font-bold text-indigo-600 font-mono text-right text-right">{invData.invNo}</p></div></div></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between text-left text-left">
                        <div className="text-left"><div className="flex justify-between items-start mb-4 text-left"><h4 className="font-bold text-indigo-700 flex items-center gap-2 text-left"><Store size={18}/> ข้อมูลผู้ขาย</h4><button onClick={()=>setShowSellerEditModal(true)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-left text-left">แก้ไข/ตั้งค่า</button></div><div className="flex gap-4 items-start text-left text-left">{invData.logo && <div className="w-16 h-16 rounded-lg bg-white p-1 border border-slate-200 flex-shrink-0 text-left"><img src={invData.logo} className="w-full h-full object-contain" alt="Logo"/></div>}<div className="text-sm text-slate-600 text-left"><p className="font-bold text-slate-800 text-base text-left">{invData.sellerName || 'กรุณาระบุชื่อร้านค้า'}</p><p className="text-xs mt-1 text-left">{[invData.sellerAddress, invData.sellerSubDistrict, invData.sellerDistrict, invData.sellerProvince, invData.sellerZipCode].filter(Boolean).join(' ')}</p></div></div></div>
                        <div className="mt-4 pt-4 border-t flex gap-2 text-center text-center"><button onClick={()=>setInvData({...invData, vatType: 'excluded'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border text-center ${invData.vatType==='excluded' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-800'}`}>แยก VAT (Excluded)</button><button onClick={()=>setInvData({...invData, vatType: 'included'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border text-center ${invData.vatType==='included' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-800'}`}>รวม VAT (Included)</button><button onClick={()=>setInvData({...invData, vatType: 'none'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border text-center ${invData.vatType==='none' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-800'}`}>ไม่มี VAT</button></div>
                    </div>
                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                        <div className="grid grid-cols-2 gap-3 text-left text-left text-left">
                            <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm text-left">
                                <label className="text-[10px] font-bold text-indigo-600 mb-1 flex items-center gap-1 text-left">ประเภทเอกสาร</label>
                                <select value={invData.docType} onChange={e => setInvData({...invData, docType: e.target.value})} className="w-full border-0 p-1 text-sm font-bold text-slate-700 bg-transparent focus:ring-0 text-left cursor-pointer">
                                    <option value="invoice">ใบกำกับภาษี / ใบเสร็จรับเงิน</option>
                                    <option value="credit_note">ใบลดหนี้ (Credit Note)</option>
                                </select>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm text-left">
                                <label className="text-[10px] font-bold text-indigo-600 mb-1 flex items-center gap-1 text-left">วันที่เอกสาร</label>
                                <input type="date" className="w-full border-0 p-1 text-sm font-bold text-slate-700 bg-transparent focus:ring-0 text-left" value={invData.date} onChange={e => setInvData({ ...invData, date: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-left text-left text-left">
                            {invData.docType === 'credit_note' && (
                                <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-sm text-left text-left">
                                    <label className="text-[10px] font-bold text-rose-500 mb-1 flex items-center gap-1 text-left text-left">อ้างอิงเอกสารเดิม (Ref. INV)</label>
                                    <input className="w-full border-0 p-1 text-sm font-mono text-rose-600 bg-transparent focus:ring-0 text-left text-left" placeholder="INV-XXXXXXXX-XXX" value={invData.refInvNo} onChange={e => setInvData({ ...invData, refInvNo: e.target.value })} />
                                </div>
                            )}
                            <div className={`bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-left text-left ${invData.docType !== 'credit_note' ? 'col-span-2' : ''}`}>
                                <label className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1 text-left text-left">Order ID</label>
                                <input className="w-full border-0 p-1 text-sm font-mono text-indigo-600 bg-transparent focus:ring-0 text-left text-left" placeholder="เลขคำสั่งซื้อ" value={invData.orderId} onChange={e => setInvData({ ...invData, orderId: e.target.value })} />
                            </div>
                            {invData.docType === 'credit_note' && (
                                <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-sm text-left text-left col-span-2">
                                    <label className="text-[10px] font-bold text-rose-500 mb-1 flex items-center gap-1 text-left text-left">เหตุผลการลดหนี้ (Reason)</label>
                                    <input className="w-full border-0 p-1 text-sm text-slate-700 bg-transparent focus:ring-0 text-left text-left" placeholder="เช่น ลูกค้าคืนสินค้า, สินค้าชำรุด..." value={invData.creditNoteReason || ''} onChange={e => setInvData({ ...invData, creditNoteReason: e.target.value })} />
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-left text-left"><h4 className="font-bold text-sm text-rose-600 text-left text-left">ข้อมูลลูกค้า/คู่ค้า</h4><button onClick={()=>setShowCustomerModal(true)} className="text-[10px] bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-bold text-left text-left">เลือกจากฐานข้อมูล</button></div>
                        <div className="text-left text-left text-left text-left"><label className="text-[10px] text-slate-500 font-bold mb-1 block text-left text-left">ชื่อลูกค้า / บริษัท / คู่ค้า</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm text-left text-left" value={invData.customerName} onChange={e=>setInvData({...invData, customerName: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-2 text-left text-left text-left text-left"><div className="col-span-2 text-left text-left"><label className="text-[10px] text-slate-500 font-bold mb-1 block text-left text-left">ที่อยู่</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm text-left text-left" value={invData.address} onChange={e=>setInvData({...invData, address: e.target.value})} /></div><div className="text-left text-left"><label className="text-[10px] text-slate-500 font-bold mb-1 block text-left text-left text-left text-left">เลขผู้เสียภาษี</label><input className="w-full border-0 rounded-lg p-2 text-sm shadow-sm text-left text-left text-left text-left" value={invData.taxId} onChange={e=>setInvData({...invData, taxId: e.target.value})} /></div></div>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-left text-left text-left text-left"><h4 className="font-bold text-sm text-slate-600 mb-2 text-left text-left text-left">รายการสินค้า</h4>{invData.items.map((it, i) => (<div key={i} className="flex gap-2 mb-2 items-center text-left text-left"><span className="text-xs text-slate-400 w-4 text-left text-left">{i+1}.</span><input className="flex-[3] border-0 rounded p-2 text-sm shadow-sm text-left text-left" value={it.desc} onChange={e=>updateItem(i,'desc',e.target.value)}/><input className="w-20 border-0 rounded p-2 text-sm text-center shadow-sm text-center text-center" type="number" value={it.qty} onChange={e=>updateItem(i,'qty',Number(e.target.value))}/><input className="w-24 border-0 rounded p-2 text-sm text-right shadow-sm text-right text-right" type="number" value={it.price} onChange={e=>updateItem(i,'price',Number(e.target.value))}/><button onClick={()=>setInvData({...invData, items: invData.items.filter((_,idx)=>idx!==i)})} className="text-rose-400 p-2 text-center text-center text-center text-center"><Trash2 size={16}/></button></div>))}<button onClick={()=>setInvData({...invData, items:[...invData.items, {desc:'', qty:1, unit:'ชิ้น', price:0}]})} className="mt-2 text-[10px] bg-indigo-600 text-white px-4 py-1.5 rounded-lg flex items-center gap-1 w-fit font-bold shadow-md text-center text-center text-center"><PlusCircle size={14}/> เพิ่มรายการ</button></div>
                <div className="flex gap-4 text-center text-center text-center text-center"><button onClick={handleSaveInvoice} className={"flex-1 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all text-center " + (editingDocId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700') + " flex items-center justify-center gap-2 text-center"}><Save size={18}/> {editingDocId ? 'อัปเดตข้อมูล' : 'บันทึกเอกสาร'}</button><button onClick={handleDownloadPDF} className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all text-center text-center"><Download size={18}/> Download ZIP</button></div>
            </div>
            <div className="overflow-x-auto pb-10 flex justify-center print:p-0 print:absolute print:left-0 print:top-0 print:w-full print:h-full print:z-50 print:bg-white text-left text-left">
                <div id="invoice-preview-area" className="shadow-2xl print:shadow-none bg-white p-[30px] w-[210mm] min-h-[296mm] text-sm font-sarabun text-slate-900 leading-relaxed relative box-border text-left text-left" style={{ transform: 'scale(1.0)', transformOrigin: 'top center' }}>
                    <div className="flex justify-between items-start mb-8 text-left text-left text-left text-left text-left">
                      <div className="w-[60%] flex items-center gap-5 text-left text-left text-left text-left">
                        {invData.logo && (<img src={invData.logo} className="w-[90px] h-[90px] object-contain flex-shrink-0 text-left" alt="Logo"/>)}
                        <div className="flex flex-col justify-center text-left text-left text-left text-left">
                          <h2 className="text-xl font-bold text-slate-900 mb-1 leading-tight text-left text-left text-left text-left">{invData.sellerName}</h2>
                          <p className="text-slate-600 text-xs leading-snug mb-1 text-left text-left text-left text-left">
                            {[invData.sellerAddress, invData.sellerSubDistrict, invData.sellerDistrict, invData.sellerProvince, invData.sellerZipCode].filter(Boolean).join(' ')}
                          </p>
                          <div className="text-xs text-slate-700 leading-snug text-left text-left text-left text-left">
                            <p className="text-left text-left text-left text-left"><b>เลขผู้เสียภาษี:</b> {invData.sellerTaxId} <b>สาขา:</b> {invData.sellerBranchId}</p>
                            <p className="text-left text-left text-left text-left"><b>โทร:</b> {invData.sellerPhone}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right w-[40%] flex flex-col items-end text-right">
                        <div className="text-lg font-bold uppercase mb-0 text-right">{invData.docType === 'credit_note' ? 'ใบลดหนี้ / CREDIT NOTE' : 'ใบกำกับภาษี / ใบเสร็จรับเงิน'}</div>
                        <div className="status-badge text-lg font-bold uppercase mb-3 text-right">ต้นฉบับ (Original)</div>
                        <div className="border border-slate-300 p-2 w-full max-w-[200px] text-right">
                          <div className="grid grid-cols-[max-content_1fr] gap-x-2 items-center text-right mb-1">
                            <span className="font-bold text-slate-500 text-xs text-left">เลขที่ (No.)</span>
                            <span className="font-bold text-right text-[10px]">{invData.invNo}</span>
                          </div>
                          <div className="grid grid-cols-[max-content_1fr] gap-x-2 items-center text-right mb-1">
                            <span className="font-bold text-slate-500 text-xs text-left">วันที่ (Date)</span>
                            <span className="text-right text-[10px]">{formatDate(invData.date)}</span>
                          </div>
                          {invData.docType === 'credit_note' && invData.refInvNo && (
                            <div className="grid grid-cols-[max-content_1fr] gap-x-2 items-center text-right mb-1">
                              <span className="font-bold text-slate-500 text-xs text-left">อ้างอิง (Ref.)</span>
                              <span className="text-right text-[10px] font-bold text-rose-600">{invData.refInvNo}</span>
                            </div>
                          )}
                          {invData.docType === 'credit_note' && invData.creditNoteReason && (
                            <div className="grid grid-cols-[max-content_1fr] gap-x-2 items-center text-right mb-1">
                              <span className="font-bold text-slate-500 text-xs text-left">เหตุผล</span>
                              <span className="text-right text-[10px] truncate" title={invData.creditNoteReason}>{invData.creditNoteReason}</span>
                            </div>
                          )}
                          {invData.orderId && (
                            <div className="grid grid-cols-[max-content_1fr] gap-x-2 items-center text-right">
                              <span className="font-bold text-slate-500 text-xs text-left">Order ID</span>
                              <span className="text-right text-[10px] font-mono">{invData.orderId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="border border-slate-300 p-4 mb-4 flex flex-col gap-1 text-left text-left text-left text-left text-left">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1 text-left text-left text-left text-left text-left">ลูกค้า (Customer)</div>
                      <p className="font-bold text-base text-left text-left text-left text-left text-left">{invData.customerName}</p>
                      <p className="text-slate-600 text-sm leading-relaxed text-left text-left text-left text-left text-left">{invData.address}</p>
                      <p className="text-slate-600 text-xs text-left">เลขผู้เสียภาษี: {invData.taxId || '-'}</p>
                    </div>
                    <table className="w-full mb-6 border-collapse text-left text-[10px] text-left text-left text-left text-left">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-center">
                          <th className="py-2 border-y border-slate-300 w-10 text-center">No.</th>
                          <th className="py-2 border-y border-slate-300 text-left pl-2">Description</th>
                          <th className="py-2 border-y border-slate-300 w-14 text-center">Qty</th>
                          <th className="py-2 border-y border-slate-300 w-20 text-right">Unit Price</th>
                          <th className="py-2 border-y border-slate-300 w-24 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invData.items.map((it, i) => (
                          <tr key={i} className="text-left text-left">
                            <td className="py-1.5 border-b border-slate-200 text-center text-center">{i+1}</td>
                            <td className="py-1.5 border-b border-slate-200 pl-2 text-left text-left">{it.desc}</td>
                            <td className="py-1.5 border-b border-slate-200 text-center text-center">{it.qty}</td>
                            <td className="py-1.5 border-b border-slate-200 text-right text-right">{formatCurrency(it.price)}</td>
                            <td className="p-1.5 border-b border-slate-200 text-right pr-2 font-bold text-right text-right">{formatCurrency(it.qty * it.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-between items-start text-left text-left text-left text-left">
                        <div className="flex-1 mt-4 mr-4 text-left text-left text-left text-left text-left">
                            <div className="bg-white p-2 border border-slate-400 text-center font-bold text-slate-900 text-[11px] text-center text-center text-center text-center text-center text-center">({THBText(totals.total)})</div>
                            <div className="mt-8 text-[10px] text-slate-500">หมายเหตุ: {invData.notes}</div>
                        </div>
                        <div className="w-[45%] text-right text-[10px] space-y-1 text-right text-right text-right text-right">
                            <div className="flex justify-between px-2"><span>ยอดรวมสินค้า (Subtotal)</span><span>{formatCurrency(totals.sub)}</span></div>
                            {invData.discount > 0 && <div className="flex justify-between px-2 text-rose-600"><span>ส่วนลด (Discount)</span><span>-{formatCurrency(invData.discount)}</span></div>}
                            <div className="flex justify-between px-2 pt-1 border-t border-slate-200"><span>มูลค่าที่ไม่มี/ยกเว้นภาษี</span><span>{formatCurrency(0)}</span></div>
                            <div className="flex justify-between px-2"><span>ยอดรวมก่อนภาษี (Net Before VAT)</span><span>{formatCurrency(totals.preVat)}</span></div>
                            <div className="flex justify-between px-2"><span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span><span>{formatCurrency(totals.vat)}</span></div>
                            <div className="flex justify-between font-bold border-t-2 border-black pt-1 text-base text-left text-left text-left text-left text-left text-left text-left"><span>จำนวนเงินสุทธิ (Grand Total)</span><span>{formatCurrency(totals.total)}</span></div>
                        </div>
                    </div>
                    <div className="mt-16 grid grid-cols-2 gap-10 text-center">
                        <div className="flex flex-col items-center">
                            <div className="h-14 flex items-center justify-center mb-2">
                                {invData.signature && <img src={invData.signature} className="max-h-full object-contain" alt="Signature"/>}
                            </div>
                            <div className="w-4/5 mx-auto border-t border-slate-400 pt-2 text-[10px]">
                                <p>{invData.docType === 'credit_note' ? 'ผู้อนุมัติ / Authorized Signature' : 'ผู้รับเงิน / Authorized Signature'}</p>
                                <p className="mt-1 font-bold">วันที่: {formatDate(invData.date)}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-end">
                            <div className="w-4/5 mx-auto border-t border-slate-400 pt-2 text-[10px]">
                                <p>{invData.docType === 'credit_note' ? 'ผู้รับเอกสาร / Document Received By' : 'ผู้รับสินค้า / Received By'}</p>
                                <p className="mt-1 font-bold">วันที่: .......................................</p>
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
  const toggleAppMode = () => { const ids = Object.values(CONSTANTS.IDS); const nextId = ids[(ids.indexOf(currentAppId) + 1) % ids.length]; setCurrentAppId(nextId); localStorage.setItem('merchant_app_id', nextId); addToast(`สลับฐานข้อมูลเป็น: ${nextId}`, "success"); };

  useEffect(() => { const initAuth = async () => { try { await signInAnonymously(authInstance); onAuthStateChanged(authInstance, (newUser) => setUser(newUser)); } catch (e) { addToast("Connection Failed", "error"); } }; initAuth(); }, []);
   
  useEffect(() => {
    if (!user || !currentAppId) return;
    setLoading(true);
    const path = (coll) => collection(dbInstance, 'artifacts', currentAppId, 'public', 'data', coll);
    const errorFn = (e) => { console.error("Firestore error:", e); addToast("Database Sync Error", "error"); };
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
      if (invMatch) {
        await deleteDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'invoices', invMatch.id));
        addToast("ลบใบกำกับภาษีสำเร็จ", "success");
      } else if (transMatch) {
        const coll = transMatch.type === 'income' ? 'transactions_income' : 'transactions_expense';
        await deleteDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', coll, transMatch.id));
        addToast("ลบรายการขายสำเร็จ", "success");
      } else { addToast("ไม่พบข้อมูลที่มี ID นี้ในระบบ", "error"); }
      setTargetIdToDelete(''); setShowIdDeleteTool(false);
    } catch(e) { addToast("เกิดข้อผิดพลาดในการลบ", "error"); }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard transactions={transactions} invoices={invoices} />;
      case 'records': return <RecordManager user={user} transactions={transactions} appId={currentAppId} stockBatches={stockBatches} showToast={addToast} onIssueInvoice={(t)=>{setPreFillInvoice(t); setActiveTab('invoice');}} />;
      case 'import': return <DataImporter appId={currentAppId} showToast={addToast} user={user} />;
      case 'stock': return <StockManager appId={currentAppId} stockBatches={stockBatches} showToast={addToast} user={user} />;
      case 'invoice': return <InvoiceGenerator user={user} invoices={invoices} transactions={transactions} appId={currentAppId} showToast={addToast} preFillData={preFillInvoice} />;
      case 'reports': return <TaxReports transactions={transactions} invoices={invoices} stockBatches={stockBatches} showToast={addToast} />;
      default: return <Dashboard transactions={transactions} invoices={invoices} />;
    }
  };

  if (loading && !user) return <LoadingScreen />;

  return (
    <div className="flex w-full h-screen bg-slate-50 font-sarabun text-slate-800 overflow-hidden text-left">
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {showIdDeleteTool && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 text-center">
             <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-center"><AlertCircle size={40}/></div>
             <h3 className="text-2xl font-black text-center mb-2 text-center text-slate-800">ระบุ ID ที่ต้องการลบ</h3>
             <input value={targetIdToDelete} onChange={e=>setTargetIdToDelete(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 mb-6 font-bold text-center text-lg text-slate-800" placeholder="ID หรือ INV No." />
             <div className="flex gap-4 text-center">
                <button onClick={()=>setShowIdDeleteTool(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 text-center">ยกเลิก</button>
                <button onClick={forceDeleteById} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold text-center">ยืนยัน</button>
             </div>
          </div>
        </div>
      )}

      <aside className="w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800 shadow-2xl h-full shrink-0 text-left">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3 text-left">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg text-center"><Wallet size={20} className="text-white"/></div>
          <h1 className="text-xl font-bold tracking-tight text-left">MerchantTax</h1>
        </div>
        <nav className="p-6 space-y-4 flex-1 overflow-y-auto text-left">
          <NavButton active={activeTab === 'dashboard'} onClick={()=>{setActiveTab('dashboard');}} icon={<PieChart size={18}/>} label="แดชบอร์ด" />
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 opacity-50 text-left">Operations</p>
          <NavButton active={activeTab === 'records'} onClick={()=>{setActiveTab('records');}} icon={<Store size={18}/>} label="บันทึกขาย/หน้าร้าน" />
          <NavButton active={activeTab === 'import'} onClick={()=>{setActiveTab('import');}} icon={<FileUp size={18}/>} label="Bulk Import" />
          <NavButton active={activeTab === 'stock'} onClick={()=>{setActiveTab('stock');}} icon={<Box size={18}/>} label="คลังสินค้า FIFO" />
          <NavButton active={activeTab === 'invoice'} onClick={()=>{setActiveTab('invoice'); setPreFillInvoice(null);}} icon={<Printer size={18}/>} label="ใบกำกับภาษี Pro" />
          <NavButton active={activeTab === 'reports'} onClick={()=>{setActiveTab('reports');}} icon={<ClipboardList size={18}/>} label="รายงานภาษีและบัญชี" />
        </nav>
        <div className="p-4 bg-black/20 border-t border-slate-800 space-y-2 text-left">
          <button onClick={toggleAppMode} className="w-full py-3 px-4 rounded-xl text-[10px] font-bold flex items-center justify-start gap-2 bg-slate-800 text-indigo-300 ring-1 ring-slate-700 hover:bg-slate-700 transition-all text-left"><Database size={14}/> DB Instance: {currentAppId}</button>
          <button onClick={()=>setShowIdDeleteTool(true)} className="w-full py-3 px-4 rounded-xl text-[10px] font-bold flex items-center justify-start gap-2 bg-rose-900/30 text-rose-300 ring-1 ring-rose-800/50 hover:bg-rose-900/50 transition-all text-left"><Trash2 size={14}/> ลบทิ้งด้วย ID</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden relative text-left">
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 p-5 lg:px-10 flex justify-between items-center z-10 h-20 shrink-0 text-left">
          <div className="flex items-center gap-4 text-left"><h2 className="font-bold text-slate-800 text-sm uppercase tracking-widest text-left">{activeTab.replace('_', ' ')}</h2></div>
          {loading && <div className="text-[10px] font-black text-indigo-600 flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 animate-pulse text-left"><Loader size={12} className="animate-spin text-center"/> SYNCING</div>}
        </header>
        <div className="flex-1 overflow-auto p-6 lg:p-10 relative bg-[#f8fafc] text-left text-left text-left">{renderContent()}</div>
      </main>
    </div>
  );
}
