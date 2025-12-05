import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface LandingNavbarProps {
  currentPage: 'home' | 'about' | 'pricing' | 'contact' | 'services' | 'careers' | 'docs';
  onNavigate: (page: 'home' | 'about' | 'pricing' | 'contact' | 'services' | 'careers' | 'docs') => void;
  onGetStarted: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ currentPage, onNavigate, onGetStarted }) => {
  const { theme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'docs', label: 'Docs' },
    { id: 'careers', label: 'Careers' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'contact', label: 'Contact' }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 px-4 py-4 transition-all duration-500 ${
      isScrolled ? 'py-3' : 'py-5'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-r from-[#00FFF0]/20 via-[#8A2BE2]/20 to-[#00FFF0]/20 rounded-full blur-xl transition-opacity duration-500 ${
            isScrolled ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`} />
          <div className={`relative glass-panel rounded-full px-6 md:px-8 py-3 shadow-2xl border border-white/20 backdrop-blur-2xl transition-all duration-300 ${
            isScrolled ? 'bg-slate-900/90' : 'bg-slate-900/40'
          }`}>
            <div className="flex items-center justify-between">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-3 group/logo"
              >
                <img
                  src="/Black_Blue_White_Modern_Simple_Minimal_Gradient_Circle__Neon_Technology__AI_Logo__1_-removebg-preview copy.png"
                  alt="KroniQ"
                  className="h-10 md:h-12 w-auto object-contain group-hover/logo:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(0,255,240,0.5)]"
                />
                <span className="text-xl md:text-2xl font-bold text-white">
                  KroniQ
                </span>
              </button>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id as any)}
                    className={`relative text-sm font-medium transition-all duration-300 group/nav ${
                      currentPage === item.id
                        ? 'text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {item.label}
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] transition-all duration-300 ${
                      currentPage === item.id
                        ? 'w-full'
                        : 'w-0 group-hover/nav:w-full'
                    }`} />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={onGetStarted}
                  className="hidden sm:block bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-[#00FFF0]/30 transition-all duration-300 hover:scale-105"
                >
                  Get Started
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden text-white p-2"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-4 top-20 z-40 animate-fade-in">
          <div className="glass-panel rounded-2xl p-6 border border-white/20 backdrop-blur-2xl">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-left py-3 px-4 rounded-xl transition-all duration-300 ${
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-[#00FFF0]/20 to-[#8A2BE2]/20 text-white border border-[#00FFF0]/30'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => {
                  onGetStarted();
                  setIsMobileMenuOpen(false);
                }}
                className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#00FFF0]/30 transition-all duration-300"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
