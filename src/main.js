import { createApp } from 'vue'
import App from './App.vue'

let init = false;

function initializeApp() {
    if (!init) {
        let app = createApp(App).mount('#app');
    }
    init = true;
}

window.initializeApp = initializeApp;
