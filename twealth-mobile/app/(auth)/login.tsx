/**
 * Login Screen
 * 
 * Beautiful login screen with Google OAuth.
 */

import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
    const { signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1e3a8a', '#0f172a']}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>T</Text>
                    </View>
                    <Text style={styles.title}>Twealth</Text>
                    <Text style={styles.subtitle}>Your AI-Powered{'\n'}Personal Finance Coach</Text>
                </View>

                {/* Features */}
                <View style={styles.features}>
                    {[
                        '🤖 CFP®-level AI Financial Advice',
                        '📊 4-Pillar Financial Score',
                        '🎯 Smart Goal Tracking',
                        '💰 Net Worth Analytics',
                    ].map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <Text style={styles.featureText}>{feature}</Text>
                        </View>
                    ))}
                </View>

                {/* Sign in button */}
                <TouchableOpacity
                    onPress={handleGoogleSignIn}
                    disabled={isLoading}
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#1e3a8a" />
                    ) : (
                        <View style={styles.buttonContent}>
                            <Image
                                source={{ uri: 'https://www.google.com/favicon.ico' }}
                                style={styles.googleIcon}
                            />
                            <Text style={styles.buttonText}>Continue with Google</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Terms */}
                <Text style={styles.terms}>
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        width: 80,
        height: 80,
        backgroundColor: '#3b82f6',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    logoText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: 'white',
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 26,
    },
    features: {
        width: '100%',
        marginBottom: 48,
    },
    featureItem: {
        paddingVertical: 8,
    },
    featureText: {
        fontSize: 16,
        color: '#cbd5e1',
    },
    button: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    googleIcon: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    terms: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 24,
        paddingHorizontal: 16,
    },
});
