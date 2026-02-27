import { Redirect } from 'expo-router';
import { useRole } from '../contexts/RoleContext';

export default function Index() {
    const { role, patientType } = useRole();

    // If no role selected, go to welcome
    if (!role) {
        return <Redirect href="/welcome" />;
    }

    // If patient but no patient type selected, go to patient setup
    if (role === 'patient' && !patientType) {
        return <Redirect href="/patient-setup" />;
    }

    // Both patients and caregivers go to home screen
    // Home screen will show the appropriate dashboard based on role
    return <Redirect href="/home" />;
}
