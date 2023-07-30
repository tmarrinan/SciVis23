<script>
export default {
    props: {
        ws: {type: Object},
        ws_open: {type: Boolean}
    },
    data() {
        return {
            num_views: 1,
            prev_views: 1,
            max_views: 1,
            sync_views: false,
            // data_url: 'stthomas',
            // data_url_list: {
            //     stthomas: 'https://gliese.cs.stthomas.edu:8008/datasets/scivis23/parquet/',
            //     add_new: '... Add new'
            // },
            joined_room: false,
            room_id: ''
        }
    },
    emits: ['update-num-views', 'update-sync-views', 'update-data-url', 'update-room-id'],
    methods: {
        updateNumViews(event) {
            if ([3, 5, 7].includes(this.num_views)) {
                if (this.prev_views < this.num_views) this.num_views++;
                else this.num_views--;
            }
            else if (![1, 2, 4, 6, 8].includes(this.num_views)) {
                this.num_views = 1;
            }
            if (this.num_views !== this.prev_views) {
                this.$emit('update-num-views', this.num_views);
            }
            this.prev_views = this.num_views;
        },

        updateSyncViews(event) {
            this.$emit('update-sync-views', this.sync_views);
        },

        updateDataUrl(event) {
            if (this.data_url === 'add_new') {
                // TODO: enable users to add their own data server URL
            }
            else {
                this.$emit('update-data-url', this.data_url_list[this.data_url]);
            }
        },

        joinRoom(event) {
            if (this.room_id !== '' && this.ws_open) {
                let message = {type: 'join', data: {id: this.room_id}};
                this.ws.send(JSON.stringify(message));
            }
        },

        createRoom(event) {
            if (this.room_id !== '' && this.ws_open) {
                let message = {type: 'create', data: {id: this.room_id}};
                this.ws.send(JSON.stringify(message));
            }
        },

        leaveRoom(event) {
            let message = {type: 'leave', data: {id: this.room_id}};
            this.ws.send(JSON.stringify(message));
            this.joined_room = false;
            this.room_id = '';
            this.$emit('update-room-id', this.room_id);
        },

        joinedRoom(type, success) {
            if (success) {
                this.joined_room = true;
                this.$emit('update-room-id', this.room_id);
            }
            else {
                if (type === 'create') {
                    alert('Error: Could not create room. Try a different ID.');
                }
                else if (type === 'join') {
                    alert('Error: Could not join room. Try creating one or join using a different ID.');
                }
            }
        }
    },
    mounted() {
        let width = window.innerWidth;
        this.max_views = (width < 768) ? 1 : (width < 1280) ? 2 : (width < 1920) ? 4 : (width < 3840) ? 6 : 8;
        window.addEventListener('resize', (event) => {
            width = window.innerWidth;
            this.max_views = (width < 768) ? 1 : (width < 1280) ? 2 : (width < 1920) ? 4 : (width < 3840) ? 6 : 8;
        });
    }
}
</script>

<template>
    <div id="global-gui" class="container">
        <div class="row">
            <div class="col-12 col-4-m col-3-l padding-top-0-25rem">
                <h1 id="gui-title">Brain Plasticity</h1>
            </div>
            <div class="col-12 col-8-m col-4-l padding-top-1rem padding-top-0-25rem-m">
                <label class="text-right middle">Views:</label>
                <input class="number-input space-left space-right" type="number" min="1" :max="max_views" v-model="num_views" @input="updateNumViews"/>
                <label>Sync Views:</label>
                <input class="space-left space-right" type="checkbox" v-model="sync_views" @change="updateSyncViews"/>
            </div>
            <div v-if="!joined_room" class="col-12 col-12-m col-5-l padding-top-1rem padding-top-0-25rem-l">
                <label>Room:</label>
                <input class="text-input space-left space-right-half" type="text" placeholder="Enter ID" v-model="room_id"/>
                <button :class="'button-input ' + (ws_open ? 'join-btn' : 'disable-btn')" type="button" @click="joinRoom">Join</button>
                <button :class="'button-input ' + (ws_open ? 'create-btn' : 'disable-btn')" type="button" @click="createRoom">Create</button>
            </div>
            <div v-else class="col-12 col-12-m col-5-l padding-top-1rem padding-top-0-25rem-l">
                <label>Room:</label>
                <label class="text-display">{{ room_id }}</label>
                <button :class="'button-input ' + (ws_open ? 'leave-btn' : 'disable-btn')" type="button" @click="leaveRoom">Leave</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
input, select, option, button {
    font-size: 1rem;
}

#gui-title {
    font-size: 1.2rem;
    font-weight: bold;
}

#global-gui {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
}

.row {
    margin: 0;
}

.space-right {
    margin-right: 2rem;
}

.space-right-half {
    margin-right: 1rem;
}

.space-left {
    margin-left: 0.5rem;
}

.number-input {
    width: 3.5rem;
}

.dropdown-input {
    width: 17.5rem;
}

.text-input {
    width: 8rem;
}

.button-input {
    display: inline-block;
    width: 4.5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
    border: none;
    color: #FFFFFF;
    margin: 0 0.5rem 0 0;
}

.join-btn {
    background-color: #4A9056;
}

.create-btn {
    background-color: #585EAC;
}

.leave-btn {
    background-color: #931F1F;
}

.disable-btn {
    background-color: #CDCDCD;
    color: #636363;
}

.text-display {
    display: inline-block;
    background-color: #DCDCDC;
    color: #000000;
    width: 7.6rem;
    margin: 0 0.5rem;
    padding: 0.2rem;
}
</style>