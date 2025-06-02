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
      hover
      responsive>
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

    <!-- Modal para editar referencias -->
    <b-modal
      id="modal-edit-reference"
      title="Editar Referencia"
      size="xl"
      @ok="handleModalOk"
      @hide="resetModal">
      <template v-if="currentItem">
        <b-row>
          <!-- Menú flotante a la izquierda -->
          <b-col cols="3" class="menu-sidebar">
            <div class="sticky-menu p-2">
              <div class="menu-section mb-3" v-if="customFields.length > 0">
                <div
                  v-for="(field, index) in customFields"
                  :key="'menu-custom-' + index"
                  class="menu-item"
                  @click="scrollToSection('custom-field-' + index)">
                  {{ field.title || 'Sin título' }}
                </div>
              </div>

              <div class="menu-section">
                <div class="menu-section-title mb-1">CAMELOT fields</div>
                <div
                  v-for="(category, catIndex) in camelot.categories"
                  :key="'menu-category-' + catIndex"
                  class="menu-item"
                  @click="scrollToSection('category-' + catIndex)">
                  {{ category.label }}
                </div>
              </div>
            </div>
          </b-col>

          <!-- Contenido del formulario -->
          <b-col cols="9">
            <div id="authors-section" class="mb-3">
              <label for="authors">reference id</label>
              <b-form-input
                id="authors"
                v-model="editForm.id"
                placeholder="Autores separados por coma">
              </b-form-input>
            </div>

            <!-- Campos personalizados -->
            <div class="mb-4">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="mb-0">Customs fields</h5>
                <b-button
                  size="sm"
                  variant="success"
                  @click="addCustomField">
                  <i class="fas fa-plus"></i> Add new field
                </b-button>
              </div>
              <b-card v-if="customFields.length === 0" body-class="text-center py-3">
                <p class="mb-0 text-muted">No hay campos personalizados. Haz clic en "Agregar campo" para crear uno.</p>
              </b-card>
              <div v-else class="custom-fields-container">
                <p class="text-muted small mb-2">
                  <i class="fas fa-arrows-alt mr-1"></i>Usa el botón "Mover" para reorganizar los campos
                </p>
                <draggable
                  v-model="customFields"
                  :options="{handle:'.drag-handle'}"
                  ghost-class="ghost"
                  animation="300"
                  group="customFields"
                  drag-class="sortable-drag"
                  chosen-class="sortable-chosen"
                  @start="onDragStart"
                  @end="onDragEnd">
                  <div
                    v-for="(field, index) in customFields"
                    :key="'column_' + index"
                    class="mb-3">
                    <div :id="'column-field-' + index">
                      <b-card>
                        <div class="d-flex justify-content-between mb-2">
                          <div class="d-flex align-items-center">
                            <label :for="'column_' + index">Título</label>
                          </div>
                          <div>
                            <b-button
                              size="sm"
                              variant="outline-secondary"
                              class="drag-handle mr-1 py-0">
                              <i class="fas fa-grip-vertical"></i> Mover
                            </b-button>
                            <b-button
                              size="sm"
                              variant="danger"
                              @click="removeCustomField(index)"
                              class="py-0">
                              <i class="fas fa-trash"></i> Eliminar
                            </b-button>
                          </div>
                        </div>
                        <b-form-input
                          :id="'label_' + index"
                          v-model="field.title"
                          placeholder="Título del campo"
                          class="mb-2">
                        </b-form-input>
                        <label :for="'column_' + index">Contenido</label>
                        <b-form-textarea
                          :id="'column_' + index"
                          v-model="field.value"
                          placeholder="Contenido del campo"
                          rows="3">
                        </b-form-textarea>
                      </b-card>
                    </div>
                  </div>
                </draggable>
              </div>
            </div>

            <h5 class="mt-4">Camelot fields</h5>
            <b-row>
              <b-col v-for="(category, catIndex) in camelot.categories"
                :key="'category-' + catIndex"
                :id="'category-' + catIndex"
                cols="12"
                class="mb-3">
                <h6>{{ category.label }}</h6>
                <b-card no-body class="mb-3">
                  <b-card-body>
                    <b-row>
                      <b-col v-for="(option, optIndex) in category.options"
                        :key="'option-' + catIndex + '-' + optIndex"
                        cols="12"
                        md="6"
                        class="mb-3">
                        <label :for="option.key">{{ option.label }} ({{ option.key }})</label>
                        <b-form-textarea
                          :id="option.key"
                          v-model="editForm[option.key]"
                          :placeholder="option.label">
                        </b-form-textarea>
                      </b-col>
                    </b-row>
                  </b-card-body>
                </b-card>
              </b-col>
            </b-row>
          </b-col>
        </b-row>
      </template>
      <template v-else>
        <b-alert show variant="info">No se ha seleccionado ninguna referencia para editar</b-alert>
      </template>
    </b-modal>
  </div>
</template>

<script>
import { camelotMixin } from '@/mixins/camelotMixin'
import commons from '../../utils/commons'
import draggable from 'vuedraggable'

export default {
  name: 'StepThree',
  components: {
    draggable
  },
  mixins: [camelotMixin],
  props: {
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
      ],
      currentItem: null,
      editForm: {},
      customFields: [],
      drag: false
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
    },
    tableFieldsForEdit () {
      // Usamos los campos de la tabla sin la columna de acciones para editar
      return this.tableFields.filter(field => field.key !== 'actions')
    }
  },
  methods: {
    formatAuthors (authors) {
      return commons.getAuthorsFormat(authors)
    },
    editReference (item) {
      // Guardamos la referencia actual para editar
      this.currentItem = {...item}
      // Inicializamos el formulario de edición con los valores de la referencia
      this.editForm = {...item}
      // Si los autores son un array, los convertimos a string para el campo de texto
      // if (Array.isArray(this.editForm.authors)) {
      //   this.editForm.authors = this.editForm.authors.join(', ')
      // }

      // Inicializamos los campos personalizados si existen
      this.customFields = item.customFields ? [...item.customFields] : []
      // Abrimos el modal
      this.$bvModal.show('modal-edit-reference')
    },
    deleteReference (item) {
      console.log('Eliminando referencia:', item)
      this.$emit('delete-reference', item)
    },
    handleModalOk (bvModalEvent) {
      bvModalEvent.preventDefault()
      if (this.validateForm()) {
        // Procesar autores si es un string
        if (typeof this.editForm.authors === 'string') {
          this.editForm.authors = this.editForm.authors
            .split(',')
            .map(author => author.trim())
            .filter(author => author !== '')
        }

        // Procesamos los campos personalizados para fields (estructura con key y label)
        const customFieldsArray = this.processCustomFields()
        // Creamos el objeto item que contiene ref_id, authors y los campos personalizados
        const item = {
          ref_id: this.editForm.id || '',
          authors: this.editForm.authors || []
        }
        // Agregamos los campos personalizados al objeto item
        // El nombre de la columna es el valor de la key (column_X) y el valor es el contenido
        this.customFields.forEach((field, index) => {
          if (field.title.trim() !== '') {
            item[`column_${index}`] = field.value || ''
          }
        })

        // Agregamos los campos de CAMELOT al objeto item
        // El key corresponde al option.key y el value al valor del form-textarea
        if (this.camelot && Array.isArray(this.camelot.categories)) {
          this.camelot.categories.forEach(category => {
            if (category.options && Array.isArray(category.options)) {
              category.options.forEach(option => {
                // Solo agregamos si existe un valor en el formulario para ese campo
                if (this.editForm[option.key]) {
                  item[option.key] = this.editForm[option.key]
                }
              })
            }
          })
        }
        // Creamos el objeto updatedItem con la estructura requerida
        // const base = {authors: item.authors}
        const updatedItem = {
          ...this.editForm,
          // Agregamos los campos personalizados como un arreglo de objetos con key y label
          fields: customFieldsArray,
          // Agregamos el arreglo items que contiene los valores procesados
          items: [item]
        }
        console.log('Actualizando referencia:', updatedItem)
        this.$emit('update-reference', updatedItem)
        this.$nextTick(() => {
          this.$bvModal.hide('modal-edit-reference')
        })
      }
    },
    resetModal () {
      this.currentItem = null
      this.editForm = {}
      this.customFields = []
    },
    validateForm () {
      return true
    },
    addCustomField () {
      this.customFields.push({
        title: '',
        value: ''
      })
      // Esperamos al siguiente ciclo para asegurar que el DOM se haya actualizado
      this.$nextTick(() => {
        // Scrolleamos al último campo agregado
        const newIndex = this.customFields.length - 1
        this.scrollToSection('custom-field-' + newIndex)
        // Enfocamos el primer input del nuevo campo
        setTimeout(() => {
          const inputElement = document.getElementById('customField-title-' + newIndex)
          if (inputElement) {
            inputElement.focus()
          }
        }, 500) // Esperamos a que termine el scroll
      })
    },
    removeCustomField (index) {
      this.customFields.splice(index, 1)
    },
    scrollToSection (id) {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Si es un campo personalizado, añadimos una animación para destacarlo
        if (id.includes('custom-field-')) {
          // Añadir clase para la animación
          element.classList.add('highlight-new-field')
          // Remover clase después de la animación
          setTimeout(() => {
            element.classList.remove('highlight-new-field')
          }, 2000)
        }
      }
    },
    onDragStart (evt) {
      console.log('Drag started', evt)
      this.drag = true
      // Agregamos clase visual para destacar que está en modo arrastre
      document.body.classList.add('dragging-active')
    },
    onDragEnd (evt) {
      console.log('Drag ended', evt)
      console.log('New customFields order:', this.customFields)
      this.drag = false
      // Quitamos clase visual
      document.body.classList.remove('dragging-active')
      // Notificamos que hubo un cambio en los campos personalizados
      this.$emit('custom-fields-reordered', this.customFields)
    },
    /**
     * Procesa los campos personalizados y los convierte al formato requerido
     * También incluye los campos de CAMELOT del mixin
     * @returns {Array} Arreglo de objetos con key y label
     */
    processCustomFields () {
      // Obtenemos los campos personalizados
      const customFields = this.customFields
        .filter(field => field.title.trim() !== '')
        .map((field, index) => {
          // Generamos la clave usando el índice, cambiando 'label_X' por 'column_X'
          return {
            key: `column_${index}`,
            label: field.title
          }
        })

      // Agregamos los campos de CAMELOT que vienen del mixin
      const camelotFields = this.camelot && this.camelot.fields
        ? [...this.camelot.fields]
        : []

      // Combinamos todos los campos en un solo arreglo
      const base = [{key: 'ref_id', label: 'Reference ID'}, {key: 'authors', label: 'Author(s), Year'}]
      return [...base, ...customFields, ...camelotFields]
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

.sticky-menu {
  position: sticky;
  top: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.menu-title {
  font-weight: bold;
  color: #495057;
  padding-bottom: 5px;
  border-bottom: 1px solid #dee2e6;
}

.menu-section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #6c757d;
}

.menu-item {
  padding: 5px 10px;
  margin: 2px 0;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-item:hover {
  background-color: #e9ecef;
  color: #007bff;
}

.menu-sidebar {
  max-height: 100%;
}

.drag-handle {
  cursor: move;
  padding: 5px;
  border-radius: 3px;
}

.drag-handle:hover {
  background-color: #e9ecef;
  color: #007bff;
}

.ghost {
  opacity: 0.6;
  background: #c8ebfb;
  border: 2px dashed #2196F3;
}

.sortable-chosen {
  background-color: #f5f5f5;
  box-shadow: 0 0 8px rgba(0,0,0,0.1);
}

.sortable-drag {
  opacity: 0.8;
  background-color: #e6f7ff !important;
  box-shadow: 0 0 10px rgba(33, 150, 243, 0.3);
}

.dragging-active .custom-fields-container {
  background-color: rgba(0, 123, 255, 0.03);
  border-radius: 4px;
  padding: 8px;
  border: 1px dashed #b8daff;
}

@keyframes highlightBackground {
  0% { background-color: rgba(40, 167, 69, 0.2); }
  50% { background-color: rgba(40, 167, 69, 0.1); }
  100% { background-color: transparent; }
}

.highlight-new-field {
  animation: highlightBackground 2s ease-out;
}

.highlight-new-field .card {
  border-color: #28a745;
  box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
}
</style>
