import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Comment } from '../types';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { formatRelativeTime } from '../utils/date';
import { ReportModal } from './ReportModal';
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquareReply,
  AlertTriangle,
  Trash2,
  CornerDownRight,
} from 'lucide-react';

interface CommentSectionProps {
  postId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { user, isAuthenticated, isGuest } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Input fields state
  const [newCommentBody, setNewCommentBody] = useState('');
  const [anonymousToggle, setAnonymousToggle] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Nested replies input controls
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(false);

  // Report details state
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);

  // Fetch comments
  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/post/${postId}`);
      if (res.success) {
        setComments(res.comments);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to load comments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Real-time socket events for comment section
  useEffect(() => {
    if (!socket) return;

    const handleNewComment = (newComment: Comment) => {
      if (newComment.post === postId) {
        // Prevent duplicates
        setComments((prev) => {
          if (prev.some((c) => c._id === newComment._id)) return prev;
          return [...prev, newComment];
        });
      }
    };

    const handleVoteComment = (data: { commentId: string; upvotes: string[]; downvotes: string[]; score: number }) => {
      setComments((prev) =>
        prev.map((c) =>
          c._id === data.commentId
            ? { ...c, upvotes: data.upvotes, downvotes: data.downvotes, score: data.score }
            : c
        )
      );
    };

    const handleDeleteComment = (data: { commentId: string; postId: string }) => {
      if (data.postId === postId) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === data.commentId
              ? { ...c, body: '[Deleted]', isAnonymous: true }
              : c
          )
        );
      }
    };

    socket.on('comment:new', handleNewComment);
    socket.on('comment:vote', handleVoteComment);
    socket.on('comment:delete', handleDeleteComment);

    return () => {
      socket.off('comment:new', handleNewComment);
      socket.off('comment:vote', handleVoteComment);
      socket.off('comment:delete', handleDeleteComment);
    };
  }, [socket, postId]);

  // Submit top-level comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest || !isAuthenticated) {
      toast('Please log in or register to submit comments.', 'error');
      return;
    }

    if (!newCommentBody.trim()) return;
    setSubmitting(true);

    try {
      const res = await api.post('/comments', {
        postId,
        body: newCommentBody.trim(),
        isAnonymous: anonymousToggle,
      });

      if (res.success) {
        setNewCommentBody('');
        setComments((prev) => [...prev, res.comment]);
        toast('Comment posted successfully.', 'success');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to submit comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit nested reply
  const handleSubmitReply = async (parentCommentId: string) => {
    if (isGuest || !isAuthenticated) {
      toast('Please log in or register to reply.', 'error');
      return;
    }

    if (!replyBody.trim()) return;
    setSubmitting(true);

    try {
      const res = await api.post('/comments', {
        postId,
        parentCommentId,
        body: replyBody.trim(),
        isAnonymous: replyAnonymous,
      });

      if (res.success) {
        setReplyBody('');
        setReplyTargetId(null);
        setComments((prev) => [...prev, res.comment]);
        toast('Reply posted successfully.', 'success');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to submit reply', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (commentId: string, voteType: 'upvote' | 'downvote') => {
    if (isGuest || !isAuthenticated) {
      toast('Please sign in or create an account to vote on comments.', 'error');
      return;
    }

    try {
      const res = await api.put(`/comments/${commentId}/vote`, { voteType });
      if (res.success) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? { ...c, upvotes: res.upvotes, downvotes: res.downvotes, score: res.score }
              : c
          )
        );
      }
    } catch (err: any) {
      toast(err.message || 'Error processing vote', 'error');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await api.delete(`/comments/${commentId}`);
      if (res.success) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? { ...c, body: '[Deleted]', isAnonymous: true }
              : c
          )
        );
        toast('Comment soft-deleted.', 'success');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to delete comment', 'error');
    }
  };

  // Build comment tree hierarchy
  const commentTree = React.useMemo(() => {
    const map = new Map<string, Comment[]>();
    const roots: Comment[] = [];

    // Separate child reply mappings
    comments.forEach((c) => {
      if (c.parentComment) {
        const children = map.get(c.parentComment) || [];
        children.push(c);
        map.set(c.parentComment, children);
      } else {
        roots.push(c);
      }
    });

    return { roots, childMap: map };
  }, [comments]);

  // Nested node renderer
  const renderCommentNode = (comment: Comment, depth = 0) => {
    const currentUserId = user?.id;
    const isUpvoted = currentUserId ? comment.upvotes.includes(currentUserId) : false;
    const isDownvoted = currentUserId ? comment.downvotes.includes(currentUserId) : false;
    const isAuthor = currentUserId && comment.author._id === currentUserId;
    const canDelete = isAuthor || (user?.role === 'admin' || user?.role === 'moderator');
    const hasReplies = commentTree.childMap.has(comment._id);

    return (
      <div key={comment._id} className="relative pl-3 border-l border-slate-800/80 light-theme:border-slate-200/80 mt-4.5">
        {/* Thread connector icons */}
        {depth > 0 && (
          <div className="absolute -left-[1px] top-4 w-2.5 h-[1.5px] bg-slate-800/80 light-theme:bg-slate-200/80"></div>
        )}

        <div className="flex gap-3">
          {/* Comment Votes */}
          <div className="flex flex-col items-center shrink-0 mt-1">
            <button
              onClick={() => handleVote(comment._id, 'upvote')}
              className={`p-0.5 rounded hover:bg-slate-850 light-theme:hover:bg-slate-100 transition-colors ${
                isUpvoted ? 'text-indigo-400' : 'text-slate-550'
              }`}
            >
              <ArrowBigUp size={18} className={isUpvoted ? 'fill-indigo-400/20' : ''} />
            </button>
            <span
              className={`text-[11px] font-bold ${
                comment.score > 0 ? 'text-indigo-400' : comment.score < 0 ? 'text-rose-500' : 'text-slate-500'
              }`}
            >
              {comment.score}
            </span>
            <button
              onClick={() => handleVote(comment._id, 'downvote')}
              className={`p-0.5 rounded hover:bg-slate-850 light-theme:hover:bg-slate-100 transition-colors ${
                isDownvoted ? 'text-rose-500' : 'text-slate-550'
              }`}
            >
              <ArrowBigDown size={18} className={isDownvoted ? 'fill-rose-500/20' : ''} />
            </button>
          </div>

          {/* Comment Details */}
          <div className="flex-1 min-w-0">
            {/* Header info */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 light-theme:text-slate-400 mb-1.5">
              <div className="flex items-center gap-1.5">
                <img
                  src={comment.author.avatar}
                  alt="avatar"
                  className="h-4.5 w-4.5 rounded-full bg-slate-850"
                />
                {comment.isAnonymous ? (
                  <span className="font-semibold text-slate-400">Anonymous Student</span>
                ) : (
                  <Link
                    to={`/profile/${comment.author.username}`}
                    className="font-semibold text-slate-350 hover:text-indigo-400 transition-colors"
                  >
                    {comment.author.username}
                  </Link>
                )}
                <span>•</span>
                <span>{formatRelativeTime(comment.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                {comment.author.role === 'admin' && (
                  <span className="px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-extrabold text-[8px] uppercase">
                    Admin
                  </span>
                )}
                {comment.author.role === 'moderator' && (
                  <span className="px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-extrabold text-[8px] uppercase">
                    Mod
                  </span>
                )}
              </div>
            </div>

            {/* Comment Body */}
            <p className="text-sm text-slate-300 light-theme:text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
              {comment.body === '[Deleted]' || comment.body === '[Deleted by moderator]' ? (
                <span className="italic text-slate-500">{comment.body}</span>
              ) : (
                comment.body
              )}
            </p>

            {/* Comment Action Links */}
            {comment.body !== '[Deleted]' && comment.body !== '[Deleted by moderator]' && (
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-550">
                <button
                  onClick={() => {
                    setReplyTargetId(replyTargetId === comment._id ? null : comment._id);
                    setReplyBody('');
                  }}
                  className="flex items-center gap-1 hover:text-slate-350 transition-colors"
                >
                  <MessageSquareReply size={13} />
                  Reply
                </button>
                <button
                  onClick={() => {
                    if (isGuest || !isAuthenticated) {
                      toast('Please sign in to report comment.', 'error');
                      return;
                    }
                    setReportTargetId(comment._id);
                  }}
                  className="flex items-center gap-1 hover:text-rose-400 transition-colors"
                >
                  <AlertTriangle size={13} />
                  Report
                </button>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(comment._id)}
                    className="flex items-center gap-1 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                )}
              </div>
            )}

            {/* Reply inputs */}
            {replyTargetId === comment._id && (
              <div className="mt-3 p-3 bg-slate-950/40 light-theme:bg-slate-50 rounded-xl border border-slate-900 light-theme:border-slate-200 animate-slide-in">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Type your reply confession..."
                  rows={2}
                  className="input-field text-xs resize-none"
                ></textarea>
                <div className="flex items-center justify-between mt-2.5">
                  <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replyAnonymous}
                      onChange={(e) => setReplyAnonymous(e.target.checked)}
                      className="accent-brand-500 rounded border-slate-800"
                    />
                    <span>Reply anonymously</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReplyTargetId(null)}
                      className="px-2.5 py-1.5 border border-slate-850 light-theme:border-slate-200 text-slate-400 light-theme:text-slate-600 rounded-lg text-[10px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmitReply(comment._id)}
                      disabled={submitting || !replyBody.trim()}
                      className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-[10px] font-bold hover:bg-brand-700 disabled:opacity-50"
                    >
                      {submitting ? 'Posting...' : 'Reply'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recursive reply nodes */}
        {hasReplies && (
          <div className="ml-2 mt-1 space-y-1">
            {commentTree.childMap.get(comment._id)?.map((child) => renderCommentNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6 border-t border-slate-850 light-theme:border-slate-100 pt-5">
      <h3 className="text-sm font-bold text-slate-200 light-theme:text-slate-800 mb-4 flex items-center gap-2">
        <span>Comments</span>
        <span className="px-1.5 py-0.5 rounded-full bg-slate-900/60 light-theme:bg-slate-100 border border-slate-800 light-theme:border-slate-200 text-xs text-slate-400">
          {comments.length}
        </span>
      </h3>

      {/* Primary Write Comment Form */}
      {isGuest || !isAuthenticated ? (
        <div className="p-4 bg-slate-950/20 light-theme:bg-slate-50 border border-dashed border-slate-850 light-theme:border-slate-200 rounded-xl text-center mb-6">
          <p className="text-xs text-slate-500 light-theme:text-slate-600 mb-2">
            You must be logged in to participate in the conversation.
          </p>
          <Link
            to="/auth"
            className="inline-block px-3 py-1 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition-colors"
          >
            Log In / Sign Up
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmitComment} className="mb-6 space-y-3">
          <textarea
            value={newCommentBody}
            onChange={(e) => setNewCommentBody(e.target.value)}
            placeholder="What are your thoughts? Keep it academic and respectful..."
            rows={3}
            className="input-field text-sm resize-none"
          ></textarea>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-450 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymousToggle}
                onChange={(e) => setAnonymousToggle(e.target.checked)}
                className="accent-brand-500 rounded border-slate-800"
              />
              <span>Post comment anonymously</span>
            </label>
            <button
              type="submit"
              disabled={submitting || !newCommentBody.trim()}
              className="btn-primary text-xs"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}

      {/* Threaded Comment list tree */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
        </div>
      ) : commentTree.roots.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-550 border-t border-dashed border-slate-850/60 light-theme:border-slate-200">
          No confessions or replies yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4 border-t border-slate-850 light-theme:border-slate-100 pt-1">
          {commentTree.roots.map((root) => renderCommentNode(root))}
        </div>
      )}

      {/* Embedded Comment Report Modal */}
      {reportTargetId && (
        <ReportModal
          isOpen={!!reportTargetId}
          onClose={() => setReportTargetId(null)}
          contentType="comment"
          targetId={reportTargetId}
        />
      )}
    </div>
  );
};
export default CommentSection;
