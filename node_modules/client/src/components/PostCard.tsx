import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { formatRelativeTime } from '../utils/date';
import { api } from '../utils/api';
import { ReportModal } from './ReportModal';
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  AlertTriangle,
  Trash2,
  Share2,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  isDetailView?: boolean;
  onDeleteSuccess?: (postId: string) => void;
}

const EMOJIS = [
  { type: 'like', char: '❤️', label: 'Like' },
  { type: 'laugh', char: '😂', label: 'Laugh' },
  { type: 'sad', char: '😢', label: 'Sad' },
  { type: 'angry', char: '😠', label: 'Angry' },
];

const getReactionEntries = (rawReactionUsers: any): [string, string][] => {
  if (!rawReactionUsers) return [];
  if (Array.isArray(rawReactionUsers)) return rawReactionUsers;
  return Object.entries(rawReactionUsers);
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  isDetailView = false,
  onDeleteSuccess,
}) => {
  const { user, isAuthenticated, isGuest } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Local synchronized state
  const [upvotes, setUpvotes] = useState<string[]>(post.upvotes);
  const [downvotes, setDownvotes] = useState<string[]>(post.downvotes);
  const [score, setScore] = useState<number>(post.score);
  const [reactions, setReactions] = useState(post.reactions);
  const [reactionUsers, setReactionUsers] = useState<[string, string][]>(
    getReactionEntries(post.reactionUsers)
  );
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync state if post prop changes (e.g. navigation or re-render)
  useEffect(() => {
    setUpvotes(post.upvotes);
    setDownvotes(post.downvotes);
    setScore(post.score);
    setReactions(post.reactions);
    setReactionUsers(getReactionEntries(post.reactionUsers));
  }, [post]);

  // Real-time socket sync
  useEffect(() => {
    if (!socket) return;

    const handleVoteUpdate = (data: { postId: string; upvotes: string[]; downvotes: string[]; score: number }) => {
      if (data.postId === post._id) {
        setUpvotes(data.upvotes);
        setDownvotes(data.downvotes);
        setScore(data.score);
      }
    };

    const handleReactUpdate = (data: { postId: string; reactions: any; reactionUsers: any }) => {
      if (data.postId === post._id) {
        setReactions(data.reactions);
        setReactionUsers(getReactionEntries(data.reactionUsers));
      }
    };

    socket.on('post:vote', handleVoteUpdate);
    socket.on('post:react', handleReactUpdate);

    return () => {
      socket.off('post:vote', handleVoteUpdate);
      socket.off('post:react', handleReactUpdate);
    };
  }, [socket, post._id]);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (isGuest || !isAuthenticated) {
      toast('Please sign in or create an account to vote.', 'error');
      return;
    }

    try {
      const res = await api.put(`/posts/${post._id}/vote`, { voteType });
      if (res.success) {
        setUpvotes(res.upvotes);
        setDownvotes(res.downvotes);
        setScore(res.score);
      }
    } catch (err: any) {
      toast(err.message || 'Error processing vote', 'error');
    }
  };

  const handleReact = async (reactionType: string) => {
    if (isGuest || !isAuthenticated) {
      toast('Please sign in or create an account to react.', 'error');
      return;
    }

    try {
      const res = await api.put(`/posts/${post._id}/react`, { reactionType });
      if (res.success) {
        setReactions(res.reactions);
        setReactionUsers(getReactionEntries(res.reactionUsers));
      }
    } catch (err: any) {
      toast(err.message || 'Error toggling reaction', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this confession?')) return;
    setDeleting(true);

    try {
      const res = await api.delete(`/posts/${post._id}`);
      if (res.success) {
        toast('Confession removed successfully.', 'success');
        if (onDeleteSuccess) {
          onDeleteSuccess(post._id);
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      toast(err.message || 'Failed to delete post', 'error');
      setDeleting(false);
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(postUrl);
    toast('Post link copied to clipboard!', 'success');
  };

  const handleReportClick = () => {
    if (isGuest || !isAuthenticated) {
      toast('Please sign in to file a report.', 'error');
      return;
    }
    setReportModalOpen(true);
  };

  // Check user values
  const currentUserId = user?.id;
  const isUpvoted = currentUserId ? upvotes.includes(currentUserId) : false;
  const isDownvoted = currentUserId ? downvotes.includes(currentUserId) : false;
  const userReaction = currentUserId
    ? reactionUsers.find(([uid]) => uid === currentUserId)?.[1]
    : undefined;

  const isAuthor = currentUserId && post.author._id === currentUserId;
  const canDelete = isAuthor || (user?.role === 'admin' || user?.role === 'moderator');

  return (
    <article className="w-full glass-panel rounded-2xl p-5 hover:border-slate-700/80 light-theme:hover:border-slate-350 transition-all duration-200 flex gap-4">
      {/* Upvote & Downvote Panel */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 self-start">
        <button
          onClick={() => handleVote('upvote')}
          className={`p-1 rounded-lg hover:bg-slate-850 light-theme:hover:bg-slate-100 transition-colors ${
            isUpvoted ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Upvote"
        >
          <ArrowBigUp size={24} className={isUpvoted ? 'fill-indigo-400/20' : ''} />
        </button>
        <span
          className={`text-sm font-bold ${
            score > 0 ? 'text-indigo-400' : score < 0 ? 'text-rose-500' : 'text-slate-400'
          }`}
        >
          {score}
        </span>
        <button
          onClick={() => handleVote('downvote')}
          className={`p-1 rounded-lg hover:bg-slate-850 light-theme:hover:bg-slate-100 transition-colors ${
            isDownvoted ? 'text-rose-500' : 'text-slate-500 hover:text-slate-350'
          }`}
          title="Downvote"
        >
          <ArrowBigDown size={24} className={isDownvoted ? 'fill-rose-500/20' : ''} />
        </button>
      </div>

      {/* Main content body */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        
        {/* Meta Header */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 light-theme:text-slate-400 mb-2">
          <div className="flex items-center gap-2">
            <img
              src={post.author.avatar}
              alt="avatar"
              className="h-5 w-5 rounded-full bg-slate-800 border border-slate-700/30"
            />
            {post.isAnonymous ? (
              <span className="font-semibold text-slate-450">Anonymous Student</span>
            ) : (
              <Link
                to={`/profile/${post.author.username}`}
                className="font-semibold text-slate-300 hover:text-indigo-400 transition-colors"
              >
                {post.author.username}
              </Link>
            )}
            <span>•</span>
            <span>{formatRelativeTime(post.createdAt)}</span>
          </div>

          <div className="flex items-center gap-1">
            {post.author.role === 'admin' && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-bold border border-indigo-500/20 text-[9px] uppercase">
                Admin
              </span>
            )}
            {post.author.role === 'moderator' && (
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/20 text-[9px] uppercase">
                Mod
              </span>
            )}
          </div>
        </div>

        {/* Title & Body */}
        <div className="mb-3">
          {post.title && (
            <h2 className="text-base font-bold text-slate-100 light-theme:text-slate-900 mb-1 leading-snug">
              {isDetailView ? (
                post.title
              ) : (
                <Link to={`/post/${post._id}`} className="hover:text-indigo-400 transition-colors">
                  {post.title}
                </Link>
              )}
            </h2>
          )}
          <p className="text-sm text-slate-300 light-theme:text-slate-755 leading-relaxed whitespace-pre-wrap break-words">
            {post.body}
          </p>
        </div>

        {/* Uploaded Image */}
        {post.image && (
          <div className="mb-4 rounded-xl overflow-hidden border border-slate-800 light-theme:border-slate-200 bg-slate-950 max-h-[350px] flex items-center justify-center">
            <img
              src={`${api.backendUrl}${post.image}`}
              alt="Confession attachments"
              className="w-full h-full object-cover max-h-[350px] hover:scale-102 transition-transform duration-300"
              onError={(e) => {
                // If static serving absolute URL fails, hide or use fallback
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}


        {/* Actions Tray */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-850 light-theme:border-slate-100 pt-3 gap-3">
          
          {/* Reaction Emojis Panel */}
          <div className="flex items-center gap-1.5 bg-slate-950/40 light-theme:bg-slate-50 border border-slate-900 light-theme:border-slate-200 px-2.5 py-1 rounded-full">
            {EMOJIS.map((emoji) => {
              const count = reactions[emoji.type as 'like' | 'laugh' | 'sad' | 'angry'] || 0;
              const active = userReaction === emoji.type;
              return (
                <button
                  key={emoji.type}
                  onClick={() => handleReact(emoji.type)}
                  className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full transition-all ${
                    active
                      ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 scale-105 font-bold'
                      : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                  title={emoji.label}
                >
                  <span>{emoji.char}</span>
                  {count > 0 && <span className="text-[10px]">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Comment, Share, Report, Delete actions */}
          <div className="flex items-center gap-1 sm:gap-2.5 text-xs text-slate-500">
            
            <Link
              to={`/post/${post._id}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-850 light-theme:hover:bg-slate-100 hover:text-slate-350 transition-colors"
            >
              <MessageSquare size={15} />
              <span className="hidden sm:inline">Comments</span>
            </Link>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-850 light-theme:hover:bg-slate-100 hover:text-slate-350 transition-colors"
              title="Copy link"
            >
              <Share2 size={15} />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={handleReportClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 transition-colors text-slate-500"
              title="Report confession"
            >
              <AlertTriangle size={15} />
              <span className="hidden sm:inline">Report</span>
            </button>

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-rose-550/10 hover:text-rose-400 transition-colors text-slate-500 disabled:opacity-40"
                title="Delete confession"
              >
                <Trash2 size={15} />
                <span className="hidden sm:inline">{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            )}

          </div>

        </div>

      </div>

      {/* Embedded Report Modal popup */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        contentType="post"
        targetId={post._id}
      />
    </article>
  );
};
export default PostCard;
