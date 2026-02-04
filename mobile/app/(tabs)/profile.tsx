import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, Bell, LogOut, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
    const menuItems = [
        { icon: <User size={20} color="#94a3b8" />, title: 'Personal Info' },
        { icon: <Bell size={20} color="#94a3b8" />, title: 'Notifications', badge: 'On' },
        { icon: <Settings size={20} color="#94a3b8" />, title: 'App Settings' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]">
            <View className="px-6 py-8 items-center border-b border-slate-800">
                <View className="w-24 h-24 bg-slate-800 rounded-full items-center justify-center mb-4 border-2 border-[#10b981]">
                    <Text className="text-4xl">🥘</Text>
                </View>
                <Text className="text-2xl font-bold text-white">Foodie Explorer</Text>
                <Text className="text-slate-400">foodie@example.com</Text>

                <TouchableOpacity className="mt-6 bg-slate-800 px-6 py-2 rounded-full border border-slate-700">
                    <Text className="text-white font-medium">Edit Profile</Text>
                </TouchableOpacity>
            </View>

            <View className="mt-8 px-6 space-y-2">
                {menuItems.map((item, index) => (
                    <TouchableOpacity key={index} className="flex-row items-center py-4 border-b border-slate-800/50">
                        <View className="mr-4">{item.icon}</View>
                        <Text className="flex-1 text-white font-medium">{item.title}</Text>
                        {item.badge && (
                            <View className="bg-[#10b981]/20 px-2 py-1 rounded-md mr-2">
                                <Text className="text-[#10b981] text-xs font-bold">{item.badge}</Text>
                            </View>
                        )}
                        <ChevronRight size={18} color="#475569" />
                    </TouchableOpacity>
                ))}

                <TouchableOpacity className="flex-row items-center py-6 mt-4">
                    <LogOut size={20} color="#ef4444" />
                    <Text className="text-red-500 font-bold ml-4">Log Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
