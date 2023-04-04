<script>
export default {
    props: {},
    data() {
        return {
            num_views: 1,
            data_url: 'stthomas',
            data_url_list: {
                stthomas: 'https://gliese.cs.stthomas.edu:8008/datasets/scivis23/parquet/',
                add_new: '... Add new'
            }
        }
    },
    emits: ['update-num-views', 'update-data-url'],
    methods: {
        updateNumViews(event) {
            this.$emit('update-num-views', this.num_views);
        },

        updateDataUrl(event) {
            if (this.data_url === 'add_new') {
                // TODO: enable users to add their own data server URL
            }
            else {
                this.$emit('update-data-url', this.data_url_list[this.data_url]);
            }
        }
    }
}
</script>

<template>
    <div id="global-gui">
        <span id="gui-title">Brain Plasticity</span>
        <label>Views:</label>
        <input class="number-input" type="number" min="1" max="8" v-model="num_views" @input="updateNumViews"/>
        <label>Data URL:</label>
        <select class="dropdown-input" v-model="data_url" @change="updateDataUrl">
            <option v-for="(url, name) in data_url_list" :value="name">{{ url }}</option>
        </select>
        <label>Other stuff here...</label>
        <!-- TODO: add data URL? -->
    </div>
</template>

<style scoped>
input, select, option {
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
</style>