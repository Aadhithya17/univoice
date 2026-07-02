import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Post } from '../types';
import { api } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import { ArrowUpDown, Flame, HelpCircle, Hash, RefreshCw, X } from 'lucide-react';

export const Home: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { socket } = useSocket();
  const { toast } = useToast();

  // URL parameters states
  const search = searchParams.get('search') || '';
  const [sort, setSort] = useState<'new' | 'hot' | 'top'>('new');

  // Feed post states
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch feed posts
  const fetchPosts = async (pageNumber: number, append = false) => {
    if (pageNumber === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let queryUrl = `/posts?page=${pageNumber}&limit=10&sort=${sort}`;
      if (search) {
        queryUrl += `&search=${encodeURIComponent(search)}`;
      }

      const res = await api.get(queryUrl);
      if (res.success) {
        if (append) {
          setPosts((prev) => {
            // Filter out any duplicates
            const existingIds = new Set(prev.map(p => p._id));
            const newPosts = res.posts.filter((p: Post) => !existingIds.has(p._id));
            return [...prev, ...newPosts];
          });
        } else {
          setPosts(res.posts);
        }
        setTotalPages(res.totalPages);
        setPage(res.currentPage);
      }
    } catch (err: any) {
      toast(err.message || 'Error loading feed posts', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Re-fetch when sort or parameters change
  useEffect(() => {
    fetchPosts(1, false);
  }, [search, sort]);

  // Socket setup to listen for live new posts
  useEffect(() => {
    if (!socket) return;

    const handleNewPost = (newPost: Post) => {
      // Prepend if sorting is 'new' and no filters are present
      if (sort === 'new' && !search) {
        setPosts((prev) => {
          if (prev.some((p) => p._id === newPost._id)) return prev;
          return [newPost, ...prev];
        });
      }
    };

    const handleDeletePost = (deletedPostId: string) => {
      setPosts((prev) => prev.filter((p) => p._id !== deletedPostId));
    };

    socket.on('post:new', handleNewPost);
    socket.on('post:delete', handleDeletePost);

    return () => {
      socket.off('post:new', handleNewPost);
      socket.off('post:delete', handleDeletePost);
    };
  }, [socket, sort, search]);

  const loadMorePosts = () => {
    if (page < totalPages) {
      fetchPosts(page + 1, true);
    }
  };

  const clearSearch = () => {
    searchParams.delete('search');
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-black light-theme:bg-white flex flex-col">
      <Navbar initialSearchVal={search} onSearch={(q) => {
        if (q) searchParams.set('search', q);
        else searchParams.delete('search');
        searchParams.delete('page');
        setSearchParams(searchParams);
      }} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Desktop Sidebar, Main Column structure */}
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Left panel sidebar (desktop) */}
          <div className="hidden md:block shrink-0">
            <Sidebar />
          </div>

          {/* Main Feed panel */}
          <div className="flex-1 min-w-0 space-y-5">
            
            {/* Header info / sort actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 light-theme:bg-white border border-slate-800/80 light-theme:border-slate-200/80 px-4 py-3 rounded-2xl">
              
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-slate-200 light-theme:text-slate-850">
                  Home Feed
                </span>
                {search && (
                  <span className="flex items-center gap-1.5 bg-slate-800/60 light-theme:bg-slate-100 border border-slate-700/30 text-xs px-2.5 py-1 rounded-full text-slate-400">
                    Search: "{search}"
                    <button onClick={clearSearch} className="hover:text-slate-200">
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>

              {/* Sorting triggers */}
              <div className="flex items-center gap-1 bg-slate-950/60 light-theme:bg-slate-50 border border-slate-850 light-theme:border-slate-200 rounded-lg p-0.5 self-end sm:self-auto">
                <button
                  onClick={() => setSort('new')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    sort === 'new'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-500 hover:text-slate-300 light-theme:text-slate-600 light-theme:hover:text-slate-800'
                  }`}
                >
                  <RefreshCw size={12} />
                  New
                </button>
                <button
                  onClick={() => setSort('hot')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    sort === 'hot'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-500 hover:text-slate-300 light-theme:text-slate-600 light-theme:hover:text-slate-800'
                  }`}
                >
                  <Flame size={12} />
                  Hot
                </button>
                <button
                  onClick={() => setSort('top')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    sort === 'top'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-500 hover:text-slate-300 light-theme:text-slate-600 light-theme:hover:text-slate-800'
                  }`}
                >
                  <ArrowUpDown size={12} />
                  Top
                </button>
              </div>

            </div>

            {/* Mobile filters (only visible on small screens) */}
            <div className="md:hidden">
              <Sidebar />
            </div>

            {/* Posts feed */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="glass-panel p-6 rounded-2xl space-y-4 animate-pulse">
                    <div className="flex gap-2">
                      <div className="h-5 w-5 bg-slate-800 rounded-full"></div>
                      <div className="h-4 w-32 bg-slate-800 rounded"></div>
                    </div>
                    <div className="h-6 w-3/4 bg-slate-800 rounded"></div>
                    <div className="h-16 w-full bg-slate-800 rounded"></div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center justify-center border-dashed border-slate-800 light-theme:border-slate-200">
                <HelpCircle size={40} className="text-slate-550 mb-3" />
                <h3 className="text-base font-bold text-slate-300 light-theme:text-slate-850">
                  No confessions found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">
                  We couldn't find any confessions matching the current keywords. Be the first to start a conversation!
                </p>
                <Link to="/create-post" className="btn-primary text-xs font-semibold">
                  Publish a confession
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onDeleteSuccess={(deletedId) =>
                      setPosts((prev) => prev.filter((p) => p._id !== deletedId))
                    }
                  />
                ))}

                {/* Load More Button */}
                {page < totalPages && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={loadMorePosts}
                      disabled={loadingMore}
                      className="px-6 py-2.5 rounded-xl border border-slate-800 light-theme:border-slate-200 hover:bg-slate-900 light-theme:hover:bg-slate-100 text-slate-400 hover:text-slate-250 text-xs font-bold transition-all disabled:opacity-40"
                    >
                      {loadingMore ? 'Loading more confessions...' : 'Load More Confessions'}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
};
export default Home;
