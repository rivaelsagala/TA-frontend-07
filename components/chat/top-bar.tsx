'use client';

import { Button } from '@/components/ui/button';
import { AVAILABLE_MODELS } from '@/lib/models';
import { ChevronDown, Menu, Settings } from 'lucide-react';
import { useState } from 'react';

interface TopBarProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onMenuClick?: () => void;
  onSettingsClick?: () => void;
}

export function TopBar({ selectedModel, onModelChange, onMenuClick, onSettingsClick }: TopBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel);

  return (
    <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">ChatBot</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Model Selector */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          >
            <span className="text-sm font-medium">{currentModel?.name || 'Select Model'}</span>
            <ChevronDown className="w-4 h-4 opacity-70" />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 z-50">
              <div className="p-2">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg mb-1 last:mb-0 transition-colors ${
                      selectedModel === model.id
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <p className="font-medium text-sm">{model.name}</p>
                    <p className="text-xs opacity-70">{model.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onSettingsClick}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
