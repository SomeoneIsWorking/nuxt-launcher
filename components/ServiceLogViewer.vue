<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <div
      class="absolute z-10 top-4 right-6 flex items-stretch bg-gray-800/90 rounded-full shadow-lg backdrop-blur-sm text-sm text-gray-300"
    >
      <button @click="clearLogs" class="px-5 py-2 hover:text-white">
        Clear Logs
      </button>
      <span class="inline-block w-0.5 flex-grow bg-gray-500"></span>
      <div class="px-5 flex items-center">
        Error {{ currentOrPreviousErrorIndex + 1 }} of {{ errors.length }}
      </div>
      <!-- vertical separator -->
      <span class="inline-block w-0.5 flex-grow bg-gray-500"></span>
      <div class="flex items-center gap-2 px-5 py-2">
        <button
          @click="navigateError(errorsAbove.at(-1))"
          :disabled="!errorsAbove.length"
          class="nav-buttons"
        >
          {{ errorsAbove.length }}
          <ChevronUp class="w-5 h-5" />
        </button>
        <button
          @click="navigateError(errorsBelow[0])"
          :disabled="!errorsBelow.length"
          class="nav-buttons"
        >
          {{ errorsBelow.length }}
          <ChevronDown class="w-5 h-5" />
        </button>
      </div>
    </div>
    <VirtualScroller
      ref="virtualScroller"
      :items="service.logs"
      height="100%"
      :buffer="10"
      @scroll="handleScroll"
    >
      <template #default="{ item: log, index }">
        <LogEntry :log="log" :service-name="service.name" />
      </template>
    </VirtualScroller>
    <button
      v-if="!isScrolledToBottom"
      @click="scrollToBottom"
      class="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full"
    >
      <ChevronDown class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, onMounted } from "vue";
import { ChevronUp, ChevronDown } from "lucide-vue-next";
import type { ComponentInstance } from "vue";
import VirtualScroller from "./VirtualScroller.vue";

const props = defineProps<{
  serviceId: string;
}>();
const store = useServicesStore();
const service = computed(() => store.services[props.serviceId]);
const virtualScroller = ref<ComponentInstance<typeof VirtualScroller>>();
const isScrolledToBottom = ref(true);
const currentOrPreviousErrorIndex = ref(-1);

const errors = computed(() =>
  service.value.logs
    .map((log, index) => ({ ...log, elementIndex: index }))
    .filter(({ level }) => level === "ERR")
);

const errorsAbove = ref<typeof errors.value>([]);
const errorsBelow = ref<typeof errors.value>([]);

const handleScroll = ({
  scrollTop,
  isAtBottom,
}: {
  scrollTop: number;
  isAtBottom: boolean;
}) => {
  isScrolledToBottom.value = isAtBottom;

  const range = virtualScroller.value?.getVisibleRange();
  if (!range) return;

  errorsAbove.value = errors.value.filter(
    error => error.elementIndex < range.start
  );
  
  errorsBelow.value = errors.value.filter(
    error => error.elementIndex > range.end
  );

  currentOrPreviousErrorIndex.value = errors.value.findIndex(
    error => error.elementIndex <= range.end && error.elementIndex >= range.start
  );
};

onMounted(() => {
  const savedPosition = store.getScrollPosition(props.serviceId);
  if (savedPosition) {
    virtualScroller.value?.scrollTo(savedPosition);
  } else {
    scrollToBottom();
  }
});

onBeforeUnmount(() => {
  store.saveScrollPosition(
    props.serviceId,
    isScrolledToBottom.value ? undefined : virtualScroller.value?.$el.scrollTop
  );
});

const scrollToBottom = () => {
  virtualScroller.value?.scrollToBottom();
};

const navigateError = (error: (typeof errors.value)[number] | undefined) => {
  if (!error) return;
  virtualScroller.value?.scrollToIndex(error.elementIndex);
};

const clearLogs = async () => {
  await store.clearLogs(props.serviceId);
};

watch(
  () => service.value.logs,
  () => {
    if (isScrolledToBottom.value) {
      nextTick(scrollToBottom);
    }
  }
);
</script>

<style scoped lang="postcss">
:deep(a) {
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: underline;
}

button:not(:disabled):hover {
  background-color: #4b5563;
}

button.nav-buttons {
  @apply rounded-full bg-gray-700 text-white disabled:opacity-50 flex items-center justify-center h-6 w-12;
}
</style>
