const TOAST_DEFAULTS = {
  solid: true,
  toaster: 'b-toaster-bottom-right'
}

const NotifyPlugin = {
  install (Vue) {
    Vue.mixin({
      beforeCreate () {
        const vm = this
        this.$notify = {
          success (message, options = {}) {
            vm.$bvToast.toast(message, {
              ...TOAST_DEFAULTS,
              title: vm.$t('notifications.success'),
              variant: 'success',
              autoHideDelay: 4000,
              ...options
            })
          },
          error (message, options = {}) {
            vm.$bvToast.toast(message, {
              ...TOAST_DEFAULTS,
              title: vm.$t('notifications.error'),
              variant: 'danger',
              autoHideDelay: 6000,
              ...options
            })
          },
          warning (message, options = {}) {
            vm.$bvToast.toast(message, {
              ...TOAST_DEFAULTS,
              title: vm.$t('notifications.warning'),
              variant: 'warning',
              autoHideDelay: 5000,
              ...options
            })
          }
        }
      }
    })
  }
}

export default NotifyPlugin
