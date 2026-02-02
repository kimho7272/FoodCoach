import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
    title: "FoodCoach AI - 자가 진화형 식단 관리",
    description: "사진 한 장으로 식단을 분석하고 맞춤형 영양 보충을 제안하는 똑똑한 AI 에이전트",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
