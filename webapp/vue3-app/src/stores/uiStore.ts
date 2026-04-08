import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const isGlobalLoading = ref(false)
  const appTitle = ref('Kinh Lạc Y Viện')

  function setGlobalLoading(value: boolean) {
    isGlobalLoading.value = value
  }

  return {
    appTitle,
    isGlobalLoading,
    setGlobalLoading,
  }
})
