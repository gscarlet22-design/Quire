import type { SourceAdapter } from '@/lib/types';
import { standardEbooksAdapter } from './standard-ebooks';
import { gutendexAdapter } from './gutendex';

export const adapters: SourceAdapter[] = [standardEbooksAdapter, gutendexAdapter];
