'use client';

import { PatientProfile, supabase } from '@/lib/supabase';
import { Building2, Loader2, Search, UserCog, Users, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function PatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<PatientProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        checkAuth();
        loadPatients();
        loadActiveAlerts();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) router.push('/login');
    };

    const loadPatients = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('patient_profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setPatients(data || []);
        } catch (error) {
            console.error('Error loading patients:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const [activeAlerts, setActiveAlerts] = useState<Set<string>>(new Set());

    // On mount: load any unresolved alerts from the last 24 hours
    const loadActiveAlerts = async () => {
        try {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data } = await supabase
                .from('patient_analytics')
                .select('patient_profile_id, mode, created_at')
                .in('mode', ['CLINICAL_PRIORITY', 'CLINICAL_RESOLVED'])
                .gte('created_at', since)
                .order('created_at', { ascending: true });

            if (!data) return;

            // Replay events in order to find currently active alerts
            const alertState = new Set<string>();
            for (const row of data) {
                const pid = row.patient_profile_id;
                if (row.mode === 'CLINICAL_PRIORITY') alertState.add(pid);
                if (row.mode === 'CLINICAL_RESOLVED') alertState.delete(pid);
            }
            if (alertState.size > 0) {
                console.log('[Alerts] Restored active alerts on mount:', [...alertState]);
                setActiveAlerts(alertState);
            }
        } catch (e) {
            console.error('[Alerts] Failed to load active alerts:', e);
        }
    };

    // Real-time
    useEffect(() => {
        const patientsChannel = supabase.channel('patients-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_profiles' }, () => {
                console.log('[Real-time] Patient profile changed, reloading...');
                loadPatients();
            })
            .subscribe((status) => {
                console.log('[Real-time] Patient channel status:', status);
            });

        const analyticsChannel = supabase.channel('analytics-alerts')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'patient_analytics'
            }, (payload) => {
                if (payload.errors) {
                    console.error('[Real-time Alert] Payload Error:', payload.errors);
                    return;
                }
                console.log('[Real-time Alert] RECEIVED:', payload);
                const patientId = payload.new.patient_profile_id || payload.new.user_id;
                const mode = payload.new.mode;
                console.log(`[Real-time Alert] ${mode} for:`, patientId);
                
                if (mode === 'CLINICAL_RESOLVED') {
                    setActiveAlerts(prev => {
                        const next = new Set(prev);
                        next.delete(patientId);
                        return next;
                    });
                } else if (mode === 'CLINICAL_PRIORITY') {
                    setActiveAlerts(prev => {
                        const next = new Set(prev);
                        next.add(patientId);
                        return next;
                    });
                }
            })
            .subscribe((status) => {
                console.log('[Real-time Alert] Analytics channel status:', status);
            });

        return () => {
            supabase.removeChannel(patientsChannel);
            supabase.removeChannel(analyticsChannel);
        };
    }, [loadPatients]);

    const filtered = patients.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.hospital_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const hospitalCount = patients.filter(p => p.patient_type === 'hospital').length;
    const guestCount = patients.filter(p => p.patient_type === 'guest').length;
    const assignedCount = patients.filter(p => p.therapist_id).length;

    const statCards = [
        { label: 'Total Patients', value: patients.length, icon: Users, gradient: 'from-[#CC0000] to-[#990000]', shadow: 'shadow-[#CC0000]/20' },
        { label: 'Hospital', value: hospitalCount, icon: Building2, gradient: 'from-[#008000] to-[#006600]', shadow: 'shadow-[#008000]/20' },
        { label: 'Guest', value: guestCount, icon: UserCog, gradient: 'from-[#FFD700] to-[#E6B800] text-black', shadow: 'shadow-[#FFD700]/20' },
        { label: 'Assigned', value: assignedCount, icon: UserCheck, gradient: 'from-[#111111] to-[#000000]', shadow: 'shadow-[#111111]/20' },
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 animate-fade-in">
                <h1 className="text-3xl font-bold text-[#111111] tracking-tight">Active Patients</h1>
                <p className="text-gray-500 mt-1">All patients across the therapy network</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 stagger">
                {statCards.map(card => (
                    <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 animate-fade-in relative overflow-hidden" style={{ boxShadow: 'var(--card-shadow)' }}>
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#CC0000] to-[#008000]" />
                        <div className="flex items-center gap-3 mt-1">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.shadow}`}>
                                <card.icon size={18} className={card.gradient.includes('text-black') ? 'text-black' : 'text-white'} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">{card.label}</p>
                                <p className="text-xl font-bold text-gray-900">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="mb-6 animate-fade-in" style={{ animationDelay: '160ms' }}>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or hospital ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CC0000] focus:border-transparent bg-white text-sm"
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
                    <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900">No patients found</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {searchTerm ? 'Try a different search.' : 'No patients have been created yet.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-fade-in relative" style={{ boxShadow: 'var(--card-shadow)', animationDelay: '240ms' }}>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#CC0000] to-[#008000]" />
                    <div className="overflow-x-auto w-full">
                        <table className="min-w-full mt-1">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Patient</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hospital ID</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Therapist</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(p => (
                                    <tr key={p.id} className="hover:bg-[#CC0000]/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                                                        p.patient_type === 'hospital'
                                                            ? 'bg-gradient-to-br from-[#008000] to-[#006600]'
                                                            : 'bg-gradient-to-br from-[#FFD700] to-[#E6B800] text-black'
                                                    }`}>
                                                        {(p.full_name || 'G').charAt(0).toUpperCase()}
                                                    </div>
                                                    {activeAlerts.has(p.id) && (
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-gray-900">{p.full_name || 'Guest User'}</p>
                                                        {activeAlerts.has(p.id) && (
                                                            <span className="bg-red-500 text-white text-[8px] font-black px-1 rounded animate-pulse">CLINICAL ALERT</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-mono">{p.id.substring(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                p.patient_type === 'hospital'
                                                    ? 'bg-[#008000]/10 text-[#008000]'
                                                    : 'bg-[#FFD700]/20 text-[#111111]'
                                            }`}>
                                                {p.patient_type === 'hospital' ? '🏥 Hospital' : '👤 Guest'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {p.hospital_id ? (
                                                <code className="text-xs bg-gray-50 px-2 py-0.5 rounded font-mono">{p.hospital_id}</code>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {p.therapist_id ? (
                                                <span className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    Assigned
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
