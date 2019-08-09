<template>
  <b-card
    class="d-none d-sm-flex"
    bg-variant="light">
    <b-row>
      <b-col
        class="my-1"
        cols="12"
        sm="4">
        <b-button
          block
          @click="dropAction"
          variant="outline-danger">
            <font-awesome-icon icon="table" />
            Delete table
        </b-button>
      </b-col>
      <b-col
        class="my-1"
        cols="12"
        sm="4">
        <b-button
          block
          @click="editAction"
          variant="outline-primary">
            <font-awesome-icon icon="table" />
            Edit table
        </b-button>
      </b-col>
      <b-col
        class="my-1"
        cols="12"
        sm="4">
        <b-button
          block
          @click="addAction"
          variant="outline-success">{{$t('Add data')}}</b-button>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
export default {
  name: 'ActionTable',
  props: {
    dropAction: '',
    editAction: '',
    addAction: ''
  }
}
</script>

<style>

</style>
