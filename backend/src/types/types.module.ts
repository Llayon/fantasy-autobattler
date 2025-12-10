import { Module } from '@nestjs/common';

/**
 * Types module for centralized type definitions.
 * This module doesn't provide services but ensures types are available
 * throughout the application.
 */
@Module({})
export class TypesModule {}