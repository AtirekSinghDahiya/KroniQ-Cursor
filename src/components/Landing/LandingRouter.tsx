import React, { useRef, useEffect } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { LandingNavbar } from './LandingNavbar';
import { FloatingElements } from './FloatingElements';
import { CosmicBackground } from '../Layout/CosmicBackground';
import { useTheme } from '../../contexts/ThemeContext';
import { LandingRoutes } from '../../routes/LandingRoutes';
import { HelmetProvider } from 'react-helmet-async';

interface LandingRouterProps {
  onGetStarted: () => void;
}

const ScrollToTop: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const container = document.querySelector('.landing-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  return null;
};

const LandingContent: React.FC<LandingRouterProps> = ({ onGetStarted }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (page: string) => {
    const routes: Record<string, string> = {
      'home': '/',
      'about': '/about',
      'pricing': '/pricing',
      'contact': '/contact',
      'services': '/services',
      'careers': '/careers',
      'docs': '/docs',
      'privacy': '/privacy',
      'terms': '/terms',
      'cookies': '/cookies',
      'security': '/security',
      'promo': '/promo'
    };
    navigate(routes[page] || '/');
  };

  const getCurrentPage = (): string => {
    const path = location.pathname;
    if (path === '/') return 'home';
    return path.substring(1);
  };

  return (
    <div className="h-screen w-screen overflow-hidden gradient-background">
      <CosmicBackground />
      <FloatingElements />
      <ScrollToTop />

      <div
        ref={scrollContainerRef}
        className="landing-scroll-container h-full w-full overflow-y-auto overflow-x-hidden relative z-10"
        style={{ scrollBehavior: 'smooth' }}
      >
        <LandingNavbar
          currentPage={getCurrentPage()}
          onNavigate={handleNavigate}
          onGetStarted={onGetStarted}
        />

        <div className="relative">
          <LandingRoutes onGetStarted={onGetStarted} />
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
                    <button onClick={() => navigate('/')} className="hover:text-white transition-colors">
                      Features
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/services')} className="hover:text-white transition-colors">
                      Services
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/pricing')} className="hover:text-white transition-colors">
                      Pricing
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/docs')} className="hover:text-white transition-colors">
                      Documentation
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
                <ul className="space-y-3 text-sm text-white/60">
                  <li>
                    <button onClick={() => navigate('/about')} className="hover:text-white transition-colors">
                      About
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/careers')} className="hover:text-white transition-colors">
                      Careers
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/contact')} className="hover:text-white transition-colors">
                      Contact
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
                <ul className="space-y-3 text-sm text-white/60">
                  <li>
                    <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">
                      Privacy Policy
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">
                      Terms of Service
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/cookies')} className="hover:text-white transition-colors">
                      Cookie Policy
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/security')} className="hover:text-white transition-colors">
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

export const LandingRouter: React.FC<LandingRouterProps> = ({ onGetStarted }) => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <LandingContent onGetStarted={onGetStarted} />
      </BrowserRouter>
    </HelmetProvider>
  );
};
