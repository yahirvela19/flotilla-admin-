import React, { createContext, useContext, useState } from "react";
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from "lucide-react";
 
const ToastContext = createContext();
 
export function ToastProvider({ children }) {
  const [toastData, setToastData] = useState({ visible: false, message: "", type: "success" });
  // ✅ Estado del confirm modal — reemplaza window.confirm
  const [confirmData, setConfirmData] = useState(null); // { message, resolve }
 
  // Toast: llamar como toast({ message: '...', type: 'success' })
  const toast = ({ message, type = "success", duration = 3500 }) => {
    setToastData({ visible: true, message, type });
    setTimeout(() => setToastData(prev => ({ ...prev, visible: false })), duration);
  };
 
  // Confirm: devuelve Promise<boolean> — reemplaza window.confirm
  const confirm = (message) => {
    return new Promise((resolve) => {
      setConfirmData({ message, resolve });
    });
  };
 
  const handleConfirmResult = (result) => {
    if (confirmData) confirmData.resolve(result);
    setConfirmData(null);
  };
 
  const styles = {
    success: { icon: <CheckCircle size={18} />, className: "bg-verde/10 border border-verde/30 text-verde" },
    error:   { icon: <AlertCircle size={18} />, className: "bg-rojo/10 border border-rojo/30 text-rojo" },
    warning: { icon: <AlertTriangle size={18} />, className: "bg-amarillo/10 border border-amarillo/30 text-amarillo" },
    info:    { icon: <Info size={18} />, className: "bg-azul/10 border border-azul/30 text-azul" },
  };
 
  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}
 
      {/* ── TOAST ── completamente centrado con fondo borroso */} 
{toastData.visible && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    
    {/* Fondo oscuro + blur */}
    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

    {/* Toast */}
    <div
      className={`relative min-w-[320px] max-w-[400px] px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md border border-white/10 ${styles[toastData.type]?.className}`}
    >
      <div className="flex items-center gap-3">
        {styles[toastData.type]?.icon}

        {/* Texto negro */}
        <p className="text-sm font-semibold text-black">
          {toastData.message}
        </p>
      </div>

      <button
        onClick={() =>
          setToastData(prev => ({ ...prev, visible: false }))
        }
        className="opacity-60 hover:opacity-100 transition shrink-0 text-black"
      >
        <X size={16} />
      </button>
    </div>
  </div>
)}
 
      {/* ── CONFIRM MODAL ── reemplaza window.confirm */}
      {confirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-cards rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-gray-200">
            <div className="flex items-start gap-3 mb-5">
              <span className="text-amarillo mt-0.5 shrink-0">
                <AlertTriangle size={22} />
              </span>
              <p className="text-sm text-text-tablas font-medium leading-snug">
                {confirmData.message}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleConfirmResult(false)}
                className="px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmResult(true)}
                className="px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest bg-rojo/10 text-rojo border border-rojo/20 hover:bg-rojo hover:text-white transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
 
export function useToast() {
  return useContext(ToastContext);
}