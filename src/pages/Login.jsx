import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import headerImg from "../assets/header.jpg";
import logosFlotilla from "../assets/logos.jpeg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modo, setModo] = useState("login"); // "login" | "reset"
  const [loadingReset, setLoadingReset] = useState(false);
  const [resetEnviado, setResetEnviado] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Error: " + error.message);
    else navigate("/app/choferes");
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) { alert("Ingresa tu correo electrónico primero."); return; }
    setLoadingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // ✅ Redirige aquí después de que el usuario haga clic en el correo
      redirectTo: `${window.location.origin}/`
    });
    setLoadingReset(false);
    if (error) alert("Error: " + error.message);
    else setResetEnviado(true);
  };

  return (
    <div
      className="h-screen w-screen flex items-center justify-center p-4 bg-secondary bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: `url(${headerImg})` }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[0px] z-0"></div>

      <div className="w-full max-w-md bg-cards border border-secondary/10 rounded-[2rem] p-10 shadow-2xl z-10">

        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-primary p-1 bg-white mb-4 shadow-lg">
            <img src={logosFlotilla} className="w-full h-full rounded-full object-cover" alt="Logo" />
          </div>
          <h1 className="text-2xl font-black text-text-tablas uppercase tracking-tighter italic">
            MOVI <span className="text-primary">TEK</span>
          </h1>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] mt-2">
            MANAGEMENT SYSTEM
          </p>
        </div>

        {/* ── LOGIN ── */}
        {modo === "login" && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-text-tablas/60 ml-1">Usuario / Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-secondary/10 rounded-xl px-5 py-4 text-sm text-text-tablas outline-none focus:border-primary/50 transition-all placeholder:text-text-muted/50"
                placeholder="nombre@ejemplo.com" required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-text-tablas/60 ml-1">Contraseña</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border border-secondary/10 rounded-xl px-5 py-4 text-sm text-text-tablas outline-none focus:border-primary/50 transition-all placeholder:text-text-muted/50"
                placeholder="••••••••" required
              />
            </div>

            {/* ✅ Enlace restablecer contraseña */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setModo("reset"); setResetEnviado(false); }}
                className="text-[11px] text-primary font-bold hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover text-white font-black uppercase py-4 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] text-xs tracking-widest cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </form>
        )}

        {/* ── RESTABLECER CONTRASEÑA ── */}
        {modo === "reset" && (
          <div>
            {resetEnviado ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-verde/10 rounded-full flex items-center justify-center mx-auto">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-verde">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-text-tablas">¡Correo enviado!</p>
                <p className="text-xs text-text-muted">
                  Revisa tu bandeja de entrada en <strong>{email}</strong> y sigue las instrucciones para restablecer tu contraseña.
                </p>
                <button
                  onClick={() => setModo("login")}
                  className="text-[11px] text-primary font-bold hover:underline"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                <p className="text-xs text-text-muted mb-4">
                  Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-tablas/60 ml-1">Correo Electrónico</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface border border-secondary/10 rounded-xl px-5 py-4 text-sm text-text-tablas outline-none focus:border-primary/50 transition-all placeholder:text-text-muted/50"
                    placeholder="nombre@ejemplo.com" required
                  />
                </div>
                <button
                  type="submit" disabled={loadingReset}
                  className={`w-full bg-primary hover:bg-primary-hover text-white font-black uppercase py-4 rounded-xl shadow-lg shadow-primary/30 transition-all text-xs tracking-widest cursor-pointer ${loadingReset ? 'opacity-60' : ''}`}
                >
                  {loadingReset ? 'Enviando...' : 'Enviar enlace'}
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setModo("login")}
                    className="text-[11px] text-text-muted hover:text-primary font-bold hover:underline"
                  >
                    ← Volver al inicio de sesión
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-8 text-[10px] font-black text-white/70 uppercase tracking-[0.5em] z-10">
        v.1.0 - 2026
      </div>
    </div>
  );
}
