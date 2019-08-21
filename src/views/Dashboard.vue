<template>
  <div class="dashboard container-fluid">
    <div class="row">
      <div class="col text-center">
        <h1>Werewolves Dashboard</h1>
      </div>
    </div>
    <div
      v-if="cf.count-1"
      class="row"
    >
      <div class="col text-center">
        <p v-if="cf.cf.groupAll().value() === cf.cf.size()">
          {{ cf.cf.size() }} messages
        </p>
        <p v-else>
          {{ cf.cf.groupAll().value() }} of {{ cf.cf.size() }} messages selected
        </p>
        <p>
          {{ charCount }} chars per message (avg)
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
      v-else
      class="text-center row align-items-center"
      style="height: 20em;"
    >
      <div class="col">
        <h2 class="loading">
          Loading<span>.</span><span>.</span><span>.</span>
        </h2>
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
              :active="active"
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
              :active="active"
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
              :active="active"
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
  </div>
</template>

<script>
// import dataStore from '@/services/dataStore';
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
      sortUsers: true,
      sortGames: true,
      socket: io(process.env.VUE_APP_SERVER_API),
      resetDates: 0,
      after: null,
      active: false,
    };
  },
  computed: {
    cf() {
      return this.$store.getters.CF;
    },
    startDate() {
      const r = this.resetDates;
      return d3.timeDay.floor(this.cf.dateGroup.all().slice()[0].key);
    },
    endDate() {
      const r = this.resetDates;
      return d3.timeDay.floor(d3.timeDay.offset(this.cf.dateGroup.all().slice(-1)[0].key,1));
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
      const r = this.resetDates; // Used to force recalulation
      return d3.scaleBand()
        .domain(this.cf.roleGroup.top(Infinity).map(d => d.key).sort())
        .padding(0.1);
    },
    charCount() {
      // eslint-disable-next-line no-unused-vars
      const c = this.cf.count; // Used to force recalulation
      return Math.round(this.cf.cf.allFiltered().map(d => (d.t ? d.t.length : 0))
        .reduce((acc, curr) => acc + curr, 0) / this.cf.cf.groupAll().value());
    },
  },
  created() {
    this.$store.dispatch('SET_CF', []);
    this.getMessages();
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
        try {
          const re = new RegExp(this.queryText, 'i');
          this.$store.dispatch('FILTER', { dim, filter: re });
        } catch (e) {
          this.$store.dispatch('FILTER', { dim, filter: this.queryText });
          // console.log(e);
        }
      }
    },
    getMessages() {
      const v = this;
      fetch(`${process.env.VUE_APP_SERVER_API}/messages?after=`)
        .then((response) => {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let partialObjs = '';
          function go() {
            return reader.read().then((result) => {
              partialObjs += decoder.decode(result.value);
              const bound = /,(?={)/;
              let objs = partialObjs.split(bound);
              // console.info(objs);
              if (!result.done) {
                // Last cell is likely incomplete
                // Keep hold of it for next time
                partialObjs = objs[objs.length - 1];
                // Remove it from our complete cells
                objs = objs.slice(0, -1);
              }
              objs = objs.map((o) => {
                o = JSON.parse(o);
                o.ti = new Date(o.ti);
                return o;
              });
              v.$store.dispatch('ADD_RECORDS', objs);
              v.resetDates += 1;
              if (result.done) {
                reader.cancel("Done");
                return;
              }
              return go();
            });
          }
          return go();
        })
        .then(result => v.active = true);
    },
    addMessage(id) {
      const v = this;
      fetch(`${process.env.VUE_APP_SERVER_API}/message?id=${id}`)
        .then((response) => {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let partialObjs = '';
          function go() {
            return reader.read().then((result) => {
              partialObjs += decoder.decode(result.value);
              const bound = /,(?={)/;
              let objs = partialObjs.split(bound);
              // console.info(objs);
              if (!result.done) {
                // Last cell is likely incomplete
                // Keep hold of it for next time
                partialObjs = objs[objs.length - 1];
                // Remove it from our complete cells
                objs = objs.slice(0, -1);
              }
              objs = objs.map((o) => {
                o = JSON.parse(o);
                o.ti = new Date(o.ti);
                return o;
              });
              v.$store.dispatch('ADD_RECORDS', objs);
              v.resetDates += 1;
              if (result.done) {
                reader.cancel('Done');
                return;
              }
              return go();
            });
          }
          return go();
        });
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
  
  p {
    margin-bottom: 0rem;
  }

@keyframes blink {
    /**
     * At the start of the animation the dot
     * has an opacity of .2
     */
    0% {
      opacity: .2;
    }
    /**
     * At 20% the dot is fully visible and
     * then fades out slowly
     */
    20% {
      opacity: 1;
    }
    /**
     * Until it reaches an opacity of .2 and
     * the animation can start again
     */
    100% {
      opacity: .2;
    }
}

.loading span {
    /**
     * Use the blink animation, which is defined above
     */
    animation-name: blink;
    /**
     * The animation should take 1.4 seconds
     */
    animation-duration: 1.4s;
    /**
     * It will repeat itself forever
     */
    animation-iteration-count: infinite;
    /**
     * This makes sure that the starting style (opacity: .2)
     * of the animation is applied before the animation starts.
     * Otherwise we would see a short flash or would have
     * to set the default styling of the dots to the same
     * as the animation. Same applies for the ending styles.
     */
    animation-fill-mode: both;
}

.loading span:nth-child(2) {
    /**
     * Starts the animation of the third dot
     * with a delay of .2s, otherwise all dots
     * would animate at the same time
     */
    animation-delay: .2s;
}

.loading span:nth-child(3) {
    /**
     * Starts the animation of the third dot
     * with a delay of .4s, otherwise all dots
     * would animate at the same time
     */
    animation-delay: .4s;
}
</style>
