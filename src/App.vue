<script>
import GlobalGui from './components/GlobalGui.vue'
import NeuronVis from './components/NeuronVis.vue'

export default {
    data() {
        return {
            num_views: 1,
            //data_url: 'https://gliese.cs.stthomas.edu:8008/datasets/scivis23/parquet/',
            data_url: 'https://web.cels.anl.gov/projects/VisWebData/scivis23/parquet/',
            ws: null,
            ws_open: false,
            room_id: ''
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

        updateSyncViews(value) {
            this.$refs.neuron_vis.syncViews(value);
        },

        updateDataUrl(value) {
            this.data_url = value;
        },

        updateRoomId(value) {
            this.room_id = value;
            this.$refs.neuron_vis.setRoomId(this.room_id);
        }
    },
    mounted() {
        //this.ws = new WebSocket('wss://gliese.cs.stthomas.edu:8008');
        this.ws = new WebSocket('wss://scivis23-ws.onrender.com');
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
            else if (message.type === 'updateState') {
                this.$refs.neuron_vis.updateState(message.data);
            }
            else {
                console.log(message);
            }
        };
    }
}
</script>

<template>
    <!--
    <div class="box">
        <div class="row header">
            <GlobalGui ref="global_gui" :ws="ws" :ws_open="ws_open" @update-num-views="updateNumViews" @update-sync-views="updateSyncViews" @update-data-url="updateDataUrl" @update-room-id="updateRoomId"/>
        </div>
        <div class="row content">
            <NeuronVis ref="neuron_vis" :ws="ws" :num_views="num_views" :data_url="data_url"/>
        </div>
    </div>
    -->
    <div id="main">
        <div class="row">
            <div class="col-12 no-padding">
                <GlobalGui ref="global_gui" :ws="ws" :ws_open="ws_open" @update-num-views="updateNumViews" @update-sync-views="updateSyncViews" @update-data-url="updateDataUrl" @update-room-id="updateRoomId"/>
            </div>
        </div>
        <div class="row">
            <div class="col-12 no-padding">
                <NeuronVis ref="neuron_vis" :ws="ws" :num_views="num_views" :data_url="data_url"/>
            </div>
        </div>
    </div>
</template>

<style scoped>
#main {
    width: 100%;
    height: 100%;
    background-color: #3C3C3C;
    color: #FFFFFF;
}

.row {
    margin: 0;
}

.no-padding {
    padding: 0;
}
</style>
