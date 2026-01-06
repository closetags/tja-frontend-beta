# Vercel Environment Variables Setup

## Production URLs
- **Frontend**: https://tja-frontend.vercel.app
- **Backend API**: https://realtadie.pythonanywhere.com/api/v1

## Solution - Set Environment Variable on Vercel

### Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com
2. Select your project: **tja-frontend**

### Step 2: Configure Environment Variables
1. Click on **Settings** tab
2. Click on **Environment Variables** in the left sidebar
3. Add a new environment variable:

   **Variable Name:**
   ```
   NEXT_PUBLIC_API_URL
   ```

   **Value:**
   ```
   https://realtadie.pythonanywhere.com/api/v1
   ```

   **Environments:** Check all three:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. Click **Save**

### Step 3: Redeploy
After saving the environment variable, you need to redeploy:

**Option A - Automatic (Recommended):**
1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**
4. Confirm the redeploy

**Option B - Manual:**
1. Make a small commit and push to trigger a new deployment
2. Or use Vercel CLI: `vercel --prod`

### Step 4: Verify
After deployment completes:
1. Go to https://tja-frontend.vercel.app/login
2. Open browser DevTools (F12)
3. Go to Console tab
4. You should see: `process.env.NEXT_PUBLIC_API_URL: https://realtadie.pythonanywhere.com/api/v1`

## Why This Happens

Next.js environment variables work differently in different environments:

- **Local development** (`npm run dev`): Uses `.env.local` or `.env.development`
- **Local production build** (`npm run build`): Uses `.env.production`
- **Vercel deployment**: Uses environment variables set in Vercel dashboard

The `.env.production` file in your repository is NOT used by Vercel builds. Vercel has its own environment variable system.

## Alternative: Check Current Vercel Environment Variables

You can verify your current environment variables using Vercel CLI:

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Check environment variables
vercel env ls
```

## Success Indicators

✅ No more "localhost:8000" errors in production
✅ Console shows correct API URL
✅ All API calls go to PythonAnywhere backend

---

**Note:** Remember to also ensure your backend changes are deployed to PythonAnywhere.
