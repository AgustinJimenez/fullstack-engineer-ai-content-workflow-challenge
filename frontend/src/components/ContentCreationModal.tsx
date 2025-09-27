'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';

import ContentSetupStep from './content-creation/ContentSetupStep';
import AIGenerationSettings from './content-creation/AIGenerationSettings';
import GeneratedContentReview from './content-creation/GeneratedContentReview';
import ContentAnalysisStep from './content-creation/ContentAnalysisStep';

interface ContentCreationModalProps {
  campaignId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultLanguage?: string;
}

type Step = 'setup' | 'generated' | 'analysis';

interface AnalysisData {
  keywords?: string[];
  tone?: string;
  sentiment?: {
    label: string;
    score: number;
  };
  confidence?: number;
}

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

export default function ContentCreationModal({
  campaignId,
  isOpen,
  onClose,
  onSuccess,
  defaultLanguage = 'en',
}: ContentCreationModalProps) {
  const { toast } = useToast();
  
  // Step management
  const [step, setStep] = useState<Step>('setup');
  
  // Basic content fields
  const [type, setType] = useState('headline');
  const [originalContent, setOriginalContent] = useState('');
  const [language, setLanguage] = useState(defaultLanguage);
  
  // AI generation fields
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [promptTemplate, setPromptTemplate] = useState('default');
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Generated content
  const [generatedContent, setGeneratedContent] = useState('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [contentWasCreated, setContentWasCreated] = useState(false);

  // Update custom prompt when type or template changes
  useEffect(() => {
    if (type) {
      const templates = PROMPT_TEMPLATES[type] || PROMPT_TEMPLATES.headline;
      const basePrompt = templates[promptTemplate] || templates.default;
      const contextPrompt = originalContent 
        ? `${basePrompt} based on: ${originalContent}`
        : basePrompt;
      setCustomPrompt(contextPrompt);
    }
  }, [type, originalContent, promptTemplate]);

  const handleGenerate = async () => {
    if (!originalContent.trim()) {
      setError('Original content is required before AI generation');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // For now, simulate AI generation without saving to database
      // In a real implementation, you might call an AI service directly
      // or use a temporary generation endpoint
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Generate mock AI content based on the prompt
      const mockGeneratedContent = `AI-Generated (${selectedProvider}): ${originalContent} - Enhanced with ${selectedProvider} using the prompt: "${customPrompt.substring(0, 50)}..."`;
      
      setGeneratedContent(mockGeneratedContent);
      setStep('generated');
      
      // Show success toast
      toast({
        title: 'AI content generated',
        description: `Your ${type} has been enhanced with AI. Review and save to add it to your campaign.`,
        variant: 'success'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!generatedContent) return;
    
    setAnalyzing(true);
    try {
      // Simulate analysis for now
      setAnalysisData({
        keywords: ['example', 'keywords', 'here'],
        tone: 'professional',
        sentiment: { label: 'positive', score: 0.85 },
        confidence: 0.9
      });
      setStep('analysis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze content');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Create the content first
      const content = await apiClient.createContentForCampaign(campaignId, {
        type,
        originalContent: originalContent.trim(),
        language,
      });
      
      // Then generate AI content for it using the generated content we have
      await apiClient.generateContent(content.id, {
        prompt: customPrompt,
        model: selectedProvider,
      });
      
      setContentWasCreated(true); // Mark that content was successfully created
      
      // Show success toast for saving
      toast({
        title: 'Content saved successfully',
        description: `Your ${type} has been saved to the campaign.`,
        variant: 'success'
      });
      
      // Close the modal
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !analyzing) {
      // If content was created, notify parent of success
      if (contentWasCreated) {
        onSuccess();
      }
      
      // Reset all state
      setType('headline');
      setOriginalContent('');
      setLanguage(defaultLanguage);
      setSelectedProvider('openai');
      setPromptTemplate('default');
      setCustomPrompt('');
      setGeneratedContent('');
      setAnalysisData(null);
      setStep('setup');
      setError('');
      setContentWasCreated(false);
      onClose();
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'setup': return 'Create Content';
      case 'generated': return 'Review Generated Content';
      case 'analysis': return 'Content Analysis';
      default: return 'Create Content';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            {step === 'setup' && 'Provide your original content and configure AI generation settings.'}
            {step === 'generated' && 'Review the AI-generated content and optionally analyze it.'}
            {step === 'analysis' && 'Review the content analysis results before saving.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-6">
            <ContentSetupStep
              type={type}
              setType={setType}
              originalContent={originalContent}
              setOriginalContent={setOriginalContent}
              language={language}
              setLanguage={setLanguage}
              loading={loading}
            />
            
            <AIGenerationSettings
              selectedProvider={selectedProvider}
              setSelectedProvider={setSelectedProvider}
              promptTemplate={promptTemplate}
              setPromptTemplate={setPromptTemplate}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              contentType={type}
              loading={loading}
            />
            
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={loading || !customPrompt.trim() || !originalContent.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        
        {step === 'generated' && (
          <GeneratedContentReview
            generatedContent={generatedContent}
            originalContent={originalContent}
            onAnalyze={handleAnalyze}
            onSave={handleSave}
            onCancel={onClose}
            analyzing={analyzing}
            loading={loading}
          />
        )}
        
        {step === 'analysis' && (
          <ContentAnalysisStep
            analysisData={analysisData}
            onSave={handleSave}
            onBack={() => setStep('generated')}
            loading={loading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}