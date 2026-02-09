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
    status: 'pending' | 'accepted' | 'sent'; // 'sent' means user sent request
}

export const socialService = {
    // 1. Permission & Fetch Contacts
    async getContacts(): Promise<Contacts.Contact[] | null> {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
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
    async findFriendsInContacts(): Promise<Friend[]> {
        const contacts = await this.getContacts();
        if (!contacts || contacts.length === 0) return [];

        // Extract phone numbers
        const phoneNumbers = contacts
            .flatMap(c => c.phoneNumbers?.map(p => this.normalizePhone(p.number || '')) || [])
            .filter(p => p.length > 5); // Filter invalid

        if (phoneNumbers.length === 0) return [];

        // Query Supabase for these phones
        // Note: This exposes who is on the app to the client, which is the point, but privacy-wise
        // usually done via hashed match or RPC.
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, full_name, nickname, avatar_url, phone')
            .in('phone', phoneNumbers); // Requires 'phone' column in profiles

        if (error) {
            console.error('Error finding friends:', error);
            return [];
        }

        // Check if I am already friends with them
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data: friendships } = await supabase
            .from('friendships')
            .select('*')
            .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

        // Map profiles to Friend objects including status
        return profiles
            .filter(p => p.id !== user.id) // Exclude self
            .map(p => {
                const friendship = friendships?.find(f =>
                    (f.user_id_1 === user.id && f.user_id_2 === p.id) ||
                    (f.user_id_2 === user.id && f.user_id_1 === p.id)
                );

                let status: Friend['status'] | undefined;
                if (friendship) {
                    if (friendship.status === 'accepted') status = 'accepted';
                    else if (friendship.status === 'pending') {
                        status = friendship.user_id_1 === user.id ? 'sent' : 'pending';
                    }
                }

                return {
                    id: p.id,
                    full_name: p.full_name,
                    nickname: p.nickname,
                    avatar_url: p.avatar_url,
                    phone: p.phone,
                    status: status as any // undefined means not connected
                };
            });
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
                    status: 'accepted'
                });
            }
        });
        return friends;
    }
};
