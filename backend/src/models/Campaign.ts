import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  HasMany,
} from 'sequelize-typescript';
import { ContentPiece } from './ContentPiece';

@Table({
  tableName: 'campaigns',
  timestamps: true,
})
export class Campaign extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.STRING,
    defaultValue: 'active',
  })
  status!: string;

  @Column({
    type: DataType.STRING,
    field: 'default_language',
    defaultValue: 'en',
  })
  defaultLanguage!: string;

  @Column({
    type: DataType.JSONB,
    field: 'target_languages',
    defaultValue: [],
  })
  targetLanguages?: string[];

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

  @HasMany(() => ContentPiece, { onDelete: 'CASCADE' })
  contentPieces?: ContentPiece[];
}
