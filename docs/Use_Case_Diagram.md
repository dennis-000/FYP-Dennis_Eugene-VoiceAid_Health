# VoiceAid Health — System Use Case Diagrams

This document separates the platform's features into two distinct UML Use Case diagrams to highlight user-facing client functionality vs. developer-facing administration controls.

---

## 1. Patient & Caregiver / Therapist Use Case Diagram
This diagram shows how speech-impaired patients and caregiver/therapist users interact with the mobile application and backend speech services during daily communication and therapy drills.

### Use Case Diagram (Mermaid)

```mermaid
graph TD
    %% Actors definition
    Patient((Patient))
    TherapistCaregiver((Therapist / Caregiver))

    %% Subsystem 1: Mobile Client App (Top Layer)
    subgraph MobileApp ["Mobile Patient / Caregiver App"]
        UC1("Check-in Daily Mood")
        UC2("Speak via Symbol/Phrase Board")
        UC3("Record Voice Journal")
        UC4("Trigger Emergency SOS")
        UC5("View Streaks & Badges")
        UC6("Monitor Patient Progress (Local)")
        UC15("Assign Custom Voice Board Drills")
    end

    %% Subsystem 2: FastAPI Backend Speech AI (Bottom Layer)
    subgraph BackendSpeechAI ["FastAPI & AI Services"]
        UC7("Speech-to-Text (Akan Whisper)")
        UC8("Text-to-Speech (StyleTTS2)")
        UC9("Correlate Mood & Speech Sentiment")
        UC10("Generate AI Progress Narrative")
        UC11("Recommend Clinical Exercises")
    end

    %% Patient Associations
    Patient --> UC1
    Patient --> UC2
    Patient --> UC3
    Patient --> UC4
    Patient --> UC5

    %% Therapist / Caregiver Associations
    TherapistCaregiver --> UC6
    TherapistCaregiver --> UC2
    TherapistCaregiver --> UC15

    %% Vertical Dependency Links (Flowing from Mobile App down to Backend AI)
    UC3 -.-> UC7
    UC2 -.-> UC8
    UC6 -.-> UC9
    UC6 -.-> UC10
    UC15 -.-> UC11

    %% Explicit Vertical Stack Enforcement
    MobileApp --> BackendSpeechAI
```

### Mobile Use Case Descriptions
*   **Patient Actions**: Speaks via the visual board (symbol speak), records voice diaries (transcribed by Whisper ASR), executes check-in ratings, tracks badges, and triggers SOS distress alarms.
*   **Caregiver / Therapist Actions**: Accesses the shared caregiver portal on the phone to modify phrases, track patient exercise completion levels, and assign speech cards.

---

## 2. System Admin / Developer Use Case Diagram
This diagram shows how you (the developer/sysadmin) manage the clinical infrastructure from the Next.js control center, onboarding therapy clinics, managing accounts, and auditing diagnostic records.

### Use Case Diagram (Mermaid)

```mermaid
graph TD
    %% Actors definition
    SysAdmin((System Admin / Developer))

    subgraph AdminSystemBoundary ["Developer / SysAdmin Web System Boundary"]
        subgraph WebPanel ["SysAdmin / Developer Control Panel"]
            UC12("Onboard Therapy Units (Orgs)")
            UC12_1("Onboard & Manage Therapist Accounts")
            UC13("Monitor System-Wide Registrations")
            UC14("Inspect Centralized Patient Logs")
        end

        subgraph BackendAdminAI ["FastAPI & AI Services"]
            UC7_A("Speech-to-Text (Akan Whisper)")
            UC9_A("Correlate Mood & Speech Sentiment")
            UC10_A("Generate AI Progress Narrative")
        end
    end

    %% Admin Associations
    SysAdmin --> UC12
    SysAdmin --> UC12_1
    SysAdmin --> UC13
    SysAdmin --> UC14

    %% Dependencies
    UC14 -.-> UC7_A
    UC14 -.-> UC9_A
    UC14 -.-> UC10_A

    %% Vertical layout enforcement
    WebPanel --> BackendAdminAI
```

### Administration Use Case Descriptions
*   **Onboard Therapy Units (Orgs)**: Registers hospitals, clinics, or language therapy departments into the PostgreSQL schema, creating unique invite keys.
*   **Manage Therapist Accounts**: Activates, edits, and monitors credentials of speech therapists assigned to specific onboarded organizations.
*   **Centralized Patient Log Audits**: Inspects records (transcripts, compliance counts, check-in histories, sentiment metrics) to ensure system accuracy and run diagnostics.
