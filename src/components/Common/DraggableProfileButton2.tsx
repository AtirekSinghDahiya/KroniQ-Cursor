import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, Settings, GripVertical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { useTheme } from '../../contexts/ThemeContext';

interface Position {
  x: number;
  y: number;
}

export const DraggableProfileButton: React.FC = () => {
  const { currentUser, signOut, userData } = useAuth();
  const { navigateTo } = useNavigation();
  const { currentTheme: theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

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

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button:not([data-drag-handle])')) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button:not([data-drag-handle])')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
    }
  };

  // Drag move/end handling
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

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
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

  // Utility functions
  const getInitials = (name?: string, email?: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return 'U';
  };

  // Don't render if no user
  if (!currentUser) return null;

  const initials = getInitials(userData?.displayName, currentUser.email || '');

  const buttonStyle = position ? {
    position: 'fixed' as const,
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 9999,
  } : {};

  return (
    <div
      ref={buttonRef}
      style={buttonStyle}
      className={`draggable-element ${!position ? 'relative' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <button
        data-drag-handle
        onClick={() => !isDragging && setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group backdrop-blur-xl shadow-lg hover:shadow-2xl ${!isDragging ? 'hover:scale-[1.02] active:scale-[0.98]' : 'scale-105'} ${theme === 'light'
          ? 'bg-white/95 border-2 border-gray-200 hover:border-[#EC4899]/50'
          : 'bg-black/95 border-2 border-[#EC4899]/20 hover:border-[#EC4899]/50'
          }`}
      >
        <GripVertical className={`w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-[#EC4899]/50'}`} />

        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${theme === 'light'
          ? 'bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] text-white'
          : 'bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] text-white'
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

        {/* Profile Label */}
        <span className={`text-sm font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>
          Profile
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isDragging && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className={`absolute top-full right-0 mt-2 w-64 rounded-xl shadow-2xl border z-[9999] overflow-hidden backdrop-blur-2xl animate-fade-in ${theme === 'light'
            ? 'bg-white/95 border-gray-200'
            : 'bg-black/95 border-[#EC4899]/20'
            }`}>
            {/* User Info Section */}
            <div className={`p-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-[#EC4899]/10'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg ${theme === 'light'
                  ? 'bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] text-white'
                  : 'bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] text-white'
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
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                    {userData?.displayName || 'User'}
                  </p>
                  <p className={`text-xs truncate ${theme === 'light' ? 'text-gray-600' : 'text-white/50'}`}>
                    {currentUser.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  navigateTo('profile');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${theme === 'light'
                  ? 'hover:bg-gray-100 text-black'
                  : 'hover:bg-[#EC4899]/5 text-white/90'
                  }`}
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">View Profile</span>
              </button>

              <button
                onClick={() => {
                  navigateTo('settings');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${theme === 'light'
                  ? 'hover:bg-gray-100 text-black'
                  : 'hover:bg-[#EC4899]/5 text-white/90'
                  }`}
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Settings</span>
              </button>
            </div>

            {/* Logout */}
            <div className={`border-t ${theme === 'light' ? 'border-gray-200' : 'border-[#EC4899]/10'}`}>
              <button
                onClick={async () => {
                  await signOut();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${theme === 'light'
                  ? 'hover:bg-red-50 text-red-600'
                  : 'hover:bg-red-500/10 text-red-400'
                  }`}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
