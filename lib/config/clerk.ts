// Function to get Clerk configuration based on theme
export const getClerkConfig = (theme: 'light' | 'dark' = 'dark') => {
  const isDark = theme === 'dark';
  
  return {
    appearance: {
      elements: {
        formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
        card: 'w-full bg-transparent shadow-none',
        headerTitle: isDark ? 'text-gray-100 text-xl font-semibold' : 'text-gray-900 text-xl font-semibold',
        headerSubtitle: isDark ? 'text-gray-400' : 'text-gray-600',
        formFieldInput: isDark 
          ? 'border border-gray-600 bg-gray-800 text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500'
          : 'border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500',
        formFieldLabel: isDark ? 'text-gray-300 font-medium' : 'text-gray-700 font-medium',
        footerActionLink: isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500',
        dividerLine: isDark ? 'bg-gray-600' : 'bg-gray-200',
        dividerText: isDark ? 'text-gray-400' : 'text-gray-500',
        socialButtonsBlockButton: isDark 
          ? 'border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
        formFieldInputShowPasswordButton: isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700',
        formResendCodeLink: isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500',
        footerAction: isDark ? 'text-gray-400' : 'text-gray-600',
        formFieldRow: 'space-y-4',
        formField: 'space-y-2',
        form: 'space-y-4',
        header: 'text-center mb-6',
        footer: 'text-center mt-6',
        rootBox: 'w-full',
      },
      variables: {
        colorPrimary: '#3b82f6',
        colorText: isDark ? '#f1f5f9' : '#111827',
        colorTextSecondary: isDark ? '#cbd5e1' : '#6b7280',
        colorBackground: isDark ? '#0f172a' : '#ffffff',
        colorInputBackground: isDark ? '#1e293b' : '#ffffff',
        colorInputText: isDark ? '#f1f5f9' : '#111827',
        colorNeutral: isDark ? '#9ca3af' : '#6b7280',
        colorSuccess: '#22c55e',
        colorDanger: '#f87171',
        colorWarning: '#fbbf24',
      }
    },
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
    afterSignInUrl: "/dashboard",
    afterSignUpUrl: "/dashboard",
    redirectUrl: "/dashboard",
  };
};

// Default configuration (dark theme)
export const clerkConfig = getClerkConfig('dark');