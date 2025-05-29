<template>
  <div>
    <b-alert show variant="info" v-if="references.length === 0">
      No hay registros disponibles
    </b-alert>
    <b-table
      v-else
      :items="references"
      :fields="tableFields"
      striped
      hover>
      <template v-slot:cell(authors)="data">
        {{ formatAuthors(data.item.authors) }}
      </template>
      <template v-slot:cell(actions)="data">
        <b-button
          size="sm"
          variant="primary"
          class="mr-1"
          @click="editReference(data.item)">
          Editar
        </b-button>
        <b-button
          size="sm"
          variant="danger"
          @click="deleteReference(data.item)">
          Eliminar
        </b-button>
      </template>
      <template v-slot:thead-top>
        <tr>
          <th colspan="1">Referencias</th>
          <th v-for="category in camelot.categories"
            :key="category.key"
            :colspan="category.options.length"
            class="text-center">
            {{ category.label }}
          </th>
          <th colspan="1">Acciones</th>
        </tr>
      </template>
    </b-table>
  </div>
</template>

<script>
import { camelotMixin } from '@/mixins/camelotMixin'

export default {
  name: 'StepThree',
  mixins: [camelotMixin],
  props: {
    // Define any props if needed
    references: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      fields: [
        {
          key: 'authors',
          label: 'Autores'
        },
        {
          key: 'actions',
          label: 'Acciones'
        }
      ]
    }
  },
  computed: {
    tableFields () {
      let baseFields = this.fields
      const categoryFields = []
      // Creamos un nuevo array sin modificar el estado
      if (this.camelot && Array.isArray(this.camelot.categories)) {
        this.camelot.categories.forEach(category => {
          if (category.options && Array.isArray(category.options)) {
            category.options.forEach(option => {
              categoryFields.push({
                key: option.key,
                label: option.label
              })
            })
          }
        })
      }
      // a baseFields remueve el campo 'actions' para evitar duplicados
      const baseFieldsWithoutActions = baseFields.filter(field => field.key !== 'actions')
      console.log('baseFieldsWithoutActions:', baseFieldsWithoutActions)
      baseFields = baseFieldsWithoutActions
      categoryFields.push({
        key: 'actions',
        label: 'Acciones'
      })
      console.log('tableFields:', [...baseFields, ...categoryFields])
      // Retornamos la combinación de campos base y campos de categorías
      return [...baseFields, ...categoryFields]
    }
  },
  methods: {
    formatAuthors (authors) {
      if (!authors || !Array.isArray(authors)) {
        return '(Sin autores)'
      }
      return authors.join(', ')
    },
    editReference (item) {
      // Aquí implementa la lógica para editar una referencia
      console.log('Editando referencia:', item)
      this.$emit('edit-reference', item)
    },
    deleteReference (item) {
      // Aquí implementa la lógica para eliminar una referencia
      console.log('Eliminando referencia:', item)
      this.$emit('delete-reference', item)
    }
  },
  mounted () {
    console.log('StepThree mounted')
  }
}
</script>

<style scoped>
.table th {
  vertical-align: middle;
  background-color: #f8f9fa;
}
</style>
