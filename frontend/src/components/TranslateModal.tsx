'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ContentPiece, Campaign, Translation } from '@/types';
import { Languages, Loader2, CheckCircle } from 'lucide-react';

interface TranslateModalProps {
  content: ContentPiece;
  campaign?: Campaign;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const availableLanguages = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'pt-br', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

export default function TranslateModal({ 
  content, 
  campaign, 
  isOpen, 
  onClose, 
  onSuccess 
}: TranslateModalProps) {
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  const [translating, setTranslating] = useState(false);
  const [completedTranslations, setCompletedTranslations] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  // Initialize with campaign target languages if available
  useEffect(() => {
    if (isOpen && campaign?.targetLanguages) {
      // Get already translated languages inside the effect
      const existingTranslations = new Set(
        content.translations?.map(t => t.targetLanguage.toLowerCase()) || []
      );
      
      const suggestedLanguages = campaign.targetLanguages.filter(
        lang => !existingTranslations.has(lang.toLowerCase()) && 
                lang.toLowerCase() !== content.language?.toLowerCase()
      );
      setSelectedLanguages(new Set(suggestedLanguages.map(lang => lang.toLowerCase())));
    }
  }, [isOpen, campaign?.targetLanguages, content.translations, content.language]);

  // Get already translated languages
  const existingTranslations = new Set(
    content.translations?.map(t => t.targetLanguage.toLowerCase()) || []
  );

  // Remove already translated languages from available options
  const availableToTranslate = availableLanguages.filter(
    lang => !existingTranslations.has(lang.code) && lang.code !== content.language?.toLowerCase()
  );

  const resetModal = () => {
    setSelectedLanguages(new Set());
    setCompletedTranslations(new Set());
    setError('');
    setTranslating(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  const handleLanguageToggle = (languageCode: string) => {
    const newSelected = new Set(selectedLanguages);
    if (newSelected.has(languageCode)) {
      newSelected.delete(languageCode);
    } else {
      newSelected.add(languageCode);
    }
    setSelectedLanguages(newSelected);
  };

  const handleTranslate = async () => {
    if (selectedLanguages.size === 0) return;

    setTranslating(true);
    setError('');
    const completed = new Set<string>();

    try {
      // Translate to each selected language
      for (const languageCode of selectedLanguages) {
        try {
          await apiClient.translateContent(content.id, { 
            targetLanguage: languageCode 
          });
          completed.add(languageCode);
          setCompletedTranslations(new Set(completed));
        } catch (err) {
          console.error(`Failed to translate to ${languageCode}:`, err);
          // Continue with other languages even if one fails
        }
      }

      if (completed.size > 0) {
        onSuccess(); // Refresh parent data
        
        // Close modal after a brief delay to show completion
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setError('All translations failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  const getLanguageName = (code: string) => {
    return availableLanguages.find(lang => lang.code === code)?.name || code.toUpperCase();
  };

  const getLanguageFlag = (code: string) => {
    return availableLanguages.find(lang => lang.code === code)?.flag || '🌐';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            Translate Content
          </DialogTitle>
          <DialogDescription>
            Choose which languages to translate this content into. 
            {campaign?.targetLanguages && campaign.targetLanguages.length > 0 && (
              <span className="text-blue-600">
                {' '}Campaign targets: {campaign.targetLanguages.map(lang => getLanguageName(lang)).join(', ')}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original Content Preview */}
          <div className="bg-gray-50 p-3 rounded-lg border">
            <Label className="text-sm font-medium text-gray-700">
              Original ({content.language?.toUpperCase() || 'EN'}):
            </Label>
            <p className="text-sm text-gray-900 mt-1 line-clamp-3">
              {content.originalContent || 'No original content'}
            </p>
          </div>

          {/* Existing Translations */}
          {existingTranslations.size > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Already translated to:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.from(existingTranslations).map((lang) => (
                  <Badge key={lang} variant="secondary" className="flex items-center gap-1">
                    <span>{getLanguageFlag(lang)}</span>
                    {getLanguageName(lang)}
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Language Selection */}
          {availableToTranslate.length > 0 ? (
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Select languages to translate to:
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {availableToTranslate.map((language) => {
                  const isSelected = selectedLanguages.has(language.code);
                  const isCompleted = completedTranslations.has(language.code);
                  
                  return (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageToggle(language.code)}
                      disabled={translating}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-sm font-medium transition-colors ${
                        isCompleted
                          ? 'bg-green-50 border-green-300 text-green-800 cursor-default'
                          : isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className="text-base">{language.flag}</span>
                      <span>{language.name}</span>
                      {isCompleted && <CheckCircle className="w-3 h-3 text-green-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Languages className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>This content has already been translated to all available languages.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={translating}
          >
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {selectedLanguages.size > 0 && (
              <span className="text-sm text-gray-500 self-center">
                {completedTranslations.size}/{selectedLanguages.size} completed
              </span>
            )}
            
            <Button
              onClick={handleTranslate}
              disabled={selectedLanguages.size === 0 || translating}
              className="flex items-center gap-2"
            >
              {translating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="w-4 h-4" />
                  Translate ({selectedLanguages.size})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}