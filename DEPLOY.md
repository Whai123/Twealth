# Twealth Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Production ready"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables (copy from `.env.production`)
4. Deploy

### Step 3: Configure Domain
1. In Vercel, go to Settings > Domains
2. Add your custom domain
3. SSL is automatic

---

## Environment Variables for Production

**Required:**
```
DATABASE_URL=your_neon_database_url
SESSION_SECRET=F1ADwrUeMb2sHMlLX4Q5xPKpKDjbb3SIRV+ibefllUw=
NODE_ENV=production
GEMINI_API_KEY=your_key
```

**For Paid Plans (add later):**
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRO_PRICE_ID=price_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Build Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

---

## Get Your API Keys

| Service | Get Key Here | Purpose |
|---------|-------------|---------|
| Gemini | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Free AI |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Free AI backup |
| Stripe | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) | Payments |
| Google OAuth | [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) | Login |

---

## Files Created

- `.env.production` - Production environment template
- `dist/` - Production build output
  - `index.js` - Server bundle (1MB)
  - `public/` - Static assets with icons, manifest
