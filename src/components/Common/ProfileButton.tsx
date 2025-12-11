import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, Settings, GripVertical, X, Camera, Mail, Crown, Coins } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface ProfileButtonProps {
  tokenBalance?: number;
}

interface Position {
  x: number;
  y: number;
}

export const ProfileButton: React.FC<ProfileButtonProps> = ({ tokenBalance: propTokenBalance = 0 }) => {
  const { currentUser, signOut, userData, updateUserProfile, refreshUserData } = useAuth();
  const { navigateTo } = useNavigation();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(propTokenBalance);
  const [tier, setTier] = useState('free');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Profile edit states
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved position
  useEffect(() => {
    const savedPosition = localStorage.getItem('profileButtonPosition');
    if (savedPosition) {
      try {
        setPosition(JSON.parse(savedPosition));
      } catch (e) {
        console.error('Failed to parse saved position');
      }
    }
  }, []);

  // Load profile data
  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || '');
      setPhotoURL(userData.photoURL || '');
    }
  }, [userData]);

  // Fetch real-time token balance from Supabase
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchTokenBalance = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('tokens_balance, paid_tokens_balance, free_tokens_balance, user_type, is_paid, is_premium')
          .eq('id', currentUser.uid)
          .maybeSingle();

        if (!error && data) {
          const userType = data.user_type || (data.paid_tokens_balance > 0 ? 'paid' : 'free');
          const paidTokens = data.paid_tokens_balance || 0;
          const freeTokens = data.free_tokens_balance || 0;
          // Use tokens_balance as primary, fallback to calculated total
          const totalTokens = data.tokens_balance || (userType === 'paid' ? paidTokens : freeTokens);

          setTokenBalance(totalTokens);
          setTier(data.is_premium ? 'premium' : data.current_tier || 'free');
        }
      } catch (err) {
        console.error('Error fetching token balance:', err);
      }
    };

    fetchTokenBalance();

    // Subscribe to real-time updates from Supabase
    const channel = supabase
      .channel(`token-balance-${currentUser.uid}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUser.uid}`
        },
        (payload) => {
          if (payload.new && 'tokens_balance' in payload.new) {
            setTokenBalance(payload.new.tokens_balance);
          }
        }
      )
      .subscribe();

    // Listen for custom token balance updates from MainChat
    const handleTokenUpdate = (event: CustomEvent<{ balance: number }>) => {
      if (event.detail && typeof event.detail.balance === 'number') {
        console.log('🔄 Token balance updated via event:', event.detail.balance);
        setTokenBalance(event.detail.balance);
      }
    };

    window.addEventListener('tokenBalanceUpdated', handleTokenUpdate as EventListener);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('tokenBalanceUpdated', handleTokenUpdate as EventListener);
    };
  }, [currentUser?.uid]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button:not([data-drag-handle])')) return;

    e.preventDefault();
    setIsDragging(true);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button:not([data-drag-handle])')) return;

    const touch = e.touches[0];
    setIsDragging(true);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging || !buttonRef.current) return;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;

        let newX = clientX - dragOffset.x;
        let newY = clientY - dragOffset.y;

        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      if (isDragging && position) {
        setIsDragging(false);
        localStorage.setItem('profileButtonPosition', JSON.stringify(position));
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, dragOffset, position]);

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
      setTimeout(() => setShowProfilePopup(false), 800);
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

  if (!currentUser) return null;

  const initials = getInitials(userData?.displayName, currentUser.email || '');

  const buttonStyle = position ? {
    position: 'fixed' as const,
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 9999,
  } : {};

  return (
    <>
      <div
        ref={buttonRef}
        style={buttonStyle}
        className={`${!position ? 'relative' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <button
          data-drag-handle
          onClick={() => !isDragging && setShowProfilePopup(true)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group backdrop-blur-xl shadow-lg hover:shadow-2xl ${!isDragging ? 'hover:scale-[1.02] active:scale-[0.98]' : 'scale-105'} ${theme === 'light'
            ? 'bg-white/95 border-2 border-gray-200 hover:border-[#00FFF0]/50'
            : 'bg-black/95 border-2 border-[#00FFF0]/20 hover:border-[#00FFF0]/50'
            }`}
        >
          <GripVertical className={`w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-[#00FFF0]/50'}`} />

          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${theme === 'light'
            ? 'bg-gradient-to-br from-[#00FFF0] to-[#00D4D4] text-black'
            : 'bg-gradient-to-br from-[#00FFF0] to-[#8A2BE2] text-white'
            }`}>
            {userData?.photoURL ? (
              <img
                src={userData.photoURL}
                alt={userData.displayName || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div className="flex flex-col items-start">
            <span className={`text-xs font-semibold ${theme === 'light' ? 'text-gray-600' : 'text-white/50'
              }`}>
              Tokens
            </span>
            <span className={`text-sm font-bold ${theme === 'light' ? 'text-black' : 'text-[#00FFF0]'
              }`}>
              {formatTokens(tokenBalance)}
            </span>
          </div>
        </button>
      </div>

      {/* Profile Popup */}
      {showProfilePopup && !isDragging && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-black/95 backdrop-blur-2xl rounded-3xl shadow-2xl border-2 border-[#00FFF0]/20 overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="relative p-6 border-b border-[#00FFF0]/10">
              <button
                onClick={() => setShowProfilePopup(false)}
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
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tier === 'premium'
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
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-[#00FFF0]" />
                    <span className="text-white/70 text-sm">Token Balance</span>
                  </div>
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
                    setShowProfilePopup(false);
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
                    setShowProfilePopup(false);
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
      )}
    </>
  );
};
