import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { useToast } from '../../contexts/ToastContext';
import { User, Bell, Trash2, ArrowLeft, Palette, Settings as SettingsIcon, X, Save } from 'lucide-react';
import { getProjects, deleteProject } from '../../lib/chatService';
import { supabase } from '../../lib/supabaseClient';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface NotificationSettings {
  email_notifications: boolean;
  product_updates: boolean;
  marketing_emails: boolean;
}

export const SettingsView: React.FC = () => {
  const { userData, currentUser } = useAuth();
  const { navigateTo } = useNavigation();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    product_updates: true,
    marketing_emails: false
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [activeSection, setActiveSection] = useState<'account' | 'notifications' | 'data'>('account');

  useEffect(() => {
    const loadData = async () => {
      const loadedProjects = await getProjects();
      setProjects(loadedProjects);

      if (userData?.displayName) {
        setDisplayName(userData.displayName);
      } else if (currentUser?.displayName) {
        setDisplayName(currentUser.displayName);
      }

      if (currentUser?.email) {
        setEmail(currentUser.email);
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

      showToast('success', 'Profile Updated', 'Your profile has been saved');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('error', 'Update Failed', 'Could not update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleNotificationChange = async (key: keyof NotificationSettings, value: boolean) => {
    if (!currentUser) return;

    const newSettings = { ...notifications, [key]: value };
    setNotifications(newSettings);

    try {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: currentUser.uid,
          [key]: value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      showToast('success', 'Settings Updated', 'Notification preferences saved');
    } catch (error) {
      console.error('Error updating notifications:', error);
      showToast('error', 'Update Failed', 'Could not save settings');
    }
  };

  const handleDeleteAllData = async () => {
    if (!currentUser?.uid) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete all your data? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      for (const project of projects) {
        await deleteProject(project.id);
      }

      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', currentUser.uid);

      setProjects([]);
      showToast('success', 'Data Deleted', 'All your data has been removed');
    } catch (error) {
      console.error('Error deleting data:', error);
      showToast('error', 'Delete Failed', 'Could not delete data');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Top Header */}
      <div className="border-b border-white/10 bg-black">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateTo('chat')}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <SettingsIcon className="w-6 h-6" />
            <h1 className="text-xl font-bold">Settings</h1>
          </div>

          <button
            onClick={() => navigateTo('chat')}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r border-white/10 bg-black p-6">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveSection('account')}
              className={`w-full px-4 py-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                activeSection === 'account'
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Account</span>
            </button>

            <button
              onClick={() => setActiveSection('notifications')}
              className={`w-full px-4 py-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                activeSection === 'notifications'
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="font-medium">Notifications</span>
            </button>

            <button
              onClick={() => setActiveSection('data')}
              className={`w-full px-4 py-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                activeSection === 'data'
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Data & Privacy</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {/* Account Section */}
            {activeSection === 'account' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Account Settings</h2>
                  <p className="text-white/50">Manage your account information</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
                    />
                    <p className="text-xs text-white/40 mt-2">
                      Email cannot be changed
                    </p>
                  </div>

                  <button
                    onClick={handleUpdateProfile}
                    disabled={isUpdatingProfile}
                    className="w-full px-6 py-3 bg-white text-black hover:bg-white/90 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUpdatingProfile ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Notification Preferences</h2>
                  <p className="text-white/50">Choose what updates you want to receive</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Email Notifications</h3>
                      <p className="text-sm text-white/50">Receive email updates about your account</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('email_notifications', !notifications.email_notifications)}
                      className={`w-12 h-6 rounded-full transition-all ${
                        notifications.email_notifications ? 'bg-white' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-black transition-transform ${
                        notifications.email_notifications ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="border-t border-white/10 pt-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Product Updates</h3>
                      <p className="text-sm text-white/50">Get notified about new features</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('product_updates', !notifications.product_updates)}
                      className={`w-12 h-6 rounded-full transition-all ${
                        notifications.product_updates ? 'bg-white' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-black transition-transform ${
                        notifications.product_updates ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="border-t border-white/10 pt-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Marketing Emails</h3>
                      <p className="text-sm text-white/50">Receive promotional content and offers</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('marketing_emails', !notifications.marketing_emails)}
                      className={`w-12 h-6 rounded-full transition-all ${
                        notifications.marketing_emails ? 'bg-white' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-black transition-transform ${
                        notifications.marketing_emails ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Privacy Section */}
            {activeSection === 'data' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Data & Privacy</h2>
                  <p className="text-white/50">Manage your data and privacy settings</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-white mb-2">Your Projects</h3>
                    <p className="text-sm text-white/50 mb-4">
                      You have {projects.length} project{projects.length !== 1 ? 's' : ''} saved
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <h3 className="font-semibold text-white mb-2">Delete All Data</h3>
                    <p className="text-sm text-white/50 mb-4">
                      Permanently delete all your projects and data. This action cannot be undone.
                    </p>
                    <button
                      onClick={handleDeleteAllData}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete All Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
