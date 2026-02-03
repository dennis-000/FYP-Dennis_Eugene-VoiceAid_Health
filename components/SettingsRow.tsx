import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { settingsStyles as styles } from '../styles/settings.styles';

interface SettingsRowProps {
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    switchValue?: boolean;
    onSwitchChange?: (val: boolean) => void;
    activeTrackColor?: string;
    rightElement?: React.ReactNode;
    showBorderTop?: boolean;

    // Theme Colors
    titleColor?: string;
    subtitleColor?: string;
    borderColor?: string;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
    icon: Icon,
    iconColor,
    iconBg,
    title,
    subtitle,
    onPress,
    switchValue,
    onSwitchChange,
    activeTrackColor,
    rightElement,
    showBorderTop = false,
    titleColor = '#000',
    subtitleColor = '#666',
    borderColor = '#E5E7EB'
}) => {
    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container
            style={[
                styles.settingRow,
                showBorderTop && { borderTopWidth: 1, borderTopColor: borderColor }
            ]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                    <Icon size={20} color={iconColor} />
                </View>
                <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.settingLabel, { color: titleColor }]}>{title}</Text>
                    {subtitle && (
                        <Text style={[styles.settingSub, { color: subtitleColor }]}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            </View>

            {onSwitchChange !== undefined ? (
                <Switch
                    value={switchValue}
                    onValueChange={onSwitchChange}
                    trackColor={{ false: '#767577', true: activeTrackColor || '#3B82F6' }}
                />
            ) : (
                rightElement
            )}
        </Container>
    );
};
