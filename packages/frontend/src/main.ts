import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import global styles
import './assets/main.css'

// Create Vue app instance
const app = createApp(App)

// Install plugins
app.use(createPinia())
app.use(router)

// Mount the app
app.mount('#app')
