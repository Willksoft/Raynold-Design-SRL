import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProductItem, SupabaseProductRow } from '../types';
import { supabase } from '../lib/supabaseClient';

interface ShopContextType {
  products: ProductItem[];
  cart: ProductItem[];
  favorites: string[];
  isCartOpen: boolean;
  refreshProducts: () => Promise<void>;
  addToCart: (product: ProductItem) => void;
  removeFromCart: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  toggleCart: () => void;
  clearCart: () => void;
  addProduct: (product: Omit<ProductItem, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<ProductItem>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const mapRow = (row: SupabaseProductRow): ProductItem & { slug?: string } => ({
  id: row.id,
  title: row.title,
  category: row.category,
  image: row.image || '',
  price: row.price && !isNaN(Number(row.price)) && Number(row.price) > 0 ? `RD$ ${Number(row.price).toLocaleString()}` : '',
  description: row.description || '',
  reference: row.reference || '',
  type: (row.type as 'product' | 'service') || 'product',
  unit: row.unit || 'Unidad',
  slug: row.slug || '',
});

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [cart, setCart] = useState<ProductItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const refreshProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setProducts(data.map(mapRow));
  };

  useEffect(() => { refreshProducts(); }, []);

  const addToCart = (product: ProductItem) => {
    if (!cart.find(item => item.id === product.id)) {
      setCart([...cart, product]);
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const clearCart = () => setCart([]);

  const generateSlug = (title: string) =>
    title.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const addProduct = async (product: Omit<ProductItem, 'id'>) => {
    const slug = generateSlug(product.title);
    await supabase.from('products').insert([{
      title: product.title, category: product.category,
      image: product.image, price: product.price,
      description: product.description, reference: product.reference,
      type: product.type || 'product', unit: product.unit || 'Unidad',
      slug
    }]);
    await refreshProducts();
  };

  const updateProduct = async (id: string, updatedFields: Partial<ProductItem>) => {
    type ProductUpdateRow = {
      title?: string; category?: string; image?: string; price?: string;
      description?: string; reference?: string; type?: string; unit?: string; slug?: string;
    };
    const updates: ProductUpdateRow = {
      title: updatedFields.title, category: updatedFields.category,
      image: updatedFields.image, price: updatedFields.price,
      description: updatedFields.description, reference: updatedFields.reference,
      type: updatedFields.type, unit: updatedFields.unit
    };
    if (updatedFields.title) updates.slug = generateSlug(updatedFields.title);
    await supabase.from('products').update(updates).eq('id', id);
    await refreshProducts();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    setCart(cart.filter(item => item.id !== id));
    setFavorites(favorites.filter(favId => favId !== id));
    await refreshProducts();
  };

  return (
    <ShopContext.Provider value={{
      products, cart, favorites, isCartOpen, refreshProducts,
      addToCart, removeFromCart, toggleFavorite, toggleCart, clearCart,
      addProduct, updateProduct, deleteProduct
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
};