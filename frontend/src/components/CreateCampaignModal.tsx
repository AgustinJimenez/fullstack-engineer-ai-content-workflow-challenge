'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, X } from 'lucide-react';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCampaignModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCampaignModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [selectedTargetLanguages, setSelectedTargetLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'zh-tw', name: 'Chinese (Traditional)' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'pt-br', name: 'Portuguese (Brazil)' },
    { code: 'ru', name: 'Russian' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sv', name: 'Swedish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'pl', name: 'Polish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'he', name: 'Hebrew' },
    { code: 'th', name: 'Thai' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ms', name: 'Malay' },
    { code: 'tl', name: 'Filipino' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'cs', name: 'Czech' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'ro', name: 'Romanian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'hr', name: 'Croatian' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Campaign name is required');
      return;
    }

    if (selectedTargetLanguages.length === 0) {
      setError('At least one target language is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.createCampaign({
        name: name.trim(),
        description: description.trim() || undefined,
        defaultLanguage,
        targetLanguages: selectedTargetLanguages,
      });

      // Reset form
      setName('');
      setDescription('');
      setDefaultLanguage('en');
      setSelectedTargetLanguages([]);
      setOpen(false);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setDescription('');
      setDefaultLanguage('en');
      setSelectedTargetLanguages([]);
      setOpen(false);
      setError('');
      onClose();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Create a new campaign to organize your content and translations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter campaign name"
              disabled={loading}
              required
              data-testid="campaign-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter campaign description (optional)"
              disabled={loading}
              data-testid="campaign-description-input"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-language">Default Language</Label>
            <Select value={defaultLanguage} onValueChange={setDefaultLanguage} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select default language" />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Languages</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between min-h-10"
                  disabled={loading}
                >
                  <div className="flex gap-1 flex-wrap">
                    {selectedTargetLanguages.length > 0 ? (
                      selectedTargetLanguages.map((langCode) => {
                        const lang = availableLanguages.find(l => l.code === langCode);
                        return lang ? (
                          <Badge
                            key={langCode}
                            variant="secondary"
                            className="text-xs"
                          >
                            {lang.name}
                            <button
                              className="ml-1 hover:bg-muted rounded-full w-3 h-3 flex items-center justify-center"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedTargetLanguages(prev => prev.filter(code => code !== langCode));
                              }}
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </Badge>
                        ) : null;
                      })
                    ) : (
                      <span className="text-muted-foreground">Select target languages...</span>
                    )}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search languages..." />
                  <CommandEmpty>No language found.</CommandEmpty>
                  <CommandGroup>
                    {availableLanguages
                      .filter(lang => lang.code !== defaultLanguage)
                      .map((lang) => (
                      <CommandItem
                        key={lang.code}
                        onSelect={() => {
                          if (selectedTargetLanguages.includes(lang.code)) {
                            setSelectedTargetLanguages(prev => prev.filter(code => code !== lang.code));
                          } else {
                            setSelectedTargetLanguages(prev => [...prev, lang.code]);
                          }
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedTargetLanguages.includes(lang.code) ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        {lang.name} ({lang.code.toUpperCase()})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Select languages for translation (excluding default language)
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/15 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              data-testid="cancel-campaign-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || selectedTargetLanguages.length === 0}
              data-testid="submit-campaign-button"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
