import { supabase } from './supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Provider } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = Linking.createURL('/');

export const signInWithSocial = async (
    provider: 'google' | 'apple' | 'kakao',
    additionalData?: { nickname?: string; height?: number; weight?: number; target_calories?: number }
) => {
    try {
        console.log('SignInWithSocial: Starting for provider', provider);
        console.log('SignInWithSocial: Redirect URL generated:', redirectTo);

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider as Provider,
            options: {
                redirectTo,
                skipBrowserRedirect: true,
            },
        });

        if (error) throw error;

        console.log('SignInWithSocial: Supabase URL obtained, opening browser...');

        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
            showInRecents: true,
        });

        console.log('SignInWithSocial: Browser Result:', JSON.stringify(res));

        if (res.type === 'success' && res.url) {
            const urlObj = new URL(res.url);
            const code = urlObj.searchParams.get('code');
            const errorParam = urlObj.searchParams.get('error');

            if (errorParam) {
                console.error('SignInWithSocial: URL contains error param:', errorParam);
                throw new Error(`Auth Error from Provider: ${errorParam}`);
            }

            if (code) {
                console.log('SignInWithSocial: Code found, exchanging...');
                const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
                if (sessionError) throw sessionError;

                console.log('SignInWithSocial: Session exchanged successfully');

                if (sessionData.user) {
                    await syncUserProfile(sessionData.user, additionalData);
                }
                return { user: sessionData.user, error: null };
            }

            // Implicit Flow Fallback (Legacy)
            const fragment = res.url.split('#')[1];
            if (fragment) {
                const params = new URLSearchParams(fragment);
                const access_token = params.get('access_token');
                const refresh_token = params.get('refresh_token');

                if (access_token && refresh_token) {
                    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                        access_token: access_token as string,
                        refresh_token: refresh_token as string,
                    });
                    if (sessionError) throw sessionError;
                    if (sessionData.user) {
                        await syncUserProfile(sessionData.user, additionalData);
                    }
                    return { user: sessionData.user, error: null };
                }
            }

            throw new Error('No auth code or tokens found in URL');
        }

        console.log('SignInWithSocial: Browser did not return success or URL');
        return { user: null, error: new Error(`Authentication process not completed (Type: ${res.type})`) };
    } catch (err: any) {
        console.error(`Auth Error (${provider}):`, err.message);
        return { user: null, error: err };
    }
};

const syncUserProfile = async (user: any, additionalData?: { nickname?: string; height?: number; weight?: number; target_calories?: number }) => {
    try {
        const { id, email, user_metadata } = user;

        // 1. Check if profile exists (Safest way to handle separate RLS policies for INSERT/UPDATE)
        const { data: existing } = await supabase.from('profiles').select('id').eq('id', id).single();

        if (existing) {
            // 2. Existing User: Update only metadata (e.g. avatar, last_login)
            const updatePayload: any = {
                last_login: new Date().toISOString(),
                // Update avatar/name if changed on Google side
                avatar_url: user_metadata.avatar_url || user_metadata.picture,
                full_name: user_metadata.full_name || user_metadata.name,
            };

            // Use 'update' explicitly
            const { error: updateError } = await supabase
                .from('profiles')
                .update(updatePayload)
                .eq('id', id);

            if (updateError) {
                console.warn('Profile Update Warning:', updateError.message);
            }
        } else {
            // 3. New User: Insert with ALL required defaults
            // This prevents "Violates Not Null Constraint" errors
            const insertPayload = {
                id,
                email,
                full_name: user_metadata.full_name || user_metadata.name || 'User',
                avatar_url: user_metadata.avatar_url || user_metadata.picture,
                nickname: additionalData?.nickname || email?.split('@')[0] || 'Foodie',
                height: additionalData?.height || 170, // Default constants
                weight: additionalData?.weight || 70,
                target_calories: additionalData?.target_calories || 2000,
                last_login: new Date().toISOString(),
            };

            const { error: insertError } = await supabase
                .from('profiles')
                .insert(insertPayload);

            if (insertError) {
                console.error('Profile Creation Error:', insertError.message);
                // If this fails, it might be due to a Trigger race condition or RLS.
                // We log it but don't throw, allowing the user to proceed (Onboarding might fix it).
            }
        }
    } catch (e: any) {
        console.error("SyncUserProfile Exception:", e.message);
    }
};

/**
 * 로그인 이후에 프로필 정보를 따로 업데이트할 때 사용합니다.
 */
export const updateProfile = async (
    userId: string,
    data: { nickname?: string; height?: number; weight?: number; target_calories?: number; phone?: string }
) => {
    try {
        const updates = {
            id: userId,
            ...data,
            last_login: new Date().toISOString(),
        };

        // Use atomic upsert to avoid "duplicate key" race conditions
        const { error } = await supabase
            .from('profiles')
            .upsert(updates, { onConflict: 'id' });

        if (error) {
            console.error('Update Profile Error:', error.message);
            if (error.message.includes('row-level security')) {
                console.error('RLS Violation: Ensure "profiles" has both INSERT and UPDATE policies for auth.uid() = id.');
            }
            return { success: false, error };
        }

        return { success: true, error: null };
    } catch (err: any) {
        console.error('Update Profile Exception:', err.message);
        return { success: false, error: err };
    }
};
