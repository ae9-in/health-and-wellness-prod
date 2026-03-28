import { useState, useEffect, useMemo } from 'react';
import { getProducts, getPublicBrands } from '@/lib/api';
import { Product } from '@/lib/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { socket } from '@/lib/socket';

const defaultFilters = {
  category: '',
  minPrice: '',
  maxPrice: '',
  popular: false,
  search: '',
  brandId: ''
};

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'fallback-mental-1',
    name: 'Mindful Balance Journal',
    description: 'Daily prompts, reflections, and breathing cues to calm racing thoughts and build mindful routines.',
    category: 'Mental Health',
    price: 28.0,
    commissionRate: 12,
    stock: 120,
    images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'],
    isPopular: true,
    status: 'APPROVED',
    brandId: 'brand-calm-collective',
    brand: { id: 'brand-calm-collective', name: 'Calm Collective', description: undefined, website: undefined, logo: undefined },
    createdAt: new Date().toISOString()
  },
  {
    id: 'fallback-fitness-1',
    name: 'Recovery Resistance Loop Kit',
    description: 'Five color-coded resistance loops engineered for ankle, hip, and glute strengthening circuits.',
    category: 'Fitness',
    price: 34.5,
    commissionRate: 14,
    stock: 90,
    images: ['https://images.unsplash.com/photo-1592432676558-9040cc6d3cc3?auto=format&fit=crop&w=800&q=80'],
    isPopular: true,
    status: 'APPROVED',
    brandId: 'brand-motion-pulse',
    brand: { id: 'brand-motion-pulse', name: 'Motion Pulse', description: undefined, website: undefined, logo: undefined },
    createdAt: new Date().toISOString()
  },
  {
    id: 'fallback-nutrition-1',
    name: 'Herbal Gut Harmony Elixir',
    description: 'Shelf-stable botanical formula with fennel, ginger, and sustainable probiotics for bloating relief.',
    category: 'Nutrition',
    price: 32.0,
    commissionRate: 11,
    stock: 75,
    images: ['https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80'],
    isPopular: false,
    status: 'APPROVED',
    brandId: 'brand-vital-roots',
    brand: { id: 'brand-vital-roots', name: 'Vital Roots', description: undefined, website: undefined, logo: undefined },
    createdAt: new Date().toISOString()
  },
  {
    id: 'fallback-lifestyle-1',
    name: 'Sunrise Reset Lamp',
    description: 'Ambient lamp that mimics sunrise light and pairs with calming soundscapes to reset circadian rhythms.',
    category: 'Lifestyle',
    price: 89.0,
    commissionRate: 13,
    stock: 60,
    images: ['https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80'],
    isPopular: true,
    status: 'APPROVED',
    brandId: 'brand-daylight-studio',
    brand: { id: 'brand-daylight-studio', name: 'Daylight Studio', description: undefined, website: undefined, logo: undefined },
    createdAt: new Date().toISOString()
  },
  {
    id: 'fallback-chronic-1',
    name: 'Gentle Relief Botanical Balm',
    description: 'Cooling balm with arnica, menthol, and magnesium for everyday joint support.',
    category: 'Chronic Conditions',
    price: 24.99,
    commissionRate: 10,
    stock: 110,
    images: ['https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80'],
    isPopular: false,
    status: 'APPROVED',
    brandId: 'brand-careflow',
    brand: { id: 'brand-careflow', name: 'CareFlow', description: undefined, website: undefined, logo: undefined },
    likes: [],
    comments: [],
    savedUsers: [],
    authorId: 'brand-careflow',
    authorName: 'CareFlow',
    authorRole: 'BRAND',
    postType: 'ARTICLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
,
  {
    id: 'fallback-yoga-1',
    name: 'Vital Alignment Jute Mat',
    description: 'Non-slip jute yoga mat with antimicrobial finish and alignment guides.',
    category: 'Yoga',
    price: 42.0,
    commissionRate: 10,
    stock: 80,
    images: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'],
    isPopular: false,
    status: 'APPROVED',
    brandId: 'brand-grounded-soul',
    brand: { id: 'brand-grounded-soul', name: 'Grounded Soul', description: undefined, website: undefined, logo: undefined },
    createdAt: new Date().toISOString()
  },
  {
    id: 'fallback-ayurveda-1',
    name: 'Ayurvedic Calm Ritual Kit',
    description: 'Cooling mist, herbal oil, and guided pranayama cues for evening balance.',
    category: 'Ayurveda',
    price: 55.5,
    commissionRate: 9,
    stock: 45,
    images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80'],
    isPopular: true,
    status: 'APPROVED',
    brandId: 'brand-ayur-life',
    brand: { id: 'brand-ayur-life', name: 'AyurLife', description: undefined, website: undefined, logo: undefined },
    createdAt: new Date().toISOString()
  },
  {
    id: 'fallback-weight-1',
    name: 'Restoro Weight Harmony Tea',
    description: 'Herbal wellness tea with neem, fennel, and fenugreek for gentle metabolism support.',
    category: 'Weight Loss',
    price: 26.0,
    commissionRate: 12,
    stock: 140,
    images: ['https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80'],
    isPopular: false,
    status: 'APPROVED',
    brandId: 'brand-restoro',
    brand: { id: 'brand-restoro', name: 'Restoro Botanicals', description: undefined, website: undefined, logo: undefined },
    createdAt: new Date().toISOString()
  }
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(() => ({ ...defaultFilters }));
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);

  const filtersAreDefault = useMemo(
    () =>
      filters.category === '' &&
      filters.minPrice === '' &&
      filters.maxPrice === '' &&
      filters.popular === false &&
      filters.search === '' &&
      filters.brandId === '',
    [filters]
  );

  const shouldUseFallbackProducts = !loading && products.length === 0 && filtersAreDefault;
  const displayProducts = shouldUseFallbackProducts ? FALLBACK_PRODUCTS : products;
  const showNoResultsMessage = !loading && !shouldUseFallbackProducts && products.length === 0;
  const productCountLabel = shouldUseFallbackProducts ? FALLBACK_PRODUCTS.length : products.length;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts({
        category: filters.category,
        popular: filters.popular,
        search: filters.search,
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        brandId: filters.brandId || undefined
      });
      setProducts(data);
    } catch (error) {
      console.error('Unable to fetch products', error);
      toast.error('Unable to sync curated products right now. Showing a ready-to-shop collection.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchBrandsData = async () => {
      try {
        const brandList = await getPublicBrands();
        setBrands(brandList);
      } catch (error) {
        console.error('Unable to fetch brands', error);
      }
    };
    fetchBrandsData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300); // Debounce
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    const handleProductChange = () => {
      fetchProducts();
    };

    socket.on('product:created', handleProductChange);
    socket.on('product:updated', handleProductChange);
    socket.on('product:deleted', handleProductChange);

    return () => {
      socket.off('product:created', handleProductChange);
      socket.off('product:updated', handleProductChange);
      socket.off('product:deleted', handleProductChange);
    };
  }, []);

  const clearFilters = () => {
    setFilters({ ...defaultFilters });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F5EE]">
      <Navbar />

      <main className="flex-1 bg-[#F9F5EE]">
        <div className="max-w-[1340px] w-full mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-10">
          <section className="flex flex-col lg:flex-row items-start justify-between gap-6 bg-gradient-to-br from-[#2C4A2E] to-[#4A3A2A] text-white rounded-[2.5rem] p-8 shadow-2xl border border-[#8C4A2A]/60">
            <div className="max-w-2xl space-y-4">
              <h1 className="font-display text-4xl md:text-5xl font-bold flex items-center gap-4">
                <ShoppingBag className="w-10 h-10 text-[#E09070]" />
                Product Discovery
              </h1>
              <p className="text-lg leading-relaxed text-white/90">
                Explore curated health and wellness products from trusted brands, selected for your wellbeing journey.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 justify-end w-full lg:w-auto">
              <div className="bg-[#F9F5EE] px-5 py-2 rounded-full text-[#4A3A2A] font-semibold text-sm shadow-sm">
                {productCountLabel} Products Found
              </div>
              <Dialog open={isFiltersDialogOpen} onOpenChange={setIsFiltersDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="lg:hidden rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em]">
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm rounded-[2rem] p-0">
                  <ProductFilters
                    filters={filters}
                    brands={brands}
                    setFilters={setFilters}
                    onClear={clearFilters}
                    className="shadow-none border-[#7A9E7E]/40"
                  />
                </DialogContent>
              </Dialog>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
            <div className="space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="animate-pulse">Loading wellness products...</p>
                </div>
              ) : showNoResultsMessage ? (
                <div className="flex flex-col items-center justify-center h-full bg-[#2C4A2E] rounded-[3rem] border border-[#8C4A2A] p-12 text-center text-white">
                  <div className="bg-[#4A3A2A] p-6 rounded-full mb-6 shadow-inner">
                    <ShoppingBag className="w-12 h-12 text-white/60" />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2">No products found</h3>
                  <p className="text-white/80 max-w-xs mx-auto mb-8">
                    Try adjusting your filters or search terms to find what you're looking for.
                  </p>
                  <Button onClick={clearFilters} variant="outline" className="rounded-full border-white/60 text-white">
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {displayProducts.map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.05 }}
                        layout
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="hidden lg:block">
              <div className="lg:sticky lg:top-24">
                <ProductFilters
                  filters={filters}
                  brands={brands}
                  setFilters={setFilters}
                  onClear={clearFilters}
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
