<template>
  <Teleport to="body">
    <Transition duration="300" name="fadeIn">
      <div class="v-dialog-modal" v-if="show">
        <div class="v-dialog-wrap">
          <div class="v-dialog-box">
            <h4 class="title mb-0">{{ title }}</h4>

            <div class="content">
              <slot></slot>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: ''
    },
    show: {
      type: Boolean,
      default: false
    }
  },
  model: {
    prop: 'show',
    event: 'update:show'
  }
}
</script>

<style lang="scss" scoped>
.fadeIn-enter-active {
  animation: fadeIn .3s ease;
}

.fadeIn-leave-active {
  animation: fadeOut .3s ease forwards;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>