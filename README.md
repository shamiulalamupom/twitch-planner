# Twitch Planner

Petite app planning de streams avec API Express/Prisma + frontend React/Vite. Le projet se lance en local classique ou avec `docker compose`.

## Prérequis

1. Node (≥20) + npm.  
2. PostgreSQL (si vous n’utilisez **pas** Docker).  
3. Docker & Docker Compose (optionnel, recommandé).

## Lancement sans Docker

1. Copier les `.env.example` dans `backend/.env` et `frontend/.env`.
2. Ajuster les variables :
   - `backend/.env` : `DATABASE_URL` vers votre Postgres, `JWT_SECRET`, `CORS_ORIGIN=http://localhost:5173`.
   - `frontend/.env` : `VITE_API_URL=http://localhost:4000`, `VITE_RAWG_API_KEY` (clé Rawg).
3. Lancer le backend :

   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. Dans un autre terminal, lancer le frontend :

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. Ouvrir `http://localhost:5173`.

## Lancement avec Docker

1. Copier les `.env.example` si besoin (les services Docker les utilisent via `volumes`).  
2. Construire et démarrer :

   ```bash
   docker compose up --build
   ```

3. Le backend est accessible sur `http://localhost:4000`, le frontend sur `http://localhost:5173`.

## Vérifications rapides

- `http://localhost:5173` => interface React.  
- `http://localhost:4000/health` => backend.  
- Créer un compte (signup/login) puis ouvrir un planning et ajouter des events (RAWG fournit les images si vous avez `VITE_RAWG_API_KEY`).  

## Astuce

Pour la recherche de jeux, la clé RAWG doit être valide et stockée dans `frontend/.env` (ou dans votre gestionnaire d’environnement Docker).
