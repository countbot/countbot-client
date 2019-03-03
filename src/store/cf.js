// src/store/cf.js

/* eslint-disable no-shadow, no-return-assign, no-param-reassign */

import crossfilter from 'crossfilter2';

const state = {
  cf: {
    cf: null,
    userDim: null,
    textDim: null,
    dateDim: null,
    dateGroup: null,
    hourDim: null,
    hourGroup: null,
    count: 0,
  },
};
const getters = {
  CF: state => state.cf,
};
const mutations = {
  SET_CF: (state, payload) => {
    state.cf.cf = crossfilter(payload);
    state.cf.userDim = state.cf.cf.dimension(d => d.p.n);
    state.cf.userGroup = state.cf.userDim.group();
    state.cf.textDim = state.cf.cf.dimension(d => d.te);
    state.cf.dateDim = state.cf.cf.dimension(d => d.ti);
    state.cf.dateGroup = state.cf.dateDim.group(d => d.setHours(0, 0, 0, 0));
    state.cf.hourDim = state.cf.cf.dimension(d => d.ti.getHours() + d.ti.getMinutes() / 60);
    state.cf.hourGroup = state.cf.hourDim.group(Math.floor);
    state.cf.count += 1;
  },
  ADD_RECORDS: (state, payload) => {
    state.cf.cf.add(payload);
    state.cf.count += 1;
  },
  FILTER: (state, payload) => {
    // eslint-disable-next-line arrow-body-style
    state.cf[payload.dim].filterFunction((d) => {
      if (d) return d.toLowerCase().includes(payload.filter.toLowerCase());
      if (payload.filter === '') return 1;
      return 0;
    });
    state.cf.count += 1;
  },
  FILTER_RANGE: (state, payload) => {
    // eslint-disable-next-line arrow-body-style
    state.cf[payload.dim].filterRange(payload.filter);
    state.cf.count += 1;
  },
  FILTER_ARRAY: (state, payload) => {
    // eslint-disable-next-line arrow-body-style
    state.cf[payload.dim].filterAll();
    state.cf[payload.dim].filterFunction(d => payload.filter.indexOf(d) > -1);
    state.cf.count += 1;
  },
  CLEAR_FILTER: (state, payload) => {
    // eslint-disable-next-line arrow-body-style
    state.cf[payload.dim].filterAll();
    state.cf.count += 1;
  },
};
const actions = {
  SET_CF: (context, payload) => context.commit('SET_CF', payload),
  ADD_RECORDS: (context, payload) => context.commit('ADD_RECORDS', payload),
  FILTER: (context, payload) => context.commit('FILTER', payload),
  FILTER_RANGE: (context, payload) => context.commit('FILTER_RANGE', payload),
  FILTER_ARRAY: (context, payload) => context.commit('FILTER_ARRAY', payload),
  CLEAR_FILTER: (context, payload) => context.commit('CLEAR_FILTER', payload),
};

export default {
  state,
  getters,
  mutations,
  actions,
};

/* eslint-enable no-shadow, no-return-assign, no-param-reassign */
