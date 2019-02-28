// src/store/index.js

import Vue from 'vue';
import Vuex from 'vuex';
import cf from './cf';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {},
  getters: {},
  mutations: {},
  actions: {},

  modules: {
    cf,
  },

  strict: process.env.NODE_ENV !== 'production',
});
