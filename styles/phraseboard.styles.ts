import { StyleSheet } from 'react-native';

export const phraseboardStyles = StyleSheet.create({
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

    // Tabs
    tabContainer: { marginVertical: 15, height: 45 },
    tabsScroll: { paddingHorizontal: 20, gap: 10 },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 25,
        borderWidth: 1,
        height: 40,
        justifyContent: 'center'
    },

    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 20,
        paddingBottom: 40
    },
    tile: {
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        position: 'relative',
        padding: 10
    },
    addTile: {
        borderStyle: 'dashed',
        backgroundColor: 'transparent',
        elevation: 0
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10
    },
    tileLabel: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center'
    },
    ttsIcon: {
        position: 'absolute',
        top: 10,
        right: 10
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        borderRadius: 16,
        padding: 20,
        elevation: 5
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    label: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20
    },
    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    menuButton: {
        position: 'absolute',
        top: 8,
        left: 8,
        padding: 4,
        zIndex: 10,
    },
});
