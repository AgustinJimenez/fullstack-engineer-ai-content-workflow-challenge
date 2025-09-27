import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { ContentPiece } from './ContentPiece';

@Table({
  tableName: 'translations',
  timestamps: true,
  updatedAt: false,
})
export class Translation extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => ContentPiece)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'content_piece_id',
  })
  contentPieceId!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'target_language',
  })
  targetLanguage!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'translated_text',
  })
  translatedText!: string;

  @Column({
    type: DataType.STRING,
    field: 'ai_model',
  })
  aiModel?: string;

  @Column({
    type: DataType.STRING,
    defaultValue: 'draft',
  })
  status!: string;

  @Column({
    type: DataType.FLOAT,
    field: 'quality_score',
    allowNull: true,
  })
  qualityScore?: number;

  @CreatedAt
  @Column({
    field: 'created_at',
  })
  createdAt!: Date;

  @BelongsTo(() => ContentPiece)
  contentPiece?: ContentPiece;
}
