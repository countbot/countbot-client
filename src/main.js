import Vue from 'vue';
import VueMq from 'vue-mq';
import App from './App.vue';
import router from './router';
import store from './store';

Vue.use(VueMq, {
  breakpoints: {
    xs: 576,
    sm: 768,
    md: 992,
    lg: 1200,
    xl: Infinity,
  },
});

Vue.config.productionTip = false;

new Vue({
  store,
  router,
  render: h => h(App),
}).$mount('#app');
