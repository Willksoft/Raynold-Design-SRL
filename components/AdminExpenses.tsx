import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Receipt, Search, Filter, Paperclip, FileText, X, UserPlus, Users, Copy } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { ExpenseRow } from '../types';
import CustomSelect from './CustomSelect';

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  reference: string;
  attachmentUrl?: string;
  attachmentName?: string;
  accountId?: string;
  supplierId?: string;
  supplierName?: string;
}

interface Supplier {
  id: string;
  name: string;
  rnc?: string;
  phone?: string;
  email?: string;
}

const EXPENSE_CATEGORIES = [
  'Oficina', 'Software y Suscripciones', 'Marketing y Publicidad',
  'Salarios y Honorarios', 'Equipos y Materiales', 'Impuestos',
  'Servicios Públicos', 'Otros'
];

const AdminExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supplier search/create state
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', rnc: '', phone: '', email: '' });
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    const [{ data: exps }, { data: accs }, { data: sups }] = await Promise.all([
      supabase.from('expenses').select('*, suppliers(id, name)').order('date', { ascending: false }),
      supabase.from('accounts').select('id, name, balance'),
      supabase.from('suppliers').select('id, name, rnc, phone, email').order('name')
    ]);
    if (exps) setExpenses(exps.map((e: ExpenseRow) => ({
      id: e.id, date: e.date, description: e.description, category: e.category,
      amount: Number(e.amount), reference: e.reference || '',
      attachmentUrl: e.attachment_url || '', attachmentName: e.attachment_name || '',
      accountId: e.account_id || '', supplierId: e.supplier_id || '',
      supplierName: e.suppliers?.name || ''
    })));
    if (accs) setAccounts(accs);
    if (sups) setSuppliers(sups);
  };

  useEffect(() => { fetchData(); }, []);

  // Close supplier dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(e.target as Node)) {
        setShowSupplierDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setSupplierSearch(expense.supplierName || '');
    } else {
      const defaultAccount = accounts[0];
      setEditingExpense({
        id: '', date: new Date().toISOString().split('T')[0], description: '',
        category: EXPENSE_CATEGORIES[0], amount: 0, reference: '',
        attachmentUrl: '', attachmentName: '', accountId: defaultAccount?.id || '',
        supplierId: '', supplierName: ''
      });
      setSupplierSearch('');
    }
    setShowNewSupplierForm(false);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingExpense) {
      setUploading(true);
      const path = `expenses/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('raynold-media').upload(path, file);
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('raynold-media').getPublicUrl(data.path);
        setEditingExpense({ ...editingExpense, attachmentUrl: publicUrl, attachmentName: file.name });
      }
      setUploading(false);
    }
  };

  const removeAttachment = () => {
    if (editingExpense) {
      setEditingExpense({ ...editingExpense, attachmentUrl: '', attachmentName: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const selectSupplier = (supplier: Supplier) => {
    if (editingExpense) {
      setEditingExpense({ ...editingExpense, supplierId: supplier.id, supplierName: supplier.name });
      setSupplierSearch(supplier.name);
    }
    setShowSupplierDropdown(false);
  };

  const clearSupplier = () => {
    if (editingExpense) {
      setEditingExpense({ ...editingExpense, supplierId: '', supplierName: '' });
      setSupplierSearch('');
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim()) return;
    const { data, error } = await supabase.from('suppliers').insert([{
      name: newSupplier.name.trim(),
      rnc: newSupplier.rnc.trim() || null,
      phone: newSupplier.phone.trim() || null,
      email: newSupplier.email.trim() || null,
    }]).select().single();

    if (!error && data) {
      const created: Supplier = { id: data.id, name: data.name, rnc: data.rnc, phone: data.phone, email: data.email };
      setSuppliers(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      selectSupplier(created);
      setShowNewSupplierForm(false);
      setNewSupplier({ name: '', rnc: '', phone: '', email: '' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    type ExpenseInsertRow = {
      date: string; description: string; category: string; amount: number;
      reference: string; attachment_url: string | null; attachment_name: string | null;
      account_id: string | null; supplier_id: string | null;
    };
    const row: ExpenseInsertRow = {
      date: editingExpense.date, description: editingExpense.description,
      category: editingExpense.category, amount: editingExpense.amount,
      reference: editingExpense.reference, attachment_url: editingExpense.attachmentUrl || null,
      attachment_name: editingExpense.attachmentName || null, account_id: editingExpense.accountId || null,
      supplier_id: editingExpense.supplierId || null
    };
    if (expenses.find(e => e.id === editingExpense.id)) {
      await supabase.from('expenses').update(row).eq('id', editingExpense.id);
    } else {
      await supabase.from('expenses').insert([row]);
    }
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este gasto?')) {
      await supabase.from('expenses').delete().eq('id', id);
      fetchData();
    }
  };

  const handleDuplicate = (expense: Expense) => {
    handleOpenModal({
      ...expense,
      id: crypto.randomUUID(),
      description: expense.description + ' (Copia)',
      date: new Date().toISOString().split('T')[0],
      reference: '',
    });
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? exp.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    (s.rnc || '').includes(supplierSearch)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-futuristic font-bold text-white flex items-center gap-3">
            <Receipt className="text-raynold-red" /> Gastos
          </h1>
          <p className="text-gray-400 mt-2">Gestiona los gastos operativos de la empresa</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2">
          <Plus size={18} /> Registrar Gasto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-bold uppercase mb-2">Total Filtrado</h3>
          <p className="text-3xl font-mono text-raynold-red font-bold">
            {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(totalExpenses)}
          </p>
        </div>
        <div className="md:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-xl p-6 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Descripción, referencia o proveedor..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
            </div>
          </div>
          <div className="w-64">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Categoría</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <CustomSelect variant="dark" value={filterCategory} onChange={v => setFilterCategory(v)} placeholder="Todas las categorías" options={[{ value: '', label: 'Todas las categorías' }, ...EXPENSE_CATEGORIES.map(cat => ({ value: cat, label: cat }))]} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <th className="p-4 font-bold">Fecha</th>
                <th className="p-4 font-bold">Proveedor</th>
                <th className="p-4 font-bold">Descripción</th>
                <th className="p-4 font-bold">Categoría</th>
                <th className="p-4 font-bold">Referencia</th>
                <th className="p-4 font-bold text-center">Adjunto</th>
                <th className="p-4 font-bold text-right">Monto</th>
                <th className="p-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-gray-300">{new Date(expense.date).toLocaleDateString('es-DO')}</td>
                  <td className="p-4 text-gray-300 text-sm">
                    {expense.supplierName ? (
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-blue-400 shrink-0" />
                        {expense.supplierName}
                      </span>
                    ) : <span className="text-gray-600">-</span>}
                  </td>
                  <td className="p-4 text-white font-medium">{expense.description}</td>
                  <td className="p-4"><span className="px-2 py-1 text-xs rounded-full font-bold bg-gray-500/20 text-gray-400">{expense.category}</span></td>
                  <td className="p-4 text-gray-400 font-mono text-sm">{expense.reference || '-'}</td>
                  <td className="p-4 text-center">
                    {expense.attachmentUrl ? (
                      <a href={expense.attachmentUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-2 bg-white/5 text-gray-300 rounded hover:bg-white/10 hover:text-white transition-colors" title={expense.attachmentName || 'Ver documento'}>
                        <Paperclip size={16} />
                      </a>
                    ) : <span className="text-gray-600">-</span>}
                  </td>
                  <td className="p-4 text-right text-raynold-red font-mono font-bold">
                    {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(expense.amount)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(expense)} className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors" title="Editar"><Edit2 size={16} /></button>
                      <button onClick={() => handleDuplicate(expense)} className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 transition-colors" title="Duplicar"><Copy size={16} /></button>
                      <button onClick={() => handleDelete(expense.id)} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500">No se encontraron gastos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && editingExpense && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/10 shrink-0">
              <h3 className="font-bold text-xl text-white">{expenses.find(e => e.id === editingExpense.id) ? 'Editar Gasto' : 'Registrar Gasto'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Fecha</label>
                  <input type="date" required value={editingExpense.date} onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Categoría</label>
                  <CustomSelect required variant="dark" value={editingExpense.category} onChange={v => setEditingExpense({ ...editingExpense, category: v })} options={EXPENSE_CATEGORIES.map(cat => ({ value: cat, label: cat }))} />
                </div>
              </div>

              {/* Supplier selector */}
              <div ref={supplierDropdownRef}>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Proveedor / Persona</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar proveedor por nombre o RNC..."
                    value={supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setShowSupplierDropdown(true);
                      if (!e.target.value) clearSupplier();
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    className="w-full bg-black border border-white/20 rounded-lg pl-10 pr-10 py-2 text-white focus:border-raynold-red focus:outline-none"
                  />
                  {editingExpense.supplierId && (
                    <button type="button" onClick={clearSupplier} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                      <X size={16} />
                    </button>
                  )}

                  {/* Dropdown */}
                  {showSupplierDropdown && !showNewSupplierForm && (
                    <div className="absolute z-50 mt-1 w-full bg-[#111] border border-white/20 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {filteredSuppliers.length > 0 ? (
                        filteredSuppliers.slice(0, 10).map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => selectSupplier(s)}
                            className={`w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors flex items-center justify-between ${editingExpense.supplierId === s.id ? 'bg-raynold-red/20 text-raynold-red' : 'text-white'}`}
                          >
                            <span className="font-medium text-sm">{s.name}</span>
                            {s.rnc && <span className="text-xs text-gray-500 font-mono">{s.rnc}</span>}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">No se encontraron proveedores</div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewSupplierForm(true);
                          setShowSupplierDropdown(false);
                          setNewSupplier({ name: supplierSearch, rnc: '', phone: '', email: '' });
                        }}
                        className="w-full text-left px-4 py-2.5 border-t border-white/10 text-raynold-green hover:bg-white/10 transition-colors flex items-center gap-2 text-sm font-bold"
                      >
                        <UserPlus size={16} /> Crear nuevo proveedor
                      </button>
                    </div>
                  )}
                </div>

                {/* Selected supplier badge */}
                {editingExpense.supplierId && editingExpense.supplierName && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-bold">
                    <Users size={12} /> {editingExpense.supplierName}
                  </div>
                )}
              </div>

              {/* New Supplier inline form */}
              {showNewSupplierForm && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserPlus size={16} className="text-raynold-green" /> Nuevo Proveedor
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <input type="text" placeholder="Nombre / Razón Social *" value={newSupplier.name}
                        onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                        className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-raynold-red focus:outline-none" />
                    </div>
                    <input type="text" placeholder="RNC / Cédula" value={newSupplier.rnc}
                      onChange={(e) => setNewSupplier({ ...newSupplier, rnc: e.target.value })}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-raynold-red focus:outline-none font-mono" />
                    <input type="text" placeholder="Teléfono" value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-raynold-red focus:outline-none" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowNewSupplierForm(false)} className="px-3 py-1.5 text-gray-400 text-sm hover:text-white">Cancelar</button>
                    <button type="button" onClick={handleCreateSupplier}
                      className="px-4 py-1.5 bg-raynold-green text-black font-bold text-sm rounded-lg hover:bg-green-400 transition-colors">
                      Crear y Seleccionar
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descripción</label>
                <input type="text" required placeholder="Ej. Compra de suministros" value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Monto (DOP)</label>
                  <input type="number" required min="0" step="0.01" value={editingExpense.amount || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cuenta / Pago</label>
                  <CustomSelect variant="dark" value={editingExpense.accountId || ''} onChange={v => setEditingExpense({ ...editingExpense, accountId: v })} placeholder="Seleccionar..." options={[{ value: '', label: 'Seleccionar...' }, ...accounts.map(acc => ({ value: acc.id, label: acc.name }))]} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Referencia / NCF (Opcional)</label>
                <input type="text" placeholder="Nº de factura o recibo" value={editingExpense.reference}
                  onChange={(e) => setEditingExpense({ ...editingExpense, reference: e.target.value })}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none font-mono" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Documento Adjunto (Opcional)</label>
                {editingExpense.attachmentUrl ? (
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText size={20} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-white truncate">{editingExpense.attachmentName || 'Documento adjunto'}</span>
                    </div>
                    <button type="button" onClick={removeAttachment} className="p-1 text-gray-400 hover:text-red-400 transition-colors shrink-0" title="Eliminar adjunto"><X size={16} /></button>
                  </div>
                ) : (
                  <div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 bg-black border border-white/20 border-dashed rounded-lg px-4 py-4 text-gray-400 hover:text-white hover:border-white/40 transition-colors">
                      {uploading ? 'Subiendo...' : <><Paperclip size={18} /><span>Subir factura o recibo</span></>}
                    </button>
                    <p className="text-[10px] text-gray-500 mt-2 text-center">Formatos soportados: PDF, JPG, PNG</p>
                  </div>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-raynold-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpenses;
