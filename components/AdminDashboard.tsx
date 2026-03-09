import React, { useEffect, useState } from 'react';
import { Users, ShoppingCart, TrendingUp, DollarSign, Package, ArrowDownRight, TrendingDown, FileText, Receipt, PlusCircle, AlertCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '../lib/supabaseClient';

interface DashboardStats {
  totalIngresos: number;
  totalGastos: number;
  beneficioNeto: number;
  facturasPendientes: number;
  totalCotizaciones: number;
  totalClientes: number;
  salesData: any[];
  categoryData: any[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
};

const AdminDashboard = () => {
  const { products } = useShop();
  const [stats, setStats] = useState<DashboardStats>({
    totalIngresos: 0,
    totalGastos: 0,
    beneficioNeto: 0,
    facturasPendientes: 0,
    totalCotizaciones: 0,
    totalClientes: 0,
    salesData: [],
    categoryData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [products]);

  const fetchDashboardData = async () => {
    try {
      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*),
          payments(*)
        `);

      if (invoicesError) throw invoicesError;

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*');

      if (clientsError) throw clientsError;

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*');

      if (expensesError) throw expensesError;

      const invoices = invoicesData || [];
      const clients = clientsData || [];
      const expenses = expensesData || [];

      let totalIngresos = 0;
      const salesByMonth: Record<string, number> = {
        'Ene': 0, 'Feb': 0, 'Mar': 0, 'Abr': 0, 'May': 0, 'Jun': 0,
        'Jul': 0, 'Ago': 0, 'Sep': 0, 'Oct': 0, 'Nov': 0, 'Dic': 0
      };

      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      invoices.forEach(inv => {
        if (inv.payments && inv.payments.length > 0) {
          inv.payments.forEach((payment: any) => {
            totalIngresos += Number(payment.amount);
            const date = new Date(payment.date || payment.created_at);
            if (!isNaN(date.getTime()) && date.getFullYear() === new Date().getFullYear()) {
              const monthIndex = date.getMonth();
              const monthName = monthNames[monthIndex];
              salesByMonth[monthName] += Number(payment.amount);
            }
          });
        }
      });

      const totalCotizaciones = invoices.filter(inv => inv.type === 'COTIZACION').length;

      const totalGastos = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
      const beneficioNeto = totalIngresos - totalGastos;
      const facturasPendientes = invoices.filter(inv => inv.type === 'FACTURA' && inv.status === 'EMITIDA' && inv.payment_status !== 'PAGADA').length;

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
        totalCotizaciones,
        totalClientes: clients.length,
        salesData,
        categoryData: categoryData.length > 0 ? categoryData : [
          { name: 'Sin categorizar', valor: 100 }
        ]
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
          <p className="text-gray-400">Estadísticas y rendimiento de la plataforma sincronizadas en tiempo real.</p>
        </div>
        <div className="flex gap-2">
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
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ingresos Totales</p>
                  <h3 className="text-3xl font-bold text-white">{formatCurrency(stats.totalIngresos).replace('DOP', 'RD$')}</h3>
                </div>
                <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
                  <DollarSign size={24} />
                </div>
              </div>
              <div className="flex items-center text-xs text-green-500 font-bold">
                <TrendingUp size={14} className="mr-1" /> General histórico
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-full -z-10"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Gastos Totales</p>
                  <h3 className="text-3xl font-bold text-white">{formatCurrency(stats.totalGastos).replace('DOP', 'RD$')}</h3>
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
                  <h3 className="text-3xl font-bold text-white">{formatCurrency(stats.beneficioNeto).replace('DOP', 'RD$')}</h3>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                  <TrendingUp size={24} />
                </div>
              </div>
              <div className="flex items-center text-xs text-blue-500 font-bold">
                Rentabilidad bruta
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-white mb-6">Evolución de Ventas ({new Date().getFullYear()})</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#E60000' }}
                      formatter={(value: number) => [formatCurrency(value).replace('DOP', 'RD$'), 'Ventas']}
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
