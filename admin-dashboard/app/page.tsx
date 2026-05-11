'use client';

import { supabase } from '@/lib/supabase';
import { Building2, Clock, Loader2, TrendingUp, UserCog, UserPlus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface RecentEvent {
    id: string;
    type: 'therapist' | 'patient' | 'organization';
    name: string;
    detail: string;
    time: string;
}

export default function HomePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        organizations: 0,
        therapists: 0,
        patients: 0,
    });
    const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
    const [counters, setCounters] = useState({ organizations: 0, therapists: 0, patients: 0 });
    const [chartData, setChartData] = useState<{ counts: number[], days: string[], maxCount: number }>({ 
        counts: [0, 0, 0, 0, 0, 0, 0], 
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        maxCount: 1 
    });

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }
        await loadStats();
        setLoading(false);
    };

    const loadStats = useCallback(async () => {
        try {
            const [orgsRes, therapistsRes, patientsRes] = await Promise.all([
                supabase.from('organizations').select('id', { count: 'exact', head: true }),
                supabase.from('therapist_profiles').select('id', { count: 'exact', head: true }),
                supabase.from('patient_profiles').select('id', { count: 'exact', head: true }),
            ]);

            const newStats = {
                organizations: orgsRes.count || 0,
                therapists: therapistsRes.count || 0,
                patients: patientsRes.count || 0,
            };
            setStats(newStats);

            // Load recent events
            const [recentTherapists, recentPatients] = await Promise.all([
                supabase.from('therapist_profiles').select('id, full_name, email, organization, created_at').order('created_at', { ascending: false }).limit(3),
                supabase.from('patient_profiles').select('id, full_name, patient_type, created_at').order('created_at', { ascending: false }).limit(3),
            ]);

            const events: RecentEvent[] = [];
            recentTherapists.data?.forEach(t => {
                events.push({
                    id: t.id,
                    type: 'therapist',
                    name: t.full_name || t.email || 'Unknown',
                    detail: `Joined ${t.organization || 'unaffiliated'}`,
                    time: t.created_at,
                });
            });
            recentPatients.data?.forEach(p => {
                events.push({
                    id: p.id,
                    type: 'patient',
                    name: p.full_name || 'Guest Patient',
                    detail: p.patient_type === 'hospital' ? 'Hospital patient' : 'Guest user',
                    time: p.created_at,
                });
            });
            events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
            setRecentEvents(events.slice(0, 5));

            // Load Registration Trends (Last 7 Days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            const [recentTherapistsFull, recentPatientsFull] = await Promise.all([
                supabase.from('therapist_profiles').select('created_at').gte('created_at', sevenDaysAgo.toISOString()),
                supabase.from('patient_profiles').select('created_at').gte('created_at', sevenDaysAgo.toISOString()),
            ]);

            const allRegistrations = [
                ...(recentTherapistsFull.data || []).map(t => new Date(t.created_at)),
                ...(recentPatientsFull.data || []).map(p => new Date(p.created_at))
            ];

            const days = [];
            const counts = [0, 0, 0, 0, 0, 0, 0];
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            // Initialize last 7 days array
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                days.push(dayNames[d.getDay()]);
            }

            // Group by day
            allRegistrations.forEach(date => {
                const dayName = dayNames[date.getDay()];
                const index = days.indexOf(dayName);
                if (index !== -1) counts[index]++;
            });

            const maxCount = Math.max(...counts, 5); // Minimum max of 5 for a decent scale
            setChartData({ counts, days, maxCount });

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }, []);

    // Animated counter effect
    useEffect(() => {
        if (loading) return;
        const duration = 800;
        const steps = 30;
        const interval = duration / steps;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setCounters({
                organizations: Math.round(stats.organizations * ease),
                therapists: Math.round(stats.therapists * ease),
                patients: Math.round(stats.patients * ease),
            });
            if (step >= steps) clearInterval(timer);
        }, interval);
        return () => clearInterval(timer);
    }, [stats, loading]);

    // Real-time subscriptions
    useEffect(() => {
        const channel = supabase.channel('admin-dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'organizations' }, () => loadStats())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'therapist_profiles' }, () => loadStats())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_profiles' }, () => loadStats())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [loadStats]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        const diffDays = Math.floor(diffHrs / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString();
    };

    const statCards = [
        {
            label: 'Therapy Centers',
            value: counters.organizations,
            icon: Building2,
            gradient: 'from-[#FFD700] to-[#E6B800]', // Kente Gold
            shadow: 'shadow-[#FFD700]/20',
            href: '/organizations',
        },
        {
            label: 'Speech Pathologists',
            value: counters.therapists,
            icon: UserCog,
            gradient: 'from-[#008000] to-[#006600]', // Kente Green
            shadow: 'shadow-[#008000]/20',
            href: '/therapists',
        },
        {
            label: 'Active Patients',
            value: counters.patients,
            icon: Users,
            gradient: 'from-[#CC0000] to-[#990000]', // Kente Red
            shadow: 'shadow-[#CC0000]/20',
            href: '/patients',
        },
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8 animate-fade-in">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#008000] pulse-dot" />
                    <span className="text-xs font-medium text-[#008000]">Platform Live</span>
                </div>
                <h1 className="text-3xl font-bold text-[#111111] tracking-tight">Speech Therapy Control Center</h1>
                <p className="text-gray-500 mt-1">Real-time administration for the VoiceAid clinical network</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
                {statCards.map(card => (
                    <button
                        key={card.label}
                        onClick={() => router.push(card.href)}
                        className="bg-white rounded-2xl p-6 border border-gray-100 card-hover text-left animate-fade-in overflow-hidden relative"
                        style={{ boxShadow: 'var(--card-shadow)' }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#CC0000] to-[#008000]" />
                        <div className="flex items-center justify-between mb-4 mt-1">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.shadow}`}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>
                            <TrendingUp size={16} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
                        <p className="text-3xl font-bold text-gray-900 tracking-tight animate-count">
                            {card.value}
                        </p>
                    </button>
                ))}
            </div>

            {/* Recent Activity */}
            <div
                className="bg-white rounded-2xl border border-gray-100 animate-fade-in"
                style={{ boxShadow: 'var(--card-shadow)', animationDelay: '300ms' }}
            >
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock size={20} className="text-gray-400" />
                        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">Auto-updates in real time</span>
                </div>

                {recentEvents.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <UserPlus className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                        <p className="text-sm text-gray-400">No recent activity yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recentEvents.map((event, idx) => (
                            <div key={event.id + idx} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white ${
                                    event.type === 'therapist'
                                        ? 'bg-gradient-to-br from-[#008000] to-[#006600]' // Green
                                        : event.type === 'patient'
                                        ? 'bg-gradient-to-br from-[#CC0000] to-[#990000]' // Red
                                        : 'bg-gradient-to-br from-[#FFD700] to-[#E6B800] text-black' // Gold
                                }`}>
                                    {event.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{event.name}</p>
                                    <p className="text-xs text-gray-500">{event.detail}</p>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">{formatTime(event.time)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Registration Trends Chart */}
            <div className="mt-8 bg-white rounded-2xl border border-gray-100 animate-fade-in p-6" style={{ boxShadow: 'var(--card-shadow)', animationDelay: '400ms' }}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Patient & Clinic Onboarding (Last 7 Days)</h2>
                    <span className="text-xs text-[#008000] font-medium bg-[#008000]/10 px-2 py-1 rounded-md">Live Data</span>
                </div>
                <div className="flex items-end justify-between h-48 px-2">
                    {chartData.days.map((day, i) => {
                        const count = chartData.counts[i];
                        const heightPercentage = Math.max((count / chartData.maxCount) * 100, 5); // min 5% height so it's visible
                        return (
                            <div key={day + i} className="flex flex-col items-center gap-2 group cursor-pointer w-full mx-1">
                                <div className="w-full relative flex justify-center h-full items-end">
                                    <div 
                                        className="w-12 bg-[#FFD700]/20 rounded-t-lg relative overflow-hidden transition-all duration-500 group-hover:bg-[#FFD700]/40"
                                        style={{ height: `${heightPercentage}%` }}
                                    >
                                        <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#FFD700] to-[#CC0000]" style={{ height: '60%' }} />
                                    </div>
                                    {/* Tooltip on hover */}
                                    <div className="absolute -top-10 bg-[#111111] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                        {count} {count === 1 ? 'user' : 'users'}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 font-medium">{day}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
