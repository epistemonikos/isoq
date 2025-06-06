<template>
  <div>
    <b-alert show variant="info" v-if="isLoading">
      Cargando datos...
    </b-alert>
    <b-alert show variant="info" v-else-if="references.length === 0 && (!charsData.items || charsData.items.length === 0)">
      No hay registros disponibles
    </b-alert>
    <b-table
      v-else
      :items="tableItems"
      :fields="tableFields"
      striped
      hover
      responsive>
      <template v-slot:cell(authors)="data">
        {{ data.item.authors }}
      </template>

      <!-- Plantilla genérica para todos los campos -->
      <template v-slot:cell()="data">
        <!-- Para los campos personalizados, mostramos su contenido -->
        <span v-if="isCustomField(data.field.key)">
          {{ data.item[data.field.key] || '' }}
        </span>
        <!-- Para campos normales, mostramos el valor predeterminado -->
        <span v-else>{{ data.value }}</span>
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
          <th v-if="getCustomFields().length > 0"
            :colspan="getCustomFields().length"
            class="text-center">
            &nbsp;
          </th>
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
import draggable from 'vuedraggable'
import axios from 'axios'
import { isCustomField, extractCustomFields, processCustomFields } from '@/utils/customFieldsHelper'

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
    },
    type: {
      type: String,
      default: 'isoqf_characteristics'
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
      drag: false,
      charsData: {
        fields: [],
        items: [],
        id: null,
        _id: null,
        organization: '',
        project_id: ''
      },
      isLoading: true
    }
  },
  computed: {
    tableItems () {
      // Si tenemos datos cargados desde la API, los usamos
      if (this.charsData && this.charsData.items && this.charsData.items.length > 0) {
        return this.charsData.items.map(item => {
          const matchingRef = this.references.find(ref => ref.id === item.ref_id)
          if (matchingRef) {
            return { ...matchingRef, ...item }
          }
          return item
        })
      }
      // Si no hay datos cargados, usamos las referencias como respaldo
      return this.references
    },
    tableFields () {
      // Campos base (autores)
      let baseFields = this.fields
      const categoryFields = []

      // Obtenemos los campos personalizados y les añadimos la propiedad customField=true
      const customFields = this.getCustomFields().map(field => ({
        ...field,
        customField: true
      }))

      // Añadimos los campos de categorías (CAMELOT)
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

      // Eliminamos el campo 'actions' de los campos base para evitar duplicados
      const baseFieldsWithoutActions = baseFields.filter(field => field.key !== 'actions')
      baseFields = baseFieldsWithoutActions

      // Agregamos el campo de acciones al final
      categoryFields.push({
        key: 'actions',
        label: 'Acciones'
      })

      // Retornamos la combinación de campos base, campos personalizados, y campos de categorías
      return [...baseFields, ...customFields, ...categoryFields]
    },
    tableFieldsForEdit () {
      // Usamos los campos de la tabla sin la columna de acciones para editar
      return this.tableFields.filter(field => field.key !== 'actions')
    }
  },
  methods: {
    editReference (item) {
      console.log('Editando referencia:', item)
      // Guardamos la referencia actual para editar
      this.currentItem = {...item}
      // Inicializamos el formulario de edición con los valores de la referencia
      this.editForm = {...item}

      // Inicializamos los campos personalizados con los valores del ítem
      this.initializeCustomFields(item)

      // Aseguramos que charsData tenga los datos necesarios
      if (!this.charsData || !this.charsData.fields) {
        this.loadCharacteristicsData()
      }

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
        // Procesamos los campos personalizados para fields (estructura con key y label)
        const customFieldsArray = this.processCustomFields()

        // Creamos el objeto item que contiene ref_id, authors y los campos personalizados
        const item = {
          ref_id: this.editForm.id || '',
          authors: this.editForm.authors || []
        }

        // Obtenemos los campos personalizados existentes
        const existingFields = this.charsData.fields || []
        const existingCustomFields = existingFields.filter(field => isCustomField(field.key))

        // Agregamos los campos personalizados al objeto item
        this.customFields.forEach((field, index) => {
          if (field.title && field.title.trim() !== '') {
            // Buscamos si el campo ya existe
            const existingField = existingCustomFields.find(ef => ef.label === field.title)
            if (existingField) {
              // Si existe, usamos su key original
              item[existingField.key] = field.value || ''
            } else {
              // Si es nuevo, calculamos la nueva key correlativa
              const lastIndex = existingCustomFields.length > 0
                ? Math.max(...existingCustomFields.map(ef => parseInt(ef.key.split('_')[1])))
                : -1
              item[`column_${lastIndex + 1 + index}`] = field.value || ''
            }
          }
        })

        // Agregamos los campos de CAMELOT al objeto item
        if (this.camelot && Array.isArray(this.camelot.categories)) {
          this.camelot.categories.forEach(category => {
            if (category.options && Array.isArray(category.options)) {
              category.options.forEach(option => {
                if (this.editForm[option.key]) {
                  item[option.key] = this.editForm[option.key]
                }
              })
            }
          })
        }

        console.log('Item a actualizar:', item)

        // Verificamos si existe un ID en charsData para determinar si es una actualización o inserción
        if (this.charsData && this.charsData.id) {
          // Para actualización: actualizar solo el item específico en los items existentes
          const updatedCharsData = { ...this.charsData }

          // Encontrar el índice del item que se está editando
          const itemIndex = updatedCharsData.items.findIndex(existingItem =>
            existingItem.ref_id === item.ref_id
          )

          if (itemIndex !== -1) {
            // Actualizar el item existente
            updatedCharsData.items[itemIndex] = { ...updatedCharsData.items[itemIndex], ...item }
          } else {
            // Si no existe, agregarlo
            updatedCharsData.items.push(item)
          }

          // Actualizar los fields si han cambiado
          updatedCharsData.fields = customFieldsArray

          console.log('Datos completos a enviar para actualización:', updatedCharsData)

          // Si existe ID, actualizamos
          axios.patch(`/api/isoqf_characteristics/${this.charsData.id}/`, updatedCharsData)
            .then(response => {
              console.log('Referencia actualizada:', response.data)
              // Actualizamos los datos locales
              this.charsData = response.data
              // Recargamos los datos de características para reflejar los cambios
              this.loadCharacteristicsData()
              // Forzamos la actualización de la tabla
              this.$forceUpdate()
            })
            .catch(error => {
              console.error('Error al actualizar la referencia:', error)
            })
        } else {
          // Si no existe ID, insertamos - construimos el objeto completo para la API
          const newCharacteristics = {
            organization: this.$route.params.org_id || '',
            project_id: this.$route.params.id || '',
            fields: customFieldsArray,
            items: [item]
          }

          console.log('Datos completos a enviar para inserción:', newCharacteristics)

          axios.post('/api/isoqf_characteristics/', newCharacteristics)
            .then(response => {
              console.log('Referencia creada:', response.data)
              // Actualizamos los datos locales
              this.charsData = response.data
              // Recargamos los datos de características para reflejar los cambios
              this.loadCharacteristicsData()
              // Forzamos la actualización de la tabla
              this.$forceUpdate()
            })
            .catch(error => {
              console.error('Error al crear la referencia:', error)
            })
        }

        this.$emit('update-reference', item)
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
        this.scrollToSection('column-field-' + newIndex)
        // Enfocamos el primer input del nuevo campo (el input del título)
        setTimeout(() => {
          const inputElement = document.getElementById('label_' + newIndex)
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
      // Obtenemos los campos personalizados existentes
      const existingFields = this.charsData.fields || []
      const existingCustomFields = existingFields.filter(field => isCustomField(field.key))

      // Procesamos los nuevos campos personalizados
      const newCustomFields = this.customFields
        .filter(field => field.title && field.title.trim() !== '')
        .map((field, index) => {
          // Si el campo ya existe, mantenemos su key original
          const existingField = existingCustomFields.find(ef => ef.label === field.title)
          if (existingField) {
            return {
              key: existingField.key,
              label: field.title
            }
          }
          // Si es un campo nuevo, generamos una nueva key correlativa
          const lastIndex = existingCustomFields.length > 0
            ? Math.max(...existingCustomFields.map(ef => parseInt(ef.key.split('_')[1])))
            : -1
          return {
            key: `column_${lastIndex + 1 + index}`,
            label: field.title
          }
        })

      // Agregamos los campos de CAMELOT que vienen del mixin
      const camelotFields = this.camelot && this.camelot.fields
        ? [...this.camelot.fields]
        : []

      // Combinamos todos los campos en un solo arreglo
      const base = [{key: 'ref_id', label: 'Reference ID'}, {key: 'authors', label: 'Author(s), Year'}]
      return [...base, ...newCustomFields, ...camelotFields]
    },

    /**
     * Obtiene los campos personalizados de los datos cargados
     * @returns {Array} Arreglo de objetos con key y label para los campos personalizados
     */
    getCustomFields () {
      // Utilizamos el helper para extraer los campos personalizados
      return extractCustomFields(this.charsData.fields)
    },

    // Método auxiliar para verificar si un campo es personalizado
    isCustomField (fieldKey) {
      return isCustomField(fieldKey)
    },

    /**
     * Carga los datos de características desde la API
     */
    loadCharacteristicsData () {
      this.isLoading = true

      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }

      axios.get('/api/isoqf_characteristics', { params })
        .then(response => {
          if (response.data && response.data.length > 0) {
            // Guardamos los datos recibidos
            this.charsData = response.data[0] || { fields: [], items: [] }

            // Procesamos los datos para el formato requerido
            this.processCharacteristicsData()

            // Forzamos la actualización de la tabla
            this.$forceUpdate()
          } else {
            // Si no hay datos, inicializamos con estructura vacía
            this.charsData = {
              fields: [],
              items: [],
              organization: this.$route.params.org_id,
              project_id: this.$route.params.id
            }
          }

          this.isLoading = false

          // Asegurar actualización final después del cambio de estado de loading
          this.$nextTick(() => {
            this.$forceUpdate()
          })
        })
        .catch(error => {
          console.error('Error al cargar los datos de características:', error)
          this.isLoading = false
        })
    },

    /**
     * Procesa los datos recibidos de la API
     */
    processCharacteristicsData () {
      // Aquí procesaríamos los datos de características según sea necesario
      // Por ejemplo, transformar el formato de los campos o añadir campos adicionales

      if (this.charsData && this.charsData.items && this.charsData.items.length) {
        // Procesamos cada item si es necesario pero no realizamos transformaciones por ahora
        // Dejamos el código comentado como referencia para futuras implementaciones
        /*
        const processedItems = this.charsData.items.map(item => {
          // Transformaciones necesarias
          return item
        })
        */

        // Si necesitamos actualizar las referencias con estos datos, podríamos hacerlo aquí
        // this.references = [...this.references, ...items]
      }

      // Inicializar campos personalizados para el formulario de edición si es necesario
      if (this.charsData && this.charsData.fields) {
        this.initializeCustomFields()
      }
    },

    /**
     * Inicializa los campos personalizados basados en los fields existentes
     * @param {Object} [itemValues=null] - Objeto con valores para los campos personalizados
     */
    initializeCustomFields (itemValues = null) {
      console.log('Inicializando campos personalizados con valores:', itemValues)
      console.log('Fields actuales:', this.charsData.fields)

      // Obtenemos los campos personalizados existentes
      const customFields = this.charsData.fields
        .filter(field => isCustomField(field.key))
        .map(field => {
          return {
            title: field.label || '',
            value: (itemValues && itemValues[field.key]) || '',
            key: field.key
          }
        })

      // Si hay valores específicos para este item, los agregamos
      if (itemValues) {
        Object.keys(itemValues).forEach(key => {
          if (isCustomField(key) && !customFields.find(cf => cf.key === key)) {
            customFields.push({
              title: key,
              value: itemValues[key] || '',
              key: key
            })
          }
        })
      }

      this.customFields = customFields
      console.log('Campos personalizados inicializados:', this.customFields)
    }
  },
  watch: {
    references: {
      handler(newReferences, oldReferences) {
        // Solo recargar si realmente hay cambios en las referencias
        if (newReferences && newReferences.length !== (oldReferences?.length || 0)) {
          console.log('Referencias cambiaron, recargando datos de características')
          this.loadCharacteristicsData()
        }
      },
      immediate: false
    },
    charsData: {
      handler(newVal) {
        if (newVal && newVal.fields) {
          // Forzamos la actualización de la tabla cuando cambian los datos
          this.$nextTick(() => {
            this.$forceUpdate()
          })
        }
      },
      deep: true
    }
  },
  mounted () {
    console.log('StepThree mounted')
    // Cargamos los datos de características al montar el componente
    this.loadCharacteristicsData()
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
