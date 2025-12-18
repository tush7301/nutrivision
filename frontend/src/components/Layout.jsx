import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Upload, BarChart2, MessageSquare, Menu, X, Moon, Sun, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from './LanguageSelector';

export default function Layout() {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [dailyCalories, setDailyCalories] = useState(0);
    const location = useLocation();
    const { user, logout } = useAuth();

    // Dark Mode State
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    // Dark Mode Effect
    useEffect(() => {
        const root = window.document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    // Fetch daily progress
    useEffect(() => {
        const fetchDailyDocs = () => {
            api.get('/meals/?limit=50').then(res => {
                const data = res.data;
                const now = new Date();
                const todays = data.filter(m => {
                    const mDate = new Date(m.created_at);
                    return mDate.getDate() === now.getDate() &&
                        mDate.getMonth() === now.getMonth() &&
                        mDate.getFullYear() === now.getFullYear();
                });
                const total = todays.reduce((acc, curr) => acc + curr.calories, 0);
                setDailyCalories(Math.round(total));
            }).catch(err => console.error(err));
        };

        fetchDailyDocs();

        // simple poll to keep sidebar updated if user navigates around
        const interval = setInterval(fetchDailyDocs, 5000); // refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Log Meal', path: '/upload', icon: Upload },
        { name: 'Insights', path: '/dashboard', icon: BarChart2 },
        { name: 'AI Coach', path: '/chat', icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-gray-100 flex font-sans transition-colors duration-300">
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-30 w-64 bg-sidebar-bg border-r border-border-base transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col",
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-border-base flex-shrink-0">
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400">
                        NutriVision
                    </span>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileOpen(false)}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-emerald-500 text-gray-900 dark:text-white shadow-md shadow-emerald-500/20"
                                        : "text-text-muted hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-text-main"
                                )}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 space-y-4 bg-sidebar-bg border-t border-border-base flex-shrink-0">
                    {/* User Profile */}
                    {user && (
                        <div className="flex items-center gap-3 px-2 mb-2">
                            {user.picture ? (
                                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-600" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                                    {user.name?.charAt(0) || 'U'}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-main truncate">{user.name}</p>
                                <p className="text-xs text-text-muted truncate">{user.email}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Sign Out"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}

                    {/* Language Selector */}
                    <div className="px-3 py-2 mb-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-border-base">
                        <LanguageSelector />
                    </div>

                    {/* Theme Toggle - Compressed for space */}
                    <div
                        onClick={() => setIsDark(!isDark)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer group transition-colors border border-border-base"
                    >
                        <div className="flex items-center gap-2">
                            {isDark ? <Moon size={16} className="text-yellow-400" /> : <Sun size={16} className="text-gray-400" />}
                            <span className="text-xs font-medium text-text-main">Dark Mode</span>
                        </div>
                        <div className={clsx(
                            "w-8 h-4 rounded-full relative transition-colors duration-300",
                            isDark ? "bg-emerald-500" : "bg-gray-300"
                        )}>
                            <div className={clsx(
                                "absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-300",
                                isDark ? "translate-x-4" : "translate-x-0"
                            )} />
                        </div>
                    </div>

                    <div className={clsx(
                        "p-3 rounded-2xl text-gray-900 dark:text-white shadow-lg transition-colors duration-300",
                        dailyCalories >= 2000
                            ? "bg-gradient-to-br from-red-500 to-rose-600"
                            : "bg-gradient-to-br from-emerald-500 to-teal-600"
                    )}>
                        <h3 className="font-semibold text-xs mb-0.5">Daily Goal</h3>
                        <div className="flex justify-between items-end mb-1.5">
                            <span className="text-xl font-bold">{dailyCalories.toLocaleString()}</span>
                            <span className="text-xs opacity-80 mb-0.5">/ 2000</span>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-1">
                            <div className="bg-white rounded-full h-1" style={{ width: `${Math.min((dailyCalories / 2000) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen md:ml-64 transition-all duration-200 bg-app-bg text-text-main">
                {/* Mobile Header */}
                <header className="md:hidden h-16 bg-card-bg border-b border-border-base flex items-center justify-between px-4 sticky top-0 z-20">
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400">
                        NutriVision
                    </span>
                    <button
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        className="p-2 text-text-muted hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                    >
                        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
