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
  tableName: 'ai_generations',
  timestamps: true,
  updatedAt: false,
})
export class AIGeneration extends Model {
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
    field: 'ai_model',
  })
  aiModel!: string;

  @Column({
    type: DataType.STRING,
    field: 'model_version',
  })
  modelVersion?: string;

  @Column({
    type: DataType.TEXT,
    field: 'prompt_used',
  })
  promptUsed?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'generated_text',
  })
  generatedText!: string;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  metadata?: object;

  @CreatedAt
  @Column({
    field: 'created_at',
  })
  createdAt!: Date;

  @BelongsTo(() => ContentPiece)
  contentPiece?: ContentPiece;
}