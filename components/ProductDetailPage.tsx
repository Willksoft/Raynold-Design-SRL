import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Plus, Check, Star, ShieldCheck, Truck, ArrowUpRight, Share2, Package, Ruler, Tag } from 'lucide-react';
import { ProductItem, SupabaseProductRow } from '../types';
import { useShop } from '../context/ShopContext';
import { supabase } from '../lib/supabaseClient';

interface ProductDetail extends ProductItem {
    features?: string[];
    unit?: string;
    reference?: string;
}

const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart, cart, toggleFavorite, favorites, products } = useShop();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState<ProductItem[]>([]);
    const [imgLoaded, setImgLoaded] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setImgLoaded(false);

            // Try fetch by slug first, then by id
            let { data } = await supabase
                .from('products')
                .select('*')
                .eq('slug', id)
                .eq('is_active', true)
                .maybeSingle();

            if (!data && id) {
                const byId = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', id)
                    .eq('is_active', true)
                    .maybeSingle();
                data = byId.data;
            }

            if (data) {
                setProduct({
                    id: data.id,
                    title: data.title,
                    description: data.description || '',
                    price: data.price || '',
                    image: data.image || 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=800',
                    category: data.category || 'Producto',
                    reference: data.reference,
                    unit: data.unit,
                    features: data.features || [],
                    show_price: data.show_price ?? false,
                });

                // Fetch related products from same category
                const { data: related } = await supabase
                    .from('products')
                    .select('id, title, price, image, category, slug, reference')
                    .eq('is_active', true)
                    .eq('category', data.category)
                    .neq('id', data.id)
                    .limit(4);

                if (related) {
                    setRelatedProducts(related.map((p: SupabaseProductRow) => ({
                        id: p.slug || p.id,
                        title: p.title,
                        price: p.price || '',
                        image: p.image || 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600',
                        category: p.category || 'Producto',
                        reference: p.reference,
                        show_price: p.show_price ?? false,
                    })));
                }
            }

            setLoading(false);
        };

        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-raynold-black pt-24 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-raynold-red border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-raynold-black pt-24 flex flex-col items-center justify-center gap-6">
                <p className="text-gray-400 text-lg">Producto no encontrado</p>
                <button
                    onClick={() => navigate('/products')}
                    className="px-6 py-3 bg-raynold-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                    <ArrowLeft size={18} />
                    Volver al Catálogo
                </button>
            </div>
        );
    }

    const isInCart = cart.some(item => item.id === product.id);
    const isFavorite = favorites.includes(product.id);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            await navigator.share({ title: product.title, url });
        } else {
            await navigator.clipboard.writeText(url);
            alert('Enlace copiado al portapapeles');
        }
    };

    return (
        <div className="min-h-screen bg-raynold-black pt-20">
            {/* Back button */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Volver</span>
                </button>
            </div>

            {/* Product Detail */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Image */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative"
                    >
                        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-900 border border-white/10 relative">
                            {!imgLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                    <div className="w-8 h-8 border-2 border-raynold-red border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            <img
                                src={product.image}
                                alt={product.title}
                                className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setImgLoaded(true)}
                            />

                            {/* Category badge */}
                            <div className="absolute top-4 left-4">
                                <span className="px-4 py-1.5 bg-raynold-red text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                                    {product.category}
                                </span>
                            </div>

                            {/* Favorite */}
                            <button
                                onClick={() => toggleFavorite(product.id)}
                                className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-yellow-500 transition-colors"
                            >
                                <Star size={20} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-yellow-500" : ""} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex flex-col"
                    >
                        {/* Reference */}
                        {product.reference && (
                            <span className="text-xs text-gray-500 font-mono mb-2">REF: {product.reference}</span>
                        )}

                        <h1 className="text-4xl md:text-5xl font-futuristic font-black text-white mb-4 leading-tight">
                            {product.title}
                        </h1>

                        {product.show_price && product.price && (
                            <p className="text-3xl text-raynold-green font-mono font-bold mb-8">
                                {product.price}
                            </p>
                        )}

                        {/* Description */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Descripción</h3>
                            <p className="text-gray-300 leading-relaxed text-lg">
                                {product.description || "Este producto es fabricado con los más altos estándares de calidad de Raynold Design. Contáctanos para personalizarlo a tu medida."}
                            </p>
                        </div>

                        {/* Features */}
                        {product.features && product.features.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Características</h3>
                                <ul className="space-y-2">
                                    {product.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-gray-300">
                                            <Check size={16} className="text-raynold-green flex-shrink-0" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Product info badges */}
                        <div className="flex flex-wrap gap-3 mb-8">
                            {product.unit && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">
                                    <Ruler size={14} className="text-raynold-red" />
                                    <span>Unidad: {product.unit}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">
                                <ShieldCheck size={14} className="text-raynold-green" />
                                <span>Garantía de Calidad</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">
                                <Truck size={14} className="text-blue-400" />
                                <span>Entrega a Domicilio</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">
                                <Package size={14} className="text-yellow-400" />
                                <span>Personalizable</span>
                            </div>
                        </div>

                        {/* CTA buttons */}
                        <div className="space-y-3 mt-auto">
                            <a
                                href={`https://wa.me/18295807411?text=Hola,%20me%20interesa%20el%20producto:%20${encodeURIComponent(product.title)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg bg-raynold-green text-black hover:bg-green-400 shadow-raynold-green/20"
                            >
                                Cotizar por WhatsApp <ArrowUpRight size={22} />
                            </a>

                            <div className="grid grid-cols-2 gap-3">
                                <a
                                    href={`https://wa.me/18295807411?text=Hola,%20me%20interesa%20el%20producto:%20${encodeURIComponent(product.title)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="py-3 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-raynold-green hover:border-raynold-green transition-colors flex items-center justify-center gap-2"
                                >
                                    WhatsApp Directo <ArrowUpRight size={16} />
                                </a>
                                <button
                                    onClick={handleShare}
                                    className="py-3 rounded-xl border border-white/10 text-gray-400 font-bold text-sm hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                                >
                                    Compartir <Share2 size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-20"
                    >
                        <h2 className="text-2xl font-futuristic font-bold text-white mb-8">
                            Productos <span className="text-raynold-red">Relacionados</span>
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {relatedProducts.map(rp => (
                                <div
                                    key={rp.id}
                                    onClick={() => navigate(`/products/${rp.id}`)}
                                    className="group bg-gray-900 rounded-xl overflow-hidden border border-white/10 hover:border-raynold-red/50 transition-colors cursor-pointer"
                                >
                                    <div className="aspect-square overflow-hidden bg-gray-800">
                                        <img
                                            src={rp.image}
                                            alt={rp.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-sm font-bold text-white mb-1 line-clamp-2">{rp.title}</h3>

                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ProductDetailPage;
