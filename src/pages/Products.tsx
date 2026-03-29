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

  const showNoResultsMessage = !loading && products.length === 0;
  const productCountLabel = products.length;

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
                    {products.map((product, i) => (
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
