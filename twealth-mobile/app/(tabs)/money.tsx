/**
 * Money Tracking Screen
 * 
 * View recent transactions and spending overview.
 */

import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    description: string;
    date: string;
}

export default function MoneyScreen() {
    const [refreshing, setRefreshing] = useState(false);

    const { data: transactions, refetch, isLoading } = useQuery({
        queryKey: ['transactions'],
        queryFn: () => api.get<Transaction[]>('/api/transactions?limit=20'),
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
            minimumFractionDigits: 2,
        }).format(Math.abs(amount));
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getCategoryIcon = (category: string): string => {
        const icons: Record<string, string> = {
            'Food & Dining': 'restaurant',
            'Transportation': 'car',
            'Shopping': 'bag',
            'Entertainment': 'film',
            'Utilities': 'flash',
            'Healthcare': 'medkit',
            'Salary': 'briefcase',
            'Investment': 'trending-up',
            default: 'ellipse',
        };
        return icons[category] || icons.default;
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
                        <Text className="text-2xl font-bold text-white">Money</Text>
                        <Text className="text-slate-400 mt-1">Recent transactions</Text>
                    </View>
                    <TouchableOpacity className="bg-blue-600 rounded-full p-3">
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Transactions */}
                <View className="px-6 pb-8">
                    {transactions?.map((tx) => (
                        <TouchableOpacity
                            key={tx.id}
                            className="bg-slate-800 rounded-xl p-4 mb-3 flex-row items-center"
                        >
                            <View
                                className={`w-12 h-12 rounded-full items-center justify-center ${tx.type === 'income' ? 'bg-green-600/20' : 'bg-red-600/20'
                                    }`}
                            >
                                <Ionicons
                                    name={getCategoryIcon(tx.category) as any}
                                    size={24}
                                    color={tx.type === 'income' ? '#22c55e' : '#ef4444'}
                                />
                            </View>

                            <View className="flex-1 ml-4">
                                <Text className="text-white font-medium">{tx.description || tx.category}</Text>
                                <Text className="text-slate-400 text-sm">{formatDate(tx.date)}</Text>
                            </View>

                            <Text
                                className={`text-lg font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'
                                    }`}
                            >
                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    {(!transactions || transactions.length === 0) && !isLoading && (
                        <View className="bg-slate-800 rounded-xl p-8 items-center">
                            <Ionicons name="wallet-outline" size={48} color="#64748b" />
                            <Text className="text-slate-400 mt-4 text-center">
                                No transactions yet.{'\n'}Tap + to add your first one!
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
