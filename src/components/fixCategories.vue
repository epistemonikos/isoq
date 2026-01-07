<template>
  <div></div>
</template>

<script>
import Api from '@/utils/Api'

export default {
  name: 'fixCategories',
  data: function () {
    return {
      oldCategoryId: null,
      lenghtOptions: 0,
      counter: 0
    }
  },
  mounted () {
    // this.getCategoryList()
    this.getAllCategories()
  },
  methods: {
    getAllCategories: function () {
      Api.get('/isoqf_list_categories')
        .then((response) => {
          for (let data of response.data) {
            if (Object.prototype.hasOwnProperty.call(data, 'options')) {
              if (data.options.length) {
                const options = data.options
                for (let option of options) {
                  const category = {
                    text: option.text,
                    extra_info: option.extra_info,
                    value: option.value,
                    organization: data.organization,
                    project_id: data.project_id
                  }
                  this.createCategory(category)
                }
              }
            }
          }
        })
    },
    getCategoryList: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      Api.get('/isoqf_list_categories', params)
        .then((response) => {
          for (let data of response.data) {
            if (Object.prototype.hasOwnProperty.call(data, 'options')) {
              if (data.options.length) {
                this.oldCategoryId = data.id
                this.lenghtOptions = data.options.length
                const options = data.options
                for (let option of options) {
                  const category = {
                    text: option.text,
                    extra_info: option.extra_info,
                    value: option.value,
                    organization: this.$route.params.org_id,
                    project_id: this.$route.params.id
                  }
                  this.createCategory(category)
                }
              }
            }
          }
        })
    },
    createCategory: function (category) {
      Api.post('/isoqf_list_categories', category)
        .then((response) => {
          const newCategory = {
            id: response.data.id,
            value: response.data.value,
            organization: response.data.organization,
            project_id: response.data.project_id
          }
          this.getLists(newCategory)
          // this.counter++
        })
    },
    getLists: function (newCategory) {
      const params = {
        organization: newCategory.organization,
        project_id: newCategory.project_id
      }
      Api.get('/isoqf_lists', params)
        .then((response) => {
          if (response.data.length) {
            for (let list of response.data) {
              if (list.category === newCategory.value) {
                Api.patch(`/isoqf_lists/${list.id}`, {category: newCategory.id})
                  .then(() => {
                    console.log(`list id ${list.id} updated!`)
                  })
              }
            }
          }
        })
    },
    removeOldCategoryContainer: function () {
      Api.delete('/isoqf_list_categories/' + this.oldCategoryId)
    }
  },
  watch: {
    counter: function () {
      if (this.counter === this.lenghtOptions) {
        this.removeOldCategoryContainer()
      }
    }
  }
}
</script>
