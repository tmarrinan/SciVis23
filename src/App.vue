<script>
import GlobalGui from './components/GlobalGui.vue'
import NeuronVis from './components/NeuronVis.vue'

export default {
    data() {
        return {}
    },
    components: {
        GlobalGui,
        NeuronVis
    },
    methods: {
        updateNumViews(value) {
            console.log('updateNumViews():' + value);
        }
    }
}
</script>

<template>
    <div class="box">
        <div class="row header">
            <GlobalGui @update-num-views="updateNumViews"/>
        </div>
        <div class="row content">
            <NeuronVis/>
        </div>
    </div>
</template>

<style scoped>
.box {
    display: flex;
    flex-flow: column;
    width: 100%;
    height: 100%;
    background-color: #3C3C3C;
    color: #FFFFFF;
}

/*.box .row {
    border: 1px dotted #FF0000;
}*/

.box .row.header {
    flex: 0 1 auto;
}

.box .row.content {
    flex: 1 1 auto;
}
</style>