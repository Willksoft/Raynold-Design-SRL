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