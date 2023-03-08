<template>
  <div class="checkbox" :class="{
        checked: inCompChecked,
        focus: focus
      }">
    <input type="checkbox" v-model="inCompChecked" :id="componentID" @focus="focus = true" @blur="focus = false"
           @change="">
    <label :for="componentID">
      <i class="iconfont icon-minus" style="top: 2px; position: relative" v-if="!inCompChecked"></i>
      <i class="iconfont icon-select-bold" style="top: 2px; position: relative" v-else></i>
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

<style scoped lang="scss">
.checkbox {
  background: rgba(#000, .1);
  display: inline-block;
  border-radius: 6px;
  padding: 4px 8px;
  border: 2px solid transparent;
  cursor: pointer;
  user-select: none;

  outline-offset: 2px;

  &.focus {
    outline: 2px #3b82f6 solid;
  }

  &:hover {
    background: rgba(#000, .2);
  }

  &.checked {
    border: 2px solid #1f2937;
    background: #1f2937;
    color: #fff;
  }

  input[type="checkbox"] {
    border-radius: 4px;
    margin: 0 3px 0 0;
    position: absolute;
    left: -9999px;
  }

  label {
    margin-bottom: 0;
    display: inline;
    position: relative;
    top: -2px;
    cursor: pointer;

    i {
      margin-right: 3px;
    }
  }
}

@media (prefers-color-scheme: dark) {
  .checkbox {
    background: rgba(#fff, .1);

    outline-offset: 2px;

    &:hover {
      background: rgba(#fff, .2);
    }

    &.checked {
      border: 2px solid transparent;
      background: #fff;
      color: #404040;
    }
  }
}
</style>