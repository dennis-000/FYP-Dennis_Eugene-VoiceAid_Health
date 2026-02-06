'use client';

import { PatientProfile, supabase } from '@/lib/supabase';
import { Building2, Search, UserCog, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<PatientProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        checkAuth();
        loadPatients();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
        }
    };

    const loadPatients = async () => {
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
    };

    const filteredPatients = patients.filter(patient =>
        patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.hospital_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const hospitalPatients = patients.filter(p => p.patient_type === 'hospital');
    const guestPatients = patients.filter(p => p.patient_type === 'guest');

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
                            <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
                            <p className="text-sm text-gray-600 mt-1">View all patients in the system</p>
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
                            placeholder="Search patients by name or hospital ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <Users className="text-indigo-600" size={24} />
                            <div>
                                <p className="text-sm text-gray-600">Total Patients</p>
                                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <Building2 className="text-green-600" size={24} />
                            <div>
                                <p className="text-sm text-gray-600">Hospital Patients</p>
                                <p className="text-2xl font-bold text-gray-900">{hospitalPatients.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <UserCog className="text-purple-600" size={24} />
                            <div>
                                <p className="text-sm text-gray-600">Guest Patients</p>
                                <p className="text-2xl font-bold text-gray-900">{guestPatients.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patients List */}
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
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hospital ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Therapist
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPatients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {patient.full_name || 'Guest User'}
                                            </div>
                                            <div className="text-xs text-gray-500">{patient.id.substring(0, 8)}...</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${patient.patient_type === 'hospital'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                {patient.patient_type === 'hospital' ? 'Hospital' : 'Guest'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {patient.hospital_id || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {patient.therapist_id ? (
                                                <span className="text-indigo-600">Assigned</span>
                                            ) : (
                                                <span className="text-gray-400">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(patient.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredPatients.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <Users className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm ? 'Try adjusting your search terms.' : 'No patients have been created yet.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
