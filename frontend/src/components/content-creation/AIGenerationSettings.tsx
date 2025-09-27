'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Brain, Zap } from 'lucide-react';

interface AIGenerationSettingsProps {
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
  promptTemplate: string;
  setPromptTemplate: (template: string) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  contentType: string;
  loading: boolean;
}

const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI GPT-4',
    icon: <Brain className="w-5 h-5" />,
    color: 'bg-green-600 hover:bg-green-700'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'bg-purple-600 hover:bg-purple-700'
  }
];

const PROMPT_TEMPLATES: { [key: string]: { [key: string]: string } } = {
  headline: {
    default: 'Create a compelling headline that grabs attention',
    engaging: 'Write an engaging headline that drives action and curiosity',
    professional: 'Craft a professional headline for business audiences',
    emotional: 'Create an emotionally resonant headline that connects with readers',
  },
  description: {
    default: 'Write a clear and persuasive product description',
    detailed: 'Create a comprehensive description with key features and benefits',
    concise: 'Write a brief but impactful description',
  },
  // Add more templates as needed
};

export default function AIGenerationSettings({
  selectedProvider,
  setSelectedProvider,
  promptTemplate,
  setPromptTemplate,
  customPrompt,
  setCustomPrompt,
  contentType,
  loading
}: AIGenerationSettingsProps) {
  const templates = PROMPT_TEMPLATES[contentType] || PROMPT_TEMPLATES.headline;

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {AI_PROVIDERS.map(provider => (
            <Button
              key={provider.id}
              type="button"
              variant={selectedProvider === provider.id ? "default" : "outline"}
              className={selectedProvider === provider.id ? provider.color : ''}
              onClick={() => setSelectedProvider(provider.id)}
              disabled={loading}
            >
              {provider.icon}
              <span className="ml-2">{provider.name}</span>
            </Button>
          ))}
        </div>
        
        <div className="space-y-2">
          <Label>Prompt Template</Label>
          <Select value={promptTemplate} onValueChange={setPromptTemplate} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(templates).map(template => (
                <SelectItem key={template} value={template}>
                  {template.charAt(0).toUpperCase() + template.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Custom Prompt</Label>
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Customize your prompt..."
            rows={3}
            disabled={loading}
          />
        </div>
    </div>
  );
}