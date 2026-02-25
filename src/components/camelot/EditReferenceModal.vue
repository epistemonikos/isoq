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
                {{ field.label || 'Sin título' }}
              </div>
            </div>

            <div class="menu-section">
              <div
                v-for="(category, catIndex) in camelot.categories"
                :key="'menu-category-' + catIndex"
                class="menu-item d-flex align-items-center"
                :class="{ 'active-menu-item': activeSection === 'category-' + catIndex }"
                @click="scrollToSection('category-' + catIndex)">
                <img :src="camelotLogo" class="mr-2" width="14" height="14" />
                {{ category.label }}
              </div>
            </div>
          </div>
        </b-col>

        <!-- Contenido del formulario -->
        <b-col cols="9">
          <!-- Campos personalizados -->
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

          <b-row>
            <b-col v-for="(category, catIndex) in camelot.categories"
              :key="'category-' + catIndex"
              :id="'category-' + catIndex"
              cols="12"
              class="mb-3">
              <b-card no-body class="mb-3">
                <template #header>
                  <h6 class="d-flex align-items-center">
                    <img :src="camelotLogo" class="mr-2" width="14" height="14" />
                    {{ category.label }}
                  </h6>
                </template>
                <b-card-body>
                  <b-row>
                    <b-col v-for="(option, optIndex) in category.options"
                      :key="'option-' + catIndex + '-' + optIndex"
                      cols="12"
                      md="6"
                      class="mb-3">
                      <label :for="option.key">{{ option.label }}</label>
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

          if (this.camelot && this.camelot.categories) {
            this.camelot.categories.forEach((_, index) => {
              const el = document.getElementById('category-' + index)
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

      const customFields = this.charsData.fields
        .filter(field => isCustomField(field.key))
        .map(field => {
          return {
            label: field.label || '',
            value: (itemValues && itemValues[field.key]) || '',
            key: field.key
          }
        })

      if (itemValues) {
        Object.keys(itemValues).forEach(key => {
          if (isCustomField(key) && !customFields.find(cf => cf.key === key)) {
            customFields.push({
              label: key,
              value: itemValues[key] || '',
              key: key
            })
          }
        })
      }

      this.customFields = customFields
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
    processCustomFields () {
      const existingFields = this.charsData.fields || []
      const existingCustomFields = existingFields.filter(field => isCustomField(field.key))

      const newCustomFields = this.customFields
        .filter(field => field.label && field.label.trim() !== '')
        .map((field, index) => {
          const existingField = existingCustomFields.find(ef => ef.label === field.label)
          if (existingField) {
            return {
              key: existingField.key,
              label: field.label
            }
          }
          const lastIndex = existingCustomFields.length > 0
            ? Math.max(...existingCustomFields.map(ef => parseInt(ef.key.split('_')[1])))
            : -1
          return {
            key: `column_${lastIndex + 1 + index}`,
            label: field.label
          }
        })

      const camelotFields = this.camelot && this.camelot.fields
        ? [...this.camelot.fields]
        : []

      const base = [
        { key: 'ref_id', label: this.$t('camelot.step_three.reference_id') },
        { key: 'authors', label: this.$t('camelot.step_three.author_year') }
      ]
      return [...base, ...newCustomFields, ...camelotFields]
    },
    handleModalOk (bvModalEvent) {
      if (bvModalEvent) bvModalEvent.preventDefault()

      const customFieldsArray = this.processCustomFields()
      const item = {
        ref_id: this.editForm.id || '',
        authors: this.editForm.authors || []
      }

      const existingFields = this.charsData.fields || []
      const existingCustomFields = existingFields.filter(field => isCustomField(field.key))

      this.customFields.forEach((field, index) => {
        if (field.label && field.label.trim() !== '') {
          const existingField = existingCustomFields.find(ef => ef.label === field.label)
          if (existingField) {
            item[existingField.key] = field.value || ''
          } else {
            const lastIndex = existingCustomFields.length > 0
              ? Math.max(...existingCustomFields.map(ef => parseInt(ef.key.split('_')[1])))
              : -1
            item[`column_${lastIndex + 1 + index}`] = field.value || ''
          }
        }
      })

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
