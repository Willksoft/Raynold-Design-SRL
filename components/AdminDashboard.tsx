import React from 'react';
import { Users, ShoppingCart, TrendingUp, DollarSign, Package } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const salesData = [
  { name: 'Ene', ventas: 4000 },
  { name: 'Feb', ventas: 3000 },
  { name: 'Mar', ventas: 2000 },
  { name: 'Abr', ventas: 2780 },
  { name: 'May', ventas: 1890 },
  { name: 'Jun', ventas: 2390 },
  { name: 'Jul', ventas: 3490 },
];

const categoryData = [
  { name: 'Señalización', valor: 45 },
  { name: 'Impresión', valor: 25 },
  { name: 'Textil', valor: 20 },
  { name: 'Otros', valor: 10 },
];

const AdminDashboard = () => {
  const { products } = useShop();

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-futuristic font-bold text-white mb-2">Resumen General</h1>
        <p className="text-gray-400">Estadísticas y rendimiento de la plataforma.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ingresos Totales</p>
              <h3 className="text-2xl font-bold text-white">RD$ 245,890</h3>
            </div>
            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-center text-xs text-green-500 font-bold">
            <TrendingUp size={14} className="mr-1" /> +12.5% este mes
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Cotizaciones</p>
              <h3 className="text-2xl font-bold text-white">1,204</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="flex items-center text-xs text-green-500 font-bold">
            <TrendingUp size={14} className="mr-1" /> +5.2% este mes
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
            Actualizado hoy
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Nuevos Clientes</p>
              <h3 className="text-2xl font-bold text-white">84</h3>
            </div>
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-center text-xs text-red-500 font-bold">
            <TrendingUp size={14} className="mr-1 rotate-180" /> -2.1% este mes
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-white mb-6">Evolución de Ventas (2025)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#E60000' }}
                />
                <Line type="monotone" dataKey="ventas" stroke="#E60000" strokeWidth={3} dot={{ r: 4, fill: '#E60000', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-white mb-6">Distribución por Categoría (%)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis type="number" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#222' }}
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                />
                <Bar dataKey="valor" fill="#009933" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
