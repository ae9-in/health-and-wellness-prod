import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getBrandProducts, createBrandProduct, deleteBrandProduct } from '@/lib/api';
import { Product } from '@/lib/types';
import { formatPrice, parseVariants, resolveImageUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { CATEGORIES } from '@/lib/constants';
import { Package, Plus, Trash2, Image as ImageIcon, IndianRupee, Tag, Info, ListFilter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BrandProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: [] as string[],
    description: '',
    images: '',
    price: '',
    commissionRate: '',
    stock: '',
    variants: [] as any[]
  });
  const [newCategory, setNewCategory] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadProducts = async () => {
    const token = localStorage.getItem('wellnest_token');
    if (!token) return;
    try {
      const items = await getBrandProducts(token);
      const list = Array.isArray(items) ? items : [];
      setProducts(list);
    } catch (err) {
      console.error('Failed to load products');
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreate = async () => {
    const hasVariants = form.variants.length > 0;
    if (!form.name || form.category.length === 0 || !form.description || (!form.price && !hasVariants)) {
      toast.error(`Required fields: Name, Category, Description${hasVariants ? '' : ', Price'}`);
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('wellnest_token');
      if (!token) throw new Error('Not authenticated');

      // Validation
      if (form.variants.length > 0) {
        const seen = new Set();
        for (const v of form.variants) {
          if (!v.quantity || parseFloat(v.quantity) <= 0) throw new Error('Variant weight must be > 0');
          if (!v.price || parseFloat(v.price) <= 0) throw new Error('Variant price must be > 0');
          if (v.stock !== '' && Number(v.stock) < 0) throw new Error('Variant stock cannot be negative');
          
          const combo = `${v.quantity}${v.unit}`;
          if (seen.has(combo)) throw new Error(`Duplicate variant: ${combo}`);
          seen.add(combo);
        }
      }

      const imageUrls = form.images ? form.images.split(',').map((img: string) => img.trim()).filter(Boolean) : [];
      
      const price = parseFloat(form.price) || (form.variants.length > 0 ? parseFloat(form.variants[0].price) : 0);
      const stock = Number(form.stock) || (form.variants.length > 0 ? form.variants.reduce((acc, v) => acc + (v.stock === '' ? 0 : Number(v.stock)), 0) : 0);
      const commissionRate = parseFloat(form.commissionRate) || 0;
      
      const processedVariants = form.variants.map(v => ({ 
        ...v, 
        price: parseFloat(v.price) || price,
        stock: v.stock === '' ? 0 : Number(v.stock) 
      }));

      if (selectedFiles.length > 0) {
        // MULTIPART/FORM-DATA PATH
        const formData = new FormData();
        formData.append('name', form.name.trim());
        formData.append('description', form.description.trim());
        formData.append('category', form.category.join(', '));
        formData.append('price', price.toString());
        formData.append('stock', Math.floor(stock).toString()); // Ensure integer for Prisma
        formData.append('commissionRate', commissionRate.toString());
        
        // Variants must be stringified for FormData
        formData.append('variants', JSON.stringify(processedVariants));

        // Append image URLs individually as imageUrls
        imageUrls.forEach(url => formData.append('imageUrls', url));
        
        // Append selected files to 'productImages' key
        selectedFiles.forEach(file => formData.append('productImages', file));
        
        // Singular fallback for logic
        if (selectedFiles[0]) {
          formData.set('image', 'FILE_UPLOAD'); // Marker
        } else if (imageUrls[0]) {
          formData.set('image', imageUrls[0]);
        }

        console.log('Publishing with FormData (productImages):', Array.from(formData.keys()));
        await createBrandProduct(token, formData);
      } else {
        // JSON PATH
        const jsonPayload = {
          name: form.name.trim(),
          category: form.category.join(', '),
          description: form.description.trim(),
          price,
          stock: Math.floor(stock),
          commissionRate,
          variants: processedVariants,
          imageUrls: imageUrls, // Explicit key
          image: imageUrls[0] || ''
        };

        console.log('Publishing with JSON:', jsonPayload);
        await createBrandProduct(token, jsonPayload as any);
      }
      setForm({ name: '', category: [], description: '', images: '', price: '', commissionRate: '', stock: '', variants: [] });
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowAddForm(false);
      loadProducts();
      toast.success('Product submitted for review!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    const token = localStorage.getItem('wellnest_token');
    if (!token) return;
    try {
      await deleteBrandProduct(token, productId);
      loadProducts();
      toast.success('Product removed');
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Package className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-xl text-[#1A2E05]">Product Catalog</h3>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)} 
          variant={showAddForm ? 'outline' : 'default'}
          className="rounded-xl h-10 font-bold gap-2"
        >
          {showAddForm ? 'Cancel' : <><Plus className="h-4 w-4" /> Add Product</>}
        </Button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-muted/30 rounded-[2rem] p-8 border border-border/50 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Product Name</Label>
                  <Input 
                    className="rounded-xl h-12 border-border/60 bg-white" 
                    placeholder="e.g. Organic Matcha Powder" 
                    value={form.name} 
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Categories (Select Multiple)</Label>
                  <div className="flex flex-wrap gap-2 p-3 min-h-[50px] bg-white border border-border/60 rounded-xl focus-within:ring-1 focus-within:ring-primary transition-all">
                    {form.category.map((cat, idx) => (
                      <Badge key={idx} variant="secondary" className="pl-3 pr-1 py-1 rounded-full bg-primary/10 text-primary border-primary/20 flex items-center gap-1 group">
                        <span className="text-[11px] font-bold">{cat}</span>
                        <button 
                          onClick={() => setForm(f => ({ ...f, category: f.category.filter(c => c !== cat) }))}
                          className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    <input 
                      className="bg-transparent border-none outline-none text-xs flex-1 min-w-[120px] placeholder:text-muted-foreground" 
                      placeholder={form.category.length === 0 ? "e.g. Wellness, Supplement" : "Add more..."}
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      onKeyDown={e => {
                        if ((e.key === 'Enter' || e.key === ',') && newCategory.trim()) {
                          e.preventDefault();
                          const val = newCategory.trim().replace(/,/g, '');
                          if (!form.category.includes(val)) {
                            setForm(f => ({ ...f, category: [...f.category, val] }));
                          }
                          setNewCategory('');
                        }
                      }}
                    />
                  </div>
                  
                  {/* Suggestions */}
                  <div className="flex flex-wrap gap-1.5 px-1 overflow-x-auto pb-1">
                    {CATEGORIES.filter(cat => !form.category.includes(cat)).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setForm(f => ({ ...f, category: [...f.category, cat] }))}
                        className="text-[9px] font-bold text-muted-foreground hover:text-primary px-2 py-1 bg-muted/50 hover:bg-primary/5 rounded-full transition-all border border-transparent hover:border-primary/20"
                      >
                        + {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                <Textarea 
                  className="rounded-xl min-h-[100px] border-border/60 bg-white" 
                  placeholder="Tell your customers and affiliates about the benefits..." 
                  value={form.description} 
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Price (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      className="rounded-xl h-12 pl-10 border-border/60 bg-white" 
                      value={form.price} 
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Affiliate Commission (%)</Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      className="rounded-xl h-12 pl-10 border-border/60 bg-white" 
                      value={form.commissionRate} 
                      onChange={e => setForm(f => ({ ...f, commissionRate: e.target.value }))} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Stock Availability</Label>
                  <div className="relative">
                    <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      className="rounded-xl h-12 pl-10 border-border/60 bg-white" 
                      value={form.stock} 
                      onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} 
                    />
                  </div>
                </div>
              </div>

              {/* Product Variants Section */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Product Variants (Weight-Based)</Label>
                    <div className="p-1 bg-primary/10 rounded-full text-primary">
                      <Plus className="h-3 w-3" />
                    </div>
                  </div>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
                    onClick={() => {
                      const newVariant = { 
                        quantity: '', 
                        unit: 'g', 
                        size: '', 
                        price: form.price, 
                        stock: form.stock,
                        sku: ''
                      };
                      setForm(f => ({
                        ...f, 
                        variants: [...f.variants, newVariant]
                      }));
                    }}
                  >
                    + Add Variant
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-border/40 bg-white/50">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border/40">
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-20">Weight</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-24">Unit</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-28">Price (₹)</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-24">Stock</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">SKU (Auto)</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {form.variants.map((variant, idx) => (
                        <tr key={idx} className="group/row hover:bg-white transition-colors">
                          <td className="px-4 py-3">
                            <Input 
                              type="number" 
                              className="h-8 rounded-lg text-xs" 
                              value={variant.quantity} 
                              onChange={e => {
                                const val = e.target.value;
                                setForm(f => {
                                  const newVariants = [...f.variants];
                                  const sku = `${f.name.substring(0, 3).toUpperCase()}-${val}${variant.unit}`.replace(/\s+/g, '');
                                  newVariants[idx] = { ...variant, quantity: val, sku };
                                  return { ...f, variants: newVariants };
                                });
                              }}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              className="w-full h-8 rounded-lg border border-border/60 bg-white text-xs px-1 focus:ring-1 focus:ring-primary outline-none"
                              value={variant.unit}
                              onChange={e => {
                                const unit = e.target.value;
                                setForm(f => {
                                  const newVariants = [...f.variants];
                                  const sku = `${f.name.substring(0, 3).toUpperCase()}-${variant.quantity}${unit}`.replace(/\s+/g, '');
                                  newVariants[idx] = { ...variant, unit, sku };
                                  return { ...f, variants: newVariants };
                                });
                              }}
                            >
                              {['g', 'kg', 'ml', 'L'].map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <Input 
                              type="number" 
                              className="h-8 rounded-lg text-xs" 
                              value={variant.price} 
                              onChange={e => {
                                setForm(f => {
                                  const newVariants = [...f.variants];
                                  newVariants[idx] = { ...variant, price: e.target.value };
                                  return { ...f, variants: newVariants };
                                });
                              }}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input 
                              type="number" 
                              className="h-8 rounded-lg text-xs" 
                              value={variant.stock} 
                              onChange={e => {
                                setForm(f => {
                                  const newVariants = [...f.variants];
                                  newVariants[idx] = { ...variant, stock: e.target.value };
                                  return { ...f, variants: newVariants };
                                });
                              }}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input 
                              className="h-8 rounded-lg text-[10px] font-mono bg-muted/30" 
                              placeholder="AUTO-GEN"
                              value={variant.sku} 
                              readOnly
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 rounded-full hover:bg-red-50 hover:text-red-500 opacity-0 group-hover/row:opacity-100 transition-opacity"
                              onClick={() => setForm(f => ({
                                ...f,
                                variants: f.variants.filter((_, i) => i !== idx)
                              }))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {form.variants.length === 0 && (
                    <div className="py-10 text-center">
                      <div className="inline-flex p-3 bg-muted rounded-full mb-3">
                        <ListFilter className="h-5 w-5 text-muted-foreground opacity-40" />
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium">Click "+ Add Variant" to set different sizes/weights.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Image URLs (optional)</Label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="rounded-xl h-12 pl-10 border-border/60 bg-white" 
                      placeholder="https://images.unsplash.com/photo-1..." 
                      value={form.images} 
                      onChange={e => setForm(f => ({ ...f, images: e.target.value }))} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Upload Images</Label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;
                        const arr = Array.from(files);
                        previewUrls.forEach(url => URL.revokeObjectURL(url));
                        setSelectedFiles(arr);
                        setPreviewUrls(arr.map(file => URL.createObjectURL(file)));
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl h-12 font-black gap-2" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-4 w-4" /> Select Files
                    </Button>
                    {selectedFiles.length > 0 && (
                      <div className="text-[12px] text-muted-foreground flex flex-wrap gap-2">
                        {selectedFiles.map((file, index) => (
                          <span key={`${file.name}-${index}`} className="px-2 py-1 rounded-full bg-muted/30">
                            {file.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {previewUrls.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-2">
                      {previewUrls.map((url, idx) => (
                        <img key={idx} src={url} alt="preview" className="h-16 w-16 rounded-2xl object-cover border border-border/40 shadow-sm" />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button 
                className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20" 
                onClick={handleCreate}
                disabled={isLoading}
              >
                {isLoading ? 'Uploading...' : 'Publish Product'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6">
        {products.map((product, i) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group flex flex-col md:flex-row items-center gap-6 p-6 rounded-[2rem] bg-white border border-border/50 hover:border-primary/20 hover:shadow-xl transition-all"
          >
            <div className="h-24 w-24 rounded-2xl bg-muted/30 overflow-hidden flex-shrink-0">
              {product.images && product.images[0] ? (
                <img src={resolveImageUrl(product.images[0])} alt={product.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (product as any).image ? (
                <img src={resolveImageUrl((product as any).image)} alt={product.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <h4 className="font-bold text-lg">{product.name}</h4>
                {product.status === 'APPROVED' ? (
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-emerald-50 text-emerald-600">Active</span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-orange-50 text-orange-600">Pending Review</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-medium line-clamp-1">{product.description}</p>
              
              {(() => {
                const parsedVariants = parseVariants(product.variants);
                return parsedVariants.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
                    {parsedVariants.map((v: any, i: number) => (
                      <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10">
                        {v.quantity}{v.unit} • {v.size} {v.price ? `(₹${v.price})` : ''}
                      </span>
                    ))}
                  </div>
                );
              })()}

              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground justify-center md:justify-start pt-2">
                <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {product.category}</span>
                <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {product.stock} in stock</span>
                <span className="text-primary font-black">{product.commissionRate}% Comm.</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block px-6 border-r border-border/40">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price</p>
                <p className="text-xl font-black">{formatPrice(product.price)}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id)}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        ))}

        {products.length === 0 && (
          <div className="text-center py-20 bg-muted/10 rounded-[2.5rem] border border-dashed border-border/50">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">No products in your catalog yet.</p>
            <Button variant="link" onClick={() => setShowAddForm(true)} className="font-bold text-primary">Add your first product</Button>
          </div>
        )}
      </div>
    </div>
  );
}
