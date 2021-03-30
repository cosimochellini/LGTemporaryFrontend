<template>
  <div v-if="dialogCurrentOpen">
    <div class="fixed z-50 inset-0 overflow-y-auto">
      <div
        class="flex items-end justify-center min-h-screen pt-4 px-4 pb-60 text-center sm:block sm:p-0"
      >
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        ></div>

        <!-- This element is to trick the browser into centering the modal contents. -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div
          class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div
                class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
              >
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3
                  class="text-lg leading-6 font-medium text-gray-900 first-capitalize"
                >
                  {{ $t("dialog.title." + currentOptions.title) }}
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500 first-capitalize">
                    {{ $t("dialog.description." + currentOptions.description) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div
            class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
            v-if="
              currentOptions.buttons?.confirm || currentOptions.buttons?.cancel
            "
          >
            <button
              class="base-button danger w-full"
              v-if="currentOptions.buttons?.confirm"
              @click.stop="dispatchResult(true)"
              :tabindex="0"
            >
              {{ $t("dialog.buttons." + currentOptions.buttons?.confirm) }}
            </button>
            <button
              class="base-button transparent w-full mt-3 sm:mt-0"
              v-if="currentOptions.buttons?.cancel"
              @click.stop="dispatchResult(false)"
              :tabindex="1"
            >
              {{ $t("dialog.buttons." + currentOptions.buttons?.cancel) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { dialog, DialogOption } from "@/services/dialog.service";

export default defineComponent({
  data() {
    return {
      dialogCurrentOpen: false,
      currentOptions: {} as DialogOption,
    };
  },
  methods: {
    dispatchResult(result: boolean) {
      dialog.closeConfirm(result);
      this.dialogCurrentOpen = false;
    },
  },
  created() {
    dialog.onConfirm((op) => {
      this.currentOptions = op;
      this.dialogCurrentOpen = true;
    });
  },
});
</script>
