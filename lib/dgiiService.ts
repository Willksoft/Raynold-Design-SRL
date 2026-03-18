// ─── DGII API Service ─────────────────────────────────────────────────────────
// API de consulta de RNC y búsqueda de contribuyentes de la DGII
// Docs: https://pptonanntevatndjyzmk.supabase.co/functions/v1/dgii-api

const DGII_API_KEY = import.meta.env.VITE_DGII_API_KEY || '';
const DGII_API_URL = import.meta.env.VITE_DGII_API_URL || 'https://pptonanntevatndjyzmk.supabase.co/functions/v1/dgii-api';

export interface DGIIResult {
    rnc: string;
    nombre: string;
    nombre_comercial?: string;
    actividad_economica?: string;
    estado?: string;
    regimen_pagos?: string;
    direccion?: string;
    telefono?: string;
    fecha_constitucion?: string;
    tipo?: string; // Persona Fisica / Persona Juridica
    [key: string]: unknown;
}

export interface DGIISearchResponse {
    data?: DGIIResult[];
    total?: number;
    error?: string;
}

/**
 * Normaliza un resultado de la API de la DGII al formato DGIIResult.
 * La API usa campos como 'categoria', 'regimen', 'estatus' en vez de
 * 'nombre_comercial', 'actividad_economica', 'estado'.
 */
function normalizeDGIIResult(raw: any): DGIIResult {
    return {
        rnc: raw.rnc || raw.id || raw.value || '',
        nombre: raw.nombre || '',
        nombre_comercial: raw.categoria || raw.nombre_comercial || '',
        actividad_economica: raw.regimen || raw.actividad_economica || '',
        estado: raw.estatus || raw.estado || '',
        regimen_pagos: raw.regimen_pagos || '',
        direccion: raw.direccion || '',
        telefono: raw.telefono || '',
        fecha_constitucion: raw.fecha_constitucion || '',
        tipo: raw.tipo || '',
    };
}

/**
 * Consultar un RNC o Cédula específica en la DGII.
 * @param rnc - RNC (9 dígitos) o Cédula (11 dígitos), con o sin guiones
 */
export async function consultarRNC(rnc: string): Promise<DGIIResult | null> {
    try {
        const clean = rnc.replace(/[-\s]/g, '');
        if (!clean || clean.length < 9) return null;

        const response = await fetch(`${DGII_API_URL}/rnc/${clean}`, {
            headers: { 'x-api-key': DGII_API_KEY },
        });

        if (!response.ok) return null;
        const data = await response.json();
        if (!data || !data.rnc) return null;
        return normalizeDGIIResult(data);
    } catch {
        return null;
    }
}

/**
 * Buscar contribuyentes por nombre, provincia, etc.
 * @param filtros - Objeto con campos de búsqueda
 */
export async function buscarContribuyentes(filtros: {
    nombre?: string;
    rnc?: string;
    provincia?: string;
    page?: number;
    limit?: number;
}): Promise<DGIISearchResponse> {
    try {
        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([k, v]) => {
            if (v !== undefined && v !== '') params.append(k, String(v));
        });
        if (!params.has('limit')) params.set('limit', '10');

        const response = await fetch(`${DGII_API_URL}/search?${params}`, {
            headers: { 'x-api-key': DGII_API_KEY },
        });

        if (!response.ok) return { error: 'Error en consulta DGII' };
        const raw = await response.json();
        // Normalize each result in the data array
        const data = (raw?.data || []).map(normalizeDGIIResult);
        return { data, total: raw?.total || data.length };
    } catch {
        return { error: 'No se pudo conectar con la DGII' };
    }
}

/**
 * Autocomplete rápido de la DGII.
 * @param q - Texto de búsqueda (mínimo 2 caracteres)
 */
export async function autocompleteDGII(q: string): Promise<DGIIResult[]> {
    try {
        const trimmed = q.trim();
        if (trimmed.length < 2) return [];
        const response = await fetch(`${DGII_API_URL}/autocomplete?q=${encodeURIComponent(trimmed)}`, {
            headers: { 'x-api-key': DGII_API_KEY },
        });
        if (!response.ok) return [];
        const data = await response.json();
        // API returns { suggestions: [{ id, nombre, value, categoria, regimen, estatus, ... }] }
        const suggestions = data?.suggestions || data?.data || (Array.isArray(data) ? data : []);
        return suggestions.map(normalizeDGIIResult);
    } catch {
        return [];
    }
}
