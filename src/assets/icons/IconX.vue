<template>
  <svg
      aria-hidden="true"
      class="icon-x"
      fill="none"
      height="24"
      focusable="false"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
  >
    <path
        d="M18 6L6 18"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
    />
    <path
        d="M6 6L18 18"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
    />
  </svg>
</template>

<style scoped>
.icon-x {
  width: 24px;
  height: 24px;
  display: block;
  transition: transform var(--motion-base) var(--ease-standard);
}
</style>
