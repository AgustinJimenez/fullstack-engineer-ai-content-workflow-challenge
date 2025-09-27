'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { ContentPiece } from '@/types';
import ReviewModal from '@/components/ReviewModal';
import { createSSEClient } from '@/lib/events';
import { debounce } from '@/lib/utils';

export default function ReviewPage() {
  const [contentForReview, setContentForReview] = useState<ContentPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContent, setSelectedContent] = useState<ContentPiece | null>(null);
  const [languageFilter, setLanguageFilter] = useState<string>('');

  const loadContentForReview = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getContentForReview(languageFilter || undefined);
      setContentForReview(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content for review');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContentForReview();
  }, [languageFilter]);

  // Subscribe to SSE for updates affecting review list
  useEffect(() => {
    const sse = createSSEClient();
    const refresh = debounce(() => loadContentForReview(), 300);
    const off1 = sse.on('contentUpdated', refresh);
    const off2 = sse.on('aiGenerationCreated', refresh);
    const off3 = sse.on('reviewCreated', refresh);
    const off4 = sse.on('translationCreated', refresh);
    return () => { off1(); off2(); off3(); off4(); sse.close(); };
  }, []);

  const handleReviewSuccess = () => {
    loadContentForReview(); // Refresh the list
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading content for review...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Review Dashboard</h1>
              <p className="text-gray-600 mt-2">Review AI-generated content and provide feedback</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                title="Filter by language"
              >
                <option value="">All languages</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
              </select>
              <Link
                href="/campaigns"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Campaigns
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadContentForReview}
              className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Content for Review */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Content Awaiting Review ({contentForReview.length})
              </h2>
              <button
                onClick={loadContentForReview}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          <div className="p-6">
            {contentForReview.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  No content awaiting review
                </h3>
                <p className="text-gray-600 mb-6">
                  All content has been reviewed. Create some AI-generated content to get started.
                </p>
                <Link
                  href="/campaigns"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Campaigns
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {contentForReview.map((content) => (
                  <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 capitalize">
                            {content.type.replace('_', ' ')}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(content.status)}`}>
                            {content.status.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-500">
                            {content.language.toUpperCase()}
                          </span>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">Campaign:</p>
                          <p className="font-medium text-gray-900">
                            {content.campaign?.name || 'Unknown Campaign'}
                          </p>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">Original Content:</p>
                          <p className="text-gray-800 bg-gray-50 p-2 rounded text-sm">
                            {content.originalContent || 'No original content'}
                          </p>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">
                            AI Generations: {content.aiGenerations?.length || 0}
                          </p>
                          {content.aiGenerations && content.aiGenerations.length > 0 && (
                            <p className="text-gray-800 bg-blue-50 p-2 rounded text-sm">
                              {content.aiGenerations[0].generatedText}
                              {content.aiGenerations.length > 1 && (
                                <span className="text-blue-600 ml-2">
                                  (+{content.aiGenerations.length - 1} more)
                                </span>
                              )}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center text-sm text-gray-500">
                          <span>Updated {formatDate(content.updatedAt)}</span>
                        </div>
                      </div>

                      <div className="ml-4">
                        <button
                          onClick={() => setSelectedContent(content)}
                          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {selectedContent && (
          <ReviewModal
            contentPiece={selectedContent}
            isOpen={!!selectedContent}
            onClose={() => setSelectedContent(null)}
            onSuccess={handleReviewSuccess}
          />
        )}
      </div>
    </main>
  );
}
