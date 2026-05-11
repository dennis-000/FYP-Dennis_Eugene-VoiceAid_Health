require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function seed() {
  console.log("Starting script...");
  const { data: therapists, error: tErr } = await supabase.from('therapist_profiles').select('*').limit(1);
  if (tErr) {
    console.error("Error fetching therapist:", tErr);
    process.exit(1);
  }
  if (!therapists || therapists.length === 0) {
    console.log("No therapists found");
    return;
  }
  const therapist = therapists[0];
  console.log("Found Therapist:", therapist.full_name, "Assigned:", therapist.assigned_patients);

  let patientId = null;

  if (therapist.assigned_patients && therapist.assigned_patients.length > 0) {
    patientId = therapist.assigned_patients[0];
  } else {
    // Check if there are any patients in the DB
    const { data: patients } = await supabase.from('patient_profiles').select('*').limit(1);
    
    if (patients && patients.length > 0) {
      patientId = patients[0].user_id;
      console.log("Assigning patient", patientId, "to therapist:", therapist.full_name);
      await supabase.from('therapist_profiles').update({
        assigned_patients: [patientId]
      }).eq('id', therapist.id);
    } else {
      console.log("No patients found in DB! Cannot seed logs.");
      return;
    }
  }

  console.log("Seeding logs for Patient:", patientId);

  const dummyLogs = [
    { user_id: patientId, text: "Good morning, I need some water please.", language: "en", created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { user_id: patientId, text: "Medaase (Thank you)", language: "twi", created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { user_id: patientId, text: "Where is the doctor?", language: "en", created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
    { user_id: patientId, text: "Me yare (I am sick)", language: "twi", created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
    { user_id: patientId, text: "I feel much better today.", language: "en", created_at: new Date().toISOString() },
    { user_id: patientId, text: "Can I have some food?", language: "en", created_at: new Date().toISOString() },
  ];

  const { error } = await supabase.from('transcriptions').insert(dummyLogs);
  if (error) {
    console.error("Error inserting logs:", error);
    process.exit(1);
  } else {
    console.log("Successfully seeded 6 transcription logs for Analytics Dashboard!");
    process.exit(0);
  }
}

seed();
