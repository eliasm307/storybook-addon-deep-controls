<template>
  <div>
    <h1>Config received by Component:</h1>
    <pre id="actual-config-json" style="white-space: pre-wrap; word-wrap: normal">
      {{ configString }}
    </pre>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue";
import {stringify} from "@storybook-addon-deep-controls/common-internal";

const props = defineProps<{
  someObject: any;
}>();

// Computed properties
const configString = computed(() => stringify(props));
</script>
