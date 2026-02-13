import { Link } from "react-router-dom";
import { useAuth } from "../lib/useAuth";

const previewDays = [
  { label: "Dimanche", time: "09h00", title: "Clash Royale" },
  { label: "Lundi", time: "21h00", title: "Valorant" },
  { label: "Mardi", time: "22h30", title: "Rocket League" },
];

export function Landing() {
  const { token } = useAuth();

  return (
    <div className="tp-hero">
      <div className="tp-hero-content">
        <p className="tp-hero-label">planning de stream</p>
        <h1 className="tp-hero-title">
          Planifiez vos streams avec un outil pensé pour les créateurs
        </h1>
        <p className="tp-hero-copy">
          Créez un planning hebdomadaire, superposez vos sessions, personnalisez
          chaque événement avec un visuel et exportez vos semaines à la volée.
          Chaque planning est sauvegardé, partageable et fait pour rester simple.
        </p>
        <div className="tp-hero-actions">
          {token ? (
            <Link to="/plannings" className="tp-btn tp-btn-primary">
              Mes plannings
            </Link>
          ) : (
            <>
              <Link to="/signup" className="tp-btn tp-btn-primary">
                Créer un compte
              </Link>
              <Link to="/login" className="tp-btn tp-btn-secondary">
                Connexion
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="tp-hero-preview">
        <span className="tp-subheading">Vue d’ensemble</span>
        <div className="tp-hero-preview-grid">
          {previewDays.map((day) => (
            <div key={day.label} className="tp-hero-preview-day">
              <span>{day.label}</span>
              <div className="tp-hero-preview-event">
                <strong>{day.time}</strong>
                <span className="block text-[0.65rem]">{day.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
