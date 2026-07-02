import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Search, LogOut, User as UserIcon, ShieldAlert, GraduationCap, Menu, X } from 'lucide-react';

interface NavbarProps {
  onSearch?: (query: string) => void;
  initialSearchVal?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch, initialSearchVal = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(initialSearchVal);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogoutClick = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80 light-theme:border-slate-200/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2.5 text-indigo-400 hover:text-indigo-300 transition-colors">
            <GraduationCap className="h-7 w-7 text-brand-500" />
            <span className="text-xl font-bold tracking-tight text-white light-theme:text-slate-900">
              Uni<span className="text-brand-500 font-extrabold">Voice</span>
            </span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4.5 w-4.5 text-slate-500 light-theme:text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search confessions, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900/80 light-theme:bg-slate-100 border border-slate-800 light-theme:border-slate-200 rounded-full text-slate-100 light-theme:text-slate-900 placeholder-slate-500 light-theme:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
          </form>

          {/* Action buttons & navigation */}
          <div className="flex items-center gap-3">

            {/* Authenticated user flow */}
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1 rounded-full border border-slate-800/80 light-theme:border-slate-200 hover:bg-slate-850 hover:border-slate-700 light-theme:hover:bg-slate-100 transition-all focus:outline-none"
                  >
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-8 w-8 rounded-full border border-brand-500/20 bg-slate-800"
                    />
                    <span className="hidden sm:inline text-sm font-medium pr-2 text-slate-200 light-theme:text-slate-700">
                      {user.username}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                      <div className="absolute right-0 mt-2.5 w-48 rounded-xl border border-slate-850 light-theme:border-slate-200 bg-black light-theme:bg-white p-1.5 shadow-2xl z-50 animate-fade-in">
                        <div className="px-2.5 py-2 border-b border-slate-850 light-theme:border-slate-100">
                          <p className="text-xs text-slate-550">Logged in as</p>
                          <p className="text-sm font-semibold truncate text-slate-200 light-theme:text-slate-850">
                            {user.username}
                          </p>
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 light-theme:bg-slate-100 text-brand-400">
                            {user.role}
                          </span>
                        </div>

                        <Link
                          to={`/profile/${user.username}`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 w-full px-2.5 py-2 text-sm text-slate-300 light-theme:text-slate-700 hover:bg-slate-800/50 light-theme:hover:bg-slate-50 rounded-lg transition-colors mt-1"
                        >
                          <UserIcon size={16} />
                          Profile
                        </Link>

                        {user.email === 'admin@univoice.edu' && (
                          <Link
                            to="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 w-full px-2.5 py-2 text-sm text-brand-400 hover:bg-slate-800/50 light-theme:hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            <ShieldAlert size={16} />
                            Admin Panel
                          </Link>
                        )}

                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            handleLogoutClick();
                          }}
                          className="flex items-center gap-2 w-full px-2.5 py-2 text-sm text-rose-455 hover:bg-rose-500/10 rounded-lg transition-colors mt-1 border-t border-slate-850 light-theme:border-slate-100"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-full text-xs font-semibold transition-colors"
                  title="Logout"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin"
                  className="px-4 py-1.5 border border-slate-800 hover:bg-slate-900 text-slate-350 rounded-full text-sm font-semibold transition-colors"
                >
                  Admin Dashboard
                </Link>
                <Link
                  to="/auth"
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-sm font-semibold transition-colors shadow-lg shadow-brand-500/20"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Mobile Menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full border border-slate-800 light-theme:border-slate-200 text-slate-450 light-theme:text-slate-600 hover:bg-slate-850 light-theme:hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/80 light-theme:border-slate-200/80 bg-black light-theme:bg-white px-4 py-3 space-y-3 shadow-xl animate-slide-in">
          {/* Mobile search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4.5 w-4.5 text-slate-500 light-theme:text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search confessions, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900 light-theme:bg-slate-100 border border-slate-850 light-theme:border-slate-250 rounded-full text-slate-100 light-theme:text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </form>

          {user && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-850 light-theme:border-slate-100">
              <Link
                to={`/profile/${user.username}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-lg text-slate-350 light-theme:text-slate-700 hover:bg-slate-900 light-theme:hover:bg-slate-100 text-sm"
              >
                <UserIcon size={16} />
                My Profile
              </Link>
              {user.email === 'admin@univoice.edu' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg text-brand-400 hover:bg-slate-900 light-theme:hover:bg-slate-100 text-sm"
                >
                  <ShieldAlert size={16} />
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogoutClick();
                }}
                className="flex items-center gap-2 p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 text-sm w-full text-left"
              >
                <LogOut size={16} />
                Logout ({user.username})
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
export default Navbar;
