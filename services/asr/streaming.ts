/**
 * Live/Streaming Transcription Service
 * Handles real-time audio transcription via WebSocket
 */

import { ENDPOINTS } from '../../constants/config';

export interface StreamingTranscriptionResult {
    text: string;
    predicted_text?: string;
    chunkId: number;
    model: string;
    isFinal: boolean;
    language: string;
    confidence?: number;
}

export interface StreamingTranscriptionError {
    error: string;
    chunkId: number;
}

type TranscriptionCallback = (result: StreamingTranscriptionResult) => void;
type ErrorCallback = (error: StreamingTranscriptionError) => void;

export class StreamingASRService {
    private ws: WebSocket | null = null;
    private chunkCounter: number = 0;
    private onTranscription: TranscriptionCallback | null = null;
    private onError: ErrorCallback | null = null;
    private language: string = 'en';
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 3;
    private isProcessingChunk: boolean = false;
    private intentionalDisconnect: boolean = false; // Prevents reconnect after explicit disconnect

    /**
     * Connect to WebSocket streaming endpoint
     */
    connect(
        language: string,
        onTranscription: TranscriptionCallback,
        onError: ErrorCallback
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            this.language = language;
            this.onTranscription = onTranscription;
            this.onError = onError;
            this.chunkCounter = 0;
            this.isProcessingChunk = false;
            this.intentionalDisconnect = false; // Reset flag on new connection

            // Convert HTTP/HTTPS endpoint to WebSocket (ws/wss)
            const wsUrl = ENDPOINTS.ASR.replace('https://', 'wss://').replace('http://', 'ws://').replace('/transcribe', '/stream');

            console.log(`[Streaming ASR] Connecting to ${wsUrl}...`);

            try {
                // Backend's WebSocketOriginBypassMiddleware handles all CORS/403 issues.
                // Frontend just needs a clean, simple connection.
                this.ws = new WebSocket(wsUrl);


                this.ws.onopen = () => {
                    console.log('[Streaming ASR] ✅ Connected');
                    this.reconnectAttempts = 0;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    console.log('[Streaming ASR] 📨 RAW MESSAGE RECEIVED:', event.data);
                    try {
                        const data = JSON.parse(event.data);
                        console.log('[Streaming ASR] 📦 PARSED DATA:', data);

                        if (data.error) {
                            console.error('[Streaming ASR] Error from server:', data.error);
                            this.isProcessingChunk = false;
                            this.processQueue(); // Try next in queue
                            if (this.onError) {
                                this.onError({
                                    error: data.error,
                                    chunkId: data.chunk_id || 0,
                                });
                            }
                        } else if (this.onTranscription) {
                            this.isProcessingChunk = false;
                            this.processQueue(); // Process next in queue
                            
                            const cleanText = (data.text || "").trim();

                            // Expanded hallucination blocklist.
                            // These are phrases Whisper generates when it hears silence or background noise.
                            const hallucinations = [
                                // Original blocklist
                                "Mmarima.", "Wɔredidi.", "Ɔbarima bi reyɛ adwuma.",
                                "Wɔnom dware nsuo mu.", "Nnipa bebree na ɔmo gyina hɔ.",
                                "你", "You",
                                // Newly observed hallucinations (background noise triggers)
                                "Wɔredware nkɔmmɔ.", "Sogyafoɔ no wɔ hɔ.",
                                "Wɔnom dɔɔso bɛyɛ dɔɔso.", "Sɔre.",
                                "Ɔmo te sɛ yi.", "Wɔnom dware pɔnkɔ so.",
                                "Wɔnom dɔɔso bɛyɛ dɔ", "Wɔnom dɔɔso.",
                                "Nnipa no.", "Ɔdɔ.", "Wɔredware.",
                                "Ɔdɔ no.", "Wɔredware pɔnkɔ so.",
                                "Nnipa bebree.", "Wɔredidi no.",
                                // English noise hallucinations
                                "Thank you.", "Thank you", "Thanks.", "Okay.", "Okay",
                                "Ɔbaa no gyina nsuo mu.", "Wɔnom dware nsuo mu. Ɔbaa no gyina nsuo mu.",
                                "Wɔnom resere.",
                            ];

                            // Block model uncertainty/metadata markers — never real transcriptions
                            const isUncertaintyMarker = /^\s*\([^)]{0,40}\)[.,]?\s*$/.test(cleanText);
                            if (isUncertaintyMarker) {
                                console.log(`[Streaming ASR] ❓ Dropping model metadata marker: "${cleanText}"`);
                                return;
                            }

                            // Also block anything suspiciously short (1-2 chars) which is pure noise
                            if (
                                cleanText.length < 3 ||
                                hallucinations.includes(cleanText) || 
                                hallucinations.some(h => cleanText === h.replace('.', '') || cleanText.startsWith(h.replace('.', '')))
                            ) {
                                console.log(`[Streaming ASR] 🚫 Dropping hallucinated/noise chunk: "${cleanText}"`);
                                return;
                            }

                            // WHISPER LOOP HALLUCINATION DETECTOR:
                            // Catches both short loops ("word, word") and long repetitions
                            // ("woahwɛ, woahwɛ, woahwɛ..." repeated 24 times).
                            const words = cleanText.replace(/[.,!?]/g, '').split(/[\s,]+/).filter(Boolean);
                            const wordCounts: Record<string, number> = {};
                            for (const w of words) {
                                wordCounts[w.toLowerCase()] = (wordCounts[w.toLowerCase()] || 0) + 1;
                            }
                            const maxRepeatCount = Math.max(...Object.values(wordCounts), 0);
                            // Short loop: any word repeated 2+ times in ≤8 words
                            const isShortLoop = maxRepeatCount >= 2 && words.length <= 8;
                            // Long loop: any single word dominates >35% of a longer text (e.g. "woahwɛ" × 24)
                            const isLongLoop = maxRepeatCount >= 3 && (maxRepeatCount / words.length) > 0.35;
                            if (isShortLoop || isLongLoop) {
                                console.log(`[Streaming ASR] 🔁 Dropping loop hallucination (${maxRepeatCount} repeats): "${cleanText.slice(0, 60)}..."`);
                                return;
                            }


                            console.log('[Streaming ASR] 🎯 CALLING onTranscription callback');
                            this.onTranscription({
                                text: cleanText,
                                chunkId: data.chunk_id,
                                model: data.model,
                                isFinal: data.is_final,
                                language: data.language,
                                confidence: data.confidence,
                            });
                        }
                    } catch (error) {
                        console.error('[Streaming ASR] Failed to parse message:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('[Streaming ASR] WebSocket error:', error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('[Streaming ASR] Connection closed');
                    this.handleReconnect();
                };
            } catch (error) {
                console.error('[Streaming ASR] Failed to create WebSocket:', error);
                reject(error);
            }
        });
    }

    private chunkQueue: { uri: string; id: number }[] = [];

    /**
     * Send audio chunk for transcription (with queuing for lag resilience)
     */
    async sendAudioChunk(audioUri: string): Promise<void> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket not connected');
        }

        const chunkId = this.chunkCounter++;
        this.chunkQueue.push({ uri: audioUri, id: chunkId });
        console.log(`[Streaming ASR] Queued chunk ${chunkId}. Queue size: ${this.chunkQueue.length}`);

        this.processQueue();
    }

    /**
     * Process the queue sequentially
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessingChunk || this.chunkQueue.length === 0) return;

        const chunk = this.chunkQueue.shift();
        if (!chunk) return;

        try {
            this.isProcessingChunk = true;
            console.log(`[Streaming ASR] Sending chunk ${chunk.id}...`);

            // Read audio file and convert to base64
            const audioBase64 = await this.audioToBase64(chunk.uri);

            const message = {
                audio: audioBase64,
                language: this.language,
                chunk_id: chunk.id,
            };

            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(message));
            } else {
                console.warn('[Streaming ASR] WebSocket closed while processing queue');
            }
        } catch (error) {
            console.error('[Streaming ASR] Failed to send audio chunk:', error);
            // On error, we don't retry this specific chunk to prevent infinite loops,
            // but we move to the next one.
            this.isProcessingChunk = false;
            this.processQueue();
        }
    }

    /**
     * Convert audio file to base64
     */
    private async audioToBase64(uri: string): Promise<string> {
        try {
            // Use fetch + FileReader approach (works on both web and React Native)
            const response = await fetch(uri);
            const blob = await response.blob();

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('[Streaming ASR] Error converting audio to base64:', error);
            throw error;
        }
    }

    /**
     * Handle reconnection with exponential backoff
     */
    private handleReconnect(): void {
        // Do NOT reconnect if the user explicitly disconnected
        if (this.intentionalDisconnect) {
            console.log('[Streaming ASR] Intentional disconnect — skipping reconnect.');
            return;
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[Streaming ASR] Max reconnect attempts reached');
            if (this.onError) {
                this.onError({
                    error: 'Connection lost. Please try again.',
                    chunkId: -1,
                });
            }
            return;
        }

        const delay = Math.pow(2, this.reconnectAttempts) * 1000;
        this.reconnectAttempts++;

        console.log(`[Streaming ASR] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);

        setTimeout(() => {
            if (!this.intentionalDisconnect && this.onTranscription && this.onError) {
                this.connect(this.language, this.onTranscription, this.onError).catch((error) => {
                    console.error('[Streaming ASR] Reconnect failed:', error);
                });
            }
        }, delay);
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect(): void {
        console.log('[Streaming ASR] Disconnecting...');
        this.intentionalDisconnect = true; // Prevent handleReconnect from firing
        this.reconnectAttempts = this.maxReconnectAttempts; // Exhaust retries immediately
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.chunkCounter = 0;
        this.isProcessingChunk = false;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}

// Singleton instance
export const streamingASRService = new StreamingASRService();
