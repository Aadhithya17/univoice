import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Post } from '../types';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import { CalendarDays, ShieldAlert, Award, FileText, UserCircle } from 'lucide-react';

export const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  const fetchProfileData = async () => {
    if (!username) return;
    setLoading(true);
    setPostsLoading(true);

    try {
      // 1. Fetch user metadata profile
      const userRes = await api.get(`/auth/profile/${username}`);
      if (userRes.success) {
        setProfileUser(userRes.user);
      }

      // 2. Fetch confessions by this author
      const postsRes = await api.get(`/posts?author=${encodeURIComponent(username)}&limit=50`);
      if (postsRes.success) {
        setProfilePosts(postsRes.posts);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to load profile details', 'error');
      setProfileUser(null);
    } finally {
      setLoading(false);
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [username]);

  const isOwnProfile = currentUser && currentUser.username === username;

  return (
    <div className="min-h-screen bg-black light-theme:bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Main profile content */}
          <div className="flex-1 min-w-0 space-y-6">
            
            {loading ? (
              <div className="glass-panel p-12 rounded-3xl flex flex-col items-center justify-center gap-3 animate-pulse">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                <p className="text-xs text-slate-500">Loading student profile...</p>
              </div>
            ) : !profileUser ? (
              <div className="glass-panel p-12 rounded-3xl text-center">
                <UserCircle size={48} className="text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-350">Student Profile Not Found</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  The requested username "{username}" does not exist in the college directory.
                </p>
                <Link to="/" className="btn-primary text-xs">
                  Return to Feed
                </Link>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Profile header card */}
                <div className="glass-panel rounded-3xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 relative overflow-hidden">
                  {/* Avatar bubble */}
                  <div className="shrink-0 relative">
                    <img
                      src={profileUser.avatar}
                      alt={profileUser.username}
                      className="h-20 w-20 rounded-full border-2 border-brand-500/25 bg-slate-900"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 text-center sm:text-left min-w-0 space-y-2.5">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h1 className="text-xl font-bold text-slate-100 light-theme:text-slate-900 truncate">
                          {profileUser.username}
                        </h1>
                        {/* Role tag */}
                        <span className="inline-block self-center sm:self-auto px-2 py-0.5 rounded bg-brand-500/10 text-brand-450 border border-brand-500/20 text-[10px] uppercase font-bold tracking-wider">
                          {profileUser.role}
                        </span>
                      </div>
                      {isOwnProfile && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{profileUser.email}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 light-theme:text-slate-550">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-slate-500" />
                        <span>
                          Member since{' '}
                          {new Date(profileUser.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award size={14} className="text-slate-500" />
                        <span>{profilePosts.length} Public Confessions</span>
                      </div>
                    </div>
                  </div>

                  {/* Private message indicator */}
                  {isOwnProfile && (
                    <span className="absolute top-4 right-4 bg-brand-600/10 text-brand-400 border border-brand-500/20 rounded px-2.5 py-1 text-[10px] font-semibold">
                      Private View
                    </span>
                  )}
                </div>

                {/* Feed Tab Section Header */}
                <div className="space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                    <FileText size={15} />
                    Public Confessions History
                  </h2>

                  {postsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((n) => (
                        <div key={n} className="glass-panel p-6 rounded-2xl animate-pulse space-y-3">
                          <div className="h-4 w-32 bg-slate-800 rounded"></div>
                          <div className="h-10 w-full bg-slate-800 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : profilePosts.length === 0 ? (
                    <div className="glass-panel p-10 rounded-2xl text-center text-xs text-slate-500 border-dashed border-slate-800 light-theme:border-slate-200">
                      This student hasn't published any public confessions yet (or they chose to post anonymously).
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profilePosts.map((post) => (
                        <PostCard
                          key={post._id}
                          post={post}
                          onDeleteSuccess={(deletedId) =>
                            setProfilePosts((prev) => prev.filter((p) => p._id !== deletedId))
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

              </div>
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
export default Profile;
