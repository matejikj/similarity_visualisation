<template>
  <v-container fluid>
    <v-btn
      color="green"
      absolute
      dark
      fab
      small
      @click="center"
    >
      <v-icon>mdi-image-filter-center-focus-strong-outline</v-icon>
    </v-btn>
    <svg id="svg" ref="svg" width="100%" height="60vh">
      <defs>
        <!-- arrowhead marker definition -->
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
            markerWidth="5" markerHeight="5"
            orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      <g>
        <template v-for="(c, index) in circles">
          <circle-node @nodeClicked='circleClicked' v-bind:key="index" v-bind:nodeData="c"></circle-node>
        </template>
      </g>
      <g>
        <template v-for="(c, index) in circles">
          <circle-label @labelClicked='circleClicked' v-bind:key="index" v-bind:labelData="c"></circle-label>
        </template>
      </g>
      <g>
        <template v-for="(c, index) in leftArrows">
          <circle-link v-bind:key="index" v-bind:linkData="c"></circle-link>
        </template>
      </g>
      <g>
        <template v-for="(c, index) in rightArrows">
          <circle-link v-bind:key="index" v-bind:linkData="c"></circle-link>
        </template>
      </g>
    </svg>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue'
import * as d3 from 'd3'
import CircleNode from './CircleNode.vue'
import CircleLabel from './CircleLabel.vue'
import CircleLink from './CircleLink.vue'
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { ROOT_ID, ROOT_LABEL, Position, Circle } from '../../models'
import { Getters, Actions, Mutations, STORE_NAME } from '../Visualisation.store'
import { initalizeNodes } from '../../utils/nodesUtils'
import { createHierarchy } from '../../utils/hierarchyUtils'

export default Vue.extend({
  name: 'CircleVisualisation',
  components: {
    CircleNode,
    CircleLabel,
    CircleLink
  },
  props: ['rightDataset', 'leftDataset', 'labels'],
  data: () => ({
    left: Position.Left,
    right: Position.Right
  }),
  computed: {
    ...mapGetters(STORE_NAME, {
      circles: Getters.GET_CIRCLES,
      leftArrows: Getters.GET_LEFT_ARROWS,
      rightArrows: Getters.GET_RIGHT_ARROWS,
      hierarchy: Getters.GET_HIERARCHY,
      nodes: Getters.GET_NODES,
      visitedNodes: Getters.GET_VISITED_NODES
    })
  },
  created () {
    window.addEventListener('resize', this.handleResize)
  },
  destroyed () {
    window.removeEventListener('resize', this.handleResize)
  },
  mounted () {
    this.resizeCanvas({
      // @ts-ignore
      height: this.$refs.svg.clientHeight,
      // @ts-ignore
      width: this.$refs.svg.clientWidth
    })
    this.updateVisualisation()

    const g = d3.selectAll('g')
    d3.select('#svg')
      .call(d3.zoom().on('zoom', function () {
        g.attr('transform', d3.event.transform)
      }))
  },
  watch: {
    rightDataset () {
      this.updateVisualisation()
    },
    leftDataset () {
      this.updateVisualisation()
    }
  },
  methods: {
    ...mapActions(STORE_NAME, {
      updateCircleCanvas: Actions.UPDATE_CIRCLE_CANVAS,
      resizeCanvas: Actions.RESIZE_CANVAS,
      createHierarchyForCircles: Actions.CREATE_HIERARCHY_FOR_CIRCLES,
      initPathNodes: Actions.INIT_PATH_NODES,
      addNodeToVisitedNodes: Actions.ADD_NODE_TO_VISITED_NODES
    }),
    ...mapMutations(STORE_NAME, {
      changeLeftMapping: Mutations.CHANGE_LEFT_MAPPING,
      changeRightMapping: Mutations.CHANGE_RIGHT_MAPPING,
      changeNodes: Mutations.CHANGE_NODES,
      changeHierarchy: Mutations.CHANGE_HIERARCHY
    }),
    updateVisualisation: function () {
      this.createHierarchyForCircles()
      this.updateCircleCanvas()
    },
    handleResize () {
      this.resizeCanvas({
        // @ts-ignore
        height: this.$refs.svg.clientHeight,
        // @ts-ignore
        width: this.$refs.svg.clientWidth
      })
      this.updateCircleCanvas()
    },
    circleClicked: function (leaf: Circle) {
      const labels = this.labels
      if (this.visitedNodes[this.visitedNodes.length - 1].id !== leaf.id) {
        this.addNodeToVisitedNodes({ labels, leaf })
        this.createHierarchyForCircles()
        this.updateCircleCanvas()
      }
    },
    initNodes: function () {
      this.changeHierarchy(createHierarchy(this.leftDataset, this.rightDataset))
      this.changeNodes(initalizeNodes(this.hierarchy, this.labels))
    },
    zoomed: function () {
      d3.selectAll('g')
        .attr('transform', d3.event.transform)
    },
    center: function () {
      const zoom = d3.zoom().on('zoom', this.zoomed)
      d3.select('#svg')
        .transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity)
    }
  }
})
</script>

<style>
.circle {
  cursor: pointer;
  text-decoration: underline;
}
.labels {
  cursor: pointer;
  text-anchor: middle;
  pointer-events: none;
}

#svg {
  border: 1px solid gray;
}
</style>
