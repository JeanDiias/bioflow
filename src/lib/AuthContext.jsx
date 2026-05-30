// AuthContext — sem autenticação (modo local)
//
// FUTURA MIGRAÇÃO PARA SUPABASE:
//   Substitua por uma implementação real usando supabase.auth.getSession()
//   e supabase.auth.onAuthStateChange(). Mantenha a mesma interface
//   { user, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin }
//   para que App.jsx não precise mudar.

import { createContext, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  return (
    <AuthContext.Provider
      value={{
        user: null,
        isLoadingAuth: false,
        isLoadingPublicSettings: false,
        authError: null,
        navigateToLogin: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
