'use client';

import { supabase } from '@/lib/supabase';
import { 
    Activity, 
    ArrowLeft, 
    Award, 
    Brain, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    HeartPulse, 
    Loader2, 
    MessageSquare, 
    Plus, 
    RefreshCw, 
    ShieldAlert, 
    Smile, 
    Sparkles, 
    Volume2 
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface PatientProfile {
    id: string;
    user_id?: string;
    patient_type: 'guest' | 'hospital';
    therapist_id?: string;
    organization_id?: string;
    full_name?: string;
    hospital_id?: string;
    created_at: string;
}

interface TranscriptionRow {
    id: string;
    text: string;
    language: string;
    confidence_score: number;
    created_at: string;
}

export default function PatientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState<PatientProfile | null>(null);
    const [transcriptions, setTranscriptions] = useState<TranscriptionRow[]>([]);
    const [analytics, setAnalytics] = useState<any[]>([]);
    
    // Date selection states
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [goals, setGoals] = useState<any[]>([]);
    const [loadingGoals, setLoadingGoals] = useState(false);

    // Calculated stats
    const [compliance, setCompliance] = useState(85);
    const [streak, setStreak] = useState(0);
    const [hoursPracticed, setHoursPracticed] = useState(0);
    const [avgConfidence, setAvgConfidence] = useState(0.85);

    // AI states
    const [aiSummary, setAiSummary] = useState<string>('');
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [summarySource, setSummarySource] = useState('');

    const [sentiment, setSentiment] = useState<{ happy: number, frustrated: number, anxious: number, neutral: number, reasoning: string } | null>(null);
    const [analyzingSentiment, setAnalyzingSentiment] = useState(false);
    const [sentimentSource, setSentimentSource] = useState('');
    const [moodLevels, setMoodLevels] = useState<number[]>([]);
    const [journals, setJournals] = useState<any[]>([]);

    const [recommendations, setRecommendations] = useState<{ title: string, description: string, difficulty_level: string }[]>([]);
    const [generatingRecommendations, setGeneratingRecommendations] = useState(false);
    const [recsSource, setRecsSource] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<'Speech Sound' | 'Voice' | 'Fluency'>('Speech Sound');

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://dennis-9-voiceaid-health-backend.hf.space';

    const checkAuth = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }
        await loadPatientData();
    }, [router]);

    useEffect(() => {
        const last7: string[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        }
        setAvailableDates(last7);
        setSelectedDate(last7[0]); // default to today
        checkAuth();
    }, [checkAuth]);

    const loadPatientData = async () => {
        try {
            // 1. Load patient profile
            const { data: profileData, error: profileErr } = await supabase
                .from('patient_profiles')
                .select('*')
                .eq('id', patientId)
                .single();

            if (profileErr || !profileData) throw profileErr || new Error('Patient not found');
            setPatient(profileData);

            const uid = profileData.user_id;

            // 2. Load patient analytics & transcriptions using union keys
            const [analyticsRes, transcriptionsRes, moodLogsRes, journalsRes] = await Promise.all([
                supabase
                    .from('patient_analytics')
                    .select('*')
                    .or(`patient_profile_id.eq.${patientId}${uid ? `,user_id.eq.${uid}` : ''}`)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('transcriptions')
                    .select('*')
                    .or(`patient_profile_id.eq.${patientId}${uid ? `,user_id.eq.${uid}` : ''}`)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('mood_logs')
                    .select('mood_level')
                    .eq('patient_id', patientId)
                    .order('created_at', { ascending: false })
                    .limit(10),
                supabase
                    .from('voice_journals')
                    .select('*')
                    .eq('patient_id', patientId)
                    .order('created_at', { ascending: false })
            ]);

            const dbAnalytics = analyticsRes.data || [];
            const dbTranscriptions = transcriptionsRes.data || [];
            const dbMoodLogs = moodLogsRes.data || [];
            const dbJournals = journalsRes.data || [];

            setAnalytics(dbAnalytics);
            setTranscriptions(dbTranscriptions);
            setMoodLevels(dbMoodLogs.map((m: any) => m.mood_level));
            setJournals(dbJournals);

            // 3. Compute Stats
            // Duration conversion to hours
            const totalSecs = dbAnalytics.reduce((sum, a) => sum + (a.duration || 0), 0);
            setHoursPracticed(Number((totalSecs / 3600).toFixed(1)));

            // Streak calculation
            let calculatedStreak = 0;
            if (dbAnalytics.length > 0) {
                const uniqueDays = new Set(dbAnalytics.map(a => a.created_at.split('T')[0]));
                const sortedDays = Array.from(uniqueDays).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                
                let currentStreak = 0;
                const todayStr = new Date().toISOString().split('T')[0];
                let lastCheckedDate = new Date(todayStr);

                const hasPracticedRecently = sortedDays.some(d => {
                    const diff = Math.abs(new Date(todayStr).getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24);
                    return diff <= 1;
                });

                if (hasPracticedRecently) {
                    for (let i = 0; i < sortedDays.length; i++) {
                        const day = sortedDays[i];
                        const diffDays = Math.round(Math.abs(lastCheckedDate.getTime() - new Date(day).getTime()) / (1000 * 60 * 60 * 24));
                        if (diffDays <= 1) {
                            currentStreak++;
                            lastCheckedDate = new Date(day);
                        } else {
                            break;
                        }
                    }
                }
                calculatedStreak = currentStreak || 1;
            }
            setStreak(calculatedStreak);

            // Average Confidence Score
            if (dbTranscriptions.length > 0) {
                const totalConf = dbTranscriptions.reduce((sum, t) => sum + (t.confidence_score || 0.85), 0);
                setAvgConfidence(Number((totalConf / dbTranscriptions.length).toFixed(2)));
            }

            // Compliance
            const completedExercises = dbAnalytics.filter(a => a.mode === 'streaming' || a.mode === 'batch').length;
            const targetCount = Math.max(dbAnalytics.length, 5);
            setCompliance(Math.round((completedExercises / targetCount) * 100));

        } catch (err) {
            console.error('Error loading patient detail:', err);
        } finally {
            setLoading(false);
        }
    };

    const getTodayDateString = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const loadGoalsForDate = useCallback(async (date: string) => {
        if (!patientId || !date) return;
        setLoadingGoals(true);
        try {
            const { data, error } = await supabase
                .from('patient_goals')
                .select('*')
                .eq('patient_id', patientId)
                .eq('assigned_date', date)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setGoals(data || []);
        } catch (e) {
            console.error('Error loading patient goals for date:', e);
        } finally {
            setLoadingGoals(false);
        }
    }, [patientId]);

    useEffect(() => {
        if (selectedDate) {
            loadGoalsForDate(selectedDate);
        }
    }, [selectedDate, loadGoalsForDate]);

    const cleanMarkdown = (text: string) => {
        if (!text) return '';
        return text
            .replace(/#+\s+/g, '') // remove headings (# or ###)
            .replace(/\*\*/g, '')  // remove bold asterisks
            .replace(/\*/g, '')    // remove single asterisks
            .replace(/^-\s+/gm, '') // remove list hyphens at start of line
            .replace(/^\*\s+/gm, '') // remove list asterisks at start of line
            .replace(/_{1,2}/g, '') // remove underscores
            .trim();
    };

    // AI API Calls
    const generateSummary = async () => {
        if (!patient) return;
        setGeneratingSummary(true);
        try {
            const recentTranscripts = transcriptions.slice(0, 8).map(t => t.text);

            // Extract struggles/mistakes from session logs
            const strugglesPayload: any[] = [];
            analytics.forEach(s => {
                if (s.metadata?.struggles) {
                    s.metadata.struggles.forEach((st: any) => {
                        strugglesPayload.push({
                            questTitle: st.questTitle || 'Phrase Quest',
                            attempts: st.attempts || 1,
                            detail: st.detail || 'Wrong sentence arrangement'
                        });
                    });
                } else if (s.metadata?.incorrectAttempts > 0) {
                    strugglesPayload.push({
                        questTitle: s.metadata?.questTitle || 'Word Game Practice',
                        attempts: s.metadata.incorrectAttempts,
                        detail: s.metadata.details || 'Struggled with speech repetition / word match'
                    });
                }
            });

            // Fetch completed assignments from the database to send
            const { data: allGoalsData } = await supabase
                .from('patient_goals')
                .select('*')
                .eq('patient_id', patientId);
            
            const completedAssignmentsPayload = (allGoalsData || [])
                .filter((g: any) => g.completed)
                .map((g: any) => ({
                    title: g.title,
                    category: g.category,
                    completed: g.completed,
                    voice_transcript: g.voice_transcript || null
                }));

            const response = await fetch(`${backendUrl}/predict/summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_name: patient.full_name || 'Patient',
                    transcripts: recentTranscripts,
                    compliance_rate: compliance,
                    streak: streak,
                    hours_practiced: hoursPracticed,
                    struggles: strugglesPayload.slice(0, 10),
                    completed_assignments: completedAssignmentsPayload.slice(0, 10)
                })
            });
            const data = await response.json();
            setAiSummary(cleanMarkdown(data.summary || ''));
            setSummarySource(data.source || 'Local AI Engine');
        } catch (e) {
            console.error('[AI Detail] Failed to query summary', e);
        } finally {
            setGeneratingSummary(false);
        }
    };

    const analyzeSentiment = async () => {
        setAnalyzingSentiment(true);
        try {
            const recentTranscripts = journals.slice(0, 10).map(j => j.transcript);
            const response = await fetch(`${backendUrl}/predict/sentiment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcripts: recentTranscripts,
                    mood_levels: moodLevels
                })
            });
            const data = await response.json();
            setSentiment({
                happy: data.happy || 0,
                frustrated: data.frustrated || 0,
                anxious: data.anxious || 0,
                neutral: data.neutral || 0,
                reasoning: data.reasoning || 'No journals analyzed.'
            });
            setSentimentSource(data.source || 'Local AI Engine');
        } catch (e) {
            console.error('[AI Detail] Failed to analyze sentiment', e);
        } finally {
            setAnalyzingSentiment(false);
        }
    };

    const getRecommendations = async () => {
        if (!patient) return;
        setGeneratingRecommendations(true);
        try {
            const response = await fetch(`${backendUrl}/predict/recommendations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_name: patient.full_name || 'Patient',
                    language: transcriptions[0]?.language || 'tw',
                    difficulty: selectedDifficulty
                })
            });
            const data = await response.json();
            setRecommendations(data.recommendations || []);
            setRecsSource(data.source || 'Local AI Engine');
        } catch (e) {
            console.error('[AI Detail] Failed to get recommendations', e);
        } finally {
            setGeneratingRecommendations(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#CC0000] animate-spin" />
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="p-8 text-center">
                <ShieldAlert className="w-12 h-12 text-[#CC0000] mx-auto mb-4" />
                <h2 className="text-xl font-bold">Patient Not Found</h2>
                <button onClick={() => router.push('/patients')} className="mt-4 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm">
                    Back to patient list
                </button>
            </div>
        );
    }

    const showRiskAlert = avgConfidence < 0.65 && transcriptions.length > 2;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            {/* Back to patients list */}
            <div className="mb-6">
                <Link
                    href="/patients"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
                >
                    <ArrowLeft size={16} />
                    Back to Patients
                </Link>
            </div>

            {/* Profile Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative p-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#CC0000] to-[#008000]" />
                <div className="flex items-center gap-4 mt-1">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow ${
                        patient.patient_type === 'hospital'
                            ? 'bg-gradient-to-br from-[#008000] to-[#006600]'
                            : 'bg-gradient-to-br from-[#FFD700] to-[#E6B800] text-black'
                    }`}>
                        {(patient.full_name || 'G').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{patient.full_name || 'Guest User'}</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${
                                patient.patient_type === 'hospital'
                                    ? 'bg-[#008000]/10 text-[#008000]'
                                    : 'bg-[#FFD700]/20 text-[#111111]'
                            }`}>
                                {patient.patient_type === 'hospital' ? '🏥 Hospital Patient' : '👤 Guest Patient'}
                            </span>
                            {patient.hospital_id && (
                                <code className="text-xs bg-gray-50 border border-gray-100 px-2 py-0.5 rounded font-mono text-gray-500">
                                    ID: {patient.hospital_id}
                                </code>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs text-gray-400 font-medium">Synced on Supabase Database</span>
                    <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">{patient.id}</span>
                </div>
            </div>

            {/* Early Risk Alert Banner */}
            {showRiskAlert && (
                <div className="mb-8 bg-red-50 border-l-4 border-[#CC0000] rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-pulse">
                    <ShieldAlert className="w-5 h-5 text-[#CC0000] shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-[#CC0000] uppercase tracking-wider">Clinical Risk Alert: Stutter/Articulation struggles</h4>
                        <p className="text-xs text-red-700 mt-1 font-medium leading-relaxed">
                            Patient has shown low speech recognition confidence ({Math.round(avgConfidence * 100)}%) across their last {transcriptions.length} transcript sessions. 
                            This often points to fatigue or muscle spasms. Review progress summary and adjust therapy difficulty.
                        </p>
                    </div>
                </div>
            )}

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                            <Award className="w-5 h-5 text-[#008000]" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-semibold">Compliance Rate</p>
                            <p className="text-xl font-bold text-gray-900">{compliance}%</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-semibold">Training Streak</p>
                            <p className="text-xl font-bold text-gray-900">{streak} Days</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-semibold">Aggregate Practice</p>
                            <p className="text-xl font-bold text-gray-900">{hoursPracticed} Hrs</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                            <Volume2 className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-semibold">Avg ASR Confidence</p>
                            <p className="text-xl font-bold text-gray-900">{Math.round(avgConfidence * 100)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Left and Right Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Column 1: AI Diagnostics Panel (2 cols on desktop) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* AI Progress Summarizer */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#CC0000] to-[#008000]" />
                        <div className="flex items-center justify-between mb-6 mt-1">
                            <div className="flex items-center gap-2">
                                <Brain size={20} className="text-[#CC0000]" />
                                <h2 className="text-lg font-bold text-gray-900">AI Clinical Progress Review</h2>
                            </div>
                            <button
                                onClick={generateSummary}
                                disabled={generatingSummary}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CC0000]/10 hover:bg-[#CC0000]/20 text-[#CC0000] text-xs font-bold rounded-lg transition-colors border border-[#CC0000]/20"
                            >
                                {generatingSummary ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3.5 h-3.5" />
                                )}
                                {aiSummary ? 'Regenerate review' : 'Generate review'}
                            </button>
                        </div>

                        {generatingSummary ? (
                            <div className="py-12 text-center text-gray-400 space-y-3">
                                <Loader2 className="w-8 h-8 animate-spin text-[#CC0000] mx-auto" />
                                <p className="text-xs font-semibold">Contacting HuggingFace Serverless LLM...</p>
                            </div>
                        ) : aiSummary ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm leading-relaxed text-gray-700 font-medium whitespace-pre-line prose prose-sm max-w-none">
                                    {aiSummary}
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold px-1">
                                    <span>Engine: {summarySource}</span>
                                    <span>Rate: 0.00$ / free tier</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center border border-dashed border-gray-200 rounded-2xl text-gray-400">
                                <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm font-semibold">No active clinical review.</p>
                                <p className="text-xs text-gray-500 mt-1">Click the button above to run LLM progress review on recent recordings.</p>
                            </div>
                        )}
                    </div>

                    {/* Daily Assignments Selector Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Calendar size={20} className="text-gray-500" />
                                <h2 className="text-lg font-bold text-gray-900">Daily Assignments</h2>
                            </div>
                        </div>

                        {/* Date selection strip */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                            {availableDates.map(date => {
                                const isSelected = date === selectedDate;
                                const isT = date === getTodayDateString();
                                // format date nicely
                                const formatted = (() => {
                                    if (date === getTodayDateString()) return 'Today';
                                    const d = new Date(date + 'T00:00:00');
                                    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
                                })();
                                return (
                                    <button
                                        key={date}
                                        onClick={() => setSelectedDate(date)}
                                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                                            isSelected
                                                ? 'bg-[#CC0000] border-[#CC0000] text-white shadow-sm'
                                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className={isSelected ? 'text-white' : isT ? 'text-[#CC0000]' : 'text-gray-500'}>
                                            {formatted}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Assignments List */}
                        {loadingGoals ? (
                            <div className="py-8 text-center">
                                <Loader2 className="w-6 h-6 animate-spin text-[#CC0000] mx-auto" />
                            </div>
                        ) : goals.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 border border-dashed border-gray-100 rounded-xl">
                                <p className="text-sm font-semibold text-gray-400">No assignments for this date.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {goals.map((g: any) => {
                                    const categoryLabels: Record<string, string> = {
                                        communication: 'Communication',
                                        language: 'Language',
                                        social: 'Social',
                                        fluency: 'Fluency',
                                        voice: 'Voice',
                                        speech_sound: 'Speech Sound',
                                    };
                                    return (
                                        <div key={g.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-start justify-between gap-4">
                                            <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md">
                                                        {categoryLabels[g.category] || g.category}
                                                    </span>
                                                    {g.requires_recording && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">
                                                            Voice Recording
                                                        </span>
                                                    )}
                                                    {g.completed && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-md">
                                                            <CheckCircle2 size={10} /> Completed
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-sm font-bold text-gray-900 mt-1">{g.title}</h4>
                                                {g.description && (
                                                    <p className="text-xs text-gray-500 leading-relaxed">{g.description}</p>
                                                )}
                                                {/* Patient Voice Response */}
                                                {g.voice_transcript && (
                                                    <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                                                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider block mb-1">Patient Verbal Response</span>
                                                        <p className="text-xs text-green-800 font-medium italic">"{g.voice_transcript}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Transcriptions History */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MessageSquare size={20} className="text-gray-400" />
                                <h2 className="text-lg font-bold text-gray-900 font-sans">Recent Transcripts Log</h2>
                            </div>
                            <span className="text-xs bg-gray-50 text-gray-400 font-bold border border-gray-100 px-2 py-0.5 rounded-md">
                                {transcriptions.length} items
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Output Phrase</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Language</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">ASR Score</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {transcriptions.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">
                                                No transcripts recorded for this patient.
                                            </td>
                                        </tr>
                                    ) : (
                                        transcriptions.map(log => (
                                            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900 italic">"{log.text}"</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                        log.language === 'tw' || log.language === 'twi'
                                                            ? 'bg-[#FFD700]/20 text-[#111111]'
                                                            : log.language === 'ga'
                                                            ? 'bg-[#008000]/10 text-[#008000]'
                                                            : 'bg-[#CC0000]/10 text-[#CC0000]'
                                                    }`}>
                                                        {log.language === 'tw' || log.language === 'twi' ? 'Twi' : log.language === 'ga' ? 'Ga' : 'English'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full ${
                                                                    (log.confidence_score || 0.85) > 0.8 ? 'bg-[#008000]' : 'bg-[#FFD700]'
                                                                }`} 
                                                                style={{ width: `${(log.confidence_score || 0.85) * 100}%` }} 
                                                            />
                                                        </div>
                                                        <span className="text-xs font-mono font-bold text-gray-500">
                                                            {Math.round((log.confidence_score || 0.85) * 100)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-400 font-semibold whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Column 2: Side Panel (Sentiment & Recommendations) */}
                <div className="space-y-8">
                    
                    {/* Mood & Sentiment Analyzer */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Smile size={18} className="text-gray-400" />
                                <h3 className="text-base font-bold text-gray-900">AI Mood Sentiment</h3>
                            </div>
                            <button
                                onClick={analyzeSentiment}
                                disabled={analyzingSentiment}
                                className="text-xs font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1"
                            >
                                {analyzingSentiment ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3.5 h-3.5" />
                                )}
                                Analyze
                            </button>
                        </div>

                        {analyzingSentiment ? (
                            <div className="py-12 text-center text-gray-400 space-y-2">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                                <p className="text-xs font-semibold">Running classification...</p>
                            </div>
                        ) : sentiment ? (
                            <div className="space-y-4">
                                <div className="space-y-2.5">
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-400 font-semibold mb-1">
                                            <span>😊 Happy</span>
                                            <span>{sentiment.happy}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${sentiment.happy}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-400 font-semibold mb-1">
                                            <span>😠 Frustrated</span>
                                            <span>{sentiment.frustrated}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                            <div className="h-full bg-[#CC0000] rounded-full" style={{ width: `${sentiment.frustrated}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-400 font-semibold mb-1">
                                            <span>😰 Anxious</span>
                                            <span>{sentiment.anxious}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${sentiment.anxious}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-400 font-semibold mb-1">
                                            <span>😐 Neutral</span>
                                            <span>{sentiment.neutral}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                            <div className="h-full bg-gray-400 rounded-full" style={{ width: `${sentiment.neutral}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600 font-medium italic">
                                    "{sentiment.reasoning}"
                                </div>
                                <div className="text-[9px] text-gray-400 font-semibold">Engine: {sentimentSource}</div>
                            </div>
                        ) : (
                            <div className="p-6 text-center border border-dashed border-gray-200 rounded-2xl text-gray-400">
                                <Smile className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-xs font-semibold">No mood profile active.</p>
                                <p className="text-[10px] text-gray-400 mt-1">Click Analyze to process emotional sentiment.</p>
                            </div>
                        )}
                    </div>

                    {/* Cognitive Struggle History Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldAlert size={18} className="text-red-500" />
                            <h3 className="text-base font-bold text-gray-900">Cognitive Struggle History</h3>
                        </div>
                        {(() => {
                            const struggles: Array<{ questTitle: string; date: string; incorrectAttempts: number; detail?: string }> = [];
                            analytics.forEach(s => {
                                if (s.metadata?.struggles) {
                                    s.metadata.struggles.forEach((st: any) => {
                                        struggles.push({
                                            questTitle: st.questTitle || 'Phrase Quest',
                                            date: s.created_at || s.date,
                                            incorrectAttempts: st.attempts || 1,
                                            detail: st.detail || 'Wrong sentence arrangement'
                                        });
                                    });
                                } else if (s.metadata?.incorrectAttempts > 0) {
                                    struggles.push({
                                        questTitle: s.metadata?.questTitle || 'Word Game Practice',
                                        date: s.created_at || s.date,
                                        incorrectAttempts: s.metadata.incorrectAttempts,
                                        detail: s.metadata.details || 'Struggled with speech repetition / word match'
                                    });
                                }
                            });

                            if (struggles.length === 0) {
                                return (
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                                        <p className="text-xs text-emerald-800 font-bold">Perfect Streak</p>
                                        <p className="text-[11px] text-emerald-600 mt-0.5">No speech coordination blocks or game failures logged.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                                    {struggles.slice(0, 8).map((st, index) => (
                                        <div key={index} className="p-3 bg-red-50/50 border border-red-100 rounded-xl">
                                            <div className="flex justify-between items-center gap-2">
                                                <h4 className="text-xs font-bold text-gray-950">{st.questTitle}</h4>
                                                <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                                                    {st.incorrectAttempts} error{st.incorrectAttempts > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">{st.detail}</p>
                                            <span className="text-[9px] text-gray-400 block mt-1.5 font-mono">
                                                {new Date(st.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>

                    {/* AI Personalized Recommendations */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-gray-400" />
                                <h3 className="text-base font-bold text-gray-900">AI Recommendations</h3>
                            </div>
                        </div>

                        {/* Dropdown difficulty picker */}
                        <div className="mb-4">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Select Difficulty Area</label>
                            <div className="flex gap-1">
                                {(['Speech Sound', 'Voice', 'Fluency'] as const).map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setSelectedDifficulty(d)}
                                        className={`flex-1 text-[11px] font-bold py-1 px-1.5 rounded border transition-all ${
                                            selectedDifficulty === d 
                                                ? 'bg-[#CC0000] border-[#CC0000] text-white'
                                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={getRecommendations}
                            disabled={generatingRecommendations}
                            className="w-full py-2 bg-[#008000] text-white font-bold rounded-xl text-xs hover:bg-[#006600] transition-colors flex items-center justify-center gap-1.5 mb-4"
                        >
                            {generatingRecommendations ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            Suggest tailored drills
                        </button>

                        {generatingRecommendations ? (
                            <div className="py-12 text-center text-gray-400 space-y-2">
                                <Loader2 className="w-6 h-6 animate-spin text-[#008000] mx-auto" />
                                <p className="text-xs font-semibold">Analyzing acoustic profiles...</p>
                            </div>
                        ) : recommendations.length > 0 ? (
                            <div className="space-y-3">
                                {recommendations.map((r, i) => (
                                    <div key={i} className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl relative overflow-hidden">
                                        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-[#008000] bg-[#008000]/10 px-1.5 py-0.5 rounded">
                                            {r.difficulty_level}
                                        </span>
                                        <h4 className="text-xs font-bold text-gray-900 mt-1">{r.title}</h4>
                                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{r.description}</p>
                                    </div>
                                ))}
                                <div className="text-[9px] text-gray-400 font-semibold mt-2">Engine: {recsSource}</div>
                            </div>
                        ) : (
                            <div className="p-6 text-center border border-dashed border-gray-200 rounded-2xl text-gray-400">
                                <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-xs font-semibold">No suggestions generated yet.</p>
                                <p className="text-[10px] text-gray-400 mt-1">Select an area and tap suggest drills.</p>
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
