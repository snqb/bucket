FROM node:22-alpine AS build
RUN corepack enable pnpm && apk add --no-cache curl
WORKDIR /app
COPY . .

# Railway uploader strips binary files — download icons from GitHub
RUN mkdir -p packages/web/public && \
    curl -sL "https://raw.githubusercontent.com/snqb/bucket/868d5ab/public/pwa-192x192.png" -o packages/web/public/icon-192.png && \
    curl -sL "https://raw.githubusercontent.com/snqb/bucket/868d5ab/public/pwa-512x512.png" -o packages/web/public/icon-512.png && \
    curl -sL "https://raw.githubusercontent.com/snqb/bucket/868d5ab/public/apple-icon-180.png" -o packages/web/public/apple-touch-icon.png && \
    curl -sL "https://raw.githubusercontent.com/snqb/bucket/868d5ab/public/favicon-196.png" -o packages/web/public/favicon.png && \
    ls packages/web/public/

RUN pnpm install && pnpm --filter @bucket/web build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/web/dist /usr/share/nginx/html
EXPOSE 8080
