/* Bank/Payment app definitions for payment link pages */
export interface BankOption {
  name: string;
  logo: string;
  type: 'bank' | 'app' | 'crypto' | 'link';
  defaultCurrency: string;
}

// We'll reference them from /bank/ folder or use uploaded versions
const BASE = '/bank/';

export const BANK_OPTIONS: BankOption[] = [
  // Dominican Banks
  { name: 'Banco Popular', logo: `${BASE}Banco_Banco Popular.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Banreservas', logo: `${BASE}Banco_Banreservas.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Banco BHD', logo: `${BASE}Banco_Banco BHD.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Scotiabank', logo: `${BASE}Banco_Scotiabank.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Asociación Popular', logo: `${BASE}Banco_Asociación Popular.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Asociación Cibao', logo: `${BASE}Banco_Asociación Cibao.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Banesco', logo: `${BASE}Banco_Banesco.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Banco Ademi', logo: `${BASE}Banco_Banco Ademi.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Banco Vimenca', logo: `${BASE}Banco_Banco Vimenca.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Banco Lope de Haro', logo: `${BASE}Banco_Banco Lope de Haro.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Banco Proamerica', logo: `${BASE}Banco_Banco Proamerica.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Banco Atlantico', logo: `${BASE}Banco_Banco Atlantico.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Banco Adopen', logo: `${BASE}Banco_Banco Adopen.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'BancoBDI', logo: `${BASE}Banco_BancoBDI.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Banco Qik', logo: `${BASE}Banco_Banco Qik .jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Banfondesa', logo: `${BASE}Banco_Banfondesa.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Fihogar', logo: `${BASE}Banco_Fihogar.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'Lafise', logo: `${BASE}Banco_Lafise.jpg`, type: 'bank', defaultCurrency: 'DOP' },
  { name: 'La Nacional', logo: `${BASE}Banco_La Nacional .jpg`, type: 'bank', defaultCurrency: 'DOP' },
  // Payment Apps
  { name: 'PayPal', logo: `${BASE}Banco_Paypal.jpg`, type: 'app', defaultCurrency: 'USD' },
  { name: 'Zelle', logo: `${BASE}Banco_Zelle.jpg`, type: 'app', defaultCurrency: 'USD' },
  { name: 'Venmo', logo: `${BASE}Banco_Venmo.jpg`, type: 'app', defaultCurrency: 'USD' },
  { name: 'Cash App', logo: `${BASE}Banco_Cahsapp.jpg`, type: 'app', defaultCurrency: 'USD' },
  { name: 'Apple Pay', logo: `${BASE}Banco_Apple Pay.jpg`, type: 'app', defaultCurrency: 'USD' },
  { name: 'Google Pay', logo: `${BASE}Banco_Google Pay.jpg`, type: 'app', defaultCurrency: 'USD' },
  { name: 'Skrill', logo: `${BASE}Banco_Skrill.jpg`, type: 'app', defaultCurrency: 'USD' },
  { name: 'Billet', logo: `${BASE}Banco_Billet.jpg`, type: 'app', defaultCurrency: 'DOP' },
  // Crypto
  { name: 'Bitcoin', logo: `${BASE}Banco_Bitcoin.jpg`, type: 'crypto', defaultCurrency: 'BTC' },
];
