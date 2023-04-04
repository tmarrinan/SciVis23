<script>
import GlobalGui from './components/GlobalGui.vue'
import NeuronVis from './components/NeuronVis.vue'

export default {
    data() {
        return {
            num_views: 1,
            data_url: 'https://gliese.cs.stthomas.edu:8008/datasets/scivis23/parquet/'
        }
    },
    components: {
        GlobalGui,
        NeuronVis
    },
    methods: {
        updateNumViews(value) {
            console.log('updateNumViews(): ' + value);
            this.num_views = value;
        },

        updateDataUrl(value) {
            console.log('updateDataUrl(): ' + value);
            this.data_url = value;
        }
    }
}
</script>

<template>
    <div class="box">
        <div class="row header">
            <GlobalGui @update-num-views="updateNumViews" @update-data-url="updateDataUrl"/>
        </div>
        <div class="row content">
            <NeuronVis :num_views="num_views" :data_url="data_url"/>
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