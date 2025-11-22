# Railway Multi-Service Deployment Guide

This guide explains how to deploy both frontend and backend services from your monorepo to Railway as separate services.

## 📁 **Current Structure**
```
bucket/
├── apps/web/           # React frontend
│   ├── railway.toml    # Railway config
│   └── package.json    # Has build & preview scripts
├── packages/server/     # Node.js backend
│   ├── railway.toml    # Railway config
│   └── package.json    # Has build & start scripts
└── railway.toml        # Root config (optional)
```

## 🚀 **Deployment Options**

### **Option 1: Separate Railway Projects (Recommended)**
Deploy each service as a separate Railway project for isolation.

#### **Backend Deployment**
1. Create new Railway project
2. Connect your repository
3. Set source directory to: `packages/server`
4. Railway will detect the `railway.toml` inside
5. Set environment variables:
   - `JWT_SECRET` (get from: `pass show bucket/railway/jwt-secret`)
   - `CORS_ORIGIN` (your frontend URL after deployment)

#### **Frontend Deployment**
1. Create another Railway project
2. Connect same repository
3. Set source directory to: `apps/web`
4. Railway will detect the `railway.toml` inside
5. No environment variables needed

### **Option 2: Single Project with Multiple Services**
Use a single Railway project with multiple services.

#### **Root railway.toml Configuration**
```toml
# Delete or rename root railway.toml
# Railway will detect services with their own railway.toml files

[globalEnv]
NODE_ENV = "production"
```

## 📋 **Environment Variables**

### **Backend (packages/server)**
Required:
```bash
JWT_SECRET=your-super-secure-jwt-secret
CORS_ORIGIN=https://your-frontend-url.railway.app
```

### **Frontend (apps/web)**
No required variables (build-time only).

## 🔧 **Service URLs After Deployment**

After deployment, Railway will provide:
- **Backend**: `https://bucket-backend-abc123.up.railway.app`
- **Frontend**: `https://bucket-frontend-def456.up.railway.app`

## 📝 **Update Frontend to Use Production Backend**

In your frontend code, update WebSocket URL:

```typescript
// packages/core/src/lib/storage.ts or similar
const PROD_WS_URL = 'wss://your-backend-url.railway.app';
const DEV_WS_URL = 'ws://localhost:8040';

export const getWebSocketUrl = (userId: string) => {
  const baseUrl = import.meta.env.PROD ? PROD_WS_URL : DEV_WS_URL;
  return `${baseUrl}/${userId}`;
};
```

## 🔄 **Deployment Workflow**

### **Development**
```bash
# Start both services locally
pnpm dev:server  # Backend on :8040
pnpm dev           # Frontend on :5173
```

### **Production**
1. Push changes to main branch
2. Railway auto-deploys if configured
3. Update CORS_ORIGIN with new frontend URL
4. Frontend connects to production WebSocket

## ⚡ **Tips & Best Practices**

1. **Always use separate projects** for frontend/backend for:
   - Independent scaling
   - Separate environments
   - Clearer cost tracking

2. **Health Checks**:
   - Backend: `/health` (already configured)
   - Frontend: `/` (Vite preview server)

3. **Build Optimization**:
   - Frontend uses Vite build (already configured)
   - Backend uses TypeScript compilation

4. **Environment Management**:
   - Use Railway variables, not .env files
   - Store secrets in `pass`

## 🐛 **Troubleshooting**

### **CORS Errors**
Make sure `CORS_ORIGIN` in backend matches your frontend Railway URL exactly.

### **Build Failures**
Check Railway logs for:
- `pnpm install` issues
- TypeScript compilation errors
- Missing dependencies

### **WebSocket Connection Issues**
- Verify backend is deployed and healthy
- Check WebSocket URL in frontend
- Ensure ports match (8040 for backend)