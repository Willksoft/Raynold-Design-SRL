import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProductItem } from '../types';
import { allProducts as initialProducts } from '../data/products';

interface ShopContextType {
  products: ProductItem[];
  cart: ProductItem[];
  favorites: string[]; // IDs of favorite products
  isCartOpen: boolean;
  addToCart: (product: ProductItem) => void;
  removeFromCart: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  toggleCart: () => void;
  clearCart: () => void;
  addProduct: (product: Omit<ProductItem, 'id'>) => void;
  updateProduct: (id: string, product: Partial<ProductItem>) => void;
  deleteProduct: (id: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [cart, setCart] = useState<ProductItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product: ProductItem) => {
    // Avoid duplicates for this simple implementation, or allow quantity logic
    if (!cart.find(item => item.id === product.id)) {
      setCart([...cart, product]);
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const toggleFavorite = (productId: string) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);
  
  const clearCart = () => setCart([]);

  const addProduct = (product: Omit<ProductItem, 'id'>) => {
    const newProduct: ProductItem = {
      ...product,
      id: Math.random().toString(36).substr(2, 9),
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (id: string, updatedFields: Partial<ProductItem>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    // Also remove from cart and favorites if deleted
    setCart(cart.filter(item => item.id !== id));
    setFavorites(favorites.filter(favId => favId !== id));
  };

  return (
    <ShopContext.Provider value={{ 
      products,
      cart, 
      favorites, 
      isCartOpen, 
      addToCart, 
      removeFromCart, 
      toggleFavorite, 
      toggleCart,
      clearCart,
      addProduct,
      updateProduct,
      deleteProduct
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};