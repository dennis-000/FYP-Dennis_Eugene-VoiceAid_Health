import { StyleSheet } from 'react-native';
import { createShadow } from '../utils/shadows';

export const homeStyles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderBottomWidth: 1,
        ...createShadow('#000', 0, 1, 0.05, 2, 1),
    },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    scrollContent: { paddingBottom: 40 },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginTop: 20 },

    // Cards
    card: { padding: 16, borderRadius: 12, borderWidth: 1 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    langRow: { flexDirection: 'row', gap: 10 },
    langBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },

    // Settings Link
    settingsLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 20,
        gap: 8,
    },
    settingsText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
