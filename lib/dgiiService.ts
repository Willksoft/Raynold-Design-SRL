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
        return data || null;
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
        return await response.json();
    } catch {
        return { error: 'No se pudo conectar con la DGII' };
    }
}
