/**
 * Haptic Feedback Utility
 * Provides haptic (vibration) feedback for key interactions.
 * Critical for accessibility — gives speech-impaired users
 * tactile confirmation of their actions.
 */

import * as Haptics from 'expo-haptics';

export const haptics = {
    /** Light tap — for selections, toggles, chip taps */
    light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),

    /** Medium tap — for button presses, recording start */
    medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),

    /** Heavy tap — for recording stop, message sent */
    heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}),

    /** Success — for completed actions, successful transcription */
    success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),

    /** Warning — for errors, connection issues */
    warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),

    /** Error — for SOS, critical failures */
    error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),

    /** Selection tick — for scrolling through lists, picker changes */
    selection: () => Haptics.selectionAsync().catch(() => {}),
};
