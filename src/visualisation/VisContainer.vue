<template>
  <v-container fluid>
    <v-row>
      <v-col cols="2">
        <side-bar
          @mappingChoosed="mappingChoosed"
          @mappingChanged="mappingChanged"
          v-bind:mappingList="leftMappingTree"
          v-bind:sidebarPosition="left"
          v-bind:title="leftInfo.title"
          v-bind:collection="leftInfo.collection"
          v-bind:description="leftInfo.description"
          v-bind:url="leftInfo.url"
          v-bind:keywords="leftInfo.keywords"
        >
        </side-bar>
      </v-col>
      <v-col cols="8">
        <circle-visualisation
          v-bind:leftDataset="leftDataset"
          v-bind:rightDataset="rightDataset"
          v-bind:labels="labels"
          v-if="activeView === 1"
        ></circle-visualisation>
        <tree-visualisation
          v-bind:leftDataset="leftDataset"
          v-bind:rightDataset="rightDataset"
          v-bind:labels="labels"
          v-if="activeView === 2"
        ></tree-visualisation>
      </v-col>
      <v-col cols="2">
        <side-bar
          @mappingChoosed="mappingChoosed"
          @mappingChanged="mappingChanged"
          v-bind:mappingList="rightMappingTree"
          v-bind:sidebarPosition="right"
          :title="rightInfo.title"
          :collection="rightInfo.collection"
          :description="rightInfo.description"
          :url="rightInfo.url"
          :keywords="rightInfo.keywords"
        >
        </side-bar>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapMutations, mapGetters } from 'vuex'
import { Position, MappingNode, ROOT_ID, ROOT_LABEL, ComboboxItem } from '../models'
import { Actions, Mutations, Getters, STORE_NAME } from './Visualisation.store'
import { initalizeNodes, createVisitedNode } from '../utils/nodesUtils'
import { createMapping, createHierarchy } from '../utils/hierarchyUtils'
import SideBar from './Layout/SideBar.vue'
import CircleVisualisation from './CircleVisualisation/CircleVisualisation.vue'
import TreeVisualisation from './TreeVisualisation/TreeVisualisation.vue'

export default Vue.extend({
  name: 'VisContainer',
  components: {
    SideBar,
    CircleVisualisation,
    TreeVisualisation
  },
  props: ['rightDataset', 'leftDataset', 'activeView', 'labels'],
  data: () => ({
    left: Position.Left,
    right: Position.Right,
    leftInfo: {
      title: '',
      collection: '',
      description: '',
      url: '',
      keywords: ['']
    },
    rightInfo: {
      title: '',
      collection: '',
      description: '',
      url: '',
      keywords: ['']
    }
  }),
  computed: {
    ...mapGetters(STORE_NAME, {
      hierarchy: Getters.GET_HIERARCHY,
      leftMappingTree: Getters.GET_LEFT_MAPPING_TREE_LIST,
      rightMappingTree: Getters.GET_RIGHT_MAPPING_TREE_LIST
    })
  },
  mounted () {
    this.initNodes()
    this.initializeVisualisation()
  },
  watch: {
    /**
     * .All terminations associated with the update of the left dataset
     * .Includes reset mapping, initialize visualization, and update dataset information
     */
    leftDataset () {
      this.initNodes()
      this.initializeVisualisation()
      const position = Position.Left
      const dataset = this.leftDataset
      this.updateMappingsCombobox(dataset, position)
      this.changeLeftMapping(Array<MappingNode>())
      this.leftInfo = {
        title: this.leftDataset.metadata.title,
        description: this.leftDataset.metadata.description,
        url: this.leftDataset.url,
        keywords: this.leftDataset.metadata.keywords,
        collection: this.leftDataset.collection
      }
    },
    /**
     * All terminations associated with updating the actual dataset
     * Includes reset mapping, initialize visualization, and update dataset information.
     */
    rightDataset () {
      this.initNodes()
      this.initializeVisualisation()
      const position = Position.Right
      const dataset = this.rightDataset
      this.updateMappingsCombobox(dataset, position)
      this.changeRightMapping(Array<MappingNode>())
      this.rightInfo = {
        title: this.rightDataset.metadata.title,
        description: this.rightDataset.metadata.description,
        url: this.rightDataset.url,
        keywords: this.rightDataset.metadata.keywords,
        collection: this.rightDataset.collection
      }
    }
  },
  methods: {
    ...mapActions(STORE_NAME, {
      updateCircleCanvas: Actions.UPDATE_CIRCLE_CANVAS,
      updateTreeCanvas: Actions.UPDATE_TREE_CANVAS
    }),
    ...mapMutations(STORE_NAME, {
      changeLeftMappingList: Mutations.CHANGE_LEFT_MAPPING_LIST,
      changeRightMappingList: Mutations.CHANGE_RIGHT_MAPPING_LIST,
      changeLeftMapping: Mutations.CHANGE_LEFT_MAPPING,
      changeRightMapping: Mutations.CHANGE_RIGHT_MAPPING,
      changeRootId: Mutations.CHANGE_ROOT_ID,
      changeActivePath: Mutations.CHANGE_ACTIVE_PATH,
      changeVisitedNodes: Mutations.CHANGE_VISITED_NODES,
      initPathNodes: Mutations.CHANGE_PATH_NODES,
      changeLeftMappingTreeList: Mutations.CHANGE_LEFT_MAPPING_TREE_LIST,
      changeRightMappingTreeList: Mutations.CHANGE_RIGHT_MAPPING_TREE_LIST,
      changeNodes: Mutations.CHANGE_NODES,
      changeHierarchy: Mutations.CHANGE_HIERARCHY
    }),
    /**
     * Visualization initialization
     */
    initializeVisualisation: function () {
      this.changeRootId(ROOT_ID)
      this.changeActivePath(undefined)
      this.changeVisitedNodes([createVisitedNode(ROOT_ID, ROOT_LABEL)])
      this.initPathNodes()
    },
    /**
     * Initialization of entity nodes
     */
    initNodes: function () {
      this.changeHierarchy(createHierarchy(this.leftDataset, this.rightDataset))
      this.changeNodes(initalizeNodes(this.hierarchy, this.labels))
    },
    /**
     * Visualization update
     */
    updateVisualisation: function () {
      if (this.activeView === 1) {
        this.updateCircleCanvas()
      }
      if (this.activeView === 2) {
        this.updateTreeCanvas()
      }
    },
    /**
     * After choosing on the basis of which database I want to map, I want to display individual mapped passwords, where I map
     */
    mappingChoosed: function (position: Position, id: number) {
      switch (position) {
        case Position.Left:
          this.changeLeftMappingTreeList(createMapping(this.labels, this.leftDataset, id))
          break
        case Position.Right:
          this.changeRightMappingTreeList(createMapping(this.labels, this.rightDataset, id))
          break
      }
    },
    /**
     * I chose individual entities to see where they are
     */
    mappingChanged: function (position: Position, array: Array<MappingNode>) {
      switch (position) {
        case Position.Left:
          this.changeLeftMapping(array)
          break
        case Position.Right:
          this.changeRightMapping(array)
          break
      }
      this.updateVisualisation()
    },
    /**
     * Update the tree view sheet
     */
    updateMappingsCombobox: function (dataset: any, position: Position) {
      const result: Array<ComboboxItem> = []
      dataset.mappings.forEach((element: {data: []; metadata: {from: string; title: string; input: []}}, i: number) => {
        result.push(new ComboboxItem(element.metadata.title + '/' + element.metadata.from, i))
      })
      result.push(new ComboboxItem('All', result.length))
      switch (position) {
        case Position.Left:
          this.changeLeftMappingList(result)
          break
        case Position.Right:
          this.changeRightMappingList(result)
          break
      }
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
</style>
