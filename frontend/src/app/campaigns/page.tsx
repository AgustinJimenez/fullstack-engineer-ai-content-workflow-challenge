'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Campaign } from '@/types';
import CreateCampaignModal from '@/components/CreateCampaignModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import CampaignFilters, { CampaignFilterValues } from '@/components/CampaignFilters';
import InfiniteScroll from '@/components/InfiniteScroll';
import { createSSEClient } from '@/lib/events';
import { debounce } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FolderIcon, 
  FileTextIcon, 
  CheckCircleIcon, 
  ClockIcon,
  LanguagesIcon,
  ZapIcon,
  Trash2Icon 
} from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CampaignFilterValues>({});
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; campaign: Campaign | null }>({ 
    isOpen: false, 
    campaign: null 
  });
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalContentPieces: 0,
    contentWithAI: 0,
    contentUnderReview: 0,
    approvedContent: 0,
    totalTranslations: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const nextCursorRef = useRef<number | null>(null);
  const { toast } = useToast();

  const loadStats = useCallback(async (filterOverrides?: CampaignFilterValues) => {
    try {
      setStatsLoading(true);
      const filtersToUse = filterOverrides !== undefined ? filterOverrides : filters;
      const statsData = await apiClient.getCampaignStats(Object.keys(filtersToUse).length > 0 ? filtersToUse : undefined);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [filters]);

  const loadCampaigns = useCallback(async (reset = true, filterOverrides?: CampaignFilterValues) => {
    console.log('[loadCampaigns] Called with reset:', reset, 'filters:', filters);
    try {
      if (reset) {
        if (initialLoad) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        nextCursorRef.current = null;
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      const filtersToUse = filterOverrides !== undefined ? filterOverrides : filters;
      console.log('[loadCampaigns] Making API call with filters:', filtersToUse);
      const response = await apiClient.getCampaigns({
        limit: 12,
        cursor: reset ? undefined : nextCursorRef.current || undefined,
        ...filtersToUse,
      });

      console.log('[loadCampaigns] Got response:', response.data.length, 'campaigns');
      // Update campaigns after receiving response to avoid empty table while loading
      setCampaigns(response.data);
      
      setHasMore(response.pagination.hasMore);
      nextCursorRef.current = response.pagination.nextCursor;
      setError('');
    } catch (err) {
      console.error('[loadCampaigns] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      console.log('[loadCampaigns] Setting loading to false');
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      setInitialLoad(false);
    }
  }, [filters, initialLoad]);

  const loadMoreCampaigns = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadCampaigns(false);
    }
  }, [loadingMore, hasMore, loadCampaigns]);

  useEffect(() => {
    loadCampaigns();
    loadStats();
  }, []);

  useEffect(() => {
    console.log('[Filter Effect] Triggered with filters:', filters);
    if (Object.keys(filters).length > 0) {
      console.log('[Filter Effect] Loading campaigns with filters');
      loadCampaigns(true);
      loadStats();
    }
  }, [filters, loadCampaigns, loadStats]);

  // Subscribe to SSE to keep list fresh
  useEffect(() => {
    const sse = createSSEClient();
    const debouncedRefresh = debounce(() => loadCampaigns(true), 400);
    const mergeCampaign = async (id: number) => {
      try {
        const updated = await apiClient.getCampaign(id);
        setCampaigns(prev => {
          const exists = prev.find(c => c.id === id);
          if (!exists) return [updated, ...prev];
          return prev.map(c => (c.id === id ? updated : c));
        });
      } catch {
        // Fallback to full refresh
        debouncedRefresh();
      }
    };

    const offCreated = sse.on('campaignCreated', (d: any) => { mergeCampaign(d.campaignId); loadStats(); });
    const offUpdated = sse.on('campaignUpdated', (d: any) => { mergeCampaign(d.campaignId); loadStats(); });
    const offDeleted = sse.on('campaignDeleted', (d: any) => { setCampaigns(prev => prev.filter(c => c.id !== d.campaignId)); loadStats(); });
    const offContent = sse.on('contentUpdated', (d: any) => { mergeCampaign(d.campaignId); loadStats(); });
    const offAI = sse.on('aiGenerationCreated', (d: any) => { mergeCampaign(d.campaignId); loadStats(); });
    const offReview = sse.on('reviewCreated', (d: any) => { mergeCampaign(d.campaignId); loadStats(); });

    return () => {
      offCreated(); offUpdated(); offDeleted(); offContent(); offAI(); offReview();
      sse.close();
    };
  }, []);

  const handleCreateSuccess = () => {
    loadCampaigns(true);
    loadStats();
    toast({
      title: 'Campaign created',
      description: 'Your new campaign has been successfully created.',
      variant: 'success'
    });
  };

  const handleDeleteCampaign = (campaign: Campaign) => {
    setDeleteModal({ isOpen: true, campaign });
  };

  const confirmDeleteCampaign = async () => {
    if (!deleteModal.campaign) return;
    
    try {
      await apiClient.deleteCampaign(deleteModal.campaign.id);
      setCampaigns(prev => prev.filter(c => c.id !== deleteModal.campaign!.id));
      loadStats();
      
      toast({
        title: 'Campaign deleted',
        description: `"${deleteModal.campaign.name}" has been successfully deleted.`,
        variant: 'success'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete campaign';
      setError(errorMessage);
      loadCampaigns(true);
      loadStats();
      
      toast({
        title: 'Delete failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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


  // Filter campaigns based on search query
  const filteredCampaigns = campaigns.filter(campaign => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      campaign.name.toLowerCase().includes(query) ||
      (campaign.description && campaign.description.toLowerCase().includes(query))
    );
  });

  // Calculate KPIs based on filtered campaigns
  const calculateFilteredKPIs = () => {
    const totalCampaigns = filteredCampaigns.length;
    const activeCampaigns = filteredCampaigns.filter(c => c.status === 'active').length;
    const totalContentPieces = filteredCampaigns.reduce((sum, c) => sum + (c.contentPieces?.length || 0), 0);
    
    // Count content by status across filtered campaigns
    const contentWithAI = filteredCampaigns.reduce((sum, c) => {
      return sum + (c.contentPieces?.filter(cp => cp.aiGenerations && cp.aiGenerations.length > 0).length || 0);
    }, 0);
    
    const contentUnderReview = filteredCampaigns.reduce((sum, c) => {
      return sum + (c.contentPieces?.filter(cp => cp.status === 'under_review').length || 0);
    }, 0);
    
    const approvedContent = filteredCampaigns.reduce((sum, c) => {
      return sum + (c.contentPieces?.filter(cp => cp.status === 'approved').length || 0);
    }, 0);

    // Count total translations across filtered content
    const totalTranslations = filteredCampaigns.reduce((sum, c) => {
      return sum + (c.contentPieces?.reduce((contentSum, cp) => {
        return contentSum + (cp.translations?.length || 0);
      }, 0) || 0);
    }, 0);

    return {
      totalCampaigns,
      activeCampaigns,
      totalContentPieces,
      contentWithAI,
      contentUnderReview,
      approvedContent,
      totalTranslations
    };
  };

  const kpis = searchQuery ? calculateFilteredKPIs() : stats;

  const renderCampaign = (campaign: Campaign) => (
    <TableRow
      key={campaign.id}
      data-testid={`campaign-row-${campaign.id}`}
      data-campaign-card={campaign.id}
    >
      <TableCell className="w-[35%]">
        <div className="flex flex-col">
          <Link
            href={`/campaigns/${campaign.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            {campaign.name}
          </Link>
          {campaign.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {campaign.description}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center w-[10%]">
        <Badge variant="secondary" className={getStatusColor(campaign.status)}>
          {campaign.status}
        </Badge>
      </TableCell>
      <TableCell className="text-center w-[8%]">
        <div className="flex items-center justify-center">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm text-muted-foreground">
            {campaign.contentPieces ? campaign.contentPieces.length : 0}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center w-[12%]">
        <div className="flex items-center justify-center">
          <ZapIcon className="w-4 h-4 mr-2 text-purple-600" />
          <span className="text-sm text-muted-foreground">
            {campaign.contentPieces 
              ? campaign.contentPieces.reduce((sum, cp) => sum + (cp.aiGenerations?.length || 0), 0)
              : 0}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center w-[15%]">
        <div className="flex items-center justify-center">
          <LanguagesIcon className="w-4 h-4 mr-1 text-gray-400" />
          <div className="relative group">
            <span className="text-sm text-muted-foreground cursor-help">
              {(() => {
                const totalLanguages = (campaign.targetLanguages?.length || 0) + (campaign.defaultLanguage ? 1 : 0);
                const targetCount = campaign.targetLanguages?.length || 0;
                
                if (totalLanguages === 0) return '0';
                if (totalLanguages === 1) return campaign.defaultLanguage?.toUpperCase() || '1';
                
                return `${totalLanguages} langs`;
              })()}
            </span>
            {/* Hover popover */}
            {(() => {
              const allLanguages = [
                ...(campaign.defaultLanguage ? [campaign.defaultLanguage] : []),
                ...(campaign.targetLanguages || [])
              ].filter((lang, index, arr) => arr.indexOf(lang) === index); // Remove duplicates
              
              if (allLanguages.length > 1) {
                return (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {allLanguages.map((lang, index) => (
                        <span 
                          key={lang}
                          className={`px-2 py-1 rounded text-xs ${
                            lang === campaign.defaultLanguage 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-700 text-gray-200'
                          }`}
                        >
                          {lang.toUpperCase()}
                          {lang === campaign.defaultLanguage && ' (default)'}
                        </span>
                      ))}
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center text-sm text-muted-foreground w-[12%]">
        {formatDate(campaign.createdAt)}
      </TableCell>
      <TableCell className="text-center w-[8%]">
        <div className="flex items-center justify-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link
              href={`/campaigns/${campaign.id}`}
              data-testid={`view-details-${campaign.id}`}
              title="View campaign details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="sr-only">View</span>
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleDeleteCampaign(campaign)}
            data-testid={`delete-campaign-${campaign.id}`}
            title="Delete campaign"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2Icon className="w-4 h-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading campaigns...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Campaigns</h1>
            <p className="text-gray-600">
              Manage your AI-powered content campaigns
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="secondary">
              <Link href="/review" className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Review Content
              </Link>
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              data-testid="create-campaign-header-button"
              className="flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Campaign
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        {!loading && filteredCampaigns.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <Card className="border-t-4 border-t-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FolderIcon className="w-4 h-4 text-blue-600" />
                  Total Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {statsLoading && !searchQuery ? (
                  <div className="text-2xl font-bold text-gray-400 animate-pulse">...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{kpis.totalCampaigns}</div>
                    <p className="text-xs text-muted-foreground">
                      {kpis.activeCampaigns} active
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileTextIcon className="w-4 h-4 text-green-600" />
                  Content Pieces
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {statsLoading && !searchQuery ? (
                  <div className="text-2xl font-bold text-gray-400 animate-pulse">...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{kpis.totalContentPieces}</div>
                    <p className="text-xs text-muted-foreground">
                      across all campaigns
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ZapIcon className="w-4 h-4 text-purple-600" />
                  AI Generated
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {statsLoading && !searchQuery ? (
                  <div className="text-2xl font-bold text-gray-400 animate-pulse">...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{kpis.contentWithAI}</div>
                    <p className="text-xs text-muted-foreground">
                      with AI drafts
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-orange-600" />
                  Under Review
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {statsLoading && !searchQuery ? (
                  <div className="text-2xl font-bold text-gray-400 animate-pulse">...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{kpis.contentUnderReview}</div>
                    <p className="text-xs text-muted-foreground">
                      pending approval
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {statsLoading && !searchQuery ? (
                  <div className="text-2xl font-bold text-gray-400 animate-pulse">...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{kpis.approvedContent}</div>
                    <p className="text-xs text-muted-foreground">
                      content approved
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-indigo-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <LanguagesIcon className="w-4 h-4 text-indigo-600" />
                  Translations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {statsLoading && !searchQuery ? (
                  <div className="text-2xl font-bold text-gray-400 animate-pulse">...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{kpis.totalTranslations}</div>
                    <p className="text-xs text-muted-foreground">
                      total translations
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-gradient-to-r border-t-pink-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                  Completion
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {statsLoading && !searchQuery ? (
                  <div className="text-2xl font-bold text-gray-400 animate-pulse">...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {kpis.totalContentPieces > 0 
                        ? Math.round((kpis.approvedContent / kpis.totalContentPieces) * 100)
                        : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      approval rate
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="relative">
          {refreshing && (
            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Applying filters...</p>
              </div>
            </div>
          )}
          <CampaignFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Search Filter */}
        {!loading && campaigns.length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-blue-500">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="campaign-search" className="text-sm font-medium mb-2 block">
                    Search Campaigns
                  </Label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <Input
                      id="campaign-search"
                      type="text"
                      placeholder="Search by campaign name or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="campaign-search-input"
                    />
                  </div>
                </div>
                {searchQuery && (
                  <div className="text-sm text-muted-foreground pt-6">
                    {filteredCampaigns.length} match
                  </div>
                )}
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSearchQuery('')}
                    className="mt-6"
                    data-testid="clear-search-button"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden border-t-4 border-t-blue-500 relative">
          {refreshing && (
            <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading campaigns...</p>
              </div>
            </div>
          )}
          {/* Static Table Header */}
          <div className="border-b border-gray-200 bg-gray-50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left w-[35%]">Campaign</TableHead>
                  <TableHead className="text-center w-[10%]">Status</TableHead>
                  <TableHead className="text-center w-[8%]">Content</TableHead>
                  <TableHead className="text-center w-[12%]">AI Generated</TableHead>
                  <TableHead className="text-center w-[15%]">Languages</TableHead>
                  <TableHead className="text-center w-[12%]">Created</TableHead>
                  <TableHead className="text-center w-[8%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>
          
          {/* Scrollable Table Body */}
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableBody>
              <InfiniteScroll
                items={searchQuery ? filteredCampaigns : campaigns}
                hasMore={hasMore && !searchQuery && Object.keys(filters).length === 0}
                loading={loadingMore}
                onLoadMore={searchQuery || Object.keys(filters).length > 0 ? () => {} : loadMoreCampaigns}
                renderItem={renderCampaign}
                keyExtractor={(campaign) => campaign.id.toString()}
                className=""
                colSpan={7}
                tableMode={true}
                error={error || null}
                emptyComponent={searchQuery || Object.keys(filters).length > 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="text-muted-foreground mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-semibold mb-2">
                        No campaigns found
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        {searchQuery 
                          ? `No campaigns match your search for "${searchQuery}"`
                          : 'No campaigns match the selected filters'}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery('');
                          setFilters({});
                        }}
                      >
                        Clear Filters
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="text-muted-foreground mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-semibold mb-2">
                        No campaigns yet
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        Create your first campaign to get started with AI content generation
                      </p>
                      <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        data-testid="create-campaign-empty-state-button"
                      >
                        Create Your First Campaign
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              />
            </TableBody>
          </Table>
          </div>
        </div>

        <CreateCampaignModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
        
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, campaign: null })}
          onConfirm={confirmDeleteCampaign}
          title="Delete Campaign"
          description="This will permanently delete the campaign and all its content pieces. This action cannot be undone."
          itemName={deleteModal.campaign?.name}
        />
      </div>
    </main>
  );
}
