FROM node:22-alpine AS build
RUN corepack enable pnpm
WORKDIR /app
COPY . .
RUN ls packages/web/public/ 2>/dev/null; echo "---"; \
    pnpm install && pnpm --filter @bucket/web build && \
    ls packages/web/dist/*.png 2>/dev/null; echo "icons check done"

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/web/dist /usr/share/nginx/html
EXPOSE 8080
