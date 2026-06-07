'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { usePathname, useRouter } from "next/navigation";
import { Building2, HeartPulse, LayoutDashboard, LogOut, Users, UserCog, TrendingUp, BookOpen, Cpu, Shield, Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

const NAV_ITEMS = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/organizations', label: 'Organizations', icon: Building2 },
    { href: '/therapists', label: 'Therapists', icon: UserCog },
    { href: '/patients', label: 'Patients', icon: Users },
    { href: '/clinical-progress', label: 'Clinical Progress', icon: TrendingUp },
    { href: '/content-library', label: 'Content Library', icon: BookOpen },
    { href: '/ai-diagnostics', label: 'AI Diagnostics', icon: Cpu },
    { href: '/compliance', label: 'Compliance & Audits', icon: Shield },
];

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const [adminEmail, setAdminEmail] = useState('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setAdminEmail(data.session?.user?.email || '');
        });
    }, []);

    if (pathname === '/login') return null;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <>
            {/* Backdrop overlay for mobile screens */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden animate-fade-in"
                    onClick={onClose}
                />
            )}
            <aside className={`fixed left-0 top-0 bottom-0 w-[260px] bg-[#111111] flex flex-col z-50 kente-strip-right transition-transform duration-300 md:translate-x-0 ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                {/* Branding with close button for mobile */}
                <div className="px-6 py-6 border-b border-[#222222] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#CC0000] flex items-center justify-center shadow-lg shadow-[#FFD700]/20">
                            <HeartPulse className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-base tracking-tight">VoiceAid</h1>
                            <p className="text-[11px] text-[#FFD700] font-medium uppercase tracking-wider">Therapy Network</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-white md:hidden rounded-xl hover:bg-[#222222] transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {NAV_ITEMS.map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <button
                                key={item.href}
                                onClick={() => {
                                    router.push(item.href);
                                    onClose();
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                                    isActive
                                        ? 'bg-[#FFD700]/10 text-[#FFD700] shadow-sm'
                                        : 'text-[#E5E7EB] hover:text-white hover:bg-[#222222]'
                                }`}
                            >
                                <item.icon size={20} className={isActive ? 'text-[#FFD700]' : ''} />
                                {item.label}
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User / Logout */}
                <div className="px-3 pb-4 border-t border-[#222222] pt-4">
                    {adminEmail && (
                        <div className="px-4 py-2 mb-2">
                            <p className="text-xs text-[#E5E7EB] truncate">{adminEmail}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#E5E7EB] hover:text-[#CC0000] hover:bg-[#CC0000]/10 transition-all"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const isLogin = pathname === '/login';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Automatically close sidebar drawer when navigating to a new route
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    return (
        <html lang="en">
            <head>
                <title>VoiceAid Health — Admin Dashboard</title>
                <meta name="description" content="Clinical management dashboard for VoiceAid Health — monitor patients, manage therapists, and respond to emergency alerts in real time." />
                <link rel="icon" href="/favicon.png" type="image/png" />
                <link rel="apple-touch-icon" href="/favicon.png" />
                <meta name="theme-color" content="#1e40af" />
            </head>
            <body className={inter.className}>
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                
                {/* Mobile Header Bar */}
                {!isLogin && (
                    <header className="fixed top-0 left-0 right-0 h-16 bg-[#111111] border-b border-[#222222] flex items-center justify-between px-4 z-30 md:hidden">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#CC0000] flex items-center justify-center shadow-lg shadow-[#FFD700]/20">
                                <HeartPulse className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-sm tracking-tight">VoiceAid</h1>
                                <p className="text-[9px] text-[#FFD700] font-medium uppercase tracking-wider">Therapy Network</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-[#E5E7EB] hover:text-white rounded-xl hover:bg-[#222222] transition-colors"
                            aria-label="Open navigation menu"
                        >
                            <Menu size={22} />
                        </button>
                    </header>
                )}

                <main className={isLogin ? '' : 'md:ml-[260px] ml-0 pt-16 md:pt-0 min-h-screen'}>
                    {children}
                </main>
            </body>
        </html>
    );
}
