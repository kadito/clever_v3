import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { clerkPlugin } from '@clerk/vue'

// Get Clerk Publishable Key from environment
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Add VITE_CLERK_PUBLISHABLE_KEY to your .env file')
}

// Pinia store
const pinia = createPinia()

// Create and mount the app
const app = createApp(App)
app.use(clerkPlugin, { 
  publishableKey: PUBLISHABLE_KEY,
  signInForceRedirectUrl: '/'
})
app.use(router)
app.use(pinia)
app.mount('#app') 