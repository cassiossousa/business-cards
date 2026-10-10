<script setup lang="ts">
import ProjectListPage from "./components/ProjectListPage.vue";
</script>

<template>
  <header class="app-header">
    <div class="container">
      <h1 class="app-title">Business Cards</h1>
      <p class="app-subtitle">Create and manage your card projects</p>
    </div>
  </header>
  <main id="main" class="app-main">
    <div class="container">
      <ProjectListPage />
    </div>
  </main>
</template>
