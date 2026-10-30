<template>
  <div class="container-fluid mt-4 mb-5">
    <h2 class="mb-4">{{ $t('admin.panel_title') }}</h2>
    <b-tabs content-class="mt-3">
      <b-tab :title="$t('admin.tab_users')" active>
        <admin-users-tab />
      </b-tab>
      <b-tab :title="$t('admin.tab_stats')" lazy>
        <admin-stats-tab />
      </b-tab>
      <b-tab :title="$t('admin.tab_audit')" lazy>
        <admin-audit-tab />
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
import AdminUsersTab from './tabs/AdminUsersTab'
import AdminStatsTab from './tabs/AdminStatsTab'
import AdminAuditTab from './tabs/AdminAuditTab'

export default {
  components: { AdminUsersTab, AdminStatsTab, AdminAuditTab }
}
</script>
