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
        @ok="AddProjectList">
        <b-form-group
          :label="$t('Project name')"
          label-for="input-project-list-name">
          <b-form-input
            id="input-project-list-name"
            type="text"
            required
            :placeholder="$t('Project name')"
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
          label-for="input-project-authors">
          <b-form-input
            id="input-project-authors"
            :placeholder="$t('Insert authors separated by commas')"
            v-model="buffer_project.authors"></b-form-input>
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
      global_status: [
        { value: false, text: 'public' },
        { value: true, text: 'private' }
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
        private: true
      },
      buffer_project: {
        id: null,
        name: '',
        description: '',
        private: true,
        organization: '7b9c88ec182ca383'
      },
      buffer_project_list: {
        id: null,
        name: '',
        description: '',
        private: true
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
    this.getProjects()
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
    getProjects: function () {
      axios.get('/api/isoqf_projects', {
        params: {
          organization: this.$route.params.id
        }
      })
        .then((response) => {
          console.log('projects', response)
        })
        .catch((error) => {
          console.log(error)
        })
    },
    AddProject: function () {
      // this.org.projects.push(this.buffer_project)
      axios.post('/api/isoqf_projects', this.buffer_project)
        .then((response) => {
          this.buffer_project = this.tmp_buffer_project
          this.$refs['new-project'].hide()
          this.getProjects()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    ModalAddList: function (idProject) {
      this.$refs['new-project-list'].show()
    },
    AddProjectList: function () {
      this.org.projects[0].lists.push(this.buffer_project_list)
      this.buffer_project_list = this.tmp_buffer_project_list
      this.$refs['new-project-list'].hide()
    }
  }
}
</script>

<style>

</style>
