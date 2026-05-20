'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { usePathname, useRouter } from "next/navigation";
import { Building2, HeartPulse, LayoutDashboard, LogOut, Users, UserCog } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

const NAV_ITEMS = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/organizations', label: 'Organizations', icon: Building2 },
    { href: '/therapists', label: 'Therapists', icon: UserCog },
    { href: '/patients', label: 'Patients', icon: Users },
];

function Sidebar() {
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
        <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-[#111111] flex flex-col z-40 kente-strip-right">
            {/* Branding */}
            <div className="px-6 py-6 border-b border-[#222222]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#CC0000] flex items-center justify-center shadow-lg shadow-[#FFD700]/20">
                        <HeartPulse className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-base tracking-tight">VoiceAid</h1>
                        <p className="text-[11px] text-[#FFD700] font-medium uppercase tracking-wider">Therapy Network</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {NAV_ITEMS.map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
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
    );
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const isLogin = pathname === '/login';

    return (
        <html lang="en">
            <head>
                <title>VoiceAid Health — Admin Dashboard</title>
                <meta name="description" content="Clinical management dashboard for VoiceAid Health — monitor patients, manage therapists, and respond to emergency alerts in real time." />
                <link rel="icon" href="/favicon.ico" type="image/x-icon" />
                <meta name="theme-color" content="#1e40af" />
            </head>
            <body className={inter.className}>
                <Sidebar />
                <main className={isLogin ? '' : 'ml-[260px] min-h-screen'}>
                    {children}
                </main>
            </body>
        </html>
    );
}
