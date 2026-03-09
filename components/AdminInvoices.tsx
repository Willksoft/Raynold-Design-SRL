import React, { useState, useEffect } from 'react';
import { Plus, Printer, Save, Trash2, ArrowLeft, FileText, Copy, Edit2, Settings, List as ListIcon, X, Download, DollarSign, Loader2, Search } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Client } from './AdminClients';
import { ServiceDetail as Service } from '../data/services';
import { Account } from './AdminAccounts';
import { supabase } from '../lib/supabaseClient';

interface InvoiceItem {
  id: string;
  reference: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  accountId: string;
  reference: string;
}

interface CompanySettings {
  name: string;
  subtitle: string;
  rnc: string;
  address1: string;
  address2: string;
  phone: string;
  logoUrl?: string;
}

interface Invoice {
  id: string;
  type: 'COTIZACION' | 'FACTURA';
  paymentType: 'CONTADO' | 'CREDITO';
  status: 'BORRADOR' | 'EMITIDA';
  ncfType: string;
  ncf: string;
  date: string;
  number: string;
  clientId: string;
  clientName: string;
  companyName: string;
  clientRnc: string;
  clientPhone: string;
  sellerId?: string;
  sellerName?: string;
  items: InvoiceItem[];
  notes: string;
  paymentTerms: string;
  templateId: 'classic' | 'modern' | 'minimal';
  payments: Payment[];
  paymentStatus: 'PENDIENTE' | 'PARCIAL' | 'PAGADA';
  applyTax?: boolean;
}

const ncfTypes = [
  { value: '01', label: 'Crédito Fiscal (B01)' },
  { value: '02', label: 'Consumidor Final (B02)' },
  { value: '14', label: 'Regímenes Especiales (B14)' },
  { value: '15', label: 'Gubernamental (B15)' }
];

const defaultCompanySettings: CompanySettings = {
  name: 'RAYNOLD',
  subtitle: 'DESIGNS SRL',
  rnc: '131-76560-2',
  address1: 'Calle Juan Pablo Duarte, Lotificacion Veron II',
  address2: '2300 Punta Cana, República Dominicana.',
  phone: '829-580-7411',
  logoUrl: 'https://ymiqmbzsmeqexgztquwj.supabase.co/storage/v1/object/public/raynold-media/brand/logo-negro.svg'
};

const defaultInvoice: Invoice = {
  id: '',
  type: 'COTIZACION',
  paymentType: 'CONTADO',
  status: 'BORRADOR',
  ncfType: '01',
  ncf: '',
  date: new Date().toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  number: '',
  clientId: '',
  clientName: '',
  companyName: '',
  clientRnc: '',
  clientPhone: '',
  items: [],
  notes: '',
  paymentTerms: 'FORMA DE PAGO: 50% ANTICIPADO, 50% CONTRA ENTREGA. TIEMPO DE PRODUCCION: 2 DIAS HABILES.',
  templateId: 'classic',
  payments: [],
  paymentStatus: 'PENDIENTE',
  applyTax: true
};

const AdminInvoices = () => {
  const { products } = useShop();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [newPayment, setNewPayment] = useState<Payment>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    method: '',
    accountId: '',
    reference: ''
  });

  // Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);

  // Load data
  useEffect(() => {
    // Load invoices from Supabase first, fall back to localStorage
    supabase.from('invoices').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data && data.length > 0) {
        setInvoices(data.map((inv: any) => ({
          ...inv,
          items: Array.isArray(inv.items) ? inv.items : [],
          payments: Array.isArray(inv.payments) ? inv.payments : [],
        })));
      } else {
        const savedInvoices = localStorage.getItem('raynold_invoices');
        if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      }
    });

    // Load clients from Supabase
    supabase.from('clients').select('*').order('name').then(({ data }) => {
      if (data && data.length > 0) {
        setClients(data.map(c => ({ id: c.id, name: c.name, company: c.company || '', rnc: c.rnc || '', phone: c.phone || '', email: c.email || '' })));
      } else {
        const savedClients = localStorage.getItem('raynold_clients');
        if (savedClients) setClients(JSON.parse(savedClients));
      }
    });

    // Load services from Supabase
    supabase.from('services').select('id, title, description').eq('is_active', true).then(({ data }) => {
      if (data && data.length > 0) setServices(data as any);
      else {
        const savedServices = localStorage.getItem('raynold_services');
        if (savedServices) setServices(JSON.parse(savedServices));
      }
    });

    const savedCompanySettings = localStorage.getItem('raynold_company_settings');
    if (savedCompanySettings) {
      const parsed = JSON.parse(savedCompanySettings);
      // Always use the official logo for PDFs
      setCompanySettings({ ...parsed, logoUrl: 'https://ymiqmbzsmeqexgztquwj.supabase.co/storage/v1/object/public/raynold-media/brand/logo-negro.svg' });
    }

    // Load accounts from Supabase
    supabase.from('accounts').select('*').order('name').then(({ data }) => {
      if (data && data.length > 0) {
        setAccounts(data as any);
        const defaultAcc = data.find((a: any) => a.is_default_receiving) || data[0];
        if (defaultAcc) setNewPayment(prev => ({ ...prev, accountId: defaultAcc.id, method: defaultAcc.name }));
      } else {
        const savedAccounts = localStorage.getItem('admin_accounts');
        if (savedAccounts) {
          const parsed = JSON.parse(savedAccounts);
          setAccounts(parsed);
          const defaultAcc = parsed.find((a: Account) => a.isDefaultReceiving) || parsed[0];
          if (defaultAcc) setNewPayment(prev => ({ ...prev, accountId: defaultAcc.id, method: defaultAcc.name }));
        }
      }
    });
  }, []);

  // Save invoices to localStorage as backup
  useEffect(() => {
    localStorage.setItem('raynold_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Save company settings
  useEffect(() => {
    localStorage.setItem('raynold_company_settings', JSON.stringify(companySettings));
  }, [companySettings]);

  const generateNextNumber = () => {
    return String(Math.max(...invoices.map(i => parseInt(i.number) || 0), 1000) + 1).padStart(4, '0');
  };

  const generateNCF = (type: string) => {
    const count = invoices.filter(i => i.ncfType === type && i.type === 'FACTURA').length + 1;
    return `B${type}${String(count).padStart(8, '0')}`;
  };

  const handleCreateNew = () => {
    setCurrentInvoice({
      ...defaultInvoice,
      id: Math.random().toString(36).substr(2, 9),
      number: generateNextNumber()
    });
    setView('editor');
  };

  const handleEdit = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setView('editor');
  };

  const handleDuplicate = (invoice: Invoice) => {
    const duplicated = {
      ...invoice,
      id: Math.random().toString(36).substr(2, 9),
      number: generateNextNumber(),
      date: new Date().toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      ncf: invoice.type === 'FACTURA' ? generateNCF(invoice.ncfType) : ''
    };
    setInvoices([...invoices, duplicated]);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este documento?')) {
      // First delete from Supabase
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) {
        console.error('Error deleting from supabase:', error);
        alert('Error al eliminar el documento en la base de datos.');
        return;
      }
      setInvoices(invoices.filter(i => i.id !== id));
    }
  };

  const handleBack = () => {
    if (currentInvoice) {
      const exists = invoices.find(i => i.id === currentInvoice.id);
      if (!exists) {
        setInvoices([...invoices, { ...currentInvoice, status: 'BORRADOR' }]);
      } else {
        setInvoices(invoices.map(i => i.id === currentInvoice.id ? currentInvoice : i));
      }
    }
    setView('list');
  };

  const handleSave = async (status: 'BORRADOR' | 'EMITIDA' = 'EMITIDA') => {
    if (!currentInvoice) return;
    const invoiceToSave = { ...currentInvoice, status };
    const exists = invoices.find(i => i.id === currentInvoice.id);
    if (exists) {
      setInvoices(invoices.map(i => i.id === currentInvoice.id ? invoiceToSave : i));
    } else {
      setInvoices([...invoices, invoiceToSave]);
    }
    setCurrentInvoice(invoiceToSave);

    // Persist to Supabase
    const { error } = await supabase.from('invoices').upsert({
      id: invoiceToSave.id,
      type: invoiceToSave.type,
      payment_type: invoiceToSave.paymentType,
      status: invoiceToSave.status,
      ncf_type: invoiceToSave.ncfType,
      ncf: invoiceToSave.ncf,
      date: invoiceToSave.date,
      number: invoiceToSave.number,
      client_id: invoiceToSave.clientId || null,
      client_name: invoiceToSave.clientName,
      company_name: invoiceToSave.companyName,
      client_rnc: invoiceToSave.clientRnc,
      client_phone: invoiceToSave.clientPhone,
      seller_id: invoiceToSave.sellerId || null,
      seller_name: invoiceToSave.sellerName,
      items: invoiceToSave.items,
      notes: invoiceToSave.notes,
      payment_terms: invoiceToSave.paymentTerms,
      template_id: invoiceToSave.templateId,
      payments: invoiceToSave.payments,
      payment_status: invoiceToSave.paymentStatus,
      apply_tax: invoiceToSave.applyTax,
    });
    if (error) console.error('Supabase save error:', error.message);
    alert(`Documento guardado como ${status}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintFromList = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setView('editor');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const updateCurrentInvoice = (field: keyof Invoice, value: any) => {
    if (!currentInvoice) return;

    let updates: Partial<Invoice> = { [field]: value };

    // Auto-generate NCF if type changes to FACTURA
    if (field === 'type' && value === 'FACTURA' && !currentInvoice.ncf) {
      updates.ncf = generateNCF(currentInvoice.ncfType);
    }

    // Auto-generate NCF if ncfType changes
    if (field === 'ncfType' && currentInvoice.type === 'FACTURA') {
      updates.ncf = generateNCF(value);
    }

    setCurrentInvoice({ ...currentInvoice, ...updates });
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client && currentInvoice) {
      setCurrentInvoice({
        ...currentInvoice,
        clientId: client.id,
        clientName: client.name,
        companyName: client.company,
        clientRnc: client.rnc,
        clientPhone: client.phone
      });
    }
  };

  // Item Modal Functions
  const openItemModal = (item?: InvoiceItem) => {
    if (item) {
      setEditingItem(item);
    } else {
      setEditingItem({
        id: Math.random().toString(36).substr(2, 9),
        reference: '',
        description: '',
        quantity: 1,
        unitPrice: 0
      });
    }
    setIsItemModalOpen(true);
  };

  const saveItem = () => {
    if (!currentInvoice || !editingItem) return;

    const exists = currentInvoice.items.find(i => i.id === editingItem.id);
    let newItems;
    if (exists) {
      newItems = currentInvoice.items.map(i => i.id === editingItem.id ? editingItem : i);
    } else {
      newItems = [...currentInvoice.items, editingItem];
    }

    setCurrentInvoice({ ...currentInvoice, items: newItems });
    setIsItemModalOpen(false);
  };

  const removeItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentInvoice) {
      setCurrentInvoice({
        ...currentInvoice,
        items: currentInvoice.items.filter(item => item.id !== id)
      });
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && editingItem) {
      const numericPrice = parseFloat(product.price?.replace(/[^0-9.-]+/g, "") || "0") || 0;
      setEditingItem({
        ...editingItem,
        reference: product.reference || product.id.substring(0, 6),
        description: product.title,
        unitPrice: numericPrice
      });
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service && editingItem) {
      setEditingItem({
        ...editingItem,
        reference: `SRV-${service.id.substring(0, 4)}`,
        description: service.title,
        unitPrice: service.price || 0
      });
    }
  };

  // Calculations
  const subtotal = currentInvoice?.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
  const applyTax = currentInvoice?.applyTax !== false;
  const itbis = applyTax ? subtotal * 0.18 : 0;
  const total = subtotal + itbis;
  const totalPaid = currentInvoice?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDue = total - totalPaid;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
  };

  const handleAddPayment = () => {
    if (!currentInvoice || newPayment.amount <= 0 || !newPayment.accountId) return;

    const account = accounts.find(a => a.id === newPayment.accountId);
    const payment: Payment = {
      ...newPayment,
      id: Math.random().toString(36).substr(2, 9),
      method: account?.name || 'DESCONOCIDO'
    };

    const updatedPayments = [...(currentInvoice.payments || []), payment];
    const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

    let newStatus: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' = 'PENDIENTE';
    if (newTotalPaid >= total - 0.01) { // allow small rounding diff
      newStatus = 'PAGADA';
    } else if (newTotalPaid > 0) {
      newStatus = 'PARCIAL';
    }

    // Update account balance and record transaction
    const savedAccounts = localStorage.getItem('admin_accounts');
    let allAccounts = savedAccounts ? JSON.parse(savedAccounts) : accounts;
    const accIndex = allAccounts.findIndex((a: Account) => a.id === payment.accountId);
    if (accIndex !== -1) {
      allAccounts[accIndex].balance += payment.amount;
      localStorage.setItem('admin_accounts', JSON.stringify(allAccounts));
      setAccounts(allAccounts);

      const savedTransactions = localStorage.getItem('admin_transactions');
      let transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
      transactions.unshift({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        accountId: payment.accountId,
        type: 'INCOME',
        amount: payment.amount,
        reference: payment.reference || `INV-${currentInvoice.number}`,
        description: `Cobro de Factura #${currentInvoice.number}`
      });
      localStorage.setItem('admin_transactions', JSON.stringify(transactions));
    }

    setCurrentInvoice({
      ...currentInvoice,
      payments: updatedPayments,
      paymentStatus: newStatus
    });

    setIsPaymentModalOpen(false);
    setNewPayment({
      id: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      method: '',
      accountId: '',
      reference: ''
    });
  };

  const handleRemovePayment = (paymentId: string) => {
    if (!currentInvoice) return;

    const updatedPayments = currentInvoice.payments.filter(p => p.id !== paymentId);
    const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

    let newStatus: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' = 'PENDIENTE';
    if (newTotalPaid >= total - 0.01) {
      newStatus = 'PAGADA';
    } else if (newTotalPaid > 0) {
      newStatus = 'PARCIAL';
    }

    setCurrentInvoice({
      ...currentInvoice,
      payments: updatedPayments,
      paymentStatus: newStatus
    });
  };

  if (view === 'editor' && currentInvoice) {
    return (
      <div className="flex flex-col h-full bg-gray-100 text-black overflow-hidden print:bg-white print:h-auto print:overflow-visible">
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page {
              margin: 0.5in;
              size: letter;
            }
            body {
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-content {
              width: 100% !important;
              min-height: auto !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
            }
            .print-hidden {
              display: none !important;
            }
            /* Ensure terms and conditions don't get cut off */
            .whitespace-pre-wrap {
              word-break: break-word;
              overflow-wrap: break-word;
            }
            /* Fix for bottom cutting */
            .invoice-container {
              display: block !important;
              height: auto !important;
              overflow: visible !important;
            }
          }
        ` }} />

        {/* Top Bar */}
        <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm print:hidden shrink-0 z-10">
          <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-black font-medium">
            <ArrowLeft size={20} /> Volver
          </button>
          <div className="flex gap-3">
            <button onClick={() => handleSave('BORRADOR')} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              <Save size={18} /> Guardar Borrador
            </button>
            <button onClick={() => handleSave('EMITIDA')} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              <Save size={18} /> Emitir / Guardar
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-raynold-red text-white rounded-lg hover:bg-red-700 transition-colors">
              <Printer size={18} /> Imprimir / PDF
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">

          {/* Left Panel: Settings (Hidden on Print) */}
          <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto print:hidden shrink-0 shadow-lg z-10">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Settings size={20} className="text-raynold-red" />
              Configuración
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Plantilla</label>
                <select
                  value={currentInvoice.templateId}
                  onChange={(e) => updateCurrentInvoice('templateId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                >
                  <option value="classic">Clásica</option>
                  <option value="modern">Moderna</option>
                  <option value="minimal">Minimalista</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Documento</label>
                <select
                  value={currentInvoice.type}
                  onChange={(e) => updateCurrentInvoice('type', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                >
                  <option value="COTIZACION">Cotización</option>
                  <option value="FACTURA">Factura</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Pago</label>
                <select
                  value={currentInvoice.paymentType}
                  onChange={(e) => updateCurrentInvoice('paymentType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                >
                  <option value="CONTADO">Contado</option>
                  <option value="CREDITO">Crédito</option>
                </select>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="applyTax"
                  checked={currentInvoice.applyTax !== false}
                  onChange={(e) => updateCurrentInvoice('applyTax', e.target.checked)}
                  className="w-4 h-4 text-raynold-red focus:ring-raynold-red border-gray-300 rounded"
                />
                <label htmlFor="applyTax" className="text-sm font-bold text-gray-700 cursor-pointer">Aplicar ITBIS (18%)</label>
              </div>

              {currentInvoice.type === 'FACTURA' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Comprobante (NCF)</label>
                    <select
                      value={currentInvoice.ncfType}
                      onChange={(e) => updateCurrentInvoice('ncfType', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                    >
                      {ncfTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Número de NCF</label>
                    <input
                      type="text"
                      value={currentInvoice.ncf}
                      onChange={(e) => updateCurrentInvoice('ncf', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red font-mono"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seleccionar Cliente</label>
                <select
                  value={currentInvoice.clientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red mb-3"
                >
                  <option value="">-- Seleccionar de la lista --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company || c.name}</option>
                  ))}
                </select>

                <div className="space-y-2">
                  <input type="text" placeholder="Nombre" value={currentInvoice.clientName} onChange={(e) => updateCurrentInvoice('clientName', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm" />
                  <input type="text" placeholder="Empresa" value={currentInvoice.companyName} onChange={(e) => updateCurrentInvoice('companyName', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm" />
                  <input type="text" placeholder="RNC" value={currentInvoice.clientRnc} onChange={(e) => updateCurrentInvoice('clientRnc', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm" />
                  <input type="text" placeholder="Teléfono" value={currentInvoice.clientPhone} onChange={(e) => updateCurrentInvoice('clientPhone', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha y Número</label>
                <div className="flex gap-2">
                  <input type="text" value={currentInvoice.date} onChange={(e) => updateCurrentInvoice('date', e.target.value)} className="w-1/2 border border-gray-300 rounded p-2 text-sm" />
                  <input type="text" value={currentInvoice.number} onChange={(e) => updateCurrentInvoice('number', e.target.value)} className="w-1/2 border border-gray-300 rounded p-2 text-sm text-center font-bold" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notas</label>
                <textarea value={currentInvoice.notes} onChange={(e) => updateCurrentInvoice('notes', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm h-20 resize-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Condiciones de Pago</label>
                <textarea value={currentInvoice.paymentTerms} onChange={(e) => updateCurrentInvoice('paymentTerms', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm h-20 resize-none" />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Pagos Registrados</label>
                  <button
                    onClick={() => {
                      setNewPayment({ ...newPayment, amount: balanceDue > 0 ? balanceDue : 0 });
                      setIsPaymentModalOpen(true);
                    }}
                    className="text-xs bg-raynold-red text-white px-2 py-1 rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                  >
                    <Plus size={12} /> Añadir Pago
                  </button>
                </div>

                {currentInvoice.payments && currentInvoice.payments.length > 0 ? (
                  <div className="space-y-2">
                    {currentInvoice.payments.map(payment => (
                      <div key={payment.id} className="bg-gray-50 border border-gray-200 rounded p-2 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-gray-800">{formatCurrency(payment.amount)}</div>
                          <div className="text-gray-500">{payment.date} • {payment.method}</div>
                        </div>
                        <button onClick={() => handleRemovePayment(payment.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                      <span className="text-xs font-bold text-gray-600">Balance Pendiente:</span>
                      <span className={`text-sm font-bold ${balanceDue <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(balanceDue)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic text-center py-2 bg-gray-50 rounded border border-gray-100">
                    No hay pagos registrados
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Document Preview (8.5x11) */}
          <div className="flex-1 overflow-y-auto bg-gray-200 p-8 print:p-0 print:bg-white flex justify-center invoice-container">

            <div className="w-[8.5in] min-h-[11in] bg-white shadow-2xl print:shadow-none relative print-content">
              {currentInvoice.templateId === 'classic' && (
                <div className="p-10 md:p-12 h-full flex flex-col">

                  {/* Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-64">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                          <div className="w-3 h-12 bg-teal-600 transform -skew-x-12"></div>
                          <div className="w-3 h-12 bg-raynold-red transform -skew-x-12"></div>
                          <div className="w-3 h-12 bg-black transform -skew-x-12"></div>
                        </div>
                        <div className="flex flex-col">
                          {companySettings.logoUrl ? (
                            <img src={companySettings.logoUrl} alt={companySettings.name} className="h-12 object-contain" />
                          ) : (
                            <>
                              <span className="text-2xl font-black tracking-tighter leading-none">{companySettings.name}</span>
                              <span className="text-xl font-black tracking-widest leading-none">{companySettings.subtitle}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-xs text-gray-600 space-y-1">
                      <p>Rnc: {companySettings.rnc}</p>
                      <p>{companySettings.address1}</p>
                      <p>{companySettings.address2}</p>
                      <p>Telf.: {companySettings.phone}</p>
                    </div>
                  </div>

                  {/* Title & NCF */}
                  <div className="mb-6">
                    <h1 className="text-4xl font-bold text-red-600 uppercase">
                      {currentInvoice.type === 'FACTURA' ? 'FACTURA' : 'COTIZACION'}
                    </h1>
                    {currentInvoice.type === 'FACTURA' && currentInvoice.ncf && (
                      <div className="mt-2 text-sm font-bold text-gray-800">
                        NCF: <span className="font-mono">{currentInvoice.ncf}</span>
                      </div>
                    )}
                  </div>

                  {/* Client Info & Meta */}
                  <div className="flex justify-between mb-8 text-sm">
                    <div className="space-y-2 flex-1 pr-8">
                      <p className="font-bold text-gray-800">A la atención de</p>
                      {currentInvoice.clientName && (
                        <div className="flex gap-2"><span className="text-gray-600 w-16">Nombre:</span> <span>{currentInvoice.clientName}</span></div>
                      )}
                      {currentInvoice.companyName && (
                        <div className="flex gap-2"><span className="text-gray-600 w-40">Nombre de la empresa:</span> <span>{currentInvoice.companyName}</span></div>
                      )}
                      {currentInvoice.clientRnc && (
                        <div className="flex gap-2"><span className="text-gray-600 w-16">Rnc:</span> <span>{currentInvoice.clientRnc}</span></div>
                      )}
                      {currentInvoice.clientPhone && (
                        <div className="flex gap-2"><span className="text-gray-600 w-16">Telefono:</span> <span>{currentInvoice.clientPhone}</span></div>
                      )}
                    </div>

                    <div className="w-48 space-y-4 text-right">
                      <div className="font-bold">Fecha: {currentInvoice.date}</div>
                      <div>
                        <span className="font-bold">N°</span>
                        <div className="mt-2">{currentInvoice.number}</div>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="mb-8 flex-grow">
                    <table className="w-full text-sm print:table">
                      <thead>
                        <tr className="bg-red-600 text-white">
                          <th className="py-2 px-3 text-left font-bold w-24">Ref/ID</th>
                          <th className="py-2 px-3 text-left font-bold">Descripción</th>
                          <th className="py-2 px-3 text-center font-bold w-24">Cantidad</th>
                          <th className="py-2 px-3 text-center font-bold w-32">Precio unitario</th>
                          <th className="py-2 px-3 text-right font-bold w-32">Precio total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentInvoice.items.map((item, index) => (
                          <tr
                            key={item.id}
                            onClick={() => openItemModal(item)}
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'} cursor-pointer hover:bg-blue-50 transition-colors group relative print:break-inside-avoid`}
                          >
                            <td className="py-3 px-3 font-mono text-xs text-gray-500">{item.reference || '-'}</td>
                            <td className="py-3 px-3 uppercase">{item.description || '-'}</td>
                            <td className="py-3 px-3 text-center">{item.quantity}</td>
                            <td className="py-3 px-3 text-center">{formatCurrency(item.unitPrice).replace('DOP', '$')}</td>
                            <td className="py-3 px-3 text-right text-gray-600 font-medium">
                              {formatCurrency(item.quantity * item.unitPrice).replace('DOP', '$')}
                            </td>
                            {/* Delete button overlay on hover */}
                            <td className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 opacity-0 group-hover:opacity-100 print:hidden">
                              <button onClick={(e) => removeItem(item.id, e)} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {/* Empty rows for visual padding */}
                        {[...Array(Math.max(0, 5 - currentInvoice.items.length))].map((_, i) => (
                          <tr key={`empty-${i}`} className={(currentInvoice.items.length + i) % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                            <td className="py-5 px-3"></td><td className="py-5 px-3"></td><td className="py-5 px-3"></td><td className="py-5 px-3"></td><td className="py-5 px-3"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-4 print:hidden flex justify-center">
                      <button
                        onClick={() => openItemModal()}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 font-medium transition-colors border border-gray-300 border-dashed"
                      >
                        <Plus size={16} /> Añadir Producto / Servicio
                      </button>
                    </div>
                  </div>

                  {/* Footer & Totals */}
                  <div className="mt-8 print:mt-4 border-t border-gray-300 pt-4 flex justify-between text-sm print:break-inside-avoid">
                    <div className="w-3/5 pr-8 flex flex-col justify-between">
                      <div className="flex gap-2">
                        <span className="text-gray-500 font-medium">Notas:</span>
                        <p className="flex-1 whitespace-pre-wrap">{currentInvoice.notes}</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-red-600 font-bold uppercase whitespace-pre-wrap">{currentInvoice.paymentTerms}</p>
                      </div>
                    </div>

                    <div className="w-2/5">
                      <div className="flex justify-between py-1">
                        <span className="text-red-600 font-bold">SUB TOTAL</span>
                        <span className="font-bold">{formatCurrency(subtotal).replace('DOP', '$')}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-red-600 font-bold">ITBIS</span>
                        <span className="font-bold">{formatCurrency(itbis).replace('DOP', '$')}</span>
                      </div>
                      <div className="flex justify-between py-2 mt-1">
                        <span className="font-black text-lg">TOTAL</span>
                        <span className="font-black text-lg">{formatCurrency(total).replace('DOP', '$')}</span>
                      </div>
                      {totalPaid > 0 && (
                        <>
                          <div className="flex justify-between py-1 text-green-700">
                            <span className="font-bold">PAGADO</span>
                            <span className="font-bold">-{formatCurrency(totalPaid).replace('DOP', '$')}</span>
                          </div>
                          <div className="flex justify-between py-2 mt-1 border-t border-gray-300">
                            <span className="font-black text-lg text-red-600">BALANCE</span>
                            <span className="font-black text-lg text-red-600">{formatCurrency(balanceDue).replace('DOP', '$')}</span>
                          </div>
                        </>
                      )}

                      {currentInvoice.paymentStatus === 'PAGADA' && (
                        <div className="mt-4 border-4 border-green-600 text-green-600 text-center py-2 font-black text-2xl uppercase tracking-widest transform -rotate-6 opacity-80">
                          PAGADO
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentInvoice.templateId === 'modern' && (
                <div className="p-10 md:p-12 h-full flex flex-col bg-gray-50">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-10 pb-8 border-b-2 border-raynold-red/20">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        {companySettings.logoUrl ? (
                          <img src={companySettings.logoUrl} alt={companySettings.name} className="h-12 object-contain" />
                        ) : (
                          <>
                            <div className="w-10 h-10 bg-raynold-red rounded-lg flex items-center justify-center text-white font-black text-xl">
                              {companySettings.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-2xl font-black tracking-tight text-gray-900 leading-none">{companySettings.name}</span>
                              <span className="text-sm font-bold text-raynold-red tracking-widest leading-none mt-1">{companySettings.subtitle}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>RNC: {companySettings.rnc}</p>
                        <p>{companySettings.address1}</p>
                        <p>{companySettings.address2}</p>
                        <p>Tel: {companySettings.phone}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase mb-2">
                        {currentInvoice.type === 'FACTURA' ? 'FACTURA' : 'COTIZACIÓN'}
                      </h1>
                      <div className="text-xl font-bold text-raynold-red mb-2">#{currentInvoice.number}</div>
                      <div className="text-sm text-gray-500 font-medium">Fecha: {currentInvoice.date}</div>
                      {currentInvoice.type === 'FACTURA' && currentInvoice.ncf && (
                        <div className="mt-2 text-xs font-bold bg-white px-3 py-1 rounded-full border border-gray-200 inline-block">
                          NCF: <span className="font-mono text-raynold-red">{currentInvoice.ncf}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Facturar a</h3>
                    <div className="grid grid-cols-2 gap-8 text-sm">
                      <div className="space-y-2">
                        {currentInvoice.clientName && (
                          <div className="flex"><span className="text-gray-500 w-24">Nombre:</span> <span className="font-bold text-gray-900">{currentInvoice.clientName}</span></div>
                        )}
                        {currentInvoice.companyName && (
                          <div className="flex"><span className="text-gray-500 w-24">Empresa:</span> <span className="font-bold text-gray-900">{currentInvoice.companyName}</span></div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {currentInvoice.clientRnc && (
                          <div className="flex"><span className="text-gray-500 w-24">RNC:</span> <span className="font-mono text-gray-900">{currentInvoice.clientRnc}</span></div>
                        )}
                        {currentInvoice.clientPhone && (
                          <div className="flex"><span className="text-gray-500 w-24">Teléfono:</span> <span className="text-gray-900">{currentInvoice.clientPhone}</span></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="mb-8 flex-grow bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm print:table">
                      <thead>
                        <tr className="bg-gray-900 text-white">
                          <th className="py-4 px-6 text-left font-medium w-24">Ref</th>
                          <th className="py-4 px-6 text-left font-medium">Descripción</th>
                          <th className="py-4 px-6 text-center font-medium w-24">Cant.</th>
                          <th className="py-4 px-6 text-right font-medium w-32">Precio</th>
                          <th className="py-4 px-6 text-right font-medium w-32">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {currentInvoice.items.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => openItemModal(item)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors group relative print:break-inside-avoid"
                          >
                            <td className="py-4 px-6 font-mono text-xs text-gray-400">{item.reference || '-'}</td>
                            <td className="py-4 px-6 font-medium text-gray-900">{item.description || '-'}</td>
                            <td className="py-4 px-6 text-center text-gray-600">{item.quantity}</td>
                            <td className="py-4 px-6 text-right text-gray-600">{formatCurrency(item.unitPrice).replace('DOP', '$')}</td>
                            <td className="py-4 px-6 text-right font-bold text-gray-900">
                              {formatCurrency(item.quantity * item.unitPrice).replace('DOP', '$')}
                            </td>
                            <td className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 opacity-0 group-hover:opacity-100 print:hidden">
                              <button onClick={(e) => removeItem(item.id, e)} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="p-4 print:hidden flex justify-center border-t border-gray-100 bg-gray-50">
                      <button
                        onClick={() => openItemModal()}
                        className="px-4 py-2 text-raynold-red hover:bg-red-50 rounded-lg flex items-center gap-2 font-bold transition-colors text-sm"
                      >
                        <Plus size={16} /> Añadir Producto
                      </button>
                    </div>
                  </div>

                  {/* Footer & Totals */}
                  <div className="mt-8 print:mt-4 flex gap-8 print:break-inside-avoid">
                    <div className="flex-1 space-y-6">
                      {currentInvoice.notes && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notas</h4>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap bg-white p-4 rounded-xl border border-gray-100">{currentInvoice.notes}</p>
                        </div>
                      )}
                      {currentInvoice.paymentTerms && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Términos y Condiciones</h4>
                          <p className="text-xs font-medium text-gray-500 whitespace-pre-wrap">{currentInvoice.paymentTerms}</p>
                        </div>
                      )}
                    </div>

                    <div className="w-72 bg-gray-900 text-white p-6 rounded-xl shadow-lg flex flex-col justify-center">
                      <div className="space-y-3 mb-4 text-sm">
                        <div className="flex justify-between text-gray-400">
                          <span>Subtotal</span>
                          <span className="text-white">{formatCurrency(subtotal).replace('DOP', '$')}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>ITBIS (18%)</span>
                          <span className="text-white">{formatCurrency(itbis).replace('DOP', '$')}</span>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-gray-700 flex justify-between items-end">
                        <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total</span>
                        <span className="text-2xl font-black text-raynold-red">{formatCurrency(total).replace('DOP', '$')}</span>
                      </div>

                      {totalPaid > 0 && (
                        <div className="pt-4 border-t border-gray-700 mt-4 space-y-2">
                          <div className="flex justify-between text-green-400">
                            <span>Pagado</span>
                            <span>-{formatCurrency(totalPaid).replace('DOP', '$')}</span>
                          </div>
                          <div className="flex justify-between items-end pt-2">
                            <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Balance</span>
                            <span className="text-xl font-black text-white">{formatCurrency(balanceDue).replace('DOP', '$')}</span>
                          </div>
                        </div>
                      )}

                      {currentInvoice.paymentStatus === 'PAGADA' && (
                        <div className="mt-6 bg-green-500/20 text-green-400 text-center py-2 rounded-lg font-bold uppercase tracking-widest border border-green-500/30">
                          Factura Pagada
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentInvoice.templateId === 'minimal' && (
                <div className="p-10 md:p-12 h-full flex flex-col bg-white">
                  {/* Header */}
                  <div className="flex justify-between items-end mb-16">
                    {companySettings.logoUrl ? (
                      <img src={companySettings.logoUrl} alt={companySettings.name} className="h-16 object-contain" />
                    ) : (
                      <div className="text-5xl font-black tracking-tighter text-gray-900">
                        {companySettings.name}
                        <span className="text-raynold-red">.</span>
                      </div>
                    )}
                    <div className="text-right">
                      <h1 className="text-2xl font-bold text-gray-400 tracking-widest uppercase">
                        {currentInvoice.type === 'FACTURA' ? 'FACTURA' : 'COTIZACIÓN'}
                      </h1>
                    </div>
                  </div>

                  <div className="flex justify-between mb-16 text-sm">
                    <div className="w-1/3 space-y-1 text-gray-500">
                      <p className="font-bold text-gray-900 mb-2">De</p>
                      <p>{companySettings.subtitle}</p>
                      <p>RNC: {companySettings.rnc}</p>
                      <p>{companySettings.address1}</p>
                      <p>{companySettings.address2}</p>
                      <p>{companySettings.phone}</p>
                    </div>

                    <div className="w-1/3 space-y-1 text-gray-500">
                      <p className="font-bold text-gray-900 mb-2">Para</p>
                      {currentInvoice.clientName && <p>{currentInvoice.clientName}</p>}
                      {currentInvoice.companyName && <p className="font-medium text-gray-700">{currentInvoice.companyName}</p>}
                      {currentInvoice.clientRnc && <p>RNC: {currentInvoice.clientRnc}</p>}
                      {currentInvoice.clientPhone && <p>{currentInvoice.clientPhone}</p>}
                    </div>

                    <div className="w-1/4 space-y-1 text-right text-gray-500">
                      <p className="font-bold text-gray-900 mb-2">Detalles</p>
                      <p>Nº: <span className="font-medium text-gray-900">{currentInvoice.number}</span></p>
                      <p>Fecha: <span className="font-medium text-gray-900">{currentInvoice.date}</span></p>
                      {currentInvoice.type === 'FACTURA' && currentInvoice.ncf && (
                        <p>NCF: <span className="font-mono text-gray-900">{currentInvoice.ncf}</span></p>
                      )}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="mb-12 flex-grow">
                    <table className="w-full text-sm print:table">
                      <thead>
                        <tr className="border-b-2 border-gray-900 text-gray-900">
                          <th className="py-3 text-left font-bold">Descripción</th>
                          <th className="py-3 text-center font-bold w-24">Cant.</th>
                          <th className="py-3 text-right font-bold w-32">Precio</th>
                          <th className="py-3 text-right font-bold w-32">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {currentInvoice.items.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => openItemModal(item)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors group relative print:break-inside-avoid"
                          >
                            <td className="py-4">
                              <div className="font-medium text-gray-900">{item.description || '-'}</div>
                              {item.reference && <div className="text-xs text-gray-400 font-mono mt-1">Ref: {item.reference}</div>}
                            </td>
                            <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                            <td className="py-4 text-right text-gray-600">{formatCurrency(item.unitPrice).replace('DOP', '$')}</td>
                            <td className="py-4 text-right font-medium text-gray-900">
                              {formatCurrency(item.quantity * item.unitPrice).replace('DOP', '$')}
                            </td>
                            <td className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 opacity-0 group-hover:opacity-100 print:hidden">
                              <button onClick={(e) => removeItem(item.id, e)} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-4 print:hidden flex justify-start">
                      <button
                        onClick={() => openItemModal()}
                        className="text-gray-400 hover:text-gray-900 flex items-center gap-2 font-medium transition-colors text-sm"
                      >
                        <Plus size={16} /> Añadir Línea
                      </button>
                    </div>
                  </div>

                  {/* Footer & Totals */}
                  <div className="mt-8 print:mt-4 flex justify-end mb-12 print:break-inside-avoid">
                    <div className="w-1/2">
                      <div className="space-y-2 text-sm border-t border-gray-200 pt-4">
                        <div className="flex justify-between text-gray-500">
                          <span>Subtotal</span>
                          <span className="text-gray-900">{formatCurrency(subtotal).replace('DOP', '$')}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>ITBIS (18%)</span>
                          <span className="text-gray-900">{formatCurrency(itbis).replace('DOP', '$')}</span>
                        </div>
                        <div className="flex justify-between items-end pt-4 border-t border-gray-900 mt-4">
                          <span className="font-bold text-gray-900">Total a Pagar</span>
                          <span className="text-2xl font-black text-gray-900">{formatCurrency(total).replace('DOP', '$')}</span>
                        </div>

                        {totalPaid > 0 && (
                          <>
                            <div className="flex justify-between text-gray-500 pt-2">
                              <span>Total Pagado</span>
                              <span className="text-gray-900">-{formatCurrency(totalPaid).replace('DOP', '$')}</span>
                            </div>
                            <div className="flex justify-between items-end pt-2 border-t border-gray-200 mt-2">
                              <span className="font-bold text-gray-900">Balance Pendiente</span>
                              <span className="text-xl font-black text-gray-900">{formatCurrency(balanceDue).replace('DOP', '$')}</span>
                            </div>
                          </>
                        )}

                        {currentInvoice.paymentStatus === 'PAGADA' && (
                          <div className="mt-4 text-center py-1 border-y border-gray-900 font-bold tracking-widest uppercase text-gray-900">
                            PAGADO EN SU TOTALIDAD
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-8 text-xs text-gray-500 grid grid-cols-2 gap-8 print:break-inside-avoid">
                    {currentInvoice.notes && (
                      <div>
                        <p className="font-bold text-gray-900 mb-1">Notas</p>
                        <p className="whitespace-pre-wrap">{currentInvoice.notes}</p>
                      </div>
                    )}
                    {currentInvoice.paymentTerms && (
                      <div>
                        <p className="font-bold text-gray-900 mb-1">Términos</p>
                        <p className="whitespace-pre-wrap">{currentInvoice.paymentTerms}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Item Edit Modal */}
        {isItemModalOpen && editingItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-lg">Editar Línea</h3>
                <button onClick={() => setIsItemModalOpen(false)} className="text-gray-400 hover:text-black"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catálogo de Productos</label>
                    <select
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                    >
                      <option value="">-- Seleccionar producto --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.price})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catálogo de Servicios</label>
                    <select
                      onChange={(e) => handleServiceSelect(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                    >
                      <option value="">-- Seleccionar servicio --</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referencia (Opcional)</label>
                  <input
                    type="text"
                    value={editingItem.reference}
                    onChange={(e) => setEditingItem({ ...editingItem, reference: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red font-mono"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción Manual</label>
                  <input
                    type="text"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red uppercase"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad</label>
                    <input
                      type="number"
                      value={editingItem.quantity}
                      onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red text-center"
                    />
                  </div>
                  <div className="w-2/3">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Unitario ($)</label>
                    <input
                      type="number"
                      value={editingItem.unitPrice}
                      onChange={(e) => setEditingItem({ ...editingItem, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red text-right"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                <button onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancelar</button>
                <button onClick={saveItem} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors">Guardar Línea</button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <DollarSign size={20} className="text-green-600" />
                  Registrar Pago
                </h3>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-black"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto a Pagar (DOP)</label>
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-raynold-red text-xl font-bold"
                  />
                  <p className="text-xs text-gray-500 mt-1">Balance pendiente: {formatCurrency(balanceDue)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                    <input
                      type="date"
                      value={newPayment.date}
                      onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cuenta de Destino</label>
                    <select
                      value={newPayment.accountId}
                      onChange={(e) => setNewPayment({ ...newPayment, accountId: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                    >
                      <option value="">Seleccionar cuenta...</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referencia / Comprobante (Opcional)</label>
                  <input
                    type="text"
                    value={newPayment.reference}
                    onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                    placeholder="Nº de transacción, cheque, etc."
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancelar</button>
                <button onClick={handleAddPayment} className="px-4 py-2 bg-raynold-red text-white rounded-lg hover:bg-red-700 font-medium transition-colors">Registrar Pago</button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // List View
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.clientName && inv.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.companyName && inv.companyName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus || inv.paymentStatus === filterStatus;
    const matchesType = filterType === 'ALL' || inv.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-6 md:p-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-futuristic font-bold text-white mb-2">Facturación y Cotizaciones</h1>
          <p className="text-gray-400">Historial de documentos emitidos.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsCompanyModalOpen(true)}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg flex items-center gap-2 transition-colors"
          >
            <Settings size={18} />
            Empresa
          </button>
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2"
          >
            <Plus size={18} />
            Nueva Factura / Cotización
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4 bg-[#0A0A0A] p-4 rounded-xl border border-white/10 shadow-lg">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por N°, Cliente o Empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm outline-none focus:border-raynold-red transition-colors placeholder:text-gray-600"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-raynold-red transition-colors cursor-pointer"
          >
            <option value="ALL">Todo Tipo</option>
            <option value="FACTURA">Facturas</option>
            <option value="COTIZACION">Cotizaciones</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-raynold-red transition-colors cursor-pointer"
          >
            <option value="ALL">Todo Estado</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PARCIAL">Parcial</option>
            <option value="PAGADA">Pagada</option>
            <option value="BORRADOR">Borrador</option>
          </select>
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <th className="p-4 font-bold">Tipo</th>
                <th className="p-4 font-bold">N° / NCF</th>
                <th className="p-4 font-bold">Fecha</th>
                <th className="p-4 font-bold">Cliente / Empresa</th>
                <th className="p-4 font-bold">Estado</th>
                <th className="p-4 font-bold">Total</th>
                <th className="p-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                const applyTax = invoice.applyTax !== false;
                const total = subtotal + (applyTax ? subtotal * 0.18 : 0);

                return (
                  <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-1 text-xs rounded-full font-bold ${invoice.type === 'COTIZACION' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                          {invoice.type}
                        </span>
                        {invoice.status === 'BORRADOR' && (
                          <span className="px-2 py-1 text-[10px] rounded-full font-bold bg-gray-500/20 text-gray-400 uppercase">
                            Borrador
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-white">{invoice.number}</div>
                      {invoice.ncf && <div className="text-xs text-gray-500 font-mono">{invoice.ncf}</div>}
                    </td>
                    <td className="p-4 text-gray-400">{invoice.date}</td>
                    <td className="p-4 text-white font-medium">
                      {invoice.companyName || invoice.clientName || 'Sin nombre'}
                    </td>
                    <td className="p-4">
                      {invoice.status === 'BORRADOR' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">Borrador</span>
                      ) : (
                        <span className={`px-2 py-1 text-xs rounded-full font-bold ${invoice.paymentStatus === 'PAGADA' ? 'bg-green-500/20 text-green-400' :
                          invoice.paymentStatus === 'PARCIAL' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                          {invoice.paymentStatus || 'PENDIENTE'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-raynold-green font-mono">
                      {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(total)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDuplicate(invoice)}
                          className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 transition-colors"
                          title="Duplicar"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handlePrintFromList(invoice)}
                          className="p-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/40 transition-colors"
                          title="Descargar / Imprimir PDF"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors"
                          title="Editar / Ver"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No hay documentos creados. Haz clic en "Nueva Factura / Cotización" para empezar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Settings Modal */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Settings size={20} className="text-raynold-red" />
                Configuración de la Empresa
              </h3>
              <button onClick={() => setIsCompanyModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow space-y-4 text-gray-800">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logo de la Empresa</label>
                <div className="flex items-center gap-4">
                  {companySettings.logoUrl && (
                    <img src={companySettings.logoUrl} alt="Logo" className="h-16 object-contain border border-gray-200 rounded p-1 bg-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCompanySettings({ ...companySettings, logoUrl: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                  />
                  {companySettings.logoUrl && (
                    <button
                      onClick={() => setCompanySettings({ ...companySettings, logoUrl: '' })}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                  <input
                    type="text"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subtítulo</label>
                  <input
                    type="text"
                    value={companySettings.subtitle}
                    onChange={(e) => setCompanySettings({ ...companySettings, subtitle: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">RNC</label>
                <input
                  type="text"
                  value={companySettings.rnc}
                  onChange={(e) => setCompanySettings({ ...companySettings, rnc: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  value={companySettings.phone}
                  onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección Línea 1</label>
                <input
                  type="text"
                  value={companySettings.address1}
                  onChange={(e) => setCompanySettings({ ...companySettings, address1: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección Línea 2</label>
                <input
                  type="text"
                  value={companySettings.address2}
                  onChange={(e) => setCompanySettings({ ...companySettings, address2: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setIsCompanyModalOpen(false)} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors">Guardar y Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvoices;
