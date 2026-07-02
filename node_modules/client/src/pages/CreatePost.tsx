import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Image as ImageIcon, X, HelpCircle, Check, Eye } from 'lucide-react';

export const CreatePost: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Inputs
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Image Upload File states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('Please upload an image file (PNG, JPG, JPEG, etc.)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast('Image exceeds size limit of 5MB', 'error');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);

    const formData = new FormData();
    formData.append('body', body.trim());
    if (title.trim()) {
      formData.append('title', title.trim());
    }
    formData.append('isAnonymous', String(isAnonymous));
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const res = await api.post('/posts', formData);
      if (res.success) {
        toast('Confession published successfully!', 'success');
        navigate('/');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to publish confession', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black light-theme:bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-8">
        {/* Back navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-450 hover:text-slate-200 light-theme:text-slate-500 light-theme:hover:text-slate-800 transition-colors text-sm mb-5"
        >
          <ArrowLeft size={16} />
          Back to Feed
        </button>

        {/* Create Post Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 light-theme:border-slate-200 shadow-2xl">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-850 light-theme:border-slate-100 mb-5">
            <h1 className="text-xl font-bold text-slate-150 light-theme:text-slate-800">
              Create a Confession / Post
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Title (Optional) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Title (Optional)</label>
              <input
                type="text"
                placeholder="Give your confession a catchy headline..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="input-field text-sm"
              />
            </div>

            {/* Confession Body */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-400">Confession Body</label>
                <span className={`${body.length > 1800 ? 'text-rose-505' : 'text-slate-500'}`}>
                  {body.length} / 2000
                </span>
              </div>
              <textarea
                required
                placeholder="Share your college secrets, life questions, or memes anonymously..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
                rows={6}
                className="input-field text-sm resize-none"
              ></textarea>
            </div>


            {/* File upload selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Attachments (Optional)</label>
              
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 light-theme:border-slate-250 hover:border-brand-500/50 rounded-2xl p-6 cursor-pointer hover:bg-slate-950/20 light-theme:hover:bg-slate-50 transition-all">
                  <ImageIcon size={28} className="text-slate-500 mb-2" />
                  <span className="text-xs text-slate-300 light-theme:text-slate-650 font-medium">
                    Upload image attachment (Max 5MB)
                  </span>
                  <span className="text-[10px] text-slate-550 mt-1">PNG, JPG, GIF or WEBP</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 max-h-[300px] flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Upload Preview"
                    className="w-full h-full object-contain max-h-[300px]"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors border border-white/10"
                    title="Remove Image"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Anonymous Toggle options */}
            <div className="p-4 bg-slate-950/40 light-theme:bg-slate-100 rounded-2xl border border-slate-900 light-theme:border-slate-200 flex items-center justify-between">
              <div className="space-y-0.5 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-slate-200 light-theme:text-slate-800">
                    Post Anonymously
                  </span>
                  <HelpCircle size={14} className="text-slate-500" title="Your username will be masked as Anonymous Student." />
                </div>
                <p className="text-[10px] text-slate-500">
                  Highly recommended for personal confessions or campus life secrets.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAnonymous ? 'bg-brand-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAnonymous ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Preview indicators */}
            <div className="text-[10.5px] text-slate-500 flex items-center gap-1.5 px-1">
              <Eye size={12} />
              <span>
                Publishing as:{' '}
                <strong>
                  {isAnonymous ? 'Anonymous Student' : user?.username || 'Guest'}
                </strong>
              </span>
            </div>

            {/* Submit Actions */}
            <div className="flex gap-3 justify-end pt-3 border-t border-slate-850 light-theme:border-slate-100">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-slate-800 light-theme:border-slate-200 text-slate-350 light-theme:text-slate-600 rounded-xl hover:bg-slate-900 transition-colors text-sm"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={submitting || !body.trim()}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {submitting ? 'Publishing...' : 'Publish Confession'}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};
export default CreatePost;
