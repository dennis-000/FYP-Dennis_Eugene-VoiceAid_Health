import { StyleSheet } from 'react-native';

export const transcriptStyles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    backBtn: { padding: 5 },
    centerContent: {
        flexGrow: 1,
        alignItems: 'center',
        padding: 20
    },
    langBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20
    },
    transcriptionBox: {
        width: '100%',
        minHeight: 180,
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    transcriptText: {
        fontSize: 22,
        textAlign: 'center',
        lineHeight: 32,
        fontWeight: '500',
        marginBottom: 10
    },

    // Intent & Suggestions
    intentBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 15
    },
    intentText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        elevation: 1,
    },

    // Mic
    micCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },

    // Text Input for editing
    transcriptTextInput: {
        fontSize: 22,
        textAlign: 'left',
        lineHeight: 32,
        fontWeight: '500',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        minHeight: 100,
        marginBottom: 10,
    },

    // Helper Banner
    helperBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 20,
        marginTop: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    helperTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    helperText: {
        fontSize: 14,
        lineHeight: 20,
    },
});
