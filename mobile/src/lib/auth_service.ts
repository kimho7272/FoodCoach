import { supabase } from './supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Provider } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = Linking.createURL('/');

export const signInWithSocial = async (
    provider: 'google' | 'apple' | 'kakao',
    additionalData?: { nickname?: string; height?: number; weight?: number }
) => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider as Provider,
            options: {
                redirectTo,
                skipBrowserRedirect: true,
            },
        });

        if (error) throw error;

        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

        if (res.type === 'success' && res.url) {
            // Supabase returns tokens in the hash fragment (#), not as query parameters (?)
            const fragment = res.url.split('#')[1];
            if (!fragment) throw new Error('No auth tokens found in URL fragment');

            const params = new URLSearchParams(fragment);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            if (!access_token || !refresh_token) {
                throw new Error('No access_token or refresh_token found in response');
            }

            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: access_token as string,
                refresh_token: refresh_token as string,
            });

            if (sessionError) throw sessionError;

            // Sync user profile with login time and any provided data
            if (sessionData.user) {
                await syncUserProfile(sessionData.user, additionalData);
            }

            return { user: sessionData.user, error: null };
        }

        return { user: null, error: new Error('Authentication cancelled') };
    } catch (err: any) {
        console.error(`Auth Error (${provider}):`, err.message);
        return { user: null, error: err };
    }
};

const syncUserProfile = async (user: any, additionalData?: { nickname?: string; height?: number; weight?: number }) => {
    const { id, email, user_metadata } = user;

    const updateData: any = {
        id,
        email,
        full_name: user_metadata.full_name || user_metadata.name || 'User',
        avatar_url: user_metadata.avatar_url || user_metadata.picture,
        last_login: new Date().toISOString(),
    };

    // 값이 있을 때만 객체에 추가 (이미 저장된 데이터를 NULL로 덮어쓰지 않기 위함)
    if (additionalData?.nickname) updateData.nickname = additionalData.nickname;
    if (additionalData?.height) updateData.height = additionalData.height;
    if (additionalData?.weight) updateData.weight = additionalData.weight;

    const { error } = await supabase.from('profiles').upsert(updateData, {
        onConflict: 'id'
    });

    if (error) {
        console.error('Profile Sync Error:', error.message);
    }
};

/**
 * 로그인 이후에 프로필 정보를 따로 업데이트할 때 사용합니다.
 */
export const updateProfile = async (
    userId: string,
    data: { nickname?: string; height?: number; weight?: number }
) => {
    const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);

    if (error) {
        console.error('Update Profile Error:', error.message);
        return { success: false, error };
    }
    return { success: true, error: null };
};
