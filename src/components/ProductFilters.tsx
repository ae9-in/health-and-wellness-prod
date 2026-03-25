import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CATEGORIES } from '@/lib/constants';
import { Search, X, SlidersHorizontal, Star } from 'lucide-react';

interface ProductFiltersProps {
  filters: {
    category: string;
    minPrice: string;
    maxPrice: string;
    popular: boolean;
    search: string;
    brandId: string;
  };
  brands: Array<{ id: string, name: string }>;
  setFilters: (filters: any) => void;
  onClear: () => void;
}

export default function ProductFilters({ filters, brands, setFilters, onClear }: ProductFiltersProps) {
  const handleCategoryClick = (cat: string) => {
    setFilters({ ...filters, category: filters.category === cat ? '' : cat });
  };

  return (
    <div className="space-y-8 glass-card p-6 rounded-2xl border border-[#7A9E7E]/40 bg-[#F9F5EE] sticky top-24">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold flex items-center gap-2 text-[#4F7153]">
          <SlidersHorizontal className="w-5 h-5 text-[#7A9E7E]" /> Filters
        </h2>
        {(filters.category || filters.minPrice || filters.maxPrice || filters.popular || filters.search) && (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-8 text-xs text-[#4F7153] hover:text-[#7A9E7E]">
            Clear all
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-3">
        <Label htmlFor="search">Search Products</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7A9E7E]" />
          <Input
            id="search"
            placeholder="Search..."
            className="pl-9 bg-background/50"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <Label>Categories</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={filters.category === cat ? 'default' : 'outline'}
              className={`cursor-pointer px-3 py-1 transition-all text-sm ${
                filters.category === cat 
                  ? 'bg-[#7A9E7E] text-white shadow-lg shadow-[#7A9E7E]/30' 
                  : 'border-[#7A9E7E]/40 text-[#4F7153] hover:bg-[#7A9E7E]/10 hover:border-[#7A9E7E]'
              }`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-[#4F7153]">Price Range (₹)</Label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder="Min"
            className="bg-background/50"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Max"
            className="bg-background/50"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
          />
        </div>
      </div>

      {/* Popular Products */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-[#7A9E7E]/40 bg-[#C8DBC9]/70 cursor-pointer hover:bg-[#7A9E7E]/20 transition-colors"
           onClick={() => setFilters({ ...filters, popular: !filters.popular })}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-colors ${filters.popular ? 'bg-[#4F7153] text-white' : 'bg-white text-[#7A9E7E] border border-[#7A9E7E]/40'}`}>
            <Star className={`w-4 h-4 ${filters.popular ? 'fill-white' : ''}`} />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#4F7153]">Popular Products</div>
            <div className="text-[10px] text-[#7A9E7E]">Most loved by community</div>
          </div>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.popular ? 'border-[#4F7153] bg-[#4F7153]' : 'border-[#7A9E7E]/30'}`}>
          {filters.popular && <div className="w-2 h-2 rounded-full bg-white transition-all scale-100" />}
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-3">
        <Label>Brands</Label>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={filters.brandId === '' ? 'default' : 'outline'}
            className="cursor-pointer px-3 py-1 transition-all bg-[#F9F5EE] text-[#4F7153] border border-[#7A9E7E]/40"
            onClick={() => setFilters({ ...filters, brandId: '' })}
          >
            All Brands
          </Badge>
          {brands.map((brand) => (
            <Badge
              key={brand.id}
              variant={filters.brandId === brand.id ? 'default' : 'outline'}
              className={`cursor-pointer px-3 py-1 transition-all ${filters.brandId === brand.id ? 'bg-[#7A9E7E] text-white shadow-lg' : 'border border-[#7A9E7E]/40 text-[#4F7153]'}`}
              onClick={() => setFilters({ ...filters, brandId: brand.id })}
            >
              {brand.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
