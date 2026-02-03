import { StyleSheet } from 'react-native';

export const historyStyles = StyleSheet.create({
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
    scrollContent: { padding: 20 },

    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50
    },

    // Log Item
    logItem: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    logDate: { fontSize: 12 },
    logIntent: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
    logText: { fontSize: 16, lineHeight: 22 },

    clearBtn: {
        marginRight: 0
    }
});
