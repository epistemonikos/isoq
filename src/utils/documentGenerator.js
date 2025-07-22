export class DocumentGenerator {
    constructor() {
        this.chunks = []
        this.maxChunkSize = 100 // items por chunk
        this.progressCallback = null
    }

    setProgressCallback(callback) {
        this.progressCallback = callback
    }

    async generateDocumentInChunks(data, generator, totalSteps = 1) {
        this.chunks = []
        const chunks = this.chunkArray(data, this.maxChunkSize)

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]

            // Actualizar progreso
            if (this.progressCallback) {
                const progress = Math.round(((i + 1) / chunks.length) * 100)
                this.progressCallback(progress, `Procesando chunk ${i + 1} de ${chunks.length}`)
            }

            const elements = await generator(chunk, i)
            this.chunks.push(...elements)

            // Permitir que el navegador respire
            await this.yieldToBrowser()
        }

        return this.chunks
    }

    chunkArray(array, size) {
        const chunks = []
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size))
        }
        return chunks
    }

    yieldToBrowser() {
        return new Promise(resolve => setTimeout(resolve, 0))
    }

    // Método para generar tablas grandes de manera eficiente
    async generateLargeTable(data, headers, rowGenerator, options = {}) {
        const {
            chunkSize = 50,
            progressCallback = null
        } = options

        const chunks = this.chunkArray(data, chunkSize)
        const tableRows = []

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]

            if (progressCallback) {
                const progress = Math.round(((i + 1) / chunks.length) * 100)
                progressCallback(progress, `Generando filas ${i * chunkSize + 1} - ${Math.min((i + 1) * chunkSize, data.length)}`)
            }

            const rows = chunk.map(item => rowGenerator(item))
            tableRows.push(...rows)

            await this.yieldToBrowser()
        }

        return tableRows
    }

    // Método para optimizar la memoria durante la generación
    optimizeMemoryUsage() {
        // Forzar garbage collection si está disponible
        if (window.gc) {
            window.gc()
        }

        // Limpiar referencias innecesarias
        this.chunks = this.chunks.filter(chunk => chunk !== null)
    }

    // Método para generar documentos con streaming
    async generateDocumentWithStreaming(sections, options = {}) {
        const {
            onSectionComplete = null,
            onProgress = null
        } = options

        const documentSections = []

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i]

            if (onProgress) {
                const progress = Math.round(((i + 1) / sections.length) * 100)
                onProgress(progress, `Generando sección ${i + 1} de ${sections.length}`)
            }

            const sectionContent = await section.generator()
            documentSections.push(sectionContent)

            if (onSectionComplete) {
                onSectionComplete(i, section.name)
            }

            await this.yieldToBrowser()
        }

        return documentSections
    }

    // Método para validar datos antes de la generación
    validateData(data, requiredFields = []) {
        const errors = []

        if (!data) {
            errors.push('No se proporcionaron datos')
            return errors
        }

        requiredFields.forEach(field => {
            if (!data.hasOwnProperty(field)) {
                errors.push(`Campo requerido faltante: ${field}`)
            }
        })

        return errors
    }

    // Método para estimar el tamaño del documento
    estimateDocumentSize(data, averageRowSize = 1024) {
        if (!data || !Array.isArray(data)) {
            return 0
        }

        const estimatedSize = data.length * averageRowSize
        return {
            sizeInBytes: estimatedSize,
            sizeInKB: Math.round(estimatedSize / 1024),
            sizeInMB: Math.round((estimatedSize / 1024 / 1024) * 100) / 100
        }
    }

    // Método para cancelar la generación
    cancelGeneration() {
        this.chunks = []
        this.progressCallback = null
    }
}

// Clase auxiliar para manejar la generación de tablas específicas
export class TableGenerator extends DocumentGenerator {
    constructor() {
        super()
        this.maxChunkSize = 25 // Chunks más pequeños para tablas
    }

    async generateTableWithHeaders(headers, data, rowGenerator, options = {}) {
        const {
            showProgress = true,
            chunkSize = 25
        } = options

        const tableRows = []

        // Agregar fila de encabezados
        tableRows.push(this.createHeaderRow(headers))

        // Generar filas de datos en chunks
        const dataRows = await this.generateLargeTable(
            data,
            headers,
            rowGenerator,
            {
                chunkSize,
                progressCallback: showProgress ? this.progressCallback : null
            }
        )

        tableRows.push(...dataRows)

        return tableRows
    }

    createHeaderRow(headers) {
        // Implementación específica para crear fila de encabezados
        // Esto se implementaría según la librería de documentos que se use
        return headers
    }

    // Método para generar tablas con formato específico
    async generateFormattedTable(data, formatConfig, options = {}) {
        const {
            includeHeaders = true,
            customStyling = {}
        } = options

        const formattedRows = []

        if (includeHeaders && formatConfig.headers) {
            formattedRows.push(this.formatHeaderRow(formatConfig.headers, customStyling))
        }

        const dataRows = await this.generateLargeTable(
            data,
            formatConfig.headers || [],
            (item) => this.formatDataRow(item, formatConfig, customStyling),
            { chunkSize: 20 }
        )

        formattedRows.push(...dataRows)

        return formattedRows
    }

    formatHeaderRow(headers, styling = {}) {
        // Implementación para formatear encabezados
        return headers.map(header => ({
            ...header,
            ...styling.header
        }))
    }

    formatDataRow(item, formatConfig, styling = {}) {
        // Implementación para formatear filas de datos
        return formatConfig.columns.map(column => ({
            text: item[column.key] || '',
            ...styling.cell
        }))
    }
}