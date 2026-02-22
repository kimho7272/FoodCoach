import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: 'Terms of Service - FoodCoach',
    description: 'FoodCoach 서비스 이용약관입니다.',
};

export default function TermsPage() {
    return (
        <main className="animate-fade-in" style={{ paddingTop: '8rem', paddingBottom: '8rem' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <Link href="/" style={{ display: 'inline-block', marginBottom: '2rem', color: 'var(--primary)', fontWeight: 600 }}>← 홈으로 돌아가기</Link>
                <h1 style={{ fontSize: '3rem', marginBottom: '3rem' }}>Terms of Service</h1>

                <div className="glass" style={{ padding: '3rem', lineHeight: 1.8 }}>
                    <p><strong>Last Updated:</strong> February 22, 2026</p>

                    <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>1. Agreement to Terms</h2>
                    <p>By accessing or using FoodCoach, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>

                    <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>2. Use of Service</h2>
                    <p>FoodCoach provides AI-based nutritional coaching. The information provided is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.</p>

                    <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>3. User Accounts</h2>
                    <p>When you create an account, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account and password.</p>

                    <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>4. Content and Analysis</h2>
                    <p>You retain rights to any photos or data you upload. However, by using the App, you grant us permission to process this data to provide our services and improve our AI models.</p>

                    <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>5. Limitation of Liability</h2>
                    <p>FoodCoach shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>

                    <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>6. Termination</h2>
                    <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms.</p>

                    <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>7. Contact Information</h2>
                    <p>If you have any questions about these Terms, please contact us at:</p>
                    <p style={{ marginTop: '1rem', fontWeight: 600, color: 'var(--primary)' }}>Email: foodcoach.dev@gmail.com</p>
                </div>
            </div>
        </main>
    );
}
