'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Eye } from 'lucide-react';

interface GeneratedContentReviewProps {
  generatedContent: string;
  onAnalyze: () => void;
  onSave: () => void;
  onCancel?: () => void;
  analyzing: boolean;
  loading: boolean;
  originalContent: string;
}

export default function GeneratedContentReview({
  generatedContent,
  onAnalyze,
  onSave,
  onCancel,
  analyzing,
  loading,
  originalContent
}: GeneratedContentReviewProps) {
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="font-semibold text-purple-900 mb-3">AI Generated Content</h3>
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
              value={generatedContent}
              readOnly
              rows={4}
              className="mt-1 bg-white"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-between gap-3">
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <div className="flex gap-3 ml-auto">
          <Button
            onClick={onAnalyze}
            variant="outline"
            disabled={analyzing || loading}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Analyze Content
              </>
            )}
          </Button>
          <Button 
            onClick={onSave}
            disabled={!originalContent.trim() || loading}
          >
            Save Content
          </Button>
        </div>
      </div>
    </div>
  );
}