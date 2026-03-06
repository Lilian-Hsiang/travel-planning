<template>
  <div>
    <NuxtPage />

    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="toast.type"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
const { toasts } = useToast()
</script>

<style scoped>
:global(html, body, #__nuxt) {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background: #fff5e3;
}

.toast-container {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 2000;
}

.toast {
  min-width: 220px;
  padding: 10px 14px;
  border-radius: 8px;
  color: #0b1117;
  background: #e5ecf6;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  font-weight: 600;
  letter-spacing: 0.2px;
  text-align: center;
}

.toast.success {
  background: #e3f9e6;
  color: #0f5132;
}

.toast.error {
  background: #fde6e6;
  color: #842029;
}
</style>