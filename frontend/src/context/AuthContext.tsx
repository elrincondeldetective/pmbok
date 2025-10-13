// frontend/src/context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

type TwoFAStage = 'setup-qr' | 'setup-verify' | 'login-verify' | null;

interface AuthContextType {
  is2FAModalOpen: boolean;
  set2FAModalOpen: (isOpen: boolean) => void;
  twoFAStage: TwoFAStage;
  setTwoFAStage: (stage: TwoFAStage) => void;
  userEmailFor2FA: string | null; // Guardar email entre registro y verificación
  setUserEmailFor2FA: (email: string | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
