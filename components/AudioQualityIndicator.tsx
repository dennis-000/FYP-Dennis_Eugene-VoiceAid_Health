/**
 * Audio Quality Indicator Component
 * Provides real-time visual feedback about recording quality
 */

import { AlertTriangle, Check, Mic, Volume2 } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AudioQualityIndicatorProps {
    averageLevel: number; // -160 to 0 dB
    peakLevel: number;
    isTooQuiet: boolean;
    isTooLoud: boolean;
    hasConsistentInput: boolean;
    isRecording: boolean;
}

export default function AudioQualityIndicator({
    averageLevel,
    peakLevel,
    isTooQuiet,
    isTooLoud,
    hasConsistentInput,
    isRecording,
}: AudioQualityIndicatorProps) {
    if (!isRecording) return null;

    // Determine status color and icon
    let statusColor = '#10B981'; // Green - good
    let statusText = 'Good Quality';
    let StatusIcon = Check;

    if (isTooQuiet || isTooLoud || !hasConsistentInput) {
        statusColor = '#F59E0B'; // Amber - warning
        statusText = 'Audio Quality Issue';
        StatusIcon = AlertTriangle;
    }

    if (isTooQuiet) {
        statusText = 'Too Quiet';
    } else if (isTooLoud) {
        statusText = 'Too Loud';
    } else if (!hasConsistentInput) {
        statusText = 'Background Noise';
    }

    // Convert dB to visual level (0-100)
    const visualLevel = Math.round(((averageLevel + 160) / 160) * 100);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <StatusIcon size={14} color={statusColor} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                    {statusText}
                </Text>
            </View>

            {/* Level Meter */}
            <View style={styles.levelContainer}>
                <Mic size={12} color="#64748B" />
                <View style={styles.levelTrack}>
                    <View
                        style={[
                            styles.levelFill,
                            {
                                width: `${Math.min(100, Math.max(0, visualLevel))}%`,
                                backgroundColor: statusColor
                            }
                        ]}
                    />
                </View>
                <Volume2 size={12} color="#64748B" />
            </View>

            {/* Detailed feedback */}
            {(isTooQuiet || isTooLoud || !hasConsistentInput) && (
                <Text style={styles.feedbackText}>
                    {isTooQuiet && "Speak louder or move closer to mic"}
                    {isTooLoud && "Reduce volume or move back from mic"}
                    {!hasConsistentInput && !isTooQuiet && !isTooLoud && "Try to minimize background noise"}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    levelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    levelTrack: {
        flex: 1,
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    levelFill: {
        height: '100%',
        borderRadius: 3,
    },
    feedbackText: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 6,
        fontWeight: '500',
    },
});
