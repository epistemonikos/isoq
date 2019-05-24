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
            <b-button variant="outline-primary">Add new project</b-button>
          </b-col>
        </b-row>
        <ul class="mt-5">
          <li class="my-3" v-for="project in organization.projects" v-bind:key="project.id">
            {{project.name}}
            <font-awesome-icon icon="trash" pull="right" title="Remove" style="color: #dc3545" />
            <font-awesome-icon icon="plus-square" pull="right" title="Add" />
            <ul v-if="project.lists">
              <li class="my-3" v-for="list in project.lists" v-bind:key="list.id">
                <b-link :to="{name: 'viewList', params: {id: list.id}}">{{list.name}}</b-link>
                <font-awesome-icon icon="trash" pull="right" title="Remove" style="color: #dc3545" />
                <template v-if="list.private">
                  <font-awesome-icon icon="lock" pull="right" title="Private" class="d-none d-sm-block" />
                </template>
                <template v-else>
                  <font-awesome-icon icon="globe" pull="right" title="Public" class="d-none d-sm-block" />
                </template>
                <font-awesome-icon icon="clone" pull="right" title="Clone" class="d-none d-sm-block" />
                <b-link :to="{name: 'editList', params: {id: list.id}}"><font-awesome-icon icon="edit" pull="right" title="Edit"/></b-link>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </b-container>
  </div>
</template>

<script>
export default {
  data () {
    return {
      organization: {
        id: 1,
        name: 'Epistemonikos',
        description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus quod dolores maxime necessitatibus quos excepturi praesentium, explicabo repudiandae earum? Saepe dolorem dicta, nostrum quasi vitae a voluptas non quisquam odio.',
        image: 'https://www.epistemonikos.cl/wp-content/uploads/2018/06/web-banner-produc-03.png',
        projects: [
          {
            id: 1,
            name: 'Project 01',
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
  }
}
</script>

<style>

</style>
