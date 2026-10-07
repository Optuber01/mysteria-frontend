<template>
  <!-- Finds a verified player by nickname, for a gift. -->
  <div class="recipient">
    <label v-if="label" :for="inputId" class="recipient__label">{{ label }}</label>

    <div class="recipient__search">
      <input
          :id="inputId"
          v-model="searchQuery"
          :aria-controls="listId"
          :aria-expanded="userOptions.length > 0"
          :class="{'is-selected': isUserSelected}"
          :disabled="disabled"
          :placeholder="placeholder || t('selectRecipient')"
          autocomplete="off"
          class="arc-field recipient__input"
          role="combobox"
          aria-autocomplete="list"
          type="text"
          @input="handleSearchInput"
      />
      <span class="recipient__icon" aria-hidden="true">
        <i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i>
        <i v-else-if="isUserSelected" class="fa-solid fa-check recipient__ok"></i>
        <i v-else class="fa-solid fa-magnifying-glass"></i>
      </span>
    </div>

    <Transition name="arc-fade">
      <ul v-if="userOptions.length > 0" :id="listId" class="recipient__results" role="listbox" :aria-label="label">
        <li v-for="user in userOptions" :key="user.value" role="presentation">
          <button
              :aria-selected="modelValue === user.value"
              :class="{'is-selected': modelValue === user.value}"
              class="recipient__option"
              role="option"
              type="button"
              @click="handleUserSelect(user.value)"
          >
            <span>{{ user.label }}</span>
            <span v-if="user.description" class="recipient__desc">{{ user.description }}</span>
          </button>
        </li>
      </ul>
    </Transition>

    <p v-if="!isLoading && !isUserSelected && searchQuery.length >= 2 && userOptions.length === 0" class="recipient__note" role="status">
      {{ t('noUsersFound') }}
    </p>

    <p v-if="error" class="recipient__note recipient__error" role="alert">
      <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
      {{ error }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import {computed, ref, useId} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {usersAPI} from '@/utils/api/users';
import type {UserSearchDto} from '@/types/users';
import {debounce} from 'lodash-es';

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const {t} = useI18n();
const uid = useId();
const inputId = `recipient-${uid}`;
const listId = `recipient-list-${uid}`;
const users = ref<UserSearchDto[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const isUserSelected = ref(false);

const userOptions = computed(() => {
  return users.value
      .filter(user => user.verified)
      .map(user => ({
        label: user.nickname || user.discordId || user.email || 'Unknown',
        value: user.id,
        description: user.email || user.discordId || '',
        verified: user.verified,
      }));
});

const performSearch = debounce(async (query: string) => {
  if (!query || query.trim().length < 2) {
    users.value = [];
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const response = await usersAPI.searchUsers(query.trim());
    users.value = response.data;
  } catch (err) {
    console.error('Error searching users:', err);
    error.value = t('errorSearchingUsers') || 'Failed to search users. Please try again.';
    users.value = [];
  } finally {
    isLoading.value = false;
  }
}, 500);

const handleSearchInput = () => {
  isUserSelected.value = false;
  performSearch(searchQuery.value);
};

const handleUserSelect = (userId: string) => {
  if (props.disabled) return;
  const selectedUser = userOptions.value.find(u => u.value === userId);
  if (selectedUser) {
    searchQuery.value = selectedUser.label;
  }
  emit('update:modelValue', userId);
  isUserSelected.value = true;
  users.value = [];
};
</script>

<style scoped>
.recipient {
  position: relative;
  display: grid;
  gap: 8px;
  width: 100%;
}

.recipient__label {
  font-size: var(--arc-fs-small);
  font-weight: 600;
}

.recipient__search {
  position: relative;
}

.recipient__input {
  padding-right: 42px;
}

.recipient__input.is-selected {
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-ok);
}

.recipient__icon {
  position: absolute;
  top: 50%;
  right: 14px;
  color: var(--arc-muted);
  font-size: 14px;
  transform: translateY(-50%);
}

.recipient__ok {
  color: var(--arc-ok);
}

.recipient__results {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  z-index: 10;
  max-height: 240px;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  border-radius: var(--arc-r-md);
  background: var(--arc-pop);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line), 0 14px 40px var(--arc-shadow);
  list-style: none;
}

.recipient__option {
  display: grid;
  gap: 2px;
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  border: 0;
  border-radius: var(--arc-r-sm);
  background: none;
  color: var(--arc-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.recipient__option:hover,
.recipient__option.is-selected {
  background: color-mix(in oklab, var(--acc) 10%, transparent);
}

.recipient__desc,
.recipient__note {
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
}

.recipient__note {
  margin: 0;
}

.recipient__error {
  color: var(--arc-bad);
}
</style>
