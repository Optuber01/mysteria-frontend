<template>
  <div class="user-ritual-selector">
    <label v-if="label" class="ritual-label" for="recipient-search">{{ label }}</label>

    <div class="ritual-search-wrapper">
      <input
          v-model="searchQuery"
          id="recipient-search"
          :aria-activedescendant="activeIndex >= 0 ? `recipient-option-${activeIndex}` : undefined"
          :aria-controls="userOptions.length ? 'recipient-results' : undefined"
          :aria-expanded="userOptions.length > 0"
          aria-autocomplete="list"
          :class="['ritual-search-input', { 'is-selected': isUserSelected }]"
          :disabled="disabled"
          :placeholder="placeholder || t('selectRecipient')"
          autocomplete="off"
          name="recipient-search"
          role="combobox"
          type="text"
          @input="handleSearchInput"
          @keydown="handleSearchKeydown"
      />
      <div class="ritual-search-icon">
        <i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i>
        <i v-else-if="isUserSelected" class="fa-solid fa-check-double success-ritual"></i>
        <i v-else class="fa-solid fa-magnifying-glass"></i>
      </div>
    </div>

    <Transition name="ritual-fade">
      <ul v-if="userOptions.length > 0" id="recipient-results" class="ritual-results no-scrollbar" role="listbox">
        <li
            v-for="user in userOptions"
            :key="user.value"
            role="none"
        >
          <button
              :id="`recipient-option-${userOptions.indexOf(user)}`"
              :aria-selected="modelValue === user.value"
              :class="{ selected: modelValue === user.value, active: activeIndex === userOptions.indexOf(user) }"
              class="ritual-user-option"
              role="option"
              tabindex="-1"
              type="button"
              @click="handleUserSelect(user.value)"
              @mouseenter="activeIndex = userOptions.indexOf(user)"
          >
            <span class="user-ritual-info">
              <span class="user-ritual-name">
               {{ user.label }}
                <i v-if="user.verified" :title="t('verified')" aria-hidden="true" class="fa-solid fa-certificate gold-seal"></i>
              </span>
              <span v-if="user.description" class="user-ritual-desc">{{ user.description }}</span>
            </span>
          </button>
        </li>
      </ul>
    </Transition>

    <div v-if="!isLoading && !isUserSelected && searchQuery.length >= 2 && userOptions.length === 0" aria-live="polite" class="ritual-no-results" role="status">
      {{ t('noUsersFound') || 'No verified users found' }}
    </div>

    <div v-if="error" class="ritual-error" role="alert">
      <i class="fa-solid fa-triangle-exclamation"></i>
      {{ error }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, ref, watch} from 'vue';
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
const users = ref<UserSearchDto[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const isUserSelected = ref(false);
const activeIndex = ref(-1);
let searchGeneration = 0;

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

const performSearch = debounce(async (query: string, generation: number) => {
  if (!query || query.trim().length < 2) {
    users.value = [];
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const response = await usersAPI.searchUsers(query.trim());
    if (generation === searchGeneration) users.value = response.data;
  } catch (err) {
    if (generation !== searchGeneration) return;
    console.error('Error searching users:', err);
    error.value = t('errorSearchingUsers') || 'Failed to search users. Please try again.';
    users.value = [];
  } finally {
    if (generation === searchGeneration) isLoading.value = false;
  }
}, 500);

const handleSearchInput = () => {
  isUserSelected.value = false;
  if (props.modelValue) emit('update:modelValue', '');
  users.value = [];
  activeIndex.value = -1;
  searchGeneration += 1;
  performSearch(searchQuery.value, searchGeneration);
};

const handleSearchKeydown = (event: KeyboardEvent) => {
  if (!userOptions.value.length) return;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, userOptions.value.length - 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
  } else if (event.key === 'Enter' && activeIndex.value >= 0) {
    event.preventDefault();
    handleUserSelect(userOptions.value[activeIndex.value].value);
  } else if (event.key === 'Escape') {
    users.value = [];
    activeIndex.value = -1;
  }
};

watch(userOptions, options => {
  activeIndex.value = options.length ? 0 : -1;
});

const handleUserSelect = (userId: string) => {
  if (props.disabled) return;
  const selectedUser = userOptions.value.find(u => u.value === userId);
  if (selectedUser) {
    searchQuery.value = selectedUser.label;
  }
  emit('update:modelValue', userId);
  searchGeneration += 1;
  performSearch.cancel();
  isUserSelected.value = true;
  activeIndex.value = -1;
  users.value = [];
};
</script>

<style scoped>
.user-ritual-selector { position: relative; width: 100%; }

.ritual-label {
  display: block; margin-bottom: 12px;
  font-family: var(--font-ui); font-size: 14px;
  color: var(--myst-gold); text-transform: uppercase; letter-spacing: 2px;
}

.ritual-search-wrapper { position: relative; }

.ritual-search-input {
  width: 100%; padding: 14px 44px 14px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  color: #fff; font-family: var(--font-ui); font-size: 14px;
  transition:
    background-color var(--motion-base) var(--ease-standard),
    border-color var(--motion-base) var(--ease-standard),
    box-shadow var(--motion-base) var(--ease-standard),
    color var(--motion-base) var(--ease-standard);
}

.ritual-search-input:focus {
  outline: none; border-color: var(--myst-gold);
  background: rgba(200, 178, 115, 0.05);
  box-shadow: 0 0 20px rgba(200, 178, 115, 0.1);
}

.ritual-search-input.is-selected {
  border-color: rgba(74, 222, 128, 0.3);
  color: #4ade80;
}

.ritual-search-icon {
  position: absolute; right: 16px; top: 50%;
  transform: translateY(-50%); color: #444; font-size: 14px;
}

.success-ritual { color: #4ade80; }

.ritual-results {
  position: absolute; top: calc(100% + 12px); left: 0; right: 0;
  max-height: 240px; overflow-y: auto;
  margin: 0; padding: 0; list-style: none;
  background: #080a14; border: 1px solid rgba(200, 178, 115, 0.2);
  border-radius: var(--radius-lg); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  z-index: 1000;
}

.ritual-user-option {
  width: 100%; padding: 14px 16px; cursor: pointer; border: 0; color: inherit; background: transparent; text-align: left;
  transition: background-color var(--motion-base) var(--ease-standard), color var(--motion-base) var(--ease-standard); border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-md);
}

.ritual-user-option:last-child { border-bottom: none; }

.ritual-user-option:hover, .ritual-user-option.active { background: rgba(255, 255, 255, 0.05); }

.ritual-user-option.selected {
  background: rgba(200, 178, 115, 0.05);
  border-left: 2px solid var(--myst-gold);
}

.user-ritual-info { display: flex; flex-direction: column; gap: 4px; }

.user-ritual-name {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--font-display); font-size: 16px; color: #fff;
}

.gold-seal { color: var(--myst-gold); font-size: 12px; }

.user-ritual-desc { font-family: var(--font-ui); font-size: 11px; color: #777; }

.ritual-no-results {
  padding: 16px; text-align: center;
  font-family: var(--font-ui); font-size: 13px; color: #777;
}

.ritual-error {
  display: flex; align-items: center; gap: 8px; margin-top: 12px;
  color: #ff5252; font-size: 13px;
}

.no-scrollbar::-webkit-scrollbar { display: none; }

.ritual-fade-enter-active, .ritual-fade-leave-active { transition: opacity var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-enter); }
.ritual-fade-enter-from, .ritual-fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
