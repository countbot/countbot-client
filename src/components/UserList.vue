<!-- client/src/components/UserList.vue -->

<template>
  <div class="list">
    <ul
      id="mList"
      :key="cf.count"
      class="scrollbar"
    >
      <li
        v-for="u in cf.dateDim.top(postNumber)"
        :key="u.key"
        @click="toggleExpanded(u)"
      >
        <span v-if="u.t"><b>{{ u.un }}:</b> {{ u.t }}</span>
        <div v-if="u.exp">
          <span><b>Timestamp:</b> {{ u.ti.toString().substring(0, u.ti.toString().indexOf(' GMT')) }}</span>
        </div>
      </li>
    </ul>
    <div class="small">
      1 to {{ postNumber }} of {{ cf.cf.groupAll().value() }}
    </div>
    <div v-if="postNumber > 100 || scrollPos > 0">
      <a
        class="pagebutton"
        @click="toTop"
      >go to top</a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserList',
  props: {
    title: {
      type: String,
      default: 'User List',
    },
  },
  data() {
    return {
      pageNumber: 0,
      scrollPos: 0,
      postNumber: 100,
    };
  },
  computed: {
    cf() {
      return this.$store.getters.CF;
    },
  },
  beforeUpdate() {
    const myDiv = document.getElementById('mList');
    this.scrollPos = myDiv.scrollTop;
    if (this.scrollPos === 0) {
      this.postNumber = 100;
    }
  },
  updated() {
    const myDiv = document.getElementById('mList');
    myDiv.scrollTop = this.scrollPos;
    myDiv.onscroll = () => {
      this.scroll();
    };
  },
  methods: {
    scroll() {
      const myDiv = document.getElementById('mList');
      const { scrollTop, scrollHeight, offsetHeight } = myDiv;
      if (scrollTop + offsetHeight >= scrollHeight
        && this.cf.cf.groupAll().value() > this.postNumber) {
        this.postNumber += 100;
      }
    },
    toTop() {
      const myDiv = document.getElementById('mList');
      myDiv.scrollTop = 0;
      this.postNumber = 100;
    },
    toggleExpanded(u) {
      if (u.exp) {
        u.exp = !u.exp;
      } else {
        u.exp = true;
      }
      this.$forceUpdate();
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
  max-height: 50em;
  overflow: auto;
  overflow-x: hidden;
}

li {
  background: #393f46;
  margin-bottom: 1px;
  font-size: .75em;
  cursor: pointer;
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
