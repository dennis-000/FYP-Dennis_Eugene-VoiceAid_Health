-- Migration 015: Patient Push Notifications
-- This enables push notifications for patients when a therapist assigns a task

-- 1. Create table for storing patient push tokens
CREATE TABLE IF NOT EXISTS patient_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patient_profiles(id) ON DELETE CASCADE,
    push_token TEXT NOT NULL,
    device_type TEXT, -- 'ios' | 'android'
    last_updated TIMESTAMPTZ DEFAULT now(),
    UNIQUE(patient_id, push_token)
);

-- Enable RLS
ALTER TABLE patient_push_tokens ENABLE ROW LEVEL SECURITY;

-- Allow patients to manage their own tokens
CREATE POLICY "Patients can manage own tokens"
    ON patient_push_tokens FOR ALL
    USING (
        patient_id IN (
            SELECT id FROM patient_profiles WHERE user_id = auth.uid() OR auth.uid() IS NULL
        )
    );

-- Allow therapists to read tokens of their patients
CREATE POLICY "Therapists can read patient tokens"
    ON patient_push_tokens FOR SELECT
    USING (
        patient_id IN (
            SELECT id FROM patient_profiles WHERE therapist_id IN (
                SELECT id FROM therapist_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Allow the trigger (running as postgres superuser via SECURITY DEFINER) to read tokens
DROP POLICY IF EXISTS "Service can read all patient tokens" ON patient_push_tokens;
CREATE POLICY "Service can read all patient tokens"
    ON patient_push_tokens FOR SELECT
    USING (true);

-- 2. Create Function to send push via Expo API when a goal is assigned
-- SECURITY DEFINER: runs as the function owner (postgres), bypassing RLS
CREATE OR REPLACE FUNCTION notify_patient_of_assignment()
RETURNS TRIGGER AS $$
DECLARE
    t_push_token TEXT;
    t_therapist_name TEXT;
    t_token_count INT;
BEGIN
    -- Find the therapist name who assigned the goal
    SELECT full_name INTO t_therapist_name
    FROM therapist_profiles
    WHERE id = NEW.therapist_id;

    RAISE NOTICE '[PushNotification] Goal assigned by Therapist: %, to Patient ID: %', t_therapist_name, NEW.patient_id;

    -- Count available tokens for debugging
    SELECT COUNT(*) INTO t_token_count 
    FROM patient_push_tokens 
    WHERE patient_id = NEW.patient_id;
    
    RAISE NOTICE '[PushNotification] Found % push token(s) for patient', t_token_count;

    -- Get the push token(s) for that patient
    FOR t_push_token IN 
        SELECT push_token FROM patient_push_tokens WHERE patient_id = NEW.patient_id
    LOOP
        RAISE NOTICE '[PushNotification] Sending to patient token: %', LEFT(t_push_token, 20);
        
        -- Call Expo Push API (pg_net signature: url, body jsonb, params jsonb, headers jsonb)
        PERFORM net.http_post(
            url := 'https://exp.host/--/api/v2/push/send',
            body := json_build_object(
                'to', t_push_token,
                'title', '📋 New Assignment',
                'body', COALESCE(t_therapist_name, 'Your therapist') || ' has assigned a new goal: ' || NEW.title,
                'data', json_build_object(
                    'goal_id', NEW.id,
                    'type', 'NEW_ASSIGNMENT'
                ),
                'sound', 'default',
                'priority', 'high',
                'channelId', 'default'
            )::jsonb,
            headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the Trigger on patient_goals
DROP TRIGGER IF EXISTS on_goal_assigned ON patient_goals;
CREATE TRIGGER on_goal_assigned
    AFTER INSERT ON patient_goals
    FOR EACH ROW
    EXECUTE FUNCTION notify_patient_of_assignment();

COMMENT ON TABLE patient_push_tokens IS 'Stores Expo Push Tokens for patients to receive background assignment alerts';
