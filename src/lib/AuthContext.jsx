// ─────────────────────────────────────────────────────────────────────────────
// AuthContext — stub local (substitui o sistema de auth do Base44)
//
// O app original tinha requiresAuth: false, portanto nunca bloqueava o acesso.
// Este stub mantém exatamente o mesmo comportamento: sem loading, sem erro,
// sem redirecionamento — o usuário sempre acessa as rotas diretamente.
//
// FUTURA MIGRAÇÃO PARA SUPABASE:
//   Substitua este arquivo por uma implementação real de auth usando
//   supabase.auth.getSession() / supabase.auth.onAuthStateChange().
//   Mantenha a mesma interface { user, isLoadingAuth, isLoadingPublicSettings,
//   authError, navigateToLogin } para que App.jsx não precise mudar.
// ─────────────────────────────────────────────────────────────────────────────

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
