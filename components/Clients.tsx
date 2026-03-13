import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Brand {
  id: string;
  name: string;
  logo: string;
  bg_color: string;
}

const BrandLogo: React.FC<{ brand: Brand }> = ({ brand }) => (
  <div className="mx-6 flex-shrink-0 flex flex-col items-center justify-center gap-3" style={{ width: '200px' }}>
    {brand.logo ? (
      <div
        className="w-full h-28 rounded-xl flex items-center justify-center px-4 py-3 transition-all duration-300 hover:scale-105 hover:opacity-100 opacity-70"
        style={{
          backgroundColor: brand.bg_color || 'rgba(255,255,255,0.06)',
        }}
      >
        <img
          src={brand.logo}
          alt={brand.name}
          className="max-h-20 w-auto max-w-full object-contain"
          loading="lazy"
        />
      </div>
    ) : (
      <div className="w-full h-28 rounded-xl flex items-center justify-center bg-white/6 px-4">
        <span className="text-base font-black font-futuristic text-gray-500 hover:text-white transition-colors uppercase tracking-wider text-center">
          {brand.name}
        </span>
      </div>
    )}
    <span className="text-xs text-gray-500 font-semibold tracking-wide uppercase truncate w-full text-center">
      {brand.name}
    </span>
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

  // Each brand = 200px + 48px margins = 248px
  const BRAND_WIDTH = 248;
  const VIEWPORT_WIDTH = 2000; // generous max viewport

  // Repeat brands enough times so one "set" fills the viewport
  const repeatsNeeded = Math.max(2, Math.ceil(VIEWPORT_WIDTH / (brands.length * BRAND_WIDTH)));
  const repeatedBrands: Brand[] = [];
  for (let i = 0; i < repeatsNeeded; i++) {
    repeatedBrands.push(...brands);
  }

  const setWidth = repeatedBrands.length * BRAND_WIDTH;

  return (
    <section className="py-12 bg-black border-y border-white/5 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />

      <div className="max-w-7xl mx-auto mb-8 px-4">
        <p className="text-center text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">
          Confían en nosotros
        </p>
      </div>

      {/* Two identical sets side by side. Animation moves -50% then loops back seamlessly */}
      <div
        className="animate-scroll flex"
        style={{ width: `${setWidth * 2}px` }}
      >
        <div className="flex items-center" style={{ width: `${setWidth}px` }}>
          {repeatedBrands.map((brand, i) => (
            <BrandLogo key={`a-${i}`} brand={brand} />
          ))}
        </div>
        <div className="flex items-center" style={{ width: `${setWidth}px` }} aria-hidden="true">
          {repeatedBrands.map((brand, i) => (
            <BrandLogo key={`b-${i}`} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Clients;