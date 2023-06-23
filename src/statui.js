import { createApp } from 'vue'
import StatUi from './StatUi.vue'
import HttpGetPlugin from './HttpGetPlugin'

let app = createApp(StatUi);
app.use(HttpGetPlugin, {});
app.mount('#app');
