import { findForeignFixedLock, fixedLockMessageKey, isFixedLockRejection } from '@/utils/fixedRefLock'

/**
 * El lock del modal «Review finding groups» (Paso 2). El servidor lo exige en las rutas
 * genéricas de `isoqf_list_categories`.
 */
export const CATEGORIES_LOCK_KEY = 'list_categories'

export function findCategoriesLock (locks, myUserId) {
  return findForeignFixedLock(locks, CATEGORIES_LOCK_KEY, myUserId)
}

export function categoriesLockMessageKey (status, lockedBy) {
  return fixedLockMessageKey('categories', status, lockedBy)
}

export const isCategoriesLockRejection = isFixedLockRejection
