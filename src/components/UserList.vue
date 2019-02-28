<!-- client/src/components/UserList.vue -->

<template>
  <div class='list'>
    <!--<div class='title'>{{ title }}
      <a href='#' class='reset' style='display: none' @click='reset'>reset</a>-->
    <!--</div>-->
      <ul id='mList' class='scrollbar' :key='cf.count'>
        <li v-for='u in cf.dateDim.top(100,pageNumber*100)' :key='u.key'>
          <span v-if='u.te'><b>{{ u.p.n }}:</b> {{ u.te }}</span>
        </li>
      </ul>
      <div class='small'>
        {{ pageNumber*100+1 }} to {{ (pageNumber+1)*100 }} of {{ cf.cf.groupAll().value() }}
      </div>
      <div>
        <a class='pagebutton' @click='prevPage'>prev</a> /
        <a class='pagebutton' @click='nextPage'>next</a>
      </div>
  </div>
</template>

<script>
export default {
  name: 'UserList',
  data() {
    return {
      pageNumber: 0,
    };
  },
  computed: {
    cf() {
      return this.$store.getters.CF;
    },
  },
  props: {
    title: {
      type: String,
      default: () => 'User List',
    },
  },
  methods: {
    nextPage() {
      this.pageNumber += 1;
      const myDiv = document.getElementById('mList');
      myDiv.scrollTop = 0;
    },
    prevPage() {
      if (this.pageNumber === 0) return;
      this.pageNumber -= 1;
      const myDiv = document.getElementById('mList');
      myDiv.scrollTop = 0;
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.small {
  font-size: .75em;
}

ul {
  list-style-type: none;
  padding-inline-start: 0;
  margin-block-end: 0;
  max-height: 40em;
  overflow: auto;
  overflow-x: hidden;
}

li {
  background: #393f46;
  margin-bottom: 1px;
  font-size: .75em;
}

.pagebutton {
  font-size: .75em;
  text-decoration: underline !important;
}

.scrollbar::-webkit-scrollbar-track
{
    -webkit-box-shadow: inset 0 0 4px rgba(0,0,0,0.3);
    border-radius: 8px;
    background-color: #393f46;
}

.scrollbar::-webkit-scrollbar
{
    width: 10px;
    background-color: #272B30;
}

.scrollbar::-webkit-scrollbar-thumb
{
    border-radius: 8px;
    -webkit-box-shadow: inset 0 0 4px rgba(0,0,0,.3);
    background-color: #737e8c;
}
</style>
