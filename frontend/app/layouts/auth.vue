<template>
  <div class="auth-layout">
    <slot />
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #ffffff 50%, #e8f4fd 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
