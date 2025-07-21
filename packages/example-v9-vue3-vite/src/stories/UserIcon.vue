<template>
  <div class="component-with-object-prop">
    {{ twoLetterTextRef }}
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  user: {
    name: string;
    surname: string;
    patronymic?: string;
  };
}

const props = defineProps<Props>();

const twoLetterTextRef = computed((): string => {
  return `${props.user.name.slice(0, 1)}${props.user.surname.slice(0, 1)}`;
});
</script>

<style>
.component-with-object-prop {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background-color: green;
  border-radius: 100%;
  color: white;
}
</style>
