import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, ActivityIndicator, TextInput } from 'react-native';
import { useTranslation } from '../lib/i18n';
import { Plus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socialService, Friend } from '../services/social_service';
import { useRouter } from 'expo-router';
import { AddFriendModal } from './AddFriendModal';
import { theme } from '../constants/theme';
import { messageService } from '../services/message_service';
import { supabase } from '../lib/supabase';

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
    const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        loadFriends();
        loadAliases();
        loadUnreadCounts();

        // Subscribe to messages
        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const channel = supabase
                .channel('friends_card_realtime')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'friendships'
                }, (payload: any) => {
                    const { new: newRecord, old: oldRecord } = payload;
                    if (
                        newRecord?.user_id_1 === user.id || newRecord?.user_id_2 === user.id ||
                        oldRecord?.user_id_1 === user.id || oldRecord?.user_id_2 === user.id
                    ) {
                        loadFriends();
                    }
                })
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'social_messages',
                    filter: `receiver_id=eq.${user.id}`
                }, () => {
                    loadUnreadCounts();
                })
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'social_messages',
                    filter: `receiver_id=eq.${user.id}`
                }, () => {
                    loadUnreadCounts();
                })
                .subscribe();

            return channel;
        };

        let activeChannel: any;
        setupSubscription().then(channel => {
            activeChannel = channel;
        });

        return () => {
            if (activeChannel) {
                supabase.removeChannel(activeChannel);
            }
        };
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

    const loadUnreadCounts = async () => {
        const { data } = await messageService.getUnreadCounts();
        if (data) setUnreadCounts(data);
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
                        const displayName = aliases[friend.id] || friend.nickname || (friend.full_name ? friend.full_name.split(' ')[0] : '') || t('friend');
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
                                    {unreadCounts && unreadCounts[friend.id] > 0 && (
                                        <View style={styles.unreadBadge}>
                                            <Text style={styles.unreadText}>{unreadCounts[friend.id] > 9 ? '9+' : unreadCounts[friend.id]}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.friendName} numberOfLines={1}>
                                    {aliases[friend.id] || friend.nickname || t('friend')}
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
    unreadBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#ef4444',
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: theme.colors.background.primary,
        paddingHorizontal: 2,
    },
    unreadText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: '900',
    },
    contactSubName: { fontSize: 9, color: theme.colors.text.muted, fontWeight: '600', textAlign: 'center' }
});
