'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { webTranslations } from '../lib/web_translations';

export default function LandingPage() {
  const { language, changeLanguage, isLoaded } = useLanguage();

  // Use 'ko' as default if not loaded to prevent flickering if possible, 
  // but hook handles browser detect. Using 'ko' as base since it was original.
  const t = webTranslations[language];

  const LanguageToggle = () => (
    <div className="glass" style={{ display: 'flex', borderRadius: '12px', padding: '4px', marginLeft: '1rem' }}>
      <button
        onClick={() => changeLanguage('en')}
        style={{
          padding: '4px 12px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 700,
          backgroundColor: language === 'en' ? 'var(--primary)' : 'transparent',
          color: language === 'en' ? 'white' : 'var(--text-secondary)',
          transition: 'all 0.2s ease'
        }}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('ko')}
        style={{
          padding: '4px 12px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 700,
          backgroundColor: language === 'ko' ? 'var(--primary)' : 'transparent',
          color: language === 'ko' ? 'white' : 'var(--text-secondary)',
          transition: 'all 0.2s ease'
        }}
      >
        KO
      </button>
    </div>
  );

  if (!isLoaded) return <div style={{ minHeight: '100vh', backgroundColor: '#0F172A' }} />;

  return (
    <main className="animate-fade-in">
      {/* Navigation */}
      <nav className="glass" style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '1200px', zIndex: 1000, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Image src="/images/Logo.png" alt="FoodCoach Logo" width={32} height={32} />
          <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>FoodCoach</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontWeight: 500 }}>
          <a href="#features" className="nav-link">{t.nav.features}</a>
          <a href="#about" className="nav-link">{t.nav.about}</a>
          <a href="#contact" className="nav-link">{t.nav.contact}</a>
          <Link href="/privacy" className="nav-link">{t.nav.privacy}</Link>
          <LanguageToggle />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="section" style={{ paddingTop: '10rem', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
            {t.hero.title} <span className="gradient-text">{t.hero.titleAccent}</span>
          </h1>
          <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '800px', margin: '0 auto 3rem', whiteSpace: 'pre-line' }}>
            {t.hero.subtitle}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" style={{ fontSize: '1.1rem' }}>{t.hero.download}</button>
            <a href="#about" className="btn" style={{ border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 600, display: 'inline-block', lineHeight: 'normal' }}>{t.hero.explore}</a>
          </div>

          <div style={{ marginTop: '5rem', position: 'relative', height: '400px', width: '100%', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <Image
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1200"
              alt="Healthy Food"
              fill
              style={{ objectFit: 'cover' }}
            />
            <div className="glass" style={{ position: 'absolute', bottom: '2rem', right: '2rem', padding: '1.5rem', maxWidth: '320px', textAlign: 'left' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>"{t.hero.featureHintTitle}"</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t.hero.featureHintDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section" style={{ background: 'rgba(76, 175, 80, 0.05)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '4rem' }}>{t.features.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="glass" style={{ padding: '2.5rem' }}>
              <div style={{ background: 'var(--primary)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'white', fontSize: '1.5rem' }}>👁️</div>
              <h3 style={{ marginBottom: '1rem' }}>{t.features.ai.title}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{t.features.ai.desc}</p>
            </div>

            <div className="glass" style={{ padding: '2.5rem' }}>
              <div style={{ background: '#2196F3', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'white', fontSize: '1.5rem' }}>🤖</div>
              <h3 style={{ marginBottom: '1rem' }}>{t.features.proactive.title}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{t.features.proactive.desc}</p>
            </div>

            <div className="glass" style={{ padding: '2.5rem' }}>
              <div style={{ background: '#FFC107', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'white', fontSize: '1.5rem' }}>🏃</div>
              <h3 style={{ marginBottom: '1rem' }}>{t.features.recommend.title}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{t.features.recommend.desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>{t.about.title} <span className="gradient-text">{t.about.titleAccent}</span></h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '2rem' }}>
                {t.about.desc}
              </p>
              <ul style={{ listStyle: 'none' }}>
                {t.about.bullets.map((bullet, i) => (
                  <li key={i} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>✓</span> <strong>{bullet.split(':')[0]}</strong>: {bullet.split(':')[1]}
                  </li>
                ))}
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
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{t.contact.title}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{t.contact.desc}</p>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)' }}>
              📧 <a href={`mailto:${t.contact.email}`}>{t.contact.email}</a>
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
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t.footer.rights}</p>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <Link href="/privacy" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t.footer.privacy}</Link>
            <Link href="/terms" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t.footer.terms}</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
