# VoiceAid Admin Dashboard

Web-based admin dashboard for managing VoiceAid Health organizations, therapists, and patients.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase URL and anon key (same as mobile app)

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Navigate to `http://localhost:3001`

## Features

- **Dashboard**: Overview with statistics
- **Organizations**: Create and manage organizations with unique codes
- **Therapists**: View all therapists and their assignments
- **Patients**: View all patients in the system
- **Authentication**: Admin-only access with role verification

## Creating a Super Admin

To create your first super admin user:

1. Sign up a user in Supabase Auth
2. Insert a record in the `admin_users` table:
   ```sql
   INSERT INTO admin_users (user_id, email, full_name, role)
   VALUES ('user-id-from-auth', 'admin@example.com', 'Admin Name', 'super_admin');
   ```

## Deployment

Deploy to Vercel:
```bash
vercel
```

Or any other hosting platform that supports Next.js.
