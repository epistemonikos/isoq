import createFixedRefLockMixin, { FIXED_LOCK_WAIT_POLL_MS } from '@/mixins/fixedRefLockMixin'
import { CATEGORIES_LOCK_KEY } from '@/utils/categoriesLock'

export const CATEGORIES_WAIT_POLL_MS = FIXED_LOCK_WAIT_POLL_MS

/** Lock del modal «Review finding groups». Ver fixedRefLockMixin para el contrato. */
export default createFixedRefLockMixin({ name: 'Categories', key: CATEGORIES_LOCK_KEY })
