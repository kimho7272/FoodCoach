import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, ActivityIndicator, TextInput } from 'react-native';
import { useTranslation } from '../lib/i18n';
import { Plus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socialService, Friend } from '../services/social_service';
import { useRouter } from 'expo-router';
import { AddFriendModal } from './AddFriendModal';
import { theme } from '../constants/theme';

interface FriendsCardProps {
    refreshTrigger?: number;
}

export const FriendsCard: React.FC<FriendsCardProps> = ({ refreshTrigger }) => {
    const { t, language } = useTranslation();
    const router = useRouter();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [aliases, setAliases] = useState<{ [key: string]: string }>({});
    const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
    const [newAlias, setNewAlias] = useState('');

    useEffect(() => {
        loadFriends();
        loadAliases();
    }, [refreshTrigger]);

    const loadFriends = async () => {
        setLoading(true);
        const myFriends = await socialService.getMyFriends();
        setFriends(myFriends || []);
        setLoading(false);
    };

    const loadAliases = async () => {
        try {
            const saved = await AsyncStorage.getItem('friend_aliases');
            if (saved) setAliases(JSON.parse(saved));
        } catch (e) {
            console.error('Failed to load aliases', e);
        }
    };

    const handleSaveAlias = async () => {
        if (!editingFriend) return;
        const updatedAliases = { ...aliases, [editingFriend.id]: newAlias };
        setAliases(updatedAliases);
        await AsyncStorage.setItem('friend_aliases', JSON.stringify(updatedAliases));
        setEditingFriend(null);
        setNewAlias('');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t('friends') || 'Friends'}</Text>
                <TouchableOpacity onPress={() => setShowAddModal(true)}>
                    <Text style={styles.seeAll}>{t('addFriend') || 'Add Friend'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Add Friend Button - Only show if no friends exist */}
                {friends.length === 0 && (
                    <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                        <View style={styles.addIconCircle}>
                            <Plus size={24} color={theme.colors.text.muted} />
                        </View>
                        <Text style={styles.addLabel}>{t('invite')}</Text>
                    </TouchableOpacity>
                )}

                {loading ? (
                    <ActivityIndicator style={{ marginLeft: 20 }} color={theme.colors.primary} />
                ) : (
                    friends.map((friend) => {
                        const displayName = aliases[friend.id] || friend.nickname || (friend.full_name ? friend.full_name.split(' ')[0] : '') || 'Friend';
                        return (
                            <TouchableOpacity
                                key={friend.id}
                                style={styles.friendItem}
                                onPress={() => {
                                    router.push({
                                        pathname: '/friend_detail',
                                        params: { userId: friend.id }
                                    } as any);
                                }}
                            >
                                <View style={styles.avatarWrapper}>
                                    {friend.avatar_url ? (
                                        <Image source={{ uri: friend.avatar_url }} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }]}>
                                            <Text style={{ fontSize: 20 }}>👤</Text>
                                        </View>
                                    )}
                                    <View style={styles.statusDot} />
                                </View>
                                <Text style={styles.friendName} numberOfLines={1}>
                                    {aliases[friend.id] || friend.nickname || 'Friend'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            <AddFriendModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={loadFriends} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
    title: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary },
    seeAll: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
    scrollContent: { paddingHorizontal: 4, gap: 10, paddingBottom: 10 },
    addBtn: { alignItems: 'center', width: 64 },
    addIconCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: theme.colors.glass.border, backgroundColor: theme.colors.glass.card, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    addLabel: { fontSize: 12, color: theme.colors.text.muted, fontWeight: '700', textAlign: 'center' },
    friendItem: { alignItems: 'center', width: 64 },
    avatarWrapper: { width: 56, height: 56, marginBottom: 6, position: 'relative' },
    avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: theme.colors.glass.border },
    statusDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: theme.colors.primary, position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: theme.colors.background.primary },
    friendName: { fontSize: 11, color: theme.colors.text.primary, fontWeight: '800', textAlign: 'center', marginTop: 2 },
    contactSubName: { fontSize: 9, color: theme.colors.text.muted, fontWeight: '600', textAlign: 'center' }
});
