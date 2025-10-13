// frontend/src/components/modal/TwoFAModal.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';

const TwoFAModal: React.FC = () => {
  const { is2FAModalOpen, set2FAModalOpen, twoFAStage, setTwoFAStage, userEmailFor2FA } = useAuth();
  const navigate = useNavigate();
  
  const [code1, setCode1] = useState('');
  const [code2, setCode2] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    set2FAModalOpen(false);
    setTwoFAStage(null);
    setError('');
    setCode1('');
    setCode2('');
    setLoginCode('');
  };

  const handleSetupNext = () => {
    setTwoFAStage('setup-verify');
  };

  const handleSetupVerify = async () => {
    setLoading(true);
    setError('');
    try {
        await apiClient.post('/2fa/setup/verify/', {
            email: userEmailFor2FA,
            code1,
            code2
        });
        handleClose();
        navigate('/login');
    } catch (err: any) {
        setError(err.response?.data?.error || 'Error al verificar los códigos.');
    } finally {
        setLoading(false);
    }
  };
  
  const handleLoginVerify = async () => {
    setLoading(true);
    setError('');
    try {
        await apiClient.post('/2fa/login/verify/', { code: loginCode });
        handleClose();
        navigate('/'); // Redirigir al dashboard
    } catch (err: any) {
        setError(err.response?.data?.error || 'Error al verificar el código.');
    } finally {
        setLoading(false);
    }
  };

  if (!is2FAModalOpen) return null;

  const renderContent = () => {
    switch (twoFAStage) {
      case 'setup-qr':
        return (
          <>
            <h3 className="mb-4 text-xl font-medium text-gray-900 text-center">Configurar 2FA</h3>
            <p className="text-center text-gray-600 mb-4">Escanea el código QR con tu app de autenticación.</p>
            <div className="flex justify-center my-4">
                {/* Placeholder para el QR */}
                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">[Imagen de Código QR]</p>
                </div>
            </div>
            <p className="text-center text-sm text-gray-500">O copia la clave manualmente.</p>
            <button
              onClick={handleSetupNext}
              className="w-full mt-6 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              Siguiente
            </button>
          </>
        );
      case 'setup-verify':
        return (
            <>
              <h3 className="mb-4 text-xl font-medium text-gray-900 text-center">Verificar Configuración</h3>
              <p className="text-center text-gray-600 mb-6">Ingresa los dos códigos de verificación para completar.</p>
              {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}
              <div className="space-y-4">
                  <input type="text" value={code1} onChange={(e) => setCode1(e.target.value)} placeholder="Código 1 (6 dígitos)" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
                  <input type="text" value={code2} onChange={(e) => setCode2(e.target.value)} placeholder="Código 2 (6 dígitos)" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
              </div>
              <button onClick={handleSetupVerify} disabled={loading} className="w-full mt-6 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-400">
                {loading ? 'Verificando...' : 'Completar Configuración'}
              </button>
            </>
          );
      case 'login-verify':
        return (
            <>
              <h3 className="mb-4 text-xl font-medium text-gray-900 text-center">Verificación en dos pasos</h3>
              <p className="text-center text-gray-600 mb-6">Ingresa el código de tu app de autenticación.</p>
              {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}
              <input type="text" value={loginCode} onChange={(e) => setLoginCode(e.target.value)} placeholder="Código de 6 dígitos" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
              <button onClick={handleLoginVerify} disabled={loading} className="w-full mt-6 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-400">
                {loading ? 'Verificando...' : 'Verificar'}
              </button>
            </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
      <div className="relative bg-white rounded-lg shadow w-full max-w-md p-6">
        <button type="button" onClick={handleClose} className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center">
            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
            </svg>
            <span className="sr-only">Cerrar modal</span>
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default TwoFAModal;
