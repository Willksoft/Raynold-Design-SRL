import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, Loader2, Package, Eye, Copy, ShoppingBag, Calendar, Truck, CheckCircle, XCircle, Clock, ChevronDown, Printer, Download, FileText, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Supplier } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface POItem {
  id: string;
  reference: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface PurchaseOrder {
  id: string;
  number: string;
  date: string;
  expectedDate: string;
  status: 'PENDIENTE' | 'RECIBIDA' | 'PARCIAL' | 'CANCELADA';
  supplierId: string;
  supplierName: string;
  supplierRnc: string;
  notes: string;
  items: POItem[];
  subtotal: number;
  tax: number;
  total: number;
  applyTax: boolean;
}

// ─── Toast System ───────────────────────────────────────────────────────────────
interface ToastItem { id: number; msg: string; type: 'success' | 'error' | 'info'; }

// ─── Component ──────────────────────────────────────────────────────────────────
const AdminPurchaseOrders = () => {
  // Data
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  // Editor
  const [isEditing, setIsEditing] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<PurchaseOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);

  // Supplier search
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDD, setShowSupplierDD] = useState(false);

  // Product search for adding items
  const [productSearch, setProductSearch] = useState('');
  const [showProductDD, setShowProductDD] = useState(false);

  // Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Print ref
  const printRef = useRef<HTMLDivElement>(null);

  // Company info (from localStorage like AdminInvoices)  
  const getCompanyInfo = () => {
    try {
      const raw = localStorage.getItem('companyInfo');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { name: 'RAYNOLD DESIGNS SRL', rnc: '131765602', phone: '829-696-3043', address: 'Santiago, República Dominicana' };
  };

  const addToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = toastId.current++;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  // ─── Load Data ──────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setOrders(data.map((r: any) => ({
        id: r.id,
        number: r.number,
        date: r.date,
        expectedDate: r.expected_date || '',
        status: r.status,
        supplierId: r.supplier_id || '',
        supplierName: r.supplier_name,
        supplierRnc: r.supplier_rnc || '',
        notes: r.notes || '',
        items: r.items || [],
        subtotal: Number(r.subtotal) || 0,
        tax: Number(r.tax) || 0,
        total: Number(r.total) || 0,
        applyTax: r.apply_tax || false,
      })));
    }
    if (error) console.error('Error loading POs:', error);
    setLoading(false);
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('name');
    if (data) setSuppliers(data.map((s: any) => ({
      id: s.id, name: s.name, contactName: s.contact_name || '',
      email: s.email || '', phone: s.phone || '', address: s.address || '', taxId: s.tax_id || ''
    })));
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('id, title, reference, price').order('title');
    if (data) setProducts(data);
  };

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
  }, []);

  // ─── Generate number ─────────────────────────────────────────────────
  const generateNumber = () => {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const seq = String(orders.length + 1).padStart(4, '0');
    return `OC-${y}${m}-${seq}`;
  };

  // ─── Calculate totals ────────────────────────────────────────────────
  const calcTotals = (items: POItem[], applyTax: boolean) => {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const tax = applyTax ? subtotal * 0.18 : 0;
    return { subtotal, tax, total: subtotal + tax };
  };

  // ─── CRUD ─────────────────────────────────────────────────────────────
  const handleNew = () => {
    const blank: PurchaseOrder = {
      id: '', number: generateNumber(), date: new Date().toISOString().slice(0, 10),
      expectedDate: '', status: 'PENDIENTE', supplierId: '', supplierName: '', supplierRnc: '',
      notes: '', items: [], subtotal: 0, tax: 0, total: 0, applyTax: false,
    };
    setCurrentOrder(blank);
    setSupplierSearch('');
    setIsEditing(true);
    setViewingOrder(null);
  };

  const handleEdit = (order: PurchaseOrder) => {
    setCurrentOrder({ ...order });
    setSupplierSearch(order.supplierName);
    setIsEditing(true);
    setViewingOrder(null);
  };

  const handleDuplicate = (order: PurchaseOrder) => {
    setCurrentOrder({
      ...order, id: '', number: generateNumber(),
      date: new Date().toISOString().slice(0, 10), status: 'PENDIENTE',
    });
    setSupplierSearch(order.supplierName);
    setIsEditing(true);
    setViewingOrder(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta orden de compra?')) return;
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
    if (!error) { addToast('Orden eliminada', 'success'); fetchOrders(); }
    else addToast('Error: ' + error.message, 'error');
  };

  const handleSave = async () => {
    if (!currentOrder) return;
    const { subtotal, tax, total } = calcTotals(currentOrder.items, currentOrder.applyTax);
    const row = {
      number: currentOrder.number,
      date: currentOrder.date,
      expected_date: currentOrder.expectedDate || null,
      status: currentOrder.status,
      supplier_id: currentOrder.supplierId || null,
      supplier_name: currentOrder.supplierName,
      supplier_rnc: currentOrder.supplierRnc || null,
      notes: currentOrder.notes || null,
      items: currentOrder.items,
      subtotal, tax, total,
      apply_tax: currentOrder.applyTax,
    };

    if (currentOrder.id) {
      const { error } = await supabase.from('purchase_orders').update(row).eq('id', currentOrder.id);
      if (error) { addToast('Error: ' + error.message, 'error'); return; }
      addToast('Orden actualizada', 'success');
    } else {
      const { error } = await supabase.from('purchase_orders').insert([row]);
      if (error) { addToast('Error: ' + error.message, 'error'); return; }
      addToast('Orden creada', 'success');
    }
    setIsEditing(false);
    setCurrentOrder(null);
    fetchOrders();
  };

  // ─── Item management ──────────────────────────────────────────────────
  const addItem = (product?: any) => {
    if (!currentOrder) return;
    const newItem: POItem = {
      id: crypto.randomUUID(),
      reference: product?.reference || '',
      description: product?.title || '',
      quantity: 1,
      unitPrice: product?.price ? parseFloat(product.price) : 0,
    };
    const items = [...currentOrder.items, newItem];
    const totals = calcTotals(items, currentOrder.applyTax);
    setCurrentOrder({ ...currentOrder, items, ...totals });
  };

  const updateItem = (id: string, field: keyof POItem, value: any) => {
    if (!currentOrder) return;
    const items = currentOrder.items.map(i => i.id === id ? { ...i, [field]: value } : i);
    const totals = calcTotals(items, currentOrder.applyTax);
    setCurrentOrder({ ...currentOrder, items, ...totals });
  };

  const removeItem = (id: string) => {
    if (!currentOrder) return;
    const items = currentOrder.items.filter(i => i.id !== id);
    const totals = calcTotals(items, currentOrder.applyTax);
    setCurrentOrder({ ...currentOrder, items, ...totals });
  };

  // ─── Supplier selection ────────────────────────────────────────────────
  const selectSupplier = (supplier: Supplier) => {
    if (!currentOrder) return;
    setCurrentOrder({
      ...currentOrder,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierRnc: supplier.taxId || '',
    });
    setSupplierSearch(supplier.name);
    setShowSupplierDD(false);
  };

  // ─── Print / Download ─────────────────────────────────────────────────
  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Orden de Compra</title><style>body{font-family:Arial,sans-serif;margin:20px;color:#111}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}th{background:#f5f5f5;font-weight:700}h2{margin-bottom:4px}.info-row{display:flex;justify-content:space-between;margin-bottom:16px;gap:16px}.info-box{flex:1;background:#fafafa;border:1px solid #eee;border-radius:8px;padding:12px}.label{font-size:11px;color:#888;font-weight:700;text-transform:uppercase}.value{font-size:14px;font-weight:600;margin-top:2px}.totals{text-align:right;margin-top:12px}</style></head><body>`);
    w.document.write(el.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  };

  const handleDownload = async () => {
    const el = printRef.current;
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#fff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      const w = pdf.internal.pageSize.getWidth() - 20;
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, w, h);
      pdf.save(`${viewingOrder?.number || 'OC'}.pdf`);
      addToast('PDF descargado', 'success');
    } catch (err) {
      addToast('Error al generar PDF', 'error');
    }
  };

  // ─── Filter ───────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(o => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || o.number.toLowerCase().includes(q) || o.supplierName.toLowerCase().includes(q) || o.supplierRnc.includes(q);
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ─── Status helpers ─────────────────────────────────────────────────
  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    PENDIENTE: { label: 'Pendiente', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30', icon: Clock },
    RECIBIDA: { label: 'Recibida', color: 'text-green-500 bg-green-500/10 border-green-500/30', icon: CheckCircle },
    PARCIAL: { label: 'Parcial', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30', icon: Package },
    CANCELADA: { label: 'Cancelada', color: 'text-red-500 bg-red-500/10 border-red-500/30', icon: XCircle },
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = statusConfig[status] || statusConfig.PENDIENTE;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
        <Icon size={10} /> {cfg.label}
      </span>
    );
  };

  const fmt = (n: number) => n.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const company = getCompanyInfo();

  // ════════════════════════════════════════════════════════════════════════
  //                           RENDER
  // ════════════════════════════════════════════════════════════════════════

  // ─── VIEW MODE ─────────────────────────────────────────────────────────
  if (viewingOrder) {
    const o = viewingOrder;
    return (
      <div className="p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 print:hidden">
            <button onClick={() => setViewingOrder(null)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <X size={18} /> Volver
            </button>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"><Printer size={14} /> Imprimir</button>
              <button onClick={handleDownload} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"><Download size={14} /> PDF</button>
              <button onClick={() => handleEdit(o)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"><Edit2 size={14} /> Editar</button>
              <button onClick={() => handleDuplicate(o)} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"><Copy size={14} /> Duplicar</button>
            </div>
          </div>

          {/* Preview */}
          <div ref={printRef} className="bg-white text-gray-900 rounded-xl p-8 shadow-xl" style={{ minHeight: '600px' }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900">{company.name}</h2>
                <p className="text-sm text-gray-500">RNC: {company.rnc}</p>
                <p className="text-sm text-gray-500">{company.phone}</p>
                <p className="text-sm text-gray-500">{company.address}</p>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-black text-blue-600">ORDEN DE COMPRA</h3>
                <p className="text-lg font-bold text-gray-900">{o.number}</p>
                <StatusBadge status={o.status} />
              </div>
            </div>

            {/* Info row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Proveedor</p>
                <p className="font-bold text-gray-900">{o.supplierName}</p>
                {o.supplierRnc && <p className="text-sm text-gray-500 font-mono">RNC: {o.supplierRnc}</p>}
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Fechas</p>
                <p className="text-sm text-gray-900"><span className="text-gray-500">Emisión:</span> {o.date}</p>
                {o.expectedDate && <p className="text-sm text-gray-900"><span className="text-gray-500">Entrega esperada:</span> {o.expectedDate}</p>}
              </div>
            </div>

            {/* Items table */}
            <table className="w-full mb-6" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 text-xs font-bold text-gray-500 border border-gray-200">REF</th>
                  <th className="text-left p-2 text-xs font-bold text-gray-500 border border-gray-200">DESCRIPCIÓN</th>
                  <th className="text-center p-2 text-xs font-bold text-gray-500 border border-gray-200">CANT</th>
                  <th className="text-right p-2 text-xs font-bold text-gray-500 border border-gray-200">P. UNIT</th>
                  <th className="text-right p-2 text-xs font-bold text-gray-500 border border-gray-200">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {o.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-2 text-sm font-mono text-gray-500 border border-gray-200">{item.reference}</td>
                    <td className="p-2 text-sm text-gray-900 border border-gray-200">{item.description}</td>
                    <td className="p-2 text-sm text-center text-gray-900 border border-gray-200">{item.quantity}</td>
                    <td className="p-2 text-sm text-right text-gray-900 border border-gray-200">${fmt(item.unitPrice)}</td>
                    <td className="p-2 text-sm text-right font-bold text-gray-900 border border-gray-200">${fmt(item.quantity * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1">
                <div className="flex justify-between text-sm text-gray-600"><span>Subtotal:</span><span>${fmt(o.subtotal)}</span></div>
                {o.applyTax && <div className="flex justify-between text-sm text-gray-600"><span>ITBIS (18%):</span><span>${fmt(o.tax)}</span></div>}
                <div className="flex justify-between text-lg font-black text-gray-900 border-t border-gray-300 pt-2 mt-2"><span>TOTAL:</span><span>${fmt(o.total)}</span></div>
              </div>
            </div>

            {/* Notes */}
            {o.notes && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Notas</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{o.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Toasts */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map(t => (
            <div key={t.id} className={`px-4 py-2 rounded-lg text-sm font-bold shadow-lg animate-slide-up ${t.type === 'success' ? 'bg-green-600 text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
              {t.msg}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── EDITOR MODE ───────────────────────────────────────────────────────
  if (isEditing && currentOrder) {
    const totals = calcTotals(currentOrder.items, currentOrder.applyTax);
    return (
      <div className="p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-futuristic font-black text-white">
              {currentOrder.id ? 'Editar' : 'Nueva'} <span className="animate-gradient-text">Orden de Compra</span>
            </h1>
            <div className="flex gap-2">
              <button onClick={() => { setIsEditing(false); setCurrentOrder(null); }} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-2 btn-animated font-bold rounded-lg flex items-center gap-2"><Save size={16} /> Guardar</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Main info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header info */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Número</label>
                    <input value={currentOrder.number} onChange={e => setCurrentOrder({ ...currentOrder, number: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white font-mono focus:border-raynold-red focus:outline-none mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Estado</label>
                    <select value={currentOrder.status} onChange={e => setCurrentOrder({ ...currentOrder, status: e.target.value as any })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none mt-1">
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="RECIBIDA">Recibida</option>
                      <option value="PARCIAL">Parcial</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Fecha Emisión</label>
                    <input type="date" value={currentOrder.date} onChange={e => setCurrentOrder({ ...currentOrder, date: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Fecha Entrega Esperada</label>
                    <input type="date" value={currentOrder.expectedDate} onChange={e => setCurrentOrder({ ...currentOrder, expectedDate: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none mt-1" />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white uppercase">Artículos</h3>
                  <div className="flex gap-2">
                    {/* Product search */}
                    <div className="relative">
                      <div className="flex items-center bg-black border border-white/20 rounded-lg overflow-hidden">
                        <Search size={14} className="ml-2 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Buscar producto..."
                          value={productSearch}
                          onChange={e => { setProductSearch(e.target.value); setShowProductDD(e.target.value.length > 0); }}
                          onFocus={() => { if (productSearch) setShowProductDD(true); }}
                          className="w-40 bg-transparent px-2 py-1.5 text-sm text-white focus:outline-none"
                        />
                      </div>
                      {showProductDD && (
                        <div className="absolute z-30 top-full mt-1 w-64 bg-[#111] border border-white/10 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
                          {products.filter(p => {
                            const q = productSearch.toLowerCase();
                            return p.title.toLowerCase().includes(q) || (p.reference || '').toLowerCase().includes(q);
                          }).map(p => (
                            <button
                              key={p.id}
                              onClick={() => { addItem(p); setProductSearch(''); setShowProductDD(false); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors text-gray-300"
                            >
                              <span className="font-bold text-white">{p.title}</span>
                              {p.reference && <span className="text-gray-500 ml-2 text-xs font-mono">{p.reference}</span>}
                              {p.price && <span className="text-green-400 ml-2 text-xs">${p.price}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => addItem()} className="p-1.5 bg-raynold-red/20 text-raynold-red rounded-lg hover:bg-raynold-red/30 transition-colors" title="Añadir vacío"><Plus size={16} /></button>
                  </div>
                </div>

                {/* Items table */}
                <div className="space-y-2">
                  {currentOrder.items.length === 0 && (
                    <div className="text-center p-8 text-gray-500 border border-dashed border-white/10 rounded-lg">
                      <Package size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Añade productos o artículos a la orden</p>
                    </div>
                  )}
                  {currentOrder.items.map((item, i) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-black/60 rounded-lg p-2 border border-white/5">
                      <input value={item.reference} onChange={e => updateItem(item.id, 'reference', e.target.value)} placeholder="REF" className="col-span-2 bg-transparent border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300 font-mono focus:outline-none focus:border-white/30" />
                      <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Descripción" className="col-span-4 bg-transparent border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/30" />
                      <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))} className="col-span-1 bg-transparent border border-white/10 rounded px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-white/30" />
                      <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="col-span-2 bg-transparent border border-white/10 rounded px-2 py-1.5 text-sm text-white text-right focus:outline-none focus:border-white/30" />
                      <div className="col-span-2 text-right text-sm font-bold text-green-400">${fmt(item.quantity * item.unitPrice)}</div>
                      <button onClick={() => removeItem(item.id)} className="col-span-1 p-1 text-red-400/50 hover:text-red-400 transition-colors flex justify-center"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                {currentOrder.items.length > 0 && (
                  <div className="mt-4 flex justify-between items-start">
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                      <input type="checkbox" checked={currentOrder.applyTax} onChange={e => {
                        const t = calcTotals(currentOrder.items, e.target.checked);
                        setCurrentOrder({ ...currentOrder, applyTax: e.target.checked, ...t });
                      }} className="rounded" />
                      Aplicar ITBIS (18%)
                    </label>
                    <div className="text-right space-y-1">
                      <div className="text-sm text-gray-400">Subtotal: <span className="text-white font-bold">${fmt(totals.subtotal)}</span></div>
                      {currentOrder.applyTax && <div className="text-sm text-gray-400">ITBIS: <span className="text-white font-bold">${fmt(totals.tax)}</span></div>}
                      <div className="text-lg font-black text-green-400 border-t border-white/10 pt-2">Total: ${fmt(totals.total)}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                <label className="text-xs font-bold text-gray-400 uppercase">Notas</label>
                <textarea rows={3} value={currentOrder.notes} onChange={e => setCurrentOrder({ ...currentOrder, notes: e.target.value })} placeholder="Observaciones, instrucciones de entrega..." className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none mt-1 resize-none" />
              </div>
            </div>

            {/* Right: Supplier */}
            <div className="space-y-6">
              <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase mb-3">Proveedor</h3>
                <div className="relative">
                  <div className="flex items-center border border-white/20 rounded-lg overflow-hidden bg-black mb-2">
                    <Search size={14} className="ml-2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Buscar proveedor..."
                      value={supplierSearch}
                      onChange={e => { setSupplierSearch(e.target.value); setShowSupplierDD(true); }}
                      onFocus={() => setShowSupplierDD(true)}
                      className="w-full px-2 py-2 bg-transparent text-white text-sm focus:outline-none"
                    />
                  </div>
                  {showSupplierDD && (
                    <div className="absolute z-30 w-full bg-[#111] border border-white/10 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
                      {suppliers
                        .filter(s => {
                          const q = supplierSearch.toLowerCase();
                          if (!q) return true;
                          return s.name.toLowerCase().includes(q) || (s.taxId || '').includes(q);
                        })
                        .map(s => (
                          <button key={s.id} onClick={() => selectSupplier(s)} className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 text-gray-300 transition-colors">
                            <div className="font-bold text-white">{s.name}</div>
                            {s.taxId && <div className="text-xs text-gray-500 font-mono">RNC: {s.taxId}</div>}
                          </button>
                        ))}
                      {suppliers.filter(s => { const q = supplierSearch.toLowerCase(); if (!q) return true; return s.name.toLowerCase().includes(q); }).length === 0 && (
                        <div className="px-3 py-3 text-xs text-gray-500 text-center">No se encontraron proveedores</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <input value={currentOrder.supplierName} onChange={e => setCurrentOrder({ ...currentOrder, supplierName: e.target.value })} placeholder="Nombre del proveedor" className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-raynold-red focus:outline-none" />
                  <input value={currentOrder.supplierRnc} onChange={e => setCurrentOrder({ ...currentOrder, supplierRnc: e.target.value })} placeholder="RNC" className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-raynold-red focus:outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toasts */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map(t => (
            <div key={t.id} className={`px-4 py-2 rounded-lg text-sm font-bold shadow-lg ${t.type === 'success' ? 'bg-green-600 text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
              {t.msg}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── LIST MODE ─────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Truck className="text-raynold-red" size={32} />
              <h1 className="text-4xl md:text-5xl font-futuristic font-black text-white">
                ÓRDENES DE <span className="animate-gradient-text">COMPRA</span>
              </h1>
            </div>
            <p className="text-gray-400">Gestiona las órdenes de compra a proveedores.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text" placeholder="Buscar orden..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors text-sm">
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="RECIBIDA">Recibida</option>
              <option value="PARCIAL">Parcial</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
            <button onClick={handleNew} className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center justify-center gap-2 whitespace-nowrap">
              <Plus size={18} /> Nueva Orden
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pendientes', count: orders.filter(o => o.status === 'PENDIENTE').length, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
            { label: 'Recibidas', count: orders.filter(o => o.status === 'RECIBIDA').length, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Parciales', count: orders.filter(o => o.status === 'PARCIAL').length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Total Órdenes', count: orders.length, color: 'text-white', bg: 'bg-white/5' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} border border-white/10 rounded-xl p-4 flex items-center gap-3`}>
              <div className={`text-3xl font-black ${s.color}`}>{s.count}</div>
              <div className="text-sm text-gray-400 font-bold">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center h-48 text-gray-500">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando órdenes...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-12 text-center text-gray-500">
            <Truck size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold mb-2">No hay órdenes de compra</p>
            <p className="text-sm">Crea tu primera orden de compra para empezar.</p>
          </div>
        ) : (
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Número</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Proveedor</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Artículos</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase">Total</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setViewingOrder(o)}>
                    <td className="px-4 py-3 font-bold text-white font-mono text-sm">{o.number}</td>
                    <td className="px-4 py-3">
                      <div className="text-white text-sm font-bold">{o.supplierName}</div>
                      {o.supplierRnc && <div className="text-xs text-gray-500 font-mono">{o.supplierRnc}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{o.date}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{o.items.length}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-400 text-sm">${fmt(o.total)}</td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setViewingOrder(o)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors" title="Ver"><Eye size={14} /></button>
                        <button onClick={() => handleEdit(o)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-blue-400 transition-colors" title="Editar"><Edit2 size={14} /></button>
                        <button onClick={() => handleDuplicate(o)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-green-400 transition-colors" title="Duplicar"><Copy size={14} /></button>
                        <button onClick={() => handleDelete(o.id)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 rounded-lg text-sm font-bold shadow-lg ${t.type === 'success' ? 'bg-green-600 text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPurchaseOrders;
