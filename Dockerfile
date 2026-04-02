FROM node:22-alpine AS build
ARG CACHEBUST=1775174045
RUN corepack enable pnpm
WORKDIR /app
COPY . .
RUN echo "bust=$CACHEBUST" && pnpm install --frozen-lockfile && pnpm --filter @bucket/web build
RUN ls packages/web/dist/

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/web/dist /usr/share/nginx/html
EXPOSE 8080
