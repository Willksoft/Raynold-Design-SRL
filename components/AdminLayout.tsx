import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, LogOut, ShieldAlert, MonitorPlay, Briefcase, Image as ImageIcon, Settings, Star, FileText, Users, Receipt, ShoppingCart, User, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import AdminDashboard from './AdminDashboard';
import AdminPanel from './AdminPanel';
import AdminHero from './AdminHero';
import AdminServices from './AdminServices';
import AdminProjects from './AdminProjects';
import AdminSettings from './AdminSettings';
import AdminBrands from './AdminBrands';
import AdminInvoices from './AdminInvoices';
import AdminClients from './AdminClients';
import AdminExpenses from './AdminExpenses';
import AdminCategories from './AdminCategories';
import AdminSuppliers from './AdminSuppliers';
import AdminPOS from './AdminPOS';
import AdminSellers from './AdminSellers';
import AdminAccounts from './AdminAccounts';
import AdminFooter from './AdminFooter';
import AdminAbout from './AdminAbout';
import AdminMedia from './AdminMedia';

export const AdminLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoginLoading(false);
    if (error) {
      setLoginError('Credenciales incorrectas. Verifica tu email y contraseña.');
    } else {
      setIsAuthenticated(true);
      if (location.pathname === '/admin' || location.pathname === '/admin/') {
        navigate('/admin/dashboard');
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-raynold-black flex items-center justify-center">
        <Loader2 className="text-raynold-red animate-spin" size={48} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-raynold-black flex items-center justify-center p-4 relative z-50">
        <div className="max-w-md w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <ShieldAlert className="text-raynold-red mb-4" size={48} />
            <h2 className="text-2xl font-futuristic font-bold text-white">ACCESO RESTRINGIDO</h2>
            <p className="text-gray-400 text-sm mt-2">Panel de Administración Raynold</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo administrativo"
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
                required
              />
            </div>
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button type="submit" disabled={loginLoading} className="w-full py-3 btn-animated font-bold rounded-lg mt-4 disabled:opacity-50 flex items-center justify-center gap-2">
              {loginLoading ? <Loader2 className="animate-spin" size={18} /> : null}
              {loginLoading ? 'VERIFICANDO...' : 'INICIAR SESIÓN'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-raynold-black flex flex-col md:flex-row relative z-40 overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-[#0A0A0A] border-r border-white/10 flex flex-col h-full print:hidden">
        <div className="p-6 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-futuristic font-bold text-white">ADMIN PANEL</h2>
          <p className="text-xs text-raynold-green mt-1">Conectado como Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link
            to="/admin/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/dashboard') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <LayoutDashboard size={18} />
            <span className="font-bold text-sm">Dashboard</span>
          </Link>
          <Link
            to="/admin/pos"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/pos') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <ShoppingCart size={18} />
            <span className="font-bold text-sm">Punto de Venta (POS)</span>
          </Link>
          <Link
            to="/admin/invoices"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/invoices') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <FileText size={18} />
            <span className="font-bold text-sm">Facturación</span>
          </Link>
          <Link
            to="/admin/clients"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/clients') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Users size={18} />
            <span className="font-bold text-sm">Clientes</span>
          </Link>
          <Link
            to="/admin/expenses"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/expenses') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Receipt size={18} />
            <span className="font-bold text-sm">Gastos</span>
          </Link>
          <Link
            to="/admin/hero"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/hero') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <MonitorPlay size={18} />
            <span className="font-bold text-sm">Inicio (Hero)</span>
          </Link>
          <Link
            to="/admin/footer"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/footer') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <LayoutDashboard size={18} />
            <span className="font-bold text-sm">Pie de Página (Footer)</span>
          </Link>
          <Link
            to="/admin/media"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/media') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <ImageIcon size={18} />
            <span className="font-bold text-sm">Multimedia (Storage)</span>
          </Link>
          <Link
            to="/admin/about"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/about') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Users size={18} />
            <span className="font-bold text-sm">Nosotros (About)</span>
          </Link>
          <Link
            to="/admin/products"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/products') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Package size={18} />
            <span className="font-bold text-sm">Productos y Servicios</span>
          </Link>
          <Link
            to="/admin/categories"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/categories') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <LayoutDashboard size={18} />
            <span className="font-bold text-sm">Categorías</span>
          </Link>
          <Link
            to="/admin/suppliers"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/suppliers') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Users size={18} />
            <span className="font-bold text-sm">Proveedores</span>
          </Link>
          <Link
            to="/admin/sellers"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/sellers') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <User size={18} />
            <span className="font-bold text-sm">Vendedores</span>
          </Link>
          <Link
            to="/admin/accounts"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/accounts') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Briefcase size={18} />
            <span className="font-bold text-sm">Cuentas y Flujo</span>
          </Link>
          <Link
            to="/admin/services"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/services') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Briefcase size={18} />
            <span className="font-bold text-sm">Servicios (Landing)</span>
          </Link>
          <Link
            to="/admin/brands"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/brands') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Star size={18} />
            <span className="font-bold text-sm">Marcas (Clientes)</span>
          </Link>
          <Link
            to="/admin/projects"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/projects') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <ImageIcon size={18} />
            <span className="font-bold text-sm">Proyectos</span>
          </Link>
          <Link
            to="/admin/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/settings') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Settings size={18} />
            <span className="font-bold text-sm">Configuración</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
            <span className="font-bold text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto h-full print:overflow-visible print:h-auto print:w-full print:absolute print:inset-0 print:bg-white">
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/pos" element={<AdminPOS />} />
          <Route path="/invoices" element={<AdminInvoices />} />
          <Route path="/clients" element={<AdminClients />} />
          <Route path="/expenses" element={<AdminExpenses />} />
          <Route path="/hero" element={<AdminHero />} />
          <Route path="/footer" element={<AdminFooter />} />
          <Route path="/media" element={<AdminMedia />} />
          <Route path="/about" element={<AdminAbout />} />
          <Route path="/products" element={<AdminPanel />} />
          <Route path="/categories" element={<AdminCategories />} />
          <Route path="/suppliers" element={<AdminSuppliers />} />
          <Route path="/sellers" element={<AdminSellers />} />
          <Route path="/accounts" element={<AdminAccounts />} />
          <Route path="/services" element={<AdminServices />} />
          <Route path="/brands" element={<AdminBrands />} />
          <Route path="/projects" element={<AdminProjects />} />
          <Route path="/settings" element={<AdminSettings />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminLayout;
