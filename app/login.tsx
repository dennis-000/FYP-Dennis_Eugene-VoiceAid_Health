import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Building2, AlertCircle, CheckCircle } from 'lucide-react-native';
import React, { useContext, useState, useRef } from 'react';
import {
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRole } from '../contexts/RoleContext';
import { supabase } from '../lib/supabase';
import { validateOrganizationCode } from '../services/organizationService';
import { createTherapistProfile } from '../services/profileService';

import { AppContext } from './_layout';
import { useT } from '../utils/i18n';

export default function LoginScreen() {
    const router = useRouter();
    const { colors, language } = useContext(AppContext);
    const { setRole } = useRole();
    const tr = useT(language as any);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [organizationCode, setOrganizationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    // Show/hide password state
    const [showPassword, setShowPassword] = useState(false);

    // Input validation states
    const [emailTouched, setEmailTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [nameTouched, setNameTouched] = useState(false);

    // Refs for focusing next input
    const passwordRef = useRef<TextInput>(null);
    const nameRef = useRef<TextInput>(null);
    const orgCodeRef = useRef<TextInput>(null);

    // Fade animation for mode switch
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // ── Validation helpers ──
    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    const isValidPassword = (p: string) => p.length >= 6;
    const emailError = emailTouched && email.length > 0 && !isValidEmail(email);
    const passwordError = passwordTouched && password.length > 0 && !isValidPassword(password);
    const nameError = nameTouched && isSignUp && fullName.trim().length === 0;

    const canSubmit = isValidEmail(email) && isValidPassword(password) &&
        (!isSignUp || (fullName.trim().length > 0 && organizationCode.trim().length > 0));

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
            Alert.alert(tr('loginFailed'), error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        // Validation
        if (!fullName.trim()) {
            Alert.alert(tr('error'), tr('fullNamePlaceholder'));
            return;
        }
        if (!organizationCode.trim()) {
            Alert.alert(tr('error'), tr('orgCodePlaceholder'));
            return;
        }

        setLoading(true);
        try {
            // Validate organization code
            const organization = await validateOrganizationCode(organizationCode);
            if (!organization) {
                Alert.alert(tr('invalidOrgCode'), tr('orgCodeInvalidSub'));
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
            Alert.alert(tr('accountCreated'), `${tr('welcomeToVA')}\n\nOrganization: ${organization.name}`);

            // Navigate to home (caregiver dashboard)
            router.replace('/');
        } catch (error: any) {
            Alert.alert(tr('signUpFailed'), error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMode = () => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0.3, duration: 120, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
        setIsSignUp(!isSignUp);
        // Reset validation touches
        setEmailTouched(false);
        setPasswordTouched(false);
        setNameTouched(false);
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* Top back button */}
                <TouchableOpacity onPress={handleBack} style={styles.topBackBtn}>
                    <ArrowLeft size={22} color={colors.text} />
                    <Text style={[styles.topBackText, { color: colors.subText }]}>{tr('backToApp')}</Text>
                </TouchableOpacity>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                        {/* Header / Logo Area */}
                        <View style={styles.header}>
                            <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary + '15' }]}>
                                <Text style={[styles.logoText, { color: colors.primary }]}>VA</Text>
                            </View>
                            <Text style={[styles.title, { color: colors.text }]}>
                                {isSignUp ? tr('createAccount') : 'VoiceAid Health'}
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.subText }]}>
                                {isSignUp ? tr('therapistSubtitle') : tr('therapistSubtitle')}
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Email */}
                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: colors.text }]}>{tr('emailLabel')}</Text>
                                <View style={[
                                    styles.inputWrapper,
                                    { backgroundColor: colors.card, borderColor: emailError ? '#EF4444' : colors.border }
                                ]}>
                                    <Mail size={18} color={emailError ? '#EF4444' : colors.subText} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        placeholder={tr('emailPlaceholder')}
                                        placeholderTextColor={colors.subText}
                                        value={email}
                                        onChangeText={setEmail}
                                        onBlur={() => setEmailTouched(true)}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        textContentType="emailAddress"
                                        autoComplete="email"
                                        returnKeyType="next"
                                        onSubmitEditing={() => passwordRef.current?.focus()}
                                    />
                                    {emailTouched && email.length > 0 && (
                                        isValidEmail(email)
                                            ? <CheckCircle size={18} color="#10B981" />
                                            : <AlertCircle size={18} color="#EF4444" />
                                    )}
                                </View>
                                {emailError && (
                                    <Text style={styles.errorText}>Please enter a valid email address</Text>
                                )}
                            </View>

                            {/* Password */}
                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: colors.text }]}>{tr('passwordLabel')}</Text>
                                <View style={[
                                    styles.inputWrapper,
                                    { backgroundColor: colors.card, borderColor: passwordError ? '#EF4444' : colors.border }
                                ]}>
                                    <Lock size={18} color={passwordError ? '#EF4444' : colors.subText} style={styles.inputIcon} />
                                    <TextInput
                                        ref={passwordRef}
                                        style={[styles.input, { color: colors.text }]}
                                        placeholder={tr('passwordPlaceholder')}
                                        placeholderTextColor={colors.subText}
                                        value={password}
                                        onChangeText={setPassword}
                                        onBlur={() => setPasswordTouched(true)}
                                        secureTextEntry={!showPassword}
                                        textContentType={isSignUp ? "newPassword" : "password"}
                                        autoComplete={isSignUp ? "password-new" : "password"}
                                        returnKeyType={isSignUp ? "next" : "done"}
                                        onSubmitEditing={() => isSignUp ? nameRef.current?.focus() : handleEmailLogin()}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeButton}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        {showPassword
                                            ? <EyeOff size={20} color={colors.subText} />
                                            : <Eye size={20} color={colors.subText} />
                                        }
                                    </TouchableOpacity>
                                </View>
                                {passwordError && (
                                    <Text style={styles.errorText}>Password must be at least 6 characters</Text>
                                )}
                                {/* Password strength indicator for sign up */}
                                {isSignUp && password.length > 0 && (
                                    <View style={styles.strengthContainer}>
                                        <View style={styles.strengthBar}>
                                            <View style={[
                                                styles.strengthFill,
                                                {
                                                    width: password.length < 6 ? '30%' : password.length < 10 ? '65%' : '100%',
                                                    backgroundColor: password.length < 6 ? '#EF4444' : password.length < 10 ? '#F59E0B' : '#10B981',
                                                }
                                            ]} />
                                        </View>
                                        <Text style={[styles.strengthText, {
                                            color: password.length < 6 ? '#EF4444' : password.length < 10 ? '#F59E0B' : '#10B981',
                                        }]}>
                                            {password.length < 6 ? 'Weak' : password.length < 10 ? 'Good' : 'Strong'}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Additional fields for sign up */}
                            {isSignUp && (
                                <>
                                    <View style={styles.inputContainer}>
                                        <Text style={[styles.label, { color: colors.text }]}>{tr('fullNameLabel')}</Text>
                                        <View style={[
                                            styles.inputWrapper,
                                            { backgroundColor: colors.card, borderColor: nameError ? '#EF4444' : colors.border }
                                        ]}>
                                            <User size={18} color={nameError ? '#EF4444' : colors.subText} style={styles.inputIcon} />
                                            <TextInput
                                                ref={nameRef}
                                                style={[styles.input, { color: colors.text }]}
                                                placeholder={tr('fullNamePlaceholder')}
                                                placeholderTextColor={colors.subText}
                                                value={fullName}
                                                onChangeText={setFullName}
                                                onBlur={() => setNameTouched(true)}
                                                autoCapitalize="words"
                                                textContentType="name"
                                                autoComplete="name"
                                                returnKeyType="next"
                                                onSubmitEditing={() => orgCodeRef.current?.focus()}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={[styles.label, { color: colors.text }]}>{tr('therapistInviteCode')}</Text>
                                        <View style={[
                                            styles.inputWrapper,
                                            { backgroundColor: colors.card, borderColor: colors.border }
                                        ]}>
                                            <Building2 size={18} color={colors.subText} style={styles.inputIcon} />
                                            <TextInput
                                                ref={orgCodeRef}
                                                style={[styles.input, { color: colors.text }]}
                                                placeholder={tr('orgCodePlaceholder')}
                                                placeholderTextColor={colors.subText}
                                                value={organizationCode}
                                                onChangeText={setOrganizationCode}
                                                autoCapitalize="characters"
                                                returnKeyType="done"
                                                onSubmitEditing={handleSignUp}
                                            />
                                        </View>
                                        <Text style={[styles.helperText, { color: colors.subText }]}>
                                            {tr('orgCodeHelper')}
                                        </Text>
                                    </View>
                                </>
                            )}

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[
                                    styles.primaryButton,
                                    { backgroundColor: canSubmit ? colors.primary : colors.primary + '60' },
                                ]}
                                onPress={isSignUp ? handleSignUp : handleEmailLogin}
                                disabled={loading || !canSubmit}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>
                                        {isSignUp ? tr('createAccount') : tr('signIn')}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Mode Switch */}
                            <TouchableOpacity onPress={handleToggleMode} style={styles.switchButton}>
                                <Text style={[styles.switchText, { color: colors.subText }]}>
                                    {isSignUp ? tr('alreadyHaveAccount') : tr('newHere')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    topBackText: {
        fontSize: 15,
        fontWeight: '500',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        paddingHorizontal: 28,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'flex-start',
        marginBottom: 36,
    },
    logoPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -1,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
    },
    form: {
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 18,
    },
    label: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        fontWeight: '700',
        marginBottom: 8,
        opacity: 0.6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 54,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        height: '100%',
    },
    eyeButton: {
        padding: 4,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '500',
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 10,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    helperText: {
        fontSize: 12,
        marginTop: 8,
        fontStyle: 'italic',
        opacity: 0.6,
        marginLeft: 4,
    },
    primaryButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    switchButton: {
        alignItems: 'center',
        marginTop: 20,
        padding: 12,
    },
    switchText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
