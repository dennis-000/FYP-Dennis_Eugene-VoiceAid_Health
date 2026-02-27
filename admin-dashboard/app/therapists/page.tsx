'use client';

import { supabase, TherapistProfile } from '@/lib/supabase';
import { Building2, Search, UserCog, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
        if (!session) {
            router.push('/login');
        }
    };

    const loadTherapists = async () => {
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
    };

    const filteredTherapists = therapists.filter(therapist =>
        therapist.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapist.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapist.organization?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <button
                                onClick={() => router.push('/')}
                                className="text-sm text-indigo-600 hover:text-indigo-800 mb-2"
                            >
                                ← Back to Dashboard
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">Therapists</h1>
                            <p className="text-sm text-gray-600 mt-1">View all therapists in the system</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search therapists by name, email, or organization..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <UserCog className="text-indigo-600" size={20} />
                            <span className="text-sm text-gray-600">Total Therapists:</span>
                            <span className="text-lg font-bold text-gray-900">{therapists.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="text-green-600" size={20} />
                            <span className="text-sm text-gray-600">With Patients:</span>
                            <span className="text-lg font-bold text-gray-900">
                                {therapists.filter(t => t.assigned_patients?.length > 0).length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Therapists List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Therapist
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Organization
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Specialization
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Patients
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Joined
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTherapists.map((therapist) => (
                                    <tr key={therapist.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{therapist.full_name}</div>
                                                <div className="text-sm text-gray-500">{therapist.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={16} className="text-gray-400" />
                                                <span className="text-sm text-gray-900">
                                                    {therapist.organization || 'Not assigned'}
                                                </span>
                                            </div>
                                            {therapist.organization_code && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Code: {therapist.organization_code}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900">
                                                {therapist.specialization || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                {therapist.assigned_patients?.length || 0} patients
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(therapist.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredTherapists.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <UserCog className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No therapists found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm ? 'Try adjusting your search terms.' : 'No therapists have signed up yet.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
