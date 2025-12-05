/**
 * Visual Debug Panel - Shows logs directly in the UI
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface DebugLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Listen for custom debug events
    const handleDebugLog = (event: any) => {
      const { type, message } = event.detail;
      const timestamp = new Date().toLocaleTimeString();

      setLogs(prev => [...prev, { timestamp, type, message }].slice(-50)); // Keep last 50 logs
    };

    window.addEventListener('debugLog', handleDebugLog);

    // Add initial log
    addDebugLog('info', '🚀 Debug Panel Active - Waiting for AI calls...');

    return () => {
      window.removeEventListener('debugLog', handleDebugLog);
    };
  }, []);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '🔵';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50"
      >
        Show Debug Logs
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white font-semibold text-sm">AI Debug Panel</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-mono">
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No logs yet. Send a message to see debug info.
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-gray-600 flex-shrink-0">{log.timestamp}</span>
              <span className="flex-shrink-0">{getLogIcon(log.type)}</span>
              <span className={`${getLogColor(log.type)} break-all`}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-700 bg-gray-800">
        <button
          onClick={() => setLogs([])}
          className="w-full text-gray-400 hover:text-white text-xs py-1 transition-colors"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
};

// Helper function to add debug logs from anywhere
export function addDebugLog(type: 'info' | 'success' | 'error' | 'warning', message: string) {
  window.dispatchEvent(new CustomEvent('debugLog', { detail: { type, message } }));
}
