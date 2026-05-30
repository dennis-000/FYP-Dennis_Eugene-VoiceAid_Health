'use client';

import { supabase, PatientProfile } from '@/lib/supabase';
import { BookOpen, Check, Edit2, Grid, Languages, Loader2, Plus, Search, Settings, Trash2, Volume2, Heart, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface ClinicalExercise {
    id: string;
    title: string;
    description: string;
    category: 'voice' | 'speech_sound' | 'fluency';
    requires_recording: boolean;
    assignedPatientName?: string;
}

interface AACSymbol {
    id: string;
    board: 'Feelings' | 'Hospital' | 'Greetings' | 'Common';
    wordEn: string;
    wordTwi: string;
    wordGa: string;
    imageUrl: string;
}

const INITIAL_EXERCISES: ClinicalExercise[] = [
    { id: '1', title: "Vowel Sound Prolongation ('Ah')", description: "Hold a steady, comfortable 'Ah' sound to build speech breath support and vocal stability.", category: 'voice', requires_recording: true },
    { id: '2', title: "Lip Purser & Press", description: "Press your lips together firmly and hold. Helps strengthen the bilabial seal for clearer articulation.", category: 'speech_sound', requires_recording: false },
    { id: '3', title: "Easy Onset Breathing", description: "Inhale gently and release soft, flowing air right as you start vocalization to reduce speech blocks.", category: 'fluency', requires_recording: true },
    { id: '4', title: "Glissando Pitch Glides", description: "Start on a comfortable pitch and glide upwards, then down, to expand range and warm up vocal cords.", category: 'voice', requires_recording: true },
    { id: '5', title: "Tongue Click & Release", description: "Press the tongue body flatly against the hard palate and release with a robust click. Aids oral motor agility.", category: 'speech_sound', requires_recording: false },
];

const INITIAL_SYMBOLS: AACSymbol[] = [
    { id: 's1', board: 'Feelings', wordEn: 'Happy', wordTwi: 'Anigyeɛ', wordGa: 'Miishɛɛ', imageUrl: '😊' },
    { id: 's2', board: 'Feelings', wordEn: 'Sad', wordTwi: 'Awurade/Awerɛhoɔ', wordGa: 'Awerɛhoɔ', imageUrl: '😢' },
    { id: 's3', board: 'Hospital', wordEn: 'Doctor', wordTwi: 'Dɔkta', wordGa: 'Tsofase', imageUrl: '👨‍⚕️' },
    { id: 's4', board: 'Hospital', wordEn: 'Pain', wordTwi: 'Yaw', wordGa: 'Waawuo', imageUrl: '💥' },
    { id: 's5', board: 'Greetings', wordEn: 'Hello', wordTwi: 'Akwaaba', wordGa: 'Teŋŋ', imageUrl: '👋' },
    { id: 's6', board: 'Greetings', wordEn: 'Thank You', wordTwi: 'Medaase', wordGa: 'Oyiwala doŋŋ', imageUrl: '🙏' },
    { id: 's7', board: 'Common', wordEn: 'Water', wordTwi: 'Nsuo', wordGa: 'Nuu', imageUrl: '💧' },
    { id: 's8', board: 'Common', wordEn: 'Sleep', wordTwi: 'Da', wordGa: 'Wɔ', imageUrl: '😴' },
];

export default function ContentLibraryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'exercises' | 'symbols' | 'synthesis'>('exercises');
    
    // Exercise library states
    const [exercises, setExercises] = useState<ClinicalExercise[]>([]);
    const [patients, setPatients] = useState<PatientProfile[]>([]);
    const [exerciseSearch, setExerciseSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form fields for new exercise
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newCategory, setNewCategory] = useState<'voice' | 'speech_sound' | 'fluency'>('voice');
    const [newRequiresRec, setNewRequiresRec] = useState(true);
    const [targetPatientId, setTargetPatientId] = useState('');

    // Symbol speak states
    const [symbols] = useState<AACSymbol[]>(INITIAL_SYMBOLS);
    const [activeBoard, setActiveBoard] = useState<'All' | 'Feelings' | 'Hospital' | 'Greetings' | 'Common'>('All');
    
    // Synthesis seeds state
    const [ttsPitch, setTtsPitch] = useState(1.0);
    const [ttsSpeed, setTtsSpeed] = useState(1.0);
    const [hasCorrectPitch, setHasCorrectPitch] = useState(true);

    const checkAuth = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }
        await loadLibraryData();
    }, [router]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const loadLibraryData = async () => {
        try {
            // 1. Fetch live exercises (goals table) and patient profiles
            const [goalsRes, patientsRes] = await Promise.all([
                supabase.from('patient_goals').select('*').order('created_at', { ascending: false }),
                supabase.from('patient_profiles').select('*').order('full_name', { ascending: true })
            ]);

            const dbPatients = patientsRes.data || [];
            setPatients(dbPatients);
            
            // Default active patient to first one
            if (dbPatients.length > 0) {
                setTargetPatientId(dbPatients[0].id);
            }

            const dbGoals = goalsRes.data || [];
            
            if (dbGoals.length > 0) {
                const liveExercises: ClinicalExercise[] = dbGoals.map(g => {
                    const patient = dbPatients.find(p => p.id === g.patient_id);
                    return {
                        id: g.id,
                        title: g.title,
                        description: g.description || '',
                        category: ['voice', 'speech_sound', 'fluency'].includes(g.category) ? g.category : 'speech_sound',
                        requires_recording: g.requires_recording || false,
                        assignedPatientName: patient?.full_name || 'System Template'
                    };
                });
                setExercises(liveExercises);
            } else {
                setExercises(INITIAL_EXERCISES);
            }

        } catch (err) {
            console.error('Error loading library datasets:', err);
            setExercises(INITIAL_EXERCISES);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExercise = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            // Determine active therapist (or default system therapist id)
            const systemTherapistId = '00000000-0000-0000-0000-000000000000';
            
            // Insert goal card directly into Supabase in real-time
            const todayStr = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('patient_goals')
                .insert([{
                    patient_id: targetPatientId || '00000000-0000-0000-0000-000000000000',
                    therapist_id: systemTherapistId,
                    title: newTitle.trim(),
                    description: newDescription ? newDescription.trim() : '',
                    category: newCategory,
                    completed: false,
                    assigned_date: todayStr,
                    requires_recording: newRequiresRec,
                    voice_transcript: null,
                }])
                .select()
                .single();

            if (error) throw error;

            const matchedPatient = patients.find(p => p.id === (targetPatientId || '00000000-0000-0000-0000-000000000000'));
            const addedCard: ClinicalExercise = {
                id: data.id,
                title: data.title,
                description: data.description || '',
                category: data.category,
                requires_recording: data.requires_recording,
                assignedPatientName: matchedPatient?.full_name || 'System Template'
            };

            setExercises([addedCard, ...exercises]);
            setIsAddModalOpen(false);
            setNewTitle('');
            setNewDescription('');
            setNewCategory('voice');
            setNewRequiresRec(true);
        } catch (err) {
            console.error('Failed to save real-time exercise:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteExercise = async (id: string) => {
        try {
            const { error } = await supabase
                .from('patient_goals')
                .delete()
                .eq('id', id);

            if (!error) {
                setExercises(exercises.filter(ex => ex.id !== id));
            }
        } catch (err) {
            console.error('Failed to delete live exercise:', err);
        }
    };

    const filteredExercises = exercises.filter(ex =>
        ex.title.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        ex.description.toLowerCase().includes(exerciseSearch.toLowerCase())
    );

    const filteredSymbols = symbols.filter(sym =>
        activeBoard === 'All' || sym.board === activeBoard
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#CC0000] animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto relative animate-fade-in">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <BookOpen size={16} className="text-[#CC0000]" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Global Curriculum & Assets</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[#111111] tracking-tight">Centralized Content Library</h1>
                    <p className="text-gray-500 mt-1">Curate standard therapist exercise goals, manage Symbol Speak AAC boards, and tune Ghanaian language synthesizers</p>
                </div>
                {activeTab === 'exercises' && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#CC0000] hover:bg-[#990000] text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-[#CC0000]/10"
                    >
                        <Plus size={16} />
                        Add Exercise Goal
                    </button>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-100 mb-8 bg-white p-1 rounded-xl shadow-sm border border-gray-100/50">
                <button
                    onClick={() => setActiveTab('exercises')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'exercises' ? 'bg-[#CC0000]/10 text-[#CC0000]' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    <BookOpen size={16} />
                    Clinical Exercises
                </button>
                <button
                    onClick={() => setActiveTab('symbols')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'symbols' ? 'bg-[#CC0000]/10 text-[#CC0000]' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    <Grid size={16} />
                    Symbol Speak Boards (AAC)
                </button>
                <button
                    onClick={() => setActiveTab('synthesis')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'synthesis' ? 'bg-[#CC0000]/10 text-[#CC0000]' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    <Languages size={16} />
                    Speech Synthesis Seeds
                </button>
            </div>

            {/* PORTAL A: CLINICAL EXERCISES PANEL */}
            {activeTab === 'exercises' && (
                <div className="space-y-6">
                    {/* Search and Filters */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search active clinical exercise cards..."
                            value={exerciseSearch}
                            onChange={e => setExerciseSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CC0000] focus:border-transparent bg-white text-sm"
                        />
                    </div>

                    {/* Exercises Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 checker-grid stagger">
                        {filteredExercises.map(ex => (
                            <div
                                key={ex.id}
                                className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col justify-between relative overflow-hidden"
                                style={{ boxShadow: 'var(--card-shadow)' }}
                            >
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#CC0000] to-[#008000]" />
                                <div>
                                    <div className="flex items-center justify-between mb-4 mt-1">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-bold ${
                                            ex.category === 'voice'
                                                ? 'bg-[#FFD700]/20 text-[#111111]'
                                                : ex.category === 'fluency'
                                                ? 'bg-[#CC0000]/10 text-[#CC0000]'
                                                : 'bg-[#008000]/10 text-[#008000]'
                                        }`}>
                                            {ex.category.toUpperCase().replace('_', ' ')}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteExercise(ex.id)}
                                            className="text-gray-300 hover:text-[#CC0000] transition-colors p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 leading-snug">{ex.title}</h3>
                                    <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed">{ex.description}</p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-semibold">
                                    <span className="text-blue-600 font-bold">👤 {ex.assignedPatientName || 'System'}</span>
                                    <span>{ex.requires_recording ? '🎤 Requires Audio' : '⏱️ Visual Cue Only'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PORTAL B: SYMBOL SPEAK AAC BOARDS PANEL */}
            {activeTab === 'symbols' && (
                <div className="space-y-6">
                    {/* Board categories switch */}
                    <div className="flex flex-wrap border-b border-gray-100 gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100/50">
                        {['All', 'Feelings', 'Hospital', 'Greetings', 'Common'].map(board => (
                            <button
                                key={board}
                                onClick={() => setActiveBoard(board as any)}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeBoard === board ? 'bg-[#CC0000] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                {board} Board
                            </button>
                        ))}
                    </div>

                    {/* AAC Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {filteredSymbols.map(sym => (
                            <div
                                key={sym.id}
                                className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col items-center justify-between relative overflow-hidden text-center hover:border-gray-200 transition-all cursor-pointer group"
                                style={{ boxShadow: 'var(--card-shadow)' }}
                            >
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#CC0000] to-[#008000]" />
                                <div className="text-4xl my-3 group-hover:scale-110 transition-transform">{sym.imageUrl}</div>
                                <div className="w-full space-y-1.5 mt-1">
                                    <h4 className="text-sm font-bold text-gray-900 leading-tight">{sym.wordEn}</h4>
                                    <div className="text-[10px] bg-gray-50 rounded-lg p-1.5 space-y-0.5 border border-gray-100 text-gray-500 font-bold">
                                        <div className="flex justify-between">
                                            <span>Twí:</span>
                                            <span className="text-gray-800">{sym.wordTwi}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Gã:</span>
                                            <span className="text-gray-800">{sym.wordGa}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PORTAL C: SPEECH SYNTHESIS SEEDS */}
            {activeTab === 'synthesis' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* TTS Tune controls */}
                    <div
                        className="bg-white rounded-2xl border border-gray-100 p-6 lg:col-span-2 space-y-6 flex flex-col justify-between"
                        style={{ boxShadow: 'var(--card-shadow)' }}
                    >
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Settings size={18} className="text-gray-400" />
                                <h2 className="text-base font-bold text-gray-900">VITS Dialect Synthesis Tuning</h2>
                            </div>

                            {/* Pitch Tune */}
                            <div>
                                <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                                    <span>Vocal Pitch Correction Factor</span>
                                    <span className="font-mono">{ttsPitch.toFixed(2)}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2.0"
                                    step="0.05"
                                    value={ttsPitch}
                                    onChange={e => setTtsPitch(Number(e.target.value))}
                                    className="w-full accent-[#CC0000]"
                                />
                            </div>

                            {/* Speed Tune */}
                            <div>
                                <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                                    <span>Global Voice Speed Coefficient</span>
                                    <span className="font-mono">{ttsSpeed.toFixed(2)}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2.0"
                                    step="0.05"
                                    value={ttsSpeed}
                                    onChange={e => setTtsSpeed(Number(e.target.value))}
                                    className="w-full accent-[#008000]"
                                />
                            </div>

                            {/* Pitch correction check */}
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={hasCorrectPitch}
                                    onChange={e => setHasCorrectPitch(e.target.checked)}
                                    className="rounded border-gray-300 text-[#CC0000] focus:ring-[#CC0000] w-4 h-4"
                                />
                                <span className="text-xs font-semibold text-gray-500">Enable Pitch Phase-Vocoder Stabilization</span>
                            </label>
                        </div>

                        <div className="text-[11px] text-gray-400 font-semibold mt-6 pt-4 border-t border-gray-100">
                            * Dialect coefficients set baseline parameters for patient TTS synthesizers in `services/tts`.
                        </div>
                    </div>

                    {/* Active TTS seeds table */}
                    <div
                        className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between"
                        style={{ boxShadow: 'var(--card-shadow)' }}
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Languages size={18} className="text-gray-400" />
                                <h2 className="text-base font-bold text-gray-900">Phonetic Seeds Table</h2>
                            </div>

                            <div className="space-y-3 font-semibold text-xs">
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-400">English Accent</span>
                                    <span className="font-mono text-gray-700">en-GH-vits</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-400">Twí Dialect Seed</span>
                                    <span className="font-mono text-gray-700">ak-vits-phonetic</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-400">Gã Dialect Seed</span>
                                    <span className="font-mono text-gray-700">ga-vits-phonetic</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-[10px] text-gray-400 font-semibold mt-6">
                            Standard phonetic seeds are hard-wired in the debian container configuration inside `modal_backend.py`.
                        </div>
                    </div>
                </div>
            )}

            {/* ADD EXERCISE GOAL DIALOG/MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-md animate-fade-in shadow-2xl relative">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#CC0000] to-[#008000]" />
                        <h2 className="text-lg font-bold text-gray-900 mb-4 mt-2">Create Standard Exercise Goal</h2>
                        
                        <form onSubmit={handleCreateExercise} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Target Patient Profile</label>
                                {patients.length === 0 ? (
                                    <span className="text-xs text-amber-600 font-semibold">No active patient profiles found. Using template seeder.</span>
                                ) : (
                                    <select
                                        value={targetPatientId}
                                        onChange={e => setTargetPatientId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CC0000] focus:border-transparent text-sm bg-white font-medium text-gray-800"
                                    >
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.full_name || 'Guest User'} ({p.patient_type})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Exercise Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="e.g. Lip Purser & Press"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CC0000] focus:border-transparent text-sm bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Exercise Category</label>
                                <select
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CC0000] focus:border-transparent text-sm bg-white"
                                >
                                    <option value="voice">Vocal / Voice (voice)</option>
                                    <option value="speech_sound">Oral / Motor (speech_sound)</option>
                                    <option value="fluency">Breathing / Fluency (fluency)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Exercise Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={newDescription}
                                    onChange={e => setNewDescription(e.target.value)}
                                    placeholder="e.g. Practice holding deep inhalation and slow release..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CC0000] focus:border-transparent text-sm bg-white"
                                />
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer select-none py-1">
                                <input
                                    type="checkbox"
                                    checked={newRequiresRec}
                                    onChange={e => setNewRequiresRec(e.target.checked)}
                                    className="rounded border-gray-300 text-[#CC0000] focus:ring-[#CC0000] w-4 h-4"
                                />
                                <span className="text-xs font-bold text-gray-500">Requires audio voice recording evaluation</span>
                            </label>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-[#CC0000] hover:bg-[#990000] text-white text-xs font-bold rounded-xl shadow-md shadow-[#CC0000]/10 flex items-center gap-1.5"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Add Goal Card'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
