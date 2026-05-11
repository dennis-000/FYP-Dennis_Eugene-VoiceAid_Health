import json
import os

files_to_patch = [
    r"c:\dev\FYP-Dennis_Eugene-VoiceAid_Health\backend\ml_pipeline\CPU_Fallback_Deployment.ipynb",
    r"c:\dev\FYP-Dennis_Eugene-VoiceAid_Health\backend\ml_pipeline\Live_GPU_Deployment.ipynb"
]

SYNTHESIZE_CODE = """@app.post("/tts/synthesize")
@app.get("/tts/synthesize")
async def synthesize(request_or_text, language: str = "tw", speed: float = 1.0, gender: str = "male"):
    text = request_or_text.text if hasattr(request_or_text, 'text') else request_or_text
    load_tts()
    
    inputs = tts_tokenizer(text, return_tensors="pt")
    if "cuda" in str(tts_model.device):
        inputs = inputs.to("cuda")
        
    with torch.no_grad():
        output = tts_model(**inputs).waveform
        
    audio_np = output.squeeze().cpu().numpy()
    
    import librosa
    if gender == "female":
        audio_np = librosa.effects.pitch_shift(audio_np, sr=tts_model.config.sampling_rate, n_steps=3.5)
    if speed != 1.0:
        audio_np = librosa.effects.time_stretch(audio_np, rate=speed)
    
    # MATHEMATICAL BUFFER PADDING: Append exactly 0.5s of dead air to the tensor to prevent phone truncation clips!
    import numpy as np
    pad_length = int(0.5 * tts_model.config.sampling_rate)
    audio_np = np.pad(audio_np, (0, pad_length), mode='constant')
    
    audio_np = (audio_np * 32767.0).astype(np.int16)
    audio_io = io.BytesIO()
    import scipy.io.wavfile
    scipy.io.wavfile.write(audio_io, tts_model.config.sampling_rate, audio_np)
    audio_io.seek(0)
    from fastapi.responses import StreamingResponse
    return StreamingResponse(audio_io, media_type="audio/wav")
"""

for path in files_to_patch:
    print(f"Checking {path}")
    if not os.path.exists(path):
        continue
        
    with open(path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
        
    for cell in nb.get('cells', []):
        if cell['cell_type'] == 'code':
            source = cell.get('source', [])
            joined_source = ''.join(source)
            if "@app.post(\"/tts/synthesize\")" in joined_source:
                # We need to replace everything from @app.post("/tts/synthesize") downwards until "### ---- DEPLOYMENT LOADER ----"
                lines = source
                new_lines = []
                in_synth_block = False
                for line in lines:
                    if "@app.post(\"/tts/synthesize\")" in line:
                        in_synth_block = True
                        new_lines.append(SYNTHESIZE_CODE.replace('\n', '\n'))
                        new_lines[-1] = new_lines[-1] + "\n"
                        continue
                    if in_synth_block:
                        if "### ---- DEPLOYMENT LOADER ----" in line:
                            in_synth_block = False
                        else:
                            continue
                            
                    if not in_synth_block:
                        new_lines.append(line)
                        
                synth_lines = [l + '\n' for l in SYNTHESIZE_CODE.split('\n')]
                
                final_source = []
                skip = False
                for line in lines:
                    if "@app.post(\"/tts/synthesize\")" in line:
                        final_source.extend(synth_lines)
                        skip = True
                    elif skip and "### ---- DEPLOYMENT LOADER ----" in line:
                        skip = False
                        final_source.append('\n')
                        final_source.append(line)
                    elif not skip:
                        final_source.append(line)
                        
                cell['source'] = final_source
                print(f"Patched synthesize override in {path}")
                
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=1)
        
print("Done patching.")
