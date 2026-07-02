import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MessageSquarePlus, ScrollText, AlertTriangle, BookOpen } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { isAuthenticated, isGuest } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreatePostClick = () => {
    if (isGuest || !isAuthenticated) {
      toast('You must register or log in to create a confession.', 'error');
      navigate('/auth');
    } else {
      navigate('/create-post');
    }
  };

  return (
    <aside className="w-full md:w-64 flex flex-col gap-5.5">
      
      {/* Action Button: Create Post */}
      <button
        onClick={handleCreatePostClick}
        className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-500/15 group"
      >
        <MessageSquarePlus size={20} className="group-hover:scale-110 transition-transform" />
        New Confession / Post
      </button>

      {/* Academic Honor Code Guidelines */}
      <div className="glass-panel rounded-2xl p-5 border-l-2 border-l-indigo-500">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
          <BookOpen size={14} />
          Academic Honor Code
        </h3>
        <div className="space-y-2.5 text-xs text-slate-400 light-theme:text-slate-600 leading-relaxed">
          <p className="flex gap-2">
            <ScrollText size={14} className="shrink-0 text-indigo-500 mt-0.5" />
            <span><strong>Anonymity:</strong> Respect the privacy of others. Do not reveal real names or target individuals.</span>
          </p>
          <p className="flex gap-2">
            <AlertTriangle size={14} className="shrink-0 text-amber-500 mt-0.5" />
            <span><strong>Moderation:</strong> Hate speech, harassment, academic integrity violations, or threats will result in an immediate IP ban.</span>
          </p>
        </div>
      </div>

      {/* Sidebar Footer */}
      <footer className="px-4 text-[10px] text-slate-500 light-theme:text-slate-400 space-y-1">
        <p>© 2026 UniVoice Inc.</p>
        <p>A private student-run community project.</p>
      </footer>

    </aside>
  );
};
export default Sidebar;
