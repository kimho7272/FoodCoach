import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    SafeAreaView,
    Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Send, User, Smile } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { messageService, MealMessage } from '../services/message_service';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface MealChatModalProps {
    isVisible: boolean;
    onClose: () => void;
    meal: any;
    otherUserId: string;
}

const FOOD_EMOJIS = ['😋', '🥗', '🍗', '🍎', '🍱', '🥘', '🍳', '🥑', '🥦', '🥕', '🥩', '🍕', '🍔', '🍦', '🍩', '🥤', '☕', '✨', '👍', '🙌', '🔥', '😻'];

export const MealChatModal: React.FC<MealChatModalProps> = ({ isVisible, onClose, meal, otherUserId }) => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<MealMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showEmojis, setShowEmojis] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (isVisible && meal?.id) {
            loadMessages();
            setupSubscription();
            getCurrentUser();
        }
    }, [isVisible, meal?.id]);

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
    };

    const loadMessages = async () => {
        setLoading(true);
        const { data } = await messageService.getMealMessages(meal.id);
        if (data) {
            setMessages(data);
            // Mark as read when opening
            messageService.markAsRead(meal.id);
        }
        setLoading(false);
    };

    const setupSubscription = () => {
        const channel = supabase
            .channel(`meal_messages:${meal.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'meal_messages',
                filter: `meal_id=eq.${meal.id}`
            }, async (payload) => {
                const newMessage = payload.new as MealMessage;

                // Fetch sender info if missing (payload might be incomplete)
                if (newMessage.sender_id !== currentUserId) {
                    const { data: sender } = await supabase
                        .from('profiles')
                        .select('full_name, avatar_url, nickname')
                        .eq('id', newMessage.sender_id)
                        .single();
                    newMessage.sender = (sender || undefined) as any;
                }

                setMessages(prev => {
                    if (prev.find(m => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });

                // Mark as read if we are looking at it
                if (newMessage.receiver_id === currentUserId) {
                    messageService.markAsRead(meal.id);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const content = input.trim();
        setInput('');
        setShowEmojis(false);

        const { error } = await messageService.sendMessage(meal.id, otherUserId, content);
        if (error) {
            console.error('Failed to send message:', error);
        }
    };

    const addEmoji = (emoji: string) => {
        setInput(prev => prev + emoji);
    };

    const renderMessage = ({ item }: { item: MealMessage }) => {
        const isMine = item.sender_id === currentUserId;

        return (
            <View style={[styles.messageWrapper, isMine ? styles.myMsgWrapper : styles.theirMsgWrapper]}>
                {!isMine && (
                    <View style={styles.miniAvatar}>
                        {item.sender?.avatar_url ? (
                            <Image source={{ uri: item.sender.avatar_url }} style={styles.avatarImg} />
                        ) : (
                            <View style={styles.avatarPlaceholder}><User size={12} color={theme.colors.text.muted} /></View>
                        )}
                    </View>
                )}
                <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText]}>{item.content}</Text>
                    <Text style={styles.timeLabel}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <BlurView intensity={80} tint="dark" style={styles.modalBg}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.container}>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.headerTitle}>{meal?.food_name || 'Meal Chat'}</Text>
                                <Text style={styles.headerSub}>{t('chatWithFriend') || 'Chatting with friend'}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={24} color={theme.colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View style={styles.loading}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            </View>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                renderItem={renderMessage}
                                keyExtractor={item => item.id}
                                contentContainerStyle={styles.listContent}
                                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            />
                        )}

                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                        >
                            {showEmojis && (
                                <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={styles.emojiRow}>
                                    <View style={styles.emojiScrollContainer}>
                                        <FlatList
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            data={FOOD_EMOJIS}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity onPress={() => addEmoji(item)} style={styles.emojiItem}>
                                                    <Text style={styles.emojiText}>{item}</Text>
                                                </TouchableOpacity>
                                            )}
                                            keyExtractor={item => item}
                                            contentContainerStyle={styles.emojiList}
                                        />
                                    </View>
                                </Animated.View>
                            )}
                            <View style={styles.inputArea}>
                                <TouchableOpacity
                                    onPress={() => setShowEmojis(!showEmojis)}
                                    style={[styles.emojiToggle, showEmojis && styles.emojiToggleActive]}
                                >
                                    <Smile size={22} color={showEmojis ? theme.colors.primary : theme.colors.text.muted} />
                                </TouchableOpacity>
                                <TextInput
                                    ref={inputRef}
                                    style={styles.textInput}
                                    placeholder={t('typeMessage') || 'Send message...'}
                                    placeholderTextColor={theme.colors.text.muted}
                                    value={input}
                                    onChangeText={setInput}
                                    onFocus={() => setShowEmojis(false)}
                                    multiline
                                />
                                <TouchableOpacity
                                    onPress={handleSend}
                                    style={styles.sendBtn}
                                    disabled={!input.trim()}
                                >
                                    <LinearGradient
                                        colors={theme.colors.gradients.primary as any}
                                        style={styles.sendGradient}
                                    >
                                        <Send size={18} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </SafeAreaView>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBg: { flex: 1 },
    safeArea: { flex: 1 },
    container: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary },
    headerSub: { fontSize: 12, color: theme.colors.text.muted, marginTop: 2 },
    closeBtn: { padding: 8 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20 },
    messageWrapper: { flexDirection: 'row', marginBottom: 16, maxWidth: '80%' },
    myMsgWrapper: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
    theirMsgWrapper: { alignSelf: 'flex-start', justifyContent: 'flex-start' },
    miniAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'flex-end' },
    avatarImg: { width: '100%', height: '100%' },
    avatarPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bubble: { padding: 12, borderRadius: 20 },
    myBubble: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
    theirBubble: { backgroundColor: 'rgba(255,255,255,0.05)', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    messageText: { fontSize: 15, lineHeight: 20 },
    myText: { color: '#fff' },
    theirText: { color: theme.colors.text.primary },
    timeLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, alignSelf: 'flex-end' },
    inputArea: {
        flexDirection: 'row',
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 16 : 24,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        alignItems: 'flex-end',
        gap: 12
    },
    textInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingTop: 10,
        color: theme.colors.text.primary,
        fontSize: 15,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
    sendGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emojiRow: {
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 12,
    },
    emojiScrollContainer: {
        height: 44,
    },
    emojiList: {
        paddingHorizontal: 16,
        gap: 12,
    },
    emojiItem: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
    },
    emojiText: {
        fontSize: 22,
    },
    emojiToggle: {
        padding: 4,
    },
    emojiToggleActive: {
        transform: [{ scale: 1.1 }]
    }
});
