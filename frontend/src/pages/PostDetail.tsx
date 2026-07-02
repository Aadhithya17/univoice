import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Post } from '../types';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import CommentSection from '../components/CommentSection';
import { ArrowLeft, BookOpen } from 'lucide-react';

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPost = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/posts/${id}`);
      if (res.success) {
        setPost(res.post);
      }
    } catch (err: any) {
      toast(err.message || 'Post not found', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  return (
    <div className="min-h-screen bg-black light-theme:bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back navigation links */}
        <div className="mb-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-450 hover:text-slate-200 light-theme:text-slate-500 light-theme:hover:text-slate-800 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Back to Feed
          </button>
        </div>

        {/* Layout */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main Feed Column */}
          <div className="flex-1 min-w-0 space-y-5">
            {loading ? (
              <div className="glass-panel p-10 rounded-2xl flex flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                <p className="text-xs text-slate-500">Loading confession details...</p>
              </div>
            ) : !post ? (
              <div className="glass-panel p-10 rounded-2xl text-center">
                <p className="text-sm text-slate-400 mb-4">Confession not found. It may have been deleted by the author or moderators.</p>
                <Link to="/" className="btn-primary text-sm">
                  Return to Feed
                </Link>
              </div>
            ) : (
              <>
                <PostCard post={post} isDetailView={true} />
                <CommentSection postId={post._id} />
              </>
            )}
          </div>

          {/* Right sidebar */}
          <div className="hidden md:block">
            <Sidebar />
          </div>
        </div>

      </main>
    </div>
  );
};
export default PostDetail;
