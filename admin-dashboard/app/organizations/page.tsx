'use client';

import { Organization, supabase } from '@/lib/supabase';
import { Building2, Loader2, MapPin, Mail, Phone, Plus, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function OrganizationsPage() {
    const router = useRouter();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        checkAuth();
        loadOrganizations();

    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) router.push('/login');
    };

    const loadOrganizations = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setOrganizations(data || []);
        } catch (error) {
            console.error('Error loading organizations:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Real-time subscription
    useEffect(() => {
        const channel = supabase.channel('orgs-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'organizations' }, () => loadOrganizations())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [loadOrganizations]);

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.organization_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-[#111111] tracking-tight">Therapy Centers</h1>
                    <p className="text-gray-500 mt-1">{organizations.length} registered {organizations.length === 1 ? 'center' : 'centers'}</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFD700] to-[#E6B800] text-black px-5 py-2.5 rounded-xl hover:from-[#E6B800] hover:to-[#CC9900] font-bold text-sm shadow-lg shadow-[#FFD700]/25 transition-all w-full sm:w-auto"
                >
                    <Plus size={18} />
                    New Center
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white text-sm"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                </div>
            ) : filteredOrgs.length === 0 ? (
                <div className="text-center py-20 animate-fade-in">
                    <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900">No centers</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {searchTerm ? 'Try a different search.' : 'Create your first therapy center.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
                    {filteredOrgs.map(org => (
                        <OrgCard key={org.id} org={org} onUpdate={loadOrganizations} />
                    ))}
                </div>
            )}

            {showCreateModal && (
                <CreateModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); loadOrganizations(); }} />
            )}
        </div>
    );
}

function OrgCard({ org, onUpdate }: { org: Organization; onUpdate: () => void }) {
    const [toggling, setToggling] = useState(false);

    const toggleActive = async () => {
        setToggling(true);
        try {
            await supabase.from('organizations').update({ is_active: !org.is_active }).eq('id', org.id);
            onUpdate();
        } catch (e) { console.error(e); }
        finally { setToggling(false); }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover animate-fade-in relative" style={{ boxShadow: 'var(--card-shadow)' }}>
            {/* Accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#CC0000] to-[#008000]" />

            <div className="p-5 mt-1">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{org.name}</h3>
                        <code className="text-xs text-[#111111] bg-[#FFD700]/20 px-2 py-0.5 rounded-md font-mono mt-1 inline-block border border-[#FFD700]/30">
                            {org.organization_code}
                        </code>
                    </div>
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${org.is_active ? 'bg-[#008000]/10 text-[#008000]' : 'bg-[#CC0000]/10 text-[#CC0000]'
                        }`}>
                        {org.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Building2 size={14} />
                        <span className="capitalize">{org.type.replace('_', ' ')}</span>
                    </div>
                    {org.location && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <MapPin size={14} />
                            <span className="truncate">{org.location}</span>
                        </div>
                    )}
                    {org.contact_email && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Mail size={14} />
                            <span className="truncate">{org.contact_email}</span>
                        </div>
                    )}
                    {org.contact_phone && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Phone size={14} />
                            <span>{org.contact_phone}</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={toggleActive}
                    disabled={toggling}
                    className={`w-full py-2 text-sm font-medium rounded-xl transition-all ${org.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        } disabled:opacity-50`}
                >
                    {toggling ? '...' : org.is_active ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    );
}

function CreateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: '', organization_code: '',
        type: 'hospital' as 'hospital' | 'clinic' | 'private_practice',
        location: '', contact_email: '', contact_phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateCode = () => {
        const prefix = formData.type === 'hospital' ? 'GH-' : formData.type === 'clinic' ? 'CL-' : 'PP-';
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        setFormData({ ...formData, organization_code: `${prefix}${random}-2025` });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { error: insertError } = await supabase.from('organizations').insert([formData]);
            if (insertError) throw insertError;
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 text-gray-900 placeholder-gray-400 text-sm";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-gray-900">New Organization</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name *</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., University of Ghana Medical Centre" className={inputClass} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Organization Code *</label>
                        <div className="flex gap-2">
                            <input type="text" required value={formData.organization_code}
                                onChange={e => setFormData({ ...formData, organization_code: e.target.value.toUpperCase() })}
                                placeholder="e.g., GH-MED-2025" className={`flex-1 ${inputClass}`} />
                            <button type="button" onClick={generateCode}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium transition-colors whitespace-nowrap">
                                Generate
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type *</label>
                        <select required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className={inputClass}>
                            <option value="hospital">Hospital</option>
                            <option value="clinic">Clinic</option>
                            <option value="private_practice">Private Practice</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Location</label>
                            <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Accra, Ghana" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone</label>
                            <input type="tel" value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                                placeholder="+233 30 250 0000" className={inputClass} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contact Email</label>
                        <input type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                            placeholder="info@hospital.gh" className={inputClass} />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all">
                            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Organization'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
