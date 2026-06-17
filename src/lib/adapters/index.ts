import type { SourceAdapter } from '@/lib/types';
import { standardEbooksAdapter } from './standard-ebooks';
import { gutenbergAdapter } from './gutenberg';

export const adapters: SourceAdapter[] = [standardEbooksAdapter, gutenbergAdapter];
