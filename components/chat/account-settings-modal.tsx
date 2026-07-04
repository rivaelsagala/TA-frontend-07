'use client';

import { Button } from '@/components/ui/button';
import { X, User, Bell, Palette, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelSelect?: (model: string) => void;
}

interface ModelOption {
  name: string;
  image: string;
}

// Hanya 4 model valid
const MODELS: ModelOption[] = [
  { name: 'Llama 3.1 8B', image: '/images/llama.png' },
  { name: 'Qwen 2.5 7B', image: '/images/qwen.png' },
  { name: 'DeepSeek R1 7B', image: '/images/deepseek.png' },
  { name: 'Legal Assistant FT', image: '/images/legal.png' },
];

export function AccountSettingsModal({
  isOpen,
  onClose,
  onModelSelect,
}: AccountSettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[3]);

  useEffect(() => {
    setMounted(true);
    onModelSelect?.(selectedModel.name);
  }, []);

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const handleModelSelect = (model: ModelOption) => {
    setSelectedModel(model);
    onModelSelect?.(model.name);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed right-4 top-16 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 z-50">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close settings modal"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Account Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Account
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Username</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">User123</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">user@example.com</p>
              <Button variant="outline" size="sm" className="w-full text-sm">Edit Profile</Button>
            </div>
          </div>

          {/* General Settings */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" /> General
            </h3>
            <div className="space-y-3">
              {/* Dark Mode */}
              <label htmlFor="dark-mode-toggle" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
                <input
                  id="dark-mode-toggle"
                  type="checkbox"
                  checked={mounted && theme === 'dark'}
                  onChange={(e) => handleThemeChange(e.target.checked)}
                  className="sr-only"
                  aria-label="Toggle dark mode"
                />
                <div className="w-9 h-5 rounded-full bg-gray-300 peer-checked:bg-purple-500 relative">
                  <span className="absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-[1.4rem]"></span>
                </div>
              </label>

              {/* Notifications */}
              <label htmlFor="notifications-toggle" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Bell className="w-4 h-4" /> Notifications
                </span>
                <input
                  id="notifications-toggle"
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="sr-only"
                  aria-label="Toggle notifications"
                />
                <div className="w-9 h-5 rounded-full bg-gray-300 peer-checked:bg-purple-500 relative">
                  <span className="absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-[1.4rem]"></span>
                </div>
              </label>

              {/* Model Selection */}
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pilih Model</p>
                <div className="grid grid-cols-2 gap-2">
                  {MODELS.map((model) => (
                    <button
                      key={model.name}
                      onClick={() => handleModelSelect(model)}
                      className={`flex items-center gap-2 p-2 rounded-lg border ${
                        selectedModel.name === model.name
                          ? "border-[#007AFF] bg-[#007AFF]/10"
                          : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                      } w-full`}
                    >
                      <img src={model.image} alt={model.name} className="w-6 h-6" />
                      <span>{model.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button variant="ghost" size="sm" className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}