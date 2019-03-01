<template>
  <div class='dashboard container-fluid'>
    <div class='row'>
      <div class='col text-center'>
        <h1>Werewolves Dashboard</h1>
        <p v-if='cf.cf.groupAll().value() === cf.cf.size()'>{{ cf.cf.size() }} messages</p>
        <p v-else>{{ cf.cf.groupAll().value() }} of {{ cf.cf.size() }} messages selected</p>
        <button type='button'
          class='btn btn-sm btn-secondary float-right'
          @click='sort = !sort'>
            Sort Users
        </button>
      </div>
    </div>
    <div  v-if='cf.count-1' class='text-center row'>
      <div class='col-md-9'>
        <div class='row'>
          <div class='col-sm'>
            <BarChart
                chartId='hour-chart'
                title='Time Of Day'
                dimension='hourDim'
                group='hourGroup'
                :barWidthMult='.75'
                :height='((windowWidth - 10) * 3 / 8 - 90) / 4'
                :width='(windowWidth - 10) * 3 / 8 - 90'
            />
          </div>
          <div class='col-sm'>
            <BarChart
                chartId='user-chart'
                title='User'
                dimension='userDim'
                group='userGroup'
                :xScale='userScale'
                :brushEnabled='false'
                :labelRotate='true'
                :margin='{ top: 10, right: 20, bottom: 80, left: 40 }'
                :height='((windowWidth - 10) * 3 / 8 - 90) / 4'
                :width='(windowWidth - 10) * 3 / 8 - 90'
            />
          </div>
        </div>
        <div class='row'>
          <div class='col'>
            <BarChart
                chartId='date-chart'
                title='Date'
                dimension='dateDim'
                group='dateGroup'
                :xScale='dateScale'
                :round='dateRound'
                :height='((windowWidth - 10) * 3 / 4 - 90) / 8'
                :width='(windowWidth - 10) * 3 / 4 - 90'
                :key='windowWidth'
            />
          </div>
        </div>
      </div>
      <div class='col-md-3 text-center'>
        <div class='textfilter'>
          <div class='title'>Text Filter</div>
          <div>
            <input type='text' name='textFilter' v-model='queryText' @input='filter("textDim")' />
          </div>
        </div>
        <UserList title='User List'/>
      </div>
    </div>
    <div v-else class='text-center'>
      <h2>Loading...</h2>
    </div>
  </div>
</template>

<script>
import dataStore from '@/services/dataStore';
// import crossfilter from 'crossfilter2';
import moment from 'moment';
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
      windowWidth: window.innerWidth,
      sort: false,
    };
  },
  computed: {
    cf() {
      return this.$store.getters.CF;
    },
    startDate() {
      return this.cf.dateDim.bottom(1)[0].ti.startOf('day');
    },
    endDate() {
      return this.cf.dateDim.top(1)[0].ti.add(1, 'days').startOf('day');
    },
    dateScale() {
      return d3.scaleTime()
        .domain([this.startDate, this.endDate]);
    },
    dateRound() {
      return d3.timeDay.round;
    },
    userScale() {
      const c = this.cf.count; // Used to force recalulation
      return d3.scaleBand()
        .domain(this.sort ? this.cf.userGroup.top(Infinity).map(d => d.key) : this.cf.userGroup.top(Infinity).map(d => d.key).sort())
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
          post.ti = moment(post.ti.f.split('[')[0]);
          return post;
        });
        p.sort((a, b) => a.ti - b.ti);
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
    handleResize() {
      this.windowWidth = window.innerWidth;
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
