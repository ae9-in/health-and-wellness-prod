import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getBrandProducts, createBrandProduct, deleteBrandProduct } from '@/lib/api';
import { Product } from '@/lib/types';
import { formatPrice, parseVariants } from '@/lib/utils';
import { toast } from 'sonner';
import { Package, Plus, Trash2, Image as ImageIcon, IndianRupee, Tag, Info, ListFilter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BrandProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    images: '',
    price: '',
    commissionRate: '',
    stock: '',
    variants: [] as any[]
  });
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
    if (!form.name || !form.category || !form.description || !form.price || !form.stock) {
      toast.error('Required fields: Name, Category, Description, Price, Stock');
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('wellnest_token');
      if (!token) throw new Error('Not authenticated');
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description,
        images: form.images ? form.images.split(',').map((img: string) => img.trim()).filter(Boolean) : [],
        price: parseFloat(form.price) || 0,
        commissionRate: parseFloat(form.commissionRate) || 0,
        stock: Number(form.stock) || 0,
        variants: form.variants.length > 0 ? JSON.stringify(form.variants) : undefined
      };

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          formData.append(key, value.toString());
        });
        selectedFiles.forEach(file => formData.append('images', file));
        await createBrandProduct(token, formData);
      } else {
        await createBrandProduct(token, payload as any);
      }
      setForm({ name: '', category: '', description: '', images: '', price: '', commissionRate: '', stock: '', variants: [] });
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
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</Label>
                  <Input 
                    className="rounded-xl h-12 border-border/60 bg-white" 
                    placeholder="e.g. Superfoods" 
                    value={form.category} 
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))} 
                  />
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
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Product Variants</Label>
                    <div className="p-1 bg-primary/10 rounded-full text-primary">
                      <Plus className="h-3 w-3" />
                    </div>
                  </div>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
                    onClick={() => setForm(f => ({
                      ...f, 
                      variants: [...f.variants, { quantity: '', unit: 'ml', size: '', price: f.price, stock: f.stock }]
                    }))}
                  >
                    + Add Variant
                  </Button>
                </div>

                <div className="space-y-4">
                  {form.variants.map((variant, idx) => (
                    <div key={idx} className="bg-white/50 rounded-2xl p-4 border border-border/40 relative group/variant">
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-50 text-red-500 border border-red-100 opacity-0 group-hover/variant:opacity-100 transition-opacity z-10"
                        onClick={() => setForm(f => ({
                          ...f,
                          variants: f.variants.filter((_, i) => i !== idx)
                        }))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Qty</Label>
                          <Input 
                            type="number" 
                            className="h-9 rounded-lg text-xs" 
                            value={variant.quantity} 
                            onChange={e => {
                              const val = e.target.value;
                              setForm(f => {
                                const newVariants = [...f.variants];
                                let sizeSuggestion = variant.size;
                                if (val) {
                                  const q = parseFloat(val);
                                  if (variant.unit === 'ml') {
                                    if (q < 200) sizeSuggestion = 'Small';
                                    else if (q < 500) sizeSuggestion = 'Medium';
                                    else sizeSuggestion = 'Large';
                                  }
                                }
                                newVariants[idx] = { ...variant, quantity: val, size: sizeSuggestion };
                                return { ...f, variants: newVariants };
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Unit</Label>
                          <select 
                            className="w-full h-9 rounded-lg border border-border/60 bg-white text-xs px-2 focus:ring-1 focus:ring-primary outline-none"
                            value={variant.unit}
                            onChange={e => {
                              setForm(f => {
                                const newVariants = [...f.variants];
                                newVariants[idx] = { ...variant, unit: e.target.value };
                                return { ...f, variants: newVariants };
                              });
                            }}
                          >
                            {['ml', 'liter', 'gram', 'kg', 'pieces', 'tablets', 'capsules'].map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Size / Label</Label>
                          <Input 
                            className="h-9 rounded-lg text-xs" 
                            placeholder="e.g. Medium"
                            value={variant.size} 
                            onChange={e => {
                              setForm(f => {
                                const newVariants = [...f.variants];
                                newVariants[idx] = { ...variant, size: e.target.value };
                                return { ...f, variants: newVariants };
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Price (₹)</Label>
                          <Input 
                            type="number" 
                            className="h-9 rounded-lg text-xs" 
                            value={variant.price} 
                            onChange={e => {
                              setForm(f => {
                                const newVariants = [...f.variants];
                                newVariants[idx] = { ...variant, price: e.target.value };
                                return { ...f, variants: newVariants };
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Stock</Label>
                          <Input 
                            type="number" 
                            className="h-9 rounded-lg text-xs" 
                            value={variant.stock} 
                            onChange={e => {
                              setForm(f => {
                                const newVariants = [...f.variants];
                                newVariants[idx] = { ...variant, stock: e.target.value };
                                return { ...f, variants: newVariants };
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {form.variants.length === 0 && (
                    <div className="py-6 border-2 border-dashed border-border/30 rounded-[2rem] text-center">
                      <p className="text-[11px] text-muted-foreground font-medium">No variants added. Click "+ Add Variant" to include multiple sizes.</p>
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
                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
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
