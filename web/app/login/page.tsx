"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

export default function LoginPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [autoLogin, setAutoLogin] = useState(true);

    useEffect(() => {
        if (status === "authenticated") {
            router.push('/');
        }
    }, [status, router]);

    const handleLogin = async (provider: string) => {
        setIsLoading(true);
        console.log(`Logging in with ${provider}...`);

        // Using real NextAuth signIn
        await signIn(provider.toLowerCase(), { callbackUrl: '/' });
        setIsLoading(false);
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-md z-10">
                <div className="bg-slate-800/40 backdrop-blur-xl p-10 rounded-[40px] border border-slate-700/50 shadow-2xl relative">

                    {/* Logo/Title Section */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                            FoodCoach
                        </h1>
                        <p className="text-slate-400 text-sm">자가 진화형 식단 관리 에이전트</p>
                    </div>

                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white mb-2">다시 오신 것을 환영합니다!</h2>
                            <p className="text-slate-400 text-xs">계정을 선택하여 시작하세요</p>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={() => handleLogin('Google')}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 py-3.5 rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                                Google 계정으로 계속하기
                            </button>

                            <button
                                onClick={() => handleLogin('Facebook')}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166fe5] text-white py-3.5 rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-5 h-5 brightness-0 invert" alt="Facebook" />
                                Facebook 계정으로 계속하기
                            </button>
                        </div>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-[1px] bg-slate-700 flex-1"></div>
                            <span className="text-slate-500 text-xs">OR</span>
                            <div className="h-[1px] bg-slate-700 flex-1"></div>
                        </div>

                        {/* Auto Login Toggle */}
                        <div className="flex items-center justify-between px-2 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={autoLogin}
                                    onChange={() => setAutoLogin(!autoLogin)}
                                    className="hidden"
                                />
                                <div
                                    onClick={() => setAutoLogin(!autoLogin)}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${autoLogin ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoLogin ? 'left-6' : 'left-1'}`}></div>
                                </div>
                                <span className="text-slate-400 text-xs group-hover:text-slate-300 transition-colors">자동 로그인 유지</span>
                            </label>
                            <a href="#" className="text-xs text-cyan-400 hover:text-cyan-300">도움이 필요하신가요?</a>
                        </div>
                    </div>

                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-[40px] flex flex-col items-center justify-center z-20">
                            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-emerald-400 font-bold animate-pulse">연결 중...</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
