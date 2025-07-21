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

// NOTE: the docs addon will try to create argTypes for this component's props based on this types that this addon needs to handle
type Props = {
  someString?: string;
  someObject?: {
    anyString: string;
    enumString: string;
  };
  someArray?: string[];
};

const props = defineProps<Props>();

// Computed properties
const configString = computed((): string => stringify(props));
</script>
