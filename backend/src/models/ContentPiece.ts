import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Campaign } from './Campaign';
import { AIGeneration } from './AIGeneration';
import { Review } from './Review';
import { Translation } from './Translation';

@Table({
  tableName: 'content_pieces',
  timestamps: true,
})
export class ContentPiece extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => Campaign)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'campaign_id',
  })
  campaignId!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  type!: string;

  @Column({
    type: DataType.TEXT,
    field: 'original_content',
  })
  originalContent?: string;

  @Column({
    type: DataType.STRING,
    defaultValue: 'en',
  })
  language!: string;

  @Column({
    type: DataType.STRING,
    defaultValue: 'draft',
  })
  status!: string;

  @CreatedAt
  @Column({
    field: 'created_at',
  })
  createdAt!: Date;

  @UpdatedAt
  @Column({
    field: 'updated_at',
  })
  updatedAt!: Date;

  @BelongsTo(() => Campaign)
  campaign?: Campaign;

  @HasMany(() => AIGeneration)
  aiGenerations?: AIGeneration[];

  @HasMany(() => Review)
  reviews?: Review[];

  @HasMany(() => Translation)
  translations?: Translation[];
}
