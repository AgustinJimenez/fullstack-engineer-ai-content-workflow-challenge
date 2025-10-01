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
import { Loader2, Zap, ArrowLeft } from 'lucide-react';

import ContentSetupStep from './content-creation/ContentSetupStep';
import AIGenerationSettings from './content-creation/AIGenerationSettings';
import GeneratedContentReview from './content-creation/GeneratedContentReview';
import { PROMPT_TEMPLATES } from '@/constants/promptTemplates';

interface ContentCreationModalProps {
  campaignId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultLanguage?: string;
}

type Step = 'setup' | 'generated';

interface AnalysisData {
  keywords?: string[];
  tone?: string;
  sentiment?: {
    label: string;
    score: number;
  };
  confidence?: number;
}


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
  const [regenerating, setRegenerating] = useState(false);
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
      // First, create a temporary content piece to generate AI content
      const tempContentResponse = await fetch('/api/v1/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaignId,
          type,
          originalContent,
          language: 'en'
        })
      });

      if (!tempContentResponse.ok) {
        throw new Error('Failed to create content piece');
      }

      const tempContent = await tempContentResponse.json();

      // Now generate AI content using the real AI endpoint
      const aiResponse = await fetch(`/api/v1/ai/generate/${tempContent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt,
          model: selectedProvider
        })
      });

      if (!aiResponse.ok) {
        // Don't auto-delete on HTTP failure - AI might have succeeded despite HTTP timeout
        // Get error details for better debugging
        let errorMessage = 'Failed to generate AI content';
        try {
          const errorData = await aiResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse error, use status text
          errorMessage = `${aiResponse.status}: ${aiResponse.statusText}`;
        }
        
        // Log the content piece ID so user can manually clean up if needed
        console.warn(`AI generation failed for content piece ${tempContent.id}. You may need to manually delete it.`);
        
        throw new Error(errorMessage);
      }

      const aiResult = await aiResponse.json();
      
      // Automatically analyze the generated content
      let analysisResult = null;
      try {
        // Create another temporary content piece for analysis
        const analysisTempResponse = await fetch('/api/v1/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: campaignId,
            type: 'analysis',
            originalContent: aiResult.generatedText,
            language: 'en'
          })
        });

        if (analysisTempResponse.ok) {
          const analysisTempContent = await analysisTempResponse.json();

          // Use the AI generation endpoint with an analysis prompt
          const analysisPrompt = `Analyze this content and return the result in JSON format with this structure:
          {"keywords": ["extracted", "keywords", "from_content"], "tone": "detected_tone", "sentiment": {"label": "detected_sentiment", "score": actual_confidence_decimal}, "confidence": analysis_confidence_decimal}

          Guidelines:
          - Extract 3-5 relevant keywords from the actual content
          - Determine the tone (professional, casual, enthusiastic, formal, friendly, persuasive, etc.)
          - Analyze sentiment as positive, negative, or neutral with a score between 0.0-1.0
          - Provide your confidence in this analysis as a decimal between 0.0-1.0
          - Use actual values based on the content, not the examples above

          Content to analyze: "${aiResult.generatedText}"

          Return only the JSON object, no additional text.`;

          const analysisResponse = await fetch(`/api/v1/ai/generate/${analysisTempContent.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: analysisPrompt + `\n\nAnalysis ID: ${Date.now()}`, // Add uniqueness to prevent caching
              model: selectedProvider
            })
          });

          if (analysisResponse.ok) {
            const analysisAiResult = await analysisResponse.json();
            
            // Parse the AI response to extract analysis data
            try {
              const analysisText = analysisAiResult.generatedText.trim();
              let parsedAnalysis;
              
              // Try to extract JSON from the response
              const jsonMatch = analysisText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
              if (jsonMatch) {
                parsedAnalysis = JSON.parse(jsonMatch[0]);
              } else {
                // Fallback parsing
                parsedAnalysis = JSON.parse(analysisText);
              }
              
              analysisResult = parsedAnalysis;
            } catch (parseErr) {
              console.warn('Failed to parse analysis data:', parseErr);
            }
          }
          
          // Clean up the analysis temporary content piece
          await fetch(`/api/v1/content/${analysisTempContent.id}`, { method: 'DELETE' });
        }
      } catch (analysisErr) {
        console.warn('Failed to generate automatic analysis:', analysisErr);
        // Continue without analysis rather than failing the generation
      }
      
      // Clean up the original temporary content piece since this is just for preview
      await fetch(`/api/v1/content/${tempContent.id}`, { method: 'DELETE' });
      
      setGeneratedContent(aiResult.generatedText);
      setAnalysisData(analysisResult);
      setStep('generated');
      
      // Show success toast
      toast({
        title: 'AI content generated',
        description: `Your ${type} has been enhanced with AI and analyzed. Review and save to add it to your campaign.`,
        variant: 'success'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!originalContent.trim()) {
      setError('Original content is required for regeneration');
      return;
    }
    
    setRegenerating(true);
    setError('');
    
    try {
      // Create a temporary content piece to generate AI content
      const tempContentResponse = await fetch('/api/v1/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaignId,
          type,
          originalContent,
          language: 'en'
        })
      });

      if (!tempContentResponse.ok) {
        throw new Error('Failed to create content piece');
      }

      const tempContent = await tempContentResponse.json();

      // Generate with current settings (may have changed prompt)
      const aiResponse = await fetch(`/api/v1/ai/generate/${tempContent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt,
          model: selectedProvider
        })
      });

      if (!aiResponse.ok) {
        // Don't auto-delete on HTTP failure - AI might have succeeded despite HTTP timeout  
        // Get error details for better debugging
        let errorMessage = 'Failed to regenerate AI content';
        try {
          const errorData = await aiResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse error, use status text
          errorMessage = `${aiResponse.status}: ${aiResponse.statusText}`;
        }
        
        // Log the content piece ID so user can manually clean up if needed
        console.warn(`AI regeneration failed for content piece ${tempContent.id}. You may need to manually delete it.`);
        
        throw new Error(errorMessage);
      }

      const aiResult = await aiResponse.json();
      
      // Automatically analyze the regenerated content
      let analysisResult = null;
      try {
        // Create another temporary content piece for analysis
        const analysisTempResponse = await fetch('/api/v1/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: campaignId,
            type: 'analysis',
            originalContent: aiResult.generatedText,
            language: 'en'
          })
        });

        if (analysisTempResponse.ok) {
          const analysisTempContent = await analysisTempResponse.json();

          // Use the AI generation endpoint with an analysis prompt
          const analysisPrompt = `Analyze this content and return the result in JSON format with this structure:
          {"keywords": ["extracted", "keywords", "from_content"], "tone": "detected_tone", "sentiment": {"label": "detected_sentiment", "score": actual_confidence_decimal}, "confidence": analysis_confidence_decimal}

          Guidelines:
          - Extract 3-5 relevant keywords from the actual content
          - Determine the tone (professional, casual, enthusiastic, formal, friendly, persuasive, etc.)
          - Analyze sentiment as positive, negative, or neutral with a score between 0.0-1.0
          - Provide your confidence in this analysis as a decimal between 0.0-1.0
          - Use actual values based on the content, not the examples above

          Content to analyze: "${aiResult.generatedText}"

          Return only the JSON object, no additional text.`;

          const analysisResponse = await fetch(`/api/v1/ai/generate/${analysisTempContent.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: analysisPrompt + `\n\nAnalysis ID: ${Date.now()}`, // Add uniqueness to prevent caching
              model: selectedProvider
            })
          });

          if (analysisResponse.ok) {
            const analysisAiResult = await analysisResponse.json();
            
            // Parse the AI response to extract analysis data
            try {
              const analysisText = analysisAiResult.generatedText.trim();
              let parsedAnalysis;
              
              // Try to extract JSON from the response
              const jsonMatch = analysisText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
              if (jsonMatch) {
                parsedAnalysis = JSON.parse(jsonMatch[0]);
              } else {
                // Fallback parsing
                parsedAnalysis = JSON.parse(analysisText);
              }
              
              analysisResult = parsedAnalysis;
            } catch (parseErr) {
              console.warn('Failed to parse analysis data:', parseErr);
            }
          }
          
          // Clean up the analysis temporary content piece
          await fetch(`/api/v1/content/${analysisTempContent.id}`, { method: 'DELETE' });
        }
      } catch (analysisErr) {
        console.warn('Failed to generate automatic analysis:', analysisErr);
        // Continue without analysis rather than failing the regeneration
      }
      
      // Clean up the original temporary content piece
      await fetch(`/api/v1/content/${tempContent.id}`, { method: 'DELETE' });
      
      setGeneratedContent(aiResult.generatedText);
      setAnalysisData(analysisResult);
      
      // Show success toast
      toast({
        title: 'Content regenerated',
        description: `Your ${type} has been regenerated with AI and analyzed.`,
        variant: 'success'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate content');
    } finally {
      setRegenerating(false);
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
      const aiGeneration = await apiClient.generateContent(content.id, {
        prompt: customPrompt,
        model: selectedProvider,
      });
      
      // Automatically analyze the generated content if we have analysis data or generate it
      let finalAnalysisData = analysisData;
      if (!finalAnalysisData && generatedContent) {
        try {
          // Create a temporary content piece for analysis
          const tempContentResponse = await fetch('/api/v1/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: campaignId,
              type: 'analysis',
              originalContent: generatedContent,
              language: 'en'
            })
          });

          if (tempContentResponse.ok) {
            const tempContent = await tempContentResponse.json();

            // Use the AI generation endpoint with an analysis prompt
            const analysisPrompt = `Analyze this content and return the result in JSON format with this structure:
            {"keywords": ["extracted", "keywords", "from_content"], "tone": "detected_tone", "sentiment": {"label": "detected_sentiment", "score": actual_confidence_decimal}, "confidence": analysis_confidence_decimal}

            Guidelines:
            - Extract 3-5 relevant keywords from the actual content
            - Determine the tone (professional, casual, enthusiastic, formal, friendly, persuasive, etc.)
            - Analyze sentiment as positive, negative, or neutral with a score between 0.0-1.0
            - Provide your confidence in this analysis as a decimal between 0.0-1.0
            - Use actual values based on the content, not the examples above

            Content to analyze: "${generatedContent}"

            Return only the JSON object, no additional text.`;

            const analysisResponse = await fetch(`/api/v1/ai/generate/${tempContent.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: analysisPrompt,
                model: selectedProvider
              })
            });

            if (analysisResponse.ok) {
              const analysisResult = await analysisResponse.json();
              
              // Parse the AI response to extract analysis data
              try {
                const analysisText = analysisResult.generatedText.trim();
                let parsedAnalysis;
                
                // Try to extract JSON from the response
                const jsonMatch = analysisText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
                if (jsonMatch) {
                  parsedAnalysis = JSON.parse(jsonMatch[0]);
                } else {
                  // Fallback parsing
                  parsedAnalysis = JSON.parse(analysisText);
                }
                
                finalAnalysisData = parsedAnalysis;
              } catch (parseErr) {
                console.warn('Failed to parse analysis data:', parseErr);
              }
            }
            
            // Clean up the temporary content piece
            await fetch(`/api/v1/content/${tempContent.id}`, { method: 'DELETE' });
          }
        } catch (analysisErr) {
          console.warn('Failed to generate automatic analysis:', analysisErr);
          // Continue without analysis rather than failing the save
        }
      }
      
      // If we have analysis data, update the AI generation's metadata
      if (finalAnalysisData && aiGeneration.id) {
        try {
          await fetch(`/api/v1/ai/generations/${aiGeneration.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              metadata: finalAnalysisData
            })
          });
        } catch (metadataErr) {
          console.warn('Failed to save analysis metadata:', metadataErr);
          // Continue without failing the save
        }
      }
      
      setContentWasCreated(true); // Mark that content was successfully created
      
      // Show success toast for saving
      toast({
        title: 'Content saved successfully',
        description: `Your ${type} has been saved to the campaign with AI analysis.`,
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

  const handleGoBack = () => {
    setStep('setup');
    // Keep all data intact - don't reset anything
  };

  const handleClose = () => {
    if (!loading) {
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
      default: return 'Create Content';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="relative">
            {step === 'generated' && (
              <Button
                onClick={handleGoBack}
                variant="ghost"
                size="sm"
                disabled={loading || regenerating}
                className="absolute -top-2 -left-2 p-1 h-8 w-8 z-10"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className={`${step === 'generated' ? 'ml-8' : ''}`}>
              {getStepTitle()}
            </DialogTitle>
            <DialogDescription className={`${step === 'generated' ? 'ml-8' : ''}`}>
              {step === 'setup' && 'Provide your original content and configure AI generation settings.'}
              {step === 'generated' && 'Review the AI-generated content with analysis results and save to your campaign.'}
            </DialogDescription>
          </div>
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
              loading={loading || regenerating}
            />
            
            <AIGenerationSettings
              selectedProvider={selectedProvider}
              setSelectedProvider={setSelectedProvider}
              promptTemplate={promptTemplate}
              setPromptTemplate={setPromptTemplate}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              contentType={type}
              loading={loading || regenerating}
            />
            
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading || regenerating}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={loading || regenerating || !customPrompt.trim() || !originalContent.trim()}
                data-testid="generate-ai-button"
              >
                {loading || regenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {regenerating ? 'Regenerating...' : 'Generating...'}
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
            analysisData={analysisData}
            onSave={handleSave}
            onCancel={onClose}
            onRegenerate={handleRegenerate}
            loading={loading}
            regenerating={regenerating}
          />
        )}
        
      </DialogContent>
    </Dialog>
  );
}