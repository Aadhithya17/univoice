import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import Navbar from '../components/Navbar';
import {
  Users,
  FileText,
  AlertOctagon,
  TrendingUp,
  UserX,
  UserCheck,
  CheckCircle2,
  Trash2,
  Lock,
  ArrowRight,
  Shield,
  LogOut,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Stats, Report, User } from '../types';

type TabType = 'overview' | 'reports' | 'users';

export const AdminDashboard: React.FC = () => {
  const { user: currentUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    await logout();
    toast('Admin logged out successfully', 'success');
    navigate('/auth');
  };

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Loadings
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch admin stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/admin/stats');
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to fetch admin stats', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch report queue
  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await api.get('/admin/reports');
      if (res.success) {
        setReports(res.reports);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to fetch moderation queue', 'error');
    } finally {
      setLoadingReports(false);
    }
  };

  // Fetch user directory
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/admin/users');
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to load user directories', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch when tabs change
  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  // Action report (resolve / dismiss)
  const handleActionReport = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      const res = await api.put(`/admin/reports/${reportId}`, { action });
      if (res.success) {
        toast(`Report successfully ${res.report.status}`, 'success');
        setReports((prev) => prev.filter((r) => r._id !== reportId));
        // refresh stats
        fetchStats();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to process report action', 'error');
    }
  };

  // Toggle user ban
  const handleToggleBan = async (userId: string) => {
    try {
      const res = await api.put(`/admin/users/${userId}/ban`);
      if (res.success) {
        toast(res.message, 'success');
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isBanned: res.user.isBanned } : u))
        );
      }
    } catch (err: any) {
      toast(err.message || 'Failed to toggle user ban state', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-black light-theme:bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-850 light-theme:border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 rounded-xl text-brand-500 border border-brand-500/20">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 light-theme:text-slate-850">
                Admin Control Room
              </h1>
              <p className="text-xs text-slate-550 mt-0.5">
                Moderation queue, campus user directories, and analytics.
              </p>
            </div>
          </div>

          {/* Tab Selection & Logout Controls */}
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <div className="flex bg-slate-905 light-theme:bg-slate-100 border border-slate-850 light-theme:border-slate-205 rounded-xl p-0.5">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-500 hover:text-slate-300 light-theme:text-slate-650'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'reports'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-500 hover:text-slate-300 light-theme:text-slate-655'
                }`}
              >
                Report Queue
                {stats && stats.totalReports > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] rounded-full font-bold">
                    {stats.totalReports}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'users'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-500 hover:text-slate-300 light-theme:text-slate-655'
                }`}
              >
                Users Directory
              </button>
            </div>

            <button
              onClick={handleLogoutClick}
              className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-450 border border-rose-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Admin Logout"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Counts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-slate-905 text-slate-350 border border-slate-850 rounded-xl">
                  <Users size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-550">Total Students</p>
                  <p className="text-xl font-bold text-slate-100 light-theme:text-slate-900">
                    {loadingStats ? '...' : stats?.totalUsers}
                  </p>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-xl">
                  <FileText size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-550">Active Confessions</p>
                  <p className="text-xl font-bold text-slate-100 light-theme:text-slate-900">
                    {loadingStats ? '...' : stats?.totalPosts}
                  </p>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
                  <AlertOctagon size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-550">Pending Reports</p>
                  <p className="text-xl font-bold text-rose-400">
                    {loadingStats ? '...' : stats?.totalReports}
                  </p>
                </div>
              </div>

            </div>

            {/* Analytics Graph card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 light-theme:border-slate-200 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5 flex items-center gap-1.5">
                <TrendingUp size={15} />
                Campus Activity (Confessions Per Day)
              </h3>

              {loadingStats ? (
                <div className="h-[250px] flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                </div>
              ) : stats?.chartData ? (
                <div className="h-[250px] w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                      <XAxis dataKey="date" stroke="#71717a" />
                      <YAxis stroke="#71717a" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#09090b',
                          borderColor: '#27272a',
                          borderRadius: '8px',
                          color: '#f3f4f6',
                        }}
                      />
                      <Bar dataKey="posts" fill="#ffffff" radius={[4, 4, 0, 0]} barSize={35} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-xs text-slate-550">
                  No chart data available yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            {loadingReports ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="glass-panel p-10 rounded-2xl text-center text-xs text-slate-500 border-dashed border-slate-800">
                Report queue is clean. Community self-moderation is holding up nicely!
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report._id}
                    className={`glass-panel p-5 rounded-2xl border flex flex-col gap-3.5 transition-all ${
                      report.status === 'pending'
                        ? 'border-rose-500/20'
                        : 'border-slate-800 light-theme:border-slate-200 opacity-60'
                    }`}
                  >
                    {/* Header: violation details */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-450 border-b border-slate-850 light-theme:border-slate-100 pb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 uppercase text-[9px]">
                          {report.contentType} report
                        </span>
                        <span>reported by</span>
                        <strong>{report.reportedBy.username}</strong>
                        <span>•</span>
                        <span>reason:</span>
                        <span className="text-slate-200 font-medium bg-slate-950/60 light-theme:bg-slate-50 px-2 py-0.5 rounded border border-slate-900 light-theme:border-slate-200">
                          {report.reason}
                        </span>
                      </div>
                      <span className="text-[10px]">{new Date(report.createdAt).toLocaleString()}</span>
                    </div>

                    {/* Reported Content Body snippet */}
                    <div className="p-4 bg-slate-950/40 light-theme:bg-slate-50 border border-slate-900 light-theme:border-slate-200 rounded-xl space-y-2">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Flagged Content Body
                      </div>
                      <p className="text-sm text-slate-300 light-theme:text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {report.contentType === 'post'
                          ? report.post?.body || <span className="italic text-slate-500">[Post Deleted]</span>
                          : report.comment?.body || <span className="italic text-slate-500">[Comment Deleted]</span>}
                      </p>
                      {report.contentType === 'post' && report.post?.author && (
                        <div className="text-[10px] text-slate-500 pt-1">
                          Author: <strong>{report.post.isAnonymous ? 'Anonymous Student' : report.post.author.username}</strong>
                        </div>
                      )}
                      {report.contentType === 'comment' && report.comment?.author && (
                        <div className="text-[10px] text-slate-500 pt-1">
                          Author: <strong>{report.comment.isAnonymous ? 'Anonymous Student' : report.comment.author.username}</strong>
                        </div>
                      )}
                    </div>

                    {/* Actions tray (resolve / dismiss) */}
                    {report.status === 'pending' && (
                      <div className="flex gap-2.5 justify-end">
                        <button
                          onClick={() => handleActionReport(report._id, 'dismiss')}
                          className="px-3.5 py-1.5 border border-slate-800 light-theme:border-slate-200 hover:bg-slate-900 light-theme:hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          Dismiss Report
                        </button>
                        <button
                          onClick={() => handleActionReport(report._id, 'resolve')}
                          className="px-3.5 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-400 transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 size={14} />
                          Delete Content
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800 light-theme:border-slate-200 shadow-xl">
            {loadingUsers ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-905 light-theme:bg-slate-100 text-slate-400 border-b border-slate-850 light-theme:border-slate-200">
                      <th className="p-4 font-bold uppercase tracking-wider">Student Username</th>
                      <th className="p-4 font-bold uppercase tracking-wider">College Email</th>
                      <th className="p-4 font-bold uppercase tracking-wider">Role</th>
                      <th className="p-4 font-bold uppercase tracking-wider">Status</th>
                      <th className="p-4 font-bold uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 light-theme:divide-slate-200">
                    {users.map((item) => {
                      const isSelf = currentUser?.id === item.id;
                      const isAdmin = item.role === 'admin';
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-900/40 light-theme:hover:bg-slate-50 transition-colors ${
                            item.isBanned ? 'bg-rose-500/5 text-slate-500' : ''
                          }`}
                        >
                          <td className="p-4 font-semibold text-slate-200 light-theme:text-slate-800">
                            {item.username}
                          </td>
                          <td className="p-4 text-slate-400 light-theme:text-slate-600">
                            {item.email}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                                isAdmin
                                  ? 'bg-slate-905 text-slate-350 border-slate-850'
                                  : item.role === 'moderator'
                                  ? 'bg-cyan-950/20 text-cyan-400 border-cyan-900/50'
                                  : 'bg-slate-800 light-theme:bg-slate-100 text-slate-400 border-slate-700/20 light-theme:border-slate-200'
                              }`}
                            >
                              {item.role}
                            </span>
                          </td>
                          <td className="p-4">
                            {item.isBanned ? (
                              <span className="flex items-center gap-1 text-rose-500 font-semibold">
                                <Lock size={12} /> Banned
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-semibold">Active</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {isSelf ? (
                              <span className="text-[10px] italic text-slate-500 pr-2">Your Account</span>
                            ) : isAdmin ? (
                              <span className="text-[10px] italic text-slate-500 pr-2">Cannot Moderate Admin</span>
                            ) : (
                              <button
                                onClick={() => handleToggleBan(item.id)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                  item.isBanned
                                    ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/20'
                                    : 'bg-rose-600/10 text-rose-400 border border-rose-500/30 hover:bg-rose-600/20'
                                }`}
                              >
                                {item.isBanned ? (
                                  <span className="flex items-center gap-1 justify-end">
                                    <UserCheck size={12} /> Unban Student
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 justify-end">
                                    <UserX size={12} /> Ban Student
                                  </span>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};
export default AdminDashboard;
