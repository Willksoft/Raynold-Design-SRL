import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    Download, FileText, TrendingUp, TrendingDown, DollarSign,
    Calendar, Filter, Printer, BarChart2, RefreshCw, ChevronDown,
    Receipt, Loader2, CheckCircle, Clock, AlertTriangle, Shield,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DateRange { from: string; to: string; }
interface ReportData { invoices: any[]; expenses: any[]; payments: any[]; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtNum = (n: number) => n.toFixed(2);

const invSubtotal = (inv: any) =>
    (inv.items || []).reduce((s: number, it: any) => s + (it.quantity || 0) * (it.unit_price || 0), 0);
const invTax = (inv: any) => {
    const sub = invSubtotal(inv);
    return inv.apply_tax !== false ? sub * 0.18 : 0;
};
const invTotal = (inv: any) => invSubtotal(inv) + invTax(inv);

const sumInvoices = (invs: any[]) => invs.reduce((a, i) => a + invTotal(i), 0);

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };
const periodStr = (from: string) => from.slice(0, 7).replace('-', ''); // AAAAMM

const PRESET_RANGES = [
    { label: 'Hoy', from: today(), to: today() },
    { label: 'Este mes', from: monthStart(), to: today() },
    { label: 'Últimos 30 días', from: (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); })(), to: today() },
    { label: 'Últimos 90 días', from: (() => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().slice(0, 10); })(), to: today() },
    { label: 'Este año', from: `${new Date().getFullYear()}-01-01`, to: today() },
];

// ─── Export helpers ───────────────────────────────────────────────────────────
const downloadText = (content: string, filename: string, mime = 'text/plain') => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
};
const exportCSV = (rows: any[][], filename: string) => {
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadText('\ufeff' + csv, filename, 'text/csv');
};
// Pipe-delimited (formato DGII)
const exportPipe = (rows: any[][], filename: string) => {
    const txt = rows.map(r => r.map(c => String(c ?? '').replace(/\|/g, '')).join('|')).join('\r\n');
    downloadText(txt, filename, 'text/plain');
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, icon: Icon, color, sub }: { label: string; value: string; icon: any; color: string; sub?: string }) => (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex gap-4 items-start">
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

// ─── DGII Report Card ─────────────────────────────────────────────────────────
const DGIICard = ({ code, title, desc, color, onExportCSV, onExportTXT, count }:
    { code: string; title: string; desc: string; color: string; onExportCSV: () => void; onExportTXT: () => void; count: number }) => (
    <div className={`bg-[#0A0A0A] border ${color} rounded-xl overflow-hidden`}>
        <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded mb-1 ${color.replace('border-', 'bg-').replace('/40', '/20')} ${color.replace('border-', 'text-').replace('/40', '')}`}>
                        Formato {code}
                    </span>
                    <h3 className="text-white font-bold text-base">{title}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                </div>
                <span className="text-2xl font-bold text-gray-400 tabular-nums">{count}</span>
            </div>
            <div className="flex gap-2 mt-4">
                <button
                    onClick={onExportCSV}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors"
                >
                    <Download size={13} /> CSV
                </button>
                <button
                    onClick={onExportTXT}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors"
                >
                    <FileText size={13} /> TXT (DGII)
                </button>
            </div>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminReports: React.FC = () => {
    const [range, setRange] = useState<DateRange>({ from: monthStart(), to: today() });
    const [data, setData] = useState<ReportData>({ invoices: [], expenses: [], payments: [] });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'resumen' | 'facturas' | 'gastos' | 'cobros' | 'dgii'>('resumen');
    const [presetOpen, setPresetOpen] = useState(false);
    const [rnc, setRnc] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    // Load from supabase
    const loadData = async () => {
        setLoading(true);
        const [invRes, expRes] = await Promise.all([
            supabase.from('invoices')
                .select('id, number, type, status, payment_status, client_name, client_rnc, created_at, items, apply_tax, payments, ncf')
                .gte('created_at', range.from + 'T00:00:00')
                .lte('created_at', range.to + 'T23:59:59')
                .order('created_at', { ascending: false }),
            supabase.from('expenses')
                .select('id, description, amount, category, date, supplier, supplier_rnc, ncf')
                .gte('date', range.from)
                .lte('date', range.to)
                .order('date', { ascending: false }),
        ]);
        const payments: any[] = [];
        (invRes.data || []).forEach((inv: any) => {
            (inv.payments || []).forEach((p: any) => {
                if (p.date >= range.from && p.date <= range.to)
                    payments.push({ ...p, invoiceNumber: inv.number, clientName: inv.client_name });
            });
        });
        setData({ invoices: invRes.data || [], expenses: expRes.data || [], payments });
        setLoading(false);
    };
    useEffect(() => { loadData(); }, [range]);

    // ── Computed values ────────────────────────────────────────────────────────
    const facturas = data.invoices.filter(i => i.type === 'FACTURA' && i.status !== 'ANULADA');
    const anuladas = data.invoices.filter(i => i.status === 'ANULADA');
    const totalFacturado = sumInvoices(facturas);
    const totalCotizaciones = sumInvoices(data.invoices.filter(i => i.type === 'COTIZACION'));
    const totalCobrado = data.payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalGastos = data.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const utilidad = totalCobrado - totalGastos;
    const totalITBIS606 = facturas.reduce((s, i) => s + invTax(i), 0);
    const totalITBIS607 = data.expenses.reduce((s, e) => s + ((e.amount || 0) * 0.18), 0);
    const facturasPagadas = data.invoices.filter(i => i.payment_status === 'PAGADO').length;
    const facturasPendientes = data.invoices.filter(i => i.payment_status !== 'PAGADO' && i.type === 'FACTURA').length;
    const period = periodStr(range.from);

    // ── 606 Ventas ─────────────────────────────────────────────────────────────
    const build606Rows = () => facturas.map(inv => {
        const sub = invSubtotal(inv);
        const tax = invTax(inv);
        const ncf = inv.ncf || inv.number || '';
        const rncCliente = inv.client_rnc || '';
        const tipoId = rncCliente.length === 9 ? '1' : rncCliente.length === 11 ? '2' : '3';
        const tipoBS = '01'; // bienes y servicios
        return [
            rnc || 'TU-RNC-AQUI',   // RNC Informante
            period,                  // Período
            ncf,                     // NCF
            '',                      // NCF Modificado
            tipoId,                  // Tipo Identificación
            rncCliente,              // RNC/Cédula Comprador
            tipoBS,                  // Tipo Bienes o Servicios
            fmtNum(sub),             // Monto Facturado
            fmtNum(tax),             // ITBIS Facturado
            '0.00',                  // ITBIS Retenido
            '0.00',                  // ITBIS Percibido
            '0.00',                  // ITBIS Sujeto Proporcionalidad
            '0.00',                  // ITBIS Llevado Costo
            '0.00',                  // ITBIS Adelantar
            '0.00',                  // ITBIS Percibido Terceros
            '0.00',                  // ISR Retenido
            '0.00',                  // Impuesto Selectivo al Consumo
            '0.00',                  // Otros Impuestos/Tasas
            '0.00',                  // Monto Propina Legal
            inv.created_at?.slice(0, 10) || '', // Fecha/Hora de Pago
        ];
    });

    const headers606 = [
        'RNC Informante', 'Período', 'NCF', 'NCF Modificado', 'Tipo Identificación',
        'RNC/Cédula Comprador', 'Tipo Bienes/Servicios', 'Monto Facturado',
        'ITBIS Facturado', 'ITBIS Retenido', 'ITBIS Percibido', 'ITBIS Proporcionalidad',
        'ITBIS Al Costo', 'ITBIS Adelantar', 'ITBIS Terceros', 'ISR Retenido',
        'ISC', 'Otros Impuestos', 'Propina Legal', 'Fecha Pago',
    ];

    // ── 607 Compras ────────────────────────────────────────────────────────────
    const build607Rows = () => data.expenses.map(e => {
        const monto = e.amount || 0;
        const itbis = monto * 0.18;
        const rncProv = e.supplier_rnc || '';
        const tipoId = rncProv.length === 9 ? '1' : rncProv.length === 11 ? '2' : '3';
        return [
            rnc || 'TU-RNC-AQUI',
            period,
            e.ncf || '',
            '',
            tipoId,
            rncProv,
            e.supplier || e.description || '',
            '01',            // Tipo bienes/servicios
            fmtNum(monto),   // Monto Facturado
            fmtNum(itbis),   // ITBIS Facturado
            '0.00',          // ITBIS Retenido
            '0.00',          // ITBIS Anticipado
            '0.00',          // ISR Retenido
            '0.00',          // ISC
            '0.00',          // Otros impuestos
            e.date || '',    // Fecha pago
        ];
    });

    const headers607 = [
        'RNC Informante', 'Período', 'NCF Proveedor', 'NCF Modificado', 'Tipo Identificación',
        'RNC/Cédula Proveedor', 'Nombre Proveedor', 'Tipo Bienes/Servicios', 'Monto Facturado',
        'ITBIS Facturado', 'ITBIS Retenido', 'ITBIS Anticipado', 'ISR Retenido', 'ISC',
        'Otros Impuestos', 'Fecha Pago',
    ];

    // ── 608 Anulaciones ────────────────────────────────────────────────────────
    const build608Rows = () => anuladas.map(inv => [
        rnc || 'TU-RNC-AQUI',
        period,
        inv.ncf || inv.number || '',
        inv.created_at?.slice(0, 10) || '',
    ]);
    const headers608 = ['RNC Informante', 'Período', 'NCF Anulado', 'Fecha Anulación'];

    // ── 609 Pagos al Exterior ──────────────────────────────────────────────────
    // (placeholder — requires foreign supplier data)
    const build609Rows = () => [[
        rnc || 'TU-RNC-AQUI', period, '', '', '', '0.00', '0.00', '0.00',
    ]];
    const headers609 = ['RNC Informante', 'Período', 'Nombre Beneficiario', 'Tipo Renta',
        'País Residencia', 'Monto Pagado', 'ISR Retenido', 'ITBIS Retenido'];

    // ── IT-1 (Resumen ITBIS mensual) ───────────────────────────────────────────
    const buildIT1 = () => {
        const itbisDebito = totalITBIS606;
        const itbisCredito = totalITBIS607;
        const itbisApagar = Math.max(0, itbisDebito - itbisCredito);
        return [
            ['IT-1 — DECLARACIÓN JURADA DEL ITBIS', ''],
            ['Período Fiscal', period],
            ['RNC del Contribuyente', rnc || 'TU-RNC-AQUI'],
            ['', ''],
            ['DESCRIPCIÓN', 'MONTO (DOP)'],
            ['1. Total Ventas Gravadas (Base Imponible)', fmtNum(facturas.reduce((s, i) => s + invSubtotal(i), 0))],
            ['2. ITBIS Generado en Ventas (Débito Fiscal)', fmtNum(itbisDebito)],
            ['3. Total Compras Afectadas al ITBIS', fmtNum(data.expenses.reduce((s, e) => s + (e.amount || 0), 0))],
            ['4. ITBIS en Compras (Crédito Fiscal)', fmtNum(itbisCredito)],
            ['5. ITBIS a Pagar (Débito - Crédito)', fmtNum(itbisApagar)],
            ['6. Cantidad de Comprobantes de Ventas', String(facturas.length)],
            ['7. Cantidad de Comprobantes de Compras', String(data.expenses.length)],
            ['8. Cantidad de Comprobantes Anulados', String(anuladas.length)],
        ];
    };

    // ── Export full accounting ─────────────────────────────────────────────────
    const exportFullCSV = () => {
        const rows: any[][] = [
            ['RAYNOLD DESIGN SRL — REPORTE CONTABLE COMPLETO'],
            [`Período: ${fmtDate(range.from)} al ${fmtDate(range.to)}`],
            [`Generado: ${new Date().toLocaleString('es-DO')}`],
            [],
            ['RESUMEN'],
            ['Concepto', 'Monto (DOP)'],
            ['Total Facturado', fmtNum(totalFacturado)],
            ['ITBIS Ventas', fmtNum(totalITBIS606)],
            ['Total Cobrado', fmtNum(totalCobrado)],
            ['Total Gastos', fmtNum(totalGastos)],
            ['Utilidad Neta', fmtNum(utilidad)],
            [],
            ['FACTURAS'], [headers606], ...build606Rows(),
            [], ['GASTOS/COMPRAS'], [headers607], ...build607Rows(),
            [], ['ANULACIONES'], [headers608], ...build608Rows(),
            [], ['IT-1 RESUMEN ITBIS'], ...buildIT1(),
        ];
        exportCSV(rows, `reporte_completo_${range.from}_${range.to}.csv`);
    };

    const payBadge = (s: string) => {
        if (s === 'PAGADO') return 'bg-green-900/50 text-green-300 border border-green-700/40';
        if (s === 'PARCIAL') return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/40';
        return 'bg-red-900/50 text-red-300 border border-red-700/40';
    };

    // ─────────────────────────────────────────────────────────────────────────────
    const TABS = [
        { id: 'resumen', label: 'Resumen' },
        { id: 'facturas', label: `Facturas (${data.invoices.length})` },
        { id: 'gastos', label: `Gastos (${data.expenses.length})` },
        { id: 'cobros', label: `Cobros (${data.payments.length})` },
        { id: 'dgii', label: '🏛 DGII' },
    ] as const;

    return (
        <div className="p-6 md:p-10 print:p-4" ref={printRef}>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-futuristic font-bold text-white mb-1">Reportes Contables</h1>
                    <p className="text-gray-400 text-sm">Super Reporte · DGII · Exportable en múltiples formatos</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => window.print()} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg flex items-center gap-2 transition-colors print:hidden">
                        <Printer size={16} /> Imprimir
                    </button>
                    <button onClick={exportFullCSV} className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors print:hidden">
                        <Download size={16} /> Exportar Todo
                    </button>
                    <button onClick={loadData} disabled={loading} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg flex items-center gap-2 transition-colors print:hidden">
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center print:hidden">
                <Calendar size={15} className="text-gray-500" />
                <input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-raynold-red" />
                <span className="text-gray-500">→</span>
                <input type="date" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-raynold-red" />
                <div className="relative">
                    <button onClick={() => setPresetOpen(o => !o)} className="flex items-center gap-1 px-3 py-1.5 bg-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/20 transition-colors">
                        <Filter size={13} /> Rápido <ChevronDown size={12} />
                    </button>
                    {presetOpen && (
                        <><div className="fixed inset-0 z-10" onClick={() => setPresetOpen(false)} />
                            <div className="absolute left-0 top-full mt-1 w-44 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden py-1">
                                {PRESET_RANGES.map(p => (
                                    <button key={p.label} onClick={() => { setRange({ from: p.from, to: p.to }); setPresetOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors">{p.label}</button>
                                ))}
                            </div></>
                    )}
                </div>
                {loading && <Loader2 size={17} className="animate-spin text-gray-400" />}
                <span className="ml-auto text-xs text-gray-500">{fmtDate(range.from)} — {fmtDate(range.to)}</span>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KPICard label="Total Facturado" value={fmt(totalFacturado)} icon={Receipt} color="bg-blue-700" sub={`${facturas.length} facturas`} />
                <KPICard label="ITBIS Ventas (606)" value={fmt(totalITBIS606)} icon={Shield} color="bg-amber-700" sub="Débito fiscal" />
                <KPICard label="ITBIS Compras (607)" value={fmt(totalITBIS607)} icon={Shield} color="bg-purple-700" sub="Crédito fiscal" />
                <KPICard label="ITBIS a Pagar" value={fmt(Math.max(0, totalITBIS606 - totalITBIS607))} icon={AlertTriangle}
                    color={totalITBIS606 > totalITBIS607 ? 'bg-red-700' : 'bg-emerald-700'} sub="IT-1 estimado" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KPICard label="Total Cobrado" value={fmt(totalCobrado)} icon={DollarSign} color="bg-green-700" sub={`${facturasPagadas} pagadas`} />
                <KPICard label="Total Gastos" value={fmt(totalGastos)} icon={TrendingDown} color="bg-red-700" sub={`${data.expenses.length} registros`} />
                <KPICard label="Utilidad Neta" value={fmt(utilidad)} icon={utilidad >= 0 ? TrendingUp : TrendingDown}
                    color={utilidad >= 0 ? 'bg-emerald-700' : 'bg-orange-700'} sub={utilidad >= 0 ? 'Ganancia' : 'Pérdida'} />
                <KPICard label="Anulaciones (608)" value={String(anuladas.length)} icon={FileText} color="bg-gray-700" sub="NCF anulados" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b border-white/10 print:hidden overflow-x-auto">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === t.id ? 'border-raynold-red text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── RESUMEN TAB ── */}
            {activeTab === 'resumen' && (
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="font-bold text-white">Resumen Ejecutivo</h2>
                        <span className="text-xs text-gray-500">{fmtDate(range.from)} — {fmtDate(range.to)}</span>
                    </div>
                    <div className="p-6 space-y-3">
                        {[
                            { l: 'Ingresos Brutos Facturados', v: totalFacturado, pos: true },
                            { l: 'ITBIS Débito (en ventas)', v: totalITBIS606, pos: true },
                            { l: 'Cobros Efectivos Recibidos', v: totalCobrado, pos: true },
                            { l: 'Por Cobrar (pendiente)', v: totalFacturado - totalCobrado, pos: false },
                            { l: 'Gastos Operativos', v: totalGastos, pos: false },
                            { l: 'ITBIS Crédito (en compras)', v: totalITBIS607, pos: false },
                            { l: 'ITBIS a Pagar (IT-1 estimado)', v: Math.max(0, totalITBIS606 - totalITBIS607), pos: false },
                            { l: 'Utilidad Neta (Cobrado − Gastos)', v: utilidad, pos: utilidad >= 0 },
                            { l: 'Cotizaciones Emitidas', v: totalCotizaciones, pos: true },
                        ].map(row => (
                            <div key={row.l} className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400 text-sm">{row.l}</span>
                                <span className={`font-bold font-mono ${row.pos ? 'text-green-400' : 'text-red-400'}`}>{fmt(row.v)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── FACTURAS TAB ── */}
            {activeTab === 'facturas' && (
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="font-bold text-white">Facturas y Cotizaciones</h2>
                        <button onClick={() => exportCSV([headers606, ...build606Rows()], `facturas_${period}.csv`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors">
                            <Download size={13} /> CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-gray-500 text-xs uppercase border-b border-white/10">
                                {['N°/NCF', 'Tipo', 'Cliente', 'RNC', 'Fecha', 'Subtotal', 'ITBIS', 'Total', 'Estado'].map(h => (
                                    <th key={h} className="text-left px-4 py-3">{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {data.invoices.length === 0
                                    ? <tr><td colSpan={9} className="text-center py-10 text-gray-600">Sin registros</td></tr>
                                    : data.invoices.map(inv => {
                                        const sub = invSubtotal(inv); const tax = invTax(inv);
                                        return (
                                            <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="px-4 py-3 font-mono text-white text-xs">{inv.ncf || inv.number}</td>
                                                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${inv.type === 'FACTURA' ? 'bg-blue-900/40 text-blue-300 border-blue-700/40' : inv.status === 'ANULADA' ? 'bg-red-900/40 text-red-300 border-red-700/40' : 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40'}`}>{inv.status === 'ANULADA' ? 'ANULADA' : inv.type}</span></td>
                                                <td className="px-4 py-3 text-gray-300 max-w-[140px] truncate">{inv.client_name}</td>
                                                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{inv.client_rnc || '—'}</td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{inv.created_at?.slice(0, 10)}</td>
                                                <td className="px-4 py-3 text-right font-mono text-gray-300">{fmt(sub)}</td>
                                                <td className="px-4 py-3 text-right font-mono text-amber-500">{fmt(tax)}</td>
                                                <td className="px-4 py-3 text-right font-bold font-mono text-white">{fmt(sub + tax)}</td>
                                                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${payBadge(inv.payment_status)}`}>{inv.payment_status || 'PENDIENTE'}</span></td>
                                            </tr>);
                                    })}
                            </tbody>
                            <tfoot className="border-t border-white/20">
                                <tr>
                                    <td colSpan={5} className="px-4 py-3 text-right text-gray-400 text-sm font-bold">TOTAL:</td>
                                    <td className="px-4 py-3 text-right font-bold font-mono text-gray-300">{fmt(facturas.reduce((s, i) => s + invSubtotal(i), 0))}</td>
                                    <td className="px-4 py-3 text-right font-bold font-mono text-amber-400">{fmt(totalITBIS606)}</td>
                                    <td className="px-4 py-3 text-right font-bold font-mono text-green-400">{fmt(totalFacturado)}</td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* ── GASTOS TAB ── */}
            {activeTab === 'gastos' && (
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="font-bold text-white">Gastos / Compras</h2>
                        <button onClick={() => exportCSV([headers607, ...build607Rows()], `gastos_607_${period}.csv`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors">
                            <Download size={13} /> CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-gray-500 text-xs uppercase border-b border-white/10">
                                {['Descripción', 'Categoría', 'Proveedor', 'RNC Prov.', 'NCF', 'Fecha', 'Monto', 'ITBIS est.'].map(h => (
                                    <th key={h} className="text-left px-4 py-3">{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {data.expenses.length === 0
                                    ? <tr><td colSpan={8} className="text-center py-10 text-gray-600">Sin registros</td></tr>
                                    : data.expenses.map(e => (
                                        <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="px-4 py-3 text-white max-w-[160px] truncate">{e.description}</td>
                                            <td className="px-4 py-3 text-gray-400">{e.category || '—'}</td>
                                            <td className="px-4 py-3 text-gray-400">{e.supplier || '—'}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.supplier_rnc || '—'}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.ncf || '—'}</td>
                                            <td className="px-4 py-3 text-xs text-gray-500">{e.date}</td>
                                            <td className="px-4 py-3 text-right text-red-400 font-bold font-mono">{fmt(e.amount)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-purple-400">{fmt(e.amount * 0.18)}</td>
                                        </tr>))}
                            </tbody>
                            <tfoot className="border-t border-white/20">
                                <tr>
                                    <td colSpan={6} className="px-4 py-3 text-right text-gray-400 font-bold text-sm">TOTAL:</td>
                                    <td className="px-4 py-3 text-right text-red-400 font-bold font-mono">{fmt(totalGastos)}</td>
                                    <td className="px-4 py-3 text-right text-purple-400 font-bold font-mono">{fmt(totalITBIS607)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* ── COBROS TAB ── */}
            {activeTab === 'cobros' && (
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="font-bold text-white">Cobros Recibidos</h2>
                        <button onClick={() => exportCSV([['Factura', 'Cliente', 'Fecha', 'Monto', 'Referencia'],
                        ...data.payments.map(p => [p.invoiceNumber, p.clientName, p.date, p.amount, p.reference || ''])],
                            `cobros_${period}.csv`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors">
                            <Download size={13} /> CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-gray-500 text-xs uppercase border-b border-white/10">
                                {['Factura', 'Cliente', 'Fecha', 'Referencia', 'Monto'].map(h => <th key={h} className="text-left px-4 py-3">{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {data.payments.length === 0
                                    ? <tr><td colSpan={5} className="text-center py-10 text-gray-600">Sin cobros</td></tr>
                                    : data.payments.map((p, i) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="px-4 py-3 font-mono text-white font-bold">{p.invoiceNumber}</td>
                                            <td className="px-4 py-3 text-gray-300">{p.clientName}</td>
                                            <td className="px-4 py-3 text-xs text-gray-500">{p.date}</td>
                                            <td className="px-4 py-3 text-gray-500">{p.reference || '—'}</td>
                                            <td className="px-4 py-3 text-right text-green-400 font-bold font-mono">{fmt(p.amount)}</td>
                                        </tr>))}
                            </tbody>
                            <tfoot className="border-t border-white/20">
                                <tr>
                                    <td colSpan={4} className="px-4 py-3 text-right text-gray-400 font-bold text-sm">TOTAL COBRADO:</td>
                                    <td className="px-4 py-3 text-right text-green-400 font-bold font-mono">{fmt(totalCobrado)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* ── DGII TAB ── */}
            {activeTab === 'dgii' && (
                <div className="space-y-6">
                    {/* RNC settings */}
                    <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 flex flex-wrap items-center gap-4">
                        <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-amber-300 text-sm font-bold">Configurar RNC del contribuyente</p>
                            <p className="text-amber-400/70 text-xs">El RNC se incluye en todos los formatos DGII exportados.</p>
                        </div>
                        <input
                            value={rnc}
                            onChange={e => setRnc(e.target.value)}
                            placeholder="Ej: 1-31-12345-6"
                            className="bg-black/50 border border-amber-700/50 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-400 font-mono w-48"
                        />
                    </div>

                    {/* DGII cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DGIICard
                            code="606"
                            title="Reporte de Ventas"
                            desc="Comprobantes fiscales emitidos a clientes. Incluye NCF, RNC comprador, montos e ITBIS."
                            color="border-blue-600/40"
                            count={facturas.length}
                            onExportCSV={() => exportCSV([headers606, ...build606Rows()], `606_ventas_${period}.csv`)}
                            onExportTXT={() => exportPipe([headers606, ...build606Rows()], `606_ventas_${period}.txt`)}
                        />
                        <DGIICard
                            code="607"
                            title="Reporte de Compras"
                            desc="Comprobantes fiscales recibidos de proveedores. Incluye RNC proveedor, NCF y crédito fiscal."
                            color="border-purple-600/40"
                            count={data.expenses.length}
                            onExportCSV={() => exportCSV([headers607, ...build607Rows()], `607_compras_${period}.csv`)}
                            onExportTXT={() => exportPipe([headers607, ...build607Rows()], `607_compras_${period}.txt`)}
                        />
                        <DGIICard
                            code="608"
                            title="Reporte de Anulaciones"
                            desc="NCF anulados en el período. Requerido cuando hay comprobantes cancelados."
                            color="border-red-600/40"
                            count={anuladas.length}
                            onExportCSV={() => exportCSV([headers608, ...build608Rows()], `608_anulaciones_${period}.csv`)}
                            onExportTXT={() => exportPipe([headers608, ...build608Rows()], `608_anulaciones_${period}.txt`)}
                        />
                        <DGIICard
                            code="609"
                            title="Pagos al Exterior"
                            desc="Pagos realizados a personas o empresas en el exterior. Requiere datos adicionales del proveedor."
                            color="border-orange-600/40"
                            count={0}
                            onExportCSV={() => exportCSV([headers609, ...build609Rows()], `609_exterior_${period}.csv`)}
                            onExportTXT={() => exportPipe([headers609, ...build609Rows()], `609_exterior_${period}.txt`)}
                        />
                    </div>

                    {/* IT-1 Card */}
                    <div className="bg-[#0A0A0A] border border-amber-600/40 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-900/30 text-amber-400 border border-amber-700/40">IT-1</span>
                                <h3 className="text-white font-bold mt-1">Declaración Jurada ITBIS</h3>
                                <p className="text-gray-500 text-xs">Resumen mensual del ITBIS a declarar ante la DGII</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => exportCSV(buildIT1(), `IT1_${period}.csv`)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors">
                                    <Download size={13} /> CSV
                                </button>
                                <button onClick={() => exportPipe(buildIT1(), `IT1_${period}.txt`)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors">
                                    <FileText size={13} /> TXT
                                </button>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { l: 'Período Fiscal', v: period, colored: false },
                                { l: 'Base Imponible (Ventas)', v: fmt(facturas.reduce((s, i) => s + invSubtotal(i), 0)), colored: false },
                                { l: 'ITBIS Débito (Ventas)', v: fmt(totalITBIS606), colored: false },
                                { l: 'ITBIS Crédito (Compras)', v: fmt(totalITBIS607), colored: false },
                                { l: 'ITBIS a Pagar', v: fmt(Math.max(0, totalITBIS606 - totalITBIS607)), colored: true },
                                { l: 'Comprobantes Ventas', v: String(facturas.length), colored: false },
                                { l: 'Comprobantes Compras', v: String(data.expenses.length), colored: false },
                                { l: 'Comprobantes Anulados', v: String(anuladas.length), colored: false },
                            ].map(r => (
                                <div key={r.l} className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-gray-500 text-sm">{r.l}</span>
                                    <span className={`font-bold font-mono text-sm ${r.colored ? 'text-red-400' : 'text-white'}`}>{r.v}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info notice */}
                    <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 text-xs text-blue-300 leading-relaxed">
                        <p className="font-bold text-blue-200 mb-1">📋 Instrucciones para subir a la DGII</p>
                        <ol className="list-decimal pl-4 space-y-1 text-blue-300/80">
                            <li>Exporta el archivo <strong>TXT (DGII)</strong> con el formato pipe-delimited requerido.</li>
                            <li>Ingresa a <strong>dgii.gov.do → Servicios → Declaraciones</strong> con tu usuario y clave.</li>
                            <li>Selecciona el período y carga el archivo correspondiente (606, 607, 608 o 609).</li>
                            <li>Para el <strong>IT-1</strong>, completa la declaración directamente en el portal con los valores del resumen.</li>
                            <li>Verifica que el RNC configurado arriba coincida con el de tu empresa.</li>
                        </ol>
                    </div>
                </div>
            )}

            {/* Print footer */}
            <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-gray-400 text-center">
                <p>Raynold Design SRL · RNC: {rnc || '—'} · Reporte DGII generado el {new Date().toLocaleString('es-DO')} · Período {period}</p>
            </div>
        </div>
    );
};

export default AdminReports;
