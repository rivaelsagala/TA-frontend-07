export const AVAILABLE_MODELS = [
    {
    id: 'llama-3',
    name: 'Llama-3',
    description: 'Open source model',
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Most capable model, best for complex tasks',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient model',
  },
  {
    id: 'claude-3',
    name: 'Claude 3',
    description: 'Advanced reasoning and analysis',
  },

];

export function getModelName(modelId: string): string {
  return AVAILABLE_MODELS.find((m) => m.id === modelId)?.name || modelId;
}
