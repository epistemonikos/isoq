#!/usr/bin/env node

/**
 * Script para eliminar items duplicados dentro de documentos de MongoDB
 *
 * Este script busca documentos con un list_id específico y elimina items duplicados
 * dentro del array 'items' de cada documento, basándose en el campo ref_id.
 *
 * Uso:
 *   node src/utils/removeDuplicates.js
 *
 * Variables de entorno requeridas:
 *   MONGODB_URL - URL de conexión a MongoDB (ej: mongodb://localhost:27017)
 *   MONGODB_DB_NAME - Nombre de la base de datos
 *   COLLECTION_NAME - Nombre de la colección (opcional, por defecto usa 'isoqf_extracted_data')
 */

const { MongoClient, ObjectId } = require('mongodb');

// Configuración
const LIST_ID_BUSCADO = "6882bc71867e60b483a95390";
const collectionName = process.env.COLLECTION_NAME || "isoqf_extracted_data";

// Variables de entorno para la conexión
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'isoq';

async function removeDuplicates() {
    let client;

    try {
        // Conectar a MongoDB (API compatible con mongodb 3.x)
        console.log(`Conectando a MongoDB: ${MONGODB_URL}`);
        client = await MongoClient.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Conexión establecida correctamente');

        const db = client.db(MONGODB_DB_NAME);
        const collection = db.collection(collectionName);

        // 1. Encontrar todos los documentos que coincidan con el list_id
        console.log('Buscando documentos con list_id:', LIST_ID_BUSCADO);
        const documents = await collection.find({
            list_id: LIST_ID_BUSCADO
        }).toArray();

        let documentsProcessed = 0;
        let documentsUpdated = 0;
        let totalDuplicatesRemoved = 0;

        // Iterar sobre cada documento encontrado
        for (const doc of documents) {
            documentsProcessed++;

            // Verificar que el documento tenga items
            if (!doc.items || !Array.isArray(doc.items)) {
                console.log(`Documento con _id: ${doc._id} no tiene items o items no es un array.`);
                continue;
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
                const duplicatesRemoved = doc.items.length - uniqueItems.length;
                totalDuplicatesRemoved += duplicatesRemoved;

                // 4. Actualizar el documento reemplazando el array 'items' por la versión limpia
                const result = await collection.updateOne(
                    { _id: doc._id },
                    { $set: { items: uniqueItems } }
                );

                if (result.modifiedCount > 0) {
                    documentsUpdated++;
                    console.log(`Documento con _id: ${doc._id} actualizado. Se eliminaron ${duplicatesRemoved} duplicados.`);
                } else {
                    console.log(`Documento con _id: ${doc._id} no pudo ser actualizado.`);
                }
            } else {
                console.log(`Documento con _id: ${doc._id} no tenía duplicados de ref_id.`);
            }
        }

        // Resumen final
        console.log('\n=== Resumen ===');
        console.log(`Documentos procesados: ${documentsProcessed}`);
        console.log(`Documentos actualizados: ${documentsUpdated}`);
        console.log(`Total de items duplicados eliminados: ${totalDuplicatesRemoved}`);
    } catch (error) {
        console.error('Error al ejecutar el script:', error);
        process.exit(1);
    } finally {
        // Cerrar la conexión
        if (client) {
            await client.close();
            console.log('Conexión cerrada');
        }
    }
}

// Ejecutar el script
if (require.main === module) {
    removeDuplicates()
        .then(() => {
            console.log('Script completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { removeDuplicates };

// MONGODB_URL="mongodb://localhost:27017" MONGODB_DB_NAME="isoq" COLLECTION_NAME="isoqf_extracted_data" node src/utils/removeDuplicates.js
