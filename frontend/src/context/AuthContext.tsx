// frontend/src/context/AuthContext.tsx
import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

type TwoFAStage = 'setup-qr' | 'setup-verify' | 'login-verify' | null;

interface AuthContextType {
  is2FAModalOpen: boolean;
  set2FAModalOpen: (isOpen: boolean) => void;
  twoFAStage: TwoFAStage;
  setTwoFAStage: (stage: TwoFAStage) => void;
  userEmailFor2FA: string | null;
  setUserEmailFor2FA: (email: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [is2FAModalOpen, set2FAModalOpen] = useState(false);
  const [twoFAStage, setTwoFAStage] = useState<TwoFAStage>(null);
  const [userEmailFor2FA, setUserEmailFor2FA] = useState<string | null>(null);

  return (
    <AuthContext.Provider
      value={{
        is2FAModalOpen,
        set2FAModalOpen,
        twoFAStage,
        setTwoFAStage,
        userEmailFor2FA,
        setUserEmailFor2FA,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

// (opcional) exporta tipos si los usarás en otros archivos
export type { TwoFAStage, AuthContextType };
