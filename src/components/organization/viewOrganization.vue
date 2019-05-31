<template>
  <div class="mt-4">
    <b-container>
      <b-row>
        <b-col cols="12" sm="3" class="text-center">
          <template v-if="organization.image">
            <b-img rounded="circle" width="150" height="150" v-bind:src="organization.image"></b-img>
          </template>
          <template v-else>
            <b-img rounded="circle" width="150" height="150" src="https://picsum.photos/125/125/?image=48"></b-img>
          </template>
        </b-col>
        <b-col cols="12" sm="9">
          <h2>{{organization.name}}</h2>
          <p>{{organization.description}}</p>
        </b-col>
      </b-row>
      <div class="my-4">
        <h3>Projects</h3>
        <b-row align-h="end">
          <b-col cols="6" sm="4" md="3" lg="2">
            <b-button variant="outline-primary" v-b-modal.new-project>{{ $t("Add new project") }}</b-button>
          </b-col>
        </b-row>
        <ul class="mt-5">
          <li class="my-3" v-for="project in organization.projects" v-bind:key="project.id">
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
        private: true
      },
      buffer_project_list: {
        id: null,
        name: '',
        description: '',
        private: true
      },
      organization: {
        id: 1,
        name: 'Epistemonikos',
        description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus quod dolores maxime necessitatibus quos excepturi praesentium, explicabo repudiandae earum? Saepe dolorem dicta, nostrum quasi vitae a voluptas non quisquam odio.',
        image: 'https://www.epistemonikos.cl/wp-content/uploads/2018/06/web-banner-produc-03.png',
        projects: [
          {
            id: 1,
            name: 'Project 01',
            description: '',
            lists:
              [
                { id: 1, name: 'Lista 01', description: '', private: true },
                { id: 2, name: 'Lista 02', description: '', private: false }
              ]
          },
          {
            id: 2,
            name: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.',
            lists:
              [
                { id: 3, name: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Nemo reiciendis sed libero soluta quasi, veritatis id quas porro commodi labore doloribus non esse repellendus similique nisi ipsum. Rem, nesciunt eum.', description: '', private: true },
                { id: 4, name: 'Lista 02', description: '', private: false }
              ]
          },
          {
            id: 3,
            name: 'Project 03',
            lists:
              [
                { id: 5, name: 'Lista 01', description: '', private: true },
                { id: 6, name: 'Lista 02', description: '', private: false }
              ]
          }
        ]
      }
    }
  },
  methods: {
    AddProject: function () {
      this.organization.projects.push(this.buffer_project)
      this.buffer_project = this.tmp_buffer_project
      this.$refs['new-project'].hide()
    },
    ModalAddList: function (idProject) {
      this.$refs['new-project-list'].show()
    },
    AddProjectList: function () {
      this.organization.projects[0].lists.push(this.buffer_project_list)
      this.buffer_project_list = this.tmp_buffer_project_list
      this.$refs['new-project-list'].hide()
    }
  }
}
</script>

<style>

</style>
