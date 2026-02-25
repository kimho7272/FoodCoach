import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, X, UserPlus, Check, Send } from 'lucide-react-native';
import { socialService, Friend } from '../services/social_service';
import { useTranslation } from '../lib/i18n';
import { theme } from '../constants/theme';
import { useAlert } from '../context/AlertContext';

interface AddFriendModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({ visible, onClose, onSuccess }) => {
    const { t, language } = useTranslation();
    const { showAlert } = useAlert();
    const [contacts, setContacts] = useState<Friend[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        if (visible) {
            handleInitialFetch();
        }
    }, [visible]);

    const handleInitialFetch = async () => {
        setSearching(true);
        setSearchText('');
        try {
            // Stage 1: Fast Local Load + Instant Cache Overlay
            const local = await socialService.getPhoneContacts();
            const cached = await socialService.getCachedSync(local);
            setContacts(cached);

            // Stage 2: Background Sync with Server
            const enriched = await socialService.syncContactsWithApp(local);
            setContacts(enriched);
        } catch (e) {
            console.error(e);
            showAlert({ title: t('error'), message: t('contactsError') || 'Could not access contacts', type: 'error' });
        } finally {
            setSearching(false);
        }
    };

    const handleSendRequest = async (userId: string) => {
        const success = await socialService.sendFriendRequest(userId);
        if (success) {
            showAlert({ title: t('success'), message: t('requestSent') || 'Request Sent', type: 'success' });
            setContacts(prev => prev.map(c => c.id === userId ? { ...c, status: 'sent', request_sent_at: new Date().toISOString() } : c));
            if (onSuccess) onSuccess();
        } else {
            showAlert({ title: t('error'), message: t('requestFailed') || 'Failed to send', type: 'error' });
        }
    };

    const handleAcceptRequest = async (friendshipId: string, userId: string) => {
        const success = await socialService.acceptFriendRequest(friendshipId);
        if (success) {
            showAlert({ title: t('success'), message: t('friendAdded') || 'Friend added!', type: 'success' });
            setContacts(prev => prev.map(c => c.id === userId ? { ...c, status: 'accepted' } : c));
            if (onSuccess) onSuccess();
        } else {
            showAlert({ title: t('error'), message: t('failedToAccept') || 'Failed to accept', type: 'error' });
        }
    };

    const handleInvite = async (phone: string | null) => {
        if (!phone) return;
        await socialService.inviteViaSMS(phone);
    };

    const isRequestExpired = (sentAt?: string) => {
        if (!sentAt) return false;
        const sentTime = new Date(sentAt).getTime();
        const now = new Date().getTime();
        const hoursDiff = (now - sentTime) / (1000 * 60 * 60);
        return hoursDiff > 24;
    };

    const filteredContacts = contacts.filter(c =>
        (c.full_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (c.nickname || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (c.phone || '').includes(searchText)
    );

    const renderItem = ({ item }: { item: Friend }) => (
        <BlurView intensity={20} tint="light" style={styles.contactItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.contactAvatar} />
                ) : (
                    <View style={[styles.contactAvatar, { backgroundColor: theme.colors.background.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text>👤</Text>
                    </View>
                )}
                <View style={{ marginLeft: 12 }}>
                    <Text style={styles.contactName}>{item.full_name || 'User'}</Text>
                    {item.is_registered && item.nickname && (
                        <Text style={{ fontSize: 11, color: theme.colors.text.muted }}>ID: {item.nickname}</Text>
                    )}
                    {item.phone && <Text style={styles.contactPhone}>{item.phone}</Text>}
                </View>
            </View>

            {item.status === 'accepted' ? (
                <View style={styles.friendBadge}>
                    <Check size={14} color={theme.colors.primary} />
                    <Text style={styles.friendBadgeText}>{t('friends')}</Text>
                </View>
            ) : (item.status === 'sent' && !isRequestExpired(item.request_sent_at)) ? (
                <View style={styles.sentBadge}>
                    <Text style={styles.sentText}>{t('sent') || 'Sent'}</Text>
                </View>
            ) : item.status === 'pending' ? (
                <TouchableOpacity
                    style={[styles.connectBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={() => item.friendship_id && handleAcceptRequest(item.friendship_id, item.id)}
                >
                    <Check size={16} color="#fff" />
                    <Text style={styles.connectBtnText}>{t('accept') || 'Accept'}</Text>
                </TouchableOpacity>
            ) : item.is_registered ? (
                <TouchableOpacity
                    style={[styles.connectBtn, { backgroundColor: theme.colors.secondary }]}
                    onPress={() => handleSendRequest(item.id)}
                >
                    <UserPlus size={16} color="#fff" />
                    <Text style={styles.connectBtnText}>{t('connect') || 'Connect'}</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.connectBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={() => handleInvite(item.phone)}
                >
                    <Send size={16} color="#fff" />
                    <Text style={styles.connectBtnText}>{t('invite') || 'Invite'}</Text>
                </TouchableOpacity>
            )}
        </BlurView>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <LinearGradient
                    colors={theme.colors.gradients.background as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('findFriends') || 'Find Friends'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeText}>{t('close')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ padding: 16 }}>
                        <Text style={{ fontSize: 13, color: theme.colors.text.secondary }}>
                            {language === 'Korean' ? '연락처에 있는 친구들을 찾아보세요' : 'Find friends from your contacts'}
                        </Text>
                    </View>

                    <View style={styles.modalSearchContainer}>
                        <Search size={20} color={theme.colors.text.secondary} />
                        <TextInput
                            style={styles.modalInput}
                            placeholder={language === 'Korean' ? '이름 또는 전화번호 검색' : 'Search name or phone'}
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholderTextColor={theme.colors.text.muted}
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchText('')}>
                                <X size={16} color={theme.colors.text.muted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {searching && contacts.length === 0 ? (
                        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.colors.primary} />
                    ) : (
                        <FlatList
                            data={filteredContacts}
                            keyExtractor={(item) => item.id || item.phone || Math.random().toString()}
                            renderItem={renderItem}
                            contentContainerStyle={{ padding: 16 }}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>
                                        {language === 'Korean' ? '검색 결과가 없습니다.' : 'No results found.'}
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: theme.colors.background.primary },
    modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.glass.border },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text.primary },
    closeText: { fontSize: 16, color: theme.colors.text.secondary },
    modalSearchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.glass.highlight, margin: 16, marginTop: 0, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.glass.border },
    modalInput: { flex: 1, marginLeft: 10, fontSize: 16, color: theme.colors.text.primary },
    contactItem: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 8, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    contactAvatar: { width: 48, height: 48, borderRadius: 24 },
    contactName: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
    contactPhone: { fontSize: 12, color: theme.colors.text.secondary },
    connectBtn: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, alignItems: 'center', gap: 6 },
    connectBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    friendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    friendBadgeText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 12 },
    sentBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    sentText: { color: theme.colors.text.secondary, fontWeight: 'bold', fontSize: 12 },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: theme.colors.text.secondary, fontSize: 16 },
});
