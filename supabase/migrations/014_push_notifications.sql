-- Migration 014: Background Push Notifications
-- This enables real mobile push notifications when the app is closed

-- 1. Enable pg_net extension for outgoing HTTP requests (to call Expo/FCM)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create table for storing therapist push tokens
CREATE TABLE IF NOT EXISTS therapist_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID REFERENCES therapist_profiles(id) ON DELETE CASCADE,
    push_token TEXT NOT NULL,
    device_type TEXT, -- 'ios' | 'android'
    last_updated TIMESTAMPTZ DEFAULT now(),
    UNIQUE(therapist_id, push_token)
);

-- Enable RLS
ALTER TABLE therapist_push_tokens ENABLE ROW LEVEL SECURITY;

-- Allow the trigger (running as postgres superuser via SECURITY DEFINER) to read tokens
DROP POLICY IF EXISTS "Service can read all tokens" ON therapist_push_tokens;
CREATE POLICY "Service can read all tokens"
    ON therapist_push_tokens FOR SELECT
    USING (true);

-- 3. Create Function to send push via Expo API
-- SECURITY DEFINER: runs as the function owner (postgres), bypassing RLS
CREATE OR REPLACE FUNCTION notify_therapist_of_emergency()
RETURNS TRIGGER AS $$
DECLARE
    t_push_token TEXT;
    t_patient_name TEXT;
    t_therapist_id UUID;
    t_token_count INT;
BEGIN
    -- Only trigger for Clinical Priority Alerts
    IF NEW.mode = 'CLINICAL_PRIORITY' THEN
        
        -- Find the therapist associated with this patient
        SELECT pp.therapist_id, pp.full_name INTO t_therapist_id, t_patient_name
        FROM patient_profiles pp
        WHERE pp.id = NEW.patient_profile_id;

        RAISE NOTICE '[PushNotification] Patient: %, Therapist ID: %', t_patient_name, t_therapist_id;

        -- Count available tokens for debugging
        SELECT COUNT(*) INTO t_token_count 
        FROM therapist_push_tokens 
        WHERE therapist_id = t_therapist_id;
        
        RAISE NOTICE '[PushNotification] Found % push token(s) for therapist', t_token_count;

        -- Get the push token(s) for that therapist
        FOR t_push_token IN 
            SELECT push_token FROM therapist_push_tokens WHERE therapist_id = t_therapist_id
        LOOP
            RAISE NOTICE '[PushNotification] Sending to token: %', LEFT(t_push_token, 20);
            
            -- Call Expo Push API (pg_net signature: url, body jsonb, params jsonb, headers jsonb)
            PERFORM net.http_post(
                url := 'https://exp.host/--/api/v2/push/send',
                body := json_build_object(
                    'to', t_push_token,
                    'title', '🚨 CLINICAL PRIORITY ALERT',
                    'body', 'Patient ' || COALESCE(t_patient_name, 'Unknown') || ' has triggered an emergency alert!',
                    'data', json_build_object(
                        'patient_id', NEW.patient_profile_id,
                        'type', 'CLINICAL_PRIORITY',
                        'latitude', NEW.metadata->>'latitude',
                        'longitude', NEW.metadata->>'longitude'
                    ),
                    'sound', 'default',
                    'priority', 'high',
                    'channelId', 'default'
                )::jsonb,
                headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-create the Trigger
DROP TRIGGER IF EXISTS on_clinical_alert ON patient_analytics;
CREATE TRIGGER on_clinical_alert
    AFTER INSERT ON patient_analytics
    FOR EACH ROW
    EXECUTE FUNCTION notify_therapist_of_emergency();

COMMENT ON TABLE therapist_push_tokens IS 'Stores Expo Push Tokens for therapists to receive background emergency alerts';
