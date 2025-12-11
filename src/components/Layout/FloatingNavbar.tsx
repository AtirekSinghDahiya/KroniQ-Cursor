import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { User, Zap, Briefcase, DollarSign, Home, Lightbulb, HelpCircle, BookOpen, Building2 } from 'lucide-react';
import { ProfilePage } from '../Profile/ProfilePage';
import { FeaturesPage } from '../Pages/FeaturesPage';
import { DocsPage } from '../Pages/DocsPage';
import { PricingModal } from '../Pages/PricingModal';
import { HelpModal } from '../Pages/HelpModal';
import { CareersModal } from '../Pages/CareersModal';
import { CustomSolutionsModal } from '../Pages/CustomSolutionsModal';
import { DraggableProfileButton } from '../Common/DraggableProfileButton2';

interface FloatingNavbarProps {
  onProfileOpen?: () => void;
}

export const FloatingNavbar: React.FC<FloatingNavbarProps> = ({ onProfileOpen }) => {
  const { userData } = useAuth();
  const { navigateTo } = useNavigation();
  const [showProfile, setShowProfile] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCareers, setShowCareers] = useState(false);
  const [showCustomSolutions, setShowCustomSolutions] = useState(false);

  const handleProfileClick = () => {
    if (onProfileOpen) {
      onProfileOpen();
    } else {
      setShowProfile(true);
    }
  };

  const handleHomeClick = () => {
    // Navigate to chat and clear any active project
    navigateTo('chat');
    // Trigger a page reload to reset state properly
    window.location.href = '/';
  };

  return (
    <>
      <nav className="flex fixed top-0 left-0 right-0 z-30 items-center justify-center pt-2 md:pt-6 px-2 md:px-4">
        <div className="relative group w-full max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#EC4899]/20 via-[#8B5CF6]/20 to-[#EC4899]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative glass-panel rounded-full px-3 md:px-8 py-2 md:py-3.5 shadow-2xl border border-white/20 backdrop-blur-2xl animate-fade-in-up hover:border-white/30 transition-all duration-300">
            <div className="flex items-center justify-center gap-2 md:gap-8 overflow-x-auto scrollbar-none">
              <button
                onClick={handleHomeClick}
                className="relative flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-white/70 hover:text-white font-medium transition-all hover:scale-105 active:scale-95 group/item whitespace-nowrap px-2 md:px-0"
              >
                <Home className="w-4 h-4 transition-transform group-hover/item:rotate-12" />
                <span className="hidden sm:inline">Home</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] group-hover/item:w-full transition-all duration-300" />
              </button>
              <button
                onClick={() => setShowFeatures(true)}
                className="relative flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-white/70 hover:text-white font-medium transition-all hover:scale-105 active:scale-95 group/item whitespace-nowrap px-2 md:px-0"
              >
                <Lightbulb className="w-4 h-4 transition-transform group-hover/item:rotate-12" />
                <span className="hidden sm:inline">Features</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] group-hover/item:w-full transition-all duration-300" />
              </button>
              <button
                onClick={() => setShowPricing(true)}
                className="relative flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-white/70 hover:text-white font-medium transition-all hover:scale-105 active:scale-95 group/item whitespace-nowrap px-2 md:px-0"
              >
                <DollarSign className="w-4 h-4 transition-transform group-hover/item:rotate-12" />
                <span className="hidden sm:inline">Pricing</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] group-hover/item:w-full transition-all duration-300" />
              </button>
              <button
                onClick={() => setShowDocs(true)}
                className="relative flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-white/70 hover:text-white font-medium transition-all hover:scale-105 active:scale-95 group/item whitespace-nowrap px-2 md:px-0"
              >
                <BookOpen className="w-4 h-4 transition-transform group-hover/item:rotate-12" />
                <span className="hidden sm:inline">Docs</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] group-hover/item:w-full transition-all duration-300" />
              </button>
              <button
                onClick={() => setShowCareers(true)}
                className="relative flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-white/70 hover:text-white font-medium transition-all hover:scale-105 active:scale-95 group/item whitespace-nowrap px-2 md:px-0"
              >
                <Briefcase className="w-4 h-4 transition-transform group-hover/item:rotate-12" />
                <span className="hidden sm:inline">Careers</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] group-hover/item:w-full transition-all duration-300" />
              </button>
              <button
                onClick={() => setShowCustomSolutions(true)}
                className="relative flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-white/70 hover:text-white font-medium transition-all hover:scale-105 active:scale-95 group/item whitespace-nowrap px-2 md:px-0"
              >
                <Building2 className="w-4 h-4 transition-transform group-hover/item:rotate-12" />
                <span className="hidden sm:inline">Enterprise</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] group-hover/item:w-full transition-all duration-300" />
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="relative flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-white/70 hover:text-white font-medium transition-all hover:scale-105 active:scale-95 group/item whitespace-nowrap px-2 md:px-0"
              >
                <HelpCircle className="w-4 h-4 transition-transform group-hover/item:rotate-12" />
                <span className="hidden sm:inline">Help</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] group-hover/item:w-full transition-all duration-300" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="fixed top-14 md:top-6 right-2 md:right-6 z-30 flex items-center gap-2 md:gap-3 animate-fade-in-up">
        <DraggableProfileButton />
      </div>

      {showProfile && <ProfilePage onClose={() => setShowProfile(false)} />}
      {showFeatures && <FeaturesPage onClose={() => setShowFeatures(false)} />}
      {showDocs && <DocsPage onClose={() => setShowDocs(false)} />}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showCareers && <CareersModal onClose={() => setShowCareers(false)} />}
      {showCustomSolutions && <CustomSolutionsModal onClose={() => setShowCustomSolutions(false)} />}
    </>
  );
};
