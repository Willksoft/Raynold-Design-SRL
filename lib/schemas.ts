import { z } from 'zod';

// ─── Validación de RNC (9 dígitos) o Cédula (11 dígitos) ────────────────────
const rncRegex = /^\d{9}$/;
const cedulaRegex = /^\d{11}$/;

export const clientSchema = z.object({
    name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(200, 'El nombre es demasiado largo'),

    type: z.enum(['Persona Física', 'Empresa'], {
        errorMap: () => ({ message: 'Selecciona un tipo de cliente' }),
    }),

    rnc: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val || val.trim() === '') return true; // optional
                const clean = val.replace(/[-\s]/g, '');
                return rncRegex.test(clean) || cedulaRegex.test(clean);
            },
            { message: 'RNC debe tener 9 dígitos o Cédula 11 dígitos' }
        ),

    company: z.string().max(200).optional(),

    email: z
        .string()
        .optional()
        .refine(
            (val) => !val || val.trim() === '' || z.string().email().safeParse(val).success,
            { message: 'Email inválido' }
        ),

    phone: z
        .string()
        .optional()
        .refine(
            (val) => !val || val.trim() === '' || val.replace(/\D/g, '').length >= 7,
            { message: 'El teléfono debe tener al menos 7 dígitos' }
        ),

    address: z.string().max(500).optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// ─── Esquema para Proveedor ─────────────────────────────────────────────────
export const supplierSchema = z.object({
    name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(200),

    rnc: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val || val.trim() === '') return true;
                const clean = val.replace(/[-\s]/g, '');
                return rncRegex.test(clean) || cedulaRegex.test(clean);
            },
            { message: 'RNC debe tener 9 dígitos o Cédula 11 dígitos' }
        ),

    phone: z.string().max(30).optional(),
    email: z
        .string()
        .optional()
        .refine(
            (val) => !val || val.trim() === '' || z.string().email().safeParse(val).success,
            { message: 'Email inválido' }
        ),
    address: z.string().max(500).optional(),
    contact_person: z.string().max(200).optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

// ─── Esquema para Gasto ─────────────────────────────────────────────────────
export const expenseSchema = z.object({
    date: z.string().min(1, 'La fecha es requerida'),
    description: z
        .string()
        .min(2, 'La descripción debe tener al menos 2 caracteres')
        .max(500),
    category: z.string().min(1, 'Selecciona una categoría'),
    amount: z
        .number({ invalid_type_error: 'El monto debe ser un número' })
        .positive('El monto debe ser mayor a 0'),
    reference: z.string().max(100).optional(),
    accountId: z.string().optional(),
    supplierId: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

// ─── Esquema para Producto ──────────────────────────────────────────────────
export const productSchema = z.object({
    title: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(200),
    category: z.string().min(1, 'Selecciona una categoría'),
    price: z
        .number()
        .nonnegative('El precio no puede ser negativo')
        .optional(),
    description: z.string().max(2000).optional(),
    reference: z.string().max(50).optional(),
    unit: z.string().optional(),
    image: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
