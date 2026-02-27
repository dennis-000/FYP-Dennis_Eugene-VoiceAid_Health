'use client';

import { supabase } from '@/lib/supabase';
import { Building2, UserCog, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        organizations: 0,
        therapists: 0,
        patients: 0,
    });

    useEffect(() => {
        checkAuth();
        loadStats();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }
        setLoading(false);
    };

    const loadStats = async () => {
        try {
            const [orgsRes, therapistsRes, patientsRes] = await Promise.all([
                supabase.from('organizations').select('id', { count: 'exact', head: true }),
                supabase.from('therapist_profiles').select('id', { count: 'exact', head: true }),
                supabase.from('patient_profiles').select('id', { count: 'exact', head: true }),
            ]);

            setStats({
                organizations: orgsRes.count || 0,
                therapists: therapistsRes.count || 0,
                patients: patientsRes.count || 0,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">VoiceAid Admin Dashboard</h1>
                            <p className="text-sm text-gray-600">Manage organizations, therapists, and patients</p>
                        </div>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                router.push('/login');
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        icon={Building2}
                        title="Organizations"
                        value={stats.organizations}
                        color="bg-blue-500"
                    />
                    <StatCard
                        icon={UserCog}
                        title="Therapists"
                        value={stats.therapists}
                        color="bg-green-500"
                    />
                    <StatCard
                        icon={Users}
                        title="Patients"
                        value={stats.patients}
                        color="bg-purple-500"
                    />
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ActionButton
                            onClick={() => router.push('/organizations')}
                            icon={Building2}
                            title="Manage Organizations"
                            description="Create and manage organizations"
                        />
                        <ActionButton
                            onClick={() => router.push('/therapists')}
                            icon={UserCog}
                            title="View Therapists"
                            description="View all therapists and their assignments"
                        />
                        <ActionButton
                            onClick={() => router.push('/patients')}
                            icon={Users}
                            title="View Patients"
                            description="View all patients in the system"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ icon: Icon, title, value, color }: any) {
    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
                <div className={`${color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

function ActionButton({ onClick, icon: Icon, title, description }: any) {
    return (
        <button
            onClick={onClick}
            className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all text-left"
        >
            <Icon className="h-6 w-6 text-indigo-600 mt-1" />
            <div className="ml-3">
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <p className="text-xs text-gray-600 mt-1">{description}</p>
            </div>
        </button>
    );
}
