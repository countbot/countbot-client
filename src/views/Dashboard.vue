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
          @click="sort = !sort"
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
          <div class="col-md">
            <BarChart
              chart-id="hour-chart"
              title="Time Of Day"
              dimension="hourDim"
              group="hourGroup"
              :bar-width-mult=".75"
            />
          </div>
          <div class="col-md">
            <BarChart
              chart-id="user-chart"
              title="User"
              dimension="userDim"
              group="userGroup"
              :x-scale="userScale"
              :brush-enabled="false"
              :label-rotate="true"
              :margin="{ top: 10, right: 20, bottom: 80, left: 40 }"
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
            Text Filter
          </div>
          <div>
            <input
              v-model="queryText"
              type="text"
              name="textFilter"
              @input="filter(&quot;textDim&quot;)"
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


export default {
  name: 'Dashboard',
  components: {
    BarChart,
    UserList,
  },
  data() {
    return {
      queryText: '',
      sort: false,
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
        .domain(this.sort ? this.cf.userGroup.top(Infinity).map(d => d.key)
          : this.cf.userGroup.top(Infinity).map(d => d.key).sort())
        .padding(0.1);
    },
  },
  created() {
    this.$store.dispatch('SET_CF', []);
    this.getMessages(50000, 0);
  },
  ready() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    filter(dim) {
      this.$store.dispatch('FILTER', { dim, filter: this.queryText });
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
        // this.$forceUpdate();
        // console.info(response);
      } catch (e) {
        console.error(e);
      }
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

</style>