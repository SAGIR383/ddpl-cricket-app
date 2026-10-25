'use client';

import React, { useState } from 'react';
import { Palette, Check, X, Sparkles, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { useCorporateTheme, THEME_PRESETS, CorporateTheme } from '@/contexts/ThemeContext';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeCustomizerModal({ isOpen, onClose }: ThemeCustomizerModalProps) {
  const { theme, setTheme, currentTheme, customLogo, setCustomLogo } = useCorporateTheme();
  const [logoInput, setLogoInput] = useState<string>(customLogo || '');

  if (!isOpen) return null;

  const handleApplyLogo = () => {
    setCustomLogo(logoInput.trim() || null);
  };

  const handleReset = () => {
    setTheme('gold');
    setCustomLogo(null);
    setLogoInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#0D1B2A] border-2 border-[#D8AD55]/40 shadow-2xl space-y-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D8AD55]/20 border border-[#D8AD55]/40 flex items-center justify-center text-[#F2D69A]">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white">
                Corporate Brand &amp; Colors
              </h3>
              <p className="text-xs text-[#8793A5]">
                Customize accent branding and company crest
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Palette Presets */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Select Corporate Accent Theme
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {(Object.keys(THEME_PRESETS) as CorporateTheme[]).map((tKey) => {
              const preset = THEME_PRESETS[tKey];
              const isSelected = theme === tKey;

              return (
                <button
                  key={tKey}
                  type="button"
                  onClick={() => setTheme(tKey)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/10 border-[#D8AD55] ring-2 ring-[#D8AD55]/40'
                      : 'bg-[#08111F] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-5 h-5 rounded-full shadow"
                      style={{ backgroundColor: preset.primaryHex }}
                    />
                    <div>
                      <div className="font-bold text-xs text-white">{preset.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {preset.primaryHex}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#D8AD55] flex items-center justify-center text-[#08111F]">
                      <Check className="w-4 h-4 font-black" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Company Logo URL */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
            Custom Organization Crest / Logo (URL)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={logoInput}
              onChange={(e) => setLogoInput(e.target.value)}
              placeholder="https://example.com/company-logo.png"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D8AD55]"
            />
            <button
              type="button"
              onClick={handleApplyLogo}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-bold text-xs cursor-pointer hover:brightness-110"
            >
              Apply
            </button>
          </div>
          {customLogo && (
            <div className="flex items-center justify-between text-xs text-emerald-400 pt-1">
              <span>Active Custom Logo Applied</span>
              <button
                type="button"
                onClick={() => {
                  setCustomLogo(null);
                  setLogoInput('');
                }}
                className="text-gray-400 hover:text-white underline text-[11px] cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
