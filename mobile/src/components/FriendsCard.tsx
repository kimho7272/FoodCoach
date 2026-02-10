import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, TextInput, FlatList } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from '../lib/i18n';
import { Plus, UserPlus, Send, Check, X } from 'lucide-react-native';
import { socialService, Friend } from '../services/social_service';
import { useRouter } from 'expo-router';


interface FriendsCardProps {
    refreshTrigger?: number;
}

export const FriendsCard: React.FC<FriendsCardProps> = ({ refreshTrigger }) => {
    const { t, language } = useTranslation();
    const router = useRouter();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [contacts, setContacts] = useState<Friend[]>([]); // Potential friends from contacts
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        loadFriends();
    }, [refreshTrigger]);

    const loadFriends = async () => {
        setLoading(true);
        const myFriends = await socialService.getMyFriends();
        setFriends(myFriends || []);
        setLoading(false);
    };

    const handleOpenAddModal = async () => {
        setShowAddModal(true);
        setSearching(true);
        try {
            // Stage 1: Fast Local Load
            const localContacts = await socialService.getPhoneContacts();
            setContacts(localContacts);
            setSearching(false); // Show list immediately

            // Stage 2: Background Sync
            const enrichedContacts = await socialService.syncContactsWithApp(localContacts);
            setContacts(enrichedContacts);
        } catch (e) {
            console.error(e);
            Alert.alert(t('error'), t('contactsError'));
            setSearching(false);
        }
    };

    const handleInvite = async (phone: string | null) => {
        if (!phone) return;
        await socialService.inviteViaSMS(phone);
    };

    const handleSendRequest = async (userId: string) => {
        const success = await socialService.sendFriendRequest(userId);
        if (success) {
            Alert.alert(t('success'), t('requestSent'));
            // Update local state to reflect 'sent'
            setContacts(prev => prev.map(c => c.id === userId ? { ...c, status: 'sent' } : c));
        } else {
            Alert.alert(t('error'), t('requestFailed'));
        }
    };

    const renderContactItem = ({ item }: { item: Friend }) => (
        <View style={styles.contactItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.contactAvatar} />
                ) : (
                    <View style={[styles.contactAvatar, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text>👤</Text>
                    </View>
                )}
                <View style={{ marginLeft: 12 }}>
                    <Text style={styles.contactName}>{item.nickname || item.full_name}</Text>
                    {item.phone && <Text style={styles.contactPhone}>{item.phone}</Text>}
                    {!item.is_registered && (
                        <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                            {language === 'Korean' ? '앱 미사용' : 'Not on App'}
                        </Text>
                    )}
                </View>
            </View>

            {item.status === 'accepted' ? (
                <View style={styles.friendBadge}>
                    <Check size={14} color="#10b981" />
                    <Text style={styles.friendText}>{t('friends')}</Text>
                </View>
            ) : item.status === 'sent' ? (
                <View style={styles.sentBadge}>
                    <Text style={styles.sentText}>{t('sent') || 'Sent'}</Text>
                </View>
            ) : item.is_registered ? (
                <TouchableOpacity
                    style={styles.connectBtn}
                    onPress={() => handleSendRequest(item.id)}
                >
                    <UserPlus size={16} color="#fff" />
                    <Text style={styles.connectBtnText}>{t('connect') || 'Connect'}</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.connectBtn, { backgroundColor: '#f1f5f9' }]}
                    onPress={() => handleInvite(item.phone)}
                >
                    <Send size={16} color="#64748b" />
                    <Text style={[styles.connectBtnText, { color: '#64748b' }]}>{t('invite') || 'Invite'}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t('friends') || 'Friends'}</Text>
                <TouchableOpacity onPress={handleOpenAddModal}>
                    <Text style={styles.seeAll}>{t('addFriend') || 'Add Friend'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Add Friend Button */}
                <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal}>
                    <View style={styles.addIconCircle}>
                        <Plus size={24} color="#64748b" />
                    </View>
                    <Text style={styles.addLabel}>{t('invite')}</Text>
                </TouchableOpacity>

                {loading ? (
                    <ActivityIndicator style={{ marginLeft: 20 }} color="#10b981" />
                ) : (
                    friends.map((friend) => (
                        <TouchableOpacity
                            key={friend.id}
                            style={styles.friendItem}
                            onPress={() => {
                                // Navigate to friend detail
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
                                    <View style={[styles.avatar, { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }]}>
                                        <Text style={{ fontSize: 20 }}>👤</Text>
                                    </View>
                                )}
                                <View style={styles.statusDot} />
                            </View>
                            <Text style={styles.friendName} numberOfLines={1}>{friend.nickname || friend.full_name?.split(' ')[0]}</Text>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Add Friend Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('findFriends') || 'Find Friends'}</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <Text style={styles.closeText}>{t('close')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <Text style={styles.searchDesc}>
                            {language === 'Korean' ? '연락처에 있는 친구들을 찾아보세요' : 'Find friends from your contacts'}
                        </Text>
                    </View>

                    {searching ? (
                        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#10b981" />
                    ) : (
                        <View style={styles.contactsList}>
                            {contacts.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>
                                        {language === 'Korean' ? '연락처를 찾을 수 없습니다.' : 'No contacts found.'}
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={contacts}
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderContactItem}
                                    initialNumToRender={10}
                                    windowSize={5}
                                    removeClippedSubviews={true}
                                />
                            )}
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
    title: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    seeAll: { fontSize: 14, fontWeight: '700', color: '#10b981' },
    scrollContent: { paddingHorizontal: 4, gap: 16 },
    addBtn: { alignItems: 'center', width: 60 },
    addIconCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    addLabel: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
    friendItem: { alignItems: 'center', width: 60 },
    avatarWrapper: { width: 56, height: 56, marginBottom: 6 },
    avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#fff' },
    statusDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: '#fff' },
    friendName: { fontSize: 12, color: '#1e293b', fontWeight: '600', textAlign: 'center' },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    closeText: { fontSize: 16, color: '#64748b' },
    searchContainer: { padding: 20, backgroundColor: '#f8fafc' },
    searchDesc: { color: '#64748b', fontSize: 14 },
    contactsList: { flex: 1 },
    contactItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    contactAvatar: { width: 48, height: 48, borderRadius: 24 },
    contactName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
    contactPhone: { fontSize: 12, color: '#94a3b8' },
    connectBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, alignItems: 'center', gap: 6 },
    connectBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    friendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    friendText: { color: '#10b981', fontWeight: 'bold', fontSize: 12 },
    sentBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    sentText: { color: '#64748b', fontWeight: 'bold', fontSize: 12 },
    emptyState: { alignItems: 'center', marginTop: 60, padding: 20 },
    emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 16, lineHeight: 24 },
});
