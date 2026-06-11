<template>
  <div class="user-profile">
    <!-- Mobile user profile (dropdown) -->
    <div
      v-if="isMobile"
      class="relative"
    >
      <button
        class="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 touch-target"
        :aria-expanded="isDropdownOpen"
        aria-haspopup="true"
        @click="toggleDropdown"
      >
        <div class="flex-shrink-0">
          <UserAvatar
            :user="user"
            size="sm"
          />
        </div>
        <div class="ml-3 flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ userName }}
          </p>
          <p class="text-xs text-gray-500 truncate">
            {{ user.email }}
          </p>
        </div>
        <div class="ml-2 flex-shrink-0">
          <svg
            class="w-5 h-5 text-gray-400 transition-transform duration-200"
            :class="{ 'rotate-180': isDropdownOpen }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      <!-- Mobile dropdown menu -->
      <div
        v-if="isDropdownOpen"
        class="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50"
      >
        <div class="py-1">
          <div class="px-4 py-2 border-b border-gray-100">
            <p class="text-xs text-gray-500">
              Tipo de utilizador
            </p>
            <p class="text-sm font-medium text-gray-900">
              {{ userTypeLabel }}
            </p>
          </div>
          <button
            class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 touch-target"
            :disabled="isSigningOut"
            @click="handleSignOut"
          >
            <div class="flex items-center">
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {{ isSigningOut ? 'A sair...' : 'Sair' }}
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Desktop user profile -->
    <div
      v-else
      class="relative"
    >
      <button
        class="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        :aria-expanded="isDropdownOpen"
        aria-haspopup="true"
        @click="toggleDropdown"
      >
        <UserAvatar
          :user="user"
          size="sm"
        />
        <div class="ml-2 hidden lg:block">
          <p class="text-sm font-medium text-gray-900">
            {{ userName }}
          </p>
          <p class="text-xs text-gray-500">
            {{ userTypeLabel }}
          </p>
        </div>
        <svg
          class="ml-2 w-4 h-4 text-gray-400 transition-transform duration-200"
          :class="{ 'rotate-180': isDropdownOpen }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <!-- Desktop dropdown menu -->
      <div
        v-if="isDropdownOpen"
        class="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50"
      >
        <div class="py-1">
          <!-- User info -->
          <div class="px-4 py-3 border-b border-gray-100">
            <div class="flex items-center">
              <UserAvatar
                :user="user"
                size="md"
              />
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-900">
                  {{ userName }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ user.email }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ userTypeLabel }}
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="py-1">
            <button
              class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              :disabled="isSigningOut"
              @click="handleSignOut"
            >
              <div class="flex items-center">
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                {{ isSigningOut ? 'A sair...' : 'Sair' }}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay for mobile -->
    <div
      v-if="isDropdownOpen && isMobile"
      class="fixed inset-0 z-40 bg-black bg-opacity-25"
      @click="closeDropdown"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import type { UserContext } from '@clever/shared';
import { useAuth } from '@/composables/useAuth';
import { useUserType } from '@/composables/useUserType';
import UserAvatar from './UserAvatar.vue';

interface Props {
  user: UserContext;
  isMobile?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isMobile: false,
});

const router = useRouter();
const { signOut } = useAuth();
const { userTypeDisplayName } = useUserType();

// Local state
const isDropdownOpen = ref(false);
const isSigningOut = ref(false);

// Computed properties
const userName = computed(() => {
  const fullName = `${props.user.firstName} ${props.user.lastName}`.trim();
  return fullName || props.user.email;
});

const userTypeLabel = computed(() => userTypeDisplayName.value);

// Methods
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

const handleSignOut = async () => {
  if (isSigningOut.value) return;

  try {
    isSigningOut.value = true;
    closeDropdown();

    await signOut();

    // Redirect to sign in page
    router.push('/entrar');
  } catch (error) {
    console.error('Sign out error:', error);
    // Handle error - could show a notification
  } finally {
    isSigningOut.value = false;
  }
};

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as Element;
  if (!target.closest('.user-profile')) {
    closeDropdown();
  }
};

// Close dropdown on escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Smooth transitions */
.user-profile button,
.user-profile div {
  transition: all 0.2s ease-in-out;
}

/* Dropdown animation */
.user-profile > div > div:last-child {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Rotate animation for chevron */
.rotate-180 {
  transform: rotate(180deg);
}
</style>
