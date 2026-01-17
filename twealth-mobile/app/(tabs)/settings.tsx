/**
 * Settings Screen
 * 
 * User profile and app settings.
 */

import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
    const { signOut } = useAuth();

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut },
            ]
        );
    };

    return (
        <View className="flex-1 bg-slate-900">
            <ScrollView className="flex-1">
                {/* Header */}
                <View className="px-6 pt-16 pb-6">
                    <Text className="text-2xl font-bold text-white">Settings</Text>
                </View>

                {/* Profile Section */}
                <View className="mx-6 bg-slate-800 rounded-xl overflow-hidden mb-6">
                    <TouchableOpacity className="flex-row items-center p-4 border-b border-slate-700">
                        <View className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center">
                            <Ionicons name="person" size={24} color="white" />
                        </View>
                        <View className="flex-1 ml-4">
                            <Text className="text-white font-semibold">Profile</Text>
                            <Text className="text-slate-400 text-sm">Manage your account</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>

                {/* Preferences Section */}
                <View className="mx-6 mb-6">
                    <Text className="text-slate-400 text-sm font-medium mb-3 px-1">PREFERENCES</Text>
                    <View className="bg-slate-800 rounded-xl overflow-hidden">
                        <SettingsItem icon="globe-outline" title="Country & Currency" subtitle="United States, USD" />
                        <SettingsItem icon="language-outline" title="Language" subtitle="English" />
                        <SettingsItem icon="notifications-outline" title="Notifications" subtitle="Enabled" />
                        <SettingsItem icon="moon-outline" title="Appearance" subtitle="Dark mode" />
                    </View>
                </View>

                {/* Subscription Section */}
                <View className="mx-6 mb-6">
                    <Text className="text-slate-400 text-sm font-medium mb-3 px-1">SUBSCRIPTION</Text>
                    <View className="bg-slate-800 rounded-xl overflow-hidden">
                        <TouchableOpacity className="flex-row items-center p-4">
                            <View className="w-10 h-10 bg-amber-600/20 rounded-full items-center justify-center">
                                <Ionicons name="diamond" size={20} color="#f59e0b" />
                            </View>
                            <View className="flex-1 ml-4">
                                <Text className="text-white font-semibold">Upgrade to Pro</Text>
                                <Text className="text-slate-400 text-sm">Unlock advanced AI features</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Support Section */}
                <View className="mx-6 mb-6">
                    <Text className="text-slate-400 text-sm font-medium mb-3 px-1">SUPPORT</Text>
                    <View className="bg-slate-800 rounded-xl overflow-hidden">
                        <SettingsItem icon="help-circle-outline" title="Help Center" />
                        <SettingsItem icon="chatbubble-outline" title="Contact Support" />
                        <SettingsItem icon="star-outline" title="Rate the App" />
                    </View>
                </View>

                {/* Sign Out */}
                <View className="mx-6 mb-12">
                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="bg-red-600/10 rounded-xl p-4 flex-row items-center justify-center"
                    >
                        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                        <Text className="text-red-400 font-semibold ml-2">Sign Out</Text>
                    </TouchableOpacity>
                </View>

                {/* Version */}
                <View className="items-center pb-8">
                    <Text className="text-slate-500 text-sm">Twealth Mobile v1.0.0</Text>
                </View>
            </ScrollView>
        </View>
    );
}

function SettingsItem({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
    return (
        <TouchableOpacity className="flex-row items-center p-4 border-b border-slate-700 last:border-b-0">
            <View className="w-10 h-10 bg-slate-700 rounded-full items-center justify-center">
                <Ionicons name={icon as any} size={20} color="#94a3b8" />
            </View>
            <View className="flex-1 ml-4">
                <Text className="text-white">{title}</Text>
                {subtitle && <Text className="text-slate-400 text-sm">{subtitle}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>
    );
}
