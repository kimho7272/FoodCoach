import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Plus, Search, UserPlus, Check, X, Phone } from 'lucide-react-native';
import { useTranslation } from '../../src/lib/i18n';
import { socialService, Friend } from '../../src/services/social_service';
import { useAlert } from '../../src/context/AlertContext';
import { theme } from '../../src/constants/theme';
import { AddFriendModal } from '../../src/components/AddFriendModal';

export default function FriendsScreen() {
    const { t, language } = useTranslation();
    const router = useRouter();
    const { showAlert } = useAlert();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

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
            showAlert({ title: t('success'), message: t('friendAdded') || 'Friend added!', type: 'success' });
            fetchData();
        } else {
            showAlert({ title: t('error'), message: 'Failed to accept request', type: 'error' });
        }
    };

    const handleReject = async (requestId: string) => {
        const success = await socialService.rejectFriendRequest(requestId);
        if (success) {
            fetchData();
        } else {
            showAlert({ title: t('error'), message: 'Failed to reject request', type: 'error' });
        }
    };

    const isRequestExpired = (dateString?: string) => {
        if (!dateString) return false;
        const sentTime = new Date(dateString).getTime();
        const now = new Date().getTime();
        const hoursDiff = (now - sentTime) / (1000 * 60 * 60);
        return hoursDiff > 24;
    };

    const renderPendingRequest = ({ item }: { item: any }) => (
        <BlurView intensity={20} tint="light" style={styles.requestItem}>
            <View style={styles.requestInfo}>
                {item.sender.avatar_url ? (
                    <Image source={{ uri: item.sender.avatar_url }} style={styles.requestAvatar} />
                ) : (
                    <View style={[styles.requestAvatar, { backgroundColor: theme.colors.background.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ fontSize: 20 }}>👤</Text>
                    </View>
                )}
                <View style={{ marginLeft: 12 }}>
                    <Text style={styles.requestName}>{item.sender.full_name || 'User'}</Text>
                    <Text style={styles.requestTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
            </View>
            <View style={styles.requestActions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]} onPress={() => handleAccept(item.id)}>
                    <Check size={18} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} onPress={() => handleReject(item.id)}>
                    <X size={18} color={theme.colors.danger} />
                </TouchableOpacity>
            </View>
        </BlurView>
    );

    const renderFriend = ({ item }: { item: Friend }) => (
        <TouchableOpacity
            style={styles.friendCardTouch}
            onPress={() => {
                router.push({
                    pathname: '/friend_detail',
                    params: { userId: item.id }
                } as any);
            }}
        >
            <BlurView intensity={40} tint="light" style={styles.friendCard}>
                <View style={styles.friendInfo}>
                    <View style={styles.friendAvatarWrapper}>
                        {item.avatar_url ? (
                            <Image source={{ uri: item.avatar_url }} style={styles.friendAvatar} />
                        ) : (
                            <View style={[styles.friendAvatar, { backgroundColor: theme.colors.background.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ fontSize: 24 }}>👤</Text>
                            </View>
                        )}
                        <View style={styles.statusDot} />
                    </View>
                    <View style={styles.friendText}>
                        <Text style={styles.friendName}>{item.full_name || 'User'}</Text>
                        <Text style={styles.friendStatus}>{t('connected') || 'Connected'}</Text>
                    </View>
                </View>
                <View style={styles.arrowContainer}>
                    <Text style={styles.arrow}>›</Text>
                </View>
            </BlurView>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={theme.colors.gradients.background as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('friends') || 'Friends'}</Text>
                    <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn}>
                        <UserPlus size={24} color={theme.colors.primary} />
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
                        <BlurView intensity={20} tint="light" style={styles.searchBar}>
                            <Search size={20} color={theme.colors.text.secondary} />
                            <Text style={styles.searchPlaceholder}>{language === 'Korean' ? '친구 검색...' : 'Search friends...'}</Text>
                        </BlurView>

                        {loading ? (
                            <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
                        ) : friends.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyEmoji}>👋</Text>
                                <Text style={styles.emptyTitle}>{language === 'Korean' ? '아직 친구가 없어요' : 'No Friends Yet'}</Text>
                                <Text style={styles.emptyDesc}>
                                    {language === 'Korean' ? '연락처에서 친구를 초대하고\n함께 건강해지세요!' : 'Invite friends from contacts\nand get healthy together!'}
                                </Text>
                                <TouchableOpacity style={styles.inviteBtn} onPress={() => setShowAddModal(true)}>
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

            <AddFriendModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={fetchData}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
    title: { fontSize: 28, fontWeight: '800', color: theme.colors.text.primary },
    addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.glass.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.glass.border },
    section: { paddingHorizontal: 24, marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 12 },
    searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    searchPlaceholder: { color: theme.colors.text.secondary, marginLeft: 10, fontSize: 16 },
    friendCardTouch: { borderRadius: 24, overflow: 'hidden', marginBottom: 12 },
    friendCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: theme.colors.glass.border },
    friendInfo: { flexDirection: 'row', alignItems: 'center' },
    friendAvatarWrapper: { marginRight: 16 },
    friendAvatar: { width: 56, height: 56, borderRadius: 28 },
    statusDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: theme.colors.primary, borderWidth: 2, borderColor: theme.colors.background.primary },
    friendText: {},
    friendName: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
    friendStatus: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
    arrowContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    arrow: { fontSize: 18, color: theme.colors.text.secondary, fontWeight: 'bold', marginTop: -2 },

    // Requests
    requestsList: {},
    requestItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    requestInfo: { flexDirection: 'row', alignItems: 'center' },
    requestAvatar: { width: 48, height: 48, borderRadius: 24 },
    requestName: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
    requestTime: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 2 },
    requestActions: { flexDirection: 'row', gap: 10 },
    actionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

    // Empty
    emptyState: { alignItems: 'center', padding: 40 },
    emptyEmoji: { fontSize: 48, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 8 },
    emptyDesc: { textAlign: 'center', color: theme.colors.text.secondary, lineHeight: 22, marginBottom: 24 },
    inviteBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
    inviteBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    emptyText: { textAlign: 'center', color: theme.colors.text.secondary, fontSize: 16, lineHeight: 24 },

    // Modal
    modalContainer: { flex: 1, backgroundColor: theme.colors.background.primary },
    modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.glass.border },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text.primary },
    closeText: { fontSize: 16, color: theme.colors.text.secondary },
    contactItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.glass.border, marginBottom: 8, borderRadius: 16, overflow: 'hidden' },
    contactAvatar: { width: 48, height: 48, borderRadius: 24 },
    contactName: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
    contactPhone: { fontSize: 12, color: theme.colors.text.secondary },
    connectBtn: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, alignItems: 'center', gap: 6 },
    connectBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    friendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    friendBadgeText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 12 },
    sentBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    sentText: { color: theme.colors.text.secondary, fontWeight: 'bold', fontSize: 12 },
    modalSearchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.glass.highlight, margin: 16, marginBottom: 0, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.glass.border },
    modalInput: { flex: 1, marginLeft: 10, fontSize: 16, color: theme.colors.text.primary },
});
