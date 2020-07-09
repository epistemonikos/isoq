<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="pt-5">
        <b-row align-h="end">
          <b-col
            cols="12"
            md="11" class="toDoc">
            <h2 id="project-title">{{ project.name }}</h2>
          </b-col>
          <b-col
            cols="12"
            md="1"
            class="text-right">
            <b-link class="d-print-none">
              <font-awesome-icon icon="long-arrow-alt-left" v-bind:title="$t('back')" />
              {{ $t('back') }}
            </b-link>
          </b-col>
        </b-row>
        <b-nav id="tabsTitle" tabs fill class="pt-5">
          <b-nav-item
            :active="(tabOpened === 0) ? true : false"
            @click="tabOpened=0">Project properties</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 1) ? true : false"
            @click="tabOpened=1">My Data</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 2) ? true : false"
            @click="tabOpened=2">iSoQf</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 3) ? true : false"
            @click="tabOpened=3">Guidance on applying CERQual</b-nav-item>
        </b-nav>
      </b-container>
    </b-container>
    <b-container class="mb-5">
      <b-tabs
        id="tabsContent"
        content-class="mt-3"
        fill
        v-model="tabOpened">
        <b-tab>
          <b-row>
            <b-col
              cols="12"
              class="mb-2">
              <h2>Project properties</h2>
            </b-col>
          </b-row>
          <b-row>
            <b-col
              cols="12">
              <organizationForm
                :formData="project"
                :canWrite="false">
              </organizationForm>
            </b-col>
          </b-row>
        </b-tab>
        <b-tab>
          <h4 class="mt-5">
            Study inclusion and exclusion criteria used in the review
          </h4>
          <b-container>
            <b-row>
              <b-col
                cols="12"
                md="6"
                class="pl-0">
                <criteria
                  v-if="ui.project.show_criteria"
                  label="Inclusion criteria"
                  description="Please enter the study inclusion criteria used in the review"
                  :isEnabled="false"
                  criteria="inclusion"
                  :dataTxt="project.inclusion">
                </criteria>
              </b-col>
              <b-col
                cols="12"
                md="6"
                class="pr-0">
                <criteria
                  v-if="ui.project.show_criteria"
                  label="Exclusion criteria"
                  description="Please enter the study exclusion criteria used in the review"
                  :isEnabled="false"
                  criteria="exclusion"
                  :dataTxt="project.exclusion">
                </criteria>
              </b-col>
            </b-row>
          </b-container>
        </b-tab>
        <b-tab>2</b-tab>
        <b-tab>
          <content-guidance></content-guidance>
        </b-tab>
      </b-tabs>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import contentGuidance from '../contentGuidance'
import organizationForm from '../organization/organizationForm'
import Criteria from '../Criteria'

export default {
  components: {
    'content-guidance': contentGuidance,
    organizationForm,
    'criteria': Criteria
  },
  data () {
    return {
      tabOpened: 2,
      ui: {
        project: {
          show_criteria: false
        }
      },
      project: {
        name: ''
      },
      lists: [],
      list_categories: {
        options: [],
        selected: null
      },
      references: [],
      cerqual_confidence: [
        { value: 0, text: 'High confidence' },
        { value: 1, text: 'Moderate confidence' },
        { value: 2, text: 'Low confidence' },
        { value: 3, text: 'Very low confidence' }
      ],
      table_settings: {
        isBusy: true,
        currentPage: 1,
        perPage: 5,
        filter: null,
        totalRows: 1,
        filterOn: ['isoqf_id', 'name', 'cerqual_option', 'cerqual_explanation', 'ref_list', 'category_name', 'status', 'explanation']
      }
    }
  },
  mounted () {
    this.getProject()
  },
  methods: {
    getProject: function () {
      const params = {
        organization: this.$route.params.org_id
      }
      axios.get(`/api/isoqf_projects/${this.$route.params.isoqf_id}`, { params })
        .then((response) => {
          this.project = response.data
          if (!Object.prototype.hasOwnProperty.call(this.project, 'inclusion')) {
            this.project.inclusion = ''
          }
          if (!Object.prototype.hasOwnProperty.call(this.project, 'exclusion')) {
            this.project.exclusion = ''
          }
          this.ui.project.show_criteria = true
          this.getLists() // summary review
          // this.getCharacteristics()
          // this.getMethodological()
        })
        .catch((error) => {
          console.log(error)
          // this.printErrors(error)
        })
    },
    getLists: function () { // related to summary review of a finding
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.isoqf_id
      }
      axios.get('/api/isoqf_lists', { params })
        .then((response) => {
          let data = JSON.parse(JSON.stringify(response.data))
          data.sort(function (a, b) {
            if (a.sort < b.sort) { return -1 }
            if (a.sort > b.sort) { return 1 }
            return 0
          })
          let cnt = 1
          for (let d of data) {
            d.sort = cnt
            d.isoqf_id = cnt
            cnt++
          }
          let _data = data

          if (_data.length) {
            // let lists = JSON.parse(JSON.stringify(this.lists))
            for (let list of _data) {
              if (!Object.prototype.hasOwnProperty.call(list, 'evidence_profile')) {
                list.status = 'unfinished'
                list.explanation = 'without_explanation'
              } else {
                list.status = 'completed'
                list.explanation = 'with_explanation'
                if (list.evidence_profile.cerqual.option === null) {
                  list.status = 'unfinished'
                }
                if (list.evidence_profile.cerqual.explanation === '') {
                  list.explanation = 'without_explanation'
                }
              }
              if (!Object.prototype.hasOwnProperty.call(list, 'references')) {
                list.references = []
              }
              if (!Object.prototype.hasOwnProperty.call(list, 'notes')) {
                list.notes = ''
              }
              if (!Object.prototype.hasOwnProperty.call(list, 'category')) {
                list.category = null
              } else {
                list.category_name = ''
                list.category_extra_info = ''
                if (this.list_categories.options.length) {
                  for (let category of this.list_categories.options) {
                    if (list.category === category.value) {
                      list.category_name = category.text
                      list.category_extra_info = category.extra_info
                    }
                  }
                }
              }
              list.cerqual_option = ''
              if (list.cerqual.option != null) {
                list.cerqual_option = this.cerqual_confidence[list.cerqual.option].text
              }
              list.cerqual_explanation = list.cerqual.explanation
              list.ref_list = ''
              list.raw_ref = []
              for (let r of this.references) {
                for (let ref of list.references) {
                  if (ref === r.id) {
                    list.ref_list = list.ref_list + this.parseReference(r, true)
                    list.raw_ref.push(r)
                  }
                }
              }
            }

            if (this.list_categories.options.length) {
              let categories = []
              for (let category of this.list_categories.options) {
                categories.push({'name': category.text, 'value': category.value, 'items': []})
              }

              for (let list of _data) {
                if (categories.length) {
                  for (let element of categories) {
                    if (element.value === list.category) {
                      element.items.push(
                        {
                          'isoqf_id': list.isoqf_id,
                          'name': list.name,
                          'cerqual_option': list.cerqual_option,
                          'cerqual_explanation': list.cerqual_explanation,
                          'ref_list': list.ref_list,
                          'sort': list.sort,
                          'notes': list.notes
                        }
                      )
                    }
                  }
                }
              }
              let newArr = []
              for (let cat of categories) {
                newArr.push({'is_category': true, 'name': cat.name})
                for (let item of cat.items) {
                  newArr.push(item)
                }
              }
              newArr.sort(function (a, b) {
                if (a.sort < b.sort) {
                  return -1
                }
                if (a.sort > b.sort) {
                  return 1
                }
                return 0
              })
              this.lists = newArr
            } else {
              let items = []
              for (let list of _data) {
                items.push(
                  {
                    'isoqf_id': list.isoqf_id,
                    'name': list.name,
                    'cerqual_option': list.cerqual_option,
                    'cerqual_explanation': list.cerqual_explanation,
                    'ref_list': list.ref_list,
                    'sort': list.sort,
                    'notes': list.notes
                  }
                )
              }
              items.sort(function (a, b) {
                if (a.sort < b.sort) {
                  return -1
                }
                if (a.sort > b.sort) {
                  return 1
                }
                return 0
              })
              this.lists = items
            }
          }
          this.table_settings.isBusy = false
          this.table_settings.totalRows = _data.length
        })
        .catch((error) => {
          console.log(error)
          // this.printErrors(error)
        })
    }
  }
}
</script>
