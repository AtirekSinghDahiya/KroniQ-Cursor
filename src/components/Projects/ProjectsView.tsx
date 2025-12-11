import React, { useState, useEffect } from 'react';
import { subscribeToProjects, createProject } from '../../lib/chatService';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Code, Palette, Clock, Folder, Image as ImageIcon, Video, Music, Mic, Presentation, MessageSquare } from 'lucide-react';
import { Project } from '../../lib/supabaseClient';

interface ProjectsViewProps {
  onOpenProject: (project: Project) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onOpenProject }) => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<'code' | 'design' | 'image' | 'video' | 'music' | 'voice' | 'ppt'>('code');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToProjects((loadedProjects) => {
      setProjects(loadedProjects.filter(p => p.status === 'active'));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const createProjectHandler = async () => {
    if (!currentUser || !newProjectName.trim()) return;

    try {
      await createProject(newProjectName, newProjectType, newProjectDesc);

      setShowNewProject(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectType('code');
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto gradient-background">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">Manage your AI-powered projects</p>
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        {showNewProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">Create New Project</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="My Awesome Project"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setNewProjectType('code')}
                      className={`flex items-center gap-2 p-4 border-2 rounded-lg transition-all ${newProjectType === 'code'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Code className="w-5 h-5" />
                      <span className="font-medium">Code</span>
                    </button>
                    <button
                      onClick={() => setNewProjectType('design')}
                      className={`flex items-center gap-2 p-4 border-2 rounded-lg transition-all ${newProjectType === 'design'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Palette className="w-5 h-5" />
                      <span className="font-medium">Design</span>
                    </button>
                    <button
                      onClick={() => setNewProjectType('image')}
                      className={`flex items-center gap-2 p-4 border-2 rounded-lg transition-all ${newProjectType === 'image'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span className="font-medium">Image</span>
                    </button>
                    <button
                      onClick={() => setNewProjectType('video')}
                      className={`flex items-center gap-2 p-4 border-2 rounded-lg transition-all ${newProjectType === 'video'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Video className="w-5 h-5" />
                      <span className="font-medium">Video</span>
                    </button>
                    <button
                      onClick={() => setNewProjectType('music')}
                      className={`flex items-center gap-2 p-4 border-2 rounded-lg transition-all ${newProjectType === 'music'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Music className="w-5 h-5" />
                      <span className="font-medium">Music</span>
                    </button>
                    <button
                      onClick={() => setNewProjectType('voice')}
                      className={`flex items-center gap-2 p-4 border-2 rounded-lg transition-all ${newProjectType === 'voice'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Mic className="w-5 h-5" />
                      <span className="font-medium">Voice</span>
                    </button>
                    <button
                      onClick={() => setNewProjectType('ppt')}
                      className={`flex items-center gap-2 p-4 border-2 rounded-lg transition-all ${newProjectType === 'ppt'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Presentation className="w-5 h-5" />
                      <span className="font-medium">PPT</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Brief description of your project..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewProject(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={createProjectHandler}
                  disabled={!newProjectName.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first project to get started</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onOpenProject(project)}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-200 hover:border-blue-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                    {project.type === 'code' && <Code className="w-6 h-6 text-blue-600" />}
                    {project.type === 'design' && <Palette className="w-6 h-6 text-purple-600" />}
                    {project.type === 'image' && <ImageIcon className="w-6 h-6 text-green-600" />}
                    {project.type === 'video' && <Video className="w-6 h-6 text-red-600" />}
                    {project.type === 'music' && <Music className="w-6 h-6 text-pink-600" />}
                    {project.type === 'voice' && <Mic className="w-6 h-6 text-indigo-600" />}
                    {project.type === 'ppt' && <Presentation className="w-6 h-6 text-orange-600" />}
                    {project.type === 'chat' && <MessageSquare className="w-6 h-6 text-gray-600" />}
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                    {project.type}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {project.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description || 'No description'}
                </p>

                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(project.lastModified).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
