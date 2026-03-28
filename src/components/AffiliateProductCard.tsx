import { Link } from 'react-router-dom';
import { Product } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, TrendingUp, Info } from 'lucide-react';
import { formatPrice, resolveImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface AffiliateProductCardProps {
  product: Product;
  referralCode: string;
}

export default function AffiliateProductCard({ product, referralCode }: AffiliateProductCardProps) {
  const brandName = product.brand?.name || 'Wellspring Brand';
  const affiliateLink = `https://wellnest.community/join?ref=${referralCode}&product=${product.id}`;
  
  const estimatedCommission = (product.price * (product.commissionRate || 15)) / 100;

  const copyAffiliateLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    toast.success('Affiliate link copied!', {
      description: 'Share this link to earn commission on sales.'
    });
  };

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-primary/10 glass-card flex flex-col h-full">
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={resolveImageUrl(product.images?.[0] || (product as any).image)} 
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Badge className="bg-emerald-500 text-white border-none shadow-md">
            {product.commissionRate || 15}% Comm.
          </Badge>
        </div>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <Button 
            variant="secondary" 
            size="sm" 
            className="rounded-full shadow-lg font-bold"
            asChild
          >
            <Link to={`/products/${product.id}`}>
              <Info className="w-4 h-4 mr-2" /> Details
            </Link>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="rounded-full shadow-lg font-bold"
            onClick={copyAffiliateLink}
          >
            <Copy className="w-4 h-4 mr-2" /> Copy Link
          </Button>
        </div>
      </div>
      
      <CardContent className="p-5 flex-1 space-y-3">
        <div>
          <div className="text-[10px] font-black text-primary/70 uppercase tracking-[0.2em] mb-1">
            {brandName}
          </div>
          <h3 className="font-display text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center justify-between py-2 border-y border-primary/5">
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-0.5">Price</p>
            <p className="text-sm font-bold">{formatPrice(product.price)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-0.5 flex items-center justify-end gap-1">
              <TrendingUp className="w-3 h-3" /> Your Earning
            </p>
            <p className="text-sm font-black text-emerald-600">{formatPrice(estimatedCommission)}</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-5 pt-0">
        <Button 
          variant="outline" 
          className="w-full rounded-xl font-bold border-primary/10 hover:bg-primary/5 group/btn h-12"
          onClick={copyAffiliateLink}
        >
          <Copy className="w-4 h-4 mr-2 transition-transform group-hover/btn:scale-110" />
          Get Affiliate Link
        </Button>
      </CardFooter>
    </Card>
  );
}
