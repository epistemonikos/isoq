/**
 * Los `catch` que callan A PROPÓSITO. Cada entrada dice por qué: una lista sin motivos se
 * vuelve el lugar donde se esconde el próximo silencio.
 *
 * Para agregar una entrada, la pregunta es: ¿la persona puede hacer algo distinto si se
 * entera? Si sí, no va acá — hay que avisar (`writeErrorMessageKey`, `LoadErrorAlert`, un
 * `b-alert` de la pantalla). Si el fallo lo corrige otro mecanismo (un TTL, un reintento
 * automático, un valor por defecto que es igual de correcto), va acá con ese mecanismo.
 */
const TTL = 'Soltar un lock o una marca de presencia: si falla, el TTL del servidor lo limpia. Avisar asustaría por algo que se arregla solo.'
const CACHE = 'Escritura a la caché local (IndexedDB) de mejor esfuerzo: si falla, la próxima lectura con red trae el dato del servidor.'
const PARSE = 'Parseo de un dato local o de una respuesta no-JSON (un 502 de nginx, `fullreferences` guardado como texto): cae a un valor por defecto que se muestra igual.'
const NAV = '`router.push(...).catch(() => {})`: la navegación duplicada o redirigida no es un error para la persona.'
const BACKGROUND = 'Refresco o sincronización en segundo plano sin nadie esperando el resultado: el siguiente ciclo lo reintenta, y lo que lo disparó ya se avisó por su canal.'

module.exports = {
  'components/OfflineIndicator.vue::updatePendingCount': BACKGROUND,
  'components/OfflineIndicator.vue::syncNow': BACKGROUND + ' Los rechazos del replay se avisan en Api._syncPendingOperations (offline-replay-rejected).',
  'components/list/editList.vue::filterItemsByReferences': PARSE,
  'components/list/editList.vue::fetchAndUpdateRefLocks': BACKGROUND + ' Es el sondeo de locks cada pocos segundos.',
  'components/list/editList.vue::refreshPermissions': BACKGROUND + ' Lo dispara `permission-denied`, o sea un 403 que ya se avisó.',
  'components/organization/organizationForm.vue::executeSave': NAV,
  'components/organization/organizationForm.vue::executeSave#2': NAV,
  'components/previewContent/previewContentWorksheet.vue::bibliographicReferences': PARSE,
  'components/project/UploadReferences.vue::processPubMedRequest': 'Catch interno de un lote de PubMed, envuelto en Promise.allSettled: los rechazos reales ya los reporta el resultado del lote.',
  'components/project/crudTables.vue::releaseColumnsLock': TTL,
  'components/project/viewProject.vue::refreshPermissions': BACKGROUND + ' Lo dispara `permission-denied`, o sea un 403 que ya se avisó.',
  'components/project/viewProject.vue::clickTab': NAV,
  'main.js::(módulo)': 'El logout forzado por términos pendientes: si falla, se navega a Login igual (`.finally`), que es lo que la persona necesita.',
  'main.js::(módulo)#2': 'Registro del Service Worker: si falla, la app funciona igual, sólo sin caché offline.',
  'services/lockService.js::releaseRef': TTL,
  'services/personalDataExport.js::backendMessageFrom': PARSE,
  'services/presenceService.js::ping': TTL,
  'services/presenceService.js::leave': TTL,
  'store.js::getLogginInfo': PARSE + ' (el usuario guardado en localStorage).',
  'utils/Api.js::cacheResponse': CACHE,
  'utils/Api.js::tryOptimisticUpdate': CACHE,
  'utils/Api.js::tryOptimisticUpdate#2': CACHE,
  'utils/Api.js::tryOptimisticUpdate#3': CACHE,
  'utils/Api.js::refreshCachedProject': CACHE + ' Es el refresco tras descartar un PATCH de proyecto de la cola: si falla, la próxima lectura con red corrige la caché igual.',
  'utils/Api.js::_syncPendingOperations': BACKGROUND + ' Falla al leer la cola misma; las operaciones siguen ahí para la próxima corrida.',
  'utils/editorPresence.js::announcePresence': TTL + ' (la presencia entre pestañas caduca por STALE).',
  'utils/editorPresence.js::clearPresence': TTL + ' (la presencia entre pestañas caduca por STALE).'
}
