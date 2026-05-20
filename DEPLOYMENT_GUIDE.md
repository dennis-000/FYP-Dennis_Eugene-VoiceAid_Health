# VoiceAid Health — Deployment Guide

A complete guide to publishing the mobile app to the Play Store & App Store, and hosting the backend permanently without relying on Google Colab.

---

## Part 1 — Publishing the Mobile App

The app is built with **Expo (React Native)**. Publishing uses **EAS (Expo Application Services)** — Expo's official cloud build system.

### Step 1: Create Expo Account
Go to [expo.dev](https://expo.dev) and create a free account.

### Step 2: Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Step 3: Configure EAS in your project
Run this once inside the project folder:
```bash
cd c:\dev\FYP-Dennis_Eugene-VoiceAid_Health
eas build:configure
```
This creates an `eas.json` file. Accept the defaults.

### Step 4: Update `app.json`
Make sure these fields are set in your `app.json`:
```json
{
  "expo": {
    "name": "VoiceAid Health",
    "slug": "voiceaid-health",
    "version": "1.0.0",
    "android": {
      "package": "com.voiceaid.health",
      "versionCode": 1
    },
    "ios": {
      "bundleIdentifier": "com.voiceaid.health",
      "buildNumber": "1"
    }
  }
}
```

---

### 📱 Google Play Store (Android)

#### Build the APK/AAB
```bash
eas build --platform android --profile production
```
This builds an `.aab` file (Android App Bundle) in the cloud. Takes ~10 minutes. You get a download link.

#### Create a Google Play Developer Account
- Go to [play.google.com/console](https://play.google.com/console)
- Pay the **one-time $25 registration fee**
- Create a new app → "VoiceAid Health"

#### Submit
```bash
# Automated submission via EAS:
eas submit --platform android
```
Or manually: upload the `.aab` file in the Play Console under **Production → Releases**.

> ⚠️ Google review takes **3–7 days** for new apps.

---

### 🍎 Apple App Store (iOS)

#### Requirements
- A **Mac** (required to build iOS) OR use EAS cloud build (no Mac needed)
- An **Apple Developer Account** — costs **$99/year**
- An iPhone/iPad to test on

#### Build
```bash
eas build --platform ios --profile production
```

#### Submit
```bash
eas submit --platform ios
```
This uploads to **App Store Connect**. Then log into [appstoreconnect.apple.com](https://appstoreconnect.apple.com) and submit for review.

> ⚠️ Apple review takes **1–3 days**.

---

## Part 2 — Hosting the Backend Permanently

> The Google Colab approach is fine for development/demos but is **not suitable for production** — sessions expire, URLs change, and it requires manual restarts.

### Option Comparison

| Option | GPU | Cost | Difficulty | Best For |
|--------|-----|------|------------|----------|
| **Modal.dev** | ✅ Yes | ~$0.10–0.30/hr (pay-per-use) | ⭐ Easy | **Recommended for FYP** |
| **RunPod** | ✅ Yes | ~$0.20–0.40/hr | ⭐⭐ Medium | Heavy usage |
| **Hugging Face Spaces** | ✅ Limited free | Free (with queue) | ⭐ Easy | Demo / testing |
| **Railway** | ❌ CPU only | $5–20/month | ⭐ Easy | CPU backend |
| **Google Cloud (GCP)** | ✅ Yes | $0.50+/hr | ⭐⭐⭐ Hard | Production scale |
| **AWS EC2 (g4dn)** | ✅ Yes | $0.50+/hr | ⭐⭐⭐ Hard | Production scale |

---

### 🏆 Recommended: Modal.dev (Serverless GPU)

**Why Modal?** You only pay when someone is actually using the app. When no one is using it, cost is $0. Perfect for an FYP project or early-stage app.

#### Step 1: Install Modal
```bash
pip install modal
modal token new   # Creates account and authenticates
```

#### Step 2: Convert backend to Modal
Create a file `modal_backend.py` in the project:

```python
import modal

# Define the Modal app with a GPU
app = modal.App("voiceaid-health")

image = (
    modal.Image.debian_slim()
    .pip_install("fastapi", "uvicorn[standard]", "transformers", "torch",
                 "pydub", "soundfile", "python-multipart", "scipy",
                 "websockets", "accelerate", "librosa")
)

@app.function(
    image=image,
    gpu="T4",           # Request a T4 GPU (same as Colab)
    timeout=3600,       # 1 hour max per request
    container_idle_timeout=300,  # Shut down after 5min of no requests
)
@modal.asgi_app()
def fastapi_app():
    # Paste your entire FastAPI app here (the contents of Cell 2 in the notebook)
    # Remove the Cloudflare and uvicorn.serve() parts at the bottom
    return app  # Return the FastAPI 'app' object
```

#### Step 3: Deploy
```bash
modal deploy modal_backend.py
```
Modal gives you a **permanent public URL** like:
`https://voiceaid-health-fastapi-app.modal.run`

Paste this into `constants/config.ts` — it never changes!

#### Step 4: Update config.ts
```typescript
export const API_BASE_URL = 'https://voiceaid-health-fastapi-app.modal.run';
```

---

### Alternative: Hugging Face Spaces (Free)

If cost is a concern, Hugging Face Spaces offers **free GPU inference** (with request queuing).

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Create new Space → **Docker** template
3. Upload a `Dockerfile` and `app.py` (your FastAPI backend)
4. Select **GPU (T4-small)** hardware
5. Your permanent URL: `https://huggingface.co/spaces/username/voiceaid-health`

> ⚠️ Free GPU spaces go to sleep after inactivity and have queue limits.

---

## Summary Checklist

### App Deployment
- [ ] Create Expo account at expo.dev
- [ ] Run `eas build:configure`
- [ ] Update `app.json` with package name and version
- [ ] Build: `eas build --platform android`
- [ ] Create Google Play Developer account ($25 one-time)
- [ ] Submit: `eas submit --platform android`
- [ ] (iOS) Create Apple Developer account ($99/year)
- [ ] Build + submit iOS: `eas build --platform ios && eas submit --platform ios`

### Backend Deployment
- [ ] Create Modal account at modal.com
- [ ] Install Modal: `pip install modal && modal token new`
- [ ] Create `modal_backend.py` with your FastAPI code
- [ ] Deploy: `modal deploy modal_backend.py`
- [ ] Copy the permanent Modal URL into `constants/config.ts`
- [ ] Rebuild the app with the permanent URL (`eas build`)

> [!IMPORTANT]
> Before submitting to any app store, make sure `API_BASE_URL` in `constants/config.ts`
> points to your **permanent backend URL** (Modal/HuggingFace), NOT a Cloudflare tunnel URL.
> Cloudflare tunnel URLs expire with every Colab session.
