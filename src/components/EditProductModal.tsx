import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CATEGORIES } from '@/lib/constants';
import { Package, Trash2, Image as ImageIcon, IndianRupee, Tag, ListFilter, X, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateBrandProduct, updateAdminProduct } from '@/lib/api';
import { Product } from '@/lib/types';
import { parseVariants, resolveImageUrl } from '@/lib/utils';

interface EditProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isAdmin?: boolean;
}

export default function EditProductModal({ product, open, onOpenChange, onSuccess, isAdmin = false }: EditProductModalProps) {
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        category: product.category.split(',').map(c => c.trim()),
        description: product.description,
        images: (product.images || []).join(', '),
        price: product.price?.toString() || '',
        commissionRate: product.commissionRate?.toString() || '',
        stock: product.stock?.toString() || '',
        variants: parseVariants(product.variants)
      });
    }
  }, [product]);

  const handleUpdate = async () => {
    if (!product) return;
    if (!form.name.trim()) return toast.error('Product name is required');
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('wellnest_token') || 'admin-token-placeholder';
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category.join(', '));
      formData.append('price', form.price);
      formData.append('stock', form.stock);
      formData.append('commissionRate', form.commissionRate);
      formData.append('variants', JSON.stringify(form.variants));
      
      // Preserve existing images that weren't removed
      const currentImages = form.images.split(',').map(i => i.trim()).filter(Boolean);
      currentImages.forEach(url => formData.append('imageUrls', url));
      
      // Add new files
      selectedFiles.forEach(file => formData.append('productImages', file));

      if (isAdmin) {
        await updateAdminProduct(token, product.id, formData);
      } else {
        await updateBrandProduct(token, product.id, formData);
      }

      toast.success('Product updated successfully!');
      onSuccess();
      onOpenChange(false);
      resetInternalState();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  const resetInternalState = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 border-none shadow-2xl">
        <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
          <DialogTitle className="text-2xl font-black text-[#1A2E05]">Edit Product Details</DialogTitle>
          <p className="text-slate-500 text-sm font-medium">Update inventory, pricing, or re-upload images to Cloudinary.</p>
        </DialogHeader>

        <div className="p-8 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Name</Label>
                  <Input 
                    className="rounded-2xl h-12 border-slate-200 focus-visible:ring-primary/20" 
                    value={form.name} 
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  />
               </div>

               <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</Label>
                  <Textarea 
                    className="rounded-2xl min-h-[120px] border-slate-200 focus-visible:ring-primary/20" 
                    value={form.description} 
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                  />
               </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Management</Label>
                  
                  {/* Current Images */}
                  <div className="flex flex-wrap gap-2">
                    {form.images.split(',').map((img, idx) => img.trim() && (
                      <div key={idx} className="relative group">
                        <img src={resolveImageUrl(img.trim())} className="h-20 w-20 rounded-2xl object-cover border border-slate-100" alt="" />
                        <button 
                          onClick={() => {
                            const remaining = form.images.split(',').filter((_, i) => i !== idx).join(', ');
                            setForm(f => ({ ...f, images: remaining }));
                          }}
                          className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} className="h-20 w-20 rounded-2xl object-cover border-2 border-primary shadow-lg" alt="New upload" />
                        <div className="absolute top-1 left-1 bg-primary text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">New</div>
                        <button 
                          onClick={() => {
                            const newFiles = [...selectedFiles];
                            newFiles.splice(idx, 1);
                            setSelectedFiles(newFiles);
                            const newUrls = [...previewUrls];
                            URL.revokeObjectURL(newUrls[idx]);
                            newUrls.splice(idx, 1);
                            setPreviewUrls(newUrls);
                          }}
                          className="absolute -top-2 -right-2 h-6 w-6 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    {form.images.length === 0 && selectedFiles.length === 0 && (
                      <div className="h-20 w-full rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50/50">
                        <ImageIcon className="h-6 w-6 text-slate-300" />
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles([...selectedFiles, ...files]);
                      setPreviewUrls([...previewUrls, ...files.map(f => URL.createObjectURL(f))]);
                    }} />
                    <Button 
                      variant="outline" 
                      className="w-full rounded-2xl h-12 border-slate-200 font-bold gap-2 text-slate-600 hover:bg-slate-50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Plus className="h-4 w-4" /> Upload to Cloudinary
                    </Button>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Price (₹)</Label>
                    <Input type="number" className="rounded-xl" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Stock</Label>
                    <Input type="number" className="rounded-xl" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                  </div>
               </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="outline" className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
              className="flex-[2] rounded-2xl h-14 font-black uppercase tracking-widest text-lg shadow-xl shadow-primary/20" 
              onClick={handleUpdate}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
