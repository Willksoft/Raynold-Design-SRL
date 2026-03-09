import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    Download, FileText, TrendingUp, TrendingDown, DollarSign,
    Calendar, Filter, Printer, BarChart2, RefreshCw, ChevronDown,
    ShoppingBag, Users, Receipt, Loader2, ArrowUpRight, ArrowDownRight,
    CheckCircle, Clock, XCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DateRange { from: string; to: string; }
interface ReportData {
    invoices: any[];
    expenses: any[];
    payments: any[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

const sumInvoices = (invs: any[]) =>
    invs.reduce((acc, inv) => {
        const subtotal = (inv.items || []).reduce((s: number, it: any) => s + (it.quantity || 0) * (it.unit_price || 0), 0);
        const tax = inv.apply_tax !== false ? subtotal * 0.18 : 0;
        return acc + subtotal + tax;
    }, 0);

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };

const PRESET_RANGES = [
    { label: 'Hoy', from: today(), to: today() },
    { label: 'Este mes', from: monthStart(), to: today() },
    { label: 'Últimos 30 días', from: (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); })(), to: today() },
    { label: 'Últimos 90 días', from: (() => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().slice(0, 10); })(), to: today() },
    { label: 'Este año', from: `${new Date().getFullYear()}-01-01`, to: today() },
];

// ─── CSV Export ───────────────────────────────────────────────────────────────
const exportCSV = (rows: any[][], filename: string) => {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, icon: Icon, color, sub }: { label: string; value: string; icon: any; color: string; sub?: string }) => (
    <div className={`bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex gap-4 items-start`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon size={20} className="text-white" />
        </div>
        <div className="min-w-0">
            <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
            <p className="text-white font-bold text-xl mt-0.5 leading-tight">{value}</p>
            {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminReports: React.FC = () => {
    const [range, setRange] = useState<DateRange>({ from: monthStart(), to: today() });
    const [data, setData] = useState<ReportData>({ invoices: [], expenses: [], payments: [] });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'resumen' | 'facturas' | 'gastos' | 'cobros'>('resumen');
    const [presetOpen, setPresetOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const loadData = async () => {
        setLoading(true);
        const [invRes, expRes] = await Promise.all([
            supabase
                .from('invoices')
                .select('id, number, type, status, payment_status, client_name, created_at, items, apply_tax, payments')
                .gte('created_at', range.from + 'T00:00:00')
                .lte('created_at', range.to + 'T23:59:59')
                .order('created_at', { ascending: false }),
            supabase
                .from('expenses')
                .select('id, description, amount, category, date, supplier')
                .gte('date', range.from)
                .lte('date', range.to)
                .order('date', { ascending: false }),
        ]);
        const payments: any[] = [];
        (invRes.data || []).forEach((inv: any) => {
            (inv.payments || []).forEach((p: any) => {
                if (p.date >= range.from && p.date <= range.to) {
                    payments.push({ ...p, invoiceNumber: inv.number, clientName: inv.client_name });
                }
            });
        });
        setData({ invoices: invRes.data || [], expenses: expRes.data || [], payments });
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [range]);

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const totalFacturado = sumInvoices(data.invoices.filter(i => i.type === 'FACTURA'));
    const totalCotizaciones = sumInvoices(data.invoices.filter(i => i.type === 'COTIZACION'));
    const totalCobrado = data.payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalGastos = data.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const utilidad = totalCobrado - totalGastos;
    const facturasPagadas = data.invoices.filter(i => i.payment_status === 'PAGADO').length;
    const facturasPendientes = data.invoices.filter(i => i.payment_status !== 'PAGADO' && i.type === 'FACTURA').length;

    // ── Export Invoice CSV ─────────────────────────────────────────────────────
    const exportInvoicesCSV = () => {
        const headers = ['N°', 'Tipo', 'Cliente', 'Fecha', 'Subtotal', 'ITBIS', 'Total', 'Estado Pago'];
        const rows = data.invoices.map(inv => {
            const sub = (inv.items || []).reduce((s: number, it: any) => s + (it.quantity || 0) * (it.unit_price || 0), 0);
            const tax = inv.apply_tax !== false ? sub * 0.18 : 0;
            return [inv.number, inv.type, inv.client_name, inv.created_at?.slice(0, 10), sub.toFixed(2), tax.toFixed(2), (sub + tax).toFixed(2), inv.payment_status || '-'];
        });
        exportCSV([headers, ...rows], `facturas_${range.from}_${range.to}.csv`);
    };

    const exportExpensesCSV = () => {
        const headers = ['Descripción', 'Categoría', 'Proveedor', 'Fecha', 'Monto'];
        const rows = data.expenses.map(e => [e.description, e.category || '-', e.supplier || '-', e.date, e.amount]);
        exportCSV([headers, ...rows], `gastos_${range.from}_${range.to}.csv`);
    };

    const exportPaymentsCSV = () => {
        const headers = ['Factura', 'Cliente', 'Fecha', 'Monto', 'Referencia'];
        const rows = data.payments.map(p => [p.invoiceNumber, p.clientName, p.date, p.amount, p.reference || '-']);
        exportCSV([headers, ...rows], `cobros_${range.from}_${range.to}.csv`);
    };

    const exportFullCSV = () => {
        const rows: any[][] = [
            ['=== REPORTE CONTABLE COMPLETO ==='],
            [`Período: ${fmtDate(range.from)} - ${fmtDate(range.to)}`],
            [`Generado: ${new Date().toLocaleString('es-DO')}`],
            [],
            ['=== RESUMEN EJECUTIVO ==='],
            ['Concepto', 'Monto (DOP)'],
            ['Total Facturado', totalFacturado.toFixed(2)],
            ['Total Cobrado', totalCobrado.toFixed(2)],
            ['Total Gastos', totalGastos.toFixed(2)],
            ['Utilidad Neta', utilidad.toFixed(2)],
            [],
            ['=== FACTURAS ==='],
            ['N°', 'Tipo', 'Cliente', 'Fecha', 'Total', 'Estado'],
            ...data.invoices.map(inv => {
                const sub = (inv.items || []).reduce((s: number, it: any) => s + (it.quantity || 0) * (it.unit_price || 0), 0);
                const tax = inv.apply_tax !== false ? sub * 0.18 : 0;
                return [inv.number, inv.type, inv.client_name, inv.created_at?.slice(0, 10), (sub + tax).toFixed(2), inv.payment_status || '-'];
            }),
            [],
            ['=== GASTOS ==='],
            ['Descripción', 'Categoría', 'Fecha', 'Monto'],
            ...data.expenses.map(e => [e.description, e.category || '-', e.date, e.amount]),
            [],
            ['=== COBROS RECIBIDOS ==='],
            ['Factura', 'Cliente', 'Fecha', 'Monto'],
            ...data.payments.map(p => [p.invoiceNumber, p.clientName, p.date, p.amount]),
        ];
        exportCSV(rows, `reporte_contable_${range.from}_${range.to}.csv`);
    };

    const handlePrint = () => window.print();

    // ── Badge helpers ─────────────────────────────────────────────────────────
    const payBadge = (s: string) => {
        if (s === 'PAGADO') return 'bg-green-900/50 text-green-300 border border-green-700/40';
        if (s === 'PARCIAL') return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/40';
        return 'bg-red-900/50 text-red-300 border border-red-700/40';
    };

    return (
        <div className="p-6 md:p-10 print:p-4" ref={printRef}>
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-futuristic font-bold text-white mb-1">Reportes Contables</h1>
                    <p className="text-gray-400 text-sm">Super Reporte · Exportable en múltiples formatos</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors print:hidden"
                    >
                        <Printer size={16} /> Imprimir
                    </button>
                    <button
                        onClick={exportFullCSV}
                        className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors print:hidden"
                    >
                        <Download size={16} /> Exportar Todo (CSV)
                    </button>
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg flex items-center gap-2 transition-colors print:hidden"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center print:hidden">
                <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={16} />
                    <span className="text-sm font-medium">Período:</span>
                </div>
                <input
                    type="date"
                    value={range.from}
                    onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-raynold-red"
                />
                <span className="text-gray-500">→</span>
                <input
                    type="date"
                    value={range.to}
                    onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-raynold-red"
                />

                {/* Presets */}
                <div className="relative">
                    <button
                        onClick={() => setPresetOpen(o => !o)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/20 transition-colors"
                    >
                        <Filter size={14} /> Rápido <ChevronDown size={13} />
                    </button>
                    {presetOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setPresetOpen(false)} />
                            <div className="absolute left-0 top-full mt-1 w-44 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden py-1">
                                {PRESET_RANGES.map(p => (
                                    <button
                                        key={p.label}
                                        onClick={() => { setRange({ from: p.from, to: p.to }); setPresetOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {loading && <Loader2 size={18} className="animate-spin text-gray-400" />}
                <span className="ml-auto text-xs text-gray-500">
                    {fmtDate(range.from)} — {fmtDate(range.to)}
                </span>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KPICard label="Total Facturado" value={fmt(totalFacturado)} icon={Receipt} color="bg-blue-700" sub={`${data.invoices.filter(i => i.type === 'FACTURA').length} facturas`} />
                <KPICard label="Total Cobrado" value={fmt(totalCobrado)} icon={DollarSign} color="bg-green-700" sub={`${facturasPagadas} pagadas`} />
                <KPICard label="Total Gastos" value={fmt(totalGastos)} icon={TrendingDown} color="bg-red-700" sub={`${data.expenses.length} registros`} />
                <KPICard
                    label="Utilidad Neta"
                    value={fmt(utilidad)}
                    icon={utilidad >= 0 ? TrendingUp : TrendingDown}
                    color={utilidad >= 0 ? 'bg-emerald-700' : 'bg-orange-700'}
                    sub={utilidad >= 0 ? 'Ganancia' : 'Pérdida'}
                />
            </div>

            {/* ── Secondary KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {[
                    { label: 'Cotizaciones', val: fmt(totalCotizaciones), icon: FileText, color: 'text-yellow-400' },
                    { label: 'Facturas pendientes', val: facturasPendientes, icon: Clock, color: 'text-orange-400' },
                    { label: 'Cobros registrados', val: data.payments.length, icon: CheckCircle, color: 'text-green-400' },
                    { label: 'Porcentaje cobrado', val: totalFacturado > 0 ? `${Math.round((totalCobrado / totalFacturado) * 100)}%` : '—', icon: BarChart2, color: 'text-blue-400' },
                ].map(k => (
                    <div key={k.label} className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4">
                        <p className="text-gray-500 text-xs">{k.label}</p>
                        <p className={`font-bold text-lg mt-1 ${k.color}`}>{k.val}</p>
                    </div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-2 mb-4 border-b border-white/10 print:hidden">
                {(['resumen', 'facturas', 'gastos', 'cobros'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === t
                                ? 'border-raynold-red text-white'
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {t === 'resumen' ? 'Resumen' : t === 'facturas' ? `Facturas (${data.invoices.length})` : t === 'gastos' ? `Gastos (${data.expenses.length})` : `Cobros (${data.payments.length})`}
                    </button>
                ))}
            </div>

            {/* ── Resumen Tab ── */}
            {activeTab === 'resumen' && (
                <div className="space-y-6">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="font-bold text-white">Resumen Ejecutivo</h2>
                            <span className="text-xs text-gray-500">{fmtDate(range.from)} — {fmtDate(range.to)}</span>
                        </div>
                        <div className="p-6 space-y-3">
                            {[
                                { label: 'Ingresos Brutos (facturado)', val: totalFacturado, positive: true },
                                { label: 'Cobros Efectivos Recibidos', val: totalCobrado, positive: true },
                                { label: 'Por Cobrar (pendiente)', val: totalFacturado - totalCobrado, positive: false },
                                { label: 'Gastos Operativos', val: totalGastos, positive: false },
                                { label: 'Utilidad Neta (Cobrado - Gastos)', val: utilidad, positive: utilidad >= 0 },
                                { label: 'Cotizaciones Emitidas', val: totalCotizaciones, positive: true },
                            ].map(row => (
                                <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-gray-400 text-sm">{row.label}</span>
                                    <span className={`font-bold font-mono ${row.positive ? 'text-green-400' : 'text-red-400'}`}>
                                        {fmt(row.val)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Facturas Tab ── */}
            {activeTab === 'facturas' && (
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="font-bold text-white">Facturas y Cotizaciones</h2>
                        <button onClick={exportInvoicesCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors">
                            <Download size={13} /> CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 text-xs uppercase border-b border-white/10">
                                    <th className="text-left px-6 py-3">N°</th>
                                    <th className="text-left px-4 py-3">Tipo</th>
                                    <th className="text-left px-4 py-3">Cliente</th>
                                    <th className="text-left px-4 py-3">Fecha</th>
                                    <th className="text-right px-4 py-3">Subtotal</th>
                                    <th className="text-right px-4 py-3">ITBIS</th>
                                    <th className="text-right px-4 py-3">Total</th>
                                    <th className="text-center px-4 py-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.invoices.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-12 text-gray-600">Sin registros en este período</td></tr>
                                ) : data.invoices.map(inv => {
                                    const sub = (inv.items || []).reduce((s: number, it: any) => s + (it.quantity || 0) * (it.unit_price || 0), 0);
                                    const tax = inv.apply_tax !== false ? sub * 0.18 : 0;
                                    return (
                                        <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="px-6 py-3 font-mono text-white font-bold">{inv.number}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${inv.type === 'FACTURA' ? 'bg-blue-900/40 text-blue-300 border-blue-700/40' : 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40'}`}>{inv.type}</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-300">{inv.client_name}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{inv.created_at?.slice(0, 10)}</td>
                                            <td className="px-4 py-3 text-right text-gray-300 font-mono">{fmt(sub)}</td>
                                            <td className="px-4 py-3 text-right text-gray-500 font-mono">{fmt(tax)}</td>
                                            <td className="px-4 py-3 text-right text-white font-bold font-mono">{fmt(sub + tax)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${payBadge(inv.payment_status)}`}>{inv.payment_status || 'PENDIENTE'}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="border-t border-white/20">
                                <tr>
                                    <td colSpan={6} className="px-6 py-3 text-right text-gray-400 text-sm font-bold">TOTAL FACTURADO:</td>
                                    <td className="px-4 py-3 text-right text-green-400 font-bold font-mono">{fmt(totalFacturado)}</td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Gastos Tab ── */}
            {activeTab === 'gastos' && (
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="font-bold text-white">Gastos Operativos</h2>
                        <button onClick={exportExpensesCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors">
                            <Download size={13} /> CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 text-xs uppercase border-b border-white/10">
                                    <th className="text-left px-6 py-3">Descripción</th>
                                    <th className="text-left px-4 py-3">Categoría</th>
                                    <th className="text-left px-4 py-3">Proveedor</th>
                                    <th className="text-left px-4 py-3">Fecha</th>
                                    <th className="text-right px-6 py-3">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.expenses.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-600">Sin registros en este período</td></tr>
                                ) : data.expenses.map(e => (
                                    <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="px-6 py-3 text-white">{e.description}</td>
                                        <td className="px-4 py-3 text-gray-400">{e.category || '—'}</td>
                                        <td className="px-4 py-3 text-gray-500">{e.supplier || '—'}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{e.date}</td>
                                        <td className="px-6 py-3 text-right text-red-400 font-bold font-mono">{fmt(e.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t border-white/20">
                                <tr>
                                    <td colSpan={4} className="px-6 py-3 text-right text-gray-400 font-bold text-sm">TOTAL GASTOS:</td>
                                    <td className="px-6 py-3 text-right text-red-400 font-bold font-mono">{fmt(totalGastos)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Cobros Tab ── */}
            {activeTab === 'cobros' && (
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="font-bold text-white">Cobros Recibidos</h2>
                        <button onClick={exportPaymentsCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors">
                            <Download size={13} /> CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 text-xs uppercase border-b border-white/10">
                                    <th className="text-left px-6 py-3">Factura</th>
                                    <th className="text-left px-4 py-3">Cliente</th>
                                    <th className="text-left px-4 py-3">Fecha</th>
                                    <th className="text-left px-4 py-3">Referencia</th>
                                    <th className="text-right px-6 py-3">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.payments.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-600">Sin cobros en este período</td></tr>
                                ) : data.payments.map((p, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="px-6 py-3 font-mono text-white font-bold">{p.invoiceNumber}</td>
                                        <td className="px-4 py-3 text-gray-300">{p.clientName}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{p.date}</td>
                                        <td className="px-4 py-3 text-gray-500">{p.reference || '—'}</td>
                                        <td className="px-6 py-3 text-right text-green-400 font-bold font-mono">{fmt(p.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t border-white/20">
                                <tr>
                                    <td colSpan={4} className="px-6 py-3 text-right text-gray-400 font-bold text-sm">TOTAL COBRADO:</td>
                                    <td className="px-6 py-3 text-right text-green-400 font-bold font-mono">{fmt(totalCobrado)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Print footer */}
            <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-gray-400 text-center">
                <p>Raynold Design SRL · Reporte generado el {new Date().toLocaleString('es-DO')} · Período: {fmtDate(range.from)} — {fmtDate(range.to)}</p>
            </div>
        </div>
    );
};

export default AdminReports;
