<template>
  <div class="mt-4">
    <b-container>
      <b-row align-h="end">
        <b-col cols="12" class="text-right">
          <b-link :to="{name: 'editList', params: {id: list.id}}" class="btn btn-outline-primary">{{ $t('Edit') }}</b-link>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12">
          <h2>{{list.title}}</h2>
          <p>{{list.description}}</p>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
export default {
  data () {
    return {
      list: {
        id: 1,
        title: 'title',
        description: 'description',
        sources: [
          {id: 1, title: 'title source 1', authors: [{id: 1, name: 'name author'}], year: 2019, objective: 'lorem ipsum'},
          {id: 2, title: 'title source 2', authors: [{id: 1, name: 'name author'}], year: 2018, objective: 'lorem ipsum'}
        ]
      }
    }
  }
}
</script>

<style>

</style>
