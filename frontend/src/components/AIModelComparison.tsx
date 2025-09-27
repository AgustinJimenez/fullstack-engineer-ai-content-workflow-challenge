'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { 
  ZapIcon, 
  CopyIcon, 
  CheckIcon, 
  SearchIcon, 
  LanguagesIcon,
  SparklesIcon 
} from 'lucide-react';

interface ModelResult {
  provider: string;
  text: string;
  analysis?: {
    keywords: string[];
    tone: string;
    sentiment: {
      label: string;
      score: number;
    };
  };
  executionTime: number;
  cost?: number;
}

interface AIModelComparisonProps {
  contentId: number;
  prompt?: string;
  onClose?: () => void;
  onSelectResult?: (result: ModelResult) => void;
}

export default function AIModelComparison({ 
  contentId, 
  prompt, 
  onClose, 
  onSelectResult 
}: AIModelComparisonProps) {
  const [results, setResults] = useState<ModelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const runComparison = async () => {
    setLoading(true);
    setError('');
    setResults([]);

    try {
      console.log('Starting AI model comparison for content:', contentId);
      
      // Call the new comparison endpoint
      const response = await apiClient.compareAIModels(contentId, {
        prompt: prompt || 'Generate compelling marketing content',
        models: ['openai', 'anthropic']
      });

      console.log('Comparison results:', response);
      setResults(response.results || []);
    } catch (err) {
      console.error('AI comparison error:', err);
      setError(err instanceof Error ? err.message : 'Failed to compare AI models');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone.toLowerCase()) {
      case 'professional':
        return 'bg-blue-100 text-blue-800';
      case 'casual':
        return 'bg-purple-100 text-purple-800';
      case 'formal':
        return 'bg-gray-100 text-gray-800';
      case 'friendly':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  AI Model Comparison
                </h2>
                <p className="text-sm text-gray-600">
                  Compare outputs from different AI providers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!loading && results.length === 0 && (
                <Button
                  onClick={runComparison}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Compare Models
                </Button>
              )}
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Running comparison across AI models...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {results.map((result, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ZapIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {result.provider}
                        </h3>
                        <Badge variant="outline" className="ml-2">
                          {result.executionTime}ms
                        </Badge>
                        {result.cost && (
                          <Badge variant="secondary">
                            ${result.cost.toFixed(4)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(result.text, index)}
                          className="flex items-center gap-2"
                        >
                          {copiedIndex === index ? (
                            <>
                              <CheckIcon className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <CopyIcon className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </Button>
                        {onSelectResult && (
                          <Button
                            size="sm"
                            onClick={() => onSelectResult(result)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Use This
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <p className="text-gray-800 leading-relaxed">
                        {result.text}
                      </p>
                    </div>

                    {result.analysis && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <SearchIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Analysis</span>
                        </div>

                        {/* Keywords */}
                        <div>
                          <span className="text-sm font-medium text-gray-600">Keywords:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.analysis.keywords.slice(0, 6).map((keyword, kidx) => (
                              <Badge key={kidx} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {result.analysis.keywords.length > 6 && (
                              <Badge variant="secondary" className="text-xs">
                                +{result.analysis.keywords.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Tone and Sentiment */}
                        <div className="flex gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Tone:</span>
                            <Badge className={`ml-2 ${getToneColor(result.analysis.tone)}`}>
                              {result.analysis.tone}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Sentiment:</span>
                            <Badge className={`ml-2 ${getSentimentColor(result.analysis.sentiment.label)}`}>
                              {result.analysis.sentiment.label} ({Math.round(result.analysis.sentiment.score * 100)}%)
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {/* Comparison Summary */}
              <Card className="p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-2">Comparison Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Fastest:</span>
                    <span className="ml-2 capitalize">
                      {results.reduce((prev, curr) => 
                        prev.executionTime < curr.executionTime ? prev : curr
                      ).provider}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Most Positive:</span>
                    <span className="ml-2 capitalize">
                      {results
                        .filter(r => r.analysis?.sentiment)
                        .reduce((prev, curr) => 
                          (prev.analysis?.sentiment.score || 0) > (curr.analysis?.sentiment.score || 0) ? prev : curr
                        ).provider}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Most Keywords:</span>
                    <span className="ml-2 capitalize">
                      {results
                        .filter(r => r.analysis?.keywords)
                        .reduce((prev, curr) => 
                          (prev.analysis?.keywords.length || 0) > (curr.analysis?.keywords.length || 0) ? prev : curr
                        ).provider}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="text-center py-12 text-gray-500">
              <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Click "Compare Models" to see side-by-side AI results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}