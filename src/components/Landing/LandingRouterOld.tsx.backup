import React, { useState, useRef, useEffect } from 'react';
import { LandingNavbar } from './LandingNavbar';
import { HomePage } from './HomePage';
import { AboutPage } from './AboutPage';
import { PricingPage } from './PricingPage';
import { ContactPage } from './ContactPage';
import { ServicesPage } from './ServicesPage';
import { CareersPage } from './CareersPage';
import { DocsPage } from './DocsPage';
import { LegalPages } from '../Legal/LegalPages';
import { FloatingElements } from './FloatingElements';
import { CosmicBackground } from '../Layout/CosmicBackground';
import { useTheme } from '../../contexts/ThemeContext';
import PromoLandingPage from '../Promo/PromoLandingPage';

interface LandingRouterProps {
  onGetStarted: () => void;
}

export const LandingRouter: React.FC<LandingRouterProps> = ({ onGetStarted }) => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'pricing' | 'contact' | 'services' | 'careers' | 'docs' | 'privacy' | 'terms' | 'cookies' | 'security' | 'promo'>('home');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (page: 'home' | 'about' | 'pricing' | 'contact' | 'services' | 'careers' | 'docs' | 'privacy' | 'terms' | 'cookies' | 'security' | 'promo') => {
    setCurrentPage(page);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo(0, 0);
    }

    const hash = window.location.hash.substring(1);
    if (hash === 'promo' || hash === 'first100') {
      setCurrentPage('promo');
    }
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onGetStarted={onGetStarted} />;
      case 'about':
        return <AboutPage />;
      case 'pricing':
        return <PricingPage onGetStarted={onGetStarted} />;
      case 'contact':
        return <ContactPage />;
      case 'services':
        return <ServicesPage />;
      case 'careers':
        return <CareersPage />;
      case 'docs':
        return <DocsPage />;
      case 'privacy':
        return <LegalPages page="privacy" />;
      case 'terms':
        return <LegalPages page="terms" />;
      case 'cookies':
        return <LegalPages page="cookies" />;
      case 'security':
        return <LegalPages page="security" />;
      case 'promo':
        return <PromoLandingPage />;
      default:
        return <HomePage onGetStarted={onGetStarted} />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden gradient-background">
      <CosmicBackground />
      <FloatingElements />

      <div
        ref={scrollContainerRef}
        className="h-full w-full overflow-y-auto overflow-x-hidden relative z-10"
        style={{ scrollBehavior: 'smooth' }}
      >
        <LandingNavbar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onGetStarted={onGetStarted}
        />

        <div className="relative">
          {renderPage()}
        </div>

        {/* Footer */}
        <footer className="relative py-16 px-4 border-t border-white/10 mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div>
                <div className="mb-6">
                  <img src="/Black_Blue_White_Modern_Simple_Minimal_Gradient_Circle__Neon_Technology__AI_Logo__1_-removebg-preview copy.png" alt="KroniQ" className="h-12 w-auto object-contain" />
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Empowering creators with AI-powered tools for the future of digital creation.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Product</h4>
                <ul className="space-y-3 text-sm text-white/60">
                  <li>
                    <button onClick={() => handleNavigate('home')} className="hover:text-white transition-colors">
                      Features
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigate('services')} className="hover:text-white transition-colors">
                      Services
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigate('pricing')} className="hover:text-white transition-colors">
                      Pricing
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigate('docs')} className="hover:text-white transition-colors">
                      Documentation
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
                <ul className="space-y-3 text-sm text-white/60">
                  <li>
                    <button onClick={() => handleNavigate('about')} className="hover:text-white transition-colors">
                      About
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigate('careers')} className="hover:text-white transition-colors">
                      Careers
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigate('contact')} className="hover:text-white transition-colors">
                      Contact
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
                <ul className="space-y-3 text-sm text-white/60">
                  <li>
                    <button onClick={() => handleNavigate('privacy')} className="hover:text-white transition-colors">
                      Privacy Policy
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigate('terms')} className="hover:text-white transition-colors">
                      Terms of Service
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigate('cookies')} className="hover:text-white transition-colors">
                      Cookie Policy
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigate('security')} className="hover:text-white transition-colors">
                      Security
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-white/60 text-sm">
                KroniQ © 2025 — All rights reserved. Crafted with intelligence.
              </p>

              <div className="flex items-center gap-6">
                <a href="https://www.linkedin.com/company/kroniq-ai/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors text-sm">
                  LinkedIn
                </a>
                <a href="https://www.youtube.com/@KroniQ-AI" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors text-sm">
                  YouTube
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
