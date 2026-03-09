import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Brand {
  id: string;
  name: string;
  logo: string;
  bg_color: string;
}

const BrandLogo: React.FC<{ brand: Brand }> = ({ brand }) => (
  <div className="mx-8 flex-shrink-0 flex items-center justify-center h-32 md:h-40">
    {brand.logo ? (
      <div
        className="h-28 md:h-36 rounded-xl flex items-center justify-center px-8 py-4 transition-all duration-300 hover:scale-110 hover:opacity-100 opacity-75"
        style={{
          backgroundColor: brand.bg_color && brand.bg_color !== '#ffffff' ? brand.bg_color : 'rgba(255,255,255,0.06)',
          minWidth: '200px',
          maxWidth: '300px',
        }}
      >
        <img
          src={brand.logo}
          alt={brand.name}
          className="max-h-20 md:max-h-24 w-auto object-contain"
          loading="lazy"
        />
      </div>
    ) : (
      <span className="text-lg font-black font-futuristic text-gray-500 hover:text-white transition-colors uppercase tracking-wider">
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
            logo: b.logo || '',
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