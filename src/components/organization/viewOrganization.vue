<template>
  <div class="mt-4">
    <b-container>
      <b-row>
        <b-col cols="12" sm="3" class="text-center">
          <template v-if="org.logo_url">
            <b-img rounded="circle" width="150" height="150" v-bind:src="org.logo_url"></b-img>
          </template>
          <template v-else>
            <b-img rounded="circle" width="150" height="150" src="https://picsum.photos/125/125/?image=48"></b-img>
          </template>
        </b-col>
        <b-col cols="12" sm="9">
          <h2>{{org.name}}</h2>
          <p>{{org.description}}</p>
        </b-col>
      </b-row>
      <div class="my-4">
        <h3>{{ $t("Projects") }}</h3>
        <b-row align-h="end">
          <b-col cols="12" class="text-right">
            <b-button variant="outline-primary" v-b-modal.new-project>{{ $t("Add new project") }}</b-button>
          </b-col>
        </b-row>
        <ul class="mt-5">
          <li class="my-3" v-for="project in org.projects" v-bind:key="project.id">
            {{project.name}}
            <font-awesome-icon icon="trash" pull="right" v-bind:title="$t('Remove')" style="color: #dc3545" />
            <font-awesome-icon @click="ModalAddList(project.id)" icon="plus-square" pull="right" v-bind:title="$t('Add')" />
            <ul v-if="project.lists">
              <li class="my-3" v-for="list in project.lists" v-bind:key="list.id">
                <b-link :to="{name: 'viewList', params: {id: list.id}}">{{list.name}}</b-link>
                <font-awesome-icon icon="trash" pull="right" v-bind:title="$t('Remove')" style="color: #dc3545" />
                <template v-if="list.private">
                  <font-awesome-icon icon="lock" pull="right" v-bind:title="$t('Private')" class="d-none d-sm-block" />
                </template>
                <template v-else>
                  <font-awesome-icon icon="globe" pull="right" v-bind:title="$t('Public')" class="d-none d-sm-block" />
                </template>
                <font-awesome-icon icon="clone" pull="right" v-bind:title="$t('Clone')" class="d-none d-sm-block" />
                <b-link :to="{name: 'editList', params: {id: list.id}}"><font-awesome-icon icon="edit" pull="right" v-bind:title="$t('Edit')"/></b-link>
              </li>
            </ul>
          </li>
        </ul>
      </div>
      <!-- modals -->
      <b-modal
        id="new-project"
        ref="new-project"
        @ok="AddProject">
        <b-alert
          :show="ui.dismissCounters.dismissCountDown"
          @dismiss-count-down="countDownChanged"
          variant="danger"
          v-if="ui.error.status">
            <p>[{{ui.error.status}}] - {{ui.error.statusText}}</p>
            <p>This alert will dismiss after {{ this.ui.dismissCounters.dismissCountDown }} seconds...</p>
          </b-alert>
        <b-form-group
          :label="$t('Project name')"
          label-for="input-project-name">
          <b-form-input
            id="input-project-name"
            type="text"
            required
            :placeholder="$t('Project name')"
            v-model="buffer_project.name"></b-form-input>
        </b-form-group>
        <b-form-group
          :label="$t('Description')"
          label-for="input-project-description">
          <b-form-textarea
            id="input-project-description"
            :placeholder="$t('Enter a description')"
            v-model="buffer_project.description"></b-form-textarea>
        </b-form-group>
        <b-form-group
          :label="$t('Visible')"
          label-for="select-project-status">
          <b-select
            id="select-project-status"
            v-model="buffer_project.private"
            :options="global_status"></b-select>
        </b-form-group>
      </b-modal>
      <b-modal
        id="new-project-list"
        ref="new-project-list"
        title="New iSoQF table"
        @ok="AddProjectList">
        <b-alert
          :show="ui.dismissCounters.dismissCountDown"
          @dismiss-count-down="countDownChanged"
          variant="danger"
          v-if="ui.error.status">
            <p>[{{ui.error.status}}] - {{ui.error.statusText}}</p>
            <p>This alert will dismiss after {{ this.ui.dismissCounters.dismissCountDown }} seconds...</p>
          </b-alert>
        <b-form-group
          :label="$t('Title of review')"
          label-for="input-project-list-name"
          description="Insert the title that you plan to use for this report or paper.">
          <b-form-input
            id="input-project-list-name"
            type="text"
            required
            :placeholder="$t('Title of review')"
            v-model="buffer_project_list.name"></b-form-input>
        </b-form-group>
        <b-form-group
          :label="$t('Description')"
          label-for="input-project-list-description">
          <b-form-textarea
            id="input-project-list-description"
            :placeholder="$t('Enter a description')"
            v-model="buffer_project_list.description"></b-form-textarea>
        </b-form-group>
        <b-form-group
          :label="$t('Authors')"
          label-for="input-project-authors"
          description="Authors separated by commas.">
          <b-form-input
            id="input-project-authors"
            :placeholder="$t('Authors of review')"
            v-model="buffer_project.authors"></b-form-input>
        </b-form-group>
        <b-form-group
          :label="$t('Review question')"
          label-for="input-project-review-question">
          <b-form-input
            id="input-project-review-question"
            :placeholder="$t('Insert main question that the review addresses')"
            v-model="buffer_project.review_question"></b-form-input>
        </b-form-group>
        <b-form-group
          :label="$t('Has this review been published?')"
          label-for="select-project-list-published-status">
          <b-select
            id="select-project-list-published-status"
            v-model="buffer_project_list.published_status"
            :options="yes_or_no"></b-select>
        </b-form-group>
        <b-form-group
          :label="$t('Is the iSoQF being completed by the review authors?')"
          label-for="select-project-list-completed-by-author-status">
          <b-select
            id="select-project-list-completed-by-author-status"
            v-model="buffer_project_list.complete_by_author"
            :options="yes_or_no"></b-select>
        </b-form-group>
        <b-form-group
          :label="$t('Visible')"
          label-for="select-project-list-status">
          <b-select
            id="select-project-list-status"
            v-model="buffer_project_list.private"
            :options="global_status"></b-select>
        </b-form-group>
      </b-modal>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data () {
    return {
      project_id: '',
      organization: '',
      ui: {
        error: {
          status: '',
          statusText: ''
        },
        dismissCounters: {
          dismisSec: 10,
          dismissCountDown: 0
        }
      },
      global_status: [
        { value: false, text: 'public' },
        { value: true, text: 'private' }
      ],
      yes_or_no: [
        { value: false, text: 'no' },
        { value: true, text: 'yes' }
      ],
      tmp_buffer_project: {
        id: null,
        name: '',
        description: '',
        private: true
      },
      tmp_buffer_project_list: {
        id: null,
        name: '',
        description: '',
        private: true,
        project_id: '',
        organization: '',
        review_question: '',
        published_status: false,
        complete_by_author: false
      },
      buffer_project: {
        id: null,
        name: '',
        description: '',
        private: true,
        organization: ''
      },
      buffer_project_list: {
        id: null,
        name: '',
        description: '',
        private: true,
        project_id: '',
        organization: '',
        review_question: '',
        published_status: false,
        complete_by_author: false
      },
      org: {
        _id: '',
        groups: [],
        hidden_base_templates: [],
        id: '',
        logo_url: '',
        name: '',
        organization: '',
        personal_organization: '',
        project_order: [],
        warning_message: '',
        plan: '',
        projects: []
      }
    }
  },
  mounted () {
    this.getOrganization()
    this.getProjectsAndLists()
  },
  methods: {
    getOrganization: function () {
      axios.get(`/api/organizations/${this.$route.params.id}`)
        .then((response) => {
          this.org = {...response.data}
        })
        .catch((error) => {
          console.log(error)
        })
    },
    AddProject: function () {
      axios.defaults.withCredentials = true
      axios.defaults.headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': document.location.origin
      }
      axios.post('/api/isoqf_projects', this.buffer_project, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': document.location.origin
        }
      })
        .then((response) => {
          this.buffer_project = this.tmp_buffer_project
          this.$refs['new-project'].hide()
          this.getProjectsAndLists()
        })
        .catch((error) => {
          this.ui.dismissCounters.dismissCountDown = this.ui.dismissCounters.dismisSec
          console.log('error', error)
          this.$refs['new-project'].show()
        })
    },
    countDownChanged (dismissCountDown) {
      this.ui.dismissCounters.dismissCountDown = dismissCountDown
    },
    ModalAddList: function (idProject) {
      this.buffer_project_list.project_id = idProject
      this.buffer_project_list.organization = this.$route.params.id
      this.$refs['new-project-list'].show()
    },
    AddProjectList: function () {
      axios.post('/api/isoqf_lists', this.buffer_project_list, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': document.location.origin
        }
      })
        .then((response) => {
          this.buffer_project = this.tmp_buffer_project
          this.$refs['new-project-list'].hide()
          // get project lists
          this.buffer_project_list = this.tmp_buffer_project_list
          this.getProjectsAndLists()
        })
        .catch((error) => {
          this.ui.dismissCounters.dismissCountDown = this.ui.dismissCounters.dismisSec
          console.log('error list', error)
          this.$refs['new-project-list'].show()
        })
    },
    getProjectsAndLists: function () {
      axios.all([
        axios.get('/api/isoqf_projects', {
          params: {
            organization: this.$route.params.id
          }
        }),
        axios.get('/api/isoqf_lists', {
          params: {
            organization: this.$route.params.id
          }
        })
      ]).then(axios.spread((projects, lists) => {
        this.$set(this.org, 'projects', projects.data)
        var projectlist = lists.data

        projects.data.forEach(function (v, k) {
          projects.data[k].lists = []
          // this.$set(projects.data[k], 'list', [])
          for (const pos in projectlist) {
            if (projects.data[k].id === projectlist[pos].project_id) {
              projects.data[k].lists.push(projectlist[pos])
            }
          }
        })
      }))
    }
  }
}
</script>

<style>

</style>
