FROM node:22-alpine AS build
RUN corepack enable pnpm
WORKDIR /app
COPY . .
RUN pnpm install && pnpm --filter @bucket/web build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/web/dist /usr/share/nginx/html
EXPOSE 8080
