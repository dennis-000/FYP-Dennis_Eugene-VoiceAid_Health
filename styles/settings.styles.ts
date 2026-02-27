import { StyleSheet } from 'react-native';

export const settingsStyles = StyleSheet.create({
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

    // Section Styles
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 4,
        marginTop: 10,
        letterSpacing: 1
    },
    section: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
        overflow: 'hidden'
    },

    // Row Styles
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500'
    },
    settingSub: {
        fontSize: 13,
        marginTop: 2
    }
});
