<template>
  <div>
    <b-row>
      <b-col
        cols="12">
        <b-row
          class="d-print-none justify-content-end mb-2">
          <b-col
            v-if="mode==='view'"
            cols="12"
            md="3"
            xl="3">
            <b-dropdown
              id="export-button"
              class="mt-1"
              block
              variant="outline-secondary"
              right
              text="Export">
              <b-dropdown-item @click="generateWord">to MS Word</b-dropdown-item>
              <b-dropdown-item @click="generateRIS">the references</b-dropdown-item>
            </b-dropdown>
          </b-col>
          <b-col
            v-if="mode==='view'"
            cols="12"
            md="3"
            xl="3">
              <b-button
                class="mt-1"
                variant="outline-info"
                block
                @click="printiSoQ">
                Print or save as PDF
              </b-button>
          </b-col>
          <b-col
            v-if="mode==='view' && !preview"
            cols="12"
            md="3"
            xl="3">
              <b-button
                class="mt-1"
                @click="changeMode"
                variant="primary"
                block>
                <font-awesome-icon icon="edit"></font-awesome-icon>
                Edit
              </b-button>
          </b-col>
          <b-col
            v-if="mode==='edit'"
            cols="12"
            md="3"
            xl="3">
              <b-button
                v-if="permissions"
                class="mt-1"
                @click="$refs.publishModal.show()"
                :variant="(project.is_public) ? 'outline-primary' : 'primary'"
                block
                v-b-tooltip.hover title="Click here when you have finished your iSoQ to select what you would like published to the publicly available iSoQ database">
                <span v-if="project.is_public">Published</span><span v-else>Publish</span>
              </b-button>
          </b-col>
          <b-col
            v-if="mode==='edit'"
            cols="12"
            md="3"
            xl="3">
              <b-button
                class="mt-1"
                @click="changeMode"
                variant="outline-success"
                block
                v-b-tooltip.hover title="Click to enter view mode where you can export or print">
                Print or Export
              </b-button>
          </b-col>
        </b-row>
      </b-col>
    </b-row>

    <PublishProjectModal
      ref="publishModal"
      :project="project"
      :ui="ui"
      :workspace-id="$route.params.org_id"
      @uiPublishShowLoader="emitUiPublishShowLoader"
      @getProject="emitGetProject"
    />
  </div>
</template>

<script>
import { generateWordDocument } from '@/utils/exportWord'
import { exportToRIS } from '@/utils/exportRIS'
import PublishProjectModal from './PublishProjectModal'

export default {
  name: 'actionButtons',
  props: {
    mode: {
      type: String,
      required: false,
      default: ''
    },
    preview: {
      type: Boolean,
      default: false
    },
    project: Object,
    permissions: Boolean,
    ui: Object,
    lists: Array,
    findings: Array,
    references: Array,
    charsOfStudies: Object,
    methodologicalTableRefs: Object,
    listsPrintVersion: Array,
    selectOptions: Array,
    cerqualConfidence: Array,
    printableItems: Array
  },
  components: {
    PublishProjectModal
  },
  methods: {
    generateWord () {
      generateWordDocument(
        this.project,
        this.findings,
        this.references,
        this.listsPrintVersion,
        this.printableItems,
        this.cerqualConfidence,
        this.selectOptions,
        this.$route.name,
        this.project.public_type
      )
    },
    generateRIS () {
      exportToRIS(this.references)
    },
    printiSoQ: function () {
      window.print()
    },
    changeMode: function () {
      this.$emit('changeMode', (this.mode === 'edit') ? 'view' : 'edit')
      if (this.mode === 'view') {
        this.$emit('changeTableSettings', {perPage: this.lists.length, currentPage: 1})
      } else {
        this.$emit('changeTableSettings', {perPage: 5, currentPage: 1})
      }
    },
    emitUiPublishShowLoader (val) {
      this.$emit('uiPublishShowLoader', val)
    },
    emitGetProject () {
      this.$emit('getProject')
    }
  }
}
</script>

<style>

</style>
