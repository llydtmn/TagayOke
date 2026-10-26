// Pages and hooks import `api` only. Swap backends here, nowhere else.
import { USE_MOCK } from '../config/env';
import * as mock from './mockAdapter';
import * as live from './supabaseAdapter';
export const api = USE_MOCK ? mock : live;
