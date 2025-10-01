'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { ContentPiece, AIGeneration } from '@/types';
import { getLanguageDisplayName } from '@/utils/modelUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckIcon, EditIcon, XIcon, SearchIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReviewModalProps {
  contentPiece: ContentPiece;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper function to parse metadata
const parseMetadata = (metadata: string | object | null | undefined) => {
  if (!metadata) return null;
  try {
    const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    return typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export default function ReviewModal({ contentPiece, isOpen, onClose, onSuccess }: ReviewModalProps) {
  const [selectedGeneration, setSelectedGeneration] = useState<AIGeneration | null>(
    contentPiece.aiGenerations?.[0] || null
  );
  const [reviewerName, setReviewerName] = useState('');
  const [feedback, setFeedback] = useState('');
  const languageOptions = Array.from(new Set([
    contentPiece.language,
    ...((contentPiece.translations || []).map(t => t.targetLanguage))
  ].filter(Boolean)));
  const [language, setLanguage] = useState<string>(languageOptions[0] || 'en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReview = async (status: 'approved' | 'rejected' | 'needs_revision') => {
    setLoading(true);
    setError('');

    try {
      await apiClient.createReview({
        contentPieceId: contentPiece.id,
        reviewerName: reviewerName.trim() || undefined,
        status,
        feedback: feedback.trim() || undefined,
        language,
      });

      onSuccess();
      onClose();
      
      // Reset form
      setReviewerName('');
      setFeedback('');
      setSelectedGeneration(contentPiece.aiGenerations?.[0] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            Review Content: {contentPiece.type.replace('_', ' ')}
          </DialogTitle>
          <DialogDescription>
            {contentPiece.language.toUpperCase()} • Created {formatDate(contentPiece.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-6 pr-2">
          {/* Language selection */}
          <div className="space-y-2">
            <Label>Review Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Original Content */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Original Content</h3>
              <div className="bg-gray-50 p-4 rounded-lg border">
                {contentPiece.originalContent ? (
                  <p className="text-gray-800">{contentPiece.originalContent}</p>
                ) : (
                  <p className="text-gray-500 italic">No original content</p>
                )}
              </div>
            </div>

            {/* AI Generated Content */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                AI Generated Content
                {contentPiece.aiGenerations && contentPiece.aiGenerations.length > 1 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({contentPiece.aiGenerations.length} options)
                  </span>
                )}
              </h3>
              
              {contentPiece.aiGenerations && contentPiece.aiGenerations.length > 0 ? (
                <div>
                  {contentPiece.aiGenerations.length > 1 && (
                    <div className="mb-3 space-y-2">
                      <Label>Select Version:</Label>
                      <Select
                        value={selectedGeneration?.id?.toString() || ''}
                        onValueChange={(value) => {
                          const generation = contentPiece.aiGenerations?.find(
                            g => g.id === parseInt(value)
                          );
                          setSelectedGeneration(generation || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {contentPiece.aiGenerations.map((generation, index) => (
                            <SelectItem key={generation.id} value={generation.id.toString()}>
                              Version {index + 1} - AI Generated ({formatDate(generation.createdAt)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {selectedGeneration && (
                    <div className="bg-blue-50 p-4 rounded-lg border">
                      <p className="text-gray-800 mb-2">{selectedGeneration.generatedText}</p>
                      <div className="text-xs text-gray-600">
                        <p>Generated in {getLanguageDisplayName(contentPiece.language)}:</p>
                        {selectedGeneration.promptUsed && (
                          <p className="mt-1">Prompt: {selectedGeneration.promptUsed}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-gray-500 italic">No AI generations available</p>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Results */}
          {contentPiece.aiGenerations && contentPiece.aiGenerations.some(gen => {
            const analysis = parseMetadata(gen.metadata);
            return analysis?.keywords || analysis?.tone || analysis?.sentiment;
          }) && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                <SearchIcon className="inline w-5 h-5 mr-2" />
                Content Analysis
              </h3>
              <div className="space-y-3">
                {contentPiece.aiGenerations
                  .filter(gen => {
                    const analysis = parseMetadata(gen.metadata);
                    return analysis?.keywords || analysis?.tone || analysis?.sentiment;
                  })
                  .map((generation) => {
                    const analysis = parseMetadata(generation.metadata);
                    return (
                      <div key={generation.id} className="bg-purple-50 p-4 rounded-lg border">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-medium text-purple-800 text-sm">
                            Content Analysis
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(generation.createdAt)}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          {analysis.keywords && analysis.keywords.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700 text-sm">Keywords:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {analysis.keywords.map((keyword: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {analysis.tone && (
                            <div>
                              <span className="font-medium text-gray-700 text-sm">Tone: </span>
                              <Badge variant="secondary" className="ml-1">
                                {analysis.tone}
                              </Badge>
                            </div>
                          )}
                          
                          {analysis.sentiment && (
                            <div>
                              <span className="font-medium text-gray-700 text-sm">Sentiment: </span>
                              <Badge 
                                variant={analysis.sentiment.label === 'positive' ? 'default' : analysis.sentiment.label === 'negative' ? 'destructive' : 'secondary'}
                                className="ml-1"
                              >
                                {analysis.sentiment.label} ({Math.round(analysis.sentiment.score * 100)}%)
                              </Badge>
                            </div>
                          )}
                          
                          {analysis.confidence && (
                            <div className="text-xs text-gray-600">
                              Analysis Confidence: {Math.round(analysis.confidence * 100)}%
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Translations */}
          {contentPiece.translations && contentPiece.translations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Translations</h3>
              <div className="space-y-2">
                {contentPiece.translations.map((translation) => (
                  <div key={translation.id} className="bg-green-50 p-3 rounded-lg border">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-green-800 text-sm">
                        {getLanguageDisplayName(translation.targetLanguage)}:
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(translation.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-800">{translation.translatedText}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Form - Now inside the scrollable area */}
          <div className="border-t border-gray-200 pt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Review</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reviewer-name">Reviewer Name (Optional)</Label>
                  <Input
                    id="reviewer-name"
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Your name"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback (Optional)</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Add any comments or suggestions..."
                    rows={3}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-destructive/15 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleReview('approved')}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="default"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    {loading ? 'Submitting...' : 'Approve'}
                  </Button>
                  
                  <Button
                    onClick={() => handleReview('needs_revision')}
                    disabled={loading}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                    size="default"
                  >
                    <EditIcon className="w-4 h-4 mr-2" />
                    {loading ? 'Submitting...' : 'Needs Revision'}
                  </Button>
                  
                  <Button
                    onClick={() => handleReview('rejected')}
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    size="default"
                  >
                    <XIcon className="w-4 h-4 mr-2" />
                    {loading ? 'Submitting...' : 'Reject'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
