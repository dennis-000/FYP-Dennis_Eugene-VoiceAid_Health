import { ChevronRight } from 'lucide-react-native';
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
                    borderColor: colors.border,
                }
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={[styles.iconContainer, { backgroundColor: themeColor + '15' }]}>
                <Icon size={32} color={themeColor} strokeWidth={2.5} />
            </View>
            <View style={styles.buttonTextContainer}>
                <Text style={[styles.roleTitle, { color: colors.text }]}>
                    {title}
                </Text>
                <Text style={[styles.roleDescription, { color: colors.subText }]}>
                    {description}
                </Text>
            </View>
            <ChevronRight size={20} color={colors.subText} style={{ opacity: 0.5 }} />
        </TouchableOpacity>
    );
};
