import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPosts, deletePostAdmin, updatePostAdmin } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  MoreVertical,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface FeedListProps {
  onEdit: (post: any) => void;
}

export default function FeedList({ onEdit }: FeedListProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['adminPosts'],
    queryFn: () => getPosts()
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePostAdmin(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
      toast.success('Post deleted successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete post')
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string, published: boolean }) => 
      updatePostAdmin(token!, id, { published }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
      toast.success('Status updated');
    }
  });

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-white rounded-[2rem] border border-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-[#7BAE7F]" />
      </div>
    );
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (deletingId === id) {
      setDeletingId(null);
      toast.promise(
        deletePostAdmin(token!, id),
        {
          loading: 'Deleting post from server...',
          success: () => {
            queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
            return 'Post deleted successfully!';
          },
          error: (err: any) => `Failed to delete post: ${err.message}`
        }
      );
    } else {
      setDeletingId(id);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const togglePublish = (id: string, currentStatus: boolean) => {
    publishMutation.mutate({ id, published: !currentStatus });
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="border-slate-100 hover:bg-transparent">
            <TableHead className="w-[100px] text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Thumbnail</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Title & Category</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Status</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Date</TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors group">
              <TableCell className="py-4">
                <div className="h-14 w-14 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                  <img src={post.images?.[0] || 'https://placehold.co/100x100?text=Post'} className="h-full w-full object-cover transition-transform group-hover:scale-110" alt="" />
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="space-y-1">
                  <p className="font-bold text-[#2C2C2C]">{post.title}</p>
                  <Badge variant="outline" className="text-[10px] font-black bg-slate-50 border-slate-100 text-[#7BAE7F] px-1.5 py-0">
                    {post.category}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="py-4">
                {post.published ? (
                  <div className="flex items-center gap-1.5 text-[#7BAE7F]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-tighter">Published</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-tighter">Draft</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-bold">{new Date(post.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </TableCell>
              <TableCell className="text-right py-4">
                <div className="flex items-center justify-end gap-2">
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEdit(post)}
                    className="rounded-xl h-10 w-10 hover:bg-[#7BAE7F]/10 hover:text-[#7BAE7F]"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant={deletingId === post.id ? "default" : "ghost"} 
                    size={deletingId === post.id ? "default" : "icon"} 
                    onClick={(e) => handleDelete(e, post.id)}
                    className={deletingId === post.id ? 'rounded-xl h-10 bg-red-500 hover:bg-red-600 text-white px-4 font-bold text-xs' : 'rounded-xl h-10 w-10 hover:bg-red-50 hover:text-red-500 text-slate-400'}
                  >
                    {deletingId === post.id ? 'Confirm?' : <Trash2 className="h-4 w-4" />}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-xl p-2 min-w-[160px]">
                      <DropdownMenuItem 
                        onClick={() => togglePublish(post.id, post.published)}
                        className="rounded-xl focus:bg-[#7BAE7F]/5 focus:text-[#7BAE7F] font-bold py-2.5"
                      >
                         {post.published ? 'Unpublish' : 'Publish Now'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
