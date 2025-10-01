'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ContentSetupStepProps {
  type: string;
  setType: (type: string) => void;
  originalContent: string;
  setOriginalContent: (content: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  loading: boolean;
}

const contentTypes = [
  { value: 'headline', label: 'Headline' },
  { value: 'description', label: 'Description' },
  { value: 'body_content', label: 'Body Content' },
  { value: 'cta', label: 'Call to Action' },
  { value: 'tagline', label: 'Tagline' },
  { value: 'social_post', label: 'Social Media Post' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
];

export default function ContentSetupStep({
  type,
  setType,
  originalContent,
  setOriginalContent,
  language,
  setLanguage,
  loading
}: ContentSetupStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content-type">Content Type</Label>
        <Select value={type} onValueChange={setType} disabled={loading}>
          <SelectTrigger data-testid="content-type-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contentTypes.map(contentType => (
              <SelectItem key={contentType.value} value={contentType.value}>
                {contentType.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="original-content">Original Content <span className="text-red-500">*</span></Label>
        <Textarea
          id="original-content"
          value={originalContent}
          onChange={(e) => setOriginalContent(e.target.value)}
          placeholder="Enter your content that you want to work with"
          rows={3}
          disabled={loading}
          className={!originalContent.trim() ? 'border-red-200' : ''}
        />
        <p className="text-sm text-gray-500">
          Provide your base content. You can then use AI to enhance, rewrite, or analyze it.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Select value={language} onValueChange={setLanguage} disabled={loading}>
          <SelectTrigger data-testid="language-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map(lang => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}