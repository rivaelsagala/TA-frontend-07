export const AVAILABLE_MODELS = [
  {
    model_id: 1,
    id: 'meta-llama/Llama-3.1-8B-Instruct',
    name: 'Llama 3.1 8B',
    type: 'original',
    description: 'Open-source general model',
  },
  {
    model_id: 2,
    id: 'Qwen/Qwen2.5-7B-Instruct',
    name: 'Qwen 2.5 7B',
    type: 'original',
    description: 'Open-source multilingual model',
  },
  {
    model_id: 3,
    id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
    name: 'DeepSeek R1 7B',
    type: 'original',
    description: 'Reasoning-focused model',
  },
  {
    model_id: 4,
    id: 'model_merged_legal',
    name: 'Legal Assistant FT',
    type: 'fine-tuned',
    description: 'Fine-tuned legal model',
  },
];

export const DEFAULT_MODEL_ID = AVAILABLE_MODELS[0].id;

export function getModelName(modelId: string): string {
  return AVAILABLE_MODELS.find((m) => m.id === modelId)?.name || modelId;
}

export function getModelNumericId(modelId: string): number {
  return AVAILABLE_MODELS.find((m) => m.id === modelId)?.model_id ?? 1;
}
