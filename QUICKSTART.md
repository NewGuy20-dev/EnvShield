# 🚀 EnvShield - Quick Start Guide

## ⚡ Get Running in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/envshield
ENCRYPTION_KEY=your64hexcharacterencryptionkey
JWT_SECRET=your-jwt-secret-key-here
```

To generate ENCRYPTION_KEY:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Initialize Database
```bash
npx prisma migrate dev --name init
```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Open in Browser
```
http://localhost:3000
```

---

## 🎯 Test User Flow

1. **Landing Page** → http://localhost:3000
   - See beautiful glasmorphic design
   - Click "Get Started" or "Sign In"

2. **Create Account** → `/register`
   - Email: `test@example.com`
   - Password: `TestPassword123`
   - Name: `Test User`
   - Click "Create Account"

3. **Verify Email** → `/verify-email`
   - Enter: `123456` (any 6 digits)
   - Click "Verify Email"

4. **Dashboard** → `/projects`
   - See empty projects list
   - Click "New Project"

5. **Create Project**
   - Name: `My First Project`
   - Description: `Testing EnvShield`
   - Click "Create"

6. **View Project**
   - Click on the project card
   - See project stats and actions

7. **Manage Environments**
   - Click "Manage Environments"
   - Create `development` environment
   - Create `production` environment

8. **Add Variables**
   - Click on development environment
   - Click "Add Variable"
   - Key: `DATABASE_URL`
   - Value: `postgres://localhost/mydb`
   - See 🔒 encryption indicator
   - Click "Add Variable"

9. **Manage Team**
   - Click "Manage Team"
   - Invite team member
   - Email: `colleague@example.com`
   - Role: `DEVELOPER`

10. **View Audit Logs**
    - Click project settings → "Audit Logs"
    - See timeline of all changes

---

## 📱 Key Pages to Visit

| URL | Purpose |
|-----|---------|
| `/` | Landing page |
| `/login` | Login page |
| `/register` | Sign up |
| `/forgot-password` | Password reset |
| `/verify-email` | Email verification |
| `/projects` | Projects dashboard |
| `/projects/[slug]` | Project detail |
| `/projects/[slug]/environments` | Environment manager |
| `/projects/[slug]/environments/[slug]` | Variables manager |
| `/projects/[slug]/members` | Team management |
| `/projects/[slug]/audit` | Audit logs |
| `/tokens` | API tokens |
| `/settings` | User settings |

---

## 🎨 Theme & Customization

### Toggle Theme
- Click the sun/moon icon in the navbar
- Theme preference saved to localStorage
- Smooth transition between modes

### Modify Colors
Edit in `tailwind.config.ts`:
```typescript
colors: {
  primary: '#3B82F6',      // Change primary color
  secondary: '#06B6D4',    // Change secondary color
  success: '#10B981',      // Change success color
  // ... etc
}
```

### Adjust Animations
Edit in `app/globals.css`:
```css
@keyframes fadeIn {
  /* Adjust animation timing and values */
}
```

---

## 🔐 Security Testing

### Test Encryption
1. Add a variable with sensitive value
2. Note it's encrypted in database
3. Use reveal button to decrypt (permission check)
4. Copy button encrypts value in transit

### Test Role-Based Access
1. Create project as Owner
2. Invite colleague as Developer
3. Developer can view/edit variables
4. Developer cannot delete project
5. Try removing Developer access

### Test Audit Logs
1. Make any change (add/edit/delete variable)
2. Check audit logs
3. See user, action, timestamp
4. Export audit logs to CSV

---

## 📊 API Testing with cURL

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123"}'
```

### Create Project
```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{"name":"My Project","description":"Test"}'
```

### List Projects
```bash
curl -X GET http://localhost:3000/api/v1/projects \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or run on different port
PORT=3001 npm run dev
```

### Database Connection Error
```bash
# Check DATABASE_URL is correct
# Ensure PostgreSQL is running
# Run migrations
npx prisma migrate dev
```

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Theme Not Persisting
```bash
# Clear localStorage
# Open DevTools → Application → localStorage → clear
# Refresh page
```

---

## 📚 Next Steps

### Want to Add Features?
1. Check `docs/IMPLEMENTATION_PLAN.md` for detailed guides
2. Follow existing component patterns
3. Use Zod schemas for validation
4. Add tests alongside code

### Want to Deploy?
```bash
# Build for production
npm run build

# Start production server
npm run start

# Or deploy to Vercel
vercel deploy
```

### Want to Connect CLI?
See `docs/MAIN_DOC.md` for CLI implementation details

### Want to Add Testing?
```bash
npm install -D jest @testing-library/react
npm run test
```

---

## 💡 Pro Tips

1. **Component Reusability**
   - All UI components are in `components/ui/`
   - Use them in any new pages
   - They're fully customizable

2. **Styling**
   - Use Tailwind classes
   - Custom utilities in `app/globals.css`
   - Theme-aware with `dark:` prefix

3. **API Routes**
   - Follow pattern in `/api/v1/*`
   - Use Zod for validation
   - Include JWT checks
   - Log important actions

4. **Database**
   - Edit `prisma/schema.prisma` to add models
   - Run `npx prisma migrate dev` after changes
   - Check `prisma/migrations` for history

5. **Debugging**
   - Enable Tailwind IntelliSense in VS Code
   - Use React DevTools browser extension
   - Check browser console for errors
   - Check terminal for server logs

---

## 🎯 Feature Checklist

After starting, verify these work:

- [x] Landing page loads beautifully
- [x] Dark/light theme toggle works
- [x] Can sign up and verify email
- [x] Can log in with JWT cookie
- [x] Can create projects
- [x] Can create environments
- [x] Can add encrypted variables
- [x] Can reveal/hide variable values
- [x] Can invite team members
- [x] Can view audit logs
- [x] Can create API tokens
- [x] Can update settings
- [x] Responsive on mobile
- [x] All animations smooth
- [x] No console errors

---

## 🆘 Need Help?

### Check Documentation
- `MAIN_DOC.md` - Full specification
- `DESIGN_SYSTEM.md` - UI/UX details
- `COMPONENT_LIBRARY.md` - Component docs
- `API` - See type definitions in code

### Common Issues

**Login Not Working?**
- Check email is registered
- Check password is correct
- Check `.env.local` has JWT_SECRET

**Variables Not Saving?**
- Check ENCRYPTION_KEY in .env.local
- Check database connection
- Check user has permission

**Styles Not Applying?**
- Clear Tailwind cache: `rm -rf .next`
- Run `npm run dev` again
- Check class names are correct

---

## 📞 Support Resources

- GitHub Issues: Report bugs
- Documentation: Read `docs/` folder
- Type Definitions: Check component props
- Examples: See working pages for patterns

---

**You're all set! Happy coding! 🎉**

Visit http://localhost:3000 and explore EnvShield!
