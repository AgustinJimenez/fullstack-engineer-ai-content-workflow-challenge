'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, TrendingUp } from 'lucide-react';

interface AnalysisData {
  keywords?: string[];
  tone?: string;
  sentiment?: {
    label: string;
    score: number;
  };
  confidence?: number;
}

interface GeneratedContentReviewProps {
  generatedContent: string;
  analysisData?: AnalysisData | null;
  onSave: () => void;
  onCancel?: () => void;
  onRegenerate?: () => void;
  loading: boolean;
  regenerating?: boolean;
  originalContent: string;
}

export default function GeneratedContentReview({
  generatedContent,
  analysisData,
  onSave,
  onCancel,
  onRegenerate,
  loading,
  regenerating,
  originalContent
}: GeneratedContentReviewProps) {
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-purple-900">AI Generated Content</h3>
          {onRegenerate && (
            <span className="text-xs text-purple-600">
              Not satisfied? Try regenerating for different results
            </span>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-purple-700">Original</Label>
            <div className="mt-1 p-3 bg-white rounded border text-sm">
              {originalContent}
            </div>
          </div>
          <div>
            <Label className="text-sm text-purple-700">AI Enhanced</Label>
            <Textarea
              value={regenerating ? 'Regenerating content...' : generatedContent}
              readOnly
              rows={6}
              className={`mt-1 ${regenerating ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
              data-testid="generated-content"
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisData && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Content Analysis</h3>
          </div>
          
          <div className="space-y-3">
            {analysisData.keywords && analysisData.keywords.length > 0 && (
              <div>
                <Label className="text-sm text-blue-700 mb-1 block">Keywords</Label>
                <div className="flex flex-wrap gap-1">
                  {analysisData.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {analysisData.tone && (
                <div>
                  <Label className="text-sm text-blue-700 mb-1 block">Tone</Label>
                  <Badge variant="secondary" className="capitalize">
                    {analysisData.tone}
                  </Badge>
                </div>
              )}
              
              {analysisData.sentiment && (
                <div>
                  <Label className="text-sm text-blue-700 mb-1 block">Sentiment</Label>
                  <Badge 
                    variant={analysisData.sentiment.label === 'positive' ? 'default' : 
                             analysisData.sentiment.label === 'negative' ? 'destructive' : 'secondary'}
                    className="capitalize"
                  >
                    {analysisData.sentiment.label} ({Math.round(analysisData.sentiment.score * 100)}%)
                  </Badge>
                </div>
              )}
            </div>
            
            {analysisData.confidence && (
              <div className="text-xs text-blue-600">
                Analysis confidence: {Math.round(analysisData.confidence * 100)}%
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex justify-between gap-3">
        <div className="flex gap-2">
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={loading || regenerating}
            >
              Cancel
            </Button>
          )}
          {onRegenerate && (
            <Button
              onClick={onRegenerate}
              variant="outline"
              disabled={regenerating || loading}
            >
              {regenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </>
              )}
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={onSave}
            disabled={!originalContent.trim() || loading || regenerating}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}