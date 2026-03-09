import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, User, FileText, Printer, X, DollarSign, Save } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Client } from './AdminClients';
import { Seller } from './AdminSellers';
import { Account } from './AdminAccounts';
import { supabase } from '../lib/supabaseClient';

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  reference: string;
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

  // Payment state
  const [paymentMethod1, setPaymentMethod1] = useState<string>('');
  const [amountPaid1, setAmountPaid1] = useState<number>(0);
  const [paymentMethod2, setPaymentMethod2] = useState<string>('');
  const [amountPaid2, setAmountPaid2] = useState<number>(0);

  const [newProduct, setNewProduct] = useState({ title: '', price: '', reference: '' });

  // Print state
  const [lastInvoice, setLastInvoice] = useState<any>(null);

  useEffect(() => {
    // Load clients from Supabase
    supabase.from('clients').select('*').order('name').then(({ data }) => {
      if (data && data.length > 0) setClients(data as any);
      else {
        const saved = localStorage.getItem('raynold_clients');
        if (saved) setClients(JSON.parse(saved));
      }
    });

    // Load sellers from Supabase
    supabase.from('sellers').select('*').order('name').then(({ data }) => {
      if (data && data.length > 0) setSellers(data as any);
      else {
        const saved = localStorage.getItem('admin_sellers');
        if (saved) setSellers(JSON.parse(saved));
      }
    });

    // Load accounts from Supabase
    supabase.from('accounts').select('*').order('name').then(({ data }) => {
      if (data && data.length > 0) {
        setAccounts(data as any);
        const defaultAcc = (data as any).find((a: any) => a.is_default_receiving) || data[0];
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

  const addToCart = (product: any) => {
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
        reference: product.reference || product.id.substring(0, 6)
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

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itbis = applyTax ? subtotal * 0.18 : 0;
  const total = subtotal + itbis;

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

    const nextNumber = String(Math.max(...invoices.map((i: any) => parseInt(i.number) || 0), 1000) + 1).padStart(4, '0');

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
        unitPrice: item.price
      })),
      notes: 'Generado desde POS',
      paymentTerms: paymentType === 'CONTADO' ? 'PAGO AL CONTADO' : 'VENTA A CREDITO',
      templateId: 'modern',
      payments: payments,
      paymentStatus: invoiceType === 'COTIZACION' ? 'PENDIENTE' : (totalPaid >= total - 0.01 ? 'PAGADA' : (totalPaid > 0 ? 'PARCIAL' : 'PENDIENTE')),
      applyTax: applyTax
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
    }).then(({ error }) => { if (error) console.error('POS Supabase:', error.message); });

    setLastInvoice(newInvoice);


    setCart([]);
    setIsCheckoutModalOpen(false);

    if (shouldPrint) {
      // Trigger print after a short delay to allow render
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  const saveAsDraft = () => {
    if (cart.length === 0) return;
    processSale(false, 'BORRADOR');
    alert('Borrador guardado correctamente');
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
              <select
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value as 'FACTURA' | 'COTIZACION')}
                className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:border-raynold-red focus:outline-none text-sm"
              >
                <option value="FACTURA">Factura</option>
                <option value="COTIZACION">Cotización</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-2">
                <DollarSign size={14} /> Tipo Pago
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as 'CONTADO' | 'CREDITO')}
                className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:border-raynold-red focus:outline-none text-sm"
              >
                <option value="CONTADO">Contado</option>
                <option value="CREDITO">Crédito</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-2">
              <User size={14} /> Cliente
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:border-raynold-red focus:outline-none text-sm"
            >
              <option value="">Cliente de Contado</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.company || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-2">
              <User size={14} /> Vendedor
            </label>
            <select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:border-raynold-red focus:outline-none text-sm"
            >
              <option value="">Seleccionar Vendedor...</option>
              {sellers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
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
                <span className="font-mono text-sm text-raynold-green">{formatCurrency(item.price * item.quantity)}</span>
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
          <div className="space-y-2 mb-4 text-sm">
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
                <select
                  value={paymentMethod1}
                  onChange={(e) => setPaymentMethod1(e.target.value)}
                  className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:border-raynold-red focus:outline-none text-sm"
                >
                  <option value="">Seleccionar cuenta...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                  ))}
                </select>
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
                <select
                  value={paymentMethod2}
                  onChange={(e) => setPaymentMethod2(e.target.value)}
                  className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:border-raynold-red focus:outline-none text-sm"
                >
                  <option value="">Seleccionar cuenta...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
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
                {lastInvoice.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between mb-1">
                    <span className="w-1/2 break-words">{item.quantity}x {item.description}</span>
                    <span className="w-1/4 text-right">{item.unitPrice.toFixed(2)}</span>
                    <span className="w-1/4 text-right">{(item.quantity * item.unitPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <p>--------------------------------</p>

              <div className="space-y-1">
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
              {lastInvoice.items.map((item: any, idx: number) => (
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
                <span>{formatCurrency(lastInvoice.items.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice), 0))}</span>
              </div>
              <div className="flex justify-between">
                <span>ITBIS:</span>
                <span>{formatCurrency(lastInvoice.items.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice), 0) * 0.18)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm mt-1 border-t border-black border-dashed pt-1">
                <span>TOTAL:</span>
                <span>{formatCurrency(lastInvoice.items.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice), 0) * 1.18)}</span>
              </div>
            </div>

            {lastInvoice.payments && lastInvoice.payments.length > 0 && (
              <div className="mb-4">
                <p>================================</p>
                <p className="font-bold">Pagos:</p>
                {lastInvoice.payments.map((p: any, idx: number) => (
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
