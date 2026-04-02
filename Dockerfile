FROM node:22-alpine AS build
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/web/package.json packages/web/
RUN pnpm install --frozen-lockfile
COPY packages/core/ packages/core/
COPY packages/web/ packages/web/
RUN pnpm --filter @bucket/web build && ls -la packages/web/dist/*.png 2>/dev/null && echo "BUILD_TS=$(date +%s)"

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/web/dist /usr/share/nginx/html
EXPOSE 8080
