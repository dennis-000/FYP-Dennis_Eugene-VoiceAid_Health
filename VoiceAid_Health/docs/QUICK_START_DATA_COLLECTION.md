# Quick Start: Twi/Ga Data Collection for Whisper Fine-Tuning

## 🎯 **Goal**
Collect 10-20 hours of Twi and Ga speech data for training custom Whisper models.

---

## 📋 **Data Sources**

### **1. Mozilla Common Voice** ✅ **Recommended**
- **Twi Dataset**: https://commonvoice.mozilla.org/tw/datasets
- **Size**: ~10 hours validated
- **Format**: MP3 with TSV transcriptions
- **License**: CC0 (Public Domain)

**Download**:
```bash
# Download from Common Voice website
# Extract files
unzip cv-corpus-15.0-2023-09-08-tw.zip

cd cv-corpus-15.0-2023-09-08/tw
ls -lh
# clips/        - Audio files
# validated.tsv - Transcriptions
```

### **2. Ghana NLP** 
- Website: https://ghananlp.org
- May have additional Twi/Ga resources
- Contact for research access

### **3. Custom Recording** (Optional but Valuable)
- Record hospital-specific phrases
- Include speech impediment variations
- 50-100 clips per category

---

## 📁 **Required Dataset Structure**

```
twi_dataset/
├── audio/
│   ├── clip_001.wav
│   ├── clip_002.wav
│   └── ...
├── metadata.csv
└── README.md

ga_dataset/
├── audio/
│   ├── clip_001.wav
│   ├── clip_002.wav
│   └── ...
├── metadata.csv
└── README.md
```

### **metadata.csv Format**:
```csv
file_name,transcription,speaker_id,duration
clip_001.wav,"Medaase",spk_001,1.2
clip_002.wav,"Mepɛ nsuo",spk_002,1.5
```

---

## 🔧 **Data Preprocessing Script**

```python
# preprocess_data.py
import os
import pandas as pd
import soundfile as sf
import librosa
from pathlib import Path

def convert_common_voice_to_format(input_dir, output_dir):
    """
    Convert Common Voice format to training format
    """
    os.makedirs(f"{output_dir}/audio", exist_ok=True)
    
    # Read TSV
    df = pd.read_csv(f"{input_dir}/validated.tsv", sep='\t')
    
    metadata = []
    
    for idx, row in df.iterrows():
        # Load and resample audio
        audio_path = f"{input_dir}/clips/{row['path']}"
        audio, sr = librosa.load(audio_path, sr=16000)
        
        # Save as WAV
        new_filename = f"clip_{idx:05d}.wav"
        output_path = f"{output_dir}/audio/{new_filename}"
        sf.write(output_path, audio, 16000)
        
        # Add to metadata
        metadata.append({
            'file_name': new_filename,
            'transcription': row['sentence'],
            'speaker_id': row['client_id'],
            'duration': len(audio) / 16000
        })
        
        if idx % 100 == 0:
            print(f"Processed {idx} files...")
    
    # Save metadata
    pd.DataFrame(metadata).to_csv(
        f"{output_dir}/metadata.csv", 
        index=False
    )
    
    print(f"✅ Converted {len(metadata)} files")

# Usage
convert_common_voice_to_format(
    "cv-corpus-15.0-2023-09-08/tw",
    "twi_dataset"
)
```

---

## 📊 **Data Quality Check**

```python
# check_dataset.py
import pandas as pd
import soundfile as sf

def analyze_dataset(dataset_dir):
    """
    Analyze dataset quality
    """
    metadata = pd.read_csv(f"{dataset_dir}/metadata.csv")
    
    # Statistics
    print(f"Total clips: {len(metadata)}")
    print(f"Total duration: {metadata['duration'].sum() / 3600:.2f} hours")
    print(f"Average clip length: {metadata['duration'].mean():.2f} seconds")
    print(f"Unique speakers: {metadata['speaker_id'].nunique()}")
    
    # Check audio files
    for idx, row in metadata.head(10).iterrows():
        audio_path = f"{dataset_dir}/audio/{row['file_name']}"
        audio, sr = sf.read(audio_path)
        print(f"{row['file_name']}: {sr}Hz, {len(audio)/sr:.2f}s")

analyze_dataset("twi_dataset")
```

---

## 🎯 **Next Step**

Once you have the data ready, proceed to:
**`PHASE_3_GHANAIAN_ASR_PLAN.md` → Phase 3.2: Model Training**

---

**Estimated Time**: 1-2 days  
**Required**: 20GB storage minimum  
**Tools**: Python, librosa, soundfile, pandas
