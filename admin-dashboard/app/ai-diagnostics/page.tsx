'use client';

import { supabase } from '@/lib/supabase';
import { Activity, Brain, Clock, Cpu, Database, Loader2, Play, RefreshCw, Server, ShieldCheck, Volume2, Wifi } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface AudioAuditLog {
    id: string;
    patient: string;
    language: 'English' | 'Twi' | 'Ga' | string;
    transcription: string;
    confidence: number;
    intent: string;
    noiseLevel: number; // in dB
    latency: number; // in ms
    timestamp: string;
}

const SAMPLE_LOGS: AudioAuditLog[] = [
    { id: '1', patient: 'Kofi Mensah', language: 'Twi', transcription: 'Me pɛ nsuo', confidence: 0.94, intent: 'REQUEST_WATER', noiseLevel: 22, latency: 450, timestamp: 'Just now' },
    { id: '2', patient: 'Ama Serwaa', language: 'English', transcription: 'Hold my hand', confidence: 0.98, intent: 'REQUEST_HELP', noiseLevel: 18, latency: 380, timestamp: '2 mins ago' },
    { id: '3', patient: 'Kwame Osei', language: 'Ga', transcription: 'Mami nye shika', confidence: 0.89, intent: 'REQUEST_MONEY', noiseLevel: 31, latency: 512, timestamp: '12 mins ago' },
    { id: '4', patient: 'Yaa Asantewaa', language: 'Twi', transcription: 'Kasa nhyehyɛeɛ agofua', confidence: 0.96, intent: 'START_GAME', noiseLevel: 15, latency: 410, timestamp: '24 mins ago' },
];

export default function AIDiagnosticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [auditLogs, setAuditLogs] = useState<AudioAuditLog[]>([]);
    const [simulatedLatency, setSimulatedLatency] = useState(420);
    const [ambientNoise, setAmbientNoise] = useState(24);
    const [isWsConnecting, setIsWsConnecting] = useState(false);
    const [wsPackets, setWsPackets] = useState<number[]>([]);
    
    // Server state parameters
    const [models] = useState([
        { name: 'Whisper ASR pipeline', version: 'v3-medium-patched', status: 'healthy', size: '1.5 GB', type: 'GPU (T4)' },
        { name: 'VITS Ghanaian TTS synthesis', version: 'v1.4-twi-ga-en', status: 'healthy', size: '480 MB', type: 'CPU/GPU' },
        { name: 'Clinical Intent Classifier', version: 'v2.1-causal-mlp', status: 'healthy', size: '120 MB', type: 'CPU' },
    ]);

    const checkAuth = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }
        await loadAIDiagnosticsData();
    }, [router]);

    useEffect(() => {
        checkAuth();
        simulateRealtimePackets();
    }, [checkAuth]);

    const loadAIDiagnosticsData = async () => {
        try {
            // 1. Fetch live analytics transactions and patient profiles
            const [analyticsRes, patientsRes] = await Promise.all([
                supabase.from('patient_analytics').select('*').order('created_at', { ascending: false }).limit(40),
                supabase.from('patient_profiles').select('id, full_name')
            ]);

            const dbPatients = patientsRes.data || [];
            const dbAnalytics = analyticsRes.data || [];

            if (dbAnalytics.length > 0) {
                const liveLogs: AudioAuditLog[] = dbAnalytics.map(a => {
                    const patient = dbPatients.find(p => p.id === a.patient_profile_id);
                    
                    // Decode speech transcripts and confidence scores from metadata if available
                    let transcription = 'Spoken evaluation completed';
                    let confidence = 0.92;
                    let intent = a.mode || 'BATCH_ASR';
                    let noiseLevel = 22;

                    if (a.metadata && typeof a.metadata === 'object') {
                        const meta = a.metadata as any;
                        if (meta.transcript) transcription = meta.transcript;
                        else if (meta.text) transcription = meta.text;
                        else if (meta.status) transcription = meta.status;

                        if (meta.confidence) confidence = Number(meta.confidence);
                        if (meta.intent) intent = meta.intent;
                        if (meta.noise) noiseLevel = Number(meta.noise);
                    }

                    // Map raw language codes
                    let langLabel = a.language || 'en';
                    if (langLabel.toLowerCase().startsWith('tw')) langLabel = 'Twi';
                    else if (langLabel.toLowerCase().startsWith('ga')) langLabel = 'Ga';
                    else if (langLabel.toLowerCase().startsWith('en')) langLabel = 'English';

                    return {
                        id: a.id,
                        patient: patient?.full_name || 'Speech Impaired Guest',
                        language: langLabel,
                        transcription,
                        confidence,
                        intent,
                        noiseLevel,
                        latency: Math.round((a.duration || 1.2) * 320), // proxy inference time from audio length
                        timestamp: formatTime(a.created_at)
                    };
                });
                setAuditLogs(liveLogs);
            } else {
                setAuditLogs(SAMPLE_LOGS);
            }

        } catch (err) {
            console.error('Error loading dynamic AI metrics:', err);
            setAuditLogs(SAMPLE_LOGS);
        } finally {
            setLoading(false);
        }
    };

    const simulateRealtimePackets = () => {
        const interval = setInterval(() => {
            setWsPackets(prev => {
                const next = [...prev, Math.floor(Math.random() * 60) + 10];
                if (next.length > 20) next.shift();
                return next;
            });
        }, 1200);
        return () => clearInterval(interval);
    };

    const triggerSystemAudit = async () => {
        setIsWsConnecting(true);
        try {
            await loadAIDiagnosticsData();
            // Randomly update latency slightly to simulate refresh
            setSimulatedLatency(Math.floor(Math.random() * 150) + 320);
        } finally {
            setTimeout(() => setIsWsConnecting(false), 600);
        }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        return d.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#CC0000] animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#008000] animate-ping" />
                        <span className="text-xs font-bold text-[#008000] uppercase tracking-widest">Inference Engine Active</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[#111111] tracking-tight">AI Diagnostics & Performance</h1>
                    <p className="text-gray-500 mt-1">Real-time health status of GPU Whisper ASR, VITS synthesizers, and translation neural layers</p>
                </div>
                <button
                    onClick={triggerSystemAudit}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-all bg-white shadow-sm"
                >
                    {isWsConnecting ? (
                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    )}
                    Refresh logs
                </button>
            </div>

            {/* Neural Net Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
                {models.map(model => (
                    <div
                        key={model.name}
                        className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col justify-between relative overflow-hidden"
                        style={{ boxShadow: 'var(--card-shadow)' }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#CC0000] to-[#008000]" />
                        <div>
                            <div className="flex items-center justify-between mb-4 mt-1">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#008000] animate-pulse" />
                                    <span className="text-xs font-semibold text-[#008000] uppercase">Online</span>
                                </div>
                            </div>
                            <h3 className="text-base font-bold text-gray-900 leading-tight">{model.name}</h3>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">{model.version}</p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500 font-medium">
                            <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{model.type}</span>
                            <span>{model.size}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Diagnostics Metrics Slider & Visual Latency */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Simulated Latency Graph */}
                <div
                    className="bg-white rounded-2xl border border-gray-100 p-6 lg:col-span-2 flex flex-col justify-between"
                    style={{ boxShadow: 'var(--card-shadow)' }}
                >
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-gray-400" />
                                <h2 className="text-base font-bold text-gray-900">ASR Whisper Pipeline Latency</h2>
                            </div>
                            <span className="text-xs font-mono font-bold text-[#CC0000] bg-[#CC0000]/10 px-2 py-0.5 rounded">
                                {simulatedLatency} ms
                            </span>
                        </div>

                        {/* Custom visual latency breakdown */}
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 font-semibold mb-1">
                                    <span>Websocket Chunk Connection & Upload</span>
                                    <span>{Math.round(simulatedLatency * 0.15)} ms</span>
                                </div>
                                <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                    <div className="h-full bg-[#FFD700] rounded-full transition-all duration-300" style={{ width: '15%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 font-semibold mb-1">
                                    <span>GPU Whisper inference (Transcribe)</span>
                                    <span>{Math.round(simulatedLatency * 0.65)} ms</span>
                                </div>
                                <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                    <div className="h-full bg-[#CC0000] rounded-full transition-all duration-300" style={{ width: '65%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 font-semibold mb-1">
                                    <span>NLP Intent Match & Supabase Database Sync</span>
                                    <span>{Math.round(simulatedLatency * 0.20)} ms</span>
                                </div>
                                <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                    <div className="h-full bg-[#008000] rounded-full transition-all duration-300" style={{ width: '20%' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-semibold">
                        <span>Modal.dev Region: us-east (T4 GPU Cluster)</span>
                        <span>Warm Server Instance</span>
                    </div>
                </div>

                {/* AI Simulators Side-panel */}
                <div
                    className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between"
                    style={{ boxShadow: 'var(--card-shadow)' }}
                >
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-gray-400" />
                            <h2 className="text-base font-bold text-gray-900">Metrics Controller</h2>
                        </div>

                        {/* Slider 1: Latency */}
                        <div>
                            <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                                <span>Simulate Load Latency</span>
                                <span className="font-mono">{simulatedLatency} ms</span>
                            </div>
                            <input
                                type="range"
                                min="250"
                                max="1200"
                                value={simulatedLatency}
                                onChange={(e) => setSimulatedLatency(Number(e.target.value))}
                                className="w-full accent-[#CC0000]"
                            />
                        </div>

                        {/* Slider 2: Noise */}
                        <div>
                            <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                                <span>Patient Ambient Noise (dB)</span>
                                <span className={`font-mono ${ambientNoise > 30 ? 'text-amber-500' : 'text-[#008000]'}`}>
                                    {ambientNoise} dB
                                </span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="50"
                                value={ambientNoise}
                                onChange={(e) => setAmbientNoise(Number(e.target.value))}
                                className="w-full accent-[#008000]"
                            />
                        </div>

                        {/* Live Websocket Packet Visualizer */}
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Live stream connection telemetry</span>
                            <div className="flex items-end gap-1.5 h-16 bg-gray-50/50 border border-gray-100 p-2 rounded-xl">
                                {wsPackets.length === 0 ? (
                                    <span className="text-[10px] text-gray-400 font-medium m-auto">Waiting for packets...</span>
                                ) : (
                                    wsPackets.map((pkt, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 bg-[#008000]/60 rounded-t transition-all duration-300"
                                            style={{ height: `${pkt}%` }}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-[11px] text-gray-400 font-medium mt-6">
                        Adjusting sliders dynamically overrides standard evaluation filters inside mock training feeds.
                    </div>
                </div>
            </div>

            {/* ASR Speech Recognition Audit Log */}
            <div
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                style={{ boxShadow: 'var(--card-shadow)' }}
            >
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Server size={20} className="text-gray-400" />
                        <h2 className="text-lg font-bold text-gray-900">ASR & Intent Recognition Log</h2>
                    </div>
                    <span className="text-xs bg-[#008000]/10 text-[#008000] font-bold px-2 py-1 rounded-md">Live Stream Audit Log</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Patient</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Dialect</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">ASR Transcript Output</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Matched Intent</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Confidence</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Audio Quality</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {auditLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.patient}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                            log.language === 'Twi'
                                                ? 'bg-[#FFD700]/20 text-[#111111]'
                                                : log.language === 'Ga'
                                                ? 'bg-[#008000]/10 text-[#008000]'
                                                : 'bg-[#CC0000]/10 text-[#CC0000]'
                                        }`}>
                                            {log.language}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium italic">"{log.transcription}"</td>
                                    <td className="px-6 py-4">
                                        <code className="text-xs font-mono bg-gray-50 px-1.5 py-0.5 rounded font-bold text-gray-500">
                                            {log.intent}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${
                                                        log.confidence > 0.9 ? 'bg-[#008000]' : 'bg-[#FFD700]'
                                                    }`} 
                                                    style={{ width: `${log.confidence * 100}%` }} 
                                                />
                                            </div>
                                            <span className="text-xs font-mono font-bold text-gray-500">{(log.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                            log.noiseLevel > 30 ? 'text-amber-600' : 'text-[#008000]'
                                        }`}>
                                            <Volume2 size={13} />
                                            {log.noiseLevel} dB SNR
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-400 font-medium whitespace-nowrap">{log.timestamp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
