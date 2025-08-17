# Deployment Guide for Setlist Manager

This guide covers deploying the complete Setlist Manager application with Neon database, Railway backend, and frontend deployment.

## 1. Database Setup (Neon)

### Create Neon Database
1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Note your connection string from the dashboard

### Run Database Schema
1. Install PostgreSQL client if you haven't already
2. Run the schema:
   ```bash
   cd backend
   psql "YOUR_NEON_CONNECTION_STRING" -f src/db/schema.sql
   ```

## 2. Backend Deployment (Railway)

### Prepare Backend
1. Make sure you're in the backend directory
2. Create a `.env` file with your Neon database URL:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   PORT=3000
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.com
   ```

### Deploy to Railway
1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Initialize and deploy:
   ```bash
   cd backend
   railway init
   railway up
   ```

4. Set environment variables in Railway dashboard:
   - `DATABASE_URL`: Your Neon connection string
   - `NODE_ENV`: production
   - `FRONTEND_URL`: Your frontend domain

## 3. Frontend Deployment

### Environment Configuration
1. Create a `.env` file in the root directory:
   ```
   VITE_API_URL=https://your-railway-backend-url.railway.app
   ```

### Deploy to Vercel (Recommended)
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `VITE_API_URL`: Your Railway backend URL

### Alternative: Deploy to Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set environment variable: `VITE_API_URL`

## 4. Testing the Deployment

### Backend Health Check
```bash
curl https://your-railway-backend-url.railway.app/health
```

### Frontend Connection
1. Open your deployed frontend
2. Check browser console for connection errors
3. Try creating a new setlist
4. Test real-time updates with multiple browser tabs

## 5. Environment Variables Summary

### Backend (.env)
```
DATABASE_URL=postgresql://username:password@host:port/database
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend (.env)
```
VITE_API_URL=https://your-railway-backend-url.railway.app
```

## 6. Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure `FRONTEND_URL` is set correctly in backend
2. **Database Connection**: Verify Neon connection string and SSL settings
3. **Socket.io Issues**: Check that frontend and backend URLs match
4. **Environment Variables**: Ensure all variables are set in deployment platforms

### Debug Commands

```bash
# Check backend logs
railway logs

# Check database connection
railway run psql $DATABASE_URL -c "SELECT NOW();"

# Test API endpoints
curl https://your-backend-url/api/setlists
```

## 7. Monitoring and Maintenance

### Railway Dashboard
- Monitor backend performance
- Check logs for errors
- Scale resources as needed

### Neon Dashboard
- Monitor database performance
- Check connection usage
- Backup and restore if needed

### Frontend Analytics
- Monitor user engagement
- Track performance metrics
- Error reporting

## 8. Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **CORS**: Restrict to your frontend domain only
3. **Database**: Use connection pooling and SSL
4. **Rate Limiting**: Consider implementing API rate limits
5. **Input Validation**: All user inputs are validated on backend

## 9. Scaling Considerations

### Backend Scaling
- Railway automatically scales based on traffic
- Consider upgrading plan for higher traffic
- Monitor database connection limits

### Database Scaling
- Neon provides automatic scaling
- Monitor query performance
- Add indexes for frequently accessed data

### Frontend Scaling
- Vercel/Netlify handle scaling automatically
- CDN distribution for global performance
- Consider image optimization for logos
