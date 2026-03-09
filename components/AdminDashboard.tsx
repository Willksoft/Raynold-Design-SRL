import React, { useEffect, useState } from 'react';
import { Users, ShoppingCart, TrendingUp, DollarSign, Package } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '../lib/supabaseClient';

interface DashboardStats {
  totalIngresos: number;
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

      const invoices = invoicesData || [];
      const clients = clientsData || [];

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
      <div className="mb-8">
        <h1 className="text-3xl font-futuristic font-bold text-white mb-2">Resumen General</h1>
        <p className="text-gray-400">Estadísticas y rendimiento de la plataforma sincronizadas en tiempo real.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-raynold-red border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ingresos Totales</p>
                  <h3 className="text-2xl font-bold text-white">{formatCurrency(stats.totalIngresos).replace('DOP', 'RD$')}</h3>
                </div>
                <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="flex items-center text-xs text-green-500 font-bold">
                <TrendingUp size={14} className="mr-1" /> Tiempo real
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Cotizaciones</p>
                  <h3 className="text-2xl font-bold text-white">{stats.totalCotizaciones}</h3>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                  <ShoppingCart size={20} />
                </div>
              </div>
              <div className="flex items-center text-xs text-blue-500 font-bold">
                Activas e Históricas
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Productos Activos</p>
                  <h3 className="text-2xl font-bold text-white">{products.length}</h3>
                </div>
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
                  <Package size={20} />
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-500 font-bold">
                Catálogo actual
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Nuevos Clientes</p>
                  <h3 className="text-2xl font-bold text-white">{stats.totalClientes}</h3>
                </div>
                <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg">
                  <Users size={20} />
                </div>
              </div>
              <div className="flex items-center text-xs text-orange-500 font-bold">
                Total Registrados
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
