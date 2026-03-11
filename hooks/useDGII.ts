import { useQuery } from '@tanstack/react-query';
import { consultarRNC, buscarContribuyentes, DGIIResult, DGIISearchResponse } from '../lib/dgiiService';

/**
 * Hook para consultar un RNC/Cédula en la DGII.
 * Usa React Query para cachear resultados, reintentar en fallo, y
 * evitar llamadas duplicadas si ya se consultó el mismo RNC.
 */
export function useDGIILookup(rnc: string) {
    const clean = rnc.replace(/[-\s]/g, '');
    const enabled = clean.length >= 9;

    return useQuery<DGIIResult | null>({
        queryKey: ['dgii', 'rnc', clean],
        queryFn: () => consultarRNC(clean),
        enabled,
        staleTime: 1000 * 60 * 30, // 30 min cache — RNC data doesn't change often
        retry: 2,
        refetchOnWindowFocus: false,
    });
}

/**
 * Hook para buscar contribuyentes por nombre en la DGII.
 * Solo se activa cuando el término de búsqueda tiene 3+ caracteres.
 */
export function useDGIISearch(nombre: string) {
    const trimmed = nombre.trim();
    const enabled = trimmed.length >= 3;

    return useQuery<DGIISearchResponse>({
        queryKey: ['dgii', 'search', trimmed],
        queryFn: () => buscarContribuyentes({ nombre: trimmed, limit: 10 }),
        enabled,
        staleTime: 1000 * 60 * 10, // 10 min cache
        retry: 1,
        refetchOnWindowFocus: false,
    });
}
