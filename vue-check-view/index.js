'use strict'

Vue.component('item', {
  template: '#item-template',
  props: {
    index: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      viewEvent: {
        type: '',
        percentInView: 0,
        percentTop: 0,
        percentCenter: 0
      }
    }
  },
  methods: {
    viewHandler (e) {
      if (e.type === 'exit') return
      Object.assign(this.viewEvent, e)
    }
  }
})

var app = new Vue({
  el: '#app',
  mounted: function () {
  },
  data: function () {
    return {}
  }
})