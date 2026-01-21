import { PrimaryKey } from '@mikro-orm/core';

export abstract class BaseEntity {
    @PrimaryKey({ autoincrement: true, type: Number })
    id!: number;
}