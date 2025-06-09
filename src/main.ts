import './assets/main.css'
import './assets/tailwind.css';

import { createApp } from 'vue'
import App from './App.vue'

import PrimeVue from 'primevue/config'

// PrimeVue CSS
import 'primeicons/primeicons.css'

const app = createApp(App)
app.use(PrimeVue)
app.mount('#app')

