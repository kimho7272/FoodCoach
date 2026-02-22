import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: 'Privacy Policy - FoodCoach',
    description: 'FoodCoach 개인정보처리방침입니다.',
};

export default function PrivacyPage() {
    return (
        <main className="animate-fade-in" style={{ paddingTop: '8rem', paddingBottom: '8rem' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <Link href="/" style={{ display: 'inline-block', marginBottom: '2rem', color: 'var(--primary)', fontWeight: 600 }}>← 홈으로 돌아가기</Link>
                <h1 style={{ fontSize: '3rem', marginBottom: '3rem' }}>Privacy Policy</h1>

                <div className="glass" style={{ padding: '3rem', lineHeight: 1.8 }}>
                    <p><strong>Effective Date:</strong> Februrary 11, 2026</p>

                    <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>1. Introduction</h2>
                    <p>Welcome to FoodCoach ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our mobile application (the "App"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.</p>

                    <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>2. Collection of Your Information</h2>
                    <p>We may collect information about you in a variety of ways. The information we may collect via the App includes:</p>
                    <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
                        <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and demographic information that you voluntarily give to us when you register with the App.</li>
                        <li><strong>Health Data:</strong> Information regarding your health, fitness, and nutrition, including but not limited to dietary intake, calories consumed, and exercise data.</li>
                        <li><strong>Device Data:</strong> Information such as your mobile device ID, model, and manufacturer, and location data if permitted.</li>
                        <li><strong>Photos and Media:</strong> Meal photos uploaded for analysis are processed solely for identifying food items and nutritional content.</li>
                    </ul>

                    <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>3. Use of Your Information</h2>
                    <p>We use information collected about you via the App to:</p>
                    <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
                        <li>Create and manage your account.</li>
                        <li>Generate a personal profile to personalize your experience.</li>
                        <li>Analyze dietary intake and provide nutritional feedback.</li>
                        <li>Monitor usage and trends to improve the App.</li>
                        <li>Notify you of updates and request feedback.</li>
                    </ul>

                    <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>4. Disclosure of Your Information</h2>
                    <p>We may share information we have collected about you in certain situations, such as by law or to protect rights, or with third-party service providers (e.g., Supabase, Gemini) that perform services for us.</p>

                    <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>5. Security of Your Information</h2>
                    <p>We use administrative, technical, and physical security measures to help protect your personal information. However, no security measures are perfect or impenetrable.</p>

                    <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>6. Policy for Children</h2>
                    <p>We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us.</p>

                    <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>7. Contact Us</h2>
                    <p>If you have questions or comments about this Privacy Policy, please contact us at:</p>
                    <p style={{ marginTop: '1rem', fontWeight: 600, color: 'var(--primary)' }}>Email: kimho7272@gmail.com</p>
                </div>
            </div>
        </main>
    );
}
