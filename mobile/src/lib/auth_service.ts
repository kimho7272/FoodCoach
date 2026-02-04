import { supabase } from './supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Provider } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = Linking.createURL('/');

export const signInWithSocial = async (provider: 'google' | 'apple' | 'kakao') => {
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
            const parsed = Linking.parse(res.url);
            const { access_token, refresh_token } = parsed.queryParams || {};

            if (!access_token || !refresh_token) {
                throw new Error('No auth tokens found in response');
            }

            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: access_token as string,
                refresh_token: refresh_token as string,
            });

            if (sessionError) throw sessionError;

            // Sync user profile with login time
            if (sessionData.user) {
                await syncUserProfile(sessionData.user);
            }

            return { user: sessionData.user, error: null };
        }

        return { user: null, error: new Error('Authentication cancelled') };
    } catch (err: any) {
        console.error(`Auth Error (${provider}):`, err.message);
        return { user: null, error: err };
    }
};

const syncUserProfile = async (user: any) => {
    const { id, email, user_metadata } = user;

    const { error } = await supabase.from('profiles').upsert({
        id,
        email,
        full_name: user_metadata.full_name || user_metadata.name || 'User',
        avatar_url: user_metadata.avatar_url || user_metadata.picture,
        last_login: new Date().toISOString(),
    }, {
        onConflict: 'id'
    });

    if (error) {
        console.error('Profile Sync Error:', error.message);
    }
};
