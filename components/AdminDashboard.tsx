import React, { useEffect, useState } from 'react';
import { Users, ShoppingCart, TrendingUp, DollarSign, Package, ArrowDownRight, TrendingDown, FileText, Receipt, PlusCircle, AlertCircle, Clock, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
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
  salesData: SalesDataPoint[];
  categoryData: CategoryDataPoint[];
  recentInvoices: any[];
}

const formatCurrency = (amount: number) => {
  return 'RD$' + new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};

const AdminDashboard = () => {
  const { products } = useShop();
  const [stats, setStats] = useState<DashboardStats>({
    totalIngresos: 0,
    totalGastos: 0,
    beneficioNeto: 0,
    facturasPendientes: 0,
    totalFacturas: 0,
    totalCotizaciones: 0,
    totalClientes: 0,
    totalVentasBruto: 0,
    salesData: [],
    categoryData: [],
    recentInvoices: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [products]);

  // ─── Calculate invoice total from JSONB items ─────────────────────
  const calcInvoiceTotal = (inv: any): number => {
    const items = inv.items || [];
    let subtotal = 0;
    items.forEach((item: any) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice || item.unit_price || item.price) || 0;
      let lineTotal = qty * price;
      // Apply per-item discount
      const discount = Number(item.discount) || 0;
      if (discount > 0) {
        if (item.discountType === 'percent' || item.discount_type === 'percent') {
          lineTotal -= lineTotal * (discount / 100);
        } else {
          lineTotal -= discount;
        }
      }
      subtotal += lineTotal;
    });
    // Global discount
    const globalDiscount = Number(inv.global_discount) || 0;
    if (globalDiscount > 0) {
      if (inv.global_discount_type === 'percent') {
        subtotal -= subtotal * (globalDiscount / 100);
      } else {
        subtotal -= globalDiscount;
      }
    }
    // Tax
    if (inv.apply_tax) {
      subtotal += subtotal * 0.18;
    }
    return subtotal;
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch invoices (items and payments are JSONB columns, not relations)
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch clients
      const { data: clientsData } = await supabase.from('clients').select('id');

      // Fetch expenses
      const { data: expensesData } = await supabase.from('expenses').select('amount, date, category');

      const invoices = invoicesData || [];
      const expenses = expensesData || [];

      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const salesByMonth: Record<string, number> = {};
      monthNames.forEach(m => { salesByMonth[m] = 0; });

      let totalVentasBruto = 0;
      let totalIngresos = 0;

      // Filter only facturas (not cotizaciones) for revenue
      const facturas = invoices.filter(inv => inv.type === 'FACTURA');
      const cotizaciones = invoices.filter(inv => inv.type === 'COTIZACION');

      facturas.forEach(inv => {
        const invoiceTotal = calcInvoiceTotal(inv);

        // Use invoiceTotal if DB total is 0
        const realTotal = Number(inv.total) > 0 ? Number(inv.total) : invoiceTotal;
        totalVentasBruto += realTotal;

        // Payments (JSONB array inside the invoice row)
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
          // If marked as paid but no payment records, use invoice total
          totalIngresos += realTotal;
          const iDate = new Date(inv.date || inv.created_at);
          if (!isNaN(iDate.getTime()) && iDate.getFullYear() === new Date().getFullYear()) {
            salesByMonth[monthNames[iDate.getMonth()]] += realTotal;
          }
        }

        // If no payments at all, still track in sales chart by invoice date
        if (payments.length === 0 && inv.payment_status !== 'PAGADA' && inv.status !== 'ANULADA') {
          const iDate = new Date(inv.date || inv.created_at);
          if (!isNaN(iDate.getTime()) && iDate.getFullYear() === new Date().getFullYear()) {
            salesByMonth[monthNames[iDate.getMonth()]] += realTotal;
          }
        }
      });

      // If no payments recorded yet, use total ventas bruto as ingresos
      if (totalIngresos === 0 && totalVentasBruto > 0) {
        totalIngresos = totalVentasBruto;
      }

      const totalGastos = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      const beneficioNeto = totalIngresos - totalGastos;

      const facturasPendientes = facturas.filter(
        inv => inv.status !== 'ANULADA' && inv.payment_status !== 'PAGADA'
      ).length;

      // Category distribution
      const categoryMap: Record<string, number> = {};
      products.forEach(p => {
        const cat = p.category || 'Otros';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });

      const totalProducts = products.length || 1;
      const categoryData = Object.entries(categoryMap)
        .map(([name, count]) => ({
          name,
          valor: Math.round((count / totalProducts) * 100)
        }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);

      const salesData = monthNames.map(name => ({
        name,
        ventas: salesByMonth[name]
      }));

      setStats({
        totalIngresos,
        totalGastos,
        beneficioNeto,
        facturasPendientes,
        totalFacturas: facturas.length,
        totalCotizaciones: cotizaciones.length,
        totalClientes: clientsData?.length || 0,
        totalVentasBruto,
        salesData,
        categoryData: categoryData.length > 0 ? categoryData : [
          { name: 'Sin categorizar', valor: 100 }
        ],
        recentInvoices: invoices.slice(0, 5),
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-futuristic font-bold text-white mb-2">Resumen General</h1>
          <p className="text-gray-400">Estadísticas y rendimiento sincronizadas en tiempo real.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setLoading(true); fetchDashboardData(); }} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-colors">
            <RefreshCcw size={16} /> Actualizar
          </button>
          <Link to="/admin/pos?type=factura" className="flex items-center gap-2 px-4 py-2 bg-raynold-red text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors">
            <PlusCircle size={16} /> Nueva Venta
          </Link>
          <Link to="/admin/expenses" className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-colors">
            <Receipt size={16} /> Registrar Gasto
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-raynold-red border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Main Financial Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-bl-full -z-10"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ventas / Ingresos</p>
                  <h3 className="text-3xl font-bold text-white">{formatCurrency(stats.totalIngresos)}</h3>
                </div>
                <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
                  <DollarSign size={24} />
                </div>
              </div>
              <div className="flex items-center text-xs text-green-500 font-bold">
                <TrendingUp size={14} className="mr-1" /> {stats.totalFacturas} facturas emitidas
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-full -z-10"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Gastos Totales</p>
                  <h3 className="text-3xl font-bold text-white">{formatCurrency(stats.totalGastos)}</h3>
                </div>
                <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">
                  <ArrowDownRight size={24} />
                </div>
              </div>
              <div className="flex items-center text-xs text-red-500 font-bold">
                <TrendingDown size={14} className="mr-1" /> General histórico
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Beneficio Neto</p>
                  <h3 className={`text-3xl font-bold ${stats.beneficioNeto >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCurrency(stats.beneficioNeto)}</h3>
                </div>
                <div className={`p-3 rounded-lg ${stats.beneficioNeto >= 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                  <TrendingUp size={24} />
                </div>
              </div>
              <div className="flex items-center text-xs text-blue-500 font-bold">
                Ventas − Gastos
              </div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-lg shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Facturas Pendientes</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-xl font-bold text-white">{stats.facturasPendientes}</h3>
                  <span className="text-xs text-yellow-500 mb-1">Por cobrar</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg shrink-0">
                <Package size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Productos Activos</p>
                <h3 className="text-xl font-bold text-white">{products.length}</h3>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Cotizaciones</p>
                <h3 className="text-xl font-bold text-white">{stats.totalCotizaciones}</h3>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg shrink-0">
                <Users size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Clientes Registrados</p>
                <h3 className="text-xl font-bold text-white">{stats.totalClientes}</h3>
              </div>
            </div>
          </div>

          {/* Recent Invoices */}
          {stats.recentInvoices.length > 0 && (
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-4">Últimos Documentos</h3>
              <div className="space-y-2">
                {stats.recentInvoices.map((inv: any) => {
                  const total = Number(inv.total) > 0 ? Number(inv.total) : calcInvoiceTotal(inv);
                  return (
                    <div key={inv.id} className="flex items-center justify-between py-2 px-3 bg-black/40 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${inv.type === 'FACTURA' ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                          {inv.type === 'FACTURA' ? <Receipt size={14} /> : <FileText size={14} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm">#{inv.number}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${inv.type === 'FACTURA' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{inv.type}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${inv.payment_status === 'PAGADA' ? 'bg-green-500/10 text-green-400' : inv.payment_status === 'PARCIAL' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{inv.payment_status}</span>
                          </div>
                          <span className="text-gray-500 text-xs">{inv.client_name || 'Sin cliente'}</span>
                        </div>
                      </div>
                      <span className="text-green-400 font-bold text-sm">{formatCurrency(total)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-white mb-6">Ventas por Mes ({new Date().getFullYear()})</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#E60000' }}
                      formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                    />
                    <Line type="monotone" dataKey="ventas" stroke="#E60000" strokeWidth={3} dot={{ r: 4, fill: '#E60000', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-white mb-6">Distribución de Productos por Categoría (%)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis type="number" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: '#222' }}
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                      formatter={(value: number) => [`${value}%`, 'Porcentaje']}
                    />
                    <Bar dataKey="valor" fill="#009933" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
