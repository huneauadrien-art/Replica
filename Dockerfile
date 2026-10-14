# Serveur Registre Vigne pour le NAS : synchronisation des téléphones + version web.
FROM node:22-bookworm-slim AS construction
WORKDIR /src
COPY app/package.json app/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY app/ ./
RUN npx tsc --noEmit \
 && npx vitest run \
 && EXPO_OFFLINE=1 npx expo export --platform web --output-dir /out/site \
 && npx tsc -p serveur/tsconfig.json --outDir /out

FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=8080 DONNEES=/donnees
WORKDIR /app
COPY --from=construction /out/ ./
VOLUME /donnees
EXPOSE 8080
HEALTHCHECK --interval=1m --timeout=5s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "serveur/index.js"]
