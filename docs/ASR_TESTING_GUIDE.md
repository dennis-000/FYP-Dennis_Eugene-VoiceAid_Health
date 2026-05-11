# ASR Testing Guide

## Quick Test Checklist

### ✅ Basic Transcription Test
1. **Open the app** → Navigate to "Smart Transcribe"
2. **Tap microphone** → Should see animated waveform
3. **Say**: "I need to see the doctor today"
4. **Tap stop** → Should transcribe accurately
5. **Check**: Confidence score > 80%

**Expected Result:**
- Text: "I need to see the doctor today" (or similar)
- Confidence: 85-95%
- Language: English (en)
- Intent: Medical appointment suggestions

---

### 🌍 Language Detection Test

#### Test 1: English
- **Say**: "Hello, I need help with my medication"
- **Expected**: Language detected as 'en'

#### Test 2: Twi (if supported)
- **Say**: "Medaase, merehwehwɛ mmoa"
- **Expected**: Language detected as 'twi'

#### Test 3: Auto-detect Mode
- **Settings**: Set language to "Auto-Detect"
- **Say**: Any phrase in English, Twi, or Ga
- **Expected**: Correct language badge shows after transcription

---

### 📊 Confidence Scoring Test

#### High Confidence (>80%)
- **Setup**: Quiet room, clear speech
- **Say**: "I would like to schedule an appointment"
- **Expected**: Green meter, 85-95% confidence

#### Medium Confidence (50-80%)
- **Setup**: Some background noise
- **Say**: Mumble or unclear speech
- **Expected**: Amber meter, 50-80% confidence

#### Low Confidence (<50%)
- **Setup**: Very noisy environment
- **Say**: Whisper or very unclear
- **Expected**: Red meter, warning message

---

### 🎤 Audio Quality Indicators Test

#### Too Quiet Test
- **Action**: Whisper into mic from far away
- **Expected**: 
  - Quality indicator: "Too Quiet"
  - Feedback: "Speak louder or move closer to mic"
  - Amber warning badge

#### Too Loud Test
- **Action**: Shout directly into mic
- **Expected**:
  - Quality indicator: "Too Loud"
  - Feedback: "Reduce volume or move back from mic"
  - Amber warning badge

#### Good Quality Test
- **Action**: Normal speech, moderate distance
- **Expected**:
  - Quality indicator: "Good Quality"
  - Green checkmark icon
  - No warnings

#### Background Noise Test
- **Action**: Record with music/TV in background
- **Expected**:
  - Quality indicator: "Background Noise"
  - Noise detection flag on confidence meter
  - Suggestion to reduce noise

---

### 🌊 Waveform Visualization Test

#### Idle State
- **Check**: Bars should pulse slowly
- **Check**: Bars should be dimmed (40% opacity)
- **Check**: Smooth animation

####Recording State
- **Speak**: Various volumes
- **Check**: Bars respond to voice
- **Check**: Louder = taller bars
- **Check**: Smooth transitions
- **Check**: Gradient effect (center brighter)

---

### 🎯 Intent Detection Test

#### Appointment Intent
- **Say**: "I need to schedule a checkup"
- **Expected Suggestions**:
  - "I would like to book an appointment"
  - "When is the next available slot?"
  - "Can I see the doctor this week?"

#### Medication Intent
- **Say**: "I need my prescription refilled"
- **Expected Suggestions**:
  - "I need a prescription refill"
  - "Can you refill my medication?"
  - "I'm running low on my medicine"

#### Emergency Intent
- **Say**: "I need urgent care"
- **Expected Suggestions**:
  - "This is an emergency"
  - "I need immediate medical attention"
  - "Please help me urgently"

---

### 🔧 Noise Reduction Test

#### Test Setup
1. Record same phrase in 3 environments:
   - Quiet room
   - Room with moderate noise (TV, fan)
   - Noisy environment (multiple people talking)

#### Expected Results
- **Quiet**: 90%+ confidence, no warnings
- **Moderate**: 70-80% confidence, noise detected flag
- **Noisy**: 50-70% confidence, strong warning, suggestion to re-record

---

### 📱 Platform-Specific Tests

#### iOS Test
- **Check**: Audio format is .m4a
- **Check**: Waveform is smooth
- **Check**: Audio quality is high

#### Android Test
- **Check**: Audio format is .mp4
- **Check**: Recording quality is good
- **Check**: No lag in UI

---

## Performance Benchmarks

### Expected Timing
- **Recording Start**: < 500ms
- **Waveform Update**: 100ms intervals
- **Transcription**: 1-3 seconds
- **Intent Detection**: 1-2 seconds
- **Total Time (record 5s)**: ~7-10 seconds

### Memory Usage
- **Idle**: Baseline
- **Recording**: +20-30MB
- **Processing**: +10-15MB
- **Peak**: Should not exceed +50MB

---

## Common Issues & Solutions

### Issue: Waveform Not Moving
**Causes:**
- Microphone permissions denied
- Audio metering not enabled
- Device issues

**Fix:**
- Check app permissions
- Restart app
- Test device microphone in other apps

### Issue: Low Confidence Always
**Causes:**
- Poor microphone quality
- Too much background noise
- Incorrect audio settings

**Fix:**
- Use better microphone
- Record in quiet environment
- Check audio preprocessing settings

### Issue: Language Not Detected
**Causes:**
- Very short phrases
- Mixed languages
- Unsupported dialect

**Fix:**
- Speak longer sentences
- Use one language consistently
- Manually select language

### Issue: Connection Errors
**Causes:**
- No internet
- Invalid API key
- Server issues

**Fix:**
- Check internet connection
- Verify .env file has correct API key
- Check Groq API status

---

## Test Scenarios Matrix

| Scenario | Expected Confidence | Expected Language | Noise Detection |
|----------|-------------------|-------------------|-----------------|
| Clear English, Quiet | 90-95% | en | No |
| Clear English, Moderate Noise | 75-85% | en | Yes |
| Unclear English, Quiet | 60-75% | en | No |
| Clear Twi, Quiet | 80-90% | twi | No |
| Whisper, Quiet | 40-60% | en | No |
| Shout, Quiet | 70-80% | en | No |
| Clear, Very Noisy | 50-70% | en | Yes |

---

## Automated Testing (Future)

### Unit Tests Needed
```typescript
- Test ASR service with sample audio
- Test language detection with known phrases
- Test confidence calculation accuracy
- Test noise detection algorithm
- Test audio quality analyzer
```

### Integration Tests Needed
```typescript
- Test full recording → transcription flow
- Test with various audio qualities
- Test with different languages
- Test error handling
- Test offline behavior
```

---

## Reporting Issues

When reporting bugs, include:
1. **Device**: iOS/Android version
2. **Steps**: Exact reproduction steps
3. **Audio**: Description of what was said
4. **Results**: Actual transcription & confidence
5. **Logs**: Console output
6. **Environment**: Noise level, location

---

**Test Duration**: 15-20 minutes for full suite
**Recommended Frequency**: After each major change
**Critical Path**: Basic transcription + language detection + confidence
