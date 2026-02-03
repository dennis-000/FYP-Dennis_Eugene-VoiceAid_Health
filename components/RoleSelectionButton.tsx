import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { welcomeStyles as styles } from '../styles/welcome.styles';

interface RoleSelectionButtonProps {
    role: 'patient' | 'caregiver';
    icon: React.ComponentType<any>;
    title: string;
    description: string;
    themeColor: string;
    onPress: () => void;
    colors: any;
}

export const RoleSelectionButton: React.FC<RoleSelectionButtonProps> = ({
    role,
    icon: Icon,
    title,
    description,
    themeColor,
    onPress,
    colors
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.roleButton,
                role === 'patient' ? styles.patientButton : styles.caregiverButton,
                {
                    backgroundColor: colors.card,
                    borderColor: themeColor,
                }
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={[styles.iconContainer, { backgroundColor: themeColor }]}>
                <Icon size={48} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <View style={styles.buttonTextContainer}>
                <Text style={[styles.roleTitle, { color: colors.text }]}>
                    {title}
                </Text>
                <Text style={[styles.roleDescription, { color: colors.subText }]}>
                    {description}
                </Text>
            </View>
            <View style={[styles.arrow, { borderLeftColor: themeColor }]} />
        </TouchableOpacity>
    );
};
