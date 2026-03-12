<template>
    <div>
        <div class="d-flex justify-content-end mb-3">
            <b-button
                size="sm"
                variant="outline-info"
                @click="showComments = !showComments">
                <template v-if="showComments">
                    {{ $t('worksheet.actions.hide_concerns') }}
                </template>
                <template v-else>
                    {{ $t('worksheet.actions.show_concerns') }}
                </template>
            </b-button>
        </div>
        <table class="table table-bordered table-striped table-responsive">
            <!-- Primera fila de cabecera -->
            <thead>
                <tr>
                    <th rowspan="2">{{ $t('camelot.step_three.authors_label') }}</th>
                    <th 
                        v-for="header in unifiedHeaders" 
                        :key="header.key" 
                        :rowspan="header.type === 'custom' ? 2 : 1"
                        :colspan="header.colspan">
                        {{ header.label }}
                    </th>
                </tr>
                <!-- Segunda fila de cabecera - solo para opciones CAMELOT -->
                <tr v-if="subHeaders.length > 0">
                    <th v-for="subHeader in subHeaders" :key="subHeader.key">{{ subHeader.label }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in charsOfStudies.items" :key="item.ref_id">
                    <!-- Authors, Year -->
                    <td>{{ formatAuthorsYear(item) }}</td>

                    <!-- Unified Cells -->
                    <td v-for="(cell, cellIndex) in dataCells(item)" :key="cellIndex">{{ cell.value }}</td>
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
    data() {
        return {
            showComments: false
        }
    },
    computed: {
        unifiedHeaders() {
            const headers = []
            if (!this.charsOfStudies.fields) return headers

            for (const field of this.charsOfStudies.fields) {
                if (['authors', 'ref_id', 'actions', 'edit'].includes(field.key)) continue
                if (field.key.endsWith('_comments')) continue

                const isCamelot = field.key.endsWith('_extractedData')
                
                if (isCamelot) {
                    let categoryLabel = field.label
                    let options = []
                    
                    if (this.camelot && this.camelot.categories) {
                        const categoryMatch = this.camelot.categories.find(c => c.options && c.options.some(o => o.key === field.key))
                        if (categoryMatch) {
                            categoryLabel = categoryMatch.label
                            options = categoryMatch.options
                        }
                    }

                    if (options.length === 0) {
                        options = [
                            { key: field.key, label: field.label },
                            { key: field.key.replace('_extractedData', '_comments'), label: this.$t('camelot.step_three.concerns_label') || 'Comments' }
                        ]
                    }

                    headers.push({
                        type: 'camelot',
                        key: field.key,
                        label: categoryLabel,
                        options: options,
                        colspan: this.showComments ? 2 : 1
                    })
                } else {
                    headers.push({
                        type: 'custom',
                        key: field.key,
                        label: field.label,
                        colspan: 1
                    })
                }
            }
            return headers
        },
        subHeaders() {
            const subH = []
            for (const header of this.unifiedHeaders) {
                if (header.type === 'camelot') {
                    for (const option of header.options) {
                        if (!this.showComments && option.key.endsWith('_comments')) continue
                        subH.push(option)
                    }
                }
            }
            return subH
        }
    },
    methods: {
        formatAuthorsYear(item) {
            const authors = item.authors || ''
            const year = item.year || ''
            return `${authors} ${year}`.trim()
        },
        dataCells(item) {
            const cells = []
            for (const header of this.unifiedHeaders) {
                if (header.type === 'camelot') {
                    for (const option of header.options) {
                        if (!this.showComments && option.key.endsWith('_comments')) continue
                        cells.push({ key: option.key, value: item[option.key] || '' })
                    }
                } else {
                    cells.push({ key: header.key, value: item[header.key] || '' })
                }
            }
            return cells
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