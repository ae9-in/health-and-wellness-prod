import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductDetails, createPayment } from '@/lib/api';
import { Product } from '@/lib/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatPrice } from '@/lib/utils';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handlePaymentSuccess = async () => {
    if (!product) return;
    try {
      await createPayment(localStorage.getItem('token')!, {
        amount: product.price,
        plan: `Product: ${product.name}`,
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
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
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
  const images = product.images?.length ? product.images : [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511688858354-2972323cc320?auto=format&fit=crop&w=800&q=80'
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCF8]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 pt-4">
          <Link to="/products" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Images Section */}
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-3xl overflow-hidden glass-card border-none shadow-2xl relative group"
            >
              <img 
                src={images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {product.isPopular && (
                <div className="absolute top-6 left-6">
                  <Badge className="bg-amber-500 text-white px-4 py-1 text-sm border-none shadow-lg">
                    <Star className="w-4 h-4 mr-2 fill-white" /> Community Choice
                  </Badge>
                </div>
              )}
            </motion.div>
            
            <div className="grid grid-cols-4 gap-4">
              {images.map((img, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === i ? 'border-primary shadow-md scale-105' : 'border-transparent opacity-60 hover:opacity-100'
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
                <div className="text-3xl font-bold text-primary">{formatPrice(product.price)}</div>
                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                  <CircleCheck className="w-3 h-3 mr-1" /> In Stock ({product.stock})
                </Badge>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-2xl bg-white shadow-sm border border-primary/5">
                <h3 className="font-bold mb-3">Product Description</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
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
          productName={product.name}
          amount={product.price}
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
      </main>
      
      <Footer />
    </div>
  );
}
