import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Printer, Save, Trash2, ArrowLeft, FileText, Copy, Edit2, Settings, List as ListIcon, X, Download, DollarSign, Loader2, Search, Percent, CheckCircle2, Eye, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Client } from './AdminClients';
import { ServiceDetail as Service } from '../data/services';
import { Account } from './AdminAccounts';
import { supabase } from '../lib/supabaseClient';

// ─── Toast Notification System ──────────────────────────────────────
interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const ToastContainer: React.FC<{ toasts: ToastItem[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => (
  <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`pointer-events-auto px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-md flex items-center gap-3 min-w-[280px] max-w-[420px] animate-slide-in-right ${
          t.type === 'success' ? 'bg-green-900/90 border-green-500/30 text-green-100' :
          t.type === 'error' ? 'bg-red-900/90 border-red-500/30 text-red-100' :
          t.type === 'warning' ? 'bg-yellow-900/90 border-yellow-500/30 text-yellow-100' :
          'bg-blue-900/90 border-blue-500/30 text-blue-100'
        }`}
        onClick={() => onRemove(t.id)}
        style={{ cursor: 'pointer' }}
      >
        {t.type === 'success' && <CheckCircle2 size={18} className="text-green-400 shrink-0" />}
        {t.type === 'error' && <AlertTriangle size={18} className="text-red-400 shrink-0" />}
        {t.type === 'warning' && <AlertTriangle size={18} className="text-yellow-400 shrink-0" />}
        {t.type === 'info' && <FileText size={18} className="text-blue-400 shrink-0" />}
        <span className="text-sm font-medium">{t.message}</span>
      </div>
    ))}
  </div>
);

// ─── Confirm Dialog ─────────────────────────────────────────────────
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-xl"><AlertTriangle size={20} className="text-red-400" /></div>
            <h3 className="font-bold text-white text-lg">{title}</h3>
          </div>
          <p className="text-gray-400 text-sm">{message}</p>
        </div>
        <div className="flex border-t border-white/10">
          <button onClick={onCancel} className="flex-1 py-3 text-gray-400 hover:bg-white/5 font-bold text-sm transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-3 text-red-400 hover:bg-red-500/10 font-bold text-sm transition-colors border-l border-white/10">Eliminar</button>
        </div>
      </div>
    </div>
  );
};

interface InvoiceItem {
  id: string;
  reference: string;
  description: string;
  quantity: number;
  unitPrice: number;
  price: number;
  discount?: number;
  discountType?: 'percent' | 'fixed';
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
  globalDiscount?: number;
  globalDiscountType?: 'percent' | 'fixed';
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
  logoUrl: 'https://ymiqmbzsmeqexgztquwj.supabase.co/storage/v1/object/public/raynold-media/brand/logo-negro-r.svg'
};

// UUID generator for Supabase compatibility
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
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
  applyTax: true,
  globalDiscount: 0,
  globalDiscountType: 'percent'
};

const AdminInvoices: React.FC<{ moduleType?: 'ALL' | 'FACTURA' | 'COTIZACION' }> = ({ moduleType = 'ALL' }) => {
  const { products } = useShop();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [view, setView] = useState<'list' | 'editor' | 'saved' | 'preview'>('list');
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Toast system
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Last saved invoice for success screen
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [savedStatus, setSavedStatus] = useState<string>('');

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
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProductData, setNewProductData] = useState({ title: '', price: '', reference: '' });
  const [savingProduct, setSavingProduct] = useState(false);

  // Searchable dropdown states
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  // Load data
  useEffect(() => {
    // Load invoices from Supabase first, fall back to localStorage
    supabase.from('invoices').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data && data.length > 0) {
        setInvoices(data.map((inv: any) => ({
          id: inv.id,
          type: inv.type || 'COTIZACION',
          paymentType: inv.payment_type || inv.paymentType || 'CONTADO',
          status: inv.status || 'BORRADOR',
          ncfType: inv.ncf_type || inv.ncfType || '01',
          ncf: inv.ncf || '',
          date: inv.date || '',
          number: inv.number || inv.invoice_number || '',
          clientId: inv.client_id || inv.clientId || '',
          clientName: inv.client_name || inv.clientName || '',
          companyName: inv.company_name || inv.companyName || '',
          clientRnc: inv.client_rnc || inv.clientRnc || '',
          clientPhone: inv.client_phone || inv.clientPhone || '',
          sellerId: inv.seller_id || inv.sellerId || '',
          sellerName: inv.seller_name || inv.sellerName || '',
          items: Array.isArray(inv.items) ? inv.items as InvoiceItem[] : [],
          notes: inv.notes || '',
          paymentTerms: inv.payment_terms || inv.paymentTerms || '',
          templateId: inv.template_id || inv.templateId || 'classic',
          payments: Array.isArray(inv.payments) ? inv.payments as Payment[] : [],
          paymentStatus: inv.payment_status || inv.paymentStatus || 'PENDIENTE',
          applyTax: inv.apply_tax ?? inv.applyTax ?? true,
          globalDiscount: inv.global_discount ?? inv.globalDiscount ?? 0,
          globalDiscountType: inv.global_discount_type || inv.globalDiscountType || 'percent',
        } as Invoice)));
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
      if (data && data.length > 0) setServices(data as Service[]);
      else {
        const savedServices = localStorage.getItem('raynold_services');
        if (savedServices) setServices(JSON.parse(savedServices));
      }
    });

    const savedCompanySettings = localStorage.getItem('raynold_company_settings');
    if (savedCompanySettings) {
      const parsed = JSON.parse(savedCompanySettings);
      // Always use the official logo for PDFs
      setCompanySettings({ ...parsed, logoUrl: 'https://ymiqmbzsmeqexgztquwj.supabase.co/storage/v1/object/public/raynold-media/brand/logo-negro-r.svg' });
    }

    // Load accounts from Supabase
    supabase.from('accounts').select('*').order('name').then(({ data }) => {
      if (data && data.length > 0) {
        setAccounts(data.map(a => ({ id: a.id, name: a.name, type: a.type as Account['type'], bankName: a.bank_name || '', accountNumber: a.account_number || '', accountSubType: a.account_sub_type || '', balance: Number(a.balance), isDefaultReceiving: a.is_default_receiving, isDefaultPaying: a.is_default_paying } as Account)));
        const defaultAcc = data.find(a => a.is_default_receiving) || data[0];
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

  // Warn before closing/reloading page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && view === 'editor') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, view]);

  // Close searchable dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.searchable-dropdown')) {
        setShowClientDropdown(false);
        setShowProductDropdown(false);
        setShowServiceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleCreateNew = (type?: 'COTIZACION' | 'FACTURA') => {
    const docType = type || (moduleType === 'FACTURA' ? 'FACTURA' : moduleType === 'COTIZACION' ? 'COTIZACION' : 'COTIZACION');
    setCurrentInvoice({
      ...defaultInvoice,
      id: generateUUID(),
      number: generateNextNumber(),
      type: docType,
      ncf: docType === 'FACTURA' ? generateNCF('02') : ''
    });
    setView('editor');
    setHasUnsavedChanges(false);
  };

  // Normalize invoice data from any source (Supabase snake_case or localStorage camelCase)
  const normalizeInvoice = (inv: any): Invoice => ({
    id: inv.id || '',
    type: inv.type || 'COTIZACION',
    paymentType: inv.payment_type || inv.paymentType || 'CONTADO',
    status: inv.status || 'BORRADOR',
    ncfType: inv.ncf_type || inv.ncfType || '01',
    ncf: inv.ncf || '',
    date: inv.date || '',
    number: inv.number || inv.invoice_number || '',
    clientId: inv.client_id || inv.clientId || '',
    clientName: inv.client_name || inv.clientName || '',
    companyName: inv.company_name || inv.companyName || '',
    clientRnc: inv.client_rnc || inv.clientRnc || '',
    clientPhone: inv.client_phone || inv.clientPhone || '',
    sellerId: inv.seller_id || inv.sellerId || '',
    sellerName: inv.seller_name || inv.sellerName || '',
    items: Array.isArray(inv.items) ? inv.items : [],
    notes: inv.notes || '',
    paymentTerms: inv.payment_terms || inv.paymentTerms || '',
    templateId: inv.template_id || inv.templateId || 'classic',
    payments: Array.isArray(inv.payments) ? inv.payments : [],
    paymentStatus: inv.payment_status || inv.paymentStatus || 'PENDIENTE',
    applyTax: inv.apply_tax ?? inv.applyTax ?? true,
    globalDiscount: inv.global_discount ?? inv.globalDiscount ?? 0,
    globalDiscountType: inv.global_discount_type || inv.globalDiscountType || 'percent',
  });

  const handleEdit = (invoice: Invoice) => {
    setCurrentInvoice(normalizeInvoice(invoice));
    setView('editor');
    setHasUnsavedChanges(false);
  };

  const handleView = (invoice: Invoice) => {
    setCurrentInvoice(normalizeInvoice(invoice));
    setView('preview');
  };

  const handleDuplicate = (invoice: Invoice) => {
    const normalized = normalizeInvoice(invoice);
    const duplicated: Invoice = {
      ...normalized,
      id: generateUUID(),
      number: generateNextNumber(),
      status: 'BORRADOR',
      date: new Date().toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      ncf: normalized.type === 'FACTURA' ? generateNCF(normalized.ncfType) : ''
    };
    setInvoices([...invoices, duplicated]);
    setCurrentInvoice(duplicated);
    setView('editor');
    setHasUnsavedChanges(true);
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar documento',
      message: 'Esta accion es irreversible. El documento sera eliminado permanentemente.',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        const { error } = await supabase.from('invoices').delete().eq('id', id);
        if (error) {
          console.error('Error deleting from supabase:', error);
          addToast('Error al eliminar el documento', 'error');
          return;
        }
        setInvoices(prev => prev.filter(i => i.id !== id));
        addToast('Documento eliminado correctamente', 'success');
      }
    });
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
      return;
    }
    setView('list');
    setCurrentInvoice(null);
  };

  const handleExitWithoutSaving = () => {
    setShowExitDialog(false);
    setHasUnsavedChanges(false);
    setView('list');
    setCurrentInvoice(null);
  };

  const handleSaveAndExit = async () => {
    setShowExitDialog(false);
    await handleSave('BORRADOR');
  };

  const handleSave = async (status: 'BORRADOR' | 'EMITIDA' = 'EMITIDA') => {
    if (!currentInvoice) return;
    const invoiceToSave = { ...currentInvoice, status };

    // Fix: ensure ID is a valid UUID (migrate old short IDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!invoiceToSave.id || !uuidRegex.test(invoiceToSave.id)) {
      invoiceToSave.id = generateUUID();
    }

    // Auto-generate NCF for invoices when emitting
    if (status === 'EMITIDA' && invoiceToSave.type === 'FACTURA' && !invoiceToSave.ncf) {
      invoiceToSave.ncf = generateNCF(invoiceToSave.ncfType);
    }

    // Ensure FK fields are null, not empty strings (Supabase uuid columns)
    const clientId = invoiceToSave.clientId && uuidRegex.test(invoiceToSave.clientId) ? invoiceToSave.clientId : null;
    const sellerId = invoiceToSave.sellerId && uuidRegex.test(invoiceToSave.sellerId) ? invoiceToSave.sellerId : null;

    // Persist to Supabase FIRST
    const { error } = await supabase.from('invoices').upsert({
      id: invoiceToSave.id,
      invoice_number: invoiceToSave.number || '',
      type: invoiceToSave.type || 'COTIZACION',
      payment_type: invoiceToSave.paymentType || 'CONTADO',
      status: invoiceToSave.status || 'BORRADOR',
      ncf_type: invoiceToSave.ncfType || '',
      ncf: invoiceToSave.ncf || '',
      date: invoiceToSave.date || '',
      number: invoiceToSave.number || '',
      client_id: clientId,
      client_name: invoiceToSave.clientName || '',
      company_name: invoiceToSave.companyName || '',
      client_rnc: invoiceToSave.clientRnc || '',
      client_phone: invoiceToSave.clientPhone || '',
      seller_id: sellerId,
      seller_name: invoiceToSave.sellerName || '',
      items: invoiceToSave.items || [],
      notes: invoiceToSave.notes || '',
      payment_terms: invoiceToSave.paymentTerms || '',
      template_id: invoiceToSave.templateId || 'classic',
      payments: invoiceToSave.payments || [],
      payment_status: invoiceToSave.paymentStatus || 'PENDIENTE',
      apply_tax: invoiceToSave.applyTax ?? true,
      global_discount: invoiceToSave.globalDiscount || 0,
      global_discount_type: invoiceToSave.globalDiscountType || 'percent',
    });

    if (error) {
      console.error('Supabase save error:', error.message);
      addToast('Error al guardar: ' + error.message, 'error');
      return;
    }

    // Update local state AFTER successful save
    const exists = invoices.find(i => i.id === currentInvoice.id);
    if (exists) {
      setInvoices(prev => prev.map(i => i.id === currentInvoice.id ? invoiceToSave : i));
    } else {
      setInvoices(prev => [...prev, invoiceToSave]);
    }
    setCurrentInvoice(invoiceToSave);

    // Show success screen
    setSavedInvoice(invoiceToSave);
    setSavedStatus(status);
    setView('saved');
    setHasUnsavedChanges(false);
    addToast(`${invoiceToSave.type === 'FACTURA' ? 'Factura' : 'Cotizacion'} guardada correctamente`, 'success');
  };

  const handleConvertToInvoice = (quotation: Invoice) => {
    const normalized = normalizeInvoice(quotation);
    const converted: Invoice = {
      ...normalized,
      id: generateUUID(),
      type: 'FACTURA',
      number: generateNextNumber(),
      ncf: generateNCF(normalized.ncfType || '02'),
      status: 'BORRADOR',
      date: new Date().toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    };
    setCurrentInvoice(converted);
    setView('editor');
    addToast('Cotizacion convertida a factura. Revisa y guarda.', 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintFromList = (invoice: Invoice) => {
    setCurrentInvoice(normalizeInvoice(invoice));
    setView('editor');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  const updateCurrentInvoice = (field: keyof Invoice, value: Invoice[keyof Invoice]) => {
    if (!currentInvoice) return;

    let updates: Partial<Invoice> = { [field]: value };

    // Auto-generate NCF if type changes to FACTURA
    if (field === 'type' && value === 'FACTURA' && !currentInvoice.ncf) {
      updates.ncf = generateNCF(currentInvoice.ncfType);
    }

    // Auto-generate NCF if ncfType changes
    if (field === 'ncfType' && currentInvoice.type === 'FACTURA') {
      updates.ncf = generateNCF(String(value));
    }

    setCurrentInvoice({ ...currentInvoice, ...updates });
    setHasUnsavedChanges(true);
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
    setShowNewProductForm(false);
    setNewProductData({ title: '', price: '', reference: '' });
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
    setHasUnsavedChanges(true);
    setIsItemModalOpen(false);
  };

  const removeItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentInvoice) {
      setCurrentInvoice({
        ...currentInvoice,
        items: currentInvoice.items.filter(item => item.id !== id)
      });
      setHasUnsavedChanges(true);
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
        unitPrice: numericPrice,
        discount: product.discount || 0,
        discountType: product.discountType || 'percent'
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

  const handleCreateAndUseProduct = async () => {
    if (!newProductData.title || !editingItem) return;
    setSavingProduct(true);
    const price = parseFloat(newProductData.price) || 0;
    const { data, error } = await supabase.from('products').insert([{
      title: newProductData.title,
      price: `$${price.toFixed(2)}`,
      reference: newProductData.reference || undefined,
      is_active: true
    }]).select().single();
    if (!error && data) {
      setEditingItem({
        ...editingItem,
        reference: data.reference || data.id.substring(0, 6),
        description: data.title,
        unitPrice: price
      });
      setShowNewProductForm(false);
      setNewProductData({ title: '', price: '', reference: '' });
    } else {
      addToast('Error al crear producto: ' + error?.message, 'error');
    }
    setSavingProduct(false);
  };

  // Helper: Calculate item line total with discount
  const getItemTotal = (item: InvoiceItem) => {
    const raw = item.quantity * item.unitPrice;
    if (!item.discount || item.discount <= 0) return raw;
    if (item.discountType === 'fixed') return Math.max(0, raw - item.discount);
    return raw * (1 - (item.discount / 100));
  };

  // Calculations
  const rawSubtotal = currentInvoice?.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
  const itemDiscountsTotal = currentInvoice?.items.reduce((sum, item) => sum + ((item.quantity * item.unitPrice) - getItemTotal(item)), 0) || 0;
  const subtotalAfterItemDiscounts = rawSubtotal - itemDiscountsTotal;

  const gDiscount = currentInvoice?.globalDiscount || 0;
  const gDiscountType = currentInvoice?.globalDiscountType || 'percent';
  const globalDiscountAmount = gDiscount > 0
    ? (gDiscountType === 'fixed' ? gDiscount : subtotalAfterItemDiscounts * (gDiscount / 100))
    : 0;
  const subtotal = Math.max(0, subtotalAfterItemDiscounts - globalDiscountAmount);

  const applyTax = currentInvoice?.applyTax !== false;
  const itbis = applyTax ? subtotal * 0.18 : 0;
  const total = subtotal + itbis;
  const totalPaid = currentInvoice?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDue = total - totalPaid;
  const totalDiscounts = itemDiscountsTotal + globalDiscountAmount;

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

  // Success screen after save
  if (view === 'saved' && savedInvoice) {
    const docLabel = savedInvoice.type === 'FACTURA' ? 'Factura' : 'Cotizacion';
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-100 text-black p-8">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center border-b border-gray-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">{docLabel} Guardada</h2>
            <p className="text-gray-500 mt-2 text-sm">
              <span className="font-bold">N. {savedInvoice.number}</span> - {savedStatus === 'EMITIDA' ? 'Emitida' : 'Borrador'}
            </p>
            {savedInvoice.clientName && (
              <p className="text-gray-400 text-xs mt-1">Cliente: {savedInvoice.clientName}</p>
            )}
          </div>

          <div className="p-6 space-y-3">
            <button
              onClick={() => handleView(savedInvoice)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            >
              <Eye size={18} className="text-blue-500" />
              <div>
                <p className="font-bold text-gray-900 text-sm">Ver Documento</p>
                <p className="text-xs text-gray-400">Abrir en el editor para revisar</p>
              </div>
            </button>

            <button
              onClick={() => {
                setCurrentInvoice(savedInvoice);
                setView('editor');
                setTimeout(() => window.print(), 300);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            >
              <Download size={18} className="text-purple-500" />
              <div>
                <p className="font-bold text-gray-900 text-sm">Descargar / Imprimir PDF</p>
                <p className="text-xs text-gray-400">Generar PDF o enviar a impresora</p>
              </div>
            </button>

            <button
              onClick={() => {
                handleCreateNew(savedInvoice.type);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            >
              <Plus size={18} className="text-green-500" />
              <div>
                <p className="font-bold text-gray-900 text-sm">Crear Nuevo {docLabel}</p>
                <p className="text-xs text-gray-400">Empezar un nuevo documento</p>
              </div>
            </button>

            {savedInvoice.type === 'COTIZACION' && (
              <button
                onClick={() => handleConvertToInvoice(savedInvoice)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
              >
                <ArrowRight size={18} className="text-blue-600" />
                <div>
                  <p className="font-bold text-blue-700 text-sm">Convertir en Factura</p>
                  <p className="text-xs text-blue-400">Crear una factura basada en esta cotizacion</p>
                </div>
              </button>
            )}
            <button
              onClick={() => {
                setView('list');
                setSavedInvoice(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors text-left"
            >
              <ArrowLeft size={18} />
              <div>
                <p className="font-bold text-sm">Volver a la Lista</p>
                <p className="text-xs text-gray-400">Ver todos los documentos</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'preview' && currentInvoice) {
    const previewDocLabel = currentInvoice.type === 'FACTURA' ? 'Factura' : 'Cotizacion';
    const previewSubtotal = currentInvoice.items.reduce((sum: number, item: InvoiceItem) => sum + item.quantity * item.price, 0);
    const previewItemDiscounts = currentInvoice.items.reduce((sum: number, item: InvoiceItem) => {
      const lineTotal = item.quantity * item.price;
      return sum + (item.discountType === 'fixed' ? (item.discount || 0) : lineTotal * ((item.discount || 0) / 100));
    }, 0);
    const previewAfterItemDiscounts = previewSubtotal - previewItemDiscounts;
    const previewGlobalDiscountAmt = (currentInvoice.globalDiscountType === 'fixed')
      ? (currentInvoice.globalDiscount || 0)
      : previewAfterItemDiscounts * ((currentInvoice.globalDiscount || 0) / 100);
    const previewTaxable = previewAfterItemDiscounts - previewGlobalDiscountAmt;
    const previewTax = currentInvoice.applyTax !== false ? previewTaxable * 0.18 : 0;
    const previewTotal = previewTaxable + previewTax;
    const previewTotalPaid = (currentInvoice.payments || []).reduce((s: number, p: Payment) => s + p.amount, 0);
    const previewBalanceDue = previewTotal - previewTotalPaid;

    return (
      <div className="flex flex-col h-full bg-gray-100 text-black overflow-hidden print:bg-white print:h-auto print:overflow-visible">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page { margin: 0.5in; size: letter; }
            body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-content { width: 100% !important; max-width: none !important; margin: 0 !important; box-shadow: none !important; }
            * { word-break: break-word; overflow-wrap: break-word; }
            .invoice-container { display: block !important; height: auto !important; overflow: visible !important; }
          }
        ` }} />

        {/* Preview Top Bar */}
        <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm print:hidden shrink-0 z-10">
          <button onClick={() => { setView('list'); setCurrentInvoice(null); }} className="flex items-center gap-2 text-gray-600 hover:text-black font-medium">
            <ArrowLeft size={20} /> Volver
          </button>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-gray-500 mr-2">{previewDocLabel} #{currentInvoice.number}</span>
            <button
              onClick={() => handleEdit(currentInvoice)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
              title="Editar"
            >
              <Edit2 size={15} /> Editar
            </button>
            <button
              onClick={() => {
                handleDuplicate(currentInvoice);
                addToast('Documento duplicado. Editando la copia.', 'success');
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm"
              title="Duplicar"
            >
              <Copy size={15} /> Duplicar
            </button>
            {currentInvoice.type === 'COTIZACION' && (
              <button
                onClick={() => handleConvertToInvoice(currentInvoice)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm"
                title="Convertir en Factura"
              >
                <ArrowRight size={15} /> Convertir en Factura
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium text-sm"
              title="Imprimir / PDF"
            >
              <Printer size={15} /> PDF
            </button>
            <button
              onClick={() => {
                handleDelete(currentInvoice.id);
                setView('list');
                setCurrentInvoice(null);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
              title="Eliminar"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Document Preview */}
        <div className="flex-1 overflow-y-auto bg-gray-200 p-8 print:p-0 print:bg-white flex justify-center invoice-container">
          <div className="w-[8.5in] min-h-[11in] bg-white shadow-2xl print:shadow-none relative print-content">
            {currentInvoice.templateId === 'classic' && (
              <div className="p-10 md:p-12 h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div className="w-64">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex flex-col">
                        {companySettings.logoUrl ? (
                          <img src={companySettings.logoUrl} alt="Logo" className="h-20 object-contain" />
                        ) : (
                          <div className="text-2xl font-black text-gray-900">{companySettings.name}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5 mt-2">
                      <p className="font-semibold text-gray-700">{companySettings.name}</p>
                      {companySettings.rnc && <p>RNC: {companySettings.rnc}</p>}
                      {companySettings.address && <p>{companySettings.address}</p>}
                      {companySettings.phone && <p>Tel: {companySettings.phone}</p>}
                      {companySettings.email && <p>{companySettings.email}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-3xl font-black text-gray-900 mb-1">{currentInvoice.type === 'FACTURA' ? 'FACTURA' : 'COTIZACIÓN'}</h1>
                    <p className="text-lg font-bold text-gray-700">N. {currentInvoice.number}</p>
                    <p className="text-sm text-gray-500 mt-1">Fecha: {currentInvoice.date}</p>
                    {currentInvoice.ncf && <p className="text-xs font-mono text-gray-400 mt-1">NCF: {currentInvoice.ncf}</p>}
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${currentInvoice.status === 'EMITIDA' ? 'bg-green-100 text-green-700' : currentInvoice.status === 'BORRADOR' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {currentInvoice.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">{currentInvoice.type === 'FACTURA' ? 'Facturar a' : 'Cotizar a'}</p>
                  <p className="font-bold text-gray-900">{currentInvoice.companyName || currentInvoice.clientName || 'Sin cliente'}</p>
                  {currentInvoice.companyName && currentInvoice.clientName && <p className="text-sm text-gray-600">{currentInvoice.clientName}</p>}
                  {currentInvoice.clientRnc && <p className="text-sm text-gray-500">RNC: {currentInvoice.clientRnc}</p>}
                  {currentInvoice.clientPhone && <p className="text-sm text-gray-500">Tel: {currentInvoice.clientPhone}</p>}
                </div>

                {/* Items Table */}
                <table className="w-full mb-6 text-sm">
                  <thead>
                    <tr className="bg-gray-900 text-white text-xs uppercase">
                      <th className="py-2 px-3 text-left font-bold">Descripción</th>
                      <th className="py-2 px-3 text-center font-bold">Cant.</th>
                      <th className="py-2 px-3 text-right font-bold">Precio</th>
                      <th className="py-2 px-3 text-right font-bold">Desc.</th>
                      <th className="py-2 px-3 text-right font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInvoice.items.map((item: InvoiceItem, idx: number) => {
                      const lineTotal = item.quantity * item.price;
                      const itemDisc = item.discountType === 'fixed' ? (item.discount || 0) : lineTotal * ((item.discount || 0) / 100);
                      return (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-2 px-3 text-gray-900">{item.description}</td>
                          <td className="py-2 px-3 text-center text-gray-600">{item.quantity}</td>
                          <td className="py-2 px-3 text-right text-gray-600">{formatCurrency(item.price)}</td>
                          <td className="py-2 px-3 text-right text-red-500">{itemDisc > 0 ? `-${formatCurrency(itemDisc)}` : '-'}</td>
                          <td className="py-2 px-3 text-right font-bold text-gray-900">{formatCurrency(lineTotal - itemDisc)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mt-auto">
                  <div className="w-72 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span className="font-medium">{formatCurrency(previewSubtotal)}</span></div>
                    {previewItemDiscounts > 0 && <div className="flex justify-between"><span className="text-gray-500">Desc. Items:</span><span className="text-red-500">-{formatCurrency(previewItemDiscounts)}</span></div>}
                    {previewGlobalDiscountAmt > 0 && <div className="flex justify-between"><span className="text-gray-500">Desc. Global:</span><span className="text-red-500">-{formatCurrency(previewGlobalDiscountAmt)}</span></div>}
                    {previewTax > 0 && <div className="flex justify-between"><span className="text-gray-500">ITBIS (18%):</span><span>{formatCurrency(previewTax)}</span></div>}
                    <div className="flex justify-between border-t-2 border-gray-900 pt-2 mt-2"><span className="font-black text-lg">TOTAL:</span><span className="font-black text-lg">{formatCurrency(previewTotal)}</span></div>
                    {previewTotalPaid > 0 && (
                      <>
                        <div className="flex justify-between text-green-600"><span>Pagado:</span><span>{formatCurrency(previewTotalPaid)}</span></div>
                        <div className="flex justify-between font-bold"><span>Balance:</span><span className={previewBalanceDue > 0 ? 'text-red-600' : 'text-green-600'}>{formatCurrency(previewBalanceDue)}</span></div>
                      </>
                    )}
                  </div>
                </div>

                {/* Notes & Terms */}
                <div className="border-t border-gray-200 pt-8 text-xs text-gray-500 grid grid-cols-2 gap-8 mt-8">
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

            {currentInvoice.templateId === 'minimal' && (
              <div className="p-10 md:p-12 h-full flex flex-col">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-black">{currentInvoice.type === 'FACTURA' ? 'FACTURA' : 'COTIZACIÓN'}</h1>
                  <p className="text-gray-500">{currentInvoice.number} • {currentInvoice.date}</p>
                </div>
                <div className="mb-6">
                  <p className="font-bold">{currentInvoice.companyName || currentInvoice.clientName || 'Sin cliente'}</p>
                  {currentInvoice.clientRnc && <p className="text-sm text-gray-500">RNC: {currentInvoice.clientRnc}</p>}
                </div>
                <table className="w-full mb-6 text-sm">
                  <thead><tr className="border-b-2 border-black text-xs uppercase"><th className="py-2 text-left">Descripción</th><th className="py-2 text-center">Cant.</th><th className="py-2 text-right">Precio</th><th className="py-2 text-right">Total</th></tr></thead>
                  <tbody>
                    {currentInvoice.items.map((item: InvoiceItem) => (
                      <tr key={item.id} className="border-b border-gray-200"><td className="py-2">{item.description}</td><td className="py-2 text-center">{item.quantity}</td><td className="py-2 text-right">{formatCurrency(item.price)}</td><td className="py-2 text-right font-bold">{formatCurrency(item.quantity * item.price)}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end"><div className="text-right"><p className="text-2xl font-black">{formatCurrency(previewTotal)}</p></div></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'editor' && currentInvoice) {
    return (
      <div className="flex flex-col h-full bg-gray-100 text-black overflow-hidden print:bg-white print:h-auto print:overflow-visible">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
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

        {/* Exit Confirmation Dialog */}
        {showExitDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={28} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Cambios sin guardar</h3>
                <p className="text-sm text-gray-500">Tienes cambios sin guardar en este documento. Que deseas hacer?</p>
              </div>
              <div className="p-4 space-y-2 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={handleSaveAndExit}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-bold text-sm"
                >
                  <Save size={16} /> Guardar como Borrador y Salir
                </button>
                <button
                  onClick={handleExitWithoutSaving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-bold text-sm"
                >
                  <Trash2 size={16} /> Salir sin Guardar
                </button>
                <button
                  onClick={() => setShowExitDialog(false)}
                  className="w-full px-4 py-3 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm text-center"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Bar */}
        <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm print:hidden shrink-0 z-10">
          <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-black font-medium">
            <ArrowLeft size={20} /> Volver
          </button>
          <div className="flex gap-2">
            {currentInvoice && (
              <button
                onClick={() => {
                  handleDuplicate(currentInvoice);
                  addToast('Documento duplicado. Editando la copia.', 'success');
                  setHasUnsavedChanges(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-medium text-sm"
              >
                <Copy size={16} /> Duplicar
              </button>
            )}
            <button onClick={() => handleSave('BORRADOR')} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
              <Save size={16} /> Guardar Borrador
            </button>
            {currentInvoice?.type === 'FACTURA' ? (
              <button onClick={() => handleSave('EMITIDA')} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-bold">
                <Save size={16} /> Emitir Factura
              </button>
            ) : (
              <button onClick={() => handleSave('EMITIDA')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold">
                <Save size={16} /> Guardar Cotizacion
              </button>
            )}
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-raynold-red text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
              <Printer size={16} /> PDF
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
                <div className="w-full border border-gray-200 rounded-lg p-2 bg-gray-50 text-gray-700 font-medium">
                  {currentInvoice.type === 'FACTURA' ? 'Factura' : 'Cotizacion'}
                </div>
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

              <div className="pt-3 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <Percent size={12} /> Descuento Global
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentInvoice.globalDiscount || ''}
                    onChange={(e) => updateCurrentInvoice('globalDiscount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="flex-1 border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red text-sm"
                  />
                  <select
                    value={currentInvoice.globalDiscountType || 'percent'}
                    onChange={(e) => updateCurrentInvoice('globalDiscountType', e.target.value)}
                    className="w-20 border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-raynold-red font-bold"
                  >
                    <option value="percent">%</option>
                    <option value="fixed">$</option>
                  </select>
                </div>
                {globalDiscountAmount > 0 && (
                  <p className="text-xs text-red-500 font-bold mt-1">-{formatCurrency(globalDiscountAmount)}</p>
                )}
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
                <div className="relative searchable-dropdown">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-raynold-red mb-1">
                    <Search size={14} className="ml-2 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Buscar cliente por nombre, empresa o RNC..."
                      value={clientSearch ?? ''}
                      onChange={(e) => setClientSearch(e.target.value)}
                      onFocus={() => setShowClientDropdown(true)}
                      className="w-full p-2 outline-none text-sm"
                    />
                    {currentInvoice.clientId && (
                      <button onClick={() => { handleClientSelect(''); setClientSearch(''); }} className="mr-2 text-gray-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {showClientDropdown && (
                    <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      <button
                        onClick={() => { handleClientSelect(''); setClientSearch(''); setShowClientDropdown(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 border-b border-gray-100"
                      >
                        -- Sin cliente --
                      </button>
                      {clients
                        .filter(c => {
                          const q = (clientSearch || '').toLowerCase();
                          if (!q) return true;
                          return (c.name || '').toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q) || (c.rnc || '').toLowerCase().includes(q);
                        })
                        .map(c => (
                          <button
                            key={c.id}
                            onClick={() => { handleClientSelect(c.id); setClientSearch(c.company || c.name); setShowClientDropdown(false); }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${currentInvoice.clientId === c.id ? 'bg-blue-50 font-bold text-blue-700' : 'text-gray-700'}`}
                          >
                            <div className="font-medium">{c.company || c.name}</div>
                            {c.company && c.name && <div className="text-xs text-gray-400">{c.name}</div>}
                            {c.rnc && <div className="text-xs text-gray-400">RNC: {c.rnc}</div>}
                          </button>
                        ))
                      }
                      {clients.filter(c => { const q = (clientSearch || '').toLowerCase(); if (!q) return true; return (c.name || '').toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q) || (c.rnc || '').toLowerCase().includes(q); }).length === 0 && (
                        <div className="px-3 py-3 text-xs text-gray-400 text-center">No se encontraron clientes</div>
                      )}
                    </div>
                  )}
                </div>

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
                        <div className="flex flex-col">
                          {companySettings.logoUrl ? (
                            <img src={companySettings.logoUrl} alt={companySettings.name} className="h-14 object-contain" />
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
                          <th className="py-2 px-3 text-left font-bold">Descripcion</th>
                          <th className="py-2 px-3 text-center font-bold w-20">Cant.</th>
                          <th className="py-2 px-3 text-center font-bold w-28">Precio unit.</th>
                          <th className="py-2 px-3 text-center font-bold w-20">Desc.</th>
                          <th className="py-2 px-3 text-right font-bold w-28">Total</th>
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
                            <td className="py-3 px-3 text-center text-xs">
                              {(item.discount || 0) > 0 ? (
                                <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
                                  {item.discountType === 'fixed' ? `-$${item.discount}` : `-${item.discount}%`}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-3 px-3 text-right text-gray-600 font-medium">
                              {formatCurrency(getItemTotal(item)).replace('DOP', '$')}
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
                            <td className="py-5 px-3"></td><td className="py-5 px-3"></td><td className="py-5 px-3"></td><td className="py-5 px-3"></td><td className="py-5 px-3"></td><td className="py-5 px-3"></td>
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
                      {totalDiscounts > 0 && (
                        <>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500 font-bold">BRUTO</span>
                            <span className="font-bold text-gray-500">{formatCurrency(rawSubtotal).replace('DOP', '$')}</span>
                          </div>
                          <div className="flex justify-between py-1 text-red-500">
                            <span className="font-bold">DESCUENTOS</span>
                            <span className="font-bold">-{formatCurrency(totalDiscounts).replace('DOP', '$')}</span>
                          </div>
                        </>
                      )}
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
                          <th className="py-4 px-6 text-left font-medium">Descripcion</th>
                          <th className="py-4 px-6 text-center font-medium w-20">Cant.</th>
                          <th className="py-4 px-6 text-right font-medium w-28">Precio</th>
                          <th className="py-4 px-6 text-center font-medium w-20">Desc.</th>
                          <th className="py-4 px-6 text-right font-medium w-28">Total</th>
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
                            <td className="py-4 px-6 text-center text-xs">
                              {(item.discount || 0) > 0 ? (
                                <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
                                  {item.discountType === 'fixed' ? `-$${item.discount}` : `-${item.discount}%`}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-4 px-6 text-right font-bold text-gray-900">
                              {formatCurrency(getItemTotal(item)).replace('DOP', '$')}
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
                        {totalDiscounts > 0 && (
                          <>
                            <div className="flex justify-between text-gray-400">
                              <span>Bruto</span>
                              <span className="text-gray-300">{formatCurrency(rawSubtotal).replace('DOP', '$')}</span>
                            </div>
                            <div className="flex justify-between text-red-400">
                              <span>Descuentos</span>
                              <span>-{formatCurrency(totalDiscounts).replace('DOP', '$')}</span>
                            </div>
                          </>
                        )}
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
                          <th className="py-3 text-left font-bold">Descripcion</th>
                          <th className="py-3 text-center font-bold w-20">Cant.</th>
                          <th className="py-3 text-right font-bold w-28">Precio</th>
                          <th className="py-3 text-center font-bold w-20">Desc.</th>
                          <th className="py-3 text-right font-bold w-28">Total</th>
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
                            <td className="py-4 text-center text-xs">
                              {(item.discount || 0) > 0 ? (
                                <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
                                  {item.discountType === 'fixed' ? `-$${item.discount}` : `-${item.discount}%`}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-4 text-right font-medium text-gray-900">
                              {formatCurrency(getItemTotal(item)).replace('DOP', '$')}
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
                        {totalDiscounts > 0 && (
                          <>
                            <div className="flex justify-between text-gray-400">
                              <span>Bruto</span>
                              <span className="text-gray-500">{formatCurrency(rawSubtotal).replace('DOP', '$')}</span>
                            </div>
                            <div className="flex justify-between text-red-500">
                              <span>Descuentos</span>
                              <span>-{formatCurrency(totalDiscounts).replace('DOP', '$')}</span>
                            </div>
                          </>
                        )}
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
                  <div className="searchable-dropdown">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catálogo de Productos</label>
                    <div className="relative">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-raynold-red">
                        <Search size={14} className="ml-2 text-gray-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Buscar producto..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          onFocus={() => setShowProductDropdown(true)}
                          className="w-full p-2 outline-none text-sm"
                        />
                      </div>
                      {showProductDropdown && (
                        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                          {products
                            .filter(p => {
                              const q = productSearch.toLowerCase();
                              if (!q) return true;
                              return (p.title || '').toLowerCase().includes(q) || (p.price || '').toString().includes(q) || (p.reference || '').toLowerCase().includes(q);
                            })
                            .map(p => (
                              <button
                                key={p.id}
                                onClick={() => { handleProductSelect(p.id); setProductSearch(p.title); setShowProductDropdown(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-gray-700"
                              >
                                <div className="font-medium">{p.title}</div>
                                <div className="text-xs text-gray-400">${p.price} {p.reference ? `• Ref: ${p.reference}` : ''}</div>
                              </button>
                            ))
                          }
                          {products.filter(p => { const q = productSearch.toLowerCase(); if (!q) return true; return (p.title || '').toLowerCase().includes(q) || (p.price || '').toString().includes(q); }).length === 0 && (
                            <div className="px-3 py-3 text-xs text-gray-400 text-center">No se encontraron productos</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="searchable-dropdown">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catálogo de Servicios</label>
                    <div className="relative">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-raynold-red">
                        <Search size={14} className="ml-2 text-gray-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Buscar servicio..."
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          onFocus={() => setShowServiceDropdown(true)}
                          className="w-full p-2 outline-none text-sm"
                        />
                      </div>
                      {showServiceDropdown && (
                        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                          {services
                            .filter(s => {
                              const q = serviceSearch.toLowerCase();
                              if (!q) return true;
                              return (s.title || '').toLowerCase().includes(q);
                            })
                            .map(s => (
                              <button
                                key={s.id}
                                onClick={() => { handleServiceSelect(s.id); setServiceSearch(s.title); setShowServiceDropdown(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-gray-700"
                              >
                                <div className="font-medium">{s.title}</div>
                              </button>
                            ))
                          }
                          {services.filter(s => { const q = serviceSearch.toLowerCase(); if (!q) return true; return (s.title || '').toLowerCase().includes(q); }).length === 0 && (
                            <div className="px-3 py-3 text-xs text-gray-400 text-center">No se encontraron servicios</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Create Product */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowNewProductForm(!showNewProductForm)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-bold text-gray-600"
                  >
                    <span className="flex items-center gap-2"><Plus size={15} /> Crear nuevo producto rápido</span>
                    <span className="text-xs text-gray-400">{showNewProductForm ? '▲ Cerrar' : '▼ Abrir'}</span>
                  </button>
                  {showNewProductForm && (
                    <div className="p-4 space-y-3 bg-blue-50 border-t border-blue-100">
                      <p className="text-xs text-blue-600 font-semibold">El producto se guardará en el catálogo y se añadirá a esta línea automáticamente.</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del producto *</label>
                          <input
                            type="text"
                            value={newProductData.title}
                            onChange={e => setNewProductData({ ...newProductData, title: e.target.value })}
                            placeholder="ej: Letrero Neon 60x30cm"
                            className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio (DOP)</label>
                          <input
                            type="number"
                            value={newProductData.price}
                            onChange={e => setNewProductData({ ...newProductData, price: e.target.value })}
                            placeholder="0.00"
                            className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referencia (Opcional)</label>
                          <input
                            type="text"
                            value={newProductData.reference}
                            onChange={e => setNewProductData({ ...newProductData, reference: e.target.value })}
                            placeholder="REF-001"
                            className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-400 font-mono"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleCreateAndUseProduct}
                        disabled={savingProduct || !newProductData.title}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {savingProduct ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {savingProduct ? 'Guardando...' : 'Crear y usar este producto'}
                      </button>
                    </div>
                  )}
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

                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                      <Percent size={11} /> Descuento
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingItem.discount || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, discount: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="flex-1 border border-gray-300 rounded-lg p-2 outline-none focus:border-raynold-red text-right text-sm"
                      />
                      <select
                        value={editingItem.discountType || 'percent'}
                        onChange={(e) => setEditingItem({ ...editingItem, discountType: e.target.value as 'percent' | 'fixed' })}
                        className="w-16 border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-raynold-red font-bold"
                      >
                        <option value="percent">%</option>
                        <option value="fixed">$</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-right pb-1">
                    <p className="text-xs text-gray-400 uppercase font-bold">Total Linea</p>
                    <p className="text-sm font-bold text-black">{formatCurrency(getItemTotal(editingItem))}</p>
                    {(editingItem.discount || 0) > 0 && (
                      <p className="text-[10px] text-red-500 font-bold">-{formatCurrency((editingItem.quantity * editingItem.unitPrice) - getItemTotal(editingItem))}</p>
                    )}
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
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = String(inv.number || '').toLowerCase().includes(searchLower) ||
      (inv.clientName && String(inv.clientName).toLowerCase().includes(searchLower)) ||
      (inv.companyName && String(inv.companyName).toLowerCase().includes(searchLower));
    const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus || inv.paymentStatus === filterStatus;
    const matchesType = filterType === 'ALL' || inv.type === filterType;
    const matchesModule = moduleType === 'ALL' || inv.type === moduleType;
    return matchesSearch && matchesStatus && matchesType && matchesModule;
  });

  const moduleTitle = moduleType === 'FACTURA' ? 'Facturas' : moduleType === 'COTIZACION' ? 'Cotizaciones' : 'Facturacion y Cotizaciones';
  const moduleSubtitle = moduleType === 'FACTURA' ? 'Historial de facturas emitidas.' : moduleType === 'COTIZACION' ? 'Historial de cotizaciones.' : 'Historial de documentos emitidos.';
  const createLabel = moduleType === 'FACTURA' ? 'Nueva Factura' : moduleType === 'COTIZACION' ? 'Nueva Cotizacion' : 'Nuevo Documento';

  return (
    <div className="p-6 md:p-10 relative">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-futuristic font-bold text-white mb-2">{moduleTitle}</h1>
          <p className="text-gray-400">{moduleSubtitle}</p>
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
            onClick={() => handleCreateNew()}
            className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2"
          >
            <Plus size={18} />
            {createLabel}
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
          {moduleType === 'ALL' && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-raynold-red transition-colors cursor-pointer"
            >
              <option value="ALL">Todo Tipo</option>
              <option value="FACTURA">Facturas</option>
              <option value="COTIZACION">Cotizaciones</option>
            </select>
          )}
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
                        {invoice.type === 'COTIZACION' && (
                          <button
                            onClick={() => handleConvertToInvoice(invoice)}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors"
                            title="Convertir a Factura"
                          >
                            <ArrowRight size={16} />
                          </button>
                        )}
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
                          onClick={() => handleView(invoice)}
                          className="p-2 bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/40 transition-colors"
                          title="Ver"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="p-2 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/40 transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
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

            <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4 text-gray-800">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Logo de la Empresa</label>
                <div className="flex items-center gap-3 flex-wrap">
                  {companySettings.logoUrl && (
                    <img src={companySettings.logoUrl} alt="Logo" className="h-12 max-w-[160px] object-contain border border-gray-200 rounded p-1 bg-white shrink-0" />
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
                    className="flex-1 min-w-0 border border-gray-300 rounded-lg p-2 text-sm text-gray-600"
                  />
                  {companySettings.logoUrl && (
                    <button
                      onClick={() => setCompanySettings({ ...companySettings, logoUrl: '' })}
                      className="p-2 text-red-500 hover:bg-red-50 rounded shrink-0"
                    >
                      <Trash2 size={16} />
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
