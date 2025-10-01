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
import { MultiSelect } from '@/components/ui/multi-select';

export interface CampaignFilterValues {
  status?: string | string[];
  contentStatus?: string | string[];
  contentType?: string | string[];
  hasAIContent?: string;
  hasTranslations?: string;
  defaultLanguage?: string | string[];
  targetLanguages?: string | string[];
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

  const handleMultiFilterChange = (key: keyof CampaignFilterValues, values: string[]) => {
    const newFilters = { ...filters };
    if (values.length === 0) {
      delete newFilters[key];
    } else {
      (newFilters as any)[key] = values;
    }
    onFiltersChange(newFilters);
  };

  const getSelectedValues = (key: keyof CampaignFilterValues): string[] => {
    const value = filters[key];
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
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
              <MultiSelect
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Paused', value: 'paused' },
                  { label: 'Completed', value: 'completed' },
                ]}
                selected={getSelectedValues('status')}
                onChange={(values) => handleMultiFilterChange('status', values)}
                placeholder="All statuses"
                className="w-full"
                data-testid="filter-status"
              />
            </div>

            <div>
              <Label htmlFor="filter-content-status" className="text-sm font-medium mb-2 block">
                Content Review Status
              </Label>
              <MultiSelect
                options={[
                  { label: 'Draft', value: 'draft' },
                  { label: 'AI Generated', value: 'ai_generated' },
                  { label: 'Under Review', value: 'under_review' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Rejected', value: 'rejected' },
                ]}
                selected={getSelectedValues('contentStatus')}
                onChange={(values) => handleMultiFilterChange('contentStatus', values)}
                placeholder="All review states"
                className="w-full"
                data-testid="filter-content-status"
              />
            </div>

            <div>
              <Label htmlFor="filter-content-type" className="text-sm font-medium mb-2 block">
                Content Type
              </Label>
              <MultiSelect
                options={[
                  { label: 'Headline', value: 'headline' },
                  { label: 'Description', value: 'description' },
                  { label: 'Body Content', value: 'body_content' },
                  { label: 'Call to Action', value: 'cta' },
                  { label: 'Social Post', value: 'social_post' },
                ]}
                selected={getSelectedValues('contentType')}
                onChange={(values) => handleMultiFilterChange('contentType', values)}
                placeholder="All types"
                className="w-full"
                data-testid="filter-content-type"
              />
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
              <Label htmlFor="filter-default-language" className="text-sm font-medium mb-2 block">
                Default Language
              </Label>
              <MultiSelect
                options={[
                  { label: 'English', value: 'en' },
                  { label: 'Spanish', value: 'es' },
                  { label: 'French', value: 'fr' },
                  { label: 'German', value: 'de' },
                  { label: 'Italian', value: 'it' },
                  { label: 'Portuguese', value: 'pt' },
                  { label: 'Japanese', value: 'ja' },
                  { label: 'Chinese', value: 'zh' },
                ]}
                selected={getSelectedValues('defaultLanguage')}
                onChange={(values) => handleMultiFilterChange('defaultLanguage', values)}
                placeholder="All languages"
                className="w-full"
                data-testid="filter-default-language"
              />
            </div>

            <div>
              <Label htmlFor="filter-target-languages" className="text-sm font-medium mb-2 block">
                Target Languages
              </Label>
              <MultiSelect
                options={[
                  { label: 'English', value: 'en' },
                  { label: 'Spanish', value: 'es' },
                  { label: 'French', value: 'fr' },
                  { label: 'German', value: 'de' },
                  { label: 'Italian', value: 'it' },
                  { label: 'Portuguese', value: 'pt' },
                  { label: 'Japanese', value: 'ja' },
                  { label: 'Chinese', value: 'zh' },
                ]}
                selected={getSelectedValues('targetLanguages')}
                onChange={(values) => handleMultiFilterChange('targetLanguages', values)}
                placeholder="All languages"
                className="w-full"
                data-testid="filter-target-languages"
              />
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
                onClick={() => handleMultiFilterChange('status', [])}
                data-testid="active-filter-status"
              >
                Status: {Array.isArray(filters.status) ? filters.status.join(', ') : filters.status}
                <XIcon className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.contentStatus && (
              <Badge 
                variant="secondary" 
                className="bg-orange-100 text-orange-800 cursor-pointer hover:bg-orange-200"
                onClick={() => handleMultiFilterChange('contentStatus', [])}
                data-testid="active-filter-content-status"
              >
                Review: {Array.isArray(filters.contentStatus) 
                  ? filters.contentStatus.map(s => s.replace(/_/g, ' ')).join(', ')
                  : filters.contentStatus.replace(/_/g, ' ')}
                <XIcon className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.contentType && (
              <Badge 
                variant="secondary" 
                className="bg-green-100 text-green-800 cursor-pointer hover:bg-green-200"
                onClick={() => handleMultiFilterChange('contentType', [])}
                data-testid="active-filter-content-type"
              >
                Type: {Array.isArray(filters.contentType)
                  ? filters.contentType.map(s => s.replace(/_/g, ' ')).join(', ')
                  : filters.contentType.replace(/_/g, ' ')}
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
            {filters.defaultLanguage && (
              <Badge 
                variant="secondary" 
                className="bg-pink-100 text-pink-800 cursor-pointer hover:bg-pink-200"
                onClick={() => handleMultiFilterChange('defaultLanguage', [])}
                data-testid="active-filter-default-language"
              >
                Default: {Array.isArray(filters.defaultLanguage)
                  ? filters.defaultLanguage.map(l => l.toUpperCase()).join(', ')
                  : filters.defaultLanguage.toUpperCase()}
                <XIcon className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.targetLanguages && (
              <Badge 
                variant="secondary" 
                className="bg-rose-100 text-rose-800 cursor-pointer hover:bg-rose-200"
                onClick={() => handleMultiFilterChange('targetLanguages', [])}
                data-testid="active-filter-target-languages"
              >
                Targets: {Array.isArray(filters.targetLanguages)
                  ? filters.targetLanguages.map(l => l.toUpperCase()).join(', ')
                  : filters.targetLanguages.toUpperCase()}
                <XIcon className="w-3 h-3 ml-1" />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}