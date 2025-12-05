import React from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, ThemeName } from '../../contexts/ThemeContext';

export const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, availableThemes, themeColors } = useTheme();

  const themePreview = (themeName: ThemeName) => {
    const theme = availableThemes.find(t => t.name === themeName);
    if (!theme) return null;

    return (
      <div className="flex gap-1">
        <div
          className="w-6 h-6 rounded"
          style={{ background: theme.background }}
        />
        <div
          className="w-6 h-6 rounded"
          style={{ background: theme.accent }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg" style={{ background: themeColors.surface }}>
          <Palette className="w-5 h-5" style={{ color: themeColors.accent }} />
        </div>
        <div>
          <h3 className="text-lg font-semibold" style={{ color: themeColors.text }}>
            Theme
          </h3>
          <p className="text-sm" style={{ color: themeColors.textMuted }}>
            Choose your preferred color theme
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {availableThemes.map((theme) => (
          <button
            key={theme.name}
            onClick={() => setTheme(theme.name)}
            className="relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 text-left"
            style={{
              background: currentTheme === theme.name ? themeColors.surface : themeColors.input,
              borderColor: currentTheme === theme.name ? themeColors.accent : themeColors.border,
            }}
          >
            {currentTheme === theme.name && (
              <div
                className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: themeColors.accent }}
              >
                <Check className="w-4 h-4" style={{ color: theme.name === 'pure-white' ? '#000' : '#fff' }} />
              </div>
            )}

            <div className="flex items-center gap-3 mb-3">
              {themePreview(theme.name)}
              <div className="flex-1">
                <div className="font-semibold" style={{ color: themeColors.text }}>
                  {theme.displayName}
                </div>
              </div>
            </div>

            <p className="text-sm" style={{ color: themeColors.textMuted }}>
              {theme.description}
            </p>
          </button>
        ))}
      </div>

      <div
        className="mt-6 p-4 rounded-xl"
        style={{
          background: themeColors.surface,
          border: `1px solid ${themeColors.border}`,
        }}
      >
        <h4 className="font-semibold mb-2" style={{ color: themeColors.text }}>
          Current Theme: {themeColors.displayName}
        </h4>
        <p className="text-sm mb-3" style={{ color: themeColors.textMuted }}>
          {themeColors.description}
        </p>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ background: themeColors.accent }}
            />
            <span className="text-xs" style={{ color: themeColors.textMuted }}>Accent</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ background: themeColors.text }}
            />
            <span className="text-xs" style={{ color: themeColors.textMuted }}>Text</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border"
              style={{
                background: themeColors.surface,
                borderColor: themeColors.border,
              }}
            />
            <span className="text-xs" style={{ color: themeColors.textMuted }}>Surface</span>
          </div>
        </div>
      </div>
    </div>
  );
};
