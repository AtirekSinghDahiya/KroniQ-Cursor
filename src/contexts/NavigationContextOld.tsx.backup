import React, { createContext, useContext, useState } from 'react';
import { Project } from '../types';

type ViewType = 'chat' | 'projects' | 'voice' | 'code' | 'design' | 'video' | 'ppt' | 'billing' | 'admin' | 'analytics' | 'settings' | 'profile' | 'backup';

interface NavigationContextType {
  currentView: ViewType;
  activeProject: Project | null;
  navigateTo: (view: ViewType, project?: Project) => void;
  setActiveProject: (project: Project | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const navigateTo = (view: ViewType, project?: Project) => {
    setCurrentView(view);
    if (project) {
      setActiveProject(project);
    }
  };

  return (
    <NavigationContext.Provider value={{ currentView, activeProject, navigateTo, setActiveProject }}>
      {children}
    </NavigationContext.Provider>
  );
};
