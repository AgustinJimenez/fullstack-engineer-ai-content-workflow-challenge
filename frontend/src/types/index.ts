export interface Campaign {
  id: number
  name: string
  description: string
  status: string
  defaultLanguage?: string
  targetLanguages?: string[]
  createdAt: string
  updatedAt: string
  contentPieces?: ContentPiece[]
}

export interface ContentPiece {
  id: number
  campaignId: number
  type: string
  originalContent: string
  language: string
  status: 'draft' | 'ai_generated' | 'under_review' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  campaign?: Campaign
  aiGenerations?: AIGeneration[]
  reviews?: Review[]
  translations?: Translation[]
}

export interface ContentStatusRollup {
  contentPieceId: number
  statusByLanguage: Record<string, string>
  counts: { total: number; approved: number; rejected: number; pending: number; needs_revision: number }
  overallStatus: string
}

export interface AIGeneration {
  id: number
  contentPieceId: number
  aiModel: string
  modelVersion: string
  promptUsed: string
  generatedText: string
  metadata: string
  createdAt: string
  contentPiece?: ContentPiece
}

export interface Review {
  id: number
  contentPieceId: number
  reviewerName: string
  status: 'approved' | 'rejected' | 'needs_revision'
  feedback: string
  reviewedAt: string
  contentPiece?: ContentPiece
}

export interface Translation {
  id: number
  contentPieceId: number
  targetLanguage: string
  translatedText: string
  aiModel: string
  status: string
  qualityScore?: number
  createdAt: string
  contentPiece?: ContentPiece
}
