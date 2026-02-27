import { StyleSheet } from 'react-native';

export const routineStyles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    backBtn: { padding: 4 },
    content: { padding: 20, paddingBottom: 40 },

    // Progress Card
    progressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    progressCount: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    progressCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressPercent: {
        fontSize: 24,
        fontWeight: 'bold',
    },

    // Tasks Section
    tasksSection: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 8,
    },
    resetText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Task Card
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        marginBottom: 12,
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    checkboxArea: {
        marginRight: 12,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    taskDescription: {
        fontSize: 14,
        marginBottom: 6,
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    taskTime: {
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '600',
    },
    speakerButton: {
        padding: 8,
        marginLeft: 8,
    },

    // States
    loadingState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
    },

    // Help Card
    helpCard: {
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    helpText: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },

    // Caregiver UI
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    addButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        marginTop: 10,
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    dayButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayText: {
        fontSize: 14,
        fontWeight: 'bold',
    },

    // Patient Selector Styles
    patientScroll: {
        paddingVertical: 10,
        marginBottom: 10,
    },
    patientCard: {
        width: 100,
        height: 120,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        padding: 10,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    avatarText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    patientName: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    selectedBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#3B82F6',
        borderRadius: 10,
        padding: 2,
    },
    patientDetails: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 10,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    detailText: {
        fontSize: 14,
        marginBottom: 4,
    },
    sectionHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    subSwitchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingLeft: 10,
    },
    saveButton: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    deleteButton: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
});
