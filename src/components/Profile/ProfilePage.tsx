import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { User, Mail, X, Camera, LogOut, Settings, Crown } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { supabase } from '../../lib/supabase';

interface ProfilePageProps {
  onClose: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onClose }) => {
  const { currentUser, userData, updateUserProfile, refreshUserData, signOut } = useAuth();
  const { navigateTo } = useNavigation();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tier, setTier] = useState('free');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || '');
      setPhotoURL(userData.photoURL || '');
    }
  }, [userData]);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!currentUser?.uid) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('tokens_balance, current_tier, is_premium')
          .eq('id', currentUser.uid)
          .maybeSingle();

        if (!error && data) {
          setTokenBalance(data.tokens_balance || 0);
          setTier(data.is_premium ? 'premium' : data.current_tier || 'free');
        }
      } catch (err) {
        console.error('Error fetching token balance:', err);
      }
    };

    fetchTokenBalance();
  }, [currentUser]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoURL(result);
        setUploading(false);
        showToast('success', 'Image Loaded', 'Profile picture updated');
      };
      reader.onerror = () => {
        setUploading(false);
        showToast('error', 'Upload Failed', 'Could not read image file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showToast('error', 'Upload Failed', 'Failed to upload image');
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      showToast('error', 'Not Authenticated', 'You must be logged in');
      return;
    }

    if (!displayName.trim()) {
      showToast('warning', 'Invalid Input', 'Display name cannot be empty');
      return;
    }

    setSaving(true);

    try {
      const profileData = {
        displayName: displayName.trim(),
        photoURL: photoURL || '',
      };

      await updateUserProfile(profileData);
      await refreshUserData();

      showToast('success', 'Profile Updated', 'Your changes have been saved');
      setTimeout(() => onClose(), 800);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to save profile';
      showToast('error', 'Save Failed', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  if (!currentUser) {
    return null;
  }

  const initials = getInitials(displayName || userData?.displayName, currentUser.email || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-black/95 backdrop-blur-2xl rounded-3xl shadow-2xl border-2 border-[#00FFF0]/20 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="relative p-6 border-b border-[#00FFF0]/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-xl font-bold text-white">Profile</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Picture & Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00FFF0] to-[#8A2BE2] flex items-center justify-center shadow-lg border-2 border-[#00FFF0]/30 overflow-hidden">
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">{initials}</span>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 p-2 bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                <Camera className="w-3 h-3 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">
                {displayName || userData?.displayName || 'User'}
              </h3>
              <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                <Mail className="w-4 h-4" />
                <span className="truncate">{currentUser.email}</span>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                tier === 'premium'
                  ? 'bg-gradient-to-r from-[#00FFF0]/20 to-[#8A2BE2]/20 border border-[#00FFF0]/50 text-[#00FFF0]'
                  : 'bg-white/5 border border-white/10 text-white/70'
              }`}>
                <Crown className="w-3 h-3" />
                <span className="capitalize">{tier}</span>
              </div>
            </div>
          </div>

          {/* Token Balance Card */}
          <div className="bg-gradient-to-br from-[#00FFF0]/10 to-[#8A2BE2]/10 border border-[#00FFF0]/20 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Token Balance</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
                {formatTokens(tokenBalance)}
              </span>
            </div>
          </div>

          {/* Edit Name */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#00FFF0]/50 transition-all"
              placeholder="Enter your name"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => {
                onClose();
                navigateTo('settings');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00FFF0]/30 rounded-xl text-white transition-all"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>

            <button
              onClick={async () => {
                await signOut();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl text-red-400 hover:text-red-300 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#00FFF0]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
