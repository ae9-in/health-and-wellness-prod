import { Link } from 'react-router-dom';
import { Product } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const brandName = product.brand?.name || 'Wellspring Brand';
  
  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-primary/10 glass-card">
      <Link to={`/products/${product.id}`} className="block relative aspect-square overflow-hidden">
        <img 
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'} 
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        />
        {product.isPopular && (
          <Badge className="absolute top-3 left-3 bg-amber-500 text-white border-none shadow-md">
            <Star className="w-3 h-3 mr-1 fill-white" /> Popular
          </Badge>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button variant="secondary" size="sm" className="rounded-full shadow-lg">View Details</Button>
        </div>
      </Link>
      
      <CardContent className="p-4">
        <div className="text-xs font-semibold text-primary/70 uppercase tracking-wider mb-1">{brandName}</div>
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="font-display text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
        </Link>
        <p className="text-muted-foreground text-sm line-clamp-2 mt-2 h-10">
          {product.description}
        </p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="text-xl font-bold text-primary">
          {formatPrice(product.price)}
        </div>
        <Button size="sm" className="rounded-full h-9 w-9 p-0 shadow-md">
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
