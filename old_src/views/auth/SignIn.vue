<template>
  <div class="auth-container">
    <div class="auth-wrapper">
      <!-- Sign In Form Section -->
      <div class="auth-card">
        <div class="auth-header">
          <div class="brand-title">
            <h1>🔧 Clever</h1>
            <p>Sistema de Gestão Empresarial</p>
          </div>
          <h2>Bem-vindo de volta</h2>
          <p>Entre na sua conta para continuar</p>
        </div>

        <div class="clerk-signin">
          <SignIn
            :appearance="{
              elements: {
                formButtonPrimary: 'clever-btn-primary',
                card: 'clever-card',
                headerTitle: 'clever-title',
                headerSubtitle: 'clever-subtitle',
                socialButtonsBlockButton: 'clever-social-btn',
                formFieldInput: 'clever-input',
                footerActionLink: 'clever-link',
                footerAction: 'clever-footer-hidden',
              },
              variables: {
                colorPrimary: '#75ae93',
                colorBackground: '#ffffff',
                colorText: '#2c3e50',
                colorTextSecondary: '#6c757d',
                borderRadius: '8px',
                fontFamily: 'system-ui, sans-serif',
              },
            }"
            :redirectUrl="'/'"
          />
        </div>

        <div class="security-notice">
          <div class="security-icon">🔒</div>
          <p>Acesso seguro e protegido</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { SignIn } from '@clerk/vue';
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 1rem;
}

.auth-wrapper {
  display: flex;
  max-width: 500px;
  width: 100%;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 600px;
}

.auth-card {
  flex: 1;
  padding: 3rem 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.brand-title {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.brand-title h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
  color: var(--primary-color);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.brand-title p {
  font-size: 1rem;
  color: #6c757d;
  font-weight: 400;
  margin: 0;
}

.auth-header h2 {
  color: #2c3e50;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.auth-header p {
  color: #6c757d;
  font-size: 1rem;
  font-weight: 400;
}

.clerk-signin {
  width: 100%;
  margin: 2rem 0 1.5rem 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.security-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(117, 174, 147, 0.05);
  border: 1px solid rgba(117, 174, 147, 0.1);
  border-radius: 8px;
  margin-top: 1rem;
}

.security-icon {
  font-size: 1rem;
  opacity: 0.8;
}

.security-notice p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* Enhanced Clerk component styling */
:deep(.clever-card) {
  box-shadow: none !important;
  border: none !important;
  background: transparent !important;
  padding: 1rem !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 auto !important;
  display: block !important;
}

:deep(.clever-btn-primary) {
  background: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
  border-radius: 8px !important;
  padding: 12px 24px !important;
  font-weight: 600 !important;
  font-size: 1rem !important;
  transition: all 0.2s ease !important;
  width: 100% !important;
  margin: 1rem 0 1.5rem 0 !important;
}

:deep(.clever-btn-primary:hover) {
  background: var(--primary-hover) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(117, 174, 147, 0.3) !important;
}

:deep(.clever-input) {
  border: 2px solid #e9ecef !important;
  border-radius: 8px !important;
  padding: 12px 16px !important;
  font-size: 1rem !important;
  transition: all 0.2s ease !important;
  width: 100% !important;
  margin: 0.75rem 0 1rem 0 !important;
  box-sizing: border-box !important;
}

:deep(.clever-input:focus) {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 3px rgba(117, 174, 147, 0.1) !important;
}

:deep(.clever-title) {
  display: none !important;
}

:deep(.clever-subtitle) {
  display: none !important;
}

:deep(.clever-link) {
  color: var(--primary-color) !important;
  font-weight: 500 !important;
}

:deep(.clever-social-btn) {
  border: 2px solid #e9ecef !important;
  border-radius: 8px !important;
  padding: 12px !important;
  transition: all 0.2s ease !important;
}

:deep(.clever-social-btn:hover) {
  border-color: var(--primary-color) !important;
  background: var(--primary-light) !important;
}

:deep(.clever-footer-hidden) {
  display: none !important;
}

/* Additional Clerk form styling for full width */
:deep(.cl-form) {
  width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
}

:deep(.cl-formFieldRow) {
  width: 100% !important;
  margin: 1rem 0 !important;
}

:deep(.cl-field) {
  width: 100% !important;
}

:deep(.cl-formField) {
  width: 100% !important;
  margin: 0.5rem 0 !important;
}

:deep(.cl-formFieldLabel) {
  margin: 0.5rem 0 0.25rem 0 !important;
  font-weight: 500 !important;
  color: #2c3e50 !important;
}

:deep(.cl-formFieldInput) {
  width: 100% !important;
  margin: 0.25rem 0 0.75rem 0 !important;
}

:deep(.cl-formButtonPrimary) {
  width: 100% !important;
  margin: 1rem 0 !important;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .auth-wrapper {
    max-width: 400px;
  }

  .auth-card {
    padding: 2rem 1.5rem;
  }

  .brand-title h1 {
    font-size: 2rem;
  }

  .brand-title p {
    font-size: 0.9rem;
  }

  .auth-header h2 {
    font-size: 1.5rem;
  }

  .clerk-signin {
    margin: 1.5rem 0 1rem 0;
    padding: 0;
  }
}

@media (max-width: 480px) {
  .auth-container {
    padding: 0.5rem;
  }

  .auth-wrapper {
    border-radius: 12px;
  }

  .auth-card {
    padding: 1.5rem 1rem;
  }
}
</style>
