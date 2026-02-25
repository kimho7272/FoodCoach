import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { supabase } from '../lib/supabase';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTACTS_CACHE_KEY = 'foodcoach_contacts_cache';

export interface Friend {
    id: string;
    full_name: string | null; // This will hold the phonebook name primarily
    nickname: string | null;  // This is the DB nickname
    avatar_url: string | null;
    phone: string | null;
    status: 'pending' | 'accepted' | 'sent' | 'none';
    is_registered: boolean;
    request_sent_at?: string;
}

export const socialService = {
    // 1. Permission & Fetch Contacts
    async getContacts(): Promise<Contacts.Contact[] | null> {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
                sort: Contacts.SortTypes.FirstName, // Sort locally by default
            });
            return data;
        }
        return null;
    },

    // 2. Normalize Phone Number (Flexible)
    normalizePhone(phone: string): string {
        // Return ONLY digits to make matching completely format-agnostic
        // This handles (469) 123-4567, +14691234567, 4691234567 consistently
        return phone.replace(/\D/g, '');
    },

    // 3. Find Friends on FoodCoach (Matches contacts with Profiles)
    // 3. Get Device Contacts (Fast, Local Only)
    async getPhoneContacts(): Promise<Friend[]> {
        const contacts = await this.getContacts();
        if (!contacts || contacts.length === 0) return [];

        const results: Friend[] = [];
        const seenNumbers = new Set<string>();

        contacts.forEach(c => {
            if (c.phoneNumbers && c.phoneNumbers.length > 0) {
                c.phoneNumbers.forEach(pn => {
                    const rawPhone = pn.number;
                    if (rawPhone) {
                        const normalized = this.normalizePhone(rawPhone);
                        // Minimum length check (7 digits) to avoid overly broad matches
                        if (normalized.length >= 7 && !seenNumbers.has(normalized)) {
                            seenNumbers.add(normalized);
                            const contactName = c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || null;

                            results.push({
                                id: normalized,
                                full_name: contactName,
                                nickname: null,
                                avatar_url: c.image?.uri || null,
                                phone: normalized,
                                status: 'none',
                                is_registered: false
                            });
                        }
                    }
                });
            }
        });

        results.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
        return results;
    },

    // 3.5 Sync Contacts with App (Slower, Network)
    async syncContactsWithApp(localFriends: Friend[]): Promise<Friend[]> {
        if (localFriends.length === 0) return [];

        const phoneNumbers = localFriends.map(f => f.phone).filter(p => p !== null) as string[];
        if (phoneNumbers.length === 0) return localFriends;

        // Build a flexible search query using OR with suffix matching
        const conditions = phoneNumbers.map(num => {
            const digits = num.replace(/\D/g, '');
            // Use last 8 digits for DB search - covers most unique local parts 
            // and handles cases with or without country code prefixes (1 or +1)
            const matchPart = digits.length >= 8 ? digits.slice(-8) : digits;
            return `phone.ilike.%${matchPart}`;
        });

        // Split into batches if too many contacts to avoid URL length issues
        let allMatchingProfiles: any[] = [];
        const batchSize = 25; // Smaller batch size for high reliability on mobile networks

        for (let i = 0; i < conditions.length; i += batchSize) {
            const batch = conditions.slice(i, i + batchSize);
            const { data, error } = await (supabase as any)
                .from('profiles')
                .select('id, full_name, nickname, avatar_url, phone')
                .or(batch.join(','));

            if (error) {
                console.error('Error finding friends batch:', error);
            } else if (data) {
                allMatchingProfiles = [...allMatchingProfiles, ...data];
            }
        }

        // Get my info for self-filtering and friendship status
        const { data: { user } } = await supabase.auth.getUser();
        let friendships: any[] = [];
        if (user) {
            const { data: fs } = await (supabase as any)
                .from('friendships')
                .select('*')
                .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);
            friendships = fs || [];
        }

        // Rebuild list with enriched data by matching suffixes in memory
        const enriched = localFriends.map(local => {
            if (!local.phone) return local;

            // Find matching profile in the fetched pool (Robust Digit-only match)
            // Use the last 10 digits as a definitive common identifier (US standard)
            const cleanLocal = local.phone.replace(/\D/g, '');
            const localSuffix = cleanLocal.length >= 10 ? cleanLocal.slice(-10) : cleanLocal;

            const registered = allMatchingProfiles.find(p => {
                const cleanDB = p.phone ? p.phone.replace(/\D/g, '') : '';
                const dbSuffix = cleanDB.length >= 10 ? cleanDB.slice(-10) : cleanDB;

                // If the stored DB number is exactly equal to local suffix or vice-versa
                return localSuffix && dbSuffix && (localSuffix === dbSuffix || cleanLocal === cleanDB);
            });

            if (registered) {
                console.log(`[PhoneMatch] Matching ${local.full_name} with DB User: ${registered.nickname}`);
                if (user && registered.id === user.id) return null; // Filter out self

                let status: Friend['status'] = 'none';
                let requestSentAt: string | undefined = undefined;

                if (user) {
                    const f = friendships.find((fs: any) =>
                        (fs.user_id_1 === user.id && fs.user_id_2 === registered.id) ||
                        (fs.user_id_2 === user.id && fs.user_id_1 === registered.id)
                    );
                    if (f) {
                        if (f.status === 'accepted') status = 'accepted';
                        else if (f.status === 'pending') {
                            status = f.user_id_1 === user.id ? 'sent' : 'pending';
                            if (status === 'sent') requestSentAt = f.created_at;
                        }
                    }
                }

                // ABSOLUTE DEFINITIVE NAME PRIORITY
                const phonebookName = local.full_name;
                const dbNickname = registered.nickname;
                const dbFullName = registered.full_name;

                // If we have a phonebook name, it's the ONLY one that matters for display
                const hasRealPhonebookName = phonebookName && phonebookName.length > 0 && phonebookName !== local.phone;
                const finalDisplayName = hasRealPhonebookName ? phonebookName : (dbFullName || dbNickname || 'User');

                console.log(`[CONSTRUCT_OBJECT] ${local.phone} -> full_name: "${finalDisplayName}", nickname: "${dbNickname}"`);

                return {
                    id: registered.id,
                    full_name: finalDisplayName,
                    nickname: dbNickname,
                    avatar_url: registered.avatar_url || local.avatar_url,
                    phone: local.phone,
                    is_registered: true,
                    status,
                    request_sent_at: requestSentAt
                } as Friend;
            }
            return local;
        }).filter(f => f !== null) as Friend[];

        enriched.sort((a, b) => {
            if (a.is_registered && !b.is_registered) return -1;
            if (!a.is_registered && b.is_registered) return 1;
            if (a.status === 'accepted' && b.status !== 'accepted') return -1;
            if (a.status !== 'accepted' && b.status === 'accepted') return 1;
            return (a.full_name || '').localeCompare(b.full_name || '');
        });

        // Store in cache for next time
        try {
            const cacheData = enriched.filter(f => f.is_registered).map(f => ({
                phone: f.phone,
                registeredData: f
            }));
            await AsyncStorage.setItem(CONTACTS_CACHE_KEY, JSON.stringify(cacheData));
        } catch (e) {
            console.error('Error saving contacts cache:', e);
        }

        return enriched;
    },

    // NEW: Get cached results for instant display
    async getCachedSync(localFriends: Friend[]): Promise<Friend[]> {
        try {
            const cachedBody = await AsyncStorage.getItem(CONTACTS_CACHE_KEY);
            if (!cachedBody) return localFriends;

            const cache = JSON.parse(cachedBody) as Array<{ phone: string, registeredData: Friend }>;
            const enriched = localFriends.map(local => {
                const match = cache.find(c => c.phone === local.phone);
                if (match) {
                    // Combine local name with cached registration status
                    return {
                        ...match.registeredData,
                        full_name: local.full_name || match.registeredData.full_name
                    };
                }
                return local;
            });

            // Keep sorting consistent with syncContactsWithApp
            return enriched.sort((a, b) => {
                if (a.is_registered && !b.is_registered) return -1;
                if (!a.is_registered && b.is_registered) return 1;
                if (a.status === 'accepted' && b.status !== 'accepted') return -1;
                if (a.status !== 'accepted' && b.status === 'accepted') return 1;
                return (a.full_name || '').localeCompare(b.full_name || '');
            });
        } catch (e) {
            return localFriends;
        }
    },

    // Legacy method wrapper (optional, but keeping it for safety if used elsewhere)
    async findFriendsInContacts(): Promise<Friend[]> {
        const local = await this.getPhoneContacts();
        return this.syncContactsWithApp(local);
    },

    // 4. Send Friend Request
    async sendFriendRequest(targetUserId: string): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await (supabase as any)
            .from('friendships')
            .upsert({
                user_id_1: user.id,
                user_id_2: targetUserId,
                status: 'pending',
                created_at: new Date().toISOString()
            }, { onConflict: 'user_id_1,user_id_2' });

        if (error) {
            console.error('Error sending request:', error);
            return false;
        }

        // Update local cache for instant feedback
        try {
            const cachedBody = await AsyncStorage.getItem(CONTACTS_CACHE_KEY);
            if (cachedBody) {
                const cache = JSON.parse(cachedBody) as Array<{ phone: string, registeredData: Friend }>;
                const updatedCache = cache.map(item => {
                    if (item.registeredData.id === targetUserId) {
                        return {
                            ...item,
                            registeredData: {
                                ...item.registeredData,
                                status: 'sent' as const
                            }
                        };
                    }
                    return item;
                });
                await AsyncStorage.setItem(CONTACTS_CACHE_KEY, JSON.stringify(updatedCache));
            }
        } catch (e) {
            console.error('Error updating cache after request:', e);
        }

        return true;
    },

    // 5. Accept Friend Request
    async acceptFriendRequest(friendshipId: string): Promise<boolean> {
        const { error } = await (supabase as any)
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', friendshipId);

        return !error;
    },

    // 6. Invite via SMS
    async inviteViaSMS(phoneNumber: string) {
        const isAvailable = await SMS.isAvailableAsync();
        if (isAvailable) {
            const { result } = await SMS.sendSMSAsync(
                [phoneNumber],
                'Hey! Join me on FoodCoach to track our meals and get healthy together! Download here: [Link]'
            );
        } else {
            Alert.alert('SMS not available', 'Cannot send SMS on this device.');
        }
    },

    // 7. Get Pending Requests (Requests sent to ME)
    async getPendingRequests(): Promise<any[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data: requests, error } = await (supabase as any)
            .from('friendships')
            .select(`
                id,
                created_at,
                sender:user_id_1(id, full_name, nickname, avatar_url, phone)
            `)
            .eq('user_id_2', user.id)
            .eq('status', 'pending');

        if (error) {
            console.error('Error fetching pending requests:', error);
            return [];
        }

        // Match pending requests with local names
        const localContacts = await this.getPhoneContacts();

        return requests.map((r: any) => {
            const sender = r.sender;
            let displayName = sender.full_name || sender.nickname;

            if (sender.phone) {
                const matched = localContacts.find(c =>
                    c.phone && (sender.phone.endsWith(c.phone) || c.phone.endsWith(sender.phone.replace('+', '')))
                );
                if (matched && matched.full_name && matched.full_name !== sender.phone) {
                    displayName = matched.full_name;
                }
            }

            return {
                id: r.id, // Friendship ID
                sender: {
                    ...sender,
                    full_name: displayName // Use matched name as full_name for UI
                },
                created_at: r.created_at
            };
        });
    },

    // 8. Reject/Cancel Friend Request
    async rejectFriendRequest(friendshipId: string): Promise<boolean> {
        const { error } = await (supabase as any)
            .from('friendships')
            .delete()
            .eq('id', friendshipId);
        return !error;
    },

    // 9. Get My Friends (with local name matching)
    async getMyFriends(): Promise<Friend[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // 1. Fetch local contacts for name matching
        const localContacts = await this.getPhoneContacts();

        // 2. Fetch friendships from DB
        const { data: friendships, error } = await (supabase as any)
            .from('friendships')
            .select(`
                id,
                status,
                user_id_1,
                user_id_2,
                profile1:profiles!friendships_user_id_1_fkey(id, full_name, nickname, avatar_url, phone),
                profile2:profiles!friendships_user_id_2_fkey(id, full_name, nickname, avatar_url, phone)
            `)
            .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
            .eq('status', 'accepted');

        if (error) {
            console.error('Error fetching friends:', error);
            return [];
        }

        // 3. Normalize and enrich the list with local names
        const friends: Friend[] = [];
        friendships.forEach((f: any) => {
            const isUser1 = f.user_id_1 === user.id;
            const friendProfile: any = isUser1 ? f.profile2 : f.profile1;

            if (friendProfile) {
                // Find matching local contact by phone suffix (Robust Digit-only match)
                const cleanDBPhone = friendProfile.phone ? friendProfile.phone.replace(/\D/g, '') : '';
                const matchedContact = cleanDBPhone ? localContacts.find(c => {
                    const cleanLocal = c.phone ? c.phone.replace(/\D/g, '') : '';
                    return cleanLocal && (cleanDBPhone.endsWith(cleanLocal) || cleanLocal.endsWith(cleanDBPhone));
                }) : null;

                // ABSOLUTE DEFINITIVE NAME PRIORITY for existing friends
                const dbName = friendProfile.full_name || friendProfile.nickname;
                const phoneName = matchedContact?.full_name;
                const hasRealPhoneName = phoneName && phoneName.length > 0 && phoneName !== friendProfile.phone;
                const finalDisplayName = hasRealPhoneName ? phoneName : (dbName || 'User');

                console.log(`[MYFRIENDS_FINAL] ${friendProfile.phone} -> ${finalDisplayName}`);

                friends.push({
                    id: friendProfile.id,
                    full_name: finalDisplayName,
                    nickname: friendProfile.nickname,
                    avatar_url: friendProfile.avatar_url,
                    phone: friendProfile.phone,
                    status: 'accepted',
                    is_registered: true
                });
            }
        });
        return friends;
    }
};
