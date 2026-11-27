import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const destino = location.state?.from?.pathname || "/";
  const mensajePrevio = location.state?.message || "";

  if (!loading && isAuthenticated) {
    return <Navigate to={destino} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const emailLimpio = form.email.trim();
    if (!emailLimpio || !form.password) {
      setError("Completá tu email y contraseña para continuar.");
      return;
    }

    setEnviando(true);
    try {
      await login({ email: emailLimpio, password: form.password });
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err.message || "No pudimos iniciar sesión. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="auth-seccion">
      <div className="contenedor">
        <div className="auth-tarjeta">
          <div className="auth-tarjeta__cabecera">
            <span className="ojo-seccion">Mi cuenta</span>
            <h1 className="titulo-seccion">Iniciar sesión</h1>
            <p className="auth-tarjeta__descripcion">
              Ingresá para ver tu perfil, consultar tus pedidos y finalizar tus compras.
            </p>
          </div>

          {mensajePrevio && !error && (
            <p className="auth-alerta auth-alerta--exito" role="status">
              {mensajePrevio}
            </p>
          )}

          {error && (
            <p className="auth-alerta auth-alerta--error" role="alert">
              {error}
            </p>
          )}

          <form className="formulario" onSubmit={handleSubmit} noValidate>
            <div className="campo">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                disabled={enviando}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Ingresá tu contraseña"
                disabled={enviando}
                required
              />
            </div>

            <button
              type="submit"
              className="boton boton--principal"
              disabled={enviando}
            >
              {enviando ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="auth-tarjeta__pie">
            ¿Todavía no tenés cuenta? <Link to="/registro">Registrate acá</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
