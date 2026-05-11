"""
Audio Chunking Service for Live Transcription
Handles splitting continuous audio into processable chunks with overlap
"""
import numpy as np
from typing import List, Tuple
import io
import soundfile as sf

class AudioChunker:
    def __init__(self, chunk_duration: float = 2.0, overlap: float = 0.5, sample_rate: int = 16000):
        """
        Initialize audio chunker
        
        Args:
            chunk_duration: Duration of each chunk in seconds
            overlap: Overlap between chunks in seconds
            sample_rate: Audio sample rate (Hz)
        """
        self.chunk_duration = chunk_duration
        self.overlap = overlap
        self.sample_rate = sample_rate
        self.chunk_size = int(chunk_duration * sample_rate)
        self.overlap_size = int(overlap * sample_rate)
        self.step_size = self.chunk_size - self.overlap_size
        
    def chunk_audio(self, audio_data: np.ndarray) -> List[np.ndarray]:
        """
        Split audio into overlapping chunks
        
        Args:
            audio_data: Audio samples as numpy array
            
        Returns:
            List of audio chunks
        """
        chunks = []
        start = 0
        
        while start < len(audio_data):
            end = min(start + self.chunk_size, len(audio_data))
            chunk = audio_data[start:end]
            
            # Pad last chunk if needed
            if len(chunk) < self.chunk_size:
                chunk = np.pad(chunk, (0, self.chunk_size - len(chunk)), mode='constant')
            
            chunks.append(chunk)
            start += self.step_size
            
        return chunks
    
    def merge_transcriptions(self, transcriptions: List[Tuple[str, float, float]]) -> str:
        """
        Merge overlapping transcriptions intelligently
        
        Args:
            transcriptions: List of (text, start_time, end_time) tuples
            
        Returns:
            Merged transcription text
        """
        if not transcriptions:
            return ""
        
        # Simple merge - concatenate with space
        # TODO: Implement smart overlap resolution
        merged_text = " ".join([t[0] for t in transcriptions if t[0].strip()])
        return merged_text.strip()
    
    @staticmethod
    def decode_audio_bytes(audio_bytes: bytes) -> Tuple[np.ndarray, int]:
        """
        Decode audio bytes to numpy array using pydub for robust format handling
        
        Args:
            audio_bytes: Raw audio file bytes (wav, mp3, m4a, etc.)
            
        Returns:
            Tuple of (audio_data, sample_rate)
        """
        try:
            from pydub import AudioSegment
            
            # Load audio from bytes
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
            
            # Convert to mono and 16kHz (standard for Whisper)
            audio = audio.set_channels(1).set_frame_rate(16000)
            
            # Get raw data and normalize to float32 [-1, 1]
            samples = np.array(audio.get_array_of_samples()).astype(np.float32)
            samples /= np.iinfo(audio.array_type).max
            
            return samples, 16000
            
        except Exception as e:
            print(f"[AudioChunker] Pydub decode failed: {e}")
            # Fallback to soundfile if pydub fails 
            # (though soundfile likely won't handle m4a/mp4)
            audio_data, sample_rate = sf.read(io.BytesIO(audio_bytes))
            
            # Ensure mono
            if len(audio_data.shape) > 1:
                audio_data = audio_data.mean(axis=1)
                
            return audio_data, sample_rate

# Singleton instance
audio_chunker = AudioChunker()
