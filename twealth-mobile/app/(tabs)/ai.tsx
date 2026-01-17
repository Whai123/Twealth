/**
 * AI Coach Screen
 * 
 * Chat interface for the AI financial advisor.
 */

import { View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AIScreen() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm your AI Financial Coach. Ask me anything about budgeting, investing, retirement planning, or achieving your financial goals. 💰",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);

    const chatMutation = useMutation({
        mutationFn: async (message: string) => {
            return api.post<{ response: string }>('/api/ai/chat', { message });
        },
        onSuccess: (data) => {
            const assistantMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
        },
    });

    const handleSend = () => {
        if (!input.trim() || chatMutation.isPending) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        chatMutation.mutate(input.trim());
    };

    return (
        <View className="flex-1 bg-slate-900">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                {/* Header */}
                <View className="px-6 pt-16 pb-4 border-b border-slate-800">
                    <Text className="text-2xl font-bold text-white">AI Coach</Text>
                    <Text className="text-slate-400 mt-1">CFP®-level financial advice</Text>
                </View>

                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1 px-4 py-4"
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map((message) => (
                        <View
                            key={message.id}
                            className={`mb-4 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            <View
                                className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                        ? 'bg-blue-600 rounded-br-md'
                                        : 'bg-slate-800 rounded-bl-md'
                                    }`}
                            >
                                <Text className="text-white text-base leading-6">{message.content}</Text>
                            </View>
                        </View>
                    ))}

                    {chatMutation.isPending && (
                        <View className="items-start mb-4">
                            <View className="bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
                                <ActivityIndicator size="small" color="#3b82f6" />
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Input */}
                <View className="px-4 py-4 border-t border-slate-800 bg-slate-900">
                    <View className="flex-row items-center bg-slate-800 rounded-full px-4">
                        <TextInput
                            value={input}
                            onChangeText={setInput}
                            placeholder="Ask me anything..."
                            placeholderTextColor="#64748b"
                            className="flex-1 py-3 text-white text-base"
                            multiline
                            maxLength={500}
                            onSubmitEditing={handleSend}
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!input.trim() || chatMutation.isPending}
                            className="ml-2 bg-blue-600 w-10 h-10 rounded-full items-center justify-center"
                            style={{ opacity: input.trim() && !chatMutation.isPending ? 1 : 0.5 }}
                        >
                            <Ionicons name="send" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
