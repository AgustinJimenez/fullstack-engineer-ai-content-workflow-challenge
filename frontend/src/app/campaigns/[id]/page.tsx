'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Campaign, ContentPiece } from '@/types';
import EditCampaignModal from '@/components/EditCampaignModal';
import ContentCreationModal from '@/components/ContentCreationModal';
import ContentCard from '@/components/ContentCard';
import { createSSEClient } from '@/lib/events';
import { debounce } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = parseInt(params.id as string);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [content, setContent] = useState<ContentPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateContentModalOpen, setIsCreateContentModalOpen] = useState(false);
  const [isBulkTranslating, setIsBulkTranslating] = useState(false);
  
  // Filtering states
  const [keywordFilter, setKeywordFilter] = useState('');
  const [toneFilter, setToneFilter] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadCampaign = async () => {
    console.log('🔄 loadCampaign called for campaign:', campaignId, 'at', new Date().toISOString());
    try {
      setLoading(true);
      const [campaignData, contentData] = await Promise.all([
        apiClient.getCampaign(campaignId),
        apiClient.getCampaignContent(campaignId)
      ]);
      setCampaign(campaignData);
      setContent(contentData);
      setError('');
      console.log('✅ loadCampaign completed for campaign:', campaignId, 'content pieces:', contentData?.length);
    } catch (err) {
      console.error('❌ loadCampaign error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  // Subscribe to SSE for real-time updates
  useEffect(() => {
    if (!campaignId) return;
    console.log('🎧 Setting up SSE for campaign:', campaignId);
    const sse = createSSEClient();
    const debouncedReload = debounce(() => {
      console.log('⏰ Debounced reload triggered for campaign:', campaignId);
      loadCampaign();
    }, 300);
    const refreshIfMatch = (data: any) => {
      console.log('📨 SSE event received:', data, 'for campaign:', campaignId);
      if (data.campaignId === campaignId) {
        // Don't reload if content creation modal is open - let it manage its own flow
        if (!isCreateContentModalOpen) {
          console.log('✅ Campaign ID matches, triggering reload');
          debouncedReload();
        } else {
          console.log('🔄 Modal is open, skipping reload to preserve modal state');
        }
      } else {
        console.log('❌ Campaign ID mismatch, ignoring event');
      }
    };
    const off1 = sse.on('contentUpdated', refreshIfMatch);
    const off2 = sse.on('aiGenerationCreated', refreshIfMatch);
    const off3 = sse.on('translationCreated', refreshIfMatch);
    const off4 = sse.on('reviewCreated', refreshIfMatch);
    const off5 = sse.on('campaignUpdated', (d) => {
      console.log('📨 Campaign updated event:', d, 'for campaign:', campaignId);
      if (d.campaignId === campaignId) {
        // Don't reload if content creation modal is open - let it manage its own flow
        if (!isCreateContentModalOpen) {
          console.log('✅ Campaign updated ID matches, triggering reload');
          debouncedReload();
        } else {
          console.log('🔄 Modal is open, skipping campaign update reload to preserve modal state');
        }
      }
    });
    return () => { 
      console.log('🔌 Cleaning up SSE for campaign:', campaignId);
      off1(); off2(); off3(); off4(); off5(); sse.close(); 
    };
  }, [campaignId, isCreateContentModalOpen]);

  const handleEditSuccess = () => {
    loadCampaign(); // Reload campaign after editing
  };

  const handleContentSuccess = () => {
    // Don't reload immediately - let the modal manage its own flow
    // Only reload when the modal is actually closed
    if (!isCreateContentModalOpen) {
      loadCampaign();
    }
  };

  const handleTranslateAllTargets = async () => {
    if (!campaign || !campaign.targetLanguages || campaign.targetLanguages.length === 0) return;
    if (content.length === 0) return;
    setIsBulkTranslating(true);
    setError('');
    try {
      for (const piece of content) {
        const existing = new Set((piece.translations || []).map(t => String(t.targetLanguage).toLowerCase()));
        for (const lang of campaign.targetLanguages) {
          const code = String(lang).toLowerCase();
          if (!existing.has(code)) {
            await apiClient.translateContent(piece.id, { targetLanguage: code });
          }
        }
      }
      await loadCampaign();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to translate targets for campaign');
    } finally {
      setIsBulkTranslating(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter content based on analysis data and other criteria
  const filteredContent = content.filter((piece) => {
    // Status filter
    if (statusFilter && statusFilter !== 'all' && piece.status !== statusFilter) {
      return false;
    }

    // If no analysis filters are applied, show all content
    if (!keywordFilter && (!toneFilter || toneFilter === 'all') && (!sentimentFilter || sentimentFilter === 'all')) {
      return true;
    }

    // Check if any AI generation has analysis data matching filters
    const hasMatchingAnalysis = piece.aiGenerations?.some((generation) => {
      if (!generation.metadata) return false;
      
      // Parse metadata if it's a string
      let analysis;
      try {
        analysis = typeof generation.metadata === 'string' 
          ? JSON.parse(generation.metadata) 
          : generation.metadata;
      } catch {
        return false;
      }
      
      if (!analysis || typeof analysis !== 'object') return false;

      // Keyword filter
      if (keywordFilter && analysis.keywords) {
        const hasKeyword = analysis.keywords.some((keyword: string) => 
          keyword.toLowerCase().includes(keywordFilter.toLowerCase())
        );
        if (!hasKeyword) return false;
      }

      // Tone filter
      if (toneFilter && toneFilter !== 'all' && analysis.tone !== toneFilter) {
        return false;
      }

      // Sentiment filter
      if (sentimentFilter && sentimentFilter !== 'all' && analysis.sentiment?.label !== sentimentFilter) {
        return false;
      }

      return true;
    });

    return hasMatchingAnalysis || (!keywordFilter && (!toneFilter || toneFilter === 'all') && (!sentimentFilter || sentimentFilter === 'all'));
  });

  // Extract unique filter options from analysis data
  const getFilterOptions = () => {
    const tones = new Set<string>();
    const sentiments = new Set<string>();
    const keywords = new Set<string>();
    
    content.forEach(piece => {
      piece.aiGenerations?.forEach(generation => {
        if (!generation.metadata) return;
        
        // Parse metadata if it's a string
        let analysis;
        try {
          analysis = typeof generation.metadata === 'string' 
            ? JSON.parse(generation.metadata) 
            : generation.metadata;
        } catch {
          return;
        }
        
        if (analysis && typeof analysis === 'object') {
          if (analysis.tone) tones.add(analysis.tone);
          if (analysis.sentiment?.label) sentiments.add(analysis.sentiment.label);
          if (analysis.keywords) {
            analysis.keywords.forEach((keyword: string) => keywords.add(keyword));
          }
        }
      });
    });
    
    return {
      tones: Array.from(tones).sort(),
      sentiments: Array.from(sentiments).sort(),
      keywords: Array.from(keywords).sort()
    };
  };

  const filterOptions = getFilterOptions();
  const hasFilters = keywordFilter || (toneFilter && toneFilter !== 'all') || (sentimentFilter && sentimentFilter !== 'all') || (statusFilter && statusFilter !== 'all');
  const clearAllFilters = () => {
    setKeywordFilter('');
    setToneFilter('all');
    setSentimentFilter('all');
    setStatusFilter('all');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading campaign...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Campaign</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Link
              href="/campaigns"
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Campaigns
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Campaign Not Found</h2>
            <Link
              href="/campaigns"
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Campaigns
            </Link>
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
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/campaigns"
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(campaign.status)}`}>
              {campaign.status}
            </span>
          </div>
          
          {campaign.description && (
            <p className="text-gray-600 mb-4">{campaign.description}</p>
          )}

          {/* Target Languages Display */}
          {campaign.targetLanguages && campaign.targetLanguages.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span className="font-medium text-emerald-800">Target Languages:</span>
                  <div className="flex flex-wrap gap-1">
                    {campaign.targetLanguages.map((lang) => (
                      <span key={lang} className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full uppercase">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleTranslateAllTargets}
                  disabled={isBulkTranslating || content.length === 0}
                  className="bg-emerald-600 text-white px-3 py-1 text-sm rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                  title={`Translate all ${content.length} content pieces to: ${campaign.targetLanguages.join(', ')}`}
                >
                  {isBulkTranslating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Translating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Translate All ({content.length})
                    </>
                  )}
                </button>
              </div>
              {content.length === 0 && (
                <p className="text-emerald-700 text-sm mt-2">Add content pieces to use bulk translation</p>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Created on {formatDate(campaign.createdAt)}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setIsCreateContentModalOpen(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                data-testid="add-content-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Content
              </button>
              
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Content Pieces ({filteredContent.length}{filteredContent.length !== content.length ? ` of ${content.length}` : ''})
              </h2>
              {hasFilters && (
                <Button onClick={clearAllFilters} variant="outline" size="sm">
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Filters */}
            {content.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="status-filter-select">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="ai_generated">AI Generated</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone-filter" className="text-sm font-medium">Tone</Label>
                  <Select value={toneFilter} onValueChange={setToneFilter}>
                    <SelectTrigger data-testid="tone-filter-select">
                      <SelectValue placeholder="All tones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tones</SelectItem>
                      {filterOptions.tones.map(tone => (
                        <SelectItem key={tone} value={tone}>
                          {tone.charAt(0).toUpperCase() + tone.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sentiment-filter" className="text-sm font-medium">Sentiment</Label>
                  <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                    <SelectTrigger data-testid="sentiment-filter-select">
                      <SelectValue placeholder="All sentiments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sentiments</SelectItem>
                      {filterOptions.sentiments.map(sentiment => (
                        <SelectItem key={sentiment} value={sentiment}>
                          {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyword-filter" className="text-sm font-medium">Keywords</Label>
                  <Input
                    id="keyword-filter"
                    value={keywordFilter}
                    onChange={(e) => setKeywordFilter(e.target.value)}
                    placeholder="Filter by keyword..."
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {statusFilter && statusFilter !== 'all' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Status: {statusFilter.replace('_', ' ')}
                    <button 
                      onClick={() => setStatusFilter('all')}
                      className="ml-1 hover:bg-muted rounded-full w-3 h-3 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {toneFilter && toneFilter !== 'all' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Tone: {toneFilter}
                    <button 
                      onClick={() => setToneFilter('all')}
                      className="ml-1 hover:bg-muted rounded-full w-3 h-3 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {sentimentFilter && sentimentFilter !== 'all' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Sentiment: {sentimentFilter}
                    <button 
                      onClick={() => setSentimentFilter('all')}
                      className="ml-1 hover:bg-muted rounded-full w-3 h-3 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {keywordFilter && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Keyword: {keywordFilter}
                    <button 
                      onClick={() => setKeywordFilter('')}
                      className="ml-1 hover:bg-muted rounded-full w-3 h-3 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="p-6">
            {filteredContent.length === 0 && content.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  No content pieces yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start creating content for this campaign to see AI-powered suggestions
                </p>
                <button
                  onClick={() => setIsCreateContentModalOpen(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Content Piece
                </button>
              </div>
            ) : filteredContent.length === 0 && content.length > 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  No content matches your filters
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or clear all filters to see all content.
                </p>
                <Button onClick={clearAllFilters} variant="outline">
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredContent.map((piece) => (
                  <ContentCard 
                    key={piece.id} 
                    content={piece} 
                    onUpdate={handleContentSuccess}
                    campaign={campaign}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <EditCampaignModal
          campaign={campaign}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
        
        <ContentCreationModal
          key="content-creation-modal" 
          campaignId={campaignId}
          isOpen={isCreateContentModalOpen}
          onClose={() => {
            setIsCreateContentModalOpen(false);
            // Reload campaign data when modal closes to show new content
            loadCampaign();
          }}
          onSuccess={handleContentSuccess}
          defaultLanguage={campaign.defaultLanguage || 'en'}
        />
      </div>
    </main>
  );
}
