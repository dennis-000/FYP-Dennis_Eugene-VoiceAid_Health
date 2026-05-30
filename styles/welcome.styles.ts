import { StyleSheet } from 'react-native';
import { createShadow } from '../utils/shadows';

export const welcomeStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        paddingVertical: 48,
        justifyContent: 'space-between',
    },

    // Header Section (Asymmetrical, Left Aligned)
    headerSection: {
        alignItems: 'flex-start',
        marginTop: 24,
    },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        ...createShadow('#000', 0, 8, 0.1, 24, 4),
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 12,
        lineHeight: 42,
    },
    subtitle: {
        fontSize: 18,
        lineHeight: 28,
        fontWeight: '400',
    },

    // Selection Section
    selectionSection: {
        flex: 1,
        justifyContent: 'center',
        marginVertical: 40,
    },
    promptText: {
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontWeight: '700',
        marginBottom: 20,
        opacity: 0.6,
    },

    // Role Buttons
    roleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 16,
        minHeight: 110,
        ...createShadow('#000', 0, 12, 0.04, 16, 2),
    },
    patientButton: {},
    caregiverButton: {},
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
    },
    buttonTextContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: 8,
    },
    roleTitle: {
        fontSize: 19,
        fontWeight: '700',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    roleDescription: {
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.8,
    },
    arrow: {
        // Obsolete (replaced by Lucide Chevron)
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 20,
    },
    footerText: {
        fontSize: 13,
        fontWeight: '500',
    },
});
