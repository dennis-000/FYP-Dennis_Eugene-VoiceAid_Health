import { Redirect } from 'expo-router';
import { useRole } from '../contexts/RoleContext';

export default function Index() {
    const { userRole } = useRole();

    // If no role selected, go to welcome
    if (!userRole) {
        return <Redirect href="/welcome" />;
    }

    // If role exists, route accordingly
    if (userRole === 'patient') {
        return <Redirect href="/phraseboard" />;
    }

    // Default to welcome for now, or caregiver dashboard if implemented
    return <Redirect href="/welcome" />;
}
