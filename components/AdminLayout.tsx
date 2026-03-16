import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, LogOut, ShieldAlert, MonitorPlay, Briefcase, Image as ImageIcon, Settings, Star, FileText, Users, Receipt, ShoppingCart, User, Loader2, ArrowLeft, Home, Search, Plus, ChevronDown, File, BarChart2, QrCode, BookOpen, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { SearchResults } from '../types';
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
import AdminProcess from './AdminProcess';
import AdminFeatures from './AdminFeatures';
import AdminReports from './AdminReports';
import AdminQR from './AdminQR';
import AdminCatalog from './AdminCatalog';
import AdminPaymentLinks from './AdminPaymentLinks';

export const AdminLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults>({ clients: [], products: [], invoices: [] });
  const [isDesignMenuOpen, setIsDesignMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdowns on route change
  useEffect(() => {
    setIsAddMenuOpen(false);
    setIsSearchOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  // Global Search Logic
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults({ clients: [], products: [], invoices: [] });
      setIsSearchOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);

      const [clientsRes, productsRes, invoicesRes] = await Promise.all([
        supabase
          .from('clients')
          .select('id, name, company')
          .or(`name.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`)
          .limit(3),
        supabase
          .from('products')
          .select('id, title, reference')
          .or(`title.ilike.%${searchQuery}%,reference.ilike.%${searchQuery}%`)
          .limit(3),
        supabase
          .from('invoices')
          .select('id, number, type, client_name')
          .or(`number.ilike.%${searchQuery}%,client_name.ilike.%${searchQuery}%`)
          .limit(3)
      ]);

      setSearchResults({
        clients: clientsRes.data || [],
        products: productsRes.data || [],
        invoices: invoicesRes.data || []
      });
      setIsSearching(false);
      setIsSearchOpen(true);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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

    const lowerEmail = email.toLowerCase().trim();
    if (!lowerEmail.endsWith('@raynolddesignssrl.com') && lowerEmail !== 'raynolddesignssrl@admin.com') {
      setLoginError('Acceso denegado. Se requiere credencial administrativa.');
      return;
    }

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
        <div className="max-w-md w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 shadow-2xl relative">
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            <span className="text-xs font-bold">VOLVER</span>
          </button>
          <div className="flex flex-col items-center mb-8 mt-4">
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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-modern">
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
            to="/admin/products"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/products') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Package size={18} />
            <span className="font-bold text-sm">Productos</span>
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
            to="/admin/reports"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes('/reports') ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <BarChart2 size={18} />
            <span className="font-bold text-sm">Reportes</span>
          </Link>

          {/* Design & Web Dropdown */}
          <div className="pt-2 border-t border-white/10 mt-2">
            <button
              onClick={() => setIsDesignMenuOpen(!isDesignMenuOpen)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <MonitorPlay size={18} />
                <span className="font-bold text-sm">Sitio Web (Diseño)</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-200 ${isDesignMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDesignMenuOpen && (
              <div className="pl-4 mt-1 space-y-1 mb-2 border-l-2 border-white/5 ml-4">
                <Link
                  to="/admin/hero"
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/hero') ? 'text-raynold-red' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className="font-bold text-xs">Inicio (Hero)</span>
                </Link>
                <Link
                  to="/admin/services"
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/services') ? 'text-raynold-red' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className="font-bold text-xs">Servicios (Landing)</span>
                </Link>
                <Link
                  to="/admin/projects"
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/projects') ? 'text-raynold-red' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className="font-bold text-xs">Proyectos</span>
                </Link>
                <Link
                  to="/admin/brands"
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/brands') ? 'text-raynold-red' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className="font-bold text-xs">Marcas (Clientes)</span>
                </Link>
                <Link
                  to="/admin/about"
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/about') ? 'text-raynold-red' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className="font-bold text-xs">Nosotros (About)</span>
                </Link>
                <Link
                  to="/admin/footer"
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/footer') ? 'text-raynold-red' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className="font-bold text-xs">Pie de Página (Footer)</span>
                </Link>
                <Link
                  to="/admin/media"
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/media') ? 'text-raynold-red' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className="font-bold text-xs">Multimedia (Storage)</span>
                </Link>
                <Link
                  to="/admin/process"
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/process') ? 'text-raynold-red' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className="font-bold text-xs">Proceso (Pasos)</span>
                </Link>
                <Link
                  to="/admin/features"
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/features') ? 'text-raynold-red' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className="font-bold text-xs">Ventajas (Features)</span>
                </Link>
                <Link
                  to="/admin/qr"
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/qr') ? 'text-raynold-red' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <QrCode size={14} />
                  <span className="font-bold text-xs">Generador QR</span>
                </Link>
                <Link
                  to="/admin/catalog"
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/catalog') ? 'text-raynold-red' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <BookOpen size={14} />
                  <span className="font-bold text-xs">Creador de Catálogos</span>
                </Link>
                <Link
                  to="/admin/payment-links"
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/payment-links') ? 'text-raynold-red' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <CreditCard size={14} />
                  <span className="font-bold text-xs">Links de Pago</span>
                </Link>
                <Link
                  to="/admin/settings"
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/settings') ? 'text-raynold-red' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className="font-bold text-xs">Configuración</span>
                </Link>
              </div>
            )}
          </div>
        </nav>
        <div className="p-4 border-t border-white/10 shrink-0 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Home size={18} />
            <span className="font-bold text-sm">Volver al Sitio</span>
          </Link>
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
      <div className="flex-1 flex flex-col h-full relative overflow-hidden print:w-full print:absolute print:inset-0 print:bg-white">

        {/* Global Admin Header */}
        <div className="h-16 border-b border-white/10 bg-[#0A0A0A] flex items-center px-6 shrink-0 z-50 print:hidden relative gap-3">

          {/* Left spacer */}
          <div className="w-12 shrink-0" />

          {/* Centered Global Search */}
          <div className="flex-1 max-w-2xl mx-auto relative flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar clientes, facturas, productos, gastos..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(e.target.value.length > 1);
                }}
                className="w-full bg-black border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:border-raynold-red focus:outline-none transition-colors"
              />
            </div>

            {/* Circular Add Button */}
            <div className="relative">
              <button
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${isAddMenuOpen ? 'bg-white text-black rotate-45' : 'bg-raynold-red text-white hover:bg-red-700'}`}
                title="Crear nuevo"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>

              {isAddMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsAddMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1">
                    <Link to="/admin/pos?type=factura" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setIsAddMenuOpen(false)}>
                      <Receipt size={16} className="text-blue-400" />
                      Factura
                    </Link>
                    <Link to="/admin/pos?type=cotizacion" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setIsAddMenuOpen(false)}>
                      <FileText size={16} className="text-yellow-400" />
                      Cotización
                    </Link>
                    <div className="h-px bg-white/10 my-1"></div>
                    <Link to="/admin/clients" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setIsAddMenuOpen(false)}>
                      <User size={16} className="text-green-400" />
                      Cliente
                    </Link>
                    <div className="h-px bg-white/10 my-1"></div>
                    <Link to="/admin/products" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setIsAddMenuOpen(false)}>
                      <Package size={16} className="text-purple-400" />
                      Producto
                    </Link>
                    <Link to="/admin/expenses" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setIsAddMenuOpen(false)}>
                      <File size={16} className="text-red-400" />
                      Gasto
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearchOpen && (
              <div className="absolute top-full mt-2 w-full bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] max-h-[70vh] flex flex-col">
                {isSearching ? (
                  <div className="p-8 flex flex-col items-center justify-center text-gray-500 gap-3">
                    <Loader2 className="animate-spin text-raynold-red" size={24} />
                    <span className="text-sm font-bold animate-pulse">Buscando "{searchQuery}"...</span>
                  </div>
                ) : searchResults.clients.length === 0 && searchResults.products.length === 0 && searchResults.invoices.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    No se encontraron resultados para "{searchQuery}"
                  </div>
                ) : (
                  <div className="overflow-y-auto scrollbar-modern p-2">
                    {/* Invoices */}
                    {searchResults.invoices.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider bg-white/5 rounded mx-1 mb-1">
                          Documentos ({searchResults.invoices.length})
                        </div>
                        {searchResults.invoices.map((inv) => (
                          <button
                            key={inv.id}
                            onClick={() => {
                              navigate('/admin/invoices');
                              setSearchQuery('');
                              setIsSearchOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${inv.type === 'FACTURA' ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                {inv.type === 'FACTURA' ? <Receipt size={16} /> : <FileText size={16} />}
                              </div>
                              <div>
                                <p className="text-white text-sm font-bold flex items-center gap-2">
                                  #{inv.number}
                                  <span className="text-[10px] bg-white/10 px-1.5 rounded uppercase">{inv.type}</span>
                                </p>
                                <p className="text-gray-400 text-xs truncate max-w-[200px]">{inv.client_name}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Clients */}
                    {searchResults.clients.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider bg-white/5 rounded mx-1 mb-1">
                          Clientes ({searchResults.clients.length})
                        </div>
                        {searchResults.clients.map((client) => (
                          <button
                            key={client.id}
                            onClick={() => {
                              navigate('/admin/clients');
                              setSearchQuery('');
                              setIsSearchOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3"
                          >
                            <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                              <Users size={16} />
                            </div>
                            <div>
                              <p className="text-white text-sm font-bold">{client.name}</p>
                              {client.company && <p className="text-gray-400 text-xs">{client.company}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Products */}
                    {searchResults.products.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider bg-white/5 rounded mx-1 mb-1">
                          Productos y Servicios ({searchResults.products.length})
                        </div>
                        {searchResults.products.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => {
                              navigate('/admin/products');
                              setSearchQuery('');
                              setIsSearchOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3"
                          >
                            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                              <Package size={16} />
                            </div>
                            <div>
                              <p className="text-white text-sm font-bold">{product.title}</p>
                              {product.reference && <p className="text-gray-400 text-xs font-mono">{product.reference}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right spacer */}
          <div className="w-12 shrink-0" />
        </div>

        {/* Scrollable Routes Area */}
        <div className="flex-1 overflow-y-auto scrollbar-modern relative">
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
            <Route path="/process" element={<AdminProcess />} />
            <Route path="/features" element={<AdminFeatures />} />
            <Route path="/reports" element={<AdminReports />} />
            <Route path="/qr" element={<AdminQR />} />
            <Route path="/catalog" element={<AdminCatalog />} />
            <Route path="/payment-links" element={<AdminPaymentLinks />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
