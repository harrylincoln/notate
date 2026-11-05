import { createApp } from 'vue';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import App from './App.vue';
import { initializeAnalytics } from './utils/analytics';

createApp(App).mount('#root');
initializeAnalytics();

// Preserve the old application's service-worker retirement behaviour.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      if (registration.active?.scriptURL === `${window.location.origin}/service-worker.js`) {
        void registration.unregister();
      }
    }
  }).catch(() => { /* Offline or restricted browsers can still use the converter. */ });
}
