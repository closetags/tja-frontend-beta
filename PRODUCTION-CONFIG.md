# Production Configuration Guide

## Production URLs

- **Frontend**: https://tja-frontend.vercel.app
- **Backend API**: https://realtadie.pythonanywhere.com/api/v1
- **Mobile App**: Expo development build

## Configuration

### Frontend Admin (Vercel)
Set environment variable in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://realtadie.pythonanywhere.com/api/v1
```

### Backend (PythonAnywhere)
Settings are configured in `settings.py`:

```python
ALLOWED_HOSTS = ['*', 'realtadie.pythonanywhere.com']
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:8081', 
    'https://tja-frontend.vercel.app',
    'https://realtadie.pythonanywhere.com',
]
```

### Mobile App (React Native)
The API URL is configured in `.env.production`:

```
EXPO_PUBLIC_API_URL=https://realtadie.pythonanywhere.com/api/v1
```

## Deployment Steps

### Frontend Admin (Vercel)
1. Push code to GitHub (staging branch)
2. Vercel will automatically redeploy
3. Ensure environment variable is set in Vercel dashboard

### Backend (PythonAnywhere)  
1. Pull latest code: `git pull origin staging`
2. Install requirements: `pip install -r requirements.txt`
3. Run migrations: `python manage.py migrate`
4. Reload web app in PythonAnywhere dashboard

### Mobile App
1. Update .env.production with API URL
2. Build with EAS: `eas build`

## Repositories
- **Frontend**: https://github.com/mrted/tja-frontend (branch: staging)
- **Backend**: https://github.com/mrted/tja-backend (branch: staging)
- **Mobile**: https://github.com/mrted/tja-mobile (branch: staging)
