import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRole } from '../contexts/RoleContext';
import { supabase } from '../lib/supabase';
import { validateOrganizationCode } from '../services/organizationService';
import { createTherapistProfile } from '../services/profileService';

export default function LoginScreen() {
    const router = useRouter();
    const { setRole } = useRole();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [organizationCode, setOrganizationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleEmailLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Set caregiver role after successful authentication
            await setRole('caregiver');

            // Navigate to home (caregiver dashboard)
            router.replace('/');
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        // Validation
        if (!fullName.trim()) {
            Alert.alert('Error', 'Please enter your full name');
            return;
        }
        if (!organizationCode.trim()) {
            Alert.alert('Error', 'Please enter your organization code');
            return;
        }

        setLoading(true);
        try {
            // Validate organization code
            const organization = await validateOrganizationCode(organizationCode);
            if (!organization) {
                Alert.alert('Invalid Organization Code', 'The organization code you entered is not valid or inactive. Please check with your administrator.');
                setLoading(false);
                return;
            }

            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        user_type: 'therapist',
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('User creation failed');

            // Create therapist profile in database
            const profile = await createTherapistProfile(
                authData.user.id,
                email,
                fullName,
                organization.id,
                organization.organization_code,
                organization.name
            );

            if (!profile) {
                console.error('Failed to create therapist profile');
            }

            // Set caregiver role after successful signup
            await setRole('caregiver');

            Alert.alert('Account Created', `Welcome to VoiceAid Health!\n\nOrganization: ${organization.name}`);

            // Navigate to home (caregiver dashboard)
            router.replace('/');
        } catch (error: any) {
            Alert.alert('Sign Up Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header / Logo Area */}
                <View style={styles.header}>
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>VA</Text>
                    </View>
                    <Text style={styles.title}>VoiceAid Health</Text>
                    <Text style={styles.subtitle}>For Therapists & Healthcare Professionals</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={true}
                        />
                    </View>

                    {/* Additional fields for sign up */}
                    {isSignUp && (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    autoCapitalize="words"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Organization Code</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., GH-KATH-2024"
                                    value={organizationCode}
                                    onChangeText={setOrganizationCode}
                                    autoCapitalize="characters"
                                />
                                <Text style={styles.helperText}>
                                    Contact your administrator for your organization code
                                </Text>
                            </View>
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={isSignUp ? handleSignUp : handleEmailLogin}
                        disabled={loading}
                    >
                        <Text style={styles.primaryButtonText}>
                            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.switchButton}>
                        <Text style={styles.switchText}>
                            {isSignUp ? 'Already have an account? Sign In' : 'New here? Create Account'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                >
                    <Text style={styles.backButtonText}>← Back to App</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoText: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
    form: {
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#374151',
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#F9FAFB',
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 6,
        fontStyle: 'italic',
    },
    primaryButton: {
        backgroundColor: '#4F46E5',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        elevation: 2,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    secondaryButton: {
        padding: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    secondaryButtonText: {
        color: '#4F46E5',
        fontSize: 16,
        fontWeight: '600',
    },
    switchButton: {
        alignItems: 'center',
        marginTop: 16,
    },
    switchText: {
        color: '#2563EB',
        fontSize: 14,
    },
    backButton: {
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    backButtonText: {
        color: '#6B7280',
        fontSize: 16,
    },
});
