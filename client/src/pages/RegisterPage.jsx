import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

export default function RegisterPage() {
  const { register, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const nombreLimpio = form.nombre.trim();
    const emailLimpio = form.email.trim();

    if (!nombreLimpio || !emailLimpio || !form.password || !form.confirmPassword) {
      setError("Completá todos los campos para crear tu cuenta.");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      const resultado = await register({
        nombre: nombreLimpio,
        email: emailLimpio,
        password: form.password,
      });

      if (resultado.autoLoggedIn) {
        navigate("/", { replace: true });
      } else {
        navigate("/login", {
          replace: true,
          state: { message: resultado.message },
        });
      }
    } catch (err) {
      setError(err.message || "No pudimos completar el registro. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="auth-seccion">
      <div className="contenedor">
        <div className="auth-tarjeta">
          <div className="auth-tarjeta__cabecera">
            <span className="ojo-seccion">Nueva cuenta</span>
            <h1 className="titulo-seccion">Crear cuenta</h1>
            <p className="auth-tarjeta__descripcion">
              Registrate en Mueblería Hermanos Jota para gestionar tus pedidos de forma segura.
            </p>
          </div>

          {error && (
            <p className="auth-alerta auth-alerta--error" role="alert">
              {error}
            </p>
          )}

          <form className="formulario" onSubmit={handleSubmit} noValidate>
            <div className="campo">
              <label htmlFor="registro-nombre">Nombre completo</label>
              <input
                id="registro-nombre"
                name="nombre"
                type="text"
                autoComplete="name"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
                disabled={enviando}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="registro-email">Email</label>
              <input
                id="registro-email"
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
              <label htmlFor="registro-password">Contraseña</label>
              <input
                id="registro-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                disabled={enviando}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="registro-confirm-password">Confirmar contraseña</label>
              <input
                id="registro-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repetí tu contraseña"
                disabled={enviando}
                required
              />
            </div>

            <button
              type="submit"
              className="boton boton--principal"
              disabled={enviando}
            >
              {enviando ? "Creando cuenta..." : "Registrarse"}
            </button>
          </form>

          <p className="auth-tarjeta__pie">
            ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
