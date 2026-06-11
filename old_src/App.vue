<template>
  <div id="app">
    <!-- Show navigation only when signed in -->
    <SignedIn>
      <!-- Mobile-first navigation -->
      <nav class="navbar">
        <div class="nav-container">
          <h1 class="nav-title">
            Clever
          </h1>

          <!-- User controls for desktop -->
          <div class="user-controls desktop-only">
            <span
              v-if="user"
              class="user-welcome"
            >
              Olá, {{ user.firstName || user.emailAddresses?.[0]?.emailAddress }}
            </span>
            <button
              v-if="isAdmin"
              class="nav-link admin-link"
              title="Gestão de Utilizadores"
              @click="goToUserManagement"
            >
              <span class="nav-icon">👥</span>
              Admin
            </button>
            <UserButton />
          </div>

          <button
            class="mobile-menu-toggle"
            :class="{ active: isMobileMenuOpen }"
            @click="toggleMobileMenu"
          >
            <span />
            <span />
            <span />
          </button>

          <div
            class="nav-links"
            :class="{ 'mobile-open': isMobileMenuOpen }"
          >
            <router-link
              to="/"
              class="nav-link"
              @click="closeMobileMenu"
            >
              <span class="nav-icon">🏠</span>
              Home
            </router-link>
            <router-link
              to="/dashboard"
              class="nav-link"
              @click="closeMobileMenu"
            >
              <span class="nav-icon">📊</span>
              Dashboard
            </router-link>

            <!-- Mobile user controls -->
            <div class="mobile-user-controls mobile-only">
              <button
                v-if="isAdmin"
                class="nav-link admin-link"
                @click="goToUserManagement"
              >
                <span class="nav-icon">👥</span>
                Gestão de Utilizadores
              </button>
              <div class="mobile-user-button">
                <UserButton />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </SignedIn>

    <main
      class="main-content"
      :class="{ 'no-nav': !isSignedIn }"
    >
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { SignedIn, UserButton, useUser } from '@clerk/vue';

const router = useRouter();

// Clerk composables
const { user, isSignedIn, isLoaded } = useUser();

// Reactive state
const isMobileMenuOpen = ref(false);

// Computed properties
const isAdmin = computed(() => {
  if (!isLoaded.value || !user.value) return false;
  return user.value.publicMetadata?.role === 'admin';
});

// Methods
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const goToUserManagement = () => {
  router.push('/admin/users');
  closeMobileMenu();
};
</script>

<style>
:root {
  --primary-color: rgb(117, 174, 147);
  --primary-hover: rgb(97, 154, 127);
  --primary-light: rgb(137, 194, 167);
  --primary-dark: rgb(77, 134, 107);
  --secondary-color: #2c3e50;
  --text-color: #333;
  --text-muted: #6c757d;
  --background: #f5f5f5;
  --white: #ffffff;
  --border: #e9ecef;
  --success: var(--primary-color);
  --danger: #dc3545;
  --warning: #ffc107;
  --info: #17a2b8;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--background);
  color: var(--text-color);
  /* Prevent horizontal scroll on mobile */
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
}

/* Mobile-first navigation */
.navbar {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.nav-title {
  font-size: 1.2rem;
  font-weight: 600;
}

/* Mobile menu toggle button */
.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  gap: 0.2rem;
}

.mobile-menu-toggle span {
  width: 25px;
  height: 3px;
  background-color: white;
  transition: all 0.3s ease;
  transform-origin: center;
}

.mobile-menu-toggle.active span:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.mobile-menu-toggle.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle.active span:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.nav-icon {
  font-size: 1rem;
}

.nav-link:hover,
.nav-link.router-link-active {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  /* Add padding top for fixed navbar on mobile if needed */
}

/* Mobile styles */
@media (max-width: 768px) {
  .nav-title {
    font-size: 1.1rem;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .nav-links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--primary-color);
    flex-direction: column;
    gap: 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    padding: 0;
  }

  .nav-links.mobile-open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .nav-link {
    padding: 1rem 1.5rem;
    border-radius: 0;
    border-bottom: 1px solid var(--primary-dark);
    justify-content: flex-start;
    font-size: 1rem;
  }

  .nav-link:last-child {
    border-bottom: none;
  }

  .main-content {
    padding: 1rem 0.75rem;
  }
}

/* Very small mobile devices */
@media (max-width: 480px) {
  .nav-container {
    padding: 0 0.75rem;
  }

  .nav-title {
    font-size: 1rem;
  }

  .main-content {
    padding: 0.75rem 0.5rem;
  }
}

/* User controls */
.user-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-welcome {
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
}

.admin-link {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.admin-link:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.mobile-user-controls {
  border-top: 1px solid var(--primary-dark);
  padding-top: 1rem;
  margin-top: 1rem;
}

.mobile-user-button {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: center;
}

.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

.main-content.no-nav {
  padding: 0;
}

/* Mobile styles */
@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .user-controls {
    order: 3;
  }

  .mobile-menu-toggle {
    order: 2;
  }

  .nav-title {
    order: 1;
  }
}

/* Touch-friendly tap targets */
@media (hover: none) and (pointer: coarse) {
  .nav-link {
    min-height: 44px;
    padding: 0.75rem 1rem;
  }
}
</style>
