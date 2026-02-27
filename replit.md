# VoiceAid Health

## Overview
VoiceAid Health is a React Native / Expo web application designed as a medical assistive technology tool. It helps speech-impaired patients communicate with caregivers through voice input, phrase boards, and text-to-speech features.

## Project Architecture
- **Framework**: Expo SDK 54 with React Native Web
- **Language**: TypeScript
- **Routing**: expo-router (file-based routing)
- **State Management**: React Context (RoleContext, AppContext)
- **Storage**: AsyncStorage (localStorage on web)
- **Styling**: React Native StyleSheet

## Project Structure
```
VoiceAid_Health/
├── app/               # Screen files (expo-router pages)
│   ├── _layout.tsx    # Root layout with providers
│   ├── index.tsx      # Home screen (patient/caregiver dashboard)
│   ├── welcome.tsx    # Role selection screen
│   ├── transcript.tsx # Speech transcription
│   ├── phraseboard.tsx # Pre-built phrases
│   ├── routine.tsx    # Daily care routines
│   ├── settings.tsx   # App settings
│   └── history.tsx    # History view
├── components/        # Reusable UI components
├── constants/         # Theme and configuration
├── contexts/          # React context providers
├── hooks/             # Custom hooks
├── services/          # Business logic services
├── styles/            # Stylesheet files
├── assets/            # Images and static assets
└── docs/              # Documentation
```

## Development
- Run: `cd VoiceAid_Health && npm run web`
- Port: 5000 (configured with `--host lan` for Replit proxy compatibility)
- Build: `cd VoiceAid_Health && npx expo export --platform web` (outputs to `dist/`)

## Key Features
- Patient and Caregiver role selection
- Speech-to-text transcription
- Pre-built phrase board for common medical phrases
- Text-to-speech output
- Daily care routine tracking
- Light and high-contrast theme modes
- Multi-language support (English, Twi, Ga)

## Recent Changes
- 2026-02-24: Initial Replit setup - configured Expo web on port 5000, fixed `useNativeDriver` for web compatibility in AnimatedSplashScreen
