"use client";

import React from 'react';
import { signOut, useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();
    const { data: session, status } = useSession();

    React.useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/login');
        }
    }, [status, router]);

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <main className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
            {/* Header with Premium Gradient */}
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                        FoodCoach AI
                    </h1>
                    <p className="text-slate-400 mt-2">
                        안녕하세요, <span className="text-emerald-400 font-bold">{session.user?.name || "사용자"}</span>님! 🥘
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 backdrop-blur-md">
                        <p className="text-sm text-slate-400">오늘의 영양 점수</p>
                        <p className="text-2xl font-bold text-emerald-400">85/100</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors group"
                        title="로그아웃"
                    >
                        <span className="text-slate-400 group-hover:text-red-400 text-sm font-bold">로그아웃</span>
                    </button>
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: Snap & Correct */}
                <section className="lg:col-span-2 space-y-8">
                    <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-emerald-500/50 transition-all group">
                        <h2 className="text-2xl font-bold mb-4 flex items-center">
                            <span className="mr-2 text-emerald-400">📸</span> Snap & Analyze
                        </h2>
                        <div className="border-2 border-dashed border-slate-600 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer group-hover:bg-slate-800 transition-colors">
                            <p className="text-slate-400 group-hover:text-emerald-400">사진을 여기에 드래그하거나 클릭하여 업로드</p>
                            <button className="mt-4 px-6 py-2 bg-emerald-500 rounded-full font-bold hover:bg-emerald-400 transition-colors">
                                카메라 켜기
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700">
                        <h2 className="text-2xl font-bold mb-4">🏃‍♂️ 오늘 추천 운동</h2>
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            <div className="min-w-[200px] bg-slate-900 p-4 rounded-2xl">
                                <p className="text-emerald-400 font-bold">싸이클 20분</p>
                                <p className="text-sm text-slate-400 mt-1">간식 칼로리(250kcal) 소모용</p>
                            </div>
                            <div className="min-w-[200px] bg-slate-900 p-4 rounded-2xl">
                                <p className="text-cyan-400 font-bold">빠르게 걷기 40분</p>
                                <p className="text-sm text-slate-400 mt-1">오늘 잉여 칼로리 정산</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Right Col: Score Card & Recommendations */}
                <aside className="space-y-8">
                    <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900 p-6 rounded-3xl border border-indigo-500/30">
                        <h3 className="text-xl font-bold mb-4">📊 영양 성적표</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>단백질</span>
                                    <span className="text-emerald-400">75%</span>
                                </div>
                                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-400 h-full w-[75%] rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>지방</span>
                                    <span className="text-amber-400">90%</span>
                                </div>
                                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-amber-400 h-full w-[90%] rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                        <h3 className="text-xl font-bold mb-4">💡 부족 영양소 보충 추천</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-900 rounded-2xl border-l-4 border-emerald-500">
                                <p className="font-bold">계란 샐러드 샌드위치</p>
                                <p className="text-sm text-slate-400">근처 '스타벅스' (200m)</p>
                                <p className="text-xs text-emerald-400 mt-2">단백질 12g 보충 필요</p>
                            </div>
                            <div className="p-4 bg-slate-900 rounded-2xl border-l-4 border-cyan-500">
                                <p className="font-bold">더단백 음료</p>
                                <p className="text-sm text-slate-400">근처 'CU 편의점' (50m)</p>
                                <p className="text-xs text-cyan-400 mt-2">간편한 단백질 보충</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Floating Proactive Agent */}
            <div className="fixed bottom-8 right-8 bg-emerald-600 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform cursor-pointer group">
                <span className="text-2xl">🤖</span>
                <div className="absolute bottom-full right-0 mb-4 w-64 bg-slate-800 p-4 rounded-2xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-sm text-emerald-200">"점심 식사 시간입니다! {session.user?.name}님, 오늘 어떤 걸 드실 계획인가요?"</p>
                </div>
            </div>
        </main>
    );
}
