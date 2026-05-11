import React, { useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity 
} from 'react-native';
import { AppContext } from '../app/_layout';

/**
 * ==========================================
 * INTERFACES
 * ==========================================
 */
interface BigButtonProps {
  onPress: () => void;
  icon: React.ElementType; // Allows passing Lucide icons directly
  label: string;
  color?: string; // Optional custom background color
  fullWidth?: boolean;
}

/**
 * ==========================================
 * COMPONENT
 * ==========================================
 */
const BigButton = ({ onPress, icon: Icon, label, color, fullWidth = false }: BigButtonProps) => {
  const { colors, themeMode } = useContext(AppContext);
  const isContrast = themeMode === 'high-contrast';

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[
        styles.bigButton, 
        { 
          backgroundColor: color || colors.card,
          borderColor: isContrast ? colors.primary : colors.border,
          borderWidth: isContrast ? 2 : 1,
          width: fullWidth ? '100%' : '48%'
        }
      ]}
      activeOpacity={0.7}
    >
      {/* Icon Circle Background */}
      <View style={[
        styles.iconContainer, 
        { backgroundColor: isContrast ? '#000' : '#EFF6FF' } // Black bg for icon in high contrast
      ]}>
        <Icon size={32} color={isContrast ? colors.primary : colors.primary} />
      </View>
      
      <Text style={[styles.buttonText, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default BigButton;

const styles = StyleSheet.create({
  bigButton: { 
    padding: 20, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12, 
    // Shadows
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  iconContainer: { 
    padding: 12, 
    borderRadius: 50, 
    marginBottom: 10 
  },
  buttonText: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});