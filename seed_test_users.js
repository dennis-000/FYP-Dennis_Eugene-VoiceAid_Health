require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Supabase environment variables are missing.");
  console.error("Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY exist in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEST_PATIENTS = [
  {
    name: "Kwabena Mensah",
    code: "PAT-1001",
    type: "hospital",
    condition: "Post-Stroke Dysarthria",
    moods: [2, 1, 2], // Frustrated/Sad
    journals: [
      { transcript: "Me yare pa ara. me ti nipa dua yi nyinaa eyaw. me te sɛ nea ɔkwan no ware pii, kasa yɛ den ndɛ.", wpm: 38, clarity: 60, daysAgo: 0 },
      { transcript: "Kasa yɛ den. M'ano mu yɛ duru. Nanso me pɛ sɛ me kasa.", wpm: 30, clarity: 55, daysAgo: 1 },
      { transcript: "Me ti eyaw nne. Me pɛ aduane ne nsuo kakra.", wpm: 45, clarity: 65, daysAgo: 2 }
    ],
    exercises: [
      { text: "Kofi", language: "twi", daysAgo: 0 },
      { text: "Ama", language: "twi", daysAgo: 1 },
      { text: "Medaase", language: "twi", daysAgo: 2 }
    ],
    goals: [
      { title: "Vocal play 'Ah'", description: "Practice holding 'Ah' sound for 5 seconds to build vocal strength.", category: "voice", completed: false, requires_recording: true },
      { title: "Medaase (Twi drill)", description: "Practice saying Medaase clearly with Whisper feedback.", category: "speech_sound", completed: true, voice_transcript: "Medaase pa ara" }
    ]
  },
  {
    name: "Abena Osei",
    code: "PAT-1002",
    type: "hospital",
    condition: "Aphasia (Word Retrieval)",
    moods: [2, 3, 2], // Low mood/struggle
    journals: [
      { transcript: "Yesterday... i forgot... name of my sister... it hurts... i want to talk, but words are gone... frustration.", wpm: 25, clarity: 70, daysAgo: 0 },
      { transcript: "Today is okay. But... word retrieval... is slow. Still trying.", wpm: 32, clarity: 75, daysAgo: 1 },
      { transcript: "Forgot... my keys name... struggled to explain to husband.", wpm: 22, clarity: 68, daysAgo: 2 }
    ],
    exercises: [
      { text: "Book", language: "en", daysAgo: 0 },
      { text: "Pen", language: "en", daysAgo: 1 },
      { text: "Water", language: "en", daysAgo: 2 }
    ],
    goals: [
      { title: "Object naming drill", description: "Name 5 household items slowly to practice word retrieval.", category: "language", completed: false, requires_recording: true },
      { title: "Simple descriptions", description: "Describe a cup in 3 words.", category: "communication", completed: true, voice_transcript: "drink coffee hot" }
    ]
  },
  {
    name: "Kofi Ansah",
    code: "PAT-1003",
    type: "hospital",
    condition: "Spastic Dysarthria (High Progress)",
    moods: [5, 4, 5], // Highly positive
    journals: [
      { transcript: "I walked today. Speech is feeling clearer. Medaase pii for the exercises, I am practicing every morning.", wpm: 72, clarity: 85, daysAgo: 0 },
      { transcript: "Exercises completed. Metee me nne nne. Clarity is going up.", wpm: 68, clarity: 82, daysAgo: 1 },
      { transcript: "Had a great talk with my children. They understood everything I said.", wpm: 75, clarity: 88, daysAgo: 2 }
    ],
    exercises: [
      { text: "Medaase pii", language: "twi", daysAgo: 0 },
      { text: "Ɛyɛ me dɛ", language: "twi", daysAgo: 1 },
      { text: "Ɔyarefoɔ no resɔre", language: "twi", daysAgo: 2 }
    ],
    goals: [
      { title: "Paced speech sentences", description: "Read a short sentence with distinct pauses between words.", category: "fluency", completed: false, requires_recording: true },
      { title: "Volume exercise", description: "Say 'Kofi resɔre' at conversation volume.", category: "voice", completed: true, voice_transcript: "Kofi resɔre" }
    ]
  },
  {
    name: "Naa Koshie",
    code: "PAT-1004",
    type: "hospital",
    condition: "Hypophonia (breathy speech / Ga)",
    moods: [2, 3, 2], // Low voice volume
    journals: [
      { transcript: "Minyelee wiemɔ jogbaŋŋ. Ehe ehe wale, miye hejɔlɛ gbi nɛ.", wpm: 40, clarity: 68, daysAgo: 0 },
      { transcript: "Gbi nɛ wiemɔ ji gbɛnyo. Miheɔ wiemɔ kɛ jaje.", wpm: 35, clarity: 62, daysAgo: 1 },
      { transcript: "My voice... so quiet. Family keeps... asking me to repeat.", wpm: 28, clarity: 70, daysAgo: 2 }
    ],
    exercises: [
      { text: "Ehe wale", language: "ga", daysAgo: 0 },
      { text: "Wiemɔi", language: "ga", daysAgo: 1 },
      { text: "Oyiwaladon", language: "ga", daysAgo: 2 }
    ],
    goals: [
      { title: "Ga articulation practice", description: "Say 'Oyiwaladon' clearly to Whispering feedback.", category: "speech_sound", completed: false, requires_recording: true },
      { title: "Sustained phonation", description: "Hold 'Ooo' sound loudly for 6 seconds.", category: "voice", completed: true, voice_transcript: "Oooooo" }
    ]
  },
  {
    name: "Yaw Boateng",
    code: "PAT-1005",
    type: "hospital",
    condition: "Fluency (Cluttering & Stuttering)",
    moods: [2, 2, 3], // Anxious
    journals: [
      { transcript: "I st-st-struggled in the market today... everyone was staring... i felt so anxious... wanted to hide.", wpm: 55, clarity: 72, daysAgo: 0 },
      { transcript: "Slow speech is hard... but keeping... my breathing... steady. Helps a bit.", wpm: 50, clarity: 76, daysAgo: 1 },
      { transcript: "Stuttering blocks are... heavy... when I get excited or rushed.", wpm: 48, clarity: 70, daysAgo: 2 }
    ],
    exercises: [
      { text: "Slow and steady breath", language: "en", daysAgo: 0 },
      { text: "Calm lake", language: "en", daysAgo: 1 },
      { text: "Peaceful morning", language: "en", daysAgo: 2 }
    ],
    goals: [
      { title: "Easy onset words", description: "Practice speaking words beginning with vowel sounds smoothly.", category: "fluency", completed: false, requires_recording: true },
      { title: "Phonated breathing", description: "Exhale with a gentle hum to relax vocal folds.", category: "voice", completed: true, voice_transcript: "Mmmmmm" }
    ]
  }
];

async function seed() {
  console.log("==========================================");
  console.log("VOICEAID HEALTH - SEED TEST USERS");
  console.log("==========================================");

  // 1. Get first therapist
  const { data: therapists, error: tErr } = await supabase
    .from('therapist_profiles')
    .select('id, user_id, full_name, assigned_patients')
    .limit(1);

  if (tErr) {
    console.error("❌ Error fetching therapist from database:", tErr);
    process.exit(1);
  }

  if (!therapists || therapists.length === 0) {
    console.error("❌ No therapist profiles found in the database!");
    console.error("Please sign up as a therapist/caregiver via the Admin Dashboard web interface first.");
    process.exit(1);
  }

  const therapist = therapists[0];
  console.log(`✅ Using active Therapist: "${therapist.full_name}" (ID: ${therapist.id})`);

  // 2. Clear old test patients
  console.log("\n🧹 Cleaning up any old test patient profiles...");
  const names = TEST_PATIENTS.map(p => p.name);
  const { data: existingPatients } = await supabase
    .from('patient_profiles')
    .select('id')
    .in('full_name', names);

  if (existingPatients && existingPatients.length > 0) {
    const pIds = existingPatients.map(p => p.id);
    
    // Delete cascading references
    await supabase.from('mood_logs').delete().in('patient_id', pIds);
    await supabase.from('voice_journals').delete().in('patient_id', pIds);
    await supabase.from('patient_goals').delete().in('patient_id', pIds);
    await supabase.from('transcriptions').delete().in('patient_profile_id', pIds);
    
    const { error: delErr } = await supabase
      .from('patient_profiles')
      .delete()
      .in('id', pIds);

    if (delErr) {
      console.warn("⚠️ Warning clearing patient profiles:", delErr.message);
    } else {
      console.log(`✅ Cleared ${pIds.length} old test profiles.`);
    }
  }

  const seededIds = [];

  // 3. Create patients
  for (const tPat of TEST_PATIENTS) {
    console.log(`\n👤 Creating Patient: "${tPat.name}" (${tPat.code})`);
    
    // Create profile
    const { data: patient, error: pErr } = await supabase
      .from('patient_profiles')
      .insert({
        full_name: tPat.name,
        patient_code: tPat.code,
        patient_type: tPat.type,
        therapist_id: therapist.id,
        hospital_id: tPat.condition // Store clinical condition in hospital_id field
      })
      .select()
      .single();

    if (pErr || !patient) {
      console.error(`❌ Failed to create patient ${tPat.name}:`, pErr);
      continue;
    }

    seededIds.push(patient.id);

    // Seed mood check-ins (over the last 3 days)
    const moodInserts = tPat.moods.map((level, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - idx);
      return {
        patient_id: patient.id,
        mood_level: level,
        created_at: date.toISOString()
      };
    });
    const { error: mErr } = await supabase.from('mood_logs').insert(moodInserts);
    if (mErr) console.error("   ⚠️ Mood log insert failed:", mErr.message);
    else console.log(`   ✅ Seeded ${moodInserts.length} daily mood logs.`);

    // Seed voice journals
    const journalInserts = tPat.journals.map(j => {
      const date = new Date();
      date.setDate(date.getDate() - j.daysAgo);
      return {
        patient_id: patient.id,
        transcript: j.transcript,
        wpm: j.wpm,
        clarity_score: j.clarity,
        created_at: date.toISOString()
      };
    });
    const { error: jErr } = await supabase.from('voice_journals').insert(journalInserts);
    if (jErr) console.error("   ⚠️ Voice journals insert failed:", jErr.message);
    else console.log(`   ✅ Seeded ${journalInserts.length} voice journals.`);

    // Seed speech exercises transcriptions (recent logs)
    const exerciseInserts = tPat.exercises.map(ex => {
      const date = new Date();
      date.setDate(date.getDate() - ex.daysAgo);
      return {
        user_id: therapist.user_id,
        patient_profile_id: patient.id,
        text: ex.text,
        language: ex.language,
        confidence_score: 0.85,
        created_at: date.toISOString()
      };
    });
    const { error: exErr } = await supabase.from('transcriptions').insert(exerciseInserts);
    if (exErr) console.error("   ⚠️ Exercise transcriptions insert failed:", exErr.message);
    else console.log(`   ✅ Seeded ${exerciseInserts.length} speech exercises logs.`);

    // Seed patient goals (assignments)
    const goalInserts = tPat.goals.map(g => {
      const date = new Date();
      return {
        patient_id: patient.id,
        therapist_id: therapist.id,
        title: g.title,
        description: g.description,
        category: g.category,
        completed: g.completed,
        requires_recording: g.requires_recording,
        voice_transcript: g.voice_transcript || null,
        assigned_date: date.toISOString().split('T')[0]
      };
    });
    const { error: gErr } = await supabase.from('patient_goals').insert(goalInserts);
    if (gErr) console.error("   ⚠️ Patient goals insert failed:", gErr.message);
    else console.log(`   ✅ Seeded ${goalInserts.length} daily missions.`);
  }

  // 4. Update therapist's assigned_patients list with seeded UUIDs
  const currentAssigned = therapist.assigned_patients || [];
  const updatedAssigned = [...new Set([...currentAssigned, ...seededIds])];
  const { error: updErr } = await supabase
    .from('therapist_profiles')
    .update({ assigned_patients: updatedAssigned })
    .eq('id', therapist.id);

  if (updErr) {
    console.error("❌ Failed to update therapist assigned patients list:", updErr);
  } else {
    console.log(`\n🎉 Success! Seeded 5 detailed patient templates and assigned them to therapist "${therapist.full_name}"!`);
    console.log("\nActive Patient IDs for Testing Connection in Mobile App:");
    TEST_PATIENTS.forEach(p => {
      console.log(` - Patient: ${p.name.padEnd(20)} ID Code: ${p.code} (Condition: ${p.condition})`);
    });
  }

  process.exit(0);
}

seed();
