'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ContentPiece, Campaign } from '@/types';
import ReviewModal from './ReviewModal';
import TranslateModal from './TranslateModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, ClipboardIcon, SparklesIcon, TrashIcon, Languages } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ContentCardProps {
  content: ContentPiece;
  onUpdate: () => void;
  campaign?: Campaign;
}

export default function ContentCard({ content: initialContent, onUpdate, campaign }: ContentCardProps) {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [minQuality, setMinQuality] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; content: ContentPiece | null }>({ 
    isOpen: false, 
    content: null 
  });
  const { toast } = useToast();

  // Sync local state when prop changes
  useEffect(() => {
    setContent(initialContent);
    
    // Extract analysis data from existing AI generations
    if (initialContent.aiGenerations && initialContent.aiGenerations.length > 0) {
      const latestGeneration = initialContent.aiGenerations
        .filter(gen => gen.metadata)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      // Analysis data is now handled in the modal workflow
    }
  }, [initialContent]);



  const handleSubmitForReview = async () => {
    setLoading(true);
    setError('');

    try {
      await apiClient.submitForReview(content.id);
      onUpdate(); // Refresh the parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit for review');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (content.status === 'approved') {
      setError('Cannot delete approved content');
      return;
    }
    setDeleteModal({ isOpen: true, content });
  };

  const confirmDeleteContent = async () => {
    if (!deleteModal.content) return;
    
    setLoading(true);
    setError('');

    try {
      await apiClient.deleteContent(deleteModal.content.id);
      onUpdate(); // Refresh the parent component
      
      toast({
        title: 'Content deleted',
        description: `${displayType} content has been successfully deleted.`,
        variant: 'success'
      });
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete content';
      setError(errorMessage);
      
      toast({
        title: 'Delete failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const displayType = (() => {
    const base = content.type.replace('_', ' ');
    return base.charAt(0).toUpperCase() + base.slice(1);
  })();





  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200" data-testid="content-card" data-content-id={content.id}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-gray-900" data-testid="content-type">
            {displayType}
          </h4>
          <p className="text-sm text-gray-500">
            {content.language.toUpperCase()} • {formatDate(content.createdAt)}
          </p>
        </div>
      </div>

      {/* Content Preview */}
      <div className="mb-4">
        {content.originalContent ? (
          <div>
            <p className="text-sm text-gray-600 mb-2">Original:</p>
            <p className="text-gray-800 text-sm bg-white p-3 rounded border">
              {expanded 
                ? content.originalContent 
                : content.originalContent.length > 100 
                  ? `${content.originalContent.slice(0, 100)}...` 
                  : content.originalContent
              }
            </p>
            {content.originalContent.length > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-blue-600 text-sm hover:text-blue-800 mt-1"
                data-testid="show-more-btn"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">No original content</p>
        )}
      </div>

      {/* AI Generations */}
      {content.aiGenerations && content.aiGenerations.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">AI Generations:</p>
            <p className="text-xs text-gray-500">
              {content.aiGenerations.length} AI generations
            </p>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {content.aiGenerations.map((generation, index) => (
              <div key={generation.id} className="text-sm bg-blue-50 p-3 rounded border">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-blue-800">
                    AI Generated {generation.modelVersion}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(generation.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-800">{generation.generatedText}</p>
                {generation.promptUsed && (
                  <p className="text-xs text-gray-600 mt-1 italic">
                    Prompt: {generation.promptUsed}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Translations */}
      {content.translations && content.translations.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Translations:</p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <label htmlFor={`quality-${content.id}`}>Min quality:</label>
              <select
                id={`quality-${content.id}`}
                className="border rounded px-1 py-0.5"
                value={minQuality === null ? '' : String(minQuality)}
                onChange={(e) => {
                  const v = e.target.value;
                  setMinQuality(v === '' ? null : Number(v));
                }}
              >
                <option value="">All</option>
                <option value="0.8">≥ 0.80</option>
                <option value="0.9">≥ 0.90</option>
              </select>
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {content.translations
              .filter(t => minQuality === null || (typeof t.qualityScore === 'number' && t.qualityScore >= minQuality))
              .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
              .map((translation) => (
              <div key={translation.id} className="text-sm bg-green-50 p-3 rounded border">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-green-800 uppercase">
                    {translation.targetLanguage}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(translation.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-800">{translation.translatedText}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-600">
                    AI Translated
                  </span>
                  <span className="text-xs text-green-600">
                    {translation.status}
                    {typeof translation.qualityScore === 'number' && (
                      <span className="ml-2 text-gray-500">Score: {translation.qualityScore.toFixed(2)}</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/15 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        
        {/* Review Actions */}
        {content.status === 'ai_generated' && (
          <Button
            onClick={handleSubmitForReview}
            disabled={loading}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Submit for Review
          </Button>
        )}

        {content.status === 'under_review' && (
          <Button
            onClick={() => setIsReviewModalOpen(true)}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
          >
            <ClipboardIcon className="w-4 h-4 mr-1" />
            Review Content
          </Button>
        )}

        {/* Translate button - available for any content with original text */}
        {content.originalContent && (
          <Button
            onClick={() => setIsTranslateModalOpen(true)}
            disabled={loading}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            data-testid="translate-btn"
          >
            <Languages className="w-4 h-4 mr-1" />
            Translate
          </Button>
        )}

        {/* Delete button for non-approved content */}
        {content.status !== 'approved' && (
          <Button
            onClick={handleDelete}
            disabled={loading}
            size="sm"
            variant="destructive"
            data-testid="delete-content-button"
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            Delete
          </Button>
        )}





      </div>



      {/* Review Modal */}
      <ReviewModal
        contentPiece={content}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={onUpdate}
      />

      {/* Translate Modal */}
      <TranslateModal
        content={content}
        campaign={campaign}
        isOpen={isTranslateModalOpen}
        onClose={() => setIsTranslateModalOpen(false)}
        onSuccess={onUpdate}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, content: null })}
        onConfirm={confirmDeleteContent}
        title="Delete Content Piece"
        description="This will permanently delete this content piece and all its AI generations and translations. This action cannot be undone."
        itemName={`${displayType} content`}
      />



    </div>
  );
}
