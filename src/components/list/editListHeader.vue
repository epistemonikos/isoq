<template>
  <b-container fluid class="workspace-header">
    <b-container class="py-5">
      <b-row>
        <b-col cols="12" class="text-right d-print-none">
          <!-- disabled for v1 -->
          <!--<b-link class="return" @click="returnTo()">-->
          <b-link class="return" :to="{name: 'viewProject', params: {org_id: organizationId, id: projectId}, query: {hash: `a-${list.id}`}}">
            <font-awesome-icon icon="long-arrow-alt-left" :title="$t('back')" />
            return to ISoQ table
          </b-link>
        </b-col>
      </b-row>
      <videoHelp txt="GRADE-CERQual Assessment Worksheet" tag="h2-worksheet" urlId="451100482"></videoHelp>
      <h3 class="mt-4 mt-sm-2" v-if="mode==='edit'"><span class="pre-title">Review finding:</span> <span class="title-finding">{{name}}</span></h3>
      <h3 class="mt-4 mt-sm-2" v-if="mode==='view'">&nbsp;</h3>
    </b-container>
  </b-container>
</template>

<script>
const videoHelp = () => import(/* webpackChunkName: "videohelp" */'../videoHelp')

export default {
  name: 'editListHeader',
  props: {
    organizationId: String,
    projectId: String,
    name: String,
    mode: String,
    list: Object
  },
  components: {
    videoHelp
  }
}
</script>

<style>

</style>
