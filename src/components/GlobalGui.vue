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
            data_url: 'stthomas',
            data_url_list: {
                stthomas: 'https://gliese.cs.stthomas.edu:8008/datasets/scivis23/parquet/',
                add_new: '... Add new'
            },
            joined_room: false,
            room_id: ''
        }
    },
    emits: ['update-num-views', 'update-data-url', 'update-room-id'],
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
    <div id="global-gui">
        <span id="gui-title">Brain Plasticity</span>
        <label>Views:</label>
        <input class="number-input" type="number" min="1" :max="max_views" v-model="num_views" @input="updateNumViews"/>
        <label>Data URL:</label>
        <select class="dropdown-input" v-model="data_url" @change="updateDataUrl">
            <option v-for="(url, name) in data_url_list" :value="name">{{ url }}</option>
        </select>
        <label>Room:</label>
        <div v-if="!joined_room" style="display: inline;">
            <input class="text-input" type="text" placeholder="Enter ID" v-model="room_id"/>
            <button :class="'button-input ' + (ws_open ? 'join-btn' : 'disable-btn')" type="button" @click="joinRoom">Join</button>
            <button :class="'button-input ' + (ws_open ? 'create-btn' : 'disable-btn')" type="button" @click="createRoom">Create</button>
        </div>
        <div v-else style="display: inline;">
            <label class="text-display">{{ room_id }}</label>
            <button :class="'button-input ' + (ws_open ? 'leave-btn' : 'disable-btn')" type="button" @click="leaveRoom">Leave</button>
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
    margin-right: 8rem;
}

#global-gui {
    padding: 0.5rem;
    font-size: 1rem;
}

.number-input {
    width: 3.5rem;
    margin: 0 2rem 0 0.5rem;
}

.dropdown-input {
    width: 17.5rem;
    margin: 0 2rem 0 0.5rem;
}

.text-input {
    width: 8rem;
    margin: 0 0.5rem;
}

.button-input {
    width: 5rem;
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