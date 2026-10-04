import type { SmsMatcher } from '../types';
import { federalBankUpiMatcher } from './federal-bank-upi';

export { federalBankUpiMatcher } from './federal-bank-upi';
export { checkIgnoreFilter } from './ignore-filter';

/**
 * Registry of bank-specific SMS matchers.
 * Evaluated sequentially in order of registration.
 */
export const matcherRegistry: SmsMatcher[] = [federalBankUpiMatcher];
