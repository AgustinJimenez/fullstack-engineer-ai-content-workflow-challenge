'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface AnalysisData {
  keywords?: string[];
  tone?: string;
  sentiment?: {
    label: string;
    score: number;
  };
  confidence?: number;
}

interface ContentAnalysisStepProps {
  analysisData: AnalysisData | null;
  onSave: () => void;
  onBack: () => void;
  loading: boolean;
}

export default function ContentAnalysisStep({
  analysisData,
  onSave,
  onBack,
  loading
}: ContentAnalysisStepProps) {
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="font-semibold text-purple-900 mb-3">Analysis Results</h3>
        
        {analysisData && (
          <div className="space-y-3">
            {analysisData.keywords && (
              <div>
                <Label className="text-sm text-purple-700">Keywords</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {analysisData.keywords.map((keyword: string, i: number) => (
                    <Badge key={i} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {analysisData.tone && (
              <div>
                <Label className="text-sm text-purple-700">Tone</Label>
                <div className="mt-1">
                  <Badge>{analysisData.tone}</Badge>
                </div>
              </div>
            )}
            
            {analysisData.sentiment && (
              <div>
                <Label className="text-sm text-purple-700">Sentiment</Label>
                <div className="mt-1">
                  <Badge variant={
                    analysisData.sentiment.label === 'positive' ? 'default' :
                    analysisData.sentiment.label === 'negative' ? 'destructive' : 
                    'secondary'
                  }>
                    {analysisData.sentiment.label} ({Math.round(analysisData.sentiment.score * 100)}%)
                  </Badge>
                </div>
              </div>
            )}
            
            {analysisData.confidence && (
              <div>
                <Label className="text-sm text-purple-700">Confidence</Label>
                <div className="mt-1">
                  <Badge variant="outline">
                    {Math.round(analysisData.confidence * 100)}%
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Content'
          )}
        </Button>
      </div>
    </div>
  );
}