import { Link } from 'react-router-dom';
import { Product } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star } from 'lucide-react';
import { formatPrice, resolveImageUrl } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const brandName = product.brand?.name || 'Wellspring Brand';

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-100/80 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group">
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden aspect-[4/3]">
        <img
          src={resolveImageUrl(product.images?.[0] || (product as any).image)}
          alt={product.name}
          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105 bg-slate-50/30"
        />
        {product.isPopular && (
          <Badge className="absolute top-3 left-3 bg-amber-500 text-white border-none shadow-lg">
            <Star className="w-3 h-3 mr-1 fill-white" /> Popular
          </Badge>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 flex items-center justify-center group-hover:opacity-100">
          <Button variant="secondary" size="sm" className="rounded-full shadow-lg">
            View Details
          </Button>
        </div>
      </Link>

      <CardContent className="flex-1 flex flex-col gap-3 p-5">
        <div className="text-xs font-semibold text-primary/70 uppercase tracking-[0.3em]">{brandName}</div>
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="font-display text-lg font-bold text-slate-900 transition-colors line-clamp-2 hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
          {product.description}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 border-t border-slate-100/60 px-5 py-4">
        <div className="text-xl font-bold text-primary">
          {formatPrice(product.price)}
        </div>
        <Button size="sm" className="rounded-full h-10 w-10 p-0 shadow-md">
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
