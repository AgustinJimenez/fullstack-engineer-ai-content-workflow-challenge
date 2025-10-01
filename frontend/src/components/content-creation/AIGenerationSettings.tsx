'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Brain, Zap } from 'lucide-react';
import { PROMPT_TEMPLATES } from '@/constants/promptTemplates';

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
              data-testid={`ai-provider-${provider.id}`}
            >
              {provider.icon}
              <span className="ml-2">{provider.name}</span>
            </Button>
          ))}
        </div>
        
        <div className="space-y-2">
          <Label>Prompt Template</Label>
          <Select value={promptTemplate} onValueChange={setPromptTemplate} disabled={loading}>
            <SelectTrigger data-testid="prompt-template-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(templates).map(template => {
                const labels: { [key: string]: string } = {
                  default: 'Default (3-5 options)',
                  single: 'Single Option',
                  multiple: 'Multiple (10 options)',
                  engaging: 'Engaging Style',
                  professional: 'Professional Style',
                  emotional: 'Emotional Style',
                  detailed: 'Detailed',
                  concise: 'Concise'
                };
                return (
                  <SelectItem key={template} value={template}>
                    {labels[template] || template.charAt(0).toUpperCase() + template.slice(1)}
                  </SelectItem>
                );
              })}
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