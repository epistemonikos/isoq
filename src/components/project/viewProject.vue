<template>
  <div class="mt-4">
    <b-container>
      <b-row align-h="end">
        <b-col cols="12" class="text-right">
          <b-link @click="$router.go(-1)">
            <font-awesome-icon icon="long-arrow-alt-left" v-bind:title="$t('back')" />
            {{ $t('back') }}
          </b-link>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12">
          <h1>{{project.name}}</h1>
          <p>{{project.description}}</p>
          <h5>Review question</h5>
          <p>{{project.review_question}}</p>
          <h5>Authors of the review</h5>
          <ul>
            <li v-for="(author, index) in project.authors.split(',')" :key="index">{{author.trim()}}</li>
          </ul>
          <h5>Has the review been published</h5>
          <p>{{(project.published_status) ? 'Yes': 'No'}}</p>
          <h5>Is the iSoQF being completed by the review authors?</h5>
          <p>{{(project.complete_by_author) ? 'Yes' : 'No'}}</p>
        </b-col>
        <b-col cols="12">
          <template v-if="lists.length">
            <b-table
              :fields="table_settings.fields"
              :items="lists">
              <template slot="name" slot-scope="data">
                <b-link :to="{name: 'editList', params: {id: data.item.id}}">{{data.item.name}}</b-link>
              </template>
            </b-table>
          </template>
          <template v-else>
            <p>No data found. try to add summarized review finding.</p>
          </template>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data () {
    return {
      project: {
        name: '',
        authors: ''
      },
      lists: [],
      table_settings: {
        fields: [
          {
            key: 'name',
            label: 'Summarized review finding'
          },
          {
            key: 'm',
            label: 'CERQual Assessment of confidence'
          },
          {
            key: 'mm',
            label: 'Explanation of CERQual Assessment'
          },
          {
            key: 'mmm',
            label: 'References'
          }
        ]
      }
    }
  },
  mounted () {
    this.getProject()
  },
  methods: {
    getProject: function () {
      let params = {
        organization: this.$route.params.org_id
      }
      axios.get(`/api/isoqf_projects/${this.$route.params.id}`, params)
        .then((response) => {
          this.project = response.data
          this.getLists() // summary review
        })
        .catch((error) => {
          console.log(error)
        })
    },
    getLists: function () { // related to summary review of a finding
      let params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get(`/api/isoqf_lists`, params)
        .then((response) => {
          this.lists = response.data
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
