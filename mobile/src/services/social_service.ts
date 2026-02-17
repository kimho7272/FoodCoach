import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { supabase } from '../lib/supabase';
import { Alert, Platform } from 'react-native';

export interface Friend {
    id: string;
    full_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
    phone: string | null;
    status: 'pending' | 'accepted' | 'sent' | 'none'; // 'none' for unconnected/inviteable
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

    // 2. Normalize Phone Number (Simple MVP version)
    normalizePhone(phone: string): string {
        // Remove spaces, dashes, parentheses
        return phone.replace(/[\s\-\(\)]/g, '');
    },

    // 3. Find Friends on FoodCoach (Matches contacts with Profiles)
    // NOTE: In production, use a secure RPC. Here we client-side filter for MVP if acceptable,
    // or better, send list to DB. simpler: Query profiles where phone in list.
    // 3. Get Device Contacts (Fast, Local Only)
    async getPhoneContacts(): Promise<Friend[]> {
        const contacts = await this.getContacts();
        if (!contacts || contacts.length === 0) return [];

        const results: Friend[] = [];
        const seenNumbers = new Set<string>();

        contacts.forEach(c => {
            if (c.phoneNumbers && c.phoneNumbers.length > 0) {
                // Use the first valid mobile-like number
                const rawPhone = c.phoneNumbers[0].number;
                if (rawPhone) {
                    const normalized = this.normalizePhone(rawPhone);
                    if (normalized.length > 5 && !seenNumbers.has(normalized)) {
                        seenNumbers.add(normalized);
                        results.push({
                            id: normalized, // temporary ID
                            full_name: c.name,
                            nickname: null,
                            avatar_url: c.image?.uri || null,
                            phone: normalized,
                            status: 'none',
                            is_registered: false
                        });
                    }
                }
            }
        });

        // Basic sort
        results.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
        return results;
    },

    // 3.5 Sync Contacts with App (Slower, Network)
    async syncContactsWithApp(localFriends: Friend[]): Promise<Friend[]> {
        if (localFriends.length === 0) return [];

        const phoneNumbers = localFriends.map(f => f.phone).filter(p => p !== null) as string[];
        if (phoneNumbers.length === 0) return localFriends;

        // Query Supabase for these phones
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, full_name, nickname, avatar_url, phone')
            .in('phone', phoneNumbers);

        if (error) {
            console.error('Error finding friends:', error);
            return localFriends;
        }

        // Get my basic info for friendship check
        const { data: { user } } = await supabase.auth.getUser();

        let friendships: any[] = [];
        if (user) {
            const { data: fs } = await supabase
                .from('friendships')
                .select('*')
                .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);
            friendships = fs || [];
        }

        const registeredMap = new Map<string, any>();
        profiles?.forEach(p => {
            if (p.phone) registeredMap.set(p.phone, p);
        });

        // Rebuild list with enriched data
        const enriched = localFriends.map(local => {
            if (!local.phone) return local;

            const registered = registeredMap.get(local.phone);
            if (registered) {
                // It's a registered user
                if (user && registered.id === user.id) return null; // Filter out self

                // Determine status
                let status: Friend['status'] = 'none';
                let requestSentAt: string | undefined = undefined;

                if (user) {
                    const f = friendships.find((f: any) =>
                        (f.user_id_1 === user.id && f.user_id_2 === registered.id) ||
                        (f.user_id_2 === user.id && f.user_id_1 === registered.id)
                    );
                    if (f) {
                        if (f.status === 'accepted') status = 'accepted';
                        else if (f.status === 'pending') {
                            status = f.user_id_1 === user.id ? 'sent' : 'pending';
                            if (status === 'sent') {
                                requestSentAt = f.created_at;
                            }
                        }
                    }
                }

                return {
                    ...local,
                    id: registered.id, // Use Supabase ID
                    full_name: registered.full_name || local.full_name,
                    nickname: registered.nickname,
                    avatar_url: registered.avatar_url || local.avatar_url,
                    is_registered: true,
                    status,
                    request_sent_at: requestSentAt
                } as Friend;
            }
            return local;
        }).filter(f => f !== null) as Friend[];

        // Sort: Registered First, then Status, then Name
        enriched.sort((a, b) => {
            if (a.is_registered && !b.is_registered) return -1;
            if (!a.is_registered && b.is_registered) return 1;
            if (a.status === 'accepted' && b.status !== 'accepted') return -1;
            if (a.status !== 'accepted' && b.status === 'accepted') return 1;
            return (a.full_name || '').localeCompare(b.full_name || '');
        });

        return enriched;
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

        const { error } = await supabase
            .from('friendships')
            .insert({
                user_id_1: user.id,
                user_id_2: targetUserId,
                status: 'pending'
            });

        if (error) {
            console.error('Error sending request:', error);
            return false;
        }
        return true;
    },

    // 5. Accept Friend Request
    async acceptFriendRequest(friendshipId: string): Promise<boolean> {
        const { error } = await supabase
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

        const { data: requests, error } = await supabase
            .from('friendships')
            .select(`
                id,
                created_at,
                sender:user_id_1(id, full_name, nickname, avatar_url)
            `)
            .eq('user_id_2', user.id)
            .eq('status', 'pending');

        if (error) {
            console.error('Error fetching pending requests:', error);
            return [];
        }

        return requests.map(r => ({
            id: r.id, // Friendship ID
            sender: r.sender,
            created_at: r.created_at
        }));
    },

    // 8. Reject/Cancel Friend Request
    async rejectFriendRequest(friendshipId: string): Promise<boolean> {
        const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('id', friendshipId);
        return !error;
    },

    // 9. Get My Friends
    async getMyFriends(): Promise<Friend[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data: friendships, error } = await supabase
            .from('friendships')
            .select(`
                id,
                status,
                user_id_1,
                user_id_2,
                profile1:profiles!friendships_user_id_1_fkey(id, full_name, nickname, avatar_url),
                profile2:profiles!friendships_user_id_2_fkey(id, full_name, nickname, avatar_url)
            `)
            .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
            .eq('status', 'accepted');

        if (error) {
            console.error('Error fetching friends:', error);
            return [];
        }

        // Normalize the list
        const friends: Friend[] = [];
        friendships.forEach(f => {
            const isUser1 = f.user_id_1 === user.id;
            // Use the correct joined profile based on which ID is mine
            const friendProfile: any = isUser1 ? f.profile2 : f.profile1;
            // Check if friendProfile exists (could be null if join failed)
            if (friendProfile) {
                friends.push({
                    id: friendProfile.id,
                    full_name: friendProfile.full_name,
                    nickname: friendProfile.nickname,
                    avatar_url: friendProfile.avatar_url,
                    phone: null,
                    status: 'accepted',
                    is_registered: true
                });
            }
        });
        return friends;
    }
};
