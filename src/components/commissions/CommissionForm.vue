<template>
  <form class="commission-form-card" @submit.prevent="submit">
    <div class="form-header">
      <span class="form-eyebrow">{{ t('commissions.form.eyebrow') }}</span>
      <h2 class="form-title">{{ t('commissions.form.title') }}</h2>
    </div>

    <div v-if="staffNoticeText" class="staff-notice">
      <i aria-hidden="true" class="fa-solid fa-circle-info"></i>
      <div>
        <strong>{{ t('commissions.form.staffNotesLabel') }}</strong>
        <p>{{ staffNoticeText }}</p>
      </div>
    </div>

    <div v-if="loadingSlots" aria-live="polite" class="state-block" role="status">
      <div aria-hidden="true" class="loading-sigil"></div>
      <span>{{ t('loading') || 'Loading commission slots...' }}</span>
    </div>

    <template v-else>
      <div v-if="buyMoreNeeded > 0" class="buy-more-notice">
        <i aria-hidden="true" class="fa-solid fa-triangle-exclamation"></i>
        <p>{{ buyMoreMessage }}</p>
        <RouterLink class="buy-more-link" to="/services/spell-rework">
          {{ t('commissions.form.buyMoreCta') }}
        </RouterLink>
      </div>

      <template v-else>
        <div v-if="slots.length > neededSlotCount" aria-labelledby="commission-slots-label" class="form-group" role="group">
          <span id="commission-slots-label" class="field-label">{{ t('commissions.form.slotsLabel') }}</span>
          <div class="slot-checklist">
            <label v-for="slot in slots" :key="slot.id" class="slot-check-item">
              <input
                  :checked="selectedSlotIds.includes(slot.id)"
                  :aria-invalid="!!validationErrors.slots"
                  :name="`commission-slot-${slot.id}`"
                  type="checkbox"
                  @change="toggleSlot(slot.id)"
              />
              <span>{{ formatSlotLabel(slot) }}</span>
            </label>
          </div>
          <small>{{ t('commissions.form.slotsNeeded').replace('{count}', String(neededSlotCount)) }}</small>
        </div>

        <!-- Budget meter -->
        <div class="budget-meter-group">
          <div class="budget-meter-header">
            <span class="budget-meter-label">{{ t('commissions.form.budgetLabel') }}</span>
            <span :class="{ over: overBudget }" class="budget-meter-value">{{ budgetUsedText }}</span>
          </div>
          <div class="budget-meter-track">
            <div :class="{ over: overBudget }" :style="{ transform: `scaleX(${budgetFillPercent / 100})` }" class="budget-meter-fill"></div>
          </div>
          <small class="budget-meter-hint">{{ t('commissions.form.budgetHint') }}</small>
        </div>

        <!-- Major changes -->
        <div class="change-section">
          <div class="change-section-header">
            <div>
              <h3>{{ t('commissions.form.majorSectionTitle') }}</h3>
              <small>{{ t('commissions.form.majorSectionHint') }}</small>
            </div>
            <span class="section-count">{{ majorChanges.length }} / {{ LIMITS.majorChangesMax }}</span>
          </div>

          <TransitionGroup name="row-fade">
            <div v-for="(change, index) in majorChanges" :key="change.key" class="change-row major-row">
              <div class="change-row-header">
                <span>{{ t('commissions.form.majorChangeLabel') }} #{{ index + 1 }}</span>
                <span class="row-cost">{{ LIMITS.majorCost }} {{ t('commissions.form.pointsUnit') }}</span>
                <button class="remove-change-btn" type="button" @click="removeMajorChange(index)">
                  <i aria-hidden="true" class="fa-solid fa-xmark"></i>
                  <span class="sr-only">Remove major change {{ index + 1 }}</span>
                </button>
              </div>

              <div class="form-group">
                <label :for="`major-${change.key}-target`">{{ t('commissions.form.targetNameLabel') }} *</label>
                <input
                    :id="`major-${change.key}-target`"
                    v-model="change.targetName"
                    :aria-describedby="validationErrors[`major.${index}.targetName`] ? `major-${change.key}-target-error` : undefined"
                    :aria-invalid="!!validationErrors[`major.${index}.targetName`]"
                    :class="{ error: validationErrors[`major.${index}.targetName`] }"
                    :maxlength="LIMITS.targetName"
                    :name="`major-${index}-target-name`"
                    autocomplete="off"
                    type="text"
                />
                <div v-if="validationErrors[`major.${index}.targetName`]" :id="`major-${change.key}-target-error`" class="field-error">
                  {{ validationErrors[`major.${index}.targetName`] }}
                </div>
              </div>

              <div class="form-group">
                <label :for="`major-${change.key}-type`">{{ t('commissions.form.majorTypeLabel') }} *</label>
                <select :id="`major-${change.key}-type`" v-model="change.majorType" :aria-invalid="!!validationErrors[`major.${index}.majorType`]" :class="{ error: validationErrors[`major.${index}.majorType`] }" :name="`major-${index}-type`">
                  <option :value="null">{{ t('commissions.form.selectPlaceholder') }}</option>
                  <option v-for="opt in MAJOR_TYPES" :key="opt.value" :value="opt.value">
                    {{ t(`commissions.majorType.${opt.value}`) }}
                  </option>
                </select>
                <div v-if="validationErrors[`major.${index}.majorType`]" class="field-error">
                  {{ validationErrors[`major.${index}.majorType`] }}
                </div>
              </div>

              <div class="form-group">
                <label :for="`major-${change.key}-request`">{{ t('commissions.form.requestedChangeLabel') }} *</label>
                <textarea
                    :id="`major-${change.key}-request`"
                    v-model="change.requestedChange"
                    :aria-invalid="!!validationErrors[`major.${index}.requestedChange`]"
                    :class="{ error: validationErrors[`major.${index}.requestedChange`] }"
                    :maxlength="LIMITS.majorRequestedChange"
                    :name="`major-${index}-requested-change`"
                    rows="4"
                ></textarea>
                <small>{{ change.requestedChange.length }} / {{ LIMITS.majorRequestedChange }}</small>
                <div v-if="validationErrors[`major.${index}.requestedChange`]" class="field-error">
                  {{ validationErrors[`major.${index}.requestedChange`] }}
                </div>
              </div>

              <div class="form-group">
                <label :for="`major-${change.key}-motivation`">{{ t('commissions.form.motivationLabel') }} *</label>
                <textarea
                    :id="`major-${change.key}-motivation`"
                    v-model="change.motivation"
                    :aria-invalid="!!validationErrors[`major.${index}.motivation`]"
                    :class="{ error: validationErrors[`major.${index}.motivation`] }"
                    :maxlength="LIMITS.majorMotivation"
                    :name="`major-${index}-motivation`"
                    rows="4"
                ></textarea>
                <small>{{ change.motivation.length }} / {{ LIMITS.majorMotivation }}</small>
                <div v-if="validationErrors[`major.${index}.motivation`]" class="field-error">
                  {{ validationErrors[`major.${index}.motivation`] }}
                </div>
              </div>

              <div class="form-group">
                <label :for="`major-${change.key}-lore`">{{ t('commissions.form.loreReferenceLabel') }}</label>
                <textarea
                    :id="`major-${change.key}-lore`"
                    v-model="change.loreReference"
                    :maxlength="LIMITS.majorLoreReference"
                    :name="`major-${index}-lore-reference`"
                    rows="3"
                ></textarea>
                <small>{{ change.loreReference.length }} / {{ LIMITS.majorLoreReference }}</small>
              </div>
            </div>
          </TransitionGroup>

          <button
              v-if="canAddMajor"
              class="add-change-btn"
              type="button"
              @click="addMajorChange"
          >
            <i aria-hidden="true" class="fa-solid fa-plus"></i>
            {{ t('commissions.form.addMajorChange') }}
          </button>
        </div>

        <!-- Minor changes -->
        <div class="change-section">
          <div class="change-section-header">
            <div>
              <h3>{{ t('commissions.form.minorSectionTitle') }}</h3>
              <small>{{ t('commissions.form.minorSectionHint') }}</small>
            </div>
            <span class="section-count">{{ minorChanges.length }} / {{ LIMITS.minorChangesMax }}</span>
          </div>

          <TransitionGroup name="row-fade">
            <div v-for="(change, index) in minorChanges" :key="change.key" class="change-row minor-row">
              <div class="change-row-header">
                <span>{{ t('commissions.form.minorChangeLabel') }} #{{ index + 1 }}</span>
                <span class="row-cost">{{ LIMITS.minorCost }} {{ t('commissions.form.pointsUnit') }}</span>
                <button class="remove-change-btn" type="button" @click="removeMinorChange(index)">
                  <i aria-hidden="true" class="fa-solid fa-xmark"></i>
                  <span class="sr-only">Remove minor change {{ index + 1 }}</span>
                </button>
              </div>

              <div class="form-group">
                <label :for="`minor-${change.key}-target`">{{ t('commissions.form.targetNameLabel') }} *</label>
                <input
                    :id="`minor-${change.key}-target`"
                    v-model="change.targetName"
                    :aria-invalid="!!validationErrors[`minor.${index}.targetName`]"
                    :class="{ error: validationErrors[`minor.${index}.targetName`] }"
                    :maxlength="LIMITS.targetName"
                    :name="`minor-${index}-target-name`"
                    autocomplete="off"
                    type="text"
                />
                <div v-if="validationErrors[`minor.${index}.targetName`]" class="field-error">
                  {{ validationErrors[`minor.${index}.targetName`] }}
                </div>
              </div>

              <div class="form-group">
                <label :for="`minor-${change.key}-description`">{{ t('commissions.form.changeDescriptionLabel') }} *</label>
                <textarea
                    :id="`minor-${change.key}-description`"
                    v-model="change.changeDescription"
                    :aria-invalid="!!validationErrors[`minor.${index}.changeDescription`]"
                    :class="{ error: validationErrors[`minor.${index}.changeDescription`] }"
                    :maxlength="LIMITS.minorChangeDescription"
                    :name="`minor-${index}-description`"
                    rows="2"
                ></textarea>
                <small>{{ change.changeDescription.length }} / {{ LIMITS.minorChangeDescription }}</small>
                <div v-if="validationErrors[`minor.${index}.changeDescription`]" class="field-error">
                  {{ validationErrors[`minor.${index}.changeDescription`] }}
                </div>
              </div>

              <div class="form-group">
                <label :for="`minor-${change.key}-motivation`">{{ t('commissions.form.motivationLabel') }} *</label>
                <textarea
                    :id="`minor-${change.key}-motivation`"
                    v-model="change.motivation"
                    :aria-invalid="!!validationErrors[`minor.${index}.motivation`]"
                    :class="{ error: validationErrors[`minor.${index}.motivation`] }"
                    :maxlength="LIMITS.minorMotivation"
                    :name="`minor-${index}-motivation`"
                    rows="2"
                ></textarea>
                <small>{{ change.motivation.length }} / {{ LIMITS.minorMotivation }}</small>
                <div v-if="validationErrors[`minor.${index}.motivation`]" class="field-error">
                  {{ validationErrors[`minor.${index}.motivation`] }}
                </div>
              </div>
            </div>
          </TransitionGroup>

          <button
              v-if="canAddMinor"
              class="add-change-btn"
              type="button"
              @click="addMinorChange"
          >
            <i aria-hidden="true" class="fa-solid fa-plus"></i>
            {{ t('commissions.form.addMinorChange') }}
          </button>
        </div>

        <div v-if="totalChanges === 0" class="empty-state-hint">
          <i aria-hidden="true" class="fa-solid fa-wand-magic-sparkles"></i>
          {{ t('commissions.form.emptyStateHint') }}
        </div>

        <!-- Confirmations -->
        <div class="confirmations">
          <label class="confirm-item">
            <input v-model="confirmLoreGrounded" :aria-invalid="!!validationErrors.confirmations" name="confirm-lore-grounded" type="checkbox"/>
            <span>{{ t('commissions.form.confirmLoreGrounded') }}</span>
          </label>
          <label class="confirm-item">
            <input v-model="confirmNoFundamentalRework" :aria-invalid="!!validationErrors.confirmations" name="confirm-no-rework" type="checkbox"/>
            <span>{{ t('commissions.form.confirmNoFundamentalRework') }}</span>
          </label>
          <label class="confirm-item">
            <input v-model="confirmNoNerfOtherCommission" :aria-invalid="!!validationErrors.confirmations" name="confirm-no-nerf" type="checkbox"/>
            <span>{{ t('commissions.form.confirmNoNerfOtherCommission') }}</span>
          </label>
          <label class="confirm-item">
            <input v-model="confirmUnderstandsScope" :aria-invalid="!!validationErrors.confirmations" name="confirm-scope" type="checkbox"/>
            <span>{{ t('commissions.form.confirmUnderstandsScope') }}</span>
          </label>
          <div v-if="validationErrors.confirmations" class="field-error">
            {{ validationErrors.confirmations }}
          </div>
        </div>

        <div v-if="validationErrors.slots" class="field-error slots-error" data-validation-error tabindex="-1">
          {{ validationErrors.slots }}
        </div>

        <div v-if="validationErrors.budget" class="field-error slots-error" data-validation-error tabindex="-1">
          {{ validationErrors.budget }}
        </div>

        <div class="form-actions">
          <button :disabled="submitting" class="submit-btn" type="submit">
            <span v-if="submitting" class="button-spinner"></span>
            {{ submitting ? t('commissions.form.submitting') : t('commissions.form.submit') }}
          </button>
        </div>
      </template>
    </template>
  </form>
</template>

<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {onBeforeRouteLeave, useRoute} from 'vue-router';
import {useI18n} from '@/composables/useI18n';
import {useNotification} from '@/services/useNotification';
import {commissionsAPI} from '@/utils/api/commissions';
import {COMMISSION_LIMITS as LIMITS, MAJOR_TYPES, computeBudgetUsed} from '@/types/commissions';
import type {
  CommissionSlotDto,
  MajorChangeDto,
  MinorChangeDto,
  SubmitCommissionRequestDto,
} from '@/types/commissions';

type DraftMajorChange = Omit<MajorChangeDto, 'loreReference'> & { key: number; loreReference: string };
type DraftMinorChange = MinorChangeDto & { key: number };

const emit = defineEmits<{ (e: 'submitted'): void }>();

const route = useRoute();
const {t} = useI18n();
const {show} = useNotification();

const loadingSlots = ref(true);
const submitting = ref(false);
const slots = ref<CommissionSlotDto[]>([]);
const selectedSlotIds = ref<string[]>([]);
const neededSlotCount = ref(1);
const staffNoticeText = ref<string | null>(null);
const validationErrors = ref<Record<string, string>>({});

let rowKeySeq = 0;
const nextRowKey = () => rowKeySeq++;

const majorChanges = ref<DraftMajorChange[]>([]);
const minorChanges = ref<DraftMinorChange[]>([]);

const confirmLoreGrounded = ref(false);
const confirmNoFundamentalRework = ref(false);
const confirmNoNerfOtherCommission = ref(false);
const confirmUnderstandsScope = ref(false);

const buyMoreNeeded = computed(() => Math.max(0, neededSlotCount.value - slots.value.length));
const buyMoreMessage = computed(() =>
    t('commissions.form.buyMoreNotice').replace('{count}', String(buyMoreNeeded.value)),
);

const budgetUsed = computed(() => computeBudgetUsed(majorChanges.value.length, minorChanges.value.length));
const overBudget = computed(() => budgetUsed.value > LIMITS.budgetMax);
const budgetFillPercent = computed(() => Math.min(100, (budgetUsed.value / LIMITS.budgetMax) * 100));
const budgetUsedText = computed(() =>
    t('commissions.form.budgetUsedFormat')
        .replace('{used}', String(budgetUsed.value))
        .replace('{max}', String(LIMITS.budgetMax)),
);
const totalChanges = computed(() => majorChanges.value.length + minorChanges.value.length);

const canAddMajor = computed(() =>
    majorChanges.value.length < LIMITS.majorChangesMax
    && budgetUsed.value + LIMITS.majorCost <= LIMITS.budgetMax,
);
const canAddMinor = computed(() =>
    minorChanges.value.length < LIMITS.minorChangesMax
    && budgetUsed.value + LIMITS.minorCost <= LIMITS.budgetMax,
);
const isDirty = computed(() => totalChanges.value > 0
    || confirmLoreGrounded.value
    || confirmNoFundamentalRework.value
    || confirmNoNerfOtherCommission.value
    || confirmUnderstandsScope.value);

const formatSlotLabel = (slot: CommissionSlotDto): string => {
  const date = new Date(slot.createdAt).toLocaleDateString();
  return `${t('commissions.form.slotLabel')} · ${date}`;
};

const loadSlots = async () => {
  loadingSlots.value = true;
  try {
    const response = await commissionsAPI.getSlots();
    slots.value = response.data;
  } finally {
    loadingSlots.value = false;
  }
};

const autoSelectSlots = () => {
  const preselected = route.query.slot as string | undefined;
  const picked: string[] = [];
  if (preselected && slots.value.some((s) => s.id === preselected)) {
    picked.push(preselected);
  }
  for (const s of slots.value) {
    if (picked.length >= neededSlotCount.value) break;
    if (!picked.includes(s.id)) picked.push(s.id);
  }
  selectedSlotIds.value = picked.slice(0, neededSlotCount.value);
};

const toggleSlot = (id: string) => {
  if (selectedSlotIds.value.includes(id)) {
    selectedSlotIds.value = selectedSlotIds.value.filter((s) => s !== id);
  } else if (selectedSlotIds.value.length < neededSlotCount.value) {
    selectedSlotIds.value = [...selectedSlotIds.value, id];
  }
};

const addMajorChange = () => {
  if (canAddMajor.value) {
    majorChanges.value.push({
      key: nextRowKey(),
      targetName: '',
      majorType: null as unknown as MajorChangeDto['majorType'],
      requestedChange: '',
      motivation: '',
      loreReference: '',
    });
  }
};

const removeMajorChange = (index: number) => {
  majorChanges.value.splice(index, 1);
};

const addMinorChange = () => {
  if (canAddMinor.value) {
    minorChanges.value.push({key: nextRowKey(), targetName: '', changeDescription: '', motivation: ''});
  }
};

const removeMinorChange = (index: number) => {
  minorChanges.value.splice(index, 1);
};

const resetForm = () => {
  majorChanges.value = [];
  minorChanges.value = [];
  confirmLoreGrounded.value = false;
  confirmNoFundamentalRework.value = false;
  confirmNoNerfOtherCommission.value = false;
  confirmUnderstandsScope.value = false;
  validationErrors.value = {};
  staffNoticeText.value = null;
  neededSlotCount.value = 1;
};

const validate = (): boolean => {
  const errors: Record<string, string> = {};

  majorChanges.value.forEach((change, index) => {
    if (!change.targetName.trim()) errors[`major.${index}.targetName`] = t('commissions.form.errorRequired');
    if (!change.majorType) errors[`major.${index}.majorType`] = t('commissions.form.errorRequired');
    if (!change.requestedChange.trim()) errors[`major.${index}.requestedChange`] = t('commissions.form.errorRequired');
    if (!change.motivation.trim()) errors[`major.${index}.motivation`] = t('commissions.form.errorRequired');
  });

  minorChanges.value.forEach((change, index) => {
    if (!change.targetName.trim()) errors[`minor.${index}.targetName`] = t('commissions.form.errorRequired');
    if (!change.changeDescription.trim()) errors[`minor.${index}.changeDescription`] = t('commissions.form.errorRequired');
    if (!change.motivation.trim()) errors[`minor.${index}.motivation`] = t('commissions.form.errorRequired');
  });

  if (totalChanges.value === 0) {
    errors.budget = t('commissions.form.errorAtLeastOneChange');
  } else if (overBudget.value) {
    errors.budget = t('commissions.form.errorBudgetExceeded').replace('{max}', String(LIMITS.budgetMax));
  }

  if (
      !confirmLoreGrounded.value ||
      !confirmNoFundamentalRework.value ||
      !confirmNoNerfOtherCommission.value ||
      !confirmUnderstandsScope.value
  ) {
    errors.confirmations = t('commissions.form.errorConfirmations');
  }

  if (selectedSlotIds.value.length !== neededSlotCount.value) {
    errors.slots = t('commissions.form.errorSlots');
  }

  validationErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const submit = async () => {
  if (!validate()) {
    await nextTick();
    document.querySelector<HTMLElement>('.commission-form-card [aria-invalid="true"], .commission-form-card [data-validation-error]')?.focus();
    return;
  }

  const body: SubmitCommissionRequestDto = {
    majorChanges: majorChanges.value.map((m) => ({
      targetName: m.targetName.trim(),
      majorType: m.majorType,
      requestedChange: m.requestedChange.trim(),
      motivation: m.motivation.trim(),
      loreReference: m.loreReference?.trim() || null,
    })),
    minorChanges: minorChanges.value.map((m) => ({
      targetName: m.targetName.trim(),
      changeDescription: m.changeDescription.trim(),
      motivation: m.motivation.trim(),
    })),
    slotIds: selectedSlotIds.value,
    confirmLoreGrounded: confirmLoreGrounded.value,
    confirmNoFundamentalRework: confirmNoFundamentalRework.value,
    confirmNoNerfOtherCommission: confirmNoNerfOtherCommission.value,
    confirmUnderstandsScope: confirmUnderstandsScope.value,
  };

  submitting.value = true;
  try {
    await commissionsAPI.submit(body);
    show(t('commissions.form.submitSuccess'), {type: 'success', duration: 5000});
    resetForm();
    await loadSlots();
    autoSelectSlots();
    emit('submitted');
  } catch {
    // base.ts request() already surfaces a toast for 4xx/5xx
  } finally {
    submitting.value = false;
  }
};

const applyResubmitQuery = async () => {
  const resubmitParam = route.query.resubmit as string | undefined;
  if (resubmitParam) {
    try {
      const response = await commissionsAPI.getById(resubmitParam);
      neededSlotCount.value = response.data.commissionsRequired || 1;
      staffNoticeText.value = response.data.staffNotes || null;
    } catch {
      neededSlotCount.value = 1;
      staffNoticeText.value = null;
    }
  } else {
    neededSlotCount.value = 1;
    staffNoticeText.value = null;
  }
  autoSelectSlots();
};

onMounted(async () => {
  window.addEventListener('beforeunload', preventDirtyUnload);
  await loadSlots();
  await applyResubmitQuery();
});

const preventDirtyUnload = (event: BeforeUnloadEvent) => {
  if (!isDirty.value || submitting.value) return;
  event.preventDefault();
};

onBeforeUnmount(() => window.removeEventListener('beforeunload', preventDirtyUnload));

onBeforeRouteLeave(() => {
  if (!isDirty.value || submitting.value) return true;
  return window.confirm('You have unsaved commission changes. Leave this page?');
});

// Re-applies when a "Resubmit" CTA elsewhere on the page pushes a new ?resubmit= query
// without remounting this component.
watch(() => route.query.resubmit, () => {
  if (!loadingSlots.value) applyResubmitQuery();
});
</script>

<style scoped>
.commission-form-card {
  background: rgba(13, 16, 30, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 32px;
  border-radius: var(--radius-lg);
}

.form-header {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.form-eyebrow {
  display: block;
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--myst-gold);
  text-transform: uppercase;
  letter-spacing: 4px;
  margin-bottom: 8px;
  opacity: 0.6;
}

.form-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--myst-offwhite);
}

.staff-notice {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 24px;
  background: rgba(96, 165, 250, 0.08);
  border-left: 3px solid #60a5fa;
  color: #cdd8ea;
  font-size: 13px;
  border-radius: var(--radius-md);
}

.staff-notice i {
  color: #60a5fa;
  padding-top: 2px;
}

.staff-notice strong {
  display: block;
  margin-bottom: 4px;
  color: #93c5fd;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.staff-notice p {
  margin: 0;
}

.state-block {
  padding: 60px 0;
  text-align: center;
}

.loading-sigil {
  width: 32px;
  height: 32px;
  margin: 0 auto;
  border: 2px solid rgba(200, 178, 115, 0.2);
  border-top-color: var(--myst-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.buy-more-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 24px;
  text-align: center;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
}

.buy-more-notice i {
  font-size: 22px;
  color: #f87171;
}

.buy-more-notice p {
  margin: 0;
  color: #ddd;
  font-size: 14px;
}

.buy-more-link {
  padding: 10px 24px;
  background: var(--myst-gold);
  color: #05070a;
  text-decoration: none;
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: background-color var(--motion-base) var(--ease-standard);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.buy-more-link:hover {
  background: var(--myst-gold-soft);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label,
.field-label {
  display: block;
  font-weight: 600;
  color: var(--myst-offwhite);
  font-size: 13px;
  margin-bottom: 8px;
}

.form-group small {
  display: block;
  color: #666;
  font-size: 11px;
  margin-top: 5px;
  text-align: right;
}

.form-group input[type='text'],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.25);
  color: #eee;
  box-sizing: border-box;
  transition: border-color var(--motion-base) var(--ease-standard), box-shadow var(--motion-base) var(--ease-standard);
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--myst-gold);
  box-shadow: 0 0 0 3px rgba(200, 178, 115, 0.15);
}

.form-group input.error,
.form-group select.error,
.form-group textarea.error {
  border-color: #ef4444;
}

.field-error {
  color: #f87171;
  font-size: 11px;
  font-weight: 500;
  margin-top: 5px;
}

.slots-error {
  margin-bottom: 16px;
}

.slot-checklist {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-check-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 13px;
  color: #ccc;
  cursor: pointer;
  border-radius: var(--radius-md);
}

.budget-meter-group {
  margin-bottom: 28px;
  padding: 18px 20px;
  background: rgba(200, 178, 115, 0.04);
  border: 1px solid rgba(200, 178, 115, 0.15);
  border-radius: var(--radius-md);
}

.budget-meter-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.budget-meter-label {
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--myst-gold);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.budget-meter-value {
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 700;
  color: var(--myst-offwhite);
  transition: color var(--motion-base) var(--ease-standard);
}

.budget-meter-value.over {
  color: #f87171;
}

.budget-meter-track {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
  border-radius: var(--radius-pill);
}

.budget-meter-fill {
  width: 100%;
  transform-origin: left;
  height: 100%;
  background: var(--myst-gold);
  transition: transform var(--motion-slow) var(--ease-enter), background-color var(--motion-base) var(--ease-standard);
  border-radius: inherit;
}

.budget-meter-fill.over {
  background: #f87171;
}

.budget-meter-hint {
  display: block;
  margin-top: 10px;
  color: #888;
  font-size: 11px;
  text-align: left;
}

.change-section {
  margin-bottom: 28px;
}

.change-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.change-section-header h3 {
  margin: 0 0 4px;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  color: var(--myst-offwhite);
}

.change-section-header small {
  color: #777;
  font-size: 11.5px;
}

.section-count {
  flex-shrink: 0;
  font-family: var(--font-ui);
  font-size: 11px;
  color: #888;
  white-space: nowrap;
}

.change-row {
  padding: 16px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
}

.change-row.major-row {
  border-left-color: var(--myst-gold);
}

.change-row.minor-row {
  border-left-color: #60a5fa;
}

.change-row-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--myst-gold);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.change-row-header span:first-child {
  flex: 1;
}

.row-cost {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #999;
  font-size: 10px;
  letter-spacing: 0.5px;
  border-radius: var(--radius-pill);
}

.remove-change-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  transition: color var(--motion-base) var(--ease-standard);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
}

.remove-change-btn:hover {
  color: #f87171;
}

.add-change-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  margin-bottom: 4px;
  background: transparent;
  border: 1px dashed rgba(200, 178, 115, 0.3);
  color: var(--myst-gold);
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-standard);
}

.add-change-btn:hover {
  background: rgba(200, 178, 115, 0.05);
}

.empty-state-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 16px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.015);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  color: #777;
  font-size: 13px;
  text-align: center;
  border-radius: var(--radius-md);
}

.empty-state-hint i {
  color: var(--myst-gold);
  opacity: 0.7;
}

.row-fade-enter-active,
.row-fade-leave-active {
  transition: opacity var(--motion-slow) var(--ease-enter), transform var(--motion-slow) var(--ease-enter);
}

.row-fade-enter-from,
.row-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.row-fade-leave-active {
  position: absolute;
}

.add-minor-btn:hover {
  background: rgba(200, 178, 115, 0.05);
}

.confirmations {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  margin: 24px 0;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
}

.confirm-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12.5px;
  color: #bbb;
  cursor: pointer;
}

.confirm-item input {
  margin-top: 2px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 32px;
  background: var(--myst-gold);
  color: #05070a;
  border: none;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard);
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
}

.submit-btn:hover:not(:disabled) {
  background: var(--myst-gold-soft);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-spinner {
  width: 13px;
  height: 13px;
  border: 1.5px solid rgba(0, 0, 0, 0.3);
  border-top: 1.5px solid #05070a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@media (max-width: 600px) {
  .commission-form-card {
    padding: 20px;
  }
}
</style>
