import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { MessageCreditsService, UserCreditsInfo } from '../../lib/messageCreditsService';
import { useAuth } from '../../hooks/useAuth';

export function MessageCreditsDisplay() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCreditsInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCredits();
    }
  }, [user]);

  const loadCredits = async () => {
    if (!user) return;

    setLoading(true);
    const data = await MessageCreditsService.getUserCredits(user.uid);
    setCredits(data);
    setLoading(false);
  };

  if (loading || !credits) {
    return null;
  }

  const upgradeMessage = MessageCreditsService.getUpgradeMessage(credits);
  const canSend = MessageCreditsService.canSendMessage(credits);

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${credits.is_paid_user ? 'bg-blue-500/20' : 'bg-gray-700'}`}>
            {credits.is_paid_user ? (
              <Sparkles className="w-5 h-5 text-blue-400" />
            ) : (
              <MessageSquare className="w-5 h-5 text-gray-400" />
            )}
          </div>

          <div>
            <div className="text-sm font-medium text-white">
              {credits.is_paid_user ? 'Paid Plan' : 'Free Plan'}
            </div>
            <div className="text-xs text-gray-400">
              {MessageCreditsService.formatCreditsDisplay(credits)}
            </div>
          </div>
        </div>

        {!canSend && (
          <div className="flex items-center gap-2 text-yellow-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Limit Reached</span>
          </div>
        )}
      </div>

      {upgradeMessage && (
        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-yellow-200">{upgradeMessage}</p>
              <button
                onClick={() => window.location.href = '/billing'}
                className="mt-2 text-xs font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                View Plans →
              </button>
            </div>
          </div>
        </div>
      )}

      {credits.is_paid_user && credits.messages_remaining < 50 && credits.messages_remaining > 0 && (
        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-blue-200">
                You're running low on message credits. Consider purchasing more to avoid interruption.
              </p>
              <button
                onClick={() => window.location.href = '/billing'}
                className="mt-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Buy More Credits →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
