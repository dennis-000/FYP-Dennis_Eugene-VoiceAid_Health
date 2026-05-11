'use client';

import { supabase } from '@/lib/supabase';
import { AlertCircle, Eye, EyeOff, HeartPulse, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Check if user is an admin
            const { data: adminData, error: adminError } = await supabase
                .from('admin_users')
                .select('*')
                .eq('user_id', data.user.id)
                .single();

            if (adminError) {
                await supabase.auth.signOut();
                if (adminError.code === 'PGRST116') {
                    throw new Error('No admin record found. Please contact your administrator.');
                } else if (adminError.message.includes('policy')) {
                    throw new Error('Database permission error. Please check RLS policies.');
                } else {
                    throw new Error(`Admin check failed: ${adminError.message}`);
                }
            }

            if (!adminData) {
                await supabase.auth.signOut();
                throw new Error('You do not have admin access');
            }

            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#111111] via-[#222222] to-[#111111] relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#CC0000]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Card */}
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 p-8">
                    {/* Header */}
                    <div className="text-center mb-8 relative">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-[#FFD700] via-[#CC0000] to-[#008000]" />
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#FFD700] to-[#CC0000] rounded-2xl mb-4 shadow-lg shadow-[#FFD700]/25 mt-2">
                            <HeartPulse className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Therapy Control Center</h1>
                        <p className="text-gray-500 mt-1 text-sm">VoiceAid Clinical Network</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-fade-in">
                                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-gray-50/50 text-gray-900 placeholder-gray-400 transition-all text-sm"
                                placeholder="admin@voiceaid.health"
                            />
                        </div>

                        {/* Password with show/hide */}
                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-gray-50/50 text-gray-900 placeholder-gray-400 transition-all text-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#FFD700] to-[#E6B800] text-black py-3 px-4 rounded-xl hover:from-[#E6B800] hover:to-[#CC9900] focus:ring-4 focus:ring-[#FFD700]/50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FFD700]/25"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-gray-400">
                        Authorized administrators only
                    </p>
                </div>
            </div>
        </div>
    );
}
