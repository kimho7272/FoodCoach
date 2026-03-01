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
    Dimensions,
    ScrollView,
    Keyboard
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Send, User, Smile, Plus, Camera, Image as ImageIcon, Flame, Zap, BarChart2, ArrowUp, Calendar, MapPin, Clock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { theme } from '../constants/theme';
import { messageService, SocialMessage } from '../services/message_service';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import ImageView from 'react-native-image-viewing';

const { width, height } = Dimensions.get('window');

interface MealChatModalProps {
    isVisible: boolean;
    onClose: () => void;
    meal?: any;
    otherUserId: string;
    otherUserNickname?: string;
}

const FOOD_EMOJIS = ['😋', '🥗', '🍗', '🍎', '🍱', '🥘', '🍳', '🥑', '🥦', '🥕', '🥩', '🍕', '🍔', '🍦', '🍩', '🥤', '☕', '✨', '👍', '🙌', '🔥', '😻'];
const PAGE_SIZE = 100;

export const MealChatModal: React.FC<MealChatModalProps> = ({ isVisible, onClose, meal, otherUserId, otherUserNickname }) => {
    const { t, language } = useTranslation();
    const [messages, setMessages] = useState<SocialMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [input, setInput] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showEmojis, setShowEmojis] = useState(false);
    const [sendingImage, setSendingImage] = useState(false);
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const [detailMeal, setDetailMeal] = useState<any>(null);
    const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
    const [attachedMeal, setAttachedMeal] = useState<any>(meal || null);
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (isVisible && otherUserId) {
            supabase.from('profiles').select('*').eq('id', otherUserId).single().then(({ data }) => {
                setOtherUserProfile(data);
            });
        }
    }, [isVisible, otherUserId]);

    const fetchCurrentUserId = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
        return user?.id;
    };

    useEffect(() => {
        if (isVisible && otherUserId) {
            setAttachedMeal(meal || null);
            setMessages([]);
            setOffset(0);
            setHasMore(true);

            const initializeChat = async () => {
                const uid = currentUserId || (await fetchCurrentUserId());
                if (uid) {
                    loadInitialMessages();
                }
            };

            initializeChat();

            // Initial focus and scroll
            setTimeout(() => {
                inputRef.current?.focus();
            }, 400);

            [500, 800, 1200, 1600].forEach(delay => {
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, delay);
            });

            const keyboardShowListener = Keyboard.addListener(
                Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
                () => {
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                }
            );

            let cleanup: (() => void) | undefined;
            if (currentUserId) {
                cleanup = setupSubscription();
            }

            return () => {
                keyboardShowListener.remove();
                if (cleanup) cleanup();
            };
        }
    }, [isVisible, otherUserId, meal, currentUserId]);

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
    };

    const loadInitialMessages = async () => {
        setLoading(true);
        const { data } = await messageService.getMessages(otherUserId, 0, PAGE_SIZE);
        if (data) {
            setMessages(data);
            setOffset(data.length);
            if (data.length < PAGE_SIZE) setHasMore(false);
            messageService.markAsRead(otherUserId);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
        }
        setLoading(false);
    };

    const loadMoreMessages = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const { data } = await messageService.getMessages(otherUserId, offset, PAGE_SIZE);
        if (data && data.length > 0) {
            setMessages(prev => [...data, ...prev]);
            setOffset(prev => prev + data.length);
            if (data.length < PAGE_SIZE) setHasMore(false);
        } else {
            setHasMore(false);
        }
        setLoadingMore(false);
    };

    const setupSubscription = () => {
        if (!currentUserId) return undefined;

        console.log(`[CHAT_SUBSCRIPTION] Starting for ${currentUserId} ↔ ${otherUserId}`);

        const channel = supabase
            .channel(`social_messages:${otherUserId}_${currentUserId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'social_messages'
            }, async (payload) => {
                const newMessage = payload.new as SocialMessage;

                // Debug log to trace message arrival
                console.log('[CHAT_SUBSCRIPTION] Message received:', newMessage.id);

                const isBetween = (newMessage.sender_id === currentUserId && newMessage.receiver_id === otherUserId) ||
                    (newMessage.sender_id === otherUserId && newMessage.receiver_id === currentUserId);

                if (!isBetween) {
                    console.log('[CHAT_SUBSCRIPTION] Ignored: not between us.');
                    return;
                }

                if (newMessage.sender_id !== currentUserId) {
                    const { data: sender } = await supabase.from('profiles').select('full_name, avatar_url, nickname').eq('id', newMessage.sender_id).single();
                    newMessage.sender = (sender || undefined) as any;
                }

                setMessages(prev => {
                    if (prev.find(m => m.id === newMessage.id)) {
                        console.log('[CHAT_SUBSCRIPTION] Duplicate ignored.');
                        return prev;
                    }
                    console.log('[CHAT_SUBSCRIPTION] Updating state with new message.');
                    return [...prev, newMessage];
                });

                if (newMessage.receiver_id === currentUserId) {
                    messageService.markAsRead(otherUserId);
                }

                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            })
            .subscribe((status) => {
                console.log(`[CHAT_SUBSCRIPTION] Status: ${status}`);
            });

        return () => {
            console.log(`[CHAT_SUBSCRIPTION] Cleanup for ${otherUserId}`);
            supabase.removeChannel(channel);
        };
    };

    const handleSend = async () => {
        if (!input.trim() && !attachedMeal && !attachedImage) return;

        const content = input.trim();
        setInput('');
        setShowEmojis(false);
        setSendingImage(true);

        try {
            let mediaUrl = undefined;
            if (attachedImage) {
                const manipulated = await ImageManipulator.manipulateAsync(
                    attachedImage,
                    [{ resize: { width: 1024 } }],
                    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                );
                const { url } = await messageService.uploadMedia(currentUserId!, manipulated.base64!);
                mediaUrl = url || undefined;
            }

            let type: 'text' | 'image' | 'meal' = 'text';
            if (attachedMeal) type = 'meal';
            else if (mediaUrl) type = 'image';

            const { data } = await messageService.sendMessage(otherUserId, content, type, {
                mealId: attachedMeal?.id,
                mediaUrl: mediaUrl
            });

            if (data) {
                setMessages(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data]);
                setAttachedMeal(null);
                setAttachedImage(null);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
        } catch (e) {
            console.error('[CHAT_SEND_ERROR]', e);
        } finally {
            setSendingImage(false);
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
        if (!result.canceled) {
            setAttachedImage(result.assets[0].uri);
            setShowPlusMenu(false);
            // Small delay to let UI update then scroll
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
        }
    };

    const handleTakePicture = async () => {
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
        if (!result.canceled) {
            setAttachedImage(result.assets[0].uri);
            setShowPlusMenu(false);
            // Small delay to let UI update then scroll
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
        }
    };

    const addEmoji = (emoji: string) => setInput(prev => prev + emoji);

    const handleMealPress = async (mealId: string | number) => {
        const { data } = await supabase.from('food_logs').select('*').eq('id', mealId).single();
        if (data) setDetailMeal(data);
    };

    const renderMessage = ({ item }: { item: SocialMessage }) => {
        const isMine = item.sender_id === currentUserId;
        const isMedia = item.type === 'image' || item.type === 'gif' || item.type === 'meal';
        const timestamp = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <View style={[styles.messageWrapper, isMine ? styles.myMsgWrapper : styles.theirMsgWrapper]}>
                <View style={[styles.bubbleContainer, isMine ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' }]}>
                    <View style={[
                        styles.bubble,
                        isMine ? styles.myBubble : styles.theirBubble,
                        isMedia && styles.mediaBubbleExtra,
                        { alignSelf: isMine ? 'flex-end' : 'flex-start' }
                    ]}>
                        {item.type === 'meal' && item.metadata?.meal_id && (
                            <TouchableOpacity onPress={() => handleMealPress(item.metadata.meal_id!)} style={styles.mealAttachment}>
                                <MealCardPreview mealId={item.metadata.meal_id} isMine={isMine} />
                            </TouchableOpacity>
                        )}
                        {(item.type === 'image' || item.type === 'gif') && (
                            <TouchableOpacity activeOpacity={0.9} onPress={() => setZoomImage(item.media_url || null)} style={styles.imageAttachment}>
                                <Image source={{ uri: item.media_url }} style={styles.contentImage} resizeMode="cover" />
                            </TouchableOpacity>
                        )}
                        {item.content ? (
                            <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText]}>{item.content}</Text>
                        ) : null}
                    </View>
                    <Text style={styles.timeLabel}>{timestamp}</Text>
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
                            <View style={styles.headerProfileRow}>
                                {otherUserProfile?.avatar_url ? (
                                    <Image source={{ uri: otherUserProfile.avatar_url }} style={styles.headerAvatar} />
                                ) : (
                                    <View style={styles.headerAvatarPlaceholder}><User size={18} color={theme.colors.text.muted} /></View>
                                )}
                                <View>
                                    <Text style={styles.headerTitle}>{otherUserNickname || otherUserProfile?.nickname || t('chatWithFriend') || (language === 'Korean' ? '친구와 채팅' : 'Chat')}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}><X size={24} color={theme.colors.text.primary} /></TouchableOpacity>
                        </View>

                        {loading ? (
                            <View style={styles.loading}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                renderItem={renderMessage}
                                keyExtractor={item => item.id}
                                contentContainerStyle={styles.listContent}
                                maintainVisibleContentPosition={{
                                    minIndexForVisible: 0,
                                }}
                                ListHeaderComponent={hasMore ? (
                                    <TouchableOpacity onPress={loadMoreMessages} style={styles.loadMoreBtn}>
                                        <Text style={styles.loadMoreText}>{t('loadPrevious') || (language === 'Korean' ? '이전 메시지 보기' : 'Load more')}</Text>
                                    </TouchableOpacity>
                                ) : null}
                                onContentSizeChange={() => !loadingMore && flatListRef.current?.scrollToEnd({ animated: true })}
                            />
                        )}

                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ flex: 0 }}
                        >
                            {(attachedMeal || attachedImage) && (
                                <View style={styles.attachmentZone}>
                                    <View style={styles.attachmentsRow}>
                                        {attachedMeal && (
                                            <BlurView intensity={30} style={styles.attachmentContent}>
                                                <Image source={{ uri: attachedMeal.image_url }} style={styles.attachmentImg} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.attachmentTitle} numberOfLines={1}>{attachedMeal.food_name}</Text>
                                                    <Text style={styles.attachmentSub}>{attachedMeal.meal_type}</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => setAttachedMeal(null)} style={styles.attachmentClose}>
                                                    <X size={16} color="#fff" />
                                                </TouchableOpacity>
                                            </BlurView>
                                        )}
                                        {attachedImage && (
                                            <BlurView intensity={30} style={styles.attachmentContent}>
                                                <Image source={{ uri: attachedImage }} style={styles.attachmentImg} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.attachmentTitle} numberOfLines={1}>{t('gallery') || (language === 'Korean' ? '사진' : 'Image')}</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => setAttachedImage(null)} style={styles.attachmentClose}>
                                                    <X size={16} color="#fff" />
                                                </TouchableOpacity>
                                            </BlurView>
                                        )}
                                    </View>
                                </View>
                            )}
                            {showEmojis && (
                                <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={styles.emojiRow}>
                                    <FlatList
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        data={FOOD_EMOJIS}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity onPress={() => addEmoji(item)} style={styles.emojiItem}><Text style={styles.emojiText}>{item}</Text></TouchableOpacity>
                                        )}
                                        keyExtractor={item => item}
                                        contentContainerStyle={styles.emojiList}
                                    />
                                </Animated.View>
                            )}
                            {showPlusMenu && (
                                <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={styles.plusMenu}>
                                    <TouchableOpacity style={styles.plusOption} onPress={handleTakePicture}>
                                        <View style={[styles.plusIconBg, { backgroundColor: '#6366f1' }]}><Camera size={20} color="#fff" /></View>
                                        <Text style={styles.plusText}>{t('camera') || (language === 'Korean' ? '카메라' : 'Camera')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.plusOption} onPress={handlePickImage}>
                                        <View style={[styles.plusIconBg, { backgroundColor: '#f59e0b' }]}><ImageIcon size={20} color="#fff" /></View>
                                        <Text style={styles.plusText}>{t('album') || (language === 'Korean' ? '앨범' : 'Album')}</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                            <View style={styles.inputArea}>
                                <TouchableOpacity onPress={() => { setShowPlusMenu(!showPlusMenu); setShowEmojis(false); }} style={[styles.plusBtn, showPlusMenu && styles.plusBtnActive]}>
                                    <Plus size={24} color={showPlusMenu ? theme.colors.primary : theme.colors.text.muted} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { setShowEmojis(!showEmojis); setShowPlusMenu(false); }} style={[styles.emojiToggle, showEmojis && styles.emojiToggleActive]}>
                                    <Smile size={22} color={showEmojis ? theme.colors.primary : theme.colors.text.muted} />
                                </TouchableOpacity>
                                <TextInput
                                    ref={inputRef}
                                    style={styles.textInput}
                                    placeholder={t('typeMessage') || (language === 'Korean' ? '메시지 입력...' : 'Send...')}
                                    placeholderTextColor={theme.colors.text.muted}
                                    value={input}
                                    onChangeText={setInput}
                                    onFocus={() => { setShowEmojis(false); setShowPlusMenu(false); }}
                                    multiline
                                />
                                <TouchableOpacity
                                    onPress={handleSend}
                                    style={styles.sendBtn}
                                    disabled={!input.trim() && !attachedMeal && !attachedImage}
                                >
                                    <LinearGradient colors={theme.colors.gradients.primary as any} style={styles.sendGradient}><Send size={18} color="#fff" /></LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </SafeAreaView>
            </BlurView>
            <ImageView
                images={zoomImage ? [{ uri: zoomImage }] : []}
                visible={!!zoomImage}
                imageIndex={0}
                onRequestClose={() => setZoomImage(null)}
            />
            {detailMeal && <MealDetailCardModal isVisible={!!detailMeal} onClose={() => setDetailMeal(null)} meal={detailMeal} language={language} />}
        </Modal>
    );
};

const localizeMealType = (type: string, lang: string) => {
    if (lang !== 'Korean') return type;
    const map: Record<string, string> = {
        'Breakfast': '아침',
        'Lunch': '점심',
        'Dinner': '저녁',
        'Snack': '간식'
    };
    return map[type] || type;
};

const MealCardPreview = ({ mealId, isMine }: { mealId: string | number, isMine: boolean }) => {
    const { language } = useTranslation();
    const [meal, setMeal] = useState<any>(null);
    useEffect(() => {
        supabase.from('food_logs').select('*').eq('id', mealId).single().then(({ data }) => setMeal(data));
    }, [mealId]);

    if (!meal) return null;

    return (
        <View style={[styles.mealCardPreview, isMine ? styles.myMealCard : styles.theirMealCard]}>
            <View style={styles.previewHeader}>
                <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{localizeMealType(meal.meal_type, language)}</Text></View>
                <Text style={styles.previewTitle} numberOfLines={1}>
                    {language === 'Korean' && meal.food_name_ko ? meal.food_name_ko : meal.food_name}
                </Text>
            </View>
            <View style={styles.previewContent}>
                <Image source={{ uri: meal.image_url }} style={styles.previewImg} />
                <View style={styles.previewStats}>
                    <View style={styles.miniMacro}><Flame size={10} color={theme.colors.secondary} /><Text style={styles.miniMacroText}>{meal.calories}</Text></View>
                    <View style={styles.miniMacro}><Zap size={10} color={theme.colors.primary} /><Text style={styles.miniMacroText}>{meal.protein}</Text></View>
                </View>
            </View>
        </View>
    );
};

const MealDetailCardModal = ({ isVisible, onClose, meal, language }: { isVisible: boolean, onClose: () => void, meal: any, language: string }) => {
    return (
        <Modal visible={isVisible} animationType="fade" transparent={true}>
            <View style={styles.detailOverlay}>
                <TouchableOpacity style={styles.detailBackdrop} onPress={onClose} />
                <BlurView intensity={95} tint="dark" style={styles.detailCard}>
                    <View style={styles.detailHeader}>
                        <Text style={styles.detailTitle}>
                            {language === 'Korean' && meal.food_name_ko ? meal.food_name_ko : meal.food_name}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.detailClose}><X size={24} color="#fff" /></TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Image source={{ uri: meal.image_url }} style={styles.detailImg} resizeMode="cover" />
                        <View style={styles.detailBody}>
                            <View style={styles.tagRow}>
                                <View style={styles.mealTypeTag}><Text style={styles.mealTypeTagText}>{localizeMealType(meal.meal_type, language)}</Text></View>
                                <View style={styles.healthTag}><Text style={styles.healthTagText}>{language === 'Korean' ? '건강 점수' : 'Score'}: {meal.health_score}</Text></View>
                            </View>
                            <View style={styles.macroGrid}>
                                {[
                                    { icon: <Flame size={20} color={theme.colors.secondary} />, val: meal.calories, label: 'kcal' },
                                    { icon: <Zap size={20} color={theme.colors.primary} />, val: meal.protein, label: language === 'Korean' ? '단백질' : 'Protein' },
                                    { icon: <BarChart2 size={20} color="#818cf8" />, val: meal.fat, label: language === 'Korean' ? '지방' : 'Fat' },
                                    { icon: <ArrowUp size={20} color="#ec4899" />, val: meal.carbs, label: language === 'Korean' ? '탄수' : 'Carbs' }
                                ].map((m, i) => (
                                    <View key={i} style={styles.macroBox}>{m.icon}<Text style={styles.macroVal}>{m.val}</Text><Text style={styles.macroLabel}>{m.label}</Text></View>
                                ))}
                            </View>
                            {meal.description && (
                                <View style={styles.infoSection}>
                                    <Text style={styles.sectionTitle}>{language === 'Korean' ? '분석' : 'Analysis'}</Text>
                                    <Text style={styles.descriptionText}>
                                        {language === 'Korean' && meal.description_ko ? meal.description_ko : meal.description}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </BlurView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBg: { flex: 1 },
    safeArea: { flex: 1 },
    container: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 1)' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#0f172a',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    headerProfileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerAvatar: { width: 40, height: 40, borderRadius: 20 },
    headerAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    headerSub: { fontSize: 11, color: theme.colors.text.muted, marginTop: 2 },
    closeBtn: { padding: 4 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 30 },
    loadMoreBtn: { padding: 10, alignItems: 'center' },
    loadMoreText: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },
    messageWrapper: { marginBottom: 16, width: '100%' },
    myMsgWrapper: { alignItems: 'flex-end' },
    theirMsgWrapper: { alignItems: 'flex-start' },
    bubbleContainer: {
        alignItems: 'flex-end',
        maxWidth: '85%',
        gap: 6,
    },
    bubble: {
        padding: 12,
        borderRadius: 20,
    },
    myBubble: {
        backgroundColor: '#FFD700',
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: '#1E293B',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    mediaBubbleExtra: {
        padding: 8,
        maxWidth: width * 0.72,
    },
    messageText: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
    myText: { color: '#000' },
    theirText: { color: '#f8fafc' },
    timeLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 2, fontWeight: '700' },
    imageAttachment: {
        width: width * 0.65,
        height: width * 0.65,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#111827',
    },
    contentImage: { width: '100%', height: '100%' },
    mealAttachment: { marginBottom: 4 },
    mealCardPreview: {
        width: width * 0.65,
        borderRadius: 14,
        padding: 12,
        backgroundColor: '#111827', // Solid background
    },
    myMealCard: {
        backgroundColor: '#111827',
    },
    theirMealCard: {
        backgroundColor: '#111827',
    },
    previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    typeBadge: { backgroundColor: theme.colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    typeBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },
    previewTitle: { fontSize: 14, fontWeight: '800', color: '#fff', flex: 1 },
    previewContent: { flexDirection: 'row', gap: 12 },
    previewImg: { width: 60, height: 60, borderRadius: 12 },
    previewStats: { justifyContent: 'center', gap: 6 },
    miniMacro: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    miniMacroText: { fontSize: 11, color: theme.colors.text.secondary, fontWeight: '700' },
    inputArea: {
        flexDirection: 'row',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        backgroundColor: '#0f172a',
        alignItems: 'flex-end',
        gap: 8,
    },
    plusBtn: { padding: 8 },
    plusBtnActive: { opacity: 0.7 },
    emojiToggle: { padding: 8 },
    emojiToggleActive: { opacity: 0.7 },
    textInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        color: '#fff',
        fontSize: 15,
        maxHeight: 120,
    },
    sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
    sendGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emojiRow: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingVertical: 12 },
    emojiList: { paddingHorizontal: 16, gap: 12 },
    emojiItem: { padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
    emojiText: { fontSize: 24 },
    plusMenu: { flexDirection: 'row', padding: 20, gap: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    plusOption: { alignItems: 'center' },
    plusIconBg: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    plusText: { color: '#fff', fontSize: 12 },
    detailOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    detailBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
    detailCard: { width: width * 0.9, borderRadius: 24, overflow: 'hidden' },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
    detailTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
    detailClose: { padding: 4 },
    detailImg: { width: '100%', height: 250 },
    detailBody: { padding: 20 },
    tagRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    mealTypeTag: { backgroundColor: theme.colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    mealTypeTagText: { color: '#fff', fontWeight: '800' },
    healthTag: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    healthTagText: { color: '#fff' },
    macroGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    macroBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 16, width: '23%' },
    macroVal: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 4 },
    macroLabel: { fontSize: 10, color: theme.colors.text.muted },
    infoSection: { marginTop: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 8 },
    descriptionText: { color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
    attachmentZone: {
        paddingHorizontal: 16,
        paddingTop: 8,
        backgroundColor: '#0f172a',
    },
    attachmentsRow: {
        gap: 8,
    },
    attachmentContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        marginBottom: 8,
    },
    attachmentImg: { width: 44, height: 44, borderRadius: 8 },
    attachmentTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
    attachmentSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
    attachmentClose: { padding: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
    pendingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    pendingCard: { width: '100%', backgroundColor: '#1e293b', borderRadius: 24, padding: 20, gap: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    pendingHeader: { fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'center' },
    pendingImg: { width: '100%', height: height * 0.4, borderRadius: 16 },
    pendingActions: { flexDirection: 'row', gap: 12 },
    pendingCancel: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
    pendingCancelText: { color: '#fff', fontWeight: '800' },
    pendingConfirm: { flex: 2, borderRadius: 16, overflow: 'hidden' },
    pendingConfirmGradient: { flex: 1, padding: 16, alignItems: 'center' },
    pendingConfirmText: { color: '#fff', fontWeight: '900' },
});

export default MealChatModal;
