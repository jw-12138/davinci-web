<template>
  <div class="checkbox" :class="{
        focus: focus
      }">
    <input type="checkbox" v-model="inCompChecked" :id="componentID" @focus="focus = true" @blur="focus = false"
           @change="$emit('update:checked', $event.target.checked)">
    <label :for="componentID">
      <slot></slot>
    </label>
  </div>
</template>

<script>
export default {
  props: {
    checked: {
      type: Boolean
    }
  },
  model: {
    prop: 'checked',
    event: 'check-change'
  },
  data() {
    return {
      inCompChecked: false,
      focus: false,
      componentID: ''
    }
  },
  created() {
    this.inCompChecked = this.checked
    this.componentID = 'checkbox_' + (Math.random().toString(36).substr(2, 9))
  },
  watch: {
    inCompChecked(val) {
      if (val === undefined) {
        return
      }
      this.$emit('check-change', val)
    },
    checked(val) {
      this.inCompChecked = val
    }
  }
}
</script>