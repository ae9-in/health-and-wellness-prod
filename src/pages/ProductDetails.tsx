import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductDetails, createPayment } from '@/lib/api';
import { Product } from '@/lib/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import CheckoutModal from '@/components/CheckoutModal';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  ShoppingCart, 
  Star, 
  ShieldCheck, 
  Truck, 
  ArrowLeft,
  CircleCheck,
  Building2,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatPrice, parseVariants, resolveImageUrl } from '@/lib/utils';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null);

  const handlePaymentSuccess = async () => {
    if (!product) return;
    try {
      const token = localStorage.getItem('wellnest_token');
      if (!token) {
        toast.error('You must be logged in to purchase');
        return;
      }
      
      const variants = parseVariants(product.variants);
      const price = selectedVariantIdx !== null && variants[selectedVariantIdx]?.price 
        ? parseFloat(variants[selectedVariantIdx].price) 
        : product.price;

      await createPayment(token, {
        amount: price,
        plan: `Product: ${product.name}${selectedVariantIdx !== null ? ` (${variants[selectedVariantIdx].size})` : ''}`,
        paymentStatus: 'success',
        transactionId: 'DEMO_' + Date.now()
      });
      toast.success('Payment successfully processed!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to process payment');
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (id) {
        setLoading(true);
        const data = await getProductDetails(id);
        setProduct(data);
        
        const variants = parseVariants(data?.variants);
        if (variants.length > 0) {
          setSelectedVariantIdx(0);
        }
        
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
// ... existing loading state ...
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button asChild>
            <Link to="/products">Back to Discovery</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const brandName = product.brand?.name || 'Wellspring Brand';
  const images = product.images?.length > 0 ? product.images.map(img => resolveImageUrl(img)) : 
                 (product as any).image ? [resolveImageUrl((product as any).image)] : [
    'https://images.unsplash.com/photo-1540344484110-2c93d80db616?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCF8]">
      <Navbar />
      
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-0 md:px-4">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-12">
            <Link to="/products" className="inline-flex items-center text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all group">
              <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center mr-4 group-hover:bg-primary group-hover:text-white transition-all">
                <ArrowLeft className="w-4 h-4" />
              </div>
              Back to Collection
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 mb-24 items-start">
            {/* Images Section */}
            <div className="space-y-8 sticky top-24">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="aspect-square rounded-[3.5rem] overflow-hidden glass-card border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative group bg-white"
              >
                <img 
                  src={images[activeImage]} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-2 transition-transform duration-1000 group-hover:scale-110"
                />
                {product.isPopular && (
                  <div className="absolute top-10 left-10">
                    <Badge className="bg-amber-500 text-white px-8 py-3 text-sm font-black uppercase tracking-[0.2em] border-none shadow-2xl rounded-2xl">
                      <Star className="w-4 h-4 mr-3 fill-white" /> Community Choice
                    </Badge>
                  </div>
                )}
              </motion.div>
              
              <div className="grid grid-cols-4 gap-6 px-4">
                {images.map((img, i) => (
                  <button 
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`aspect-square rounded-[2rem] overflow-hidden border-2 transition-all duration-500 shadow-xl ${
                      activeImage === i ? 'border-primary shadow-primary/20 scale-110' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img src={img} alt={`${product.name} view ${i+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

          {/* Info Section */}
          <div className="flex flex-col justify-center space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-sm uppercase">
                <Building2 className="w-4 h-4" />
                {brandName}
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-primary">
                  {(() => {
                    const variants = parseVariants(product.variants);
                    const rawPrice = (selectedVariantIdx !== null && variants[selectedVariantIdx]?.price)
                      ? variants[selectedVariantIdx].price
                      : product.price;
                    const price = Number(rawPrice) || 0;
                    return formatPrice(price);
                  })()}
                </div>
                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                  <CircleCheck className="w-3 h-3 mr-1" /> In Stock {(() => {
                    const variants = parseVariants(product.variants);
                    const rawStock = (selectedVariantIdx !== null && variants[selectedVariantIdx]?.stock !== undefined)
                      ? variants[selectedVariantIdx].stock
                      : product.stock;
                    const stock = Number(rawStock) || 0;
                    return `(${stock})`;
                  })()}
                </Badge>
              </div>

              {/* Variants Selector */}
              {(() => {
                const variants = parseVariants(product.variants);
                if (variants.length === 0) return null;
                return (
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Option</Label>
                      {selectedVariantIdx !== null && (
                        <span className="text-[10px] font-bold text-primary italic">
                          {variants[selectedVariantIdx].quantity}{variants[selectedVariantIdx].unit}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {variants.map((v, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedVariantIdx(idx)}
                          className={`px-5 py-4 rounded-2xl border-2 transition-all flex flex-col items-center min-w-[100px] gap-1 ${
                            selectedVariantIdx === idx 
                              ? 'border-primary bg-primary/10 shadow-lg scale-105' 
                              : 'border-primary/10 bg-white hover:border-primary/30 hover:scale-[1.02]'
                          }`}
                        >
                          <span className={`text-sm font-black uppercase tracking-tight ${selectedVariantIdx === idx ? 'text-primary' : 'text-slate-800'}`}>
                            {v.quantity}{v.unit}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {formatPrice(parseFloat(v.price || product.price))}
                          </span>
                          {v.stock !== undefined && Number(v.stock) < 10 && (
                            <span className="text-[8px] font-black text-orange-500 uppercase mt-1">Low Stock</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="p-8 rounded-[2.5rem] bg-white shadow-sm border border-primary/5">
                <h3 className="text-xl font-black mb-4 text-[#1A2E05]">Product Description</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line font-medium text-[16px]">
                  {product.description}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">100% Authentic</div>
                    <div className="text-xs text-muted-foreground">Direct from {brandName}</div>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Free Shipping</div>
                    <div className="text-xs text-muted-foreground">On orders over {formatPrice(50)}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={() => setIsCheckoutOpen(true)}
                  size="lg" 
                  className="flex-1 rounded-full h-14 text-lg font-bold shadow-xl hover:shadow-primary/20 transition-all"
                >
                  <ShoppingCart className="w-5 h-5 mr-3" /> Buy Now
                </Button>
                <Button variant="outline" size="lg" className="rounded-full h-14 px-8 border-primary/20 hover:bg-primary/5 transition-all">
                  Contact Brand
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        <CheckoutModal 
          open={isCheckoutOpen} 
          onOpenChange={setIsCheckoutOpen}
          productName={(() => {
            const variants = parseVariants(product.variants);
            return selectedVariantIdx !== null 
              ? `${product.name} (${variants[selectedVariantIdx].quantity}${variants[selectedVariantIdx].unit})`
              : product.name;
          })()}
          amount={(() => {
            const variants = parseVariants(product.variants);
            return selectedVariantIdx !== null && variants[selectedVariantIdx]?.price 
              ? parseFloat(variants[selectedVariantIdx].price) 
              : product.price;
          })()}
          onSuccess={handlePaymentSuccess}
        />

        {/* Categories / Tags Section */}
        <div className="border-t border-primary/10 pt-12">
          <h2 className="font-display text-2xl font-bold mb-6">Product Information</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl glass-card">
              <h4 className="font-bold text-sm text-muted-foreground uppercase mb-3">Category</h4>
              <Badge variant="secondary" className="px-4 py-1">{product.category}</Badge>
            </div>
            <div className="p-6 rounded-2xl glass-card">
              <h4 className="font-bold text-sm text-muted-foreground uppercase mb-3">Affiliate Program</h4>
              <p className="text-sm font-medium">Earn {product.commissionRate}% commission on every sale made through your link.</p>
            </div>
            <div className="p-6 rounded-2xl glass-card">
              <h4 className="font-bold text-sm text-muted-foreground uppercase mb-3">Brand Location</h4>
              <p className="text-sm font-medium">Verified by Wellspring Community</p>
            </div>
          </div>
        </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
