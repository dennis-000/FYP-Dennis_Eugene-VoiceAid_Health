'use client';

import { Organization, supabase } from '@/lib/supabase';
import { Building2, Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
        if (!session) {
            router.push('/login');
        }
    };

    const loadOrganizations = async () => {
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
    };

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.organization_code.toLowerCase().includes(searchTerm.toLowerCase())
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
                            <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                        >
                            <Plus size={20} />
                            Create Organization
                        </button>
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
                            placeholder="Search organizations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Organizations List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOrgs.map((org) => (
                            <OrganizationCard key={org.id} organization={org} onUpdate={loadOrganizations} />
                        ))}
                    </div>
                )}

                {filteredOrgs.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new organization.</p>
                    </div>
                )}
            </main>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateOrganizationModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadOrganizations();
                    }}
                />
            )}
        </div>
    );
}

function OrganizationCard({ organization, onUpdate }: { organization: Organization; onUpdate: () => void }) {
    const toggleActive = async () => {
        try {
            const { error } = await supabase
                .from('organizations')
                .update({ is_active: !organization.is_active })
                .eq('id', organization.id);

            if (error) throw error;
            onUpdate();
        } catch (error) {
            console.error('Error toggling organization:', error);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{organization.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{organization.organization_code}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${organization.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {organization.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="space-y-2 text-sm">
                <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 text-gray-900 capitalize">{organization.type}</span>
                </div>
                {organization.location && (
                    <div>
                        <span className="text-gray-600">Location:</span>
                        <span className="ml-2 text-gray-900">{organization.location}</span>
                    </div>
                )}
                {organization.contact_email && (
                    <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 text-gray-900">{organization.contact_email}</span>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                    onClick={toggleActive}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg ${organization.is_active
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                >
                    {organization.is_active ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    );
}

function CreateOrganizationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: '',
        organization_code: '',
        type: 'hospital' as 'hospital' | 'clinic' | 'private_practice',
        location: '',
        contact_email: '',
        contact_phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateCode = () => {
        const prefix = formData.type === 'hospital' ? 'GH-' : formData.type === 'clinic' ? 'CL-' : 'PP-';
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        setFormData({ ...formData, organization_code: `${prefix}${random}-2024` });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error: insertError } = await supabase
                .from('organizations')
                .insert([formData]);

            if (insertError) throw insertError;
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Create Organization</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., University of Ghana Medical Centre"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization Code *</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                required
                                value={formData.organization_code}
                                onChange={(e) => setFormData({ ...formData, organization_code: e.target.value.toUpperCase() })}
                                placeholder="e.g., UG-MED-2024"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                            />
                            <button
                                type="button"
                                onClick={generateCode}
                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                            >
                                Generate
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                        <select
                            required
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                        >
                            <option value="hospital">Hospital</option>
                            <option value="clinic">Clinic</option>
                            <option value="private_practice">Private Practice</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g., Legon, Accra, Ghana"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                        <input
                            type="email"
                            value={formData.contact_email}
                            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                            placeholder="e.g., info@ugmc.edu.gh"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                        <input
                            type="tel"
                            value={formData.contact_phone}
                            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                            placeholder="e.g., +233 30 250 0000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
