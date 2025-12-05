import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  image?: string;
  buttonText?: string;
  buttonAction?: () => void;
}

interface FeatureAnnouncementProps {
  feature: Feature;
  onClose: () => void;
}

export const FeatureAnnouncement: React.FC<FeatureAnnouncementProps> = ({ feature, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in after mount
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAction = () => {
    if (feature.buttonAction) {
      feature.buttonAction();
    }
    handleClose();
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="relative w-[420px] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-orange-500/30 shadow-2xl overflow-hidden">

        {/* Glow effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-orange-500/20 via-orange-600/20 to-orange-500/20 rounded-2xl blur-xl opacity-60" />

        <div className="relative">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-orange-500/10 via-orange-600/10 to-orange-500/10 border-b border-orange-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">New Feature!</h3>
                <p className="text-xs text-orange-300/80">Check out what's new</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-white/10 active:bg-white/20 text-white/60 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {feature.image && (
              <div className="relative rounded-xl overflow-hidden border border-slate-700/50">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            <div>
              <h4 className="text-xl font-bold text-white mb-2">{feature.title}</h4>
              <p className="text-sm text-white/70 leading-relaxed">{feature.description}</p>
            </div>

            {feature.buttonText && (
              <button
                onClick={handleAction}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-orange-500/50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {feature.buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Feature announcement manager
const FEATURES_KEY = 'kroniq_seen_features';

export const useFeatureAnnouncements = () => {
  const [currentFeature, setCurrentFeature] = useState<Feature | null>(null);

  const getSeenFeatures = (): string[] => {
    const seen = localStorage.getItem(FEATURES_KEY);
    return seen ? JSON.parse(seen) : [];
  };

  const markFeatureAsSeen = (featureId: string) => {
    const seen = getSeenFeatures();
    if (!seen.includes(featureId)) {
      localStorage.setItem(FEATURES_KEY, JSON.stringify([...seen, featureId]));
    }
  };

  const showFeature = (feature: Feature) => {
    const seen = getSeenFeatures();
    if (!seen.includes(feature.id)) {
      setCurrentFeature(feature);
    }
  };

  const closeAnnouncement = () => {
    if (currentFeature) {
      markFeatureAsSeen(currentFeature.id);
    }
    setCurrentFeature(null);
  };

  return {
    currentFeature,
    showFeature,
    closeAnnouncement,
  };
};
