/**
 * Goals Screen
 * 
 * View and manage financial goals.
 */

import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

interface Goal {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    category: string;
}

export default function GoalsScreen() {
    const [refreshing, setRefreshing] = useState(false);

    const { data: goals, refetch, isLoading } = useQuery({
        queryKey: ['goals'],
        queryFn: () => api.get<Goal[]>('/api/goals'),
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
                <View className="px-6 pt-16 pb-4 flex-row justify-between items-center">
                    <View>
                        <Text className="text-2xl font-bold text-white">Goals</Text>
                        <Text className="text-slate-400 mt-1">Track your progress</Text>
                    </View>
                    <TouchableOpacity className="bg-blue-600 rounded-full p-3">
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Goals List */}
                <View className="px-6 pb-8">
                    {goals?.map((goal) => (
                        <GoalCard key={goal.id} goal={goal} formatCurrency={formatCurrency} />
                    ))}

                    {(!goals || goals.length === 0) && !isLoading && (
                        <View className="bg-slate-800 rounded-xl p-8 items-center">
                            <Ionicons name="flag-outline" size={48} color="#64748b" />
                            <Text className="text-slate-400 mt-4 text-center">
                                No goals yet.{'\n'}Tap + to create your first goal!
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

function GoalCard({ goal, formatCurrency }: { goal: Goal; formatCurrency: (n: number) => string }) {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysLeft = Math.ceil(
        (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
        <TouchableOpacity className="bg-slate-800 rounded-xl p-4 mb-4">
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <Text className="text-lg font-semibold text-white">{goal.title}</Text>
                    <Text className="text-slate-400 text-sm mt-1">
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                    </Text>
                </View>
                <View className="bg-blue-600/20 px-3 py-1 rounded-full">
                    <Text className="text-blue-400 text-xs font-medium">{goal.category}</Text>
                </View>
            </View>

            {/* Progress bar */}
            <View className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                />
            </View>

            <View className="flex-row justify-between">
                <Text className="text-slate-400 text-sm">
                    {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                </Text>
                <Text className="text-blue-400 text-sm font-medium">
                    {progress.toFixed(0)}%
                </Text>
            </View>
        </TouchableOpacity>
    );
}
