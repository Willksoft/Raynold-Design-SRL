import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Brand {
  id: string;
  name: string;
  logo: string;
  bg_color: string;
}

const BrandLogo: React.FC<{ brand: Brand }> = ({ brand }) => (
  <div className="mx-6 flex-shrink-0 flex items-center justify-center min-w-[140px] h-20 opacity-70 hover:opacity-100 transition-all duration-300 group">
    {brand.logo ? (
      <div
        className="w-full h-full rounded-lg flex items-center justify-center px-3 py-2 group-hover:scale-105 transition-transform duration-300"
        style={{ backgroundColor: brand.bg_color || '#ffffff' }}
      >
        <img
          src={brand.logo}
          alt={brand.name}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
        />
      </div>
    ) : (
      <span className="text-xl font-black font-futuristic text-transparent bg-clip-text bg-gradient-to-b from-gray-500 to-gray-700 group-hover:from-white group-hover:to-gray-400 uppercase">
        {brand.name}
      </span>
    )}
  </div>
);

const Clients: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    supabase
      .from('brands')
      .select('id, name, logo, bg_color')
      .order('sort_order')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setBrands(data.map(b => ({
            id: b.id,
            name: b.name,
            logo: b.logo || b.logo_url || '',
            bg_color: b.bg_color || '#ffffff',
          })));
        }
      });
  }, []);

  if (brands.length === 0) return null;

  return (
    <section className="py-12 bg-black border-y border-white/5 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />

      <div className="max-w-7xl mx-auto mb-8 px-4">
        <p className="text-center text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">
          Confían en nosotros
        </p>
      </div>

      <div className="flex w-[200%] animate-scroll">
        <div className="flex items-center">
          {brands.map((brand) => (
            <BrandLogo key={brand.id} brand={brand} />
          ))}
        </div>
        <div className="flex items-center" aria-hidden="true">
          {brands.map((brand) => (
            <BrandLogo key={`dup-${brand.id}`} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Clients;