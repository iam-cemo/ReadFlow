# Utilise une image officielle Node.js comme image parente
FROM node:20-alpine

# Définit le répertoire de travail dans le conteneur
WORKDIR /app

# Copie les fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installe les dépendances
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copie le reste de l'application
COPY . .

# Expose le port utilisé par l'application
EXPOSE 3000

# Définit la commande de démarrage
CMD ["pnpm", "start"]
