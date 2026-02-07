/**
 * Live/Streaming Transcription Service
 * Handles real-time audio transcription via WebSocket
 */

import { ENDPOINTS } from '../../constants/config';

export interface StreamingTranscriptionResult {
    text: string;
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

            // Convert HTTP endpoint to WebSocket
            const wsUrl = ENDPOINTS.ASR.replace('http://', 'ws://').replace('/transcribe', '/stream');

            console.log(`[Streaming ASR] Connecting to ${wsUrl}...`);

            try {
                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('[Streaming ASR] ✅ Connected');
                    this.reconnectAttempts = 0;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);

                        if (data.error) {
                            console.error('[Streaming ASR] Error from server:', data.error);
                            if (this.onError) {
                                this.onError({
                                    error: data.error,
                                    chunkId: data.chunk_id || 0,
                                });
                            }
                        } else if (this.onTranscription) {
                            this.onTranscription({
                                text: data.text,
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

    /**
     * Send audio chunk for transcription
     */
    async sendAudioChunk(audioUri: string): Promise<void> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket not connected');
        }

        try {
            // Read audio file and convert to base64
            const audioBase64 = await this.audioToBase64(audioUri);

            const message = {
                audio: audioBase64,
                language: this.language,
                chunk_id: this.chunkCounter++,
            };

            this.ws.send(JSON.stringify(message));
            console.log(`[Streaming ASR] Sent chunk ${message.chunk_id}`);
        } catch (error) {
            console.error('[Streaming ASR] Failed to send audio chunk:', error);
            throw error;
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
            if (this.onTranscription && this.onError) {
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
        if (this.ws) {
            console.log('[Streaming ASR] Disconnecting...');
            this.ws.close();
            this.ws = null;
        }
        this.chunkCounter = 0;
        this.reconnectAttempts = 0;
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
