import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { ContentPiece } from './ContentPiece';

@Table({
  tableName: 'reviews',
  timestamps: false,
})
export class Review extends Model {
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
    field: 'reviewer_name',
  })
  reviewerName?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  status!: string;

  @Column({
    type: DataType.TEXT,
  })
  feedback?: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    field: 'reviewed_at',
  })
  reviewedAt!: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  language?: string;

  @BelongsTo(() => ContentPiece)
  contentPiece?: ContentPiece;
}
