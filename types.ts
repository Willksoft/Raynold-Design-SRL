import React from 'react';

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: 'red' | 'green' | 'white';
}

export interface ProductItem {
  id: string;
  reference?: string;
  title: string;
  category: string;
  image: string;
  price?: string;
  description?: string;
  type?: 'product' | 'service';
  unit?: string;
  show_price?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'product' | 'project';
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string; // RNC/NIT
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  reference?: string;
  attachmentUrl?: string;
}

export interface ContactInfo {
  whatsapp: string;
  instagram: string;
  email: string;
  domain: string;
  address?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  color: string;
  socials?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface AboutContent {
  title: string;
  subtitle: string;
  historyTitle: string;
  historyText1: string;
  historyText2: string;
  historyText3: string;
  historyImage?: string;
  stats: {
    projects: string;
    brands: string;
  };
}

export enum FormStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// ─── Shared Invoice Types ───────────────────────────────────────────────────

export interface InvoiceItem {
  id: string;
  reference: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit_price?: number; // snake_case from Supabase
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  accountId: string;
  reference: string;
}

export interface POSInvoice {
  id: string;
  type: 'COTIZACION' | 'FACTURA';
  paymentType: 'CONTADO' | 'CREDITO';
  status: 'BORRADOR' | 'EMITIDA' | 'ANULADA';
  ncfType: string;
  ncf: string;
  date: string;
  number: string;
  clientId: string;
  clientName: string;
  companyName: string;
  clientRnc: string;
  clientPhone: string;
  sellerId?: string;
  sellerName?: string;
  items: InvoiceItem[];
  notes: string;
  paymentTerms: string;
  templateId: 'classic' | 'modern' | 'minimal';
  payments: Payment[];
  paymentStatus: 'PENDIENTE' | 'PARCIAL' | 'PAGADA';
  applyTax?: boolean;
  subtotal?: number;
  itbis?: number;
  total?: number;
}

// ─── Report Types ───────────────────────────────────────────────────────────

export interface ReportInvoice {
  id: string;
  number: string;
  type: string;
  status: string;
  payment_status: string;
  client_name: string;
  client_rnc: string;
  created_at: string;
  items: InvoiceItem[];
  apply_tax: boolean;
  payments: Payment[];
  ncf: string;
}

export interface ReportExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  supplier: string;
  supplier_rnc: string;
  ncf: string;
}

export interface ReportPayment extends Payment {
  invoiceNumber: string;
  clientName: string;
}

export interface ReportData {
  invoices: ReportInvoice[];
  expenses: ReportExpense[];
  payments: ReportPayment[];
}

// ─── Chart Data Types ───────────────────────────────────────────────────────

export interface SalesDataPoint {
  name: string;
  ventas: number;
}

export interface CategoryDataPoint {
  name: string;
  valor: number;
}

// ─── Search Result Types ────────────────────────────────────────────────────

export interface SearchResults {
  clients: Array<{ id: string; name: string; company?: string }>;
  products: Array<{ id: string; title: string; category?: string }>;
  invoices: Array<{ id: string; number: string; clientName?: string }>;
}

// ─── Supabase Row Helpers ───────────────────────────────────────────────────

export interface SupabaseProductRow {
  id: string;
  title: string;
  category: string;
  image: string;
  price: string;
  description: string;
  reference: string;
  type: string;
  unit: string;
  slug: string;
  show_price?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface SupabaseServiceRow {
  id: string;
  title: string;
  description: string;
  slug?: string;
  icon?: string;
  color?: string;
  image?: string;
  features?: string[];
  benefits?: Array<{ title: string; desc: string }>;
  full_description?: string;
  is_active?: boolean;
  sort_order?: number;
  price?: number;
}

export interface ExpenseRow {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  reference: string;
  attachment_url: string;
  attachment_name: string;
  account_id: string;
  supplier_id: string;
  suppliers?: { id: string; name: string } | null;
}

export type CellValue = string | number | boolean | null | undefined;