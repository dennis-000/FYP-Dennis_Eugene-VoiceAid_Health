'use client';

import { supabase, TherapistProfile } from '@/lib/supabase';
import { Building2, Loader2, Search, UserCog, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function TherapistsPage() {
    const router = useRouter();
    const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        checkAuth();
        loadTherapists();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) router.push('/login');
    };

    const loadTherapists = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('therapist_profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setTherapists(data || []);
        } catch (error) {
            console.error('Error loading therapists:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Real-time
    useEffect(() => {
        const channel = supabase.channel('therapists-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'therapist_profiles' }, () => loadTherapists())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [loadTherapists]);

    const filtered = therapists.filter(t =>
        t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.organization?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const withPatients = therapists.filter(t => t.assigned_patients?.length > 0).length;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 animate-fade-in">
                <h1 className="text-3xl font-bold text-[#111111] tracking-tight">Speech Pathologists</h1>
                <p className="text-gray-500 mt-1">Manage speech therapists and caregivers across the network</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-in" style={{ animationDelay: '80ms' }}>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 relative overflow-hidden" style={{ boxShadow: 'var(--card-shadow)' }}>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#008000] to-[#006600]" />
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#008000] to-[#006600] flex items-center justify-center shadow-lg shadow-[#008000]/20 mt-1">
                        <UserCog size={20} className="text-white" />
                    </div>
                    <div className="mt-1">
                        <p className="text-sm text-gray-500">Total Pathologists</p>
                        <p className="text-2xl font-bold text-gray-900">{therapists.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 relative overflow-hidden" style={{ boxShadow: 'var(--card-shadow)' }}>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] to-[#E6B800]" />
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#E6B800] flex items-center justify-center shadow-lg shadow-[#FFD700]/20 mt-1">
                        <Users size={20} className="text-black" />
                    </div>
                    <div className="mt-1">
                        <p className="text-sm text-gray-500">With Active Patients</p>
                        <p className="text-2xl font-bold text-gray-900">{withPatients}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 animate-fade-in" style={{ animationDelay: '160ms' }}>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or center..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#008000] focus:border-transparent bg-white text-sm"
                    />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 animate-fade-in">
                    <UserCog className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900">No therapists found</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {searchTerm ? 'Try adjusting your search.' : 'No therapists have signed up yet.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-fade-in relative" style={{ boxShadow: 'var(--card-shadow)', animationDelay: '240ms' }}>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#CC0000] to-[#008000]" />
                    <table className="min-w-full mt-1">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pathologist</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Therapy Center</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Specialization</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Patients</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(t => (
                                <tr key={t.id} className="hover:bg-[#008000]/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#008000] to-[#006600] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                                {(t.full_name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{t.full_name}</p>
                                                <p className="text-xs text-gray-500">{t.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Building2 size={14} className="text-[#FFD700]" />
                                            {t.organization || <span className="text-gray-400">—</span>}
                                        </div>
                                        {t.organization_code && (
                                            <code className="text-[10px] text-[#111111] bg-[#FFD700]/20 px-1.5 py-0.5 rounded font-mono mt-1 inline-block border border-[#FFD700]/30">
                                                {t.organization_code}
                                            </code>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {t.specialization || <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                            (t.assigned_patients?.length || 0) > 0
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'bg-gray-50 text-gray-500'
                                        }`}>
                                            {t.assigned_patients?.length || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(t.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
