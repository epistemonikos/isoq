<template>
  <b-modal
    id="modal-edit-reference"
    ref="modal-edit-reference"
    :title="modalTitle"
    size="xl"
    @ok="handleModalOk"
    @hide="resetModal"
    @shown="initScrollSpy"
    header-bg-variant="custom-blue"
    :ok-title="$t('camelot.step_three.modal.save_button')"
    >
    <template v-if="localReference">
      <b-row>
        <!-- Menú flotante a la izquierda -->
        <b-col cols="3" class="menu-sidebar">
          <div class="sticky-menu p-2">
            <div class="menu-section-title mb-1">{{ $t('camelot.step_three.study_characteristics') }}</div>
            <div class="menu-section mb-0" v-if="customFields.length > 0">
              <div
                v-for="(field, index) in customFields"
                :key="'menu-custom-' + index"
                class="menu-item"
                :class="{ 'active-menu-item': activeSection === 'custom-field-' + index }"
                @click="scrollToSection('custom-field-' + index)">
                {{ field.isCamelot ? (field.categoryLabel || field.label) : (field.label || 'Sin título') }}
              </div>
            </div>
          </div>
        </b-col>

        <!-- Contenido del formulario -->
        <b-col cols="9">
          <!-- Campos unificados -->
          <div class="mb-4">
            <CustomFieldsManager
              v-model="customFields"
              :with-values="true"
              :title="$t('camelot.step_three.modal.custom_fields_title')"
              :add-button-text="$t('camelot.step_three.modal.add_field_button')"
              :empty-text="$t('camelot.step_three.modal.no_custom_fields')"
              :move-instruction-text="$t('camelot.step_three.modal.move_instruction')"
              :move-button-text="$t('camelot.step_three.modal.move_button')"
              :delete-button-text="$t('camelot.step_three.delete_button')"
              :label-text="$t('camelot.step_three.modal.title_label')"
              :content-label-text="$t('camelot.step_three.modal.content_label')"
              :placeholder-label="$t('camelot.step_three.modal.field_title_placeholder')"
              :placeholder-value="$t('camelot.step_three.modal.field_content_placeholder')"
              id-prefix="custom-field-"
            />
          </div>
        </b-col>
      </b-row>
    </template>
    <template v-else>
      <b-alert show variant="info">{{ $t('camelot.step_three.modal.no_selection') }}</b-alert>
    </template>
  </b-modal>
</template>

<script>
import Api from '@/utils/Api'
import Commons from '@/utils/commons'
import { isCustomField, cleanOrphanedCustomFieldKeys } from '@/utils/customFieldsHelper'

export default {
  name: 'EditReferenceModal',
  components: {
    CustomFieldsManager: () => import('./CustomFieldsManager.vue')
  },
  props: {
    reference: {
      type: Object,
      default: null
    },
    charsData: {
      type: Object,
      required: true
    },
    camelot: {
      type: Object,
      required: true
    },
    visibleColumnKeys: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      camelotLogo: require('@/assets/camelot-logo.svg'),
      localReference: null,
      editForm: {},
      customFields: [],
      activeSection: null,
      observer: null
    }
  },
  computed: {
    modalTitle () {
      if (this.localReference) {
        const authorInfo = Commons.parseReference(this.localReference, true, false)
        return `${this.$t('camelot.step_three.modal.title', { reference_id: authorInfo })}`
      }
      return this.$t('camelot.step_three.modal.title')
    }
  },
  watch: {
    reference: {
      immediate: true,
      handler (newVal) {
        if (newVal) {
          this.localReference = { ...newVal }
          this.editForm = { ...newVal }
          this.initializeCustomFields(newVal)
        } else {
          this.resetModal()
        }
      }
    },
    customFields: {
      handler () {
        if (this.observer) {
          this.$nextTick(() => {
            this.initScrollSpy()
          })
        }
      }
    }
  },
  methods: {
    show () {
      this.$bvModal.show('modal-edit-reference')
    },
    hide () {
      this.$bvModal.hide('modal-edit-reference')
    },
    resetModal () {
      this.destroyScrollSpy()
      this.localReference = null
      this.editForm = {}
      this.customFields = []
      this.activeSection = null
      this.$emit('close')
    },
    initScrollSpy () {
      this.destroyScrollSpy()

      this.$nextTick(() => {
        // Usamos una zona de detección muy estrecha cerca del tope (20% del viewport)
        // Esto actúa como una "línea de disparo" más que como un área
        const options = {
          root: null,
          rootMargin: '-120px 0px -75% 0px', 
          threshold: 0
        }

        // Mapa para rastrear qué elementos están cruzando la línea de activación
        const visibleSections = new Map()

        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              visibleSections.set(entry.target.id, entry.boundingClientRect.top)
            } else {
              visibleSections.delete(entry.target.id)
            }
          })

          if (visibleSections.size > 0) {
            // De los elementos que están en la zona activa, elegimos el que tenga el 'top' más pequeño
            // (el que esté más arriba)
            let topmostId = this.activeSection
            let minTop = Infinity

            visibleSections.forEach((top, id) => {
              if (top < minTop) {
                minTop = top
                topmostId = id
              }
            })

            if (this.activeSection !== topmostId) {
              this.activeSection = topmostId
            }
          }
        }, options)

        // Observar secciones
        const observeElements = () => {
          if (this.customFields) {
            this.customFields.forEach((_, index) => {
              const el = document.getElementById('custom-field-' + index)
              if (el) this.observer.observe(el)
            })
          }
        }

        observeElements()
      })
    },
    destroyScrollSpy () {
      if (this.observer) {
        this.observer.disconnect()
        this.observer = null
      }
    },
    initializeCustomFields (itemValues = null) {
      if (!this.charsData || !Array.isArray(this.charsData.fields)) {
        this.customFields = []
        return
      }

      const parsedFields = []
      
      this.charsData.fields.forEach(field => {
        // Skip system fields
        if (['authors', 'ref_id', 'actions', 'edit'].includes(field.key)) return
        // Skip concerns as they are bundled with extractedData
        if (field.key.endsWith('_concerns')) return

        const isCamelot = field.key.endsWith('_extractedData')
        
        const customFieldObj = {
          label: field.label || '',
          value: (itemValues && itemValues[field.key]) || '',
          key: field.key,
          locked: isCamelot,
          isCamelot: isCamelot,
          hasConcerns: false,
          concernsValue: '',
          concernsKey: '',
          categoryLabel: '',
          extractedDataLabel: '',
          concernsLabel: ''
        }

        if (isCamelot) {
          const concernsKey = field.key.replace('_extractedData', '_concerns')
          customFieldObj.hasConcerns = true
          customFieldObj.concernsKey = concernsKey
          customFieldObj.concernsValue = (itemValues && itemValues[concernsKey]) || ''
          
          let categoryLabel = field.label
          let extractedDataLabel = this.$t('camelot.step_three.modal.content_label')
          let concernsLabel = this.$t('camelot.step_three.concerns_label') || 'Concerns'
          
          if (this.camelot && this.camelot.categories) {
            const categoryMatch = this.camelot.categories.find(c => c.options && c.options.some(o => o.key === field.key))
            if (categoryMatch) {
              categoryLabel = categoryMatch.label
              const extOpt = categoryMatch.options.find(o => o.key === field.key)
              if (extOpt) extractedDataLabel = extOpt.label
              
              const concOpt = categoryMatch.options.find(o => o.key === concernsKey)
              if (concOpt) concernsLabel = concOpt.label
            }
          }
          
          customFieldObj.categoryLabel = categoryLabel
          customFieldObj.extractedDataLabel = extractedDataLabel
          customFieldObj.concernsLabel = concernsLabel
        }
        
        parsedFields.push(customFieldObj)
      })

      // Add any undefined custom fields that might only exist on the item
      if (itemValues) {
        Object.keys(itemValues).forEach(key => {
          if (isCustomField(key) && !parsedFields.find(cf => cf.key === key)) {
            parsedFields.push({
              label: key,
              value: itemValues[key] || '',
              key: key,
              locked: false,
              isCamelot: false,
              hasConcerns: false
            })
          }
        })
      }

      this.customFields = parsedFields
    },
    scrollToSection (id) {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        if (id.includes('custom-field-')) {
          element.classList.add('highlight-new-field')
          setTimeout(() => {
            element.classList.remove('highlight-new-field')
          }, 2000)
        }
      }
    },
    handleModalOk (bvModalEvent) {
      if (bvModalEvent) bvModalEvent.preventDefault()

      const item = {
        ref_id: this.localReference.id || '',
        authors: this.localReference.authors || []
      }

      const newFieldsArray = []
      
      const systemFields = (this.charsData.fields || []).filter(field => 
        ['authors', 'ref_id', 'actions', 'edit'].includes(field.key)
      )

      this.customFields.forEach((field, index) => {
        if (field.label && field.label.trim() !== '') {
          let fieldKey = field.key
          if (!field.locked && (!fieldKey || !fieldKey.startsWith('column_'))) {
             const existingCustomFields = this.charsData.fields.filter(f => isCustomField(f.key))
             const lastIndex = existingCustomFields.length > 0
               ? Math.max(...existingCustomFields.map(ef => parseInt(ef.key.split('_')[1])))
               : -1
             fieldKey = `column_${Date.now()}_${index}`
          }

          item[fieldKey] = field.value || ''
          newFieldsArray.push({ key: fieldKey, label: field.label })

          if (field.hasConcerns) {
            item[field.concernsKey] = field.concernsValue || ''
            const existingConcernsField = this.charsData.fields.find(f => f.key === field.concernsKey)
            if (existingConcernsField) {
              newFieldsArray.push(existingConcernsField)
            } else {
              newFieldsArray.push({ key: field.concernsKey, label: this.$t('camelot.step_three.concerns_label') || 'Concerns' })
            }
          }
        }
      })

      const customFieldsArray = [...systemFields, ...newFieldsArray]

      const updatedCharsData = { ...this.charsData }
      const itemIndex = updatedCharsData.items.findIndex(existingItem =>
        existingItem.ref_id === item.ref_id
      )

      if (itemIndex !== -1) {
        updatedCharsData.items[itemIndex] = { ...updatedCharsData.items[itemIndex], ...item }
      } else {
        updatedCharsData.items.push(item)
      }

      updatedCharsData.fields = customFieldsArray
      updatedCharsData.items = cleanOrphanedCustomFieldKeys(updatedCharsData.items, customFieldsArray)

      const savePromise = updatedCharsData.id
        ? Api.patch(`/isoqf_characteristics/${updatedCharsData.id}/`, updatedCharsData)
        : Api.post('/isoqf_characteristics/', {
          organization: this.$route.params.org_id || '',
          project_id: this.$route.params.id || '',
          ...updatedCharsData
        })

      savePromise
        .then(response => {
          const responseData = response.data.$set || response.data
          const savedData = {
            ...responseData,
            id: response.data.id || this.charsData.id,
            _id: response.data._id || this.charsData._id
          }

          // Visibility logic: only add truly NEW columns
          const oldFieldKeys = this.charsData.fields ? this.charsData.fields.map(f => f.key) : []
          const newKeys = customFieldsArray
            .filter(f =>
              f.key !== 'authors' &&
              f.key !== 'ref_id' &&
              f.key !== 'actions' &&
              !oldFieldKeys.includes(f.key) // Only if it wasn't there before
            )
            .map(f => f.key)

          if (newKeys.length > 0) {
            this.$emit('update:visibleColumnKeys', [...this.visibleColumnKeys, ...newKeys])
          }

          this.$emit('saved', savedData)
          this.hide()
        })
        .catch(error => {
          console.error('Error saving reference characteristics:', error)
        })
    }
  }
}
</script>

<style scoped>
.sticky-menu {
  position: sticky;
  top: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
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

.active-menu-item {
  font-weight: bold;
  color: #007bff;
  background-color: #e9ecef;
}

.menu-sidebar {
  max-height: 100%;
}

@keyframes highlightBackground {
  0% { background-color: rgba(40, 167, 69, 0.2); }
  50% { background-color: rgba(40, 167, 69, 0.1); }
  100% { background-color: transparent; }
}

.highlight-new-field {
  animation: highlightBackground 2s ease-out;
}
</style>
