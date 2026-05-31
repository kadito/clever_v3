<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <!-- Logo and title -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-primary-600 mb-2">CLEVER</h1>
        <h2 class="text-xl text-gray-900 font-medium">Entrar na sua conta</h2>
        <p class="mt-2 text-sm text-gray-600">Aceda ao seu dashboard CLEVER</p>
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- Clerk SignIn component -->
        <div class="clerk-signin-container">
          <div ref="signInRef" class="w-full"></div>
        </div>

        <!-- Error handling -->
        <div v-if="authError" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Erro de autenticação</h3>
              <div class="mt-1 text-sm text-red-700">
                {{ authError }}
              </div>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="mt-4 text-center">
          <div class="inline-flex items-center px-4 py-2 text-sm text-gray-600">
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            A carregar...
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-6 text-center">
        <p class="text-xs text-gray-500">CLEVER Dashboard v3.0</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const route = useRoute();
const { isLoaded, isSignedIn } = useAuth();

// Local state
const authError = ref<string | null>(null);
const isLoading = ref(true);
const signInRef = ref<HTMLElement | null>(null);

// Compute redirect URL - go to intended route or dashboard
const redirectUrl = computed(() => {
  const redirect = route.query.redirect as string;
  return redirect || '/';
});

// Handle Clerk component loaded
const handleClerkLoaded = () => {
  isLoading.value = false;
};

// Watch for successful authentication
import { watch } from 'vue';
watch(
  [isLoaded, isSignedIn],
  ([loaded, signedIn]) => {
    if (loaded && signedIn) {
      // Clear any errors
      authError.value = null;

      // Redirect to intended destination
      const redirect = route.query.redirect as string;
      router.push(redirect || '/');
    }
  },
  { immediate: true }
);

// Handle authentication errors
const handleAuthError = (error: string) => {
  authError.value = error;
  isLoading.value = false;
};

onMounted(() => {
  // If already signed in, redirect immediately
  if (isLoaded.value && isSignedIn.value) {
    const redirect = route.query.redirect as string;
    router.push(redirect || '/');
    return;
  }

  // Mount Clerk SignIn component
  let mountAttempts = 0;
  const MAX_MOUNT_ATTEMPTS = 30; // 3 seconds max

  const mountSignIn = () => {
    if (window.Clerk && signInRef.value) {
      try {
        window.Clerk.mountSignIn(signInRef.value, {
          appearance: {
            elements: {
              formButtonPrimary:
                'bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200',
              card: 'shadow-none border-none',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton:
                'border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors duration-200',
              formFieldInput:
                'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500',
              formFieldLabel: 'block text-sm font-medium text-gray-700 mb-1',
              dividerLine: 'bg-gray-200',
              dividerText: 'text-gray-500 text-sm',
              footerActionLink: 'text-primary-600 hover:text-primary-500 font-medium',
              identityPreviewText: 'text-gray-900',
              identityPreviewEditButton: 'text-primary-600 hover:text-primary-500',
              formResendCodeLink: 'text-primary-600 hover:text-primary-500',
              otpCodeFieldInput:
                'w-12 h-12 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500',
            },
            layout: {
              socialButtonsPlacement: 'bottom',
              showOptionalFields: false,
            },
            variables: {
              colorPrimary: '#75AE93',
              colorText: '#1f2937',
              colorTextSecondary: '#6b7280',
              colorBackground: '#ffffff',
              colorInputBackground: '#ffffff',
              colorInputText: '#1f2937',
              borderRadius: '0.375rem',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            },
          },
          redirectUrl: redirectUrl.value,
        });
        isLoading.value = false;
      } catch (error) {
        console.error('Failed to mount SignIn:', error);
        handleAuthError('Failed to load sign-in form');
      }
    } else {
      mountAttempts++;
      if (mountAttempts >= MAX_MOUNT_ATTEMPTS) {
        handleAuthError('Não foi possível carregar o formulário de autenticação. Recarregue a página.');
        return;
      }
      // Wait for Clerk to be available
      setTimeout(mountSignIn, 100);
    }
  };

  mountSignIn();
});

onUnmounted(() => {
  // Unmount Clerk component
  if (window.Clerk && signInRef.value) {
    try {
      window.Clerk.unmountSignIn(signInRef.value);
    } catch (error) {
      console.error('Failed to unmount SignIn:', error);
    }
  }
});
</script>

<style scoped>
/* Custom styles for mobile-first design */
.clerk-signin-container {
  /* Ensure Clerk components are mobile-friendly */
  width: 100%;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .clerk-signin-container {
    /* Adjust spacing for mobile */
    padding: 0;
  }
}

/* Touch-friendly form elements */
:deep(.cl-formButtonPrimary) {
  min-height: 44px;
  font-size: 16px; /* Prevent zoom on iOS */
}

:deep(.cl-formFieldInput) {
  min-height: 44px;
  font-size: 16px; /* Prevent zoom on iOS */
}

/* Loading spinner animation */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
