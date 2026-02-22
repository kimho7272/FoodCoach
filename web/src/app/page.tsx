import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'FoodCoach - AI Proactive Diet Agent',
  description: '당신의 식단, AI가 먼저 챙겨줍니다. 스마트한 영양 관리 에이전트 FoodCoach.',
};

export default function LandingPage() {
  return (
    <main className="animate-fade-in">
      {/* Navigation */}
      <nav className="glass" style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '1200px', zIndex: 1000, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Image src="/images/Logo.png" alt="FoodCoach Logo" width={32} height={32} />
          <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>FoodCoach</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontWeight: 500 }}>
          <a href="#features">기능</a>
          <a href="#about">둘러보기</a>
          <a href="#contact">지원</a>
          <Link href="/privacy">개인정보처리방침</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="section" style={{ paddingTop: '10rem', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
            다이어트도 <span className="gradient-text">에이전트</span> 시대
          </h1>
          <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '800px', margin: '0 auto 3rem' }}>
            FoodCoach는 당신이 기록하기를 기다리지 않습니다.<br />
            AI가 먼저 다가와 식단을 제안하고 상황에 맞는 영양 분석을 제공합니다.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" style={{ fontSize: '1.1rem' }}>앱 다운로드</button>
            <a href="#about" className="btn" style={{ border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 600, display: 'inline-block', lineHeight: 'normal' }}>둘러보기</a>
          </div>

          <div style={{ marginTop: '5rem', position: 'relative', height: '400px', width: '100%', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <Image
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1200"
              alt="Healthy Food"
              fill
              style={{ objectFit: 'cover' }}
            />
            <div className="glass" style={{ position: 'absolute', bottom: '2rem', right: '2rem', padding: '1.5rem', maxWidth: '300px' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>"오늘 점심은 단백질이 부족하네요!"</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>FoodCoach AI가 당신의 과거 데이터를 분석하여 메뉴를 추천합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section" style={{ background: 'rgba(76, 175, 80, 0.05)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '4rem' }}>주요 기능</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="glass" style={{ padding: '2.5rem' }}>
              <div style={{ background: 'var(--primary)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'white', fontSize: '1.5rem' }}>👁️</div>
              <h3 style={{ marginBottom: '1rem' }}>AI 식단 분석</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>음식 사진 한 장으로 메뉴와 재료를 자동 인식합니다. Nutritionix 데이터 기반의 정확한 영양 정보를 확인하세요.</p>
            </div>

            <div className="glass" style={{ padding: '2.5rem' }}>
              <div style={{ background: '#2196F3', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'white', fontSize: '1.5rem' }}>🤖</div>
              <h3 style={{ marginBottom: '1rem' }}>능동형 에이전트</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>사용자의 식사 패턴을 학습하여 정해진 시간에 먼저 메시지를 보냅니다. 맥락에 맞는 건강한 식사 가이드를 제공합니다.</p>
            </div>

            <div className="glass" style={{ padding: '2.5rem' }}>
              <div style={{ background: '#FFC107', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'white', fontSize: '1.5rem' }}>🏃</div>
              <h3 style={{ marginBottom: '1rem' }}>운동 및 메뉴 추천</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>실시간 영양 점수를 바탕으로 부족한 영양소를 채울 수 있는 주변 식당 메뉴나 적절한 운동을 제안합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section (둘러보기) */}
      <section id="about" className="section">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>당신을 위한 <span className="gradient-text">완벽한 파트너</span></h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '2rem' }}>
                단순한 기록 앱이 아닙니다. FoodCoach는 당신의 생활 패턴을 이해하고, 가장 필요한 순간에 최적의 조언을 건넵니다.
                회식 날엔 가벼운 저녁을 추천하고, 운동이 부족한 날엔 집 근처 산책로를 안내합니다.
              </p>
              <ul style={{ listStyle: 'none' }}>
                <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>✓</span> <strong>개인 맞춤형 알림</strong>: 당신의 보폭에 맞춘 가이드
                </li>
                <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>✓</span> <strong>정교한 데이터 분석</strong>: 영양 균형의 완벽한 추적
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>✓</span> <strong>끊임없는 진화</strong>: 쓸수록 더 똑똑해지는 추천 시스템
                </li>
              </ul>
            </div>
            <div style={{ flex: 1, minWidth: '300px', position: 'relative', height: '500px' }}>
              <Image
                src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800"
                alt="Healthy App Interaction"
                fill
                style={{ objectFit: 'cover', borderRadius: '30px' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="glass" style={{ padding: '4rem', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>고객 지원</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>앱 사용 중 궁금한 점이나 의견이 있으시면 언제든지 연락주세요.</p>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)' }}>
              📧 <a href="mailto:foodcoach.dev@gmail.com">foodcoach.dev@gmail.com</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '4rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Image src="/images/Logo.png" alt="FoodCoach Logo" width={24} height={24} />
              <span style={{ fontWeight: 800 }}>FoodCoach</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>© 2026 FoodCoach. All rights reserved.</p>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <Link href="/privacy" style={{ fontSize: '0.9rem', fontWeight: 600 }}>개인정보처리방침</Link>
            <Link href="/terms" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>서비스 이용약관</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
