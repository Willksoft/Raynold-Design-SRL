import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, User, FileText, Printer, X, DollarSign, Save, Percent, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Client } from './AdminClients';
import { Seller } from './AdminSellers';
import { Account } from './AdminAccounts';
import { supabase } from '../lib/supabaseClient';
import { ProductItem, POSInvoice, InvoiceItem as POSItem, Payment } from '../types';
import CustomSelect from './CustomSelect';

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  reference: string;
  discount?: number;
  discountType?: 'percent' | 'fixed';
}

const AdminPOS = () => {
  const { products, setProducts } = useShop();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [invoiceType, setInvoiceType] = useState<'FACTURA' | 'COTIZACION'>('FACTURA');
  const [paymentType, setPaymentType] = useState<'CONTADO' | 'CREDITO'>('CONTADO');

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [applyTax, setApplyTax] = useState(true);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [globalDiscountType, setGlobalDiscountType] = useState<'percent' | 'fixed'>('percent');

  // Toast system
  const [posToasts, setPosToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const addPosToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setPosToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setPosToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // Payment state
  const [paymentMethod1, setPaymentMethod1] = useState<string>('');
  const [amountPaid1, setAmountPaid1] = useState<number>(0);
  const [paymentMethod2, setPaymentMethod2] = useState<string>('');
  const [amountPaid2, setAmountPaid2] = useState<number>(0);

  const [newProduct, setNewProduct] = useState({ title: '', price: '', reference: '' });

  // Print state
  const [lastInvoice, setLastInvoice] = useState<POSInvoice | null>(null);

  useEffect(() => {
    // Load clients from Supabase
    supabase.from('clients').select('*').order('name').then(({ data }) => {
      if (data && data.length > 0) setClients(data.map(c => ({ id: c.id, type: c.type as Client['type'], name: c.name, company: c.company || '', rnc: c.rnc || '', phone: c.phone || '', email: c.email || '', address: c.address || '' })));
      else {
        const saved = localStorage.getItem('raynold_clients');
        if (saved) setClients(JSON.parse(saved));
      }
    });

    // Load sellers from Supabase
    supabase.from('sellers').select('*').order('name').then(({ data }) => {
      if (data && data.length > 0) setSellers(data.map(s => ({ id: s.id, name: s.name })));
      else {
        const saved = localStorage.getItem('admin_sellers');
        if (saved) setSellers(JSON.parse(saved));
      }
    });

    // Load accounts from Supabase
    supabase.from('accounts').select('*').order('name').then(({ data }) => {
      if (data && data.length > 0) {
        setAccounts(data.map(a => ({ id: a.id, name: a.name, type: a.type as Account['type'], bankName: a.bank_name || '', accountNumber: a.account_number || '', accountSubType: a.account_sub_type || '', balance: Number(a.balance), isDefaultReceiving: a.is_default_receiving, isDefaultPaying: a.is_default_paying })));
        const defaultAcc = data.find((a) => a.is_default_receiving) || data[0];
        if (defaultAcc) setPaymentMethod1(defaultAcc.id);
      } else {
        const saved = localStorage.getItem('admin_accounts');
        if (saved) {
          const parsed = JSON.parse(saved);
          setAccounts(parsed);
          const defaultAcc = parsed.find((a: Account) => a.isDefaultReceiving) || parsed[0];
          if (defaultAcc) setPaymentMethod1(defaultAcc.id);
        }
      }
    });
  }, []);



  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: ProductItem) => {
    const numericPrice = parseFloat(product.price?.toString().replace(/[^0-9.-]+/g, "") || "0") || 0;
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, {
        id: product.id,
        title: product.title,
        price: numericPrice,
        quantity: 1,
        reference: product.reference || product.id.substring(0, 6),
        discount: product.discount || 0,
        discountType: product.discountType || 'percent'
      }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getCartItemTotal = (item: CartItem) => {
    const raw = item.price * item.quantity;
    if (!item.discount || item.discount <= 0) return raw;
    if (item.discountType === 'fixed') return Math.max(0, raw - item.discount);
    return raw * (1 - (item.discount / 100));
  };

  const rawSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemDiscountsTotal = cart.reduce((sum, item) => sum + ((item.price * item.quantity) - getCartItemTotal(item)), 0);
  const subtotalAfterItemDiscounts = rawSubtotal - itemDiscountsTotal;
  const globalDiscountAmount = globalDiscount > 0
    ? (globalDiscountType === 'fixed' ? globalDiscount : subtotalAfterItemDiscounts * (globalDiscount / 100))
    : 0;
  const subtotal = Math.max(0, subtotalAfterItemDiscounts - globalDiscountAmount);
  const itbis = applyTax ? subtotal * 0.18 : 0;
  const total = subtotal + itbis;
  const totalDiscounts = itemDiscountsTotal + globalDiscountAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setAmountPaid1(total);
    setAmountPaid2(0);
    setPaymentMethod2('');
    setIsCheckoutModalOpen(true);
  };

  const handleQuickProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProd = {
      id: Date.now().toString(),
      title: newProduct.title,
      price: newProduct.price,
      reference: newProduct.reference,
      category: 'General',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      type: 'product' as const
    };

    const updatedProducts = [...products, newProd];
    setProducts(updatedProducts);
    localStorage.setItem('raynold_products', JSON.stringify(updatedProducts));

    addToCart(newProd);
    setIsQuickProductModalOpen(false);
    setNewProduct({ title: '', price: '', reference: '' });
  };

  const processSale = (shouldPrint: boolean = true, status: 'BORRADOR' | 'EMITIDA' = 'BORRADOR') => {
    const savedInvoices = localStorage.getItem('raynold_invoices');
    let invoices = savedInvoices ? JSON.parse(savedInvoices) : [];

    const nextNumber = String(Math.max(...invoices.map((i: POSInvoice) => parseInt(i.number) || 0), 1000) + 1).padStart(4, '0');

    const client = clients.find(c => c.id === selectedClient);
    const seller = sellers.find(s => s.id === selectedSeller);

    const totalPaid = amountPaid1 + amountPaid2;

    const payments = [];
    const savedTransactions = localStorage.getItem('admin_transactions');
    let transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
    let updatedAccounts = [...accounts];

    const recordPayment = (accId: string, amount: number, ref: string) => {
      const acc = updatedAccounts.find(a => a.id === accId);
      if (acc) {
        acc.balance += amount;
        const newTx = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          date: new Date().toISOString(),
          accountId: accId,
          type: 'INCOME',
          amount: amount,
          reference: ref,
          description: `Venta POS #${nextNumber}`
        };
        transactions.unshift(newTx);
      }
    };

    if (amountPaid1 > 0 && paymentMethod1) {
      const acc = accounts.find(a => a.id === paymentMethod1);
      payments.push({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        amount: amountPaid1,
        method: acc?.name || 'DESCONOCIDO',
        accountId: paymentMethod1,
        reference: 'Pago POS 1'
      });
      recordPayment(paymentMethod1, amountPaid1, `POS-${nextNumber}-P1`);
    }
    if (amountPaid2 > 0 && paymentMethod2) {
      const acc = accounts.find(a => a.id === paymentMethod2);
      payments.push({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        amount: amountPaid2,
        method: acc?.name || 'DESCONOCIDO',
        accountId: paymentMethod2,
        reference: 'Pago POS 2'
      });
      recordPayment(paymentMethod2, amountPaid2, `POS-${nextNumber}-P2`);
    }

    // Save updated accounts and transactions if there were payments
    if (payments.length > 0) {
      localStorage.setItem('admin_accounts', JSON.stringify(updatedAccounts));
      localStorage.setItem('admin_transactions', JSON.stringify(transactions));
      setAccounts(updatedAccounts);
    }

    const newInvoice = {
      id: Math.random().toString(36).substr(2, 9),
      type: invoiceType,
      paymentType: paymentType,
      status: status,
      ncfType: '02',
      ncf: invoiceType === 'FACTURA' ? `B02${String(invoices.length + 1).padStart(8, '0')}` : '',
      date: new Date().toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      number: nextNumber,
      clientId: client?.id || '',
      clientName: client?.name || 'Cliente de Contado',
      companyName: client?.company || '',
      clientRnc: client?.rnc || '',
      clientPhone: client?.phone || '',
      sellerId: seller?.id || '',
      sellerName: seller?.name || '',
      items: cart.map(item => ({
        id: Math.random().toString(36).substr(2, 9),
        reference: item.reference,
        description: item.title,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: item.discount || 0,
        discountType: item.discountType || 'percent'
      })),
      notes: 'Generado desde POS',
      paymentTerms: paymentType === 'CONTADO' ? 'PAGO AL CONTADO' : 'VENTA A CREDITO',
      templateId: 'modern',
      payments: payments,
      paymentStatus: invoiceType === 'COTIZACION' ? 'PENDIENTE' : (totalPaid >= total - 0.01 ? 'PAGADA' : (totalPaid > 0 ? 'PARCIAL' : 'PENDIENTE')),
      applyTax: applyTax,
      globalDiscount: globalDiscount || 0,
      globalDiscountType: globalDiscountType || 'percent'
    };

    invoices.push(newInvoice);
    localStorage.setItem('raynold_invoices', JSON.stringify(invoices));

    // Persist to Supabase for cross-device sync
    supabase.from('invoices').upsert({
      id: newInvoice.id,
      type: newInvoice.type,
      payment_type: newInvoice.paymentType,
      status: newInvoice.status,
      ncf_type: newInvoice.ncfType,
      ncf: newInvoice.ncf,
      date: newInvoice.date,
      number: newInvoice.number,
      client_id: newInvoice.clientId || null,
      client_name: newInvoice.clientName,
      company_name: newInvoice.companyName,
      client_rnc: newInvoice.clientRnc,
      client_phone: newInvoice.clientPhone,
      seller_id: newInvoice.sellerId || null,
      seller_name: newInvoice.sellerName,
      items: newInvoice.items,
      notes: newInvoice.notes,
      payment_terms: newInvoice.paymentTerms,
      template_id: newInvoice.templateId,
      payments: newInvoice.payments,
      payment_status: newInvoice.paymentStatus,
      apply_tax: newInvoice.applyTax,
      global_discount: newInvoice.globalDiscount || 0,
      global_discount_type: newInvoice.globalDiscountType || 'percent',
    }).then(({ error }) => { if (error) console.error('POS Supabase:', error.message); });

    setLastInvoice(newInvoice);


    setCart([]);
    setIsCheckoutModalOpen(false);

    if (shouldPrint) {
      // Trigger print synchronized with CPU/render loop instead of static timeout
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.print();
        });
      });
    }
  };

  const saveAsDraft = () => {
    if (cart.length === 0) return;
    processSale(false, 'BORRADOR');
    addPosToast('Borrador guardado correctamente', 'success');
  };

  const handlePreview = () => {
    const client = clients.find(c => c.id === selectedClient);
    const seller = sellers.find(s => s.id === selectedSeller);

    const previewInvoice = {
      number: 'PREVIEW',
      date: new Date().toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      type: invoiceType,
      clientName: client?.name || 'Cliente de Contado',
      sellerName: seller?.name || '',
      items: cart.map(item => ({
        description: item.title,
        quantity: item.quantity,
        unitPrice: item.price
      })),
      subtotal,
      itbis,
      total,
      ncf: invoiceType === 'FACTURA' ? 'B02XXXXXXXX' : ''
    };

    setLastInvoice(previewInvoice);
    setIsPreviewModalOpen(true);
  };

  return (
    <div className="flex h-full overflow-hidden bg-[#050505] print:bg-white">
      {/* POS Toast Notifications */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {posToasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-md flex items-center gap-3 min-w-[280px] max-w-[420px] animate-slide-in-right ${
              t.type === 'success' ? 'bg-green-900/90 border-green-500/30 text-green-100' :
              t.type === 'error' ? 'bg-red-900/90 border-red-500/30 text-red-100' :
              'bg-blue-900/90 border-blue-500/30 text-blue-100'
            }`}
            onClick={() => setPosToasts(prev => prev.filter(x => x.id !== t.id))}
            style={{ cursor: 'pointer' }}
          >
            {t.type === 'success' && <CheckCircle2 size={18} className="text-green-400 shrink-0" />}
            {t.type === 'error' && <AlertTriangle size={18} className="text-red-400 shrink-0" />}
            {t.type === 'info' && <FileText size={18} className="text-blue-400 shrink-0" />}
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            margin: 0;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      ` }} />

      {/* Left Side: Products Grid */}
      <div className="flex-1 flex flex-col border-r border-white/10 print:hidden">
        <div className="p-4 border-b border-white/10 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-futuristic font-bold text-white">Punto de Venta</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-xs font-bold text-gray-400 uppercase">ITBIS (18%)</span>
                <button
                  onClick={() => setApplyTax(!applyTax)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${applyTax ? 'bg-raynold-red' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${applyTax ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              <button
                onClick={() => setIsQuickProductModalOpen(true)}
                className="bg-raynold-red hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold"
              >
                <Plus size={16} />
                Producto Rápido
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Buscar productos o servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white focus:border-raynold-red focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-raynold-red cursor-pointer transition-colors group flex flex-col"
              >
                <div className="h-24 bg-gray-900 relative shrink-0">
                  {product.image && (
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <h3 className="font-bold text-white text-sm line-clamp-2 mb-1">{product.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-raynold-green font-mono text-xs">{product.price || formatCurrency(0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Cart */}
      <div className="w-96 bg-[#0A0A0A] flex flex-col shrink-0 print:hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart size={20} className="text-raynold-red" />
            Carrito
          </h2>
        </div>

        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-2">
                <FileText size={14} /> Documento
              </label>
              <CustomSelect variant="dark" value={invoiceType} onChange={v => setInvoiceType(v as 'FACTURA' | 'COTIZACION')} options={[
                { value: 'FACTURA', label: 'Factura' }, { value: 'COTIZACION', label: 'Cotización' },
              ]} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-2">
                <DollarSign size={14} /> Tipo Pago
              </label>
              <CustomSelect variant="dark" value={paymentType} onChange={v => setPaymentType(v as 'CONTADO' | 'CREDITO')} options={[
                { value: 'CONTADO', label: 'Contado' }, { value: 'CREDITO', label: 'Crédito' },
              ]} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-2">
              <User size={14} /> Cliente
            </label>
            <CustomSelect variant="dark" value={selectedClient} onChange={v => setSelectedClient(v)} options={[
              { value: '', label: 'Cliente de Contado' },
              ...clients.map(c => ({ value: c.id, label: c.company || c.name })),
            ]} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-2">
              <User size={14} /> Vendedor
            </label>
            <CustomSelect variant="dark" value={selectedSeller} onChange={v => setSelectedSeller(v)} options={[
              { value: '', label: 'Seleccionar Vendedor...' },
              ...sellers.map(s => ({ value: s.id, label: s.name })),
            ]} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="bg-black border border-white/10 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-bold text-white pr-4">{item.title}</h4>
                <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white/10 rounded text-gray-400">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold w-6 text-center text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white/10 rounded text-gray-400">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm text-raynold-green">{formatCurrency(getCartItemTotal(item))}</span>
                  {(item.discount || 0) > 0 && (
                    <p className="text-[10px] text-red-400 font-bold">-{item.discountType === 'fixed' ? formatCurrency(item.discount!) : `${item.discount}%`}</p>
                  )}
                </div>
              </div>
              {/* Per-item discount row */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                <Percent size={11} className="text-gray-500 shrink-0" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.discount || ''}
                  onChange={(e) => setCart(cart.map(c => c.id === item.id ? { ...c, discount: parseFloat(e.target.value) || 0 } : c))}
                  placeholder="Desc."
                  className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:border-raynold-red focus:outline-none"
                />
                <CustomSelect variant="dark" value={item.discountType || 'percent'} onChange={v => setCart(cart.map(c => c.id === item.id ? { ...c, discountType: v as 'percent' | 'fixed' } : c))} options={[
                  { value: 'percent', label: '%' }, { value: 'fixed', label: '$' },
                ]} />
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
              <ShoppingCart size={48} className="opacity-20" />
              <p>El carrito está vacío</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-black shrink-0">
          {/* Global Discount */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
            <Percent size={13} className="text-gray-500 shrink-0" />
            <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Desc. Global</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={globalDiscount || ''}
              onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:border-raynold-red focus:outline-none text-right"
            />
            <CustomSelect variant="dark" value={globalDiscountType} onChange={v => setGlobalDiscountType(v as 'percent' | 'fixed')} options={[
              { value: 'percent', label: '%' }, { value: 'fixed', label: '$' },
            ]} />
            {globalDiscountAmount > 0 && (
              <span className="text-xs text-red-400 font-bold ml-auto">-{formatCurrency(globalDiscountAmount)}</span>
            )}
          </div>

          <div className="space-y-2 mb-4 text-sm">
            {totalDiscounts > 0 && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Bruto</span>
                  <span>{formatCurrency(rawSubtotal)}</span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>Descuentos</span>
                  <span>-{formatCurrency(totalDiscounts)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>ITBIS (18%)</span>
              <span>{formatCurrency(itbis)}</span>
            </div>
            <div className="flex justify-between items-end pt-2 border-t border-white/10">
              <span className="font-bold text-white">Total</span>
              <span className="text-2xl font-black text-raynold-red">{formatCurrency(total)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={saveAsDraft}
              disabled={cart.length === 0}
              className="py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              Borrador
            </button>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="py-3 bg-raynold-red text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CreditCard size={20} />
              Cobrar
            </button>
          </div>
        </div>
      </div>

      {/* Quick Product Modal */}
      {isQuickProductModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">Crear Producto Rápido</h3>
              <button onClick={() => setIsQuickProductModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleQuickProductSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre</label>
                <input
                  type="text" required
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  className="w-full bg-black border border-white/20 rounded-lg p-2 text-white focus:border-raynold-red focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Precio</label>
                  <input
                    type="number" required step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full bg-black border border-white/20 rounded-lg p-2 text-white focus:border-raynold-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Referencia</label>
                  <input
                    type="text"
                    value={newProduct.reference}
                    onChange={(e) => setNewProduct({ ...newProduct, reference: e.target.value })}
                    className="w-full bg-black border border-white/20 rounded-lg p-2 text-white focus:border-raynold-red focus:outline-none"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-2 bg-raynold-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
                Guardar y Añadir
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-white/10 shrink-0">
              <h3 className="font-bold text-xl text-white flex items-center gap-2">
                <CreditCard size={20} className="text-raynold-red" />
                Procesar Pago
              </h3>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Total a Cobrar</p>
                <p className="text-4xl font-black text-white">{formatCurrency(total)}</p>
              </div>

              {/* Payment Method 1 */}
              <div className="space-y-3 bg-black/50 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Método 1</label>
                  <span className="text-xs text-gray-500">Requerido</span>
                </div>
                <CustomSelect variant="dark" value={paymentMethod1} onChange={v => setPaymentMethod1(v)} options={[
                  { value: '', label: 'Seleccionar cuenta...' },
                  ...accounts.map(a => ({ value: a.id, label: `${a.name} (${formatCurrency(a.balance)})` })),
                ]} />
                <input
                  type="number"
                  value={amountPaid1}
                  onChange={(e) => setAmountPaid1(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-raynold-red focus:outline-none text-xl font-bold text-center"
                  placeholder="Monto"
                />
              </div>

              {/* Payment Method 2 (Optional) */}
              <div className="space-y-3 bg-black/50 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Método 2 (Opcional)</label>
                  {paymentMethod2 && (
                    <button onClick={() => { setPaymentMethod2(''); setAmountPaid2(0); }} className="text-xs text-red-500 hover:text-red-400">
                      Quitar
                    </button>
                  )}
                </div>
                <CustomSelect variant="dark" value={paymentMethod2} onChange={v => setPaymentMethod2(v)} options={[
                  { value: '', label: 'Seleccionar cuenta...' },
                  ...accounts.map(a => ({ value: a.id, label: a.name })),
                ]} />
                {paymentMethod2 && (
                  <input
                    type="number"
                    value={amountPaid2}
                    onChange={(e) => setAmountPaid2(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-raynold-red focus:outline-none text-xl font-bold text-center"
                    placeholder="Monto"
                  />
                )}
              </div>

              {/* Change Calculation */}
              {(amountPaid1 + amountPaid2) > total && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-400 uppercase font-bold mb-1">Cambio a Devolver</p>
                  <p className="text-xl font-bold text-green-500">{formatCurrency((amountPaid1 + amountPaid2) - total)}</p>
                </div>
              )}
              {(amountPaid1 + amountPaid2) < total && invoiceType === 'FACTURA' && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-yellow-400 uppercase font-bold mb-1">Falta por Pagar</p>
                  <p className="text-xl font-bold text-yellow-500">{formatCurrency(total - (amountPaid1 + amountPaid2))}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-black flex flex-col gap-3 shrink-0">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="py-3 text-gray-400 hover:text-white font-bold transition-colors border border-white/10 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePreview}
                  className="py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={18} />
                  Vista Previa
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => processSale(false, 'BORRADOR')}
                  className="py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Solo Guardar
                </button>
                <button
                  onClick={() => processSale(true, 'BORRADOR')}
                  className="py-3 bg-raynold-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Confirmar e Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && lastInvoice && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md no-print">
          <div className="bg-white text-black w-full max-w-[400px] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Vista Previa de Ticket</h3>
              <button onClick={() => setIsPreviewModalOpen(false)} className="text-gray-500 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-sm leading-tight bg-white">
              <div className="text-center mb-4">
                <h2 className="font-bold text-lg uppercase">RAYNOLD DESIGN</h2>
                <p>RNC: 131-76560-2</p>
                <p>Tel: 829-580-7411</p>
                <p>--------------------------------</p>
                <h3 className="font-bold uppercase mt-2">{lastInvoice.type}</h3>
                <p>No: {lastInvoice.number}</p>
                <p>Fecha: {lastInvoice.date}</p>
                {lastInvoice.ncf && <p>NCF: {lastInvoice.ncf}</p>}
                <p>--------------------------------</p>
              </div>

              <div className="mb-2">
                <p>Cliente: {lastInvoice.clientName}</p>
                {lastInvoice.sellerName && <p>Vendedor: {lastInvoice.sellerName}</p>}
              </div>

              <p>--------------------------------</p>
              <div className="w-full mb-2">
                <div className="flex justify-between font-bold border-b border-black border-dashed pb-1 mb-1">
                  <span className="w-1/2">Cant x Desc</span>
                  <span className="w-1/4 text-right">Precio</span>
                  <span className="w-1/4 text-right">Total</span>
                </div>
                {lastInvoice.items.map((item: POSItem, idx: number) => (
                  <div key={idx} className="flex justify-between mb-1">
                    <span className="w-1/2 break-words">{item.quantity}x {item.description}</span>
                    <span className="w-1/4 text-right">{item.unitPrice.toFixed(2)}</span>
                    <span className="w-1/4 text-right">{(item.quantity * item.unitPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <p>--------------------------------</p>

              <div className="space-y-1">
                {totalDiscounts > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Bruto:</span>
                      <span>{formatCurrency(rawSubtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Descuento:</span>
                      <span>-{formatCurrency(totalDiscounts)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(lastInvoice.subtotal || subtotal)}</span>
                </div>
                {lastInvoice.itbis > 0 && (
                  <div className="flex justify-between">
                    <span>ITBIS (18%):</span>
                    <span>{formatCurrency(lastInvoice.itbis || itbis)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-1 border-t border-black border-dashed">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(lastInvoice.total || total)}</span>
                </div>
              </div>

              <div className="mt-6 text-center text-[10px]">
                <p>¡Gracias por su compra!</p>
                <p>Raynold Design SRL</p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => { setIsPreviewModalOpen(false); processSale(true); }}
                className="flex-1 py-2 bg-raynold-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmar e Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Print Layout (Hidden from screen, only visible on print) */}
      <div className="hidden print:block print:absolute print:top-0 print:left-0 print:w-[80mm] print:bg-white print:text-black print:p-2 print:font-mono print:text-[12px] print:leading-tight">
        {lastInvoice && (
          <div className="w-full">
            <div className="text-center mb-4">
              <h2 className="font-bold text-lg uppercase">{lastInvoice.companyName || 'RAYNOLD DESIGN'}</h2>
              <p>RNC: {lastInvoice.clientRnc || '123456789'}</p>
              <p>Tel: {lastInvoice.clientPhone || '809-555-5555'}</p>
              <p>================================</p>
              <h3 className="font-bold uppercase mt-2">{lastInvoice.type}</h3>
              <p>No: {lastInvoice.number}</p>
              <p>Fecha: {lastInvoice.date}</p>
              {lastInvoice.ncf && <p>NCF: {lastInvoice.ncf}</p>}
              <p>================================</p>
            </div>

            <div className="mb-2">
              <p>Cliente: {lastInvoice.clientName}</p>
              {lastInvoice.sellerName && <p>Vendedor: {lastInvoice.sellerName}</p>}
            </div>

            <p>================================</p>
            <div className="w-full mb-2">
              <div className="flex justify-between font-bold border-b border-black border-dashed pb-1 mb-1">
                <span className="w-1/2">Cant x Desc</span>
                <span className="w-1/4 text-right">Precio</span>
                <span className="w-1/4 text-right">Total</span>
              </div>
              {lastInvoice.items.map((item: POSItem, idx: number) => (
                <div key={idx} className="flex justify-between mb-1">
                  <span className="w-1/2 break-words">{item.quantity}x {item.description}</span>
                  <span className="w-1/4 text-right">{item.unitPrice.toFixed(2)}</span>
                  <span className="w-1/4 text-right">{(item.quantity * item.unitPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <p>================================</p>

            <div className="text-right space-y-1 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(lastInvoice.items.reduce((s: number, i: POSItem) => s + (i.quantity * i.unitPrice), 0))}</span>
              </div>
              <div className="flex justify-between">
                <span>ITBIS:</span>
                <span>{formatCurrency(lastInvoice.items.reduce((s: number, i: POSItem) => s + (i.quantity * i.unitPrice), 0) * 0.18)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm mt-1 border-t border-black border-dashed pt-1">
                <span>TOTAL:</span>
                <span>{formatCurrency(lastInvoice.items.reduce((s: number, i: POSItem) => s + (i.quantity * i.unitPrice), 0) * 1.18)}</span>
              </div>
            </div>

            {lastInvoice.payments && lastInvoice.payments.length > 0 && (
              <div className="mb-4">
                <p>================================</p>
                <p className="font-bold">Pagos:</p>
                {lastInvoice.payments.map((p: Payment, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span>{p.method}:</span>
                    <span>{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-6">
              <p>¡Gracias por su compra!</p>
              <p>Visítenos en raynolddesign.com</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminPOS;
