import React, { useState, useEffect } from 'react';
import { Database, Download, Trash2, RefreshCw, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface BackupProject {
  id: string;
  title: string;
  type: string;
  lastModified: Date;
  isDeleted: boolean;
  content: any;
}

export const BackupView: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<BackupProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'deleted' | 'active'>('all');

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const storedProjects = localStorage.getItem(`projects_${user?.uid}`);
      if (storedProjects) {
        const parsed = JSON.parse(storedProjects);
        setProjects(parsed.map((p: any) => ({
          ...p,
          lastModified: new Date(p.lastModified || Date.now()),
          isDeleted: p.isDeleted || false,
        })));
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      showToast('error', 'Load Failed', 'Could not load backups');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = (project: BackupProject) => {
    const dataStr = JSON.stringify(project, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, '_')}_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', 'Downloaded', 'Backup downloaded successfully');
  };

  const filteredProjects = projects.filter(p => {
    if (filter === 'deleted') return p.isDeleted;
    if (filter === 'active') return !p.isDeleted;
    return true;
  });

  return (
    <div className={`flex-1 flex flex-col ${
      theme === 'light'
        ? 'bg-gradient-to-br from-gray-50 to-blue-50'
        : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
    }`}>
      <div className={`p-6 border-b ${
        theme === 'light' ? 'border-gray-200 bg-white/50' : 'border-white/10 bg-black/20'
      } backdrop-blur-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Project Backup
              </h1>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-white/60'}`}>
                All your projects including deleted ones
              </p>
            </div>
          </div>
          <button
            onClick={loadBackups}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              theme === 'light'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          {['all', 'active', 'deleted'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? theme === 'light'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : theme === 'light'
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className={`text-center py-12 ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>
            <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No {filter === 'all' ? '' : filter} projects found</p>
          </div>
        ) : (
          <div className="grid gap-4 max-w-4xl mx-auto">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`p-6 rounded-2xl border transition-all ${
                  theme === 'light'
                    ? 'bg-white border-gray-200 hover:shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {project.title}
                      </h3>
                      {project.isDeleted && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-500 rounded-full">
                          Deleted
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`${theme === 'light' ? 'text-gray-600' : 'text-white/60'}`}>
                        Type: {project.type}
                      </span>
                      <span className={`flex items-center gap-1 ${theme === 'light' ? 'text-gray-600' : 'text-white/60'}`}>
                        <Clock className="w-4 h-4" />
                        {project.lastModified.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadBackup(project)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      theme === 'light'
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
