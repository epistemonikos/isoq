<template>
    <div>
      <b-container>
        <b-row>
          <b-col class="pt-5">
            <h2>Remove account</h2>
            <p>Nunc sed auctor sapien, vitae tincidunt sapien. Sed gravida nibh vitae placerat rutrum. Phasellus lobortis massa non felis rhoncus sagittis. Sed maximus, neque sit amet varius vulputate, ante lectus maximus sapien, et placerat leo ante eget risus. Nulla in turpis aliquam, mollis augue non, pulvinar mauris. Cras ultrices, ex ut viverra vehicula, libero quam consequat est, vel semper turpis mauris quis massa. Ut iaculis, ante ultricies dignissim malesuada, massa dolor pellentesque eros, vel semper lectus nisi eget lectus. Praesent viverra lectus sit amet ornare commodo. Fusce venenatis rhoncus mauris eget pellentesque. Nunc ornare velit vel tristique hendrerit. Ut vitae magna sed leo pretium egestas.</p>
            <p>If you accept, your data will be destroyed</p>
            <b-button
              variant="danger"
              @click="removeData">I want to remove all my data!</b-button>
          </b-col>
        </b-row>
      </b-container>
    </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'RemoveAccount',
  data () {
    return {
      org_id: this.$store.state.user.personal_organization
    }
  },
  methods: {
    removeData () {
      axios.delete('/delete_account/' + this.$store.state.user.personal_organization)
    }
  }
}
</script>
