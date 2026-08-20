<template>
  <div>
    <b-table selected-variant="warning" bordered head-variant="light" id="findings" ref="findings" sort-by="displayNumber"
      :fields="(list_categories.options.length) ? fields.with_categories : fields.without_categories" :items="lists"
      show-empty :busy="isBusy" :current-page="table_settings.currentPage" :filter="table_settings.filter"
      @filtered="onFiltered" :filter-included-fields="table_settings.filterOn">
      <template v-slot:head(displayNumber)="data">
        <span v-b-tooltip.hover :title="$t('soqf_table.auto_numbering')">{{ data.label }}</span>
      </template>
      <template v-slot:head(name)="data">
        <span v-b-tooltip.hover :title="$t('soqf_table.finding_summary')">{{ data.label }}</span>
      </template>
      <template v-slot:head(category_name)="data">
        {{ data.label }}
        <b-dropdown id="dropdown-categories" text="" class="finding-filter" :no-caret="false" size="sm">
          <b-dropdown-item v-for="(category, index) of list_categories.options" :key="index"
            @click="tableFilter(category.text, 1)" :active="isFilterActive(category.text)">{{ category.text
            }}</b-dropdown-item>
        </b-dropdown>
        <span v-if="ui.project.showFilterOne" class="text-danger remove-opt" @click="cleanTableFilter">&times;</span>
      </template>
      <template v-slot:head(cerqual_option)="data">
        <span v-b-tooltip.hover :title="$t('soqf_table.confidence_desc')">{{ data.label }}</span>
        <b-dropdown id="dropdown-cerqual-option" text="" class="finding-filter" :no-caret="false" size="sm">
          <b-dropdown-item @click="tableFilter('hc', 2)" :active="isFilterActive('hc')">{{
            $t('soqf_table.high_confidence') }}</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('mc', 2)" :active="isFilterActive('mc')">{{
            $t('soqf_table.moderate_confidence') }}</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('lc', 2)" :active="isFilterActive('lc')">{{
            $t('soqf_table.low_confidence') }}</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('vc', 2)" :active="isFilterActive('vc')">{{
            $t('soqf_table.very_low_confidence') }}</b-dropdown-item>
          <b-dropdown-divider></b-dropdown-divider>
          <b-dropdown-item @click="tableFilter('completed', 2)" :active="isFilterActive('completed')">{{
            $t('soqf_table.assessments_completed') }}</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('unfinished', 2)" :active="isFilterActive('unfinished')">{{
            $t('soqf_table.assessments_not_completed') }}</b-dropdown-item>
        </b-dropdown>
        <span v-if="ui.project.showFilterTwo" class="text-danger remove-opt" @click="cleanTableFilter">&times;</span>
      </template>
      <template v-slot:head(cerqual_explanation)="data">
        <span v-b-tooltip.hover :title="$t('soqf_table.explanation_desc')">{{ data.label }}</span>
        <b-dropdown id="dropdown-cerqual-explanation" text="" class="finding-filter" :no-caret="false" size="sm">
          <b-dropdown-item @click="tableFilter('with_explanation', 3)" :active="isFilterActive('with_explanation')">{{
            $t('common.completed') }}</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('without_explanation', 3)"
            :active="isFilterActive('without_explanation')">{{ $t('common.not_completed') }}</b-dropdown-item>
        </b-dropdown>
        <span v-if="ui.project.showFilterThree" class="text-danger remove-opt" @click="cleanTableFilter">&times;</span>
      </template>
      <template v-slot:head(ref_list)="data">
        <span v-b-tooltip.hover :title="$t('soqf_table.studies_contribute')">{{ data.label }}</span>
      </template>
      <!-- data -->
      <template v-slot:cell(displayNumber)="data">
        {{ (Object.prototype.hasOwnProperty.call(data.item, 'displayNumber')) ? data.item.displayNumber : data.index + 1 }}
      </template>
      <template v-slot:cell(name)="data">
        <a :id="`a-${data.item.id}`"></a>
        <span v-if="mode === 'edit'">
          <b-row class="mb-3">
            <b-col lg="6" cols="12">
              <b-button block v-if="mode === 'edit' && canEdit" variant="outline-success"
                :disabled="isFindingLocked(data.item.id)" v-b-tooltip.hover
                :title="findingLockedByName(data.item.id)" @click="editModalFindingName(data)">
                <font-awesome-icon v-if="isFindingLocked(data.item.id)" icon="user"></font-awesome-icon>
                <font-awesome-icon v-if=(data.item.notes.length) icon="comments"></font-awesome-icon>
                {{ $t('common.edit') }}
              </b-button>
            </b-col>
            <b-col class="mt-1 mt-lg-0" lg="6" cols="12">
              <b-button block v-if="mode === 'edit' && canEdit" variant="outline-danger"
                :disabled="isFindingLocked(data.item.id)" v-b-tooltip.hover
                :title="findingLockedByName(data.item.id)" @click="removeModalFinding(data)">
                {{ $t('common.remove') }}
              </b-button>
            </b-col>
          </b-row>
          <!-- El nombre de quien edita va VISIBLE, no en un tooltip: bootstrap-vue no monta
               su tooltip sobre un botón `disabled` (el navegador no emite eventos de mouse
               ahí), así que sólo quedaba el title nativo — lento y ausente con teclado.
               Verificado en navegador. Mismo tratamiento que Criteria.vue le da a sus cajas. -->
          <small v-if="isFindingLocked(data.item.id)" class="text-warning d-block mb-2">
            <font-awesome-icon icon="user"></font-awesome-icon>
            {{ findingLockedByName(data.item.id) }}
          </small>
          <b-link class="table-edit-list" v-if="data.item.references.length"
            :to="{ name: 'editList', params: { id: data.item.id } }">{{ data.item.name }}</b-link>
          <span v-if="data.item.references.length === 0">{{ data.item.name }}</span>
        </span>
        <span v-else>
          <template v-if="mode === 'view' && data.item.references.length">
            <b-link class="table-edit-list" :to="{ name: 'editList', params: { id: data.item.id } }">{{ data.item.name
            }}</b-link>
          </template>
          <template v-else>
            {{ data.item.name }}
          </template>
        </span>
      </template>
      <template v-slot:cell(category_name)="data">
        <template v-if="data.item.category !== null">
          <b-button v-if="mode === 'edit' && canEdit" block variant="outline-info"
            :disabled="isFindingLocked(data.item.id)" v-b-tooltip.hover
            :title="findingLockedByName(data.item.id)" @click="editModalFindingName(data)">{{
            $t('soqf_table.edit_group') }}</b-button>
          {{ data.item.category_name }}
          <span v-if="data.item.category_extra_info !== ''" v-b-tooltip.hover
            :title="data.item.category_extra_info">*</span>
        </template>
        <template v-else>
          <b-button v-if="mode === 'edit' && canEdit && data.item.references.length" variant="info" block
            :disabled="isFindingLocked(data.item.id)" v-b-tooltip.hover
            :title="findingLockedByName(data.item.id)"
            @click="editModalFindingName(data)">{{ $t('soqf_table.assign_group') }}</b-button>
        </template>
      </template>
      <template v-slot:cell(cerqual_option)="data">
        <b-button v-if="data.item.references.length" class="d-print-none mb-3"
          :disabled="(data.item.references.length) ? false : true" block
          :variant="(data.item.cerqual_option === '') ? 'info' : 'outline-info'"
          :to="{ name: 'editList', params: { id: data.item.id } }">
          <font-awesome-icon
            v-if="mode === 'edit' && canEdit && Object.prototype.hasOwnProperty.call(data.item, 'evidence_profile') && (data.item.evidence_profile.methodological_limitations.notes || data.item.evidence_profile.coherence.notes || data.item.evidence_profile.adequacy.notes || data.item.evidence_profile.relevance.notes || cerqualOf(data.item).notes)"
            icon="comments"></font-awesome-icon>
          <span v-if="mode === 'edit' && canEdit && data.item.cerqual_option === ''">{{ $t('common.complete') }}</span>
          <span v-if="mode === 'edit' && canEdit && data.item.cerqual_option != ''">{{ $t('common.edit') }}</span>
          <span v-if="!(mode === 'edit' && canEdit)">{{ $t('common.view') }}</span>
          {{ $t('soqf_table.gc_assessment') }}
        </b-button>
        <b>{{ data.item.cerqual_option }}</b>
      </template>
      <template v-slot:cell(cerqual_explanation)="data">
        <b-button v-if="data.item.references.length" class="d-print-none mb-3"
          :disabled="(data.item.references.length) ? false : true" block
          :variant="(data.item.cerqual_explanation === '') ? 'info' : 'outline-info'"
          :to="{ name: 'editList', params: { id: data.item.id } }">
          <font-awesome-icon
            v-if="mode === 'edit' && canEdit && Object.prototype.hasOwnProperty.call(data.item, 'evidence_profile') && (data.item.evidence_profile.methodological_limitations.notes || data.item.evidence_profile.coherence.notes || data.item.evidence_profile.adequacy.notes || data.item.evidence_profile.relevance.notes || cerqualOf(data.item).notes)"
            icon="comments"></font-awesome-icon>
          <span v-if="mode === 'edit' && canEdit && data.item.cerqual_explanation === ''">{{ $t('common.complete') }}</span>
          <span v-if="mode === 'edit' && canEdit && data.item.cerqual_explanation != ''">{{ $t('common.edit') }}</span>
          <span v-if="!(mode === 'edit' && canEdit)">{{ $t('common.view') }}</span>
          {{ $t('soqf_table.gc_assessment') }}
        </b-button>
        <b class="cerqual-explanation" v-if="data.item.cerqual_option !== ''">{{ data.item.cerqual_explanation }}</b>
      </template>
      <template v-slot:cell(ref_list)="data">
        <template v-if="!(mode === 'edit' && canEdit)">
          {{ data.item.ref_list }}
        </template>
        <template v-else>
          <b-button block class="mb-3 d-print-none" :variant="(data.item.references.length) ? 'outline-info' : 'info'"
            :disabled="isFindingLocked(data.item.id)" v-b-tooltip.hover
            :title="findingLockedByName(data.item.id)" @click="openModalReferences(data)">
            <font-awesome-icon v-if="isFindingLocked(data.item.id)" icon="user"></font-awesome-icon>
            <span v-if="data.item.references.length">{{ $t('soqf_table.view_edit_refs') }}</span>
            <span v-else>{{ $t('soqf_table.select_references') }}</span>
          </b-button>
          <span v-html="$t('soqf_table.refs_count', { count: data.item.raw_ref.length })"></span>
        </template>
      </template>
      <template v-slot:empty>
        <p class="text-center my-5">
          {{ $t('soqf_table.no_findings') }} <a href="#" @click="modalAddList">{{ $t('soqf_table.add_review_finding')
          }}</a>
        </p>
      </template>
      <template v-slot:table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong>{{ $t('common.loading') }}</strong>
        </div>
      </template>
    </b-table>
    <!-- modals -->
    <b-modal size="xl" id="edit-finding-name" ref="edit-finding-name" :title="$t('soqf_table.edit_finding')"
      :ok-title="$t('common.save')" ok-variant="outline-success" cancel-variant="outline-secondary"
      :ok-disabled="!canEdit || isFindingReadOnly || !editFindingName.name || !editFindingName.name.trim().length"
      @ok="updateListName"
      @show="noteModalShown('edit-finding-name')" @hidden="onEditFindingNameHidden">
      <b-alert v-if="isFindingReadOnly" show variant="warning" class="read-only-notice">
        {{ readOnlyNotice }}
      </b-alert>
      <b-form-group :label="$t('soqf_table.summarised_finding')" label-for="finding-name">
        <template slot="description">
          {{ $t('common.click') || 'Click' }}
          <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/1"
            target="_blank">
            {{ $t('common.here') || 'here' }}
          </a>
          {{ $t('soqf_table.tips_writing') }}
        </template>
        <b-form-textarea id="finding-name" v-model="editFindingName.name" rows="6" max-rows="100"
          :state="findingNameDirty && !(editFindingName.name && editFindingName.name.trim().length) ? false : null"
          @input="findingNameDirty = true"></b-form-textarea>
        <b-form-invalid-feedback>{{ $t('common.field_required') }}</b-form-invalid-feedback>
      </b-form-group>
      <b-form-group v-if="list_categories.options.length" :label="$t('soqf_table.select_group')"
        :description="$t('soqf_table.group_optional')">
        <b-form-select v-model="editFindingName.category" value-field="id" text-field="text"
          :options="list_categories.options"></b-form-select>
      </b-form-group>
      <b-form-group label-for="finding-note" :description="$t('soqf_table.notes_placeholder')">
        <template v-slot:label>
          <videoHelp :txt="$t('common.notes')" tag="none" urlId="462176506"></videoHelp>
        </template>
        <b-form-textarea id="finding-note" v-model="editFindingName.notes" rows="6" max-rows="100"></b-form-textarea>
      </b-form-group>
    </b-modal>

    <b-modal size="xl" id="remove-finding" ref="remove-finding" :title="$t('soqf_table.remove_finding')"
      :ok-title="$t('common.confirm')" ok-variant="outline-danger" cancel-variant="outline-secondary"
      :ok-disabled="!canEdit || isFindingReadOnly" @ok="confirmRemoveList"
      @show="noteModalShown('remove-finding')" @hidden="onRemoveFindingHidden">
      <b-alert v-if="isFindingReadOnly" show variant="warning" class="read-only-notice">
        {{ readOnlyNotice }}
      </b-alert>
      <p v-if="ui.project.showExtendedExplanationTextForDeleting" class="text-danger">
        {{ $t('soqf_table.delete_warning_revert') }}
      </p>
      <p v-else class="text-danger">
        {{ $t('soqf_table.delete_warning') }}
      </p>
      <p>
        <span v-html="$t('soqf_table.confirm_remove', { name: this.editFindingName.name })"></span>
      </p>
    </b-modal>

    <b-modal v-if="selected_list_index >= 0" id="modal-references-list" ref="modal-references-list"
      :title="$t('soqf_table.references')" @ok="checkReferencesBeforeSaving"
      @show="noteModalShown('modal-references-list')" @hidden="handleReferencesModalHidden"
      @cancel="cancelReferencesList" :ok-disabled="!canEdit || isFindingReadOnly || (selected_list_index === null)"
      :no-close-on-backdrop="pendingSaveReferences" :no-close-on-esc="pendingSaveReferences"
      :ok-title="$t('common.save')" ok-variant="outline-success" cancel-variant="outline-secondary" size="xl"
      scrollable>
      <b-alert v-if="isFindingReadOnly" show variant="warning" class="read-only-notice">
        {{ readOnlyNotice }}
      </b-alert>
      <template v-if="references.length">
        <div class="mt-2">
          <b-alert v-if="showBanner" show variant="danger">
            {{ $t('soqf_table.remove_ref_warning') }}
          </b-alert>
          <b-table responsive striped hover class="references-list-table"
            :fields="[{ key: 'content', label: $t('soqf_table.author_year_title') }]" :items="refs">
            <template v-slot:head(content)="data">
              <span class="ml-4">{{ data.label }}</span>
            </template>
            <template v-slot:cell(content)="data">
              <b-form-checkbox class="w-100 cursor-pointer" :id="`checkbox-${data.index}`" v-model="selected_references"
                :name="`checkbox-${data.index}`" :value="data.item.id">
                <span class="ml-2">{{ data.item.content }}</span>
              </b-form-checkbox>
            </template>
          </b-table>
        </div>
      </template>
      <template v-else>
        <div class="mt-2">
          <p>{{ $t('references.select_first') }}</p>
        </div>
      </template>
    </b-modal>

    <b-modal id="modal-no-references-warning" ref="modal-no-references-warning" :title="$t('project.warning')"
      @ok="confirmSaveNoReferences" @cancel="cancelNoReferencesWarning" :ok-title="$t('common.continue')"
      ok-variant="outline-danger" cancel-variant="outline-secondary" no-close-on-backdrop no-close-on-esc>
      <p>{{ $t('soqf_table.remove_all_unpublish') }}</p>
    </b-modal>

    <b-modal id="modal-private-project-warning" ref="modal-private-project-warning" :title="$t('project.warning')"
      @ok="confirmSavePrivateProject" @cancel="cancelPrivateProjectWarning" :ok-title="$t('common.continue')"
      ok-variant="outline-danger" cancel-variant="outline-secondary" no-close-on-backdrop no-close-on-esc>
      <p>{{ $t('soqf_table.remove_all_revert') }}</p>
    </b-modal>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import Commons from '../../utils/commons.js'
import LockService from '@/services/lockService'
import { isLockRejection } from '@/utils/lockErrors'
import { userDisplayName } from '@/utils/userDisplayName'

export default {
  name: 'ViewTable',
  components: {
    videoHelp: () => import('@/components/videoHelp.vue')
  },
  data () {
    return {
      ui: {
        project: {
          type: '',
          inclusion: {
            success: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            error: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            loading: false,
            loading_txt: this.$t('common.save')
          },
          exclusion: {
            success: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            error: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            loading: false,
            loading_txt: this.$t('common.save')
          },
          displaySearch: false,
          showFilterOne: false,
          showFilterTwo: false,
          showFilterThree: false,
          show_criteria: false,
          showExtendedExplanationTextForDeleting: false
        },
        itemData: null,
        publish: {
          showLoader: false
        }
      },
      table_settings: {
        isBusy: true,
        currentPage: 1,
        perPage: 5,
        filter: null,
        totalRows: 1,
        filterOn: ['name', 'filter_cerqual', 'category_name', 'explanation']
      },
      editFindingName: {
        index: null,
        id: null,
        finding_id: null,
        name: null,
        notes: null,
        organization: null,
        list_id: null,
        isoqf_id: null,
        evidence_profile: {
          name: '',
          isoqf_id: null,
          relevance: {
            explanation: '',
            option: null
          },
          adequacy: {
            explanation: '',
            option: null
          },
          coherence: {
            explanation: '',
            option: null
          },
          methodological_limitations: {
            explanation: '',
            option: null
          },
          cerqual: {
            explanation: '',
            option: null
          },
          references: []
        },
        references: [],
        is_public: null,
        license_type: null,
        private: null,
        public_type: null
      },
      selected_list_index: null,
      showBanner: false,
      selected_references: [],
      original_references: [],
      finding: {},
      pendingSaveReferences: false,
      findingNameDirty: false,
      // Clave del ref_lock que sostiene el modal abierto, o null. Es el id del documento
      // `isoqf_findings`: la MISMA que toma evidenceProfileForm al abrir la hoja de
      // evidence profile, porque los dos editores escriben ese mismo documento.
      lockedFindingRef: null,
      // Rechazo conocido de primera mano, antes de que el próximo sondeo lo confirme.
      findingLockedBy: null,
      isFindingReadOnly: false,
      lockLostWhileEditing: false,
      // El lock no se suelta mientras un guardado viaja: bootstrap-vue emite `ok` y
      // enseguida `hidden`, y el PATCH es asíncrono.
      savingFinding: false,
      // Ids de los modales abiertos ahora mismo. El padre corre un sondeo de frescura y
      // necesita saber si un refresco le arrancaría el borrador a alguien; como los
      // modales viven acá, se lo contamos por evento.
      openModals: []
    }
  },
  props: {
    lists: {
      type: Array,
      required: true,
      default: () => []
    },
    list_categories: {
      type: Object,
      required: true,
      default: () => ({
        options: [],
        selected: null
      })
    },
    fields: {
      type: Object,
      required: true,
      default: () => ({
        with_categories: [
          { key: 'displayNumber', label: 'No.' },
          { key: 'name', label: this.$t('table_headers.summarised_finding') },
          { key: 'category_name', label: this.$t('table_headers.review_finding_groups') },
          { key: 'cerqual_option', label: this.$t('table_headers.cerqual_assessment') },
          { key: 'cerqual_explanation', label: this.$t('table_headers.cerqual_explanation') },
          { key: 'ref_list', label: this.$t('table_headers.references') }
        ],
        without_categories: [
          { key: 'displayNumber', label: 'No.' },
          { key: 'name', label: this.$t('table_headers.summarised_finding') },
          { key: 'cerqual_option', label: this.$t('table_headers.cerqual_assessment') },
          { key: 'cerqual_explanation', label: this.$t('table_headers.cerqual_explanation') },
          { key: 'ref_list', label: this.$t('table_headers.references') }
        ]
      })
    },
    project: {
      type: Object,
      required: true,
      default: () => ({
        is_public: false
      })
    },
    references: {
      type: Array,
      required: true,
      default: () => []
    },
    refs: {
      type: Array,
      required: true,
      default: () => []
    },
    mode: {
      type: String,
      required: false,
      default: ''
    },
    canEdit: {
      type: Boolean,
      required: false,
      default: false
    },
    isBusy: {
      type: Boolean,
      required: true,
      default: false
    },
    filter: {
      type: String,
      default: null
    },
    // Documentos `isoqf_findings` del proyecto, para tener el finding_id de cada fila
    // ANTES del clic: sin esto habría que ir a buscarlo y no se podría grisar el botón.
    findings: {
      type: Array,
      default: () => []
    },
    // Último sondeo de ref_locks del proyecto, que corre en el padre.
    refLocks: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    /** list_id -> finding_id, para resolver la clave de lock sin ir al servidor. */
    findingIdByListId: function () {
      const map = {}
      this.findings.forEach((finding) => {
        if (finding && finding.list_id && finding.id) map[finding.list_id] = finding.id
      })
      return map
    },
    currentUserName: function () {
      return userDisplayName(this.$store && this.$store.state && this.$store.state.user)
    },
    /** Texto del cartel de solo lectura dentro de un modal abierto. */
    readOnlyNotice: function () {
      if (!this.isFindingReadOnly) return ''
      if (this.lockLostWhileEditing) {
        return this.findingLockedBy
          ? this.$t('lock.lost_while_editing', { user: this.findingLockedBy })
          : this.$t('lock.lost_while_editing_no_user')
      }
      return this.findingLockedBy
        ? this.$t('lock.ref_locked_by', { user: this.findingLockedBy })
        : this.$t('lock.ref_locked_by_no_user')
    }
  },
  mounted: function () {
    window.addEventListener('ref-lock-lost', this.onRefLockLost)
  },
  beforeDestroy: function () {
    window.removeEventListener('ref-lock-lost', this.onRefLockLost)
    // El releaseRef() global de viewProject no alcanza: este componente está detrás de un
    // v-if de permisos y puede desaparecer sin que se salga del proyecto.
    this.releaseFindingLock()
  },
  watch: {
    filter (newVal) {
      this.table_settings.filter = newVal
    }
    // Acá NO va un watcher de `refLocks` que limpie el estado de solo lectura, aunque
    // Criteria.vue tenga uno: allá el textarea está siempre a la vista y sin el watcher
    // quedaría muerto para siempre. Este estado, en cambio, sólo pinta un modal abierto —
    // se decide en acquireFindingLock y se limpia en releaseFindingLock. Un sondeo que lo
    // borrara devolvería el formulario a editable SIN tener el lock, que es justo lo que
    // hay que evitar. El grisado de los botones de la tabla no lo necesita: sale de
    // polledHolderOf, que lee el prop en cada render y ya se corrige solo.
  },
  methods: {
    noteModalShown: function (id) {
      if (!this.openModals.includes(id)) this.openModals.push(id)
      this.emitEditorOpen()
    },
    noteModalHidden: function (id) {
      this.openModals = this.openModals.filter((el) => el !== id)
      this.emitEditorOpen()
    },
    emitEditorOpen: function () {
      this.$emit('editor-open', this.openModals.length > 0)
    },
    onEditFindingNameHidden: function () {
      this.findingNameDirty = false
      this.noteModalHidden('edit-finding-name')
      this.releaseFindingLock()
    },
    onRemoveFindingHidden: function () {
      this.noteModalHidden('remove-finding')
      this.releaseFindingLock()
    },
    cerqualOf: function (item) {
      return Commons.resolveCerqual(item)
    },
    /** Clave de lock de una fila, si ya la tenemos en memoria. */
    findingIdOf: function (listId) {
      return this.findingIdByListId[listId] || null
    },
    /**
     * `findings` puede ir un request atrás de `lists` (el padre dispara getFindings sin
     * await dentro de getLists), así que un finding recién creado todavía no está en el
     * mapa. Ahí sí hay que preguntarle al servidor.
     */
    resolveFindingId: async function (listId) {
      const known = this.findingIdOf(listId)
      if (known) return known
      try {
        const response = await Api.get('/isoqf_findings', {
          organization: this.$route.params.org_id,
          list_id: listId
        })
        return (response.data && response.data.length) ? response.data[0].id : null
      } catch (error) {
        console.log(Commons.printErrors(error))
        return null
      }
    },
    /**
     * Se pide al abrir el modal y no al guardar, para que el rechazo llegue antes de que
     * la persona redacte el finding entero. Rechazado no impide abrir: deja ver y copiar
     * el contenido, con el formulario en solo lectura.
     */
    acquireFindingLock: async function (findingId) {
      this.isFindingReadOnly = false
      this.findingLockedBy = null
      this.lockLostWhileEditing = false
      if (!findingId || !this.canEdit) return
      const result = await LockService.acquireRef(this.$route.params.id, findingId)
      if (result && result.success) {
        this.lockedFindingRef = findingId
        return
      }
      this.lockedFindingRef = null
      this.isFindingReadOnly = true
      // Un 403 no tiene a quién culpar: nadie más lo tiene, este usuario perdió el
      // permiso de escritura. Nombrar a un dueño ahí sería inventarlo.
      this.findingLockedBy = (result && !result.permissionDenied && result.lockedBy) || null
      if (this.$notify) {
        this.$notify.warning(result && result.permissionDenied
          ? this.$t('lock.permissions_revoked')
          : this.readOnlyNotice)
      }
      // El padre sondea cada 15 s; este rechazo es motivo para no esperarlos.
      this.$emit('lock-denied')
    },
    /**
     * Fin del guardado. El modal ya se cerró para cuando el PATCH aterriza (bootstrap-vue
     * emite `hidden` enseguida después de `ok`), así que el release real pasa acá.
     */
    finishFindingSave: function () {
      this.savingFinding = false
      this.releaseFindingLock()
    },
    releaseFindingLock: function () {
      // Con un guardado en vuelo soltarlo dejaría al PATCH viajando sin lock detrás; lo
      // suelta el propio guardado al terminar.
      if (this.savingFinding) return
      if (this.lockedFindingRef) LockService.releaseRef(this.lockedFindingRef)
      this.lockedFindingRef = null
      this.isFindingReadOnly = false
      this.findingLockedBy = null
      this.lockLostWhileEditing = false
    },
    /**
     * El lock puede evaporarse en pleno tipeo: un latido fallido, o una concesión offline
     * que perdió la carrera al reconectar. Dejar el formulario escribible sólo llevaría a
     * escribir algo que nadie va a guardar.
     */
    onRefLockLost: function (event) {
      const detail = (event && event.detail) || {}
      if (!detail.refId || detail.refId !== this.lockedFindingRef) return
      // Ya no es nuestro: soltarlo sería pedirle al servidor que suelte el de otro.
      this.lockedFindingRef = null
      this.isFindingReadOnly = true
      this.findingLockedBy = detail.lockedBy || null
      this.lockLostWhileEditing = true
    },
    /**
     * Dueño de este finding según el último sondeo, descartando el lock propio.
     *
     * El lock propio se descarta por DOS caminos, y hacen falta los dos: el registro de
     * LockService sólo conoce los locks de ESTA pestaña, así que sin comparar además por
     * nombre un lock propio dejado en otra pestaña se lee como ajeno y la fila queda
     * bloqueada contra uno mismo, con el propio nombre en el cartel. Misma comparación
     * que hacen `polledHolder` en Criteria.vue y `studyLockState` para los estudios.
     */
    polledHolderOf: function (listId) {
      const id = this.findingIdOf(listId)
      if (!id) return null

      // 1) Tuya en esta pestaña:
      if (LockService.refLocks.has(id)) return null

      // 2) Tuya en otra pestaña:
      if (this.currentUserName && this.refLocks.some(x => x.ref_id === id && x.user_name === this.currentUserName)) {
        return null
      }

      // 3) De otro:
      const remote = this.refLocks.find(x => x.ref_id === id)
      // Un lock sin nombre no alcanza para bloquear: sin a quién nombrar, el cartel
      // quedaría mudo y la fila muerta. `|| null` fija el contrato en un solo tipo.
      return (remote && remote.user_name) || null
    },
    /** ¿Hay que grisar los botones de esta fila? */
    isFindingLocked: function (listId) {
      return Boolean(this.polledHolderOf(listId))
    },
    /** Tooltip de un botón grisado: dice quién lo está editando. */
    findingLockedByName: function (listId) {
      const holder = this.polledHolderOf(listId)
      return holder ? this.$t('lock.ref_locked_by', { user: holder }) : ''
    },
    onFiltered: function (filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.table_settings.totalRows = filteredItems.length
      this.table_settings.currentPage = 1
    },
    cleanTableFilter () {
      this.ui.project.showFilterOne = false
      this.ui.project.showFilterTwo = false
      this.ui.project.showFilterThree = false
      this.table_settings.filter = ''
    },
    isFilterActive: function (val) {
      const regex = new RegExp(`^${val}$`, 'i')
      return regex.test(this.table_settings.filter)
    },
    tableFilter: function (txt, filter) {
      this.table_settings.filter = txt
      switch (filter) {
        case 1:
          this.ui.project.showFilterOne = true
          this.ui.project.showFilterTwo = false
          this.ui.project.showFilterThree = false
          break
        case 2:
          this.ui.project.showFilterOne = false
          this.ui.project.showFilterTwo = true
          this.ui.project.showFilterThree = false
          break
        case 3:
          this.ui.project.showFilterOne = false
          this.ui.project.showFilterTwo = false
          this.ui.project.showFilterThree = true
          break
      }
      window.scrollTo({ top: 600, behavior: 'smooth' })
    },
    /**
     * Se espera al finding_id antes de abrir. Antes el modal se mostraba sin esperar el
     * GET, así que quien guardaba rápido mandaba un PATCH /isoqf_findings/undefined; y
     * además el lock se pide con ese id, así que ahora hay que tenerlo sí o sí.
     */
    editModalFindingName: async function (data) {
      this.editFindingName = this.setEditFindingNameProp(data)
      const findingId = await this.resolveFindingId(data.item.id)
      this.editFindingName.finding_id = findingId
      await this.acquireFindingLock(findingId)
      this.$refs['edit-finding-name'].show()
    },
    removeModalFinding: function (data) {
      this.editFindingName.index = data.index
      const params = {
        organization: this.$route.params.org_id,
        list_id: data.item.id
      }
      Api.get('/isoqf_findings', params)
        .then(async (response) => {
          this.editFindingName = { ...response.data[0] }
          // Borrar un finding que otra persona está evaluando es el peor de los tres
          // casos, así que también pasa por el lock.
          await this.acquireFindingLock(this.findingIdOf(data.item.id) || this.editFindingName.id)

          let cnt = 0
          for (const el of this.lists) {
            if (Object.prototype.hasOwnProperty.call(el, 'evidence_profile') && Commons.resolveCerqual(el).option !== null) {
              cnt++
            }
          }

          // Only show extended warning if the project is currently public and would become private
          if (!this.project.private && cnt === 1 && Commons.resolveCerqual(this.editFindingName).option !== null) {
            this.ui.project.showExtendedExplanationTextForDeleting = true
          } else {
            this.ui.project.showExtendedExplanationTextForDeleting = false
          }

          this.$refs['remove-finding'].show()
        })
        .catch((error) => {
          console.log(Commons.printErrors(error))
        })
    },
    modalAddList: function () {
      this.$emit('add-list')
    },
    openModalReferences: function (data) {
      this.editFindingName = this.setEditFindingNameProp(data)
      const index = this.lists.findIndex((item) => item.id === data.item.id)
      this.selected_list_index = index
      const params = {
        list_id: data.item.id
      }
      Api.get('/isoqf_findings', params)
        .then(async (response) => {
          if (response.data.length) {
            this.finding = JSON.parse(JSON.stringify(response.data[0]))
            await this.$emit('get-references', false)
            this.selected_references = data.item.references
            this.original_references = [...data.item.references]
            this.showBanner = false
            if (data.item.cerqual_option !== '') {
              this.showBanner = true
            }
            await this.acquireFindingLock(this.finding.id)
            this.$refs['modal-references-list'].show()
          }
        })
        .catch((error) => {
          console.log(Commons.printErrors(error))
        })
    },
    setEditFindingNameProp: function (data) {
      return {
        index: data.index,
        id: data.item.id,
        name: data.item.name,
        category: data.item.category,
        notes: data.item.notes
      }
    },
    /**
     * Un PATCH, un lock, sólo los campos del modal.
     *
     * Antes eran dos requests (documento COMPLETO a /isoqf_lists y luego /isoqf_findings)
     * y el cuerpo se armaba clonando el item de `this.lists`: con una copia vieja, guardar
     * el nombre revertía la categoría o las referencias que otro acababa de cambiar, y de
     * paso mandaba al servidor los campos que processLists inyecta sólo para pintar la
     * tabla (raw_ref, displayNumber, cerqual_option, status). El endpoint nuevo tiene
     * whitelist: esas claves ahora darían 400, que es la idea.
     *
     * `is_public` queda fuera a propósito: ningún documento hijo se autoriza por el suyo
     * —el acceso se deriva del proyecto padre— y setPermissions lo re-cascadea en cada
     * publish. Confirmado con backend.
     */
    updateListName: async function () {
      if (!this.canEdit || this.isFindingReadOnly || !this.editFindingName.finding_id) {
        return
      }
      this.savingFinding = true
      this.$emit('set-busy', true)
      const params = {
        name: this.editFindingName.name,
        category: this.editFindingName.category,
        notes: this.editFindingName.notes || ''
      }
      return Api.patch(`/isoqf_findings/${this.editFindingName.finding_id}/identity`, params)
        .then(() => {
          this.finishFindingSave()
          this.$emit('get-lists')
          this.$notify.success(this.$t('notifications.saved'))
        })
        .catch((error) => {
          console.error(error)
          this.finishFindingSave()
          this.$emit('get-lists')
          this.notifySaveError(error)
        })
    },
    /**
     * El 409/403 de una escritura granular ya se le anunció al usuario por el canal de
     * conflicto; encimarle "no se pudo guardar, intente nuevamente" es un consejo falso
     * mientras el lock sea de otra persona.
     */
    notifySaveError: function (error) {
      if (isLockRejection(error)) return
      this.$notify.error(this.$t('notifications.save_error'))
    },
    confirmRemoveList: function () {
      if (!this.canEdit || this.isFindingReadOnly || !this.editFindingName.id) {
        return
      }
      this.$emit('set-busy', true)
      const params = {
        project_id: this.$route.params.id,
        finding_id: this.editFindingName.id
      }
      Api.post('/finding/remove', params)
        .then(() => {
          // El documento ya no existe; el DELETE sobre un ref inexistente es inocuo y
          // deja limpio el registro local de locks de esta pestaña.
          this.releaseFindingLock()
          this.$notify.success(this.$t('notifications.deleted'))
          this.$emit('get-project')
        })
        .catch((error) => {
          this.$emit('set-busy', false)
          console.error(error)
          this.$notify.error(this.$t('notifications.delete_error'))
        })
    },
    cancelReferencesList: function () {
      this.$refs['modal-references-list'].hide()
    },
    checkReferencesBeforeSaving: function (bvModalEvent) {
      // Prevent modal from closing automatically
      // Only show warning if there were original references and all have been removed
      if (this.selected_references.length === 0 && this.original_references.length > 0 && this.project.is_public) {
        bvModalEvent.preventDefault()
        this.pendingSaveReferences = true

        let findingsWithRefsCount = 0
        for (const item of this.lists) {
          if (item.references && item.references.length > 0) {
            findingsWithRefsCount++
          }
        }

        // Special case: if there's only one item in the list, removing all references will make the project private
        if (findingsWithRefsCount <= 1) {
          this.$refs['modal-private-project-warning'].show()
        } else {
          this.$refs['modal-no-references-warning'].show()
        }
        return
      }

      // If no warning is needed, proceed with saving
      this.saveReferencesList()
    },

    handleReferencesModalHidden: function () {
      this.noteModalHidden('modal-references-list')
      // Only clean up if not pending save from warning dialog
      if (!this.pendingSaveReferences) {
        this.cleanReferencesList()
        // Con una advertencia en pantalla el modal vuelve a abrirse: soltar acá dejaría
        // sin lock al guardado que la persona todavía puede confirmar.
        this.releaseFindingLock()
      }
    },

    confirmSaveNoReferences: function () {
      // User confirmed they want to proceed with no references
      this.saveReferencesList()
      // Close both modals
      this.$nextTick(() => {
        this.pendingSaveReferences = false
        this.$refs['modal-references-list'].hide()
      })
    },

    cancelNoReferencesWarning: function () {
      // User cancelled - restore original references selection
      this.selected_references = [...this.original_references]
      this.pendingSaveReferences = false
    },

    confirmSavePrivateProject: function () {
      // User confirmed they want to proceed, making the project private
      this.saveProjectAsPrivate()
      // Save the references (which will be empty)
      this.saveReferencesList()
      // Close both modals
      this.$nextTick(() => {
        this.pendingSaveReferences = false
        this.$refs['modal-references-list'].hide()
      })
    },

    cancelPrivateProjectWarning: function () {
      // User cancelled - restore original references selection
      this.selected_references = [...this.original_references]
      this.pendingSaveReferences = false
    },

    saveProjectAsPrivate: function () {
      // Update the project to be private
      const params = {
        is_public: false,
        private: true,
        license_type: '',
        public_type: 'private'
      }
      Api.patch(`/isoqf_projects/${this.project.id}`, params)
        .then(() => {
          // Emit an event to notify the parent component that the project status changed
          this.$emit('update-project-status')
        })
        .catch((error) => {
          console.log(Commons.printErrors(error))
        })
    },

    saveReferencesList: function () {
      if (!this.canEdit || this.isFindingReadOnly || !this.finding.id) {
        return
      }
      this.savingFinding = true
      this.$emit('set-load-references', true)
      this.$emit('set-busy', true)
      // Sólo `references`: el servidor lo espeja a la lista, que es donde lo lee el gate
      // de publicación y donde lo limpia detach_references.
      return Api.patch(`/isoqf_findings/${this.finding.id}/identity`, {
        references: this.selected_references
      })
        .then(() => {
          this.finishFindingSave()
          this.cleanReferencesList()
          this.$emit('get-lists')
          this.$emit('set-load-references', false)
          this.$notify.success(this.$t('notifications.saved'))
        })
        .catch((error) => {
          console.error(error)
          this.finishFindingSave()
          this.$emit('set-load-references', false)
          this.$emit('get-lists')
          this.notifySaveError(error)
        })
    },

    cleanReferencesList: function () {
      this.selected_references = []
      this.original_references = []
      this.finding = {}
      this.pendingSaveReferences = false
    }
  }
}
</script>

<style lang="scss" scoped>
.cursor-pointer {
  cursor: pointer;
}

.references-list-table {
  ::v-deep .custom-control-label {
    width: 100%;
    cursor: pointer;
    padding-top: 2px;
  }
}
</style>
