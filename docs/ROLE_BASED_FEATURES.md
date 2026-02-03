# VoiceAid Health – Feature Breakdown by User Mode

## 🔹 App Entry (First Screen)
User selects one of the following:
- **Patient Mode**
- **Caregiver / Healthcare Worker Mode**

This selection controls what features are visible and accessible.

---

## 🧑‍🦽 PATIENT MODE
**👉 Designed for speech‑impaired users – simple, minimal, accessible**

### Core Features Shown

#### 1️⃣ Speech Communication
- Tap‑to‑record voice input
- Speech‑to‑Text (ASR)
- Large, readable transcription output
- Simple edit / confirm button

#### 2️⃣ Text‑to‑Speech (Speak for Me)
- Converts confirmed text to clear audio
- One‑tap "Speak" button
- Used to communicate with:
  - Doctors
  - Nurses
  - Caregivers
  - People nearby

#### 3️⃣ Visual Phraseboard (Very Important)
- Predefined phrases with icons + text
- Categories:
  - Pain / discomfort
  - Needs (water, toilet, rest)
  - Emotions
- Tap a phrase → app speaks it

#### 4️⃣ Suggested Meanings (AI Assistance)
- When speech is unclear, app suggests:
  - "Did you mean…?"
- Patient selects correct meaning
- Reduces frustration during communication

#### 5️⃣ Daily Care & Therapy Reminders (View‑Only)
- Shows:
  - Today's therapy tasks
  - Care routines
- Patient receives:
  - Voice prompts
  - Visual alerts
- **No complex setup by patient**

#### 6️⃣ Language Handling (Automatic)
- Automatic language detection (English / Twi / Ga)
- **Patient does not choose language manually**

### ❌ What Patient Mode Does NOT Include
- ❌ No reminder creation
- ❌ No system configuration
- ❌ No complex settings
- ❌ No data management

**👉 Reason**: Keeps UI simple and accessible.

---

## 👩‍⚕️ CAREGIVER / HEALTHCARE WORKER MODE
**👉 Designed for support, configuration, and assistance**

### Core Features Shown

#### 1️⃣ Assisted Communication Interface
Can:
- Record patient speech
- Edit transcribed text
- Trigger TTS output

Useful during:
- Therapy sessions
- Clinical interactions

#### 2️⃣ Phraseboard Management
- Add / edit / remove phrases
- Customize phrases per patient
- Local language phrase support

#### 3️⃣ Daily Care & Therapy Routine Management
- Create therapy tasks
- Schedule reminders
- Choose reminder format:
  - Voice
  - Text
  - Visual icons
- Assign reminders to patient

#### 4️⃣ Communication History
- View recent transcriptions
- Replay spoken messages
- Identify frequently used phrases

Useful for:
- Therapy tracking
- Communication assessment

#### 5️⃣ Language & Accessibility Settings
Enable / disable:
- English ASR
- Local language ASR (when available)

Control:
- Speech speed and volume
- Adjust visual accessibility settings

#### 6️⃣ AI & Model Switching (Advanced / Optional)
Choose:
- English ASR (default)
- Local ASR model (Hugging Face)

Useful for testing and improvement

### ❌ What Caregiver Mode Does NOT Include
- ❌ No medical diagnosis
- ❌ No medication prescription
- ❌ No sensitive patient records

**👉 Keeps system within scope and ethics approval.**

---

## 🔄 Feature Mapping Summary

| Feature | Patient Mode | Caregiver / HW Mode |
|---------|--------------|---------------------|
| Speech‑to‑Text | ✅ | ✅ |
| Text‑to‑Speech | ✅ | ✅ |
| Phraseboard Use | ✅ | ✅ |
| Phraseboard Editing | ❌ | ✅ |
| Therapy Reminders | View only | Full control |
| Communication History | Limited | Full |
| Language Settings | Auto | Manual control |

---

## 📱 Home Screen Layout by Mode

### Patient Mode Home Screen
```
┌─────────────────────────────────┐
│     VoiceAid Health             │
├─────────────────────────────────┤
│                                 │
│  🎤 Speak Now                   │
│     (Large, primary action)     │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │ 📋 Phrase│  │ 📅 My    │    │
│  │   Board  │  │ Reminders│    │
│  └──────────┘  └──────────┘    │
│                                 │
│  System Ready                   │
└─────────────────────────────────┘
```

### Caregiver Mode Home Screen
```
┌─────────────────────────────────┐
│     VoiceAid Health             │
│     (Caregiver Mode)            │
├─────────────────────────────────┤
│                                 │
│  🎤 Assist Communication        │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │ 📋 Manage│  │ 📅 Create│    │
│  │  Phrases │  │  Routine │    │
│  └──────────┘  └──────────┘    │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │ 📜 View  │  │ ⚙️  Full │    │
│  │  History │  │  Settings│    │
│  └──────────┘  └──────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

## 🎯 Implementation Guidelines

### When Building Features:

1. **Check User Role First**
   ```typescript
   const { role } = useRole();
   
   if (role === 'patient') {
     // Show simplified interface
   } else if (role === 'caregiver') {
     // Show full management tools
   }
   ```

2. **Patient Mode Principles**
   - ✅ Large buttons
   - ✅ Simple language
   - ✅ Minimal choices
   - ✅ Clear icons
   - ✅ Auto-everything
   - ❌ No editing
   - ❌ No configuration

3. **Caregiver Mode Principles**
   - ✅ Full control
   - ✅ Management tools
   - ✅ History access
   - ✅ Configuration options
   - ✅ Advanced features

---

## 📋 Feature Implementation Checklist

### Already Implemented ✅
- [x] User role selection
- [x] Role persistence
- [x] Role switching
- [x] Speech-to-Text (both modes)
- [x] Text-to-Speech (both modes)
- [x] AI intent suggestions (both modes)

### To Implement Based on Role

#### Patient Mode Features
- [ ] Simplified home screen
- [ ] View-only reminders page
- [ ] Phraseboard (use only)
- [ ] Auto language detection (no manual choice)
- [ ] Minimal settings

#### Caregiver Mode Features
- [ ] Full home screen with all tools
- [ ] Phraseboard editor
- [ ] Reminder creator/manager
- [ ] Communication history viewer
- [ ] Full settings access
- [ ] Language/model selection

---

## 🎨 UI/UX Differences

### Button Labels by Mode

| Feature | Patient Label | Caregiver Label |
|---------|---------------|-----------------|
| Speech Input | "Speak Now" | "Assist Communication" |
| Phraseboard | "Phrase Board" | "Manage Phrases" |
| Reminders | "My Reminders" | "Create Routine" |
| History | (Hidden) | "View History" |
| Settings | "Settings" | "Full Settings" |

---

## 📊 Access Control Matrix

| Screen/Feature | Patient | Caregiver |
|----------------|---------|-----------|
| **Speech Input** | ✅ Use | ✅ Use + Assist |
| **Phraseboard** | ✅ Tap phrases | ✅ Add/Edit/Delete |
| **Reminders** | ✅ View only | ✅ Create/Edit/Delete |
| **History Log** | ❌ None | ✅ Full access |
| **Settings** | ⚠️ Basic only | ✅ Full access |
| **Language Select** | ❌ Auto only | ✅ Manual choice |
| **Model Selection** | ❌ Hidden | ✅ Available |

---

## 🔐 Data Privacy & Ethics

### Patient Mode
- **Cannot access**: Other patients' data
- **Cannot export**: Communication logs
- **Cannot configure**: System settings

### Caregiver Mode  
- **Can access**: Assigned patient data only
- **Can export**: For therapy tracking
- **Can configure**: App behavior
- **Cannot access**: Medical records (out of scope)

---

## 🎓 For Your Thesis/Proposal

This role-based design demonstrates:

1. **User-Centered Design**
   - Different needs for different user types
   - Accessibility-first for patients
   - Professional tools for caregivers

2. **Ethical Considerations**
   - Privacy protection
   - Scope limitation
   - Ethics approval compliance

3. **Technical Implementation**
   - Role-based access control
   - Conditional rendering
   - Context management

4. **Real-World Application**
   - Reflects actual clinical settings
   - Supports therapy workflows
   - Reduces patient burden

---

**Last Updated**: December 26, 2025  
**Status**: Reference Document for All Feature Implementation  
**Use**: Check this before building any new feature!
