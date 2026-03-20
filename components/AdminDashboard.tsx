import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, DollarSign, Package, ArrowDownRight, TrendingDown, FileText, Receipt, PlusCircle, Clock, RefreshCcw, ArrowUpRight, ShoppingBag, Truck, BarChart3, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../lib/supabaseClient';
import { SalesDataPoint, CategoryDataPoint } from '../types';

interface DashboardStats {
  totalIngresos: number;
  totalGastos: number;
  beneficioNeto: number;
  facturasPendientes: number;
  totalFacturas: number;
  totalCotizaciones: number;
  totalClientes: number;
  totalVentasBruto: number;
  totalSuppliers: number;
  totalPurchaseOrders: number;
  salesData: SalesDataPoint[];
  categoryData: CategoryDataPoint[];
  recentInvoices: any[];
  expensesByCategory: { name: string; valor: number }[];
}

const formatCurrency = (amount: number) => {
  return 'RD$' + new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};

const formatCompact = (amount: number) => {
  if (amount >= 1000000) return 'RD$' + (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return 'RD$' + (amount / 1000).toFixed(1) + 'K';
  return 'RD$' + amount.toFixed(0);
};

// Custom glow tooltip
const GlowTooltip = ({ active, payload, label, color = '#E60000' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm">
      <p className="text-gray-400 text-xs font-bold mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-white font-bold text-sm" style={{ color: entry.color || color }}>
          {entry.name}: {typeof entry.value === 'number' && entry.value > 100 ? formatCurrency(entry.value) : `${entry.value}%`}
        </p>
      ))}
    </div>
  );
};

const GLOW_COLORS = ['#E60000', '#00CC66', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

const AdminDashboard = () => {
  const { products } = useShop();
  const [stats, setStats] = useState<DashboardStats>({
    totalIngresos: 0, totalGastos: 0, beneficioNeto: 0, facturasPendientes: 0,
    totalFacturas: 0, totalCotizaciones: 0, totalClientes: 0, totalVentasBruto: 0,
    totalSuppliers: 0, totalPurchaseOrders: 0,
    salesData: [], categoryData: [], recentInvoices: [], expensesByCategory: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, [products]);

  const calcInvoiceTotal = (inv: any): number => {
    const items = inv.items || [];
    let subtotal = 0;
    items.forEach((item: any) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice || item.unit_price || item.price) || 0;
      let lineTotal = qty * price;
      const discount = Number(item.discount) || 0;
      if (discount > 0) {
        if (item.discountType === 'percent' || item.discount_type === 'percent') lineTotal -= lineTotal * (discount / 100);
        else lineTotal -= discount;
      }
      subtotal += lineTotal;
    });
    const globalDiscount = Number(inv.global_discount) || 0;
    if (globalDiscount > 0) {
      if (inv.global_discount_type === 'percent') subtotal -= subtotal * (globalDiscount / 100);
      else subtotal -= globalDiscount;
    }
    if (inv.apply_tax) subtotal += subtotal * 0.18;
    return subtotal;
  };

  const fetchDashboardData = async () => {
    try {
      const [
        { data: invoicesData },
        { data: clientsData },
        { data: expensesData },
        { data: suppliersData },
        { data: poData },
      ] = await Promise.all([
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('id'),
        supabase.from('expenses').select('amount, date, category'),
        supabase.from('suppliers').select('id'),
        supabase.from('purchase_orders').select('id, status'),
      ]);

      const invoices = invoicesData || [];
      const expenses = expensesData || [];
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const salesByMonth: Record<string, number> = {};
      monthNames.forEach(m => { salesByMonth[m] = 0; });

      let totalVentasBruto = 0;
      let totalIngresos = 0;

      const facturas = invoices.filter(inv => inv.type === 'FACTURA');
      const cotizaciones = invoices.filter(inv => inv.type === 'COTIZACION');

      facturas.forEach(inv => {
        const invoiceTotal = calcInvoiceTotal(inv);
        const realTotal = Number(inv.total) > 0 ? Number(inv.total) : invoiceTotal;
        totalVentasBruto += realTotal;

        const payments = inv.payments || [];
        if (payments.length > 0) {
          payments.forEach((p: any) => {
            const paymentAmount = Number(p.amount) || 0;
            totalIngresos += paymentAmount;
            const pDate = new Date(p.date || p.created_at || inv.created_at);
            if (!isNaN(pDate.getTime()) && pDate.getFullYear() === new Date().getFullYear()) {
              salesByMonth[monthNames[pDate.getMonth()]] += paymentAmount;
            }
          });
        } else if (inv.payment_status === 'PAGADA') {
          totalIngresos += realTotal;
          const iDate = new Date(inv.date || inv.created_at);
          if (!isNaN(iDate.getTime()) && iDate.getFullYear() === new Date().getFullYear()) salesByMonth[monthNames[iDate.getMonth()]] += realTotal;
        }

        if (payments.length === 0 && inv.payment_status !== 'PAGADA' && inv.status !== 'ANULADA') {
          const iDate = new Date(inv.date || inv.created_at);
          if (!isNaN(iDate.getTime()) && iDate.getFullYear() === new Date().getFullYear()) salesByMonth[monthNames[iDate.getMonth()]] += realTotal;
        }
      });

      if (totalIngresos === 0 && totalVentasBruto > 0) totalIngresos = totalVentasBruto;

      const totalGastos = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

      // Expenses by category
      const expCatMap: Record<string, number> = {};
      expenses.forEach(exp => {
        const cat = (exp as any).category || 'Otros';
        expCatMap[cat] = (expCatMap[cat] || 0) + (Number(exp.amount) || 0);
      });
      const expensesByCategory = Object.entries(expCatMap)
        .map(([name, valor]) => ({ name, valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 6);

      // Category distribution
      const categoryMap: Record<string, number> = {};
      products.forEach(p => { const cat = p.category || 'Otros'; categoryMap[cat] = (categoryMap[cat] || 0) + 1; });
      const totalProducts = products.length || 1;
      const categoryData = Object.entries(categoryMap)
        .map(([name, count]) => ({ name, valor: Math.round((count / totalProducts) * 100) }))
        .sort((a, b) => b.valor - a.valor).slice(0, 6);

      setStats({
        totalIngresos, totalGastos,
        beneficioNeto: totalIngresos - totalGastos,
        facturasPendientes: facturas.filter(inv => inv.status !== 'ANULADA' && inv.payment_status !== 'PAGADA').length,
        totalFacturas: facturas.length, totalCotizaciones: cotizaciones.length,
        totalClientes: clientsData?.length || 0, totalVentasBruto,
        totalSuppliers: suppliersData?.length || 0,
        totalPurchaseOrders: poData?.length || 0,
        salesData: monthNames.map(name => ({ name, ventas: salesByMonth[name] })),
        categoryData: categoryData.length > 0 ? categoryData : [{ name: 'Sin categorizar', valor: 100 }],
        recentInvoices: invoices.slice(0, 5),
        expensesByCategory,
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-futuristic font-bold text-white mb-1">
            Resumen <span className="animate-gradient-text">General</span>
          </h1>
          <p className="text-gray-500 text-sm">Métricas en tiempo real • {new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setLoading(true); fetchDashboardData(); }} className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-400 text-sm font-bold rounded-lg hover:bg-white/10 hover:text-white transition-colors border border-white/10">
            <RefreshCcw size={14} /> Actualizar
          </button>
          <Link to="/admin/invoices" className="flex items-center gap-2 px-4 py-2 btn-animated text-sm font-bold rounded-lg">
            <PlusCircle size={14} /> Nueva Venta
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-raynold-red border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* ═══ MAIN KPIs ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Ingresos */}
            <Link to="/admin/invoices" className="group relative bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl overflow-hidden hover:border-green-500/30 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors"></div>
              <div className="absolute bottom-0 right-0 w-20 h-1 bg-gradient-to-r from-transparent to-green-500/50 rounded-l-full"></div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ventas / Ingresos</p>
                  <h3 className="text-2xl md:text-3xl font-black text-white">{formatCurrency(stats.totalIngresos)}</h3>
                </div>
                <div className="p-3 bg-green-500/10 text-green-500 rounded-xl group-hover:bg-green-500/20 transition-colors">
                  <DollarSign size={22} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-500 font-bold flex items-center gap-1"><TrendingUp size={12} /> {stats.totalFacturas} facturas</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-500 flex items-center gap-1 group-hover:text-white transition-colors"><ArrowUpRight size={10} /> Ver detalle</span>
              </div>
            </Link>

            {/* Gastos */}
            <Link to="/admin/expenses" className="group relative bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl overflow-hidden hover:border-red-500/30 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors"></div>
              <div className="absolute bottom-0 right-0 w-20 h-1 bg-gradient-to-r from-transparent to-red-500/50 rounded-l-full"></div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Gastos Totales</p>
                  <h3 className="text-2xl md:text-3xl font-black text-white">{formatCurrency(stats.totalGastos)}</h3>
                </div>
                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl group-hover:bg-red-500/20 transition-colors">
                  <ArrowDownRight size={22} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-red-500 font-bold flex items-center gap-1"><TrendingDown size={12} /> General</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-500 flex items-center gap-1 group-hover:text-white transition-colors"><ArrowUpRight size={10} /> Ver gastos</span>
              </div>
            </Link>

            {/* Beneficio */}
            <Link to="/admin/accounts" className="group relative bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
              <div className="absolute bottom-0 right-0 w-20 h-1 bg-gradient-to-r from-transparent to-blue-500/50 rounded-l-full"></div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Beneficio Neto</p>
                  <h3 className={`text-2xl md:text-3xl font-black ${stats.beneficioNeto >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCurrency(stats.beneficioNeto)}</h3>
                </div>
                <div className={`p-3 rounded-xl transition-colors ${stats.beneficioNeto >= 0 ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20' : 'bg-red-500/10 text-red-500'}`}>
                  <Wallet size={22} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-blue-500 font-bold">Ingresos − Gastos</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-500 flex items-center gap-1 group-hover:text-white transition-colors"><ArrowUpRight size={10} /> Cuentas</span>
              </div>
            </Link>
          </div>

          {/* ═══ SECONDARY KPIs ═══ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <Link to="/admin/invoices" className="group bg-[#0A0A0A] border border-white/10 p-4 rounded-xl hover:border-yellow-500/30 transition-all flex items-center gap-3">
              <div className="p-2.5 bg-yellow-500/10 text-yellow-500 rounded-lg shrink-0 group-hover:scale-110 transition-transform"><Clock size={18} /></div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 font-bold uppercase truncate">Pendientes</p>
                <h3 className="text-lg font-black text-white">{stats.facturasPendientes}</h3>
              </div>
            </Link>
            <Link to="/admin/quotations" className="group bg-[#0A0A0A] border border-white/10 p-4 rounded-xl hover:border-blue-500/30 transition-all flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg shrink-0 group-hover:scale-110 transition-transform"><FileText size={18} /></div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 font-bold uppercase truncate">Cotizaciones</p>
                <h3 className="text-lg font-black text-white">{stats.totalCotizaciones}</h3>
              </div>
            </Link>
            <Link to="/admin/products" className="group bg-[#0A0A0A] border border-white/10 p-4 rounded-xl hover:border-purple-500/30 transition-all flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-lg shrink-0 group-hover:scale-110 transition-transform"><Package size={18} /></div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 font-bold uppercase truncate">Productos</p>
                <h3 className="text-lg font-black text-white">{products.length}</h3>
              </div>
            </Link>
            <Link to="/admin/clients" className="group bg-[#0A0A0A] border border-white/10 p-4 rounded-xl hover:border-orange-500/30 transition-all flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-lg shrink-0 group-hover:scale-110 transition-transform"><Users size={18} /></div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 font-bold uppercase truncate">Clientes</p>
                <h3 className="text-lg font-black text-white">{stats.totalClientes}</h3>
              </div>
            </Link>
            <Link to="/admin/suppliers" className="group bg-[#0A0A0A] border border-white/10 p-4 rounded-xl hover:border-cyan-500/30 transition-all flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 text-cyan-500 rounded-lg shrink-0 group-hover:scale-110 transition-transform"><ShoppingBag size={18} /></div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 font-bold uppercase truncate">Proveedores</p>
                <h3 className="text-lg font-black text-white">{stats.totalSuppliers}</h3>
              </div>
            </Link>
            <Link to="/admin/purchase-orders" className="group bg-[#0A0A0A] border border-white/10 p-4 rounded-xl hover:border-emerald-500/30 transition-all flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0 group-hover:scale-110 transition-transform"><Truck size={18} /></div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 font-bold uppercase truncate">Órd. Compra</p>
                <h3 className="text-lg font-black text-white">{stats.totalPurchaseOrders}</h3>
              </div>
            </Link>
          </div>

          {/* ═══ CHARTS ROW ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Sales Chart - 2 cols */}
            <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/[0.02] to-transparent pointer-events-none"></div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <BarChart3 size={18} className="text-raynold-red" /> Ventas {new Date().getFullYear()}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Evolución mensual de ingresos</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-white">{formatCompact(stats.totalIngresos)}</p>
                  <p className="text-[10px] text-gray-500">Total acumulado</p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.salesData}>
                    <defs>
                      <linearGradient id="salesGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E60000" stopOpacity={0.3} />
                        <stop offset="50%" stopColor="#E60000" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="#E60000" stopOpacity={0} />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="name" stroke="#555" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#555" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v)} />
                    <Tooltip content={<GlowTooltip />} />
                    <Area type="monotone" dataKey="ventas" stroke="#E60000" strokeWidth={3} fill="url(#salesGlow)" dot={{ r: 4, fill: '#E60000', strokeWidth: 0 }} activeDot={{ r: 7, fill: '#E60000', filter: 'url(#glow)' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Product Categories - Pie */}
            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.02] to-transparent pointer-events-none"></div>
              <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                <Package size={18} className="text-purple-500" /> Categorías
              </h3>
              <p className="text-xs text-gray-500 mb-4">Distribución de productos</p>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {GLOW_COLORS.map((c, i) => (
                        <filter key={`pGlow${i}`} id={`pieGlow${i}`}>
                          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={c} floodOpacity="0.5" />
                        </filter>
                      ))}
                    </defs>
                    <Pie data={stats.categoryData} dataKey="valor" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={42} paddingAngle={3} strokeWidth={0}>
                      {stats.categoryData.map((_, i) => (
                        <Cell key={i} fill={GLOW_COLORS[i % GLOW_COLORS.length]} filter={`url(#pieGlow${i % GLOW_COLORS.length})`} />
                      ))}
                    </Pie>
                    <Tooltip content={<GlowTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {stats.categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GLOW_COLORS[i % GLOW_COLORS.length], boxShadow: `0 0 6px ${GLOW_COLORS[i % GLOW_COLORS.length]}` }}></div>
                      <span className="text-gray-400 truncate max-w-[120px]">{cat.name}</span>
                    </div>
                    <span className="text-white font-bold">{cat.valor}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ BOTTOM ROW ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Invoices */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none"></div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Receipt size={18} className="text-blue-500" /> Últimos Documentos
                </h3>
                <Link to="/admin/invoices" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                  Ver todos <ArrowUpRight size={10} />
                </Link>
              </div>
              {stats.recentInvoices.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentInvoices.map((inv: any) => {
                    const total = Number(inv.total) > 0 ? Number(inv.total) : calcInvoiceTotal(inv);
                    return (
                      <Link key={inv.id} to={`/admin/${inv.type === 'FACTURA' ? 'invoices' : 'quotations'}`} className="flex items-center justify-between py-3 px-4 bg-black/40 rounded-xl border border-white/5 hover:border-white/20 hover:bg-white/[0.03] transition-all group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 ${inv.type === 'FACTURA' ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            {inv.type === 'FACTURA' ? <Receipt size={14} /> : <FileText size={14} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold text-sm">#{inv.number}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${inv.type === 'FACTURA' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{inv.type}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${inv.payment_status === 'PAGADA' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{inv.payment_status}</span>
                            </div>
                            <span className="text-gray-600 text-xs truncate block">{inv.client_name || 'Sin cliente'}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-green-400 font-black text-sm">{formatCurrency(total)}</span>
                          <ArrowUpRight size={10} className="text-gray-600 group-hover:text-white ml-1 inline transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <FileText size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay documentos recientes</p>
                </div>
              )}
            </div>

            {/* Expenses by Category */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/[0.02] to-transparent pointer-events-none"></div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <ArrowDownRight size={18} className="text-red-500" /> Gastos por Categoría
                </h3>
                <Link to="/admin/expenses" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                  Ver todos <ArrowUpRight size={10} />
                </Link>
              </div>
              {stats.expensesByCategory.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.expensesByCategory} layout="vertical" margin={{ left: 10 }}>
                      <defs>
                        <linearGradient id="expGlow" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#E60000" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#E60000" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                      <XAxis type="number" stroke="#555" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => formatCompact(v)} />
                      <YAxis dataKey="name" type="category" stroke="#555" fontSize={10} tickLine={false} axisLine={false} width={80} />
                      <Tooltip content={(props: any) => <GlowTooltip {...props} />} />
                      <Bar dataKey="valor" fill="url(#expGlow)" radius={[0, 6, 6, 0]} barSize={20} name="Monto" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <Receipt size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay gastos registrados</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
