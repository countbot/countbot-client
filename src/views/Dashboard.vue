<template>
  <div class="dashboard container-fluid">
    <div class="row">
      <div class="col text-center">
        <h1>Werewolves Dashboard</h1>
        <p v-if="cf.cf.groupAll().value() === cf.cf.size()">
          {{ cf.cf.size() }} messages
        </p>
        <p v-else>
          {{ cf.cf.groupAll().value() }} of {{ cf.cf.size() }} messages selected
        </p>
        <button
          type="button"
          class="btn btn-sm btn-secondary float-right"
          @click="sortGames = !sortGames"
        >
          Sort Games
        </button>
        <button
          type="button"
          class="btn btn-sm btn-secondary float-right"
          @click="sortUsers = !sortUsers"
        >
          Sort Users
        </button>
      </div>
    </div>
    <div
      v-if="cf.count-1"
      class="text-center row"
    >
      <div class="col-md-9">
        <div class="row">
          <div class="col-lg">
            <BarChart
              chart-id="hour-chart"
              title="Time Of Day"
              dimension="hourDim"
              group="hourGroup"
              :bar-width-mult=".75"
              :aspect-ratio="$mq | mq({
                sm: 0.25,
                md: 0.125,
                lg: 0.25,
              })"
            />
          </div>
          <div class="col-lg">
            <BarChart
              chart-id="user-chart"
              title="User"
              dimension="userDim"
              group="userGroup"
              :x-scale="userScale"
              :brush-enabled="false"
              :label-rotate="true"
              :margin="{ top: 10, right: 20, bottom: 80, left: 40 }"
              :aspect-ratio="$mq | mq({
                sm: 0.25,
                md: 0.125,
                lg: 0.25,
              })"
            />
          </div>
        </div>
        <div class="row">
          <div class="col-lg">
            <BarChart
              chart-id="game-chart"
              title="Theme"
              dimension="gameDim"
              group="gameGroup"
              :x-scale="gameScale"
              :brush-enabled="false"
              :label-rotate="true"
              :margin="{ top: 10, right: 20, bottom: 80, left: 40 }"
              :aspect-ratio="$mq | mq({
                sm: 0.25,
                md: 0.125,
                lg: 0.25,
              })"
            />
          </div>
          <div class="col-lg">
            <BarChart
              chart-id="role-chart"
              title="Role"
              dimension="roleDim"
              group="roleGroup"
              :x-scale="roleScale"
              :brush-enabled="false"
              :label-rotate="true"
              :margin="{ top: 10, right: 20, bottom: 80, left: 40 }"
              :aspect-ratio="$mq | mq({
                sm: 0.25,
                md: 0.125,
                lg: 0.25,
              })"
            />
          </div>
        </div>
        <div class="row">
          <div class="col">
            <BarChart
              chart-id="date-chart"
              title="Date"
              dimension="dateDim"
              group="dateGroup"
              :x-scale="dateScale"
              :round="dateRound"
              :aspect-ratio="$mq | mq({
                sm: 0.25,
                md: 0.125,
              })"
            />
          </div>
        </div>
      </div>
      <div class="col-md-3 text-center">
        <div class="textfilter">
          <div class="title">
            Text Filter<a
              class="reset"
              style="display: none"
              @click="reset('textDim')"
            >reset</a>
          </div>
          <div>
            <input
              v-model="queryText"
              type="text"
              name="textFilter"
              @input="filter('textDim')"
            >
          </div>
        </div>
        <UserList title="User List" />
      </div>
    </div>
    <div
      v-else
      class="text-center"
    >
      <h2>Loading...</h2>
    </div>
  </div>
</template>

<script>
import dataStore from '@/services/dataStore';
import * as d3 from 'd3';
import BarChart from '@/components/BarChart.vue';
import UserList from '@/components/UserList.vue';
import io from 'socket.io-client';


export default {
  name: 'Dashboard',
  components: {
    BarChart,
    UserList,
  },
  data() {
    return {
      queryText: '',
      sortUsers: false,
      sortGames: false,
      socket: io(process.env.VUE_APP_SERVER_API),
    };
  },
  computed: {
    cf() {
      return this.$store.getters.CF;
    },
    startDate() {
      return this.cf.dateDim.bottom(1)[0].ti.setHours(0, 0, 0, 0);
    },
    endDate() {
      const d = this.cf.dateDim.top(1)[0].ti;
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      return d;
    },
    dateScale() {
      return d3.scaleTime()
        .domain([this.startDate, this.endDate]);
    },
    dateRound() {
      return d3.timeDay.round;
    },
    userScale() {
      // eslint-disable-next-line no-unused-vars
      const c = this.cf.count; // Used to force recalulation
      return d3.scaleBand()
        .domain(this.sortUsers ? this.cf.userGroup.top(Infinity).map(d => d.key)
          : this.cf.userGroup.top(Infinity).map(d => d.key).sort())
        .padding(0.1);
    },
    gameScale() {
      // eslint-disable-next-line no-unused-vars
      const c = this.cf.count; // Used to force recalulation
      return d3.scaleBand()
        .domain(this.sortGames ? this.cf.gameGroup.top(Infinity).map(d => d.key)
          : this.cf.gameGroup.top(Infinity).map(d => d.key).sort())
        .padding(0.1);
    },
    roleScale() {
      // eslint-disable-next-line no-unused-vars
      const c = this.cf.count; // Used to force recalulation
      return d3.scaleBand()
        .domain(this.cf.roleGroup.top(Infinity).map(d => d.key).sort())
        .padding(0.1);
    },
  },
  created() {
    this.$store.dispatch('SET_CF', []);
    this.getMessages(50000, 0);
  },
  mounted() {
    this.socket.on('conn', (data) => {
      console.log(data);
    });
    this.socket.on('message', (data) => {
      // console.log(data);
      this.addMessage(data);
    });
  },
  ready() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    filter(dim) {
      if (this.queryText === '') {
        this.reset(dim);
      } else {
        d3.select('.textfilter').select('.reset').style('display', null);
        this.$store.dispatch('FILTER', { dim, filter: this.queryText });
      }
    },
    // filterRange(dim) {
    //   this.$store.dispatch('FILTER_RANGE', { dim, filter: [this.startDate, this.endDate] });
    // },
    async getMessages(c, o) {
      const count = c;
      let offset = o;
      try {
        const response = await dataStore.fetchMessages(count, offset);
        let { p } = response.data.data.Group[0];
        p = p.map((_post) => {
          const post = Object.assign({}, _post);
          post.ti = new Date(post.ti.f);
          return post;
        });
        // p.sort((a, b) => a.ti - b.ti);
        this.$store.dispatch('ADD_RECORDS', p);
        if (p.length === count) {
          offset += count;
          this.getMessages(count, offset);
        }
      } catch (e) {
        console.error(e);
      }
    },
    async addMessage(id) {
      try {
        const response = await dataStore.fetchMessage(id);
        let { p } = response.data.data;
        p = p.map((_post) => {
          const post = Object.assign({}, _post);
          post.ti = new Date(post.ti.f);
          return post;
        });
        // p.sort((a, b) => a.ti - b.ti);
        this.$store.dispatch('ADD_RECORDS', p);
      } catch (e) {
        console.error(e);
      }
    },
    reset(dim) {
      this.queryText = '';
      d3.select('.textfilter').select('.reset').style('display', 'none');
      this.$store.dispatch('CLEAR_FILTER', { dim });
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .textfilter {
    display: inline-block;
    position: relative;
    width: 100%;
    vertical-align: top;
    overflow: hidden;
    padding-top: 1em;
    padding-bottom: 1em;
  }

  .reset {
    padding-left: 1em;
    font-size: smaller;
    color: #ccc;
    cursor: pointer;
    text-decoration: underline !important;
  }
</style>
