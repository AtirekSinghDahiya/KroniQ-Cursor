import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { useToast } from '../../contexts/ToastContext';
import { User, Bell, ArrowLeft, Palette, Shield, CreditCard } from 'lucide-react';
import { ChatSidebar } from '../Chat/ChatSidebar';
import { ThemeSelector } from './ThemeSelector';
import { getProjects, deleteProject, renameProject } from '../../lib/chatService';
import { supabase } from '../../lib/supabaseClient';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { getUserTier } from '../../lib/userTierService';

interface NotificationSettings {
  email_notifications: boolean;
  product_updates: boolean;
  marketing_emails: boolean;
}

export const ImprovedSettingsView: React.FC = () => {
  const { userData, currentUser } = useAuth();
  const { navigateTo } = useNavigation();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    product_updates: true,
    marketing_emails: false
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [tierInfo, setTierInfo] = useState<{ isPremium: boolean; totalTokens: number } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const loadedProjects = await getProjects();
      setProjects(loadedProjects);

      if (userData?.displayName) {
        setDisplayName(userData.displayName);
      } else if (currentUser?.displayName) {
        setDisplayName(currentUser.displayName);
      }

      if (currentUser?.uid) {
        const { data } = await supabase
          .from('user_preferences')
          .select('email_notifications, product_updates, marketing_emails')
          .eq('user_id', currentUser.uid)
          .maybeSingle();

        if (data) {
          setNotifications({
            email_notifications: data.email_notifications ?? true,
            product_updates: data.product_updates ?? true,
            marketing_emails: data.marketing_emails ?? false
          });
        }
      }
    };

    loadData();
  }, [userData, currentUser]);

  useEffect(() => {
    const loadTierInfo = async () => {
      if (currentUser?.uid) {
        const info = await getUserTier(currentUser.uid);
        setTierInfo(info);
      }
    };
    loadTierInfo();
  }, [currentUser]);

  const handleUpdateProfile = async () => {
    if (!currentUser || !auth.currentUser) return;

    setIsUpdatingProfile(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });

      await supabase
        .from('user_preferences')
        .upsert({
          user_id: currentUser.uid,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleNotificationChange = async (key: keyof NotificationSettings, value: boolean) => {
    if (!currentUser) return;

    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);

    setIsUpdatingNotifications(true);
    try {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: currentUser.uid,
          [key]: value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error updating notifications:', error);
      showToast('Failed to update notification settings', 'error');
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
    setProjects(projects.filter(p => p.id !== projectId));
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    await renameProject(projectId, newName);
    setProjects(projects.map(p => p.id === projectId ? { ...p, name: newName } : p));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatSidebar
        projects={projects}
        activeProjectId={null}
        onNewChat={() => navigateTo('chat')}
        onSelectProject={(id) => {
          const project = projects.find(p => p.id === id);
          if (project) navigateTo('chat');
        }}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="min-h-screen p-4 md:p-8">
          <button
            onClick={() => navigateTo('chat')}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Chat</span>
          </button>

          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">Settings</h1>
          <p className="text-white/50 text-sm mb-8">Manage your account preferences and settings</p>

        <div className="space-y-6 pb-8 max-w-4xl">
          {tierInfo && (
            <div className="glass-panel rounded-2xl p-6 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#00FFF0]/30 to-[#8A2BE2]/30 flex items-center justify-center border border-white/20">
                  <CreditCard className="w-5 h-5 text-[#00FFF0]" />
                </div>
                <h2 className="text-xl font-bold text-white">Account Status</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Account Type</p>
                    <p className="text-white/60 text-sm">Your current subscription tier</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full font-semibold ${tierInfo.isPremium ? 'bg-[#00FFF0]/20 text-[#00FFF0]' : 'bg-white/10 text-white/60'}`}>
                    {tierInfo.isPremium ? 'Premium' : 'Free'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Token Balance</p>
                    <p className="text-white/60 text-sm">Available tokens for generation</p>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
                    {tierInfo.totalTokens.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel rounded-2xl p-6 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#00FFF0]/30 to-[#8A2BE2]/30 flex items-center justify-center border border-white/20">
                <User className="w-5 h-5 text-[#00FFF0]" />
              </div>
              <h2 className="text-xl font-bold text-white">Profile Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#00FFF0] focus:border-transparent transition-all"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
                  disabled
                />
              </div>

              <button
                onClick={handleUpdateProfile}
                disabled={isUpdatingProfile}
                className="px-6 py-3 bg-gradient-to-r from-[#00FFF0]/20 to-[#8A2BE2]/20 hover:from-[#00FFF0]/30 hover:to-[#8A2BE2]/30 text-white rounded-lg border border-white/10 hover:border-[#00FFF0]/50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/10 backdrop-blur-xl">
            <ThemeSelector />
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500/30 to-pink-500/30 flex items-center justify-center border border-white/20">
                <Bell className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Notifications</h2>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer p-4 rounded-lg hover:bg-white/5 transition-all">
                <div>
                  <div className="font-medium text-white">Email Notifications</div>
                  <div className="text-sm text-white/60">Receive email about your account activity</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email_notifications}
                  onChange={(e) => handleNotificationChange('email_notifications', e.target.checked)}
                  className="w-5 h-5 text-[#00FFF0] bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-[#00FFF0]"
                  disabled={isUpdatingNotifications}
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-4 rounded-lg hover:bg-white/5 transition-all">
                <div>
                  <div className="font-medium text-white">Product Updates</div>
                  <div className="text-sm text-white/60">News about product features and updates</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.product_updates}
                  onChange={(e) => handleNotificationChange('product_updates', e.target.checked)}
                  className="w-5 h-5 text-[#00FFF0] bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-[#00FFF0]"
                  disabled={isUpdatingNotifications}
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-4 rounded-lg hover:bg-white/5 transition-all">
                <div>
                  <div className="font-medium text-white">Marketing Emails</div>
                  <div className="text-sm text-white/60">Receive tips and promotional content</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.marketing_emails}
                  onChange={(e) => handleNotificationChange('marketing_emails', e.target.checked)}
                  className="w-5 h-5 text-[#00FFF0] bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-[#00FFF0]"
                  disabled={isUpdatingNotifications}
                />
              </label>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/30 to-cyan-500/30 flex items-center justify-center border border-white/20">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Privacy & Security</h2>
            </div>
            <div className="space-y-3 text-white/60 text-sm">
              <p>• Your data is encrypted and securely stored</p>
              <p>• We never share your personal information with third parties</p>
              <p>• All AI generations are processed securely through official APIs</p>
              <p>• Your chat history and generated content is private</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
