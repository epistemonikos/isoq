<template>
    <div>
        <table class="table table-bordered table-striped table-responsive">
            <!-- Primera fila de cabecera -->
            <thead>
                <tr>
                    <th rowspan="2">Author(s), Year</th>
                    <!-- Campos personalizados -->
                    <th v-for="customField in sortedCustomFields" :key="customField" rowspan="2">{{ customFieldLabels[customField] || customField }}</th>
                    <!-- Categorías CAMELOT -->
                    <th v-for="category in camelot.categories" :key="category.key" :colspan="2">{{ category.label }}</th>
                </tr>
                <!-- Segunda fila de cabecera - solo para opciones CAMELOT -->
                <tr>
                    <th v-for="option in allCamelotOptions" :key="option.key">{{ option.label }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in charsOfStudies.items" :key="item.ref_id">
                    <!-- Authors, Year -->
                    <td>{{ formatAuthorsYear(item) }}</td>

                    <!-- Campos personalizados -->
                    <td v-for="customField in sortedCustomFields" :key="customField">{{ item[customField] || '' }}</td>

                    <!-- Valores CAMELOT -->
                    <td v-for="option in allCamelotOptions" :key="option.key">{{ item[option.key] || '' }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import { camelotMixin } from '@/mixins/camelotMixin'

export default {
    name: 'CharacteristicsTable',
    mixins: [camelotMixin],
    props: {
        charsOfStudies: {
            type: Object,
            required: true
        }
    },
    computed: {
        sortedCustomFields() {
            if (!this.charsOfStudies.items || this.charsOfStudies.items.length === 0) {
                return []
            }

            // Obtener todas las claves que empiezan con "column_"
            const customFields = Object.keys(this.charsOfStudies.items[0]).filter(key =>
                key.startsWith('column_')
            )

            // Ordenar numéricamente
            return customFields.sort((a, b) => {
                const numA = parseInt(a.replace('column_', ''))
                const numB = parseInt(b.replace('column_', ''))
                return numA - numB
            })
        },
        allCamelotOptions() {
            // Aplanar todas las opciones de todas las categorías
            return this.camelot.categories.flatMap(category => category.options)
        },
        customFieldLabels() {
            if (!this.charsOfStudies.fields || this.charsOfStudies.fields.length === 0) {
                return {}
            }
            
            // Create a map of key -> label
            const labelMap = {}
            this.charsOfStudies.fields.forEach(field => {
                labelMap[field.key] = field.label
            })
            return labelMap
        }
    },
    methods: {
        formatAuthorsYear(item) {
            const authors = item.authors || ''
            const year = item.year || ''
            return `${authors} ${year}`.trim()
        }
    }
}
</script>

<style scoped>
.table {
    width: 100%;
    margin-bottom: 1rem;
    background-color: transparent;
}

.table th,
.table td {
    padding: 0.75rem;
    vertical-align: top;
    border-top: 1px solid #dee2e6;
}

.table thead th {
    vertical-align: bottom;
    border-bottom: 2px solid #dee2e6;
    background-color: #f8f9fa;
    font-weight: bold;
}

.table-bordered {
    border: 1px solid #dee2e6;
}

.table-bordered th,
.table-bordered td {
    border: 1px solid #dee2e6;
}

.table-striped tbody tr:nth-of-type(odd) {
    background-color: rgba(0, 0, 0, 0.05);
}
</style>