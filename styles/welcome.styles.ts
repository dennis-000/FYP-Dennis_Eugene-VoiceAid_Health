import { StyleSheet } from 'react-native';

export const welcomeStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 40,
        justifyContent: 'space-between',
    },

    // Header Section
    headerSection: {
        alignItems: 'center',
        marginTop: 20,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        textAlign: 'center',
    },

    // Selection Section
    selectionSection: {
        flex: 1,
        justifyContent: 'center',
        marginVertical: 40,
    },
    promptText: {
        fontSize: 22,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 32,
    },

    // Role Buttons
    roleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderRadius: 20,
        borderWidth: 3,
        marginBottom: 20,
        minHeight: 120,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    patientButton: {
        // Additional styling for patient button
    },
    caregiverButton: {
        // Additional styling for caregiver button
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
    },
    buttonTextContainer: {
        flex: 1,
    },
    roleTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    roleDescription: {
        fontSize: 16,
        lineHeight: 22,
    },
    arrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 12,
        borderTopWidth: 10,
        borderBottomWidth: 10,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        marginLeft: 8,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    footerText: {
        fontSize: 14,
    },
});
