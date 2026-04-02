FROM node:22-alpine AS build
RUN corepack enable pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @bucket/web build
RUN echo "=== DIST ===" && ls -la packages/web/dist/ && echo "=== PUBLIC ===" && ls -la packages/web/public/

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/web/dist /usr/share/nginx/html
EXPOSE 8080
