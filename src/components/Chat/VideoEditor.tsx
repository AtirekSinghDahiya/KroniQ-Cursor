import React, { useState, useEffect } from 'react';
import { X, Upload, Wand2, Download, Loader, Film, AlertCircle, Sparkles } from 'lucide-react';
import { editVideoWithWanVace, isWanVaceAvailable } from '../../lib/wanVaceService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { getUserTierAccess } from '../../lib/tierAccessService';

interface VideoEditorProps {
  onClose: () => void;
  initialPrompt?: string;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ onClose, initialPrompt = '' }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedVideoUrl, setEditedVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [videoType, setVideoType] = useState<'auto' | 'general' | 'human'>('auto');
  const [resolution, setResolution] = useState<'auto' | '480p' | '720p'>('auto');
  const [canAccessVideoEdit, setCanAccessVideoEdit] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (user?.uid) {
      setIsCheckingAccess(true);
      getUserTierAccess(user.uid).then(access => {
        setCanAccessVideoEdit(access.canAccessVideoGeneration);
        setIsCheckingAccess(false);
        console.log('✅ [VIDEO EDITOR] Video editing access:', access.canAccessVideoGeneration);
      }).catch(() => {
        setCanAccessVideoEdit(false);
        setIsCheckingAccess(false);
      });
    } else {
      setCanAccessVideoEdit(false);
      setIsCheckingAccess(false);
    }
  }, [user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        showToast('error', 'Invalid File', 'Please upload a video file');
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      showToast('success', 'Video Loaded', 'Ready to edit');
    }
  };

  const handleEdit = async () => {
    if (!prompt.trim()) {
      showToast('warning', 'Enter Prompt', 'Describe what changes you want');
      return;
    }

    if (!videoUrl && !videoFile) {
      showToast('warning', 'Upload Video', 'Please upload a video to edit');
      return;
    }

    if (!canAccessVideoEdit) {
      showToast('error', 'Premium Feature', 'Video editing is only available for paid users');
      return;
    }

    if (!isWanVaceAvailable()) {
      showToast('error', 'Service Unavailable', 'Wan VACE API is not configured');
      return;
    }

    setIsEditing(true);
    setProgress(0);
    setEditedVideoUrl(null);

    try {
      const result = await editVideoWithWanVace(
        {
          prompt: prompt,
          video_url: videoUrl,
          video_type: videoType,
          resolution: resolution,
          acceleration: 'regular',
          enable_auto_downsample: true,
          aspect_ratio: 'auto'
        },
        (status, prog) => {
          setProgressStatus(status);
          setProgress(prog);
        }
      );

      setEditedVideoUrl(result);
      showToast('success', 'Video Edited!', 'Your edited video is ready');
    } catch (error: any) {
      console.error('Video editing error:', error);
      showToast('error', 'Editing Failed', error.message || 'Could not edit video');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDownload = () => {
    if (!editedVideoUrl) return;
    const link = document.createElement('a');
    link.href = editedVideoUrl;
    link.download = `kroniq-edited-video-${Date.now()}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Downloaded!', 'Video saved to your device');
  };

  const wanVaceAvailable = isWanVaceAvailable();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] animate-fade-in p-2 md:p-4">
      <div className="relative w-full max-w-6xl mx-auto h-full md:h-auto overflow-y-auto">
        <div className="relative bg-gradient-to-br from-purple-900 via-slate-800 to-purple-900 backdrop-blur-2xl rounded-2xl md:rounded-3xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 overflow-hidden">

          <div className="absolute -inset-[2px] bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-3xl blur-xl animate-pulse opacity-50" />

          <div className="relative bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 backdrop-blur-sm p-6 border-b border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/30">
                  <Film className="w-7 h-7 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    AI Video Editor
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                  </h2>
                  <p className="text-sm text-purple-300/80 mt-0.5">
                    Powered by Wan VACE AI (Premium)
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all group"
              >
                <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative p-6 space-y-6">
            {isCheckingAccess && (
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <Loader className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
                <div className="text-sm text-blue-200">
                  <p className="font-semibold mb-1">Checking Access...</p>
                  <p className="text-blue-300/80">Verifying your tier status...</p>
                </div>
              </div>
            )}

            {!isCheckingAccess && !canAccessVideoEdit && (
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <p className="font-semibold mb-1">Premium Feature</p>
                  <p className="text-yellow-300/80">Video editing is only available for users who have purchased tokens.</p>
                </div>
              </div>
            )}

            {!wanVaceAvailable && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-200">
                  <p className="font-semibold mb-1">Service Unavailable</p>
                  <p className="text-red-300/80">Wan VACE API is not configured</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-purple-400" />
                    Upload Video
                  </label>
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isEditing}
                    />
                    <div className="px-4 py-8 rounded-xl border-2 border-dashed border-purple-400/50 bg-slate-800/50 hover:bg-slate-800/70 transition-all text-center">
                      {videoFile ? (
                        <div className="space-y-2">
                          <Film className="w-8 h-8 text-purple-400 mx-auto" />
                          <p className="text-sm text-white font-medium">{videoFile.name}</p>
                          <p className="text-xs text-purple-300/60">Click to change</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-purple-400/50 mx-auto" />
                          <p className="text-sm text-white/70">Click to upload video</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {videoUrl && (
                  <div className="rounded-xl overflow-hidden bg-black">
                    <video src={videoUrl} controls className="w-full max-h-64" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-purple-400" />
                    Edit Instructions
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe how you want to edit the video... e.g., 'Add slow motion effect' or 'Change background to sunset'"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-white/30 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 resize-none"
                    rows={6}
                    disabled={isEditing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/70">Video Type</label>
                    <select
                      value={videoType}
                      onChange={(e) => setVideoType(e.target.value as any)}
                      disabled={isEditing}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm focus:border-purple-400/50 focus:outline-none"
                    >
                      <option value="auto">Auto Detect</option>
                      <option value="general">General</option>
                      <option value="human">Human</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/70">Resolution</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as any)}
                      disabled={isEditing}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm focus:border-purple-400/50 focus:outline-none"
                    >
                      <option value="auto">Auto</option>
                      <option value="480p">480p</option>
                      <option value="720p">720p</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleEdit}
                  disabled={isEditing || !videoUrl || !prompt.trim() || !canAccessVideoEdit}
                  className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {isEditing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Editing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      Edit Video
                    </>
                  )}
                </button>
              </div>
            </div>

            {isEditing && (
              <div className="space-y-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <div className="flex items-center justify-between text-sm text-white">
                  <span>{progressStatus || 'Processing...'}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {editedVideoUrl && (
              <div className="space-y-4 p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-400/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Edited Video</h3>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
                <video src={editedVideoUrl} controls className="w-full rounded-lg" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
