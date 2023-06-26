<script>
import GlobalGui from './components/GlobalGui.vue'
import NeuronVis from './components/NeuronVis.vue'

export default {
    data() {
        return {
            num_views: 1,
            data_url: 'https://gliese.cs.stthomas.edu:8008/datasets/scivis23/parquet/',
            ws: null,
            ws_open: false
        }
    },
    components: {
        GlobalGui,
        NeuronVis
    },
    methods: {
        updateNumViews(value) {
            this.num_views = value;
        },

        updateDataUrl(value) {
            this.data_url = value;
        }
    },
    mounted() {
        this.ws = new WebSocket('wss://gliese.cs.stthomas.edu:8008');
        this.ws.onopen = (event) => {
            console.log('WebSocket connected!');
            this.ws_open = true;
        };
        this.ws.onclose = (event) => {
            console.log('WebSocket closed');
            this.ws_open = false;
        };
        this.ws.onerror = (event) => {
            console.log('WebSocket error: could not connect');
        };
        this.ws.onmessage = (event) => {
            let message = JSON.parse(event.data);
            if (message.type === 'create' || message.type === 'join') {
                this.$refs.global_gui.joinedRoom(message.type, message.response === 'success');
            }
            else {
                console.log(message);
            }
        };
    }
}
</script>

<template>
    <div class="box">
        <div class="row header">
            <GlobalGui ref="global_gui" :ws="ws" :ws_open="ws_open" @update-num-views="updateNumViews" @update-data-url="updateDataUrl"/>
        </div>
        <div class="row content">
            <NeuronVis :ws="ws" :num_views="num_views" :data_url="data_url"/>
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