import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Plus, Search, UserPlus, Check, X, Phone } from 'lucide-react-native';
import { useTranslation } from '../../src/lib/i18n';
import { socialService, Friend } from '../../src/services/social_service';

export default function FriendsScreen() {
    const { t, language } = useTranslation();
    const router = useRouter();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Add Friend Modal State
    const [contacts, setContacts] = useState<Friend[]>([]);
    const [searching, setSearching] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [myFriends, requests] = await Promise.all([
                socialService.getMyFriends(),
                socialService.getPendingRequests()
            ]);
            setFriends(myFriends || []);
            setPendingRequests(requests || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const handleAccept = async (requestId: string) => {
        const success = await socialService.acceptFriendRequest(requestId);
        if (success) {
            Alert.alert(t('success'), t('friendAdded') || 'Friend added!');
            fetchData();
        } else {
            Alert.alert(t('error'), 'Failed to accept request');
        }
    };

    const handleReject = async (requestId: string) => {
        const success = await socialService.rejectFriendRequest(requestId);
        if (success) {
            fetchData();
        } else {
            Alert.alert(t('error'), 'Failed to reject request');
        }
    };

    const handleOpenAddModal = async () => {
        setShowAddModal(true);
        setSearching(true);
        try {
            const potentialFriends = await socialService.findFriendsInContacts();
            setContacts(potentialFriends);
        } catch (e) {
            console.error(e);
            Alert.alert(t('error'), t('contactsError') || 'Could not access contacts');
        } finally {
            setSearching(false);
        }
    };

    const handleSendRequest = async (userId: string) => {
        const success = await socialService.sendFriendRequest(userId);
        if (success) {
            Alert.alert(t('success'), t('requestSent') || 'Request Sent');
            setContacts(prev => prev.map(c => c.id === userId ? { ...c, status: 'sent' } : c));
        } else {
            Alert.alert(t('error'), t('requestFailed') || 'Failed to send');
        }
    };

    const handleInvite = async (phone: string | null) => {
        if (!phone) return;
        await socialService.inviteViaSMS(phone);
    };

    const renderPendingRequest = ({ item }: { item: any }) => (
        <View style={styles.requestItem}>
            <View style={styles.requestInfo}>
                {item.sender.avatar_url ? (
                    <Image source={{ uri: item.sender.avatar_url }} style={styles.requestAvatar} />
                ) : (
                    <View style={[styles.requestAvatar, { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ fontSize: 20 }}>👤</Text>
                    </View>
                )}
                <View style={{ marginLeft: 12 }}>
                    <Text style={styles.requestName}>{item.sender.nickname || item.sender.full_name}</Text>
                    <Text style={styles.requestTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
            </View>
            <View style={styles.requestActions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]} onPress={() => handleAccept(item.id)}>
                    <Check size={18} color="#10b981" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={() => handleReject(item.id)}>
                    <X size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderFriend = ({ item }: { item: Friend }) => (
        <TouchableOpacity
            style={styles.friendCard}
            onPress={() => {
                router.push({
                    pathname: '/friend_detail',
                    params: { userId: item.id }
                } as any);
            }}
        >
            <View style={styles.friendInfo}>
                <View style={styles.friendAvatarWrapper}>
                    {item.avatar_url ? (
                        <Image source={{ uri: item.avatar_url }} style={styles.friendAvatar} />
                    ) : (
                        <View style={[styles.friendAvatar, { backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ fontSize: 24 }}>👤</Text>
                        </View>
                    )}
                    <View style={styles.statusDot} />
                </View>
                <View style={styles.friendText}>
                    <Text style={styles.friendName}>{item.nickname || item.full_name}</Text>
                    <Text style={styles.friendStatus}>{t('connected') || 'Connected'}</Text>
                </View>
            </View>
            <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>›</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fef3c7', '#dcfce7', '#d1fae5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('friends') || 'Friends'}</Text>
                    <TouchableOpacity onPress={handleOpenAddModal} style={styles.addBtn}>
                        <UserPlus size={24} color="#10b981" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                    {/* Pending Requests Section */}
                    {pendingRequests.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{language === 'Korean' ? '받은 요청' : 'Pending Requests'} ({pendingRequests.length})</Text>
                            <View style={styles.requestsList}>
                                {pendingRequests.map(req => (
                                    <View key={req.id} style={{ marginBottom: 10 }}>
                                        {renderPendingRequest({ item: req })}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* My Friends Section */}
                    <View style={styles.section}>
                        <View style={styles.searchBar}>
                            <Search size={20} color="#94a3b8" />
                            <Text style={styles.searchPlaceholder}>{language === 'Korean' ? '친구 검색...' : 'Search friends...'}</Text>
                        </View>

                        {loading ? (
                            <ActivityIndicator color="#10b981" style={{ marginTop: 20 }} />
                        ) : friends.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyEmoji}>👋</Text>
                                <Text style={styles.emptyTitle}>{language === 'Korean' ? '아직 친구가 없어요' : 'No Friends Yet'}</Text>
                                <Text style={styles.emptyDesc}>
                                    {language === 'Korean' ? '연락처에서 친구를 초대하고\n함께 건강해지세요!' : 'Invite friends from contacts\nand get healthy together!'}
                                </Text>
                                <TouchableOpacity style={styles.inviteBtn} onPress={handleOpenAddModal}>
                                    <Text style={styles.inviteBtnText}>{t('addFriend') || 'Add Friend'}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            friends.map(friend => (
                                <View key={friend.id} style={{ marginBottom: 12 }}>
                                    {renderFriend({ item: friend })}
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>

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

                    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                        <Text style={{ fontSize: 13, color: '#64748b' }}>
                            {language === 'Korean' ? '연락처에 있는 친구들을 찾아보세요' : 'Find friends from your contacts'}
                        </Text>
                    </View>

                    {searching ? (
                        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#10b981" />
                    ) : (
                        <FlatList
                            data={contacts}
                            keyExtractor={item => item.id || item.phone || Math.random().toString()}
                            contentContainerStyle={{ padding: 16 }}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>
                                        {language === 'Korean' ? 'FoodCoach를 사용하는 친구가 없네요.\n초대해보세요!' : 'No friends found on FoodCoach.\nInvite them!'}
                                    </Text>
                                </View>
                            }
                            renderItem={({ item }) => (
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
                                            <Text style={styles.contactName}>{item.nickname || item.full_name || 'User'}</Text>
                                            {item.phone && <Text style={styles.contactPhone}>{item.phone}</Text>}
                                        </View>
                                    </View>

                                    {item.status === 'accepted' ? (
                                        <View style={styles.friendBadge}>
                                            <Check size={14} color="#10b981" />
                                            <Text style={styles.friendBadgeText}>{t('friends')}</Text>
                                        </View>
                                    ) : item.status === 'sent' ? (
                                        <View style={styles.sentBadge}>
                                            <Text style={styles.sentText}>{t('sent') || 'Sent'}</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.connectBtn}
                                            onPress={() => handleSendRequest(item.id)}
                                        >
                                            <UserPlus size={16} color="#fff" />
                                            <Text style={styles.connectBtnText}>{t('connect') || 'Connect'}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
    title: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
    addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
    section: { paddingHorizontal: 24, marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    searchPlaceholder: { color: '#94a3b8', marginLeft: 10, fontSize: 16 },
    friendCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#fff' },
    friendInfo: { flexDirection: 'row', alignItems: 'center' },
    friendAvatarWrapper: { marginRight: 16 },
    friendAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#cbd5e1' },
    statusDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#fff' },
    friendText: {},
    friendName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    friendStatus: { fontSize: 12, color: '#64748b', marginTop: 2 },
    arrowContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center' },
    arrow: { fontSize: 18, color: '#94a3b8', fontWeight: 'bold', marginTop: -2 },

    // Requests
    requestsList: {},
    requestItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    requestInfo: { flexDirection: 'row', alignItems: 'center' },
    requestAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e2e8f0' },
    requestName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
    requestTime: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    requestActions: { flexDirection: 'row', gap: 10 },
    actionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

    // Empty
    emptyState: { alignItems: 'center', padding: 40 },
    emptyEmoji: { fontSize: 48, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
    emptyDesc: { textAlign: 'center', color: '#64748b', lineHeight: 22, marginBottom: 24 },
    inviteBtn: { backgroundColor: '#10b981', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
    inviteBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 16, lineHeight: 24 },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    closeText: { fontSize: 16, color: '#64748b' },
    contactItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    contactAvatar: { width: 48, height: 48, borderRadius: 24 },
    contactName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
    contactPhone: { fontSize: 12, color: '#94a3b8' },
    connectBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, alignItems: 'center', gap: 6 },
    connectBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    friendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    friendBadgeText: { color: '#10b981', fontWeight: 'bold', fontSize: 12 },
    sentBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    sentText: { color: '#64748b', fontWeight: 'bold', fontSize: 12 },
});
