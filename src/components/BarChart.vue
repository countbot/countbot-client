<!-- client/src/components/BarChart.vue -->

<template>
  <div
    :id="chartId"
    class="chart"
  >
    <div class="title">
      {{ title }}<a
        class="reset"
        style="display: none"
        @click="reset"
      >reset</a>
    </div>
    <svg :height="height + margin.top + margin.bottom">
      <g :transform="transform(margin.left, margin.top)">
        <g
          :key="cf.count"
          class="bars"
        >
          <rect
            v-for="g in gr.all()"
            :key="typeof g.key === (String || Number) ? g.key : g.key._i"
            :x="anim ? xVal[g.key] : x(g.key)"
            :y="y(g.value)"
            :height="y(0) - y(g.value)"
            :width="width/gr.all().length*barWidthMult"
            :class="{ background: brushEnabled ?
              !(activeRange[0] <= x(g.key) && x(g.key) < activeRange[1])
              : !(filterArray.indexOf(g.key)+1 ?
                filterArray.length
                : !filterArray.length) }"
            @click="toggleFiltered(g)"
          />
        </g>
        <g
          class="x-axis"
          :transform="transform(0, height)"
        />
        <g
          class="y-axis"
          :transform="transform(0, 0)"
        />
        <g class="brush" />
      </g>
    </svg>
  </div>
</template>

<script>
import * as d3 from 'd3';
import { TweenLite } from 'gsap/TweenLite';

export default {
  name: 'BarChart',
  props: {
    chartId: {
      type: String,
      default: 'bar-chart',
    },
    title: {
      type: String,
      default: 'Bar Chart',
    },
    dimension: {
      type: String,
      required: true,
    },
    group: {
      type: String,
      required: true,
    },
    margin: {
      type: Object,
      default: () => ({
        top: 10,
        right: 20,
        bottom: 20,
        left: 40,
      }),
    },
    aspectRatio: {
      type: Number,
      default: 0.25,
    },
    barWidthMult: {
      type: Number,
      default: 0.9,
    },
    xScale: {
      type: Function,
      default: d3.scaleLinear().domain([0, 24]),
    },
    ticks: {
      type: Number,
      default: null,
    },
    round: {
      type: Function,
      default: Math.round,
    },
    brushEnabled: {
      type: Boolean,
      default: true,
    },
    labelRotate: {
      type: Boolean,
      default: false,
    },
    yAxis: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      activeRange: [0, 1],
      filterArray: [],
      width: null,
      xVal: null,
      anim: false,
    };
  },
  computed: {
    cf() {
      return this.$store.getters.CF;
    },
    dim() {
      return this.cf[this.dimension];
    },
    gr() {
      return this.cf[this.group];
    },
    x() {
      return this.xScale
        .range([0, this.width]);
    },
    y() {
      // eslint-disable-next-line no-unused-vars
      const c = this.count; // This is to force recalculation on filter
      return d3.scaleLinear()
        .domain([0, this.gr.top(1)[0].value]).nice()
        .range([this.height, 0]);
    },
    count() {
      return this.cf.count;
    },
    brush() {
      return d3.brushX().extent([[0, 0], [this.x.range()[1], this.y.range()[0]]]);
    },
    height() {
      return this.width * this.aspectRatio;
    },
  },
  watch: {
    count() {
      this.refreshAxes();
    },
    xScale() {
      this.anim = true;
      let l = Object.keys(this.xVal).length - 1;
      Object.keys(this.xVal).forEach((e) => {
        TweenLite.to(this.xVal, 1, {
          [e]: this.x(e),
          onComplete: () => {
            if (l) {
              l -= 1;
            } else {
              this.anim = false;
            }
          },
        });
      });
      d3.select(`#${this.chartId}`).select('.x-axis').transition().duration(1000)
        .call(d3.axisBottom(this.x).ticks(this.ticks));
    },
  },
  // created() {
  //   this.activeRange = [0, this.width];
  // },
  mounted() {
    // this.chart(d3.select('#bar-chart'));
    // console.log(this.chart.dimension().top(4));
    this.width = this.$el.clientWidth - this.margin.left - this.margin.right;
    this.activeRange = [0, this.width];
    const obj = {};
    this.gr.all().forEach((g) => {
      obj[g.key] = this.x(g.key);
    });
    this.xVal = obj;
    this.$nextTick(() => {
      window.addEventListener('resize', this.refreshChart);
    });
    this.initializeChart();
    if (this.brushEnabled) {
      this.brush.on('start.passive', this.brushStart)
        .on('brush.passive', this.brushMove)
        .on('end.passive', this.brushEnd);
      this.filterArray = [1];
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.refreshChart);
  },
  methods: {
    transform(x, y) {
      return `translate(${x}, ${y})`;
    },
    refreshAxes() {
      if (this.yAxis) {
        d3.select(`#${this.chartId}`).select('.y-axis').selectAll('g').remove();
        d3.select(`#${this.chartId}`).select('.y-axis').call(d3.axisLeft(this.y).ticks(4)).call(g => g.select('.domain').remove());
      }
      d3.select(`#${this.chartId}`).select('.x-axis').selectAll('g').remove();
      const xAxis = d3.select(`#${this.chartId}`).select('.x-axis').call(d3.axisBottom(this.x).ticks(this.ticks));
      if (this.labelRotate) {
        xAxis.selectAll('text')
          .style('text-anchor', 'end')
          .attr('dx', '-.8em')
          .attr('dy', '.15em')
          .attr('transform', 'rotate(-65)');
      }
    },
    refreshChart() {
      const self = this;
      function resizePath(d) {
        const height = self.y.range()[0];
        const e = +(d.type === 'e');
        const x = e ? 1 : -1;
        const y = height / 3;
        return `M${0.5 * x},${y}A6,6 0 0 ${e} ${6.5 * x},${y + 6}V${2 * y - 6}A6,6 0 0 ${e} ${0.5 * x},${2 * y}ZM${2.5 * x},${y + 8}V${2 * y - 8}M${4.5 * x},${y + 8}V${2 * y - 8}`;
      }

      let extents = this.brushEnabled ? this.activeRange.map(this.x.invert) : null;
      this.width = this.$el.clientWidth - this.margin.left - this.margin.right;
      const obj = {};
      this.gr.all().forEach((g) => {
        obj[g.key] = this.x(g.key);
      });
      this.xVal = obj;
      this.refreshAxes();
      if (this.brushEnabled) {
        this.brush.extent([[0, 0], [this.x.range()[1], this.y.range()[0]]]);
        const br = d3.select(`#${this.chartId}`).select('.brush');
        br.selectAll('*').remove();
        br.call(this.brush)
          .selectAll('.handle--custom')
          .data([{ type: 'w' }, { type: 'e' }])
          .enter()
          .append('path')
          .attr('class', 'brush-handle')
          .attr('cursor', 'ew-resize')
          .attr('d', resizePath)
          .style('display', 'none');
        this.brush.on('start.passive', this.brushStart)
          .on('brush.passive', this.brushMove)
          .on('end.passive', this.brushEnd);
        extents = extents.map(this.x);
        this.activeRange = extents;
        if (extents[0] === this.x.range()[0] && extents[1] === this.x.range()[1]) {
          br.call(this.brush.move, null);
          br.selectAll('.brush-handle')
            .style('display', 'none');
          d3.select(`#${this.chartId}`).select('.title a').style('display', 'none');
        } else {
          br.call(this.brush.move, extents);
        }
      }
    },
    initializeChart() {
      const self = this;
      function resizePath(d) {
        const height = self.y.range()[0];
        const e = +(d.type === 'e');
        const x = e ? 1 : -1;
        const y = height / 3;
        return `M${0.5 * x},${y}A6,6 0 0 ${e} ${6.5 * x},${y + 6}V${2 * y - 6}A6,6 0 0 ${e} ${0.5 * x},${2 * y}ZM${2.5 * x},${y + 8}V${2 * y - 8}M${4.5 * x},${y + 8}V${2 * y - 8}`;
      }

      d3.select(`#${this.chartId}`).select('.x-axis').selectAll('g').remove();
      const xAxis = d3.select(`#${this.chartId}`).select('.x-axis').call(d3.axisBottom(this.x).ticks(this.ticks));
      if (this.labelRotate) {
        xAxis.selectAll('text')
          .style('text-anchor', 'end')
          .attr('dx', '-.8em')
          .attr('dy', '.15em')
          .attr('transform', 'rotate(-65)');
      }
      if (this.yAxis) {
        d3.select(`#${this.chartId}`).select('.y-axis').selectAll('g').remove();
        d3.select(`#${this.chartId}`).select('.y-axis').call(d3.axisLeft(this.y).ticks(4)).call(g => g.select('.domain').remove());
      }
      if (this.brushEnabled) {
        d3.select(`#${this.chartId}`).select('.brush')
          .call(this.brush)
          .selectAll('.handle--custom')
          .data([{ type: 'w' }, { type: 'e' }])
          .enter()
          .append('path')
          .attr('class', 'brush-handle')
          .attr('cursor', 'ew-resize')
          .attr('d', resizePath)
          .style('display', 'none');
      }
    },
    brushStart() {
      const div = d3.select(`#${this.chartId}`);
      div.select('.title a').style('display', null);
    },
    brushMove() {
      const br = d3.select(`#${this.chartId}`).select('.brush');
      // attempt to read brush range
      const brushRange = d3.event.selection || d3.brushSelection(this);
      const xRange = this.x && this.x.range(); // attempt to read range from x scale
      let activeRange = brushRange || xRange; // default to x range if no brush range available

      const hasRange = activeRange
                    && activeRange.length === 2
                    && !Number.isNaN(activeRange[0])
                    && !Number.isNaN(activeRange[1]);

      if (!hasRange) return; // quit early if we don't have a valid range

      // move brush handles to start and end of range
      br.selectAll('.brush-handle')
        .style('display', null)
        .attr('transform', (d, i) => `translate(${activeRange[i]}, 0)`);

      // calculate current brush extents using x scale
      const extents = activeRange.map(d => this.round(this.x.invert(d)));
      this.$store.dispatch('FILTER_RANGE', { dim: this.dimension, filter: extents });
      activeRange = extents.map(this.x);
      this.activeRange = activeRange;
    },
    brushEnd() {
      if (!d3.event.sourceEvent) return; // Only transition after input.
      if (!d3.event.selection) {
        this.reset();
        return; // Ignore empty selections.
      }
      const d0 = d3.event.selection.map(this.x.invert);
      const d1 = d0.map(this.round);
      this.activeRange = d1.map(this.x);
      // console.log(d1.map(this.x));
      const br = d3.select(`#${this.chartId}`).select('.brush');
      br.transition().call(this.brush.move, this.activeRange);
      // move brush handles to start and end of range
      br.selectAll('.brush-handle')
        .style('display', null)
        .transition()
        .attr('transform', (d, i) => `translate(${this.activeRange[i]}, 0)`);
    },
    reset() {
      this.$store.dispatch('CLEAR_FILTER', { dim: this.dimension });
      d3.select(`#${this.chartId}`).select('.reset').style('display', 'none');
      if (this.brushEnabled) {
        this.activeRange = this.x.range();
        const br = d3.select(`#${this.chartId}`).select('.brush');
        br.call(this.brush.move, null);
        br.selectAll('.brush-handle')
          .style('display', 'none')
          .attr('transform', (d, i) => `translate(${this.activeRange[i]}, 0)`);
      } else {
        this.filterArray = [];
      }
    },
    toggleFiltered(g) {
      const div = d3.select(`#${this.chartId}`);
      div.select('.title a').style('display', null);
      const i = this.filterArray.indexOf(g.key);
      if (i > -1) {
        this.filterArray.splice(i, 1);
        if (!this.filterArray.length) {
          this.reset();
          return;
        }
      } else {
        this.filterArray.push(g.key);
      }
      this.$store.dispatch('FILTER_ARRAY', { dim: this.dimension, filter: this.filterArray });
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
@import url(https://fonts.googleapis.com/css?family=Yanone+Kaffeesatz:400,700);

  body {
    font-family: 'Helvetica Neue';
    margin: 40px auto;
    width: 960px;
    min-height: 2000px;
  }

  .chart {
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

  .bars .background {
    fill: #ccc;
  }

  .bars {
    fill: #4b939e;
    cursor: pointer;
  }

  .chart >>> .brush-handle {
    fill: #eee;
    stroke: #666;
  }

  .chart >>> .selection {
    stroke: #bbb;
    stroke-opacity: .3;
  }

  svg {
    width: 100%;
    height: 100%;
  }
</style>
