/**
 * Login Screen
 * 
 * Beautiful login screen with Google OAuth.
 */

import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

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
        <View className="flex-1 bg-slate-900">
            {/* Background gradient */}
            <LinearGradient
                colors={['#1e3a8a', '#0f172a']}
                className="absolute inset-0"
            />

            {/* Content */}
            <View className="flex-1 items-center justify-center px-8">
                {/* Logo and branding */}
                <View className="items-center mb-12">
                    <View className="w-20 h-20 bg-blue-600 rounded-2xl items-center justify-center mb-6">
                        <Text className="text-4xl font-bold text-white">T</Text>
                    </View>
                    <Text className="text-4xl font-bold text-white mb-2">Twealth</Text>
                    <Text className="text-lg text-slate-400 text-center">
                        Your AI-Powered{'\n'}Personal Finance Coach
                    </Text>
                </View>

                {/* Features */}
                <View className="mb-12 w-full">
                    {[
                        '🤖 CFP®-level AI Financial Advice',
                        '📊 4-Pillar Financial Score',
                        '🎯 Smart Goal Tracking',
                        '💰 Net Worth Analytics',
                    ].map((feature, index) => (
                        <View key={index} className="flex-row items-center py-2">
                            <Text className="text-base text-slate-300">{feature}</Text>
                        </View>
                    ))}
                </View>

                {/* Sign in button */}
                <TouchableOpacity
                    onPress={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full bg-white rounded-xl py-4 flex-row items-center justify-center shadow-lg"
                    style={{ opacity: isLoading ? 0.7 : 1 }}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#1e3a8a" />
                    ) : (
                        <>
                            <Image
                                source={{ uri: 'https://www.google.com/favicon.ico' }}
                                className="w-6 h-6 mr-3"
                            />
                            <Text className="text-lg font-semibold text-slate-800">
                                Continue with Google
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Terms */}
                <Text className="text-xs text-slate-500 text-center mt-6 px-4">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </Text>
            </View>
        </View>
    );
}
