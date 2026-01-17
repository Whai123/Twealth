/**
 * Dashboard Screen
 * 
 * Main home screen showing financial overview, score, and quick actions.
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

interface DashboardStats {
    netWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsRate: number;
    twealthScore?: {
        overall: number;
        band: string;
    };
}

export default function DashboardScreen() {
    const [refreshing, setRefreshing] = useState(false);

    const { data: stats, refetch, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => api.get<DashboardStats>('/api/financial-health/stats'),
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <View className="flex-1 bg-slate-900">
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                }
            >
                {/* Header */}
                <View className="px-6 pt-16 pb-6">
                    <Text className="text-2xl font-bold text-white">Dashboard</Text>
                    <Text className="text-slate-400 mt-1">Your financial overview</Text>
                </View>

                {/* Twealth Score Card */}
                <View className="mx-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 mb-6">
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-blue-200 text-sm font-medium">Twealth Score</Text>
                            <Text className="text-5xl font-bold text-white mt-1">
                                {stats?.twealthScore?.overall || '--'}
                            </Text>
                            <Text className="text-blue-200 text-sm mt-1">
                                {stats?.twealthScore?.band || 'Loading...'}
                            </Text>
                        </View>
                        <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                            <Ionicons name="analytics" size={32} color="white" />
                        </View>
                    </View>
                </View>

                {/* Stats Grid */}
                <View className="mx-6 flex-row flex-wrap">
                    <StatCard
                        title="Net Worth"
                        value={stats?.netWorth ? formatCurrency(stats.netWorth) : '--'}
                        icon="wallet-outline"
                        color="#22c55e"
                    />
                    <StatCard
                        title="Monthly Income"
                        value={stats?.monthlyIncome ? formatCurrency(stats.monthlyIncome) : '--'}
                        icon="trending-up"
                        color="#3b82f6"
                    />
                    <StatCard
                        title="Monthly Expenses"
                        value={stats?.monthlyExpenses ? formatCurrency(stats.monthlyExpenses) : '--'}
                        icon="trending-down"
                        color="#ef4444"
                    />
                    <StatCard
                        title="Savings Rate"
                        value={stats?.savingsRate ? `${stats.savingsRate}%` : '--'}
                        icon="pie-chart"
                        color="#f59e0b"
                    />
                </View>

                {/* Quick Actions */}
                <View className="mx-6 mt-6 mb-8">
                    <Text className="text-lg font-semibold text-white mb-4">Quick Actions</Text>
                    <View className="flex-row">
                        <QuickAction title="Add Transaction" icon="add-circle" color="#3b82f6" />
                        <QuickAction title="Ask AI" icon="chatbubbles" color="#8b5cf6" />
                        <QuickAction title="New Goal" icon="flag" color="#22c55e" />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

function StatCard({ title, value, icon, color }: {
    title: string;
    value: string;
    icon: string;
    color: string;
}) {
    return (
        <View className="w-1/2 p-2">
            <View className="bg-slate-800 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                    <Ionicons name={icon as any} size={20} color={color} />
                    <Text className="text-slate-400 text-sm ml-2">{title}</Text>
                </View>
                <Text className="text-xl font-bold text-white">{value}</Text>
            </View>
        </View>
    );
}

function QuickAction({ title, icon, color }: {
    title: string;
    icon: string;
    color: string;
}) {
    return (
        <TouchableOpacity className="flex-1 mx-1 bg-slate-800 rounded-xl p-4 items-center">
            <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: color + '20' }}>
                <Ionicons name={icon as any} size={24} color={color} />
            </View>
            <Text className="text-xs text-slate-300 text-center">{title}</Text>
        </TouchableOpacity>
    );
}
