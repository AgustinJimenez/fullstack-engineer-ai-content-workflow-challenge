'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FilterIcon, XIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react';

export interface CampaignFilterValues {
  status?: string;
  contentStatus?: string;
  contentType?: string;
  hasAIContent?: string;
  hasTranslations?: string;
  language?: string;
}

interface CampaignFiltersProps {
  filters: CampaignFilterValues;
  onFiltersChange: (filters: CampaignFilterValues) => void;
}

export default function CampaignFilters({ filters, onFiltersChange }: CampaignFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof CampaignFilterValues, value: string) => {
    const newFilters = { ...filters };
    if (value === 'all' || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className="bg-white rounded-lg shadow border-t-4 border-t-purple-500 mb-6">
      <div className="p-4">
        <div 
          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-t-lg transition-colors"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-2">
            <FilterIcon className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllFilters();
                }}
                data-testid="clear-all-filters-button"
              >
                <XIcon className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
            {showFilters ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-500" data-testid="toggle-filters-icon" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-500" data-testid="toggle-filters-icon" />
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t border-gray-200">
            <div>
              <Label htmlFor="filter-status" className="text-sm font-medium mb-2 block">
                Campaign Status
              </Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger id="filter-status" data-testid="filter-status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-content-status" className="text-sm font-medium mb-2 block">
                Content Review Status
              </Label>
              <Select
                value={filters.contentStatus || 'all'}
                onValueChange={(value) => handleFilterChange('contentStatus', value)}
              >
                <SelectTrigger id="filter-content-status" data-testid="filter-content-status">
                  <SelectValue placeholder="All review states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Review States</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ai_generated">AI Generated</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-content-type" className="text-sm font-medium mb-2 block">
                Content Type
              </Label>
              <Select
                value={filters.contentType || 'all'}
                onValueChange={(value) => handleFilterChange('contentType', value)}
              >
                <SelectTrigger id="filter-content-type" data-testid="filter-content-type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="headline">Headline</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                  <SelectItem value="body_content">Body Content</SelectItem>
                  <SelectItem value="cta">Call to Action</SelectItem>
                  <SelectItem value="social_post">Social Post</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-ai-content" className="text-sm font-medium mb-2 block">
                AI Content
              </Label>
              <Select
                value={filters.hasAIContent || 'all'}
                onValueChange={(value) => handleFilterChange('hasAIContent', value)}
              >
                <SelectTrigger id="filter-ai-content" data-testid="filter-ai-content">
                  <SelectValue placeholder="All campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  <SelectItem value="true">With AI Content</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-translations" className="text-sm font-medium mb-2 block">
                Translations
              </Label>
              <Select
                value={filters.hasTranslations || 'all'}
                onValueChange={(value) => handleFilterChange('hasTranslations', value)}
              >
                <SelectTrigger id="filter-translations" data-testid="filter-translations">
                  <SelectValue placeholder="All campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  <SelectItem value="true">With Translations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-language" className="text-sm font-medium mb-2 block">
                Language
              </Label>
              <Select
                value={filters.language || 'all'}
                onValueChange={(value) => handleFilterChange('language', value)}
              >
                <SelectTrigger id="filter-language" data-testid="filter-language">
                  <SelectValue placeholder="All languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-200">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filters.status && (
              <Badge 
                variant="secondary" 
                className="bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                onClick={() => handleFilterChange('status', '')}
                data-testid="active-filter-status"
              >
                Status: {filters.status}
                <XIcon className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.contentStatus && (
              <Badge 
                variant="secondary" 
                className="bg-orange-100 text-orange-800 cursor-pointer hover:bg-orange-200"
                onClick={() => handleFilterChange('contentStatus', '')}
                data-testid="active-filter-content-status"
              >
                Review: {filters.contentStatus.replace('_', ' ')}
                <XIcon className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.contentType && (
              <Badge 
                variant="secondary" 
                className="bg-green-100 text-green-800 cursor-pointer hover:bg-green-200"
                onClick={() => handleFilterChange('contentType', '')}
                data-testid="active-filter-content-type"
              >
                Type: {filters.contentType.replace('_', ' ')}
                <XIcon className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.hasAIContent && (
              <Badge 
                variant="secondary" 
                className="bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200"
                onClick={() => handleFilterChange('hasAIContent', '')}
                data-testid="active-filter-ai-content"
              >
                With AI Content
                <XIcon className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.hasTranslations && (
              <Badge 
                variant="secondary" 
                className="bg-indigo-100 text-indigo-800 cursor-pointer hover:bg-indigo-200"
                onClick={() => handleFilterChange('hasTranslations', '')}
                data-testid="active-filter-translations"
              >
                With Translations
                <XIcon className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.language && (
              <Badge 
                variant="secondary" 
                className="bg-pink-100 text-pink-800 cursor-pointer hover:bg-pink-200"
                onClick={() => handleFilterChange('language', '')}
                data-testid="active-filter-language"
              >
                Language: {filters.language.toUpperCase()}
                <XIcon className="w-3 h-3 ml-1" />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}