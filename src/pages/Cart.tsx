import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/CartContext';
import { formatPrice, resolveImageUrl } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/lib/api';

// Extend window to include Razorpay script
declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    const token = localStorage.getItem('wellnest_token');
    if (!token) {
      toast.error('You must be logged in to purchase');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      // 1. Load Razorpay script dynamically
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        setLoading(false);
        return;
      }

      // 2. Create order on backend
      const orderData = await createRazorpayOrder(token, {
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: Number(item.product.price),
        })),
        totalAmount: cartTotal,
      });

      // 3. Open Razorpay payment popup
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Wellspring Community',
        description: `Cart Checkout (${cartItems.length} item${cartItems.length > 1 ? 's' : ''})`,
        order_id: orderData.razorpayOrderId,
        theme: { color: '#4f7942' },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 4. Verify payment on backend
            await verifyRazorpayPayment(token, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderData.orderId,
            });
            toast.success('🎉 Payment successful! Your order has been placed.');
            clearCart();
          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled.');
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        toast.error(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCF8]">
      <Navbar />

      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 py-8">
        <div className="container mx-auto">
          <BackButton />
          <h1 className="font-display text-4xl mt-6 font-bold text-[#1A2E05] mb-8">Your Cart</h1>

          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                <ShoppingBag className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
              <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
              <Button asChild size="lg" className="rounded-full shadow-lg">
                <Link to="/products">Explore Products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                {cartItems.map((item) => {
                  const image = resolveImageUrl(item.product.images?.[0] || (item.product as any).image);
                  const price = Number(item.product.price) || 0;

                  return (
                    <div
                      key={item.product.id}
                      className="flex flex-col sm:flex-row gap-6 p-6 bg-white rounded-[2rem] shadow-sm border border-primary/5 relative"
                    >
                      <div className="w-full sm:w-32 aspect-square rounded-2xl overflow-hidden bg-slate-50 flex-shrink-0">
                        {image ? (
                          <img src={image} alt={item.product.name} className="w-full h-full object-contain p-2" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">No Image</div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <Link to={`/products/${item.product.id}`} className="hover:text-primary transition-colors">
                              <h3 className="font-bold text-xl line-clamp-2">{item.product.name}</h3>
                            </Link>
                            <span className="font-bold text-lg whitespace-nowrap text-primary">
                              {formatPrice(price * item.quantity)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 tracking-widest uppercase font-bold text-[10px]">
                            {formatPrice(price)} each
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-6">
                          <div className="flex items-center bg-slate-50 rounded-full border border-slate-200">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-2 text-slate-400 hover:text-destructive hover:bg-red-50 rounded-full transition-all"
                            title="Remove item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-primary/5 sticky top-28">
                  <h3 className="text-xl font-bold mb-6">Order Summary</h3>

                  <div className="space-y-4 mb-6 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-bold">{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-bold">Calculated at checkout</span>
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-lg">
                      <span className="font-bold">Total estimated</span>
                      <span className="font-bold text-primary text-xl">{formatPrice(cartTotal)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full rounded-2xl h-14 font-bold text-lg shadow-xl shadow-primary/20 disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Zap className="w-5 h-5 animate-pulse" /> Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Pay {formatPrice(cartTotal)} <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>

                  {/* Trust badges */}
                  <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>Secured by Razorpay · 256-bit SSL</span>
                  </div>

                  <div className="mt-4 text-center">
                    <Button variant="link" asChild className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
                      <Link to="/products">Continue Shopping</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
