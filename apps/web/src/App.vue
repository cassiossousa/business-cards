<script setup lang="ts">
import AppNavbar from "./components/AppNavbar.vue";
</script>

<template>
  <AppNavbar />
  <main id="main" class="app-main">
    <div class="container">
      <RouterView />
    </div>
  </main>
</template>

<style scoped>
.app-main {
  padding-block: var(--space-10) var(--space-16);
}
</style>
