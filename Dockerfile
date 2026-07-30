# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

# Les variables VITE_* sont injectées au moment du build via --build-arg
ARG VITE_API_BASE_URL
ARG VITE_SOCKET_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

# ── Runtime stage : Nginx sert le build statique ───────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Copier le build Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
