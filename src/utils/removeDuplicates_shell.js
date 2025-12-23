/**
 * Script para eliminar items duplicados dentro de documentos de MongoDB
 * Compatible con MongoDB Shell 2.6.10
 *
 * Este script busca documentos con un list_id específico y elimina items duplicados
 * dentro del array 'items' de cada documento, basándose en el campo ref_id.
 *
 * Uso:
 *   mongo <nombre_base_datos> removeDuplicates_shell.js
 *   
 * Ejemplo:
 *   mongo isoq removeDuplicates_shell.js
 *
 * IMPORTANTE: Edita las variables de configuración antes de ejecutar
 */

// ============================================================================
// CONFIGURACIÓN - EDITA ESTOS VALORES ANTES DE EJECUTAR
// ============================================================================

var LIST_ID_BUSCADO = "6882bc71867e60b483a95390";
var COLLECTION_NAME = "isoqf_extracted_data";

// ============================================================================
// SCRIPT PRINCIPAL
// ============================================================================

print("=== Iniciando script de eliminación de duplicados ===");
print("Base de datos: " + db.getName());
print("Colección: " + COLLECTION_NAME);
print("list_id buscado: " + LIST_ID_BUSCADO);
print("");

// Obtener la colección
var collection = db.getCollection(COLLECTION_NAME);

// 1. Encontrar todos los documentos que coincidan con el list_id
print("Buscando documentos con list_id: " + LIST_ID_BUSCADO);
var documents = collection.find({
    list_id: LIST_ID_BUSCADO
});

var documentsProcessed = 0;
var documentsUpdated = 0;
var totalDuplicatesRemoved = 0;

// Iterar sobre cada documento encontrado
documents.forEach(function(doc) {
    documentsProcessed++;
    
    // Verificar que el documento tenga items
    if (!doc.items || !Array.isArray(doc.items)) {
        print("Documento con _id: " + doc._id + " no tiene items o items no es un array.");
        return; // continue en forEach
    }
    
    // Objeto para rastrear los ref_id ya vistos
    var seenRefIds = {};
    // Nuevo array que contendrá solo los ítems únicos
    var uniqueItems = [];
    
    // 2. Iterar sobre el array 'items' del documento
    for (var i = 0; i < doc.items.length; i++) {
        var item = doc.items[i];
        var refId = item.ref_id;
        
        // Verificar si el ref_id ya ha sido visto
        if (!seenRefIds[refId]) {
            // Si es la primera vez que vemos este ref_id, lo agregamos a la lista de únicos
            uniqueItems.push(item);
            // Marcamos el ref_id como visto
            seenRefIds[refId] = true;
        }
    }
    
    // 3. Verificar si hubo cambios (si el número de ítems únicos es menor al original)
    if (uniqueItems.length < doc.items.length) {
        var duplicatesRemoved = doc.items.length - uniqueItems.length;
        totalDuplicatesRemoved += duplicatesRemoved;
        
        // 4. Actualizar el documento reemplazando el array 'items' por la versión limpia
        var result = collection.update(
            { _id: doc._id },
            { $set: { items: uniqueItems } }
        );
        
        if (result.nModified > 0) {
            documentsUpdated++;
            print("Documento con _id: " + doc._id + " actualizado. Se eliminaron " + duplicatesRemoved + " duplicados.");
        } else {
            print("Documento con _id: " + doc._id + " no pudo ser actualizado.");
        }
    } else {
        print("Documento con _id: " + doc._id + " no tenía duplicados de ref_id.");
    }
});

// Resumen final
print("");
print("=== Resumen ===");
print("Documentos procesados: " + documentsProcessed);
print("Documentos actualizados: " + documentsUpdated);
print("Total de items duplicados eliminados: " + totalDuplicatesRemoved);
print("");
print("Script completado exitosamente");
