import createFixedRefLockMixin from '@/mixins/fixedRefLockMixin'
import { FINDINGS_ORDER_LOCK_KEY } from '@/utils/findingsOrderLock'

/** Lock del modal «Re-order your review findings». Ver fixedRefLockMixin para el contrato. */
export default createFixedRefLockMixin({ name: 'FindingsOrder', key: FINDINGS_ORDER_LOCK_KEY })
