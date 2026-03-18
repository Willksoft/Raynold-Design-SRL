import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, ArrowRightLeft, LayoutGrid, List as ListIcon, ArrowDownRight, ArrowUpRight, Wallet, CreditCard, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { BANK_OPTIONS } from './bankOptions';

export type AccountType = 'BANK' | 'CASH' | 'CARD_PROCESSOR' | 'OTHER';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bankName?: string;
  accountNumber?: string;
  accountSubType?: string;
  balance: number;
  isDefaultReceiving?: boolean;
  isDefaultPaying?: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  accountId: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  reference: string;
  description: string;
  toAccountId?: string;
}

const AdminAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'transactions'>('grid');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [accountForm, setAccountForm] = useState<Partial<Account>>({
    name: '', type: 'BANK', bankName: '', accountNumber: '', accountSubType: '',
    balance: 0, isDefaultReceiving: false, isDefaultPaying: false
  });

  const [transferForm, setTransferForm] = useState({ fromAccountId: '', toAccountId: '', amount: 0, description: '' });

  const fetchData = async () => {
    const [{ data: accs }, { data: txs }] = await Promise.all([
      supabase.from('accounts').select('*').order('name'),
      supabase.from('account_transactions').select('*').order('date', { ascending: false }).limit(100)
    ]);
    if (accs) setAccounts(accs.map(a => ({
      id: a.id, name: a.name, type: a.type as AccountType, bankName: a.bank_name || '',
      accountNumber: a.account_number || '', accountSubType: a.account_sub_type || '',
      balance: Number(a.balance), isDefaultReceiving: a.is_default_receiving, isDefaultPaying: a.is_default_paying
    })));
    if (txs) setTransactions(txs.map(t => ({
      id: t.id, date: t.date || t.created_at, accountId: t.account_id,
      type: t.type as 'INCOME' | 'EXPENSE' | 'TRANSFER', amount: Number(t.amount),
      reference: t.reference || '', description: t.description || '', toAccountId: t.to_account_id || ''
    })));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = {
      name: accountForm.name, type: accountForm.type, bank_name: accountForm.bankName,
      account_number: accountForm.accountNumber, account_sub_type: accountForm.accountSubType,
      balance: accountForm.balance, is_default_receiving: accountForm.isDefaultReceiving,
      is_default_paying: accountForm.isDefaultPaying
    };
    if (editingAccount) {
      await supabase.from('accounts').update(row).eq('id', editingAccount.id);
    } else {
      await supabase.from('accounts').insert([row]);
    }
    setIsAccountModalOpen(false);
    setEditingAccount(null);
    fetchData();
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.fromAccountId === transferForm.toAccountId) { alert('No puedes transferir a la misma cuenta.'); return; }
    if (transferForm.amount <= 0) { alert('El monto debe ser mayor a 0.'); return; }
    const fromAcc = accounts.find(a => a.id === transferForm.fromAccountId);
    if (!fromAcc || fromAcc.balance < transferForm.amount) { alert('Fondos insuficientes.'); return; }

    await supabase.from('accounts').update({ balance: fromAcc.balance - transferForm.amount }).eq('id', transferForm.fromAccountId);
    const toAcc = accounts.find(a => a.id === transferForm.toAccountId);
    if (toAcc) await supabase.from('accounts').update({ balance: toAcc.balance + transferForm.amount }).eq('id', transferForm.toAccountId);
    await supabase.from('account_transactions').insert([{
      account_id: transferForm.fromAccountId, to_account_id: transferForm.toAccountId,
      type: 'TRANSFER', amount: transferForm.amount, description: transferForm.description || 'Transferencia entre cuentas',
      reference: `TRF-${Date.now().toString().slice(-4)}`
    }]);
    setIsTransferModalOpen(false);
    setTransferForm({ fromAccountId: '', toAccountId: '', amount: 0, description: '' });
    fetchData();
  };

  const handleDeleteAccount = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta cuenta?')) {
      await supabase.from('accounts').delete().eq('id', id);
      fetchData();
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);

  const getBankLogo = (bankName?: string) => {
    if (!bankName) return null;
    const match = BANK_OPTIONS.find(b => b.name.toLowerCase() === bankName.toLowerCase());
    return match ? match.logo : null;
  };

  const getAccountIcon = (account: Account) => {
    const logo = getBankLogo(account.bankName);
    if (logo) return <img src={logo} alt={account.bankName} className="w-8 h-8 rounded-lg object-cover border border-white/10" />;
    switch (account.type) {
      case 'BANK': return <Building2 size={20} className="text-blue-400" />;
      case 'CASH': return <Wallet size={20} className="text-green-400" />;
      case 'CARD_PROCESSOR': return <CreditCard size={20} className="text-purple-400" />;
      default: return <HelpCircle size={20} className="text-gray-400" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building2 className="text-raynold-red" /> Cuentas y Flujo de Dinero
        </h1>
        <div className="flex gap-3">
          <div className="flex bg-[#0A0A0A] border border-white/10 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`} title="Vista de Cuentas"><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('transactions')} className={`p-2 rounded-md transition-colors ${viewMode === 'transactions' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`} title="Flujo de Dinero"><ListIcon size={18} /></button>
          </div>
          <button onClick={() => { setTransferForm({ fromAccountId: accounts[0]?.id || '', toAccountId: accounts[1]?.id || '', amount: 0, description: '' }); setIsTransferModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <ArrowRightLeft size={20} /> Transferir
          </button>
          <button onClick={() => { setEditingAccount(null); setAccountForm({ name: '', type: 'BANK', bankName: '', accountNumber: '', accountSubType: '', balance: 0, isDefaultReceiving: false, isDefaultPaying: false }); setIsAccountModalOpen(true); }}
            className="bg-raynold-red hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus size={20} /> Nueva Cuenta
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(account => (
            <div key={account.id} className="bg-[#141414] border border-white/10 rounded-xl p-6 relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {getAccountIcon(account)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{account.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 bg-white/5 text-gray-400 rounded uppercase tracking-wider border border-white/10">{account.type}</span>
                    </div>
                    {account.bankName && <p className="text-sm text-gray-400">{account.bankName}{account.accountSubType ? ` - ${account.accountSubType}` : ''}</p>}
                    {account.accountNumber && <p className="text-xs font-mono text-gray-500 mt-0.5">{account.accountNumber}</p>}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingAccount(account); setAccountForm(account); setIsAccountModalOpen(true); }} className="text-blue-400 hover:text-blue-300"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteAccount(account.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-1">Balance Actual</p>
                <p className="text-3xl font-black text-raynold-green">{formatCurrency(account.balance)}</p>
              </div>
              <div className="mt-4 flex gap-2">
                {account.isDefaultReceiving && <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Cobros (Default)</span>}
                {account.isDefaultPaying && <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Pagos (Default)</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#141414] rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-left text-gray-300">
            <thead className="bg-black/50 text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Fecha</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Cuenta(s)</th>
                <th className="px-6 py-4 font-medium">Descripción</th>
                <th className="px-6 py-4 font-medium text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm">{new Date(tx.date).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {tx.type === 'INCOME' && <span className="flex items-center gap-1 text-green-400"><ArrowDownRight size={16} /> Ingreso</span>}
                    {tx.type === 'EXPENSE' && <span className="flex items-center gap-1 text-red-400"><ArrowUpRight size={16} /> Gasto</span>}
                    {tx.type === 'TRANSFER' && <span className="flex items-center gap-1 text-blue-400"><ArrowRightLeft size={16} /> Transferencia</span>}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {tx.type === 'TRANSFER' ? (
                      <div className="flex items-center gap-1">
                        {(() => { const fromAcc = accounts.find(a => a.id === tx.accountId); return fromAcc ? <><span className="flex items-center gap-1.5">{getBankLogo(fromAcc.bankName) && <img src={getBankLogo(fromAcc.bankName)!} alt="" className="w-5 h-5 rounded object-cover" />}<span className="text-red-400">{fromAcc.name}</span></span></> : null; })()}
                        <span className="text-gray-500 mx-1">→</span>
                        {(() => { const toAcc = accounts.find(a => a.id === tx.toAccountId); return toAcc ? <><span className="flex items-center gap-1.5">{getBankLogo(toAcc.bankName) && <img src={getBankLogo(toAcc.bankName)!} alt="" className="w-5 h-5 rounded object-cover" />}<span className="text-green-400">{toAcc.name}</span></span></> : null; })()}
                      </div>
                    ) : (() => { const acc = accounts.find(a => a.id === tx.accountId); return acc ? <span className="flex items-center gap-1.5">{getBankLogo(acc.bankName) && <img src={getBankLogo(acc.bankName)!} alt="" className="w-5 h-5 rounded object-cover" />}{acc.name}</span> : null; })()}
                  </td>
                  <td className="px-6 py-4 text-sm">{tx.description}</td>
                  <td className={`px-6 py-4 text-right font-bold ${tx.type === 'EXPENSE' ? 'text-red-400' : 'text-green-400'}`}>
                    {tx.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay transacciones registradas.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}</h2>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAccountSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nombre de la Cuenta *</label>
                  <input required type="text" value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" placeholder="Ej. Banco Popular USD" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Cuenta *</label>
                  <select required value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value as AccountType })} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none">
                    <option value="BANK">Banco</option>
                    <option value="CASH">Efectivo / Caja</option>
                    <option value="CARD_PROCESSOR">Procesador de Tarjeta</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
              </div>
              {accountForm.type === 'BANK' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Banco</label>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                      {BANK_OPTIONS.filter(b => b.type === 'bank').map(bank => (
                        <button key={bank.name} type="button"
                          onClick={() => setAccountForm({ ...accountForm, bankName: bank.name })}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${accountForm.bankName === bank.name ? 'border-raynold-red bg-raynold-red/10' : 'border-white/10 hover:border-white/30 bg-black'}`}>
                          <img src={bank.logo} alt={bank.name} className="w-8 h-8 rounded-md object-cover" />
                          <span className="text-[8px] text-gray-400 text-center leading-tight truncate w-full">{bank.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Sub-tipo</label>
                      <input type="text" value={accountForm.accountSubType} onChange={e => setAccountForm({ ...accountForm, accountSubType: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" placeholder="Ej. Ahorro" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Número de Cuenta</label>
                      <input type="text" value={accountForm.accountNumber} onChange={e => setAccountForm({ ...accountForm, accountNumber: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Balance Inicial</label>
                <input type="number" step="0.01" value={accountForm.balance} onChange={e => setAccountForm({ ...accountForm, balance: parseFloat(e.target.value) || 0 })} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" disabled={!!editingAccount} />
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" checked={accountForm.isDefaultReceiving} onChange={e => setAccountForm({ ...accountForm, isDefaultReceiving: e.target.checked })} className="rounded bg-black border-white/20 text-raynold-red" /> Cuenta por defecto para recibir pagos</label>
                <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" checked={accountForm.isDefaultPaying} onChange={e => setAccountForm({ ...accountForm, isDefaultPaying: e.target.checked })} className="rounded bg-black border-white/20 text-raynold-red" /> Cuenta por defecto para pagar a proveedores</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsAccountModalOpen(false)} className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-white/5">Cancelar</button>
                <button type="submit" className="bg-raynold-red hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Transferir Fondos</h2>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Cuenta de Origen</label>
                <select required value={transferForm.fromAccountId} onChange={e => setTransferForm({ ...transferForm, fromAccountId: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none">
                  <option value="">Seleccionar cuenta...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.bankName ? `${a.bankName} - ` : ''}{a.name} ({formatCurrency(a.balance)})</option>)}
                </select>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRightLeft size={24} className="text-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Cuenta de Destino</label>
                <select required value={transferForm.toAccountId} onChange={e => setTransferForm({ ...transferForm, toAccountId: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none">
                  <option value="">Seleccionar cuenta...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.bankName ? `${a.bankName} - ` : ''}{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Monto a Transferir</label>
                <input required type="number" step="0.01" min="0.01" value={transferForm.amount || ''} onChange={e => setTransferForm({ ...transferForm, amount: parseFloat(e.target.value) || 0 })} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descripción</label>
                <input type="text" value={transferForm.description} onChange={e => setTransferForm({ ...transferForm, description: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" placeholder="Ej. Reposición de caja chica" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-white/5">Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">Transferir</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccounts;
