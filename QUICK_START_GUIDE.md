# EnvShield Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Start the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

---

### Step 2: Update Your Profile

Your account currently shows:
- **Name:** User
- **Email:** user@example.com

To update to your desired profile:

1. Login to the dashboard
2. Navigate to **Settings** (click profile icon in nav)
3. You'll be on the **Profile** tab by default
4. Update the fields:
   - **Full Name:** Change "User" to "Gautham"
   - **Email:** Change "user@example.com" to "gauthamrkrishna8@gmail.com"
5. Click **"Save Changes"**
6. You should see a success message: "Profile updated successfully!"

✅ **Your profile is now updated!**

---

### Step 3: Create Your First API Token for CLI

To use the CLI, you need an API token:

1. Still in **Settings**, click the **"API Tokens"** tab
2. In the "Create New Token" section:
   - Enter a name like "My Laptop" or "Development Machine"
3. Click **"Create"**
4. **IMPORTANT:** Copy the token immediately - you won't see it again!
5. The token starts with `esh_`

**Use the token with CLI:**

```bash
# Option 1: Login normally and it will work
cd cli
npm run build
npm link
envshield login
# Enter your email: gauthamrkrishna8@gmail.com
# Enter your password

# Option 2: Or manually set the token
# Create config file
mkdir -p ~/.envshield
cat > ~/.envshield/config.json << 'EOF'
{
  "apiUrl": "http://localhost:3000/api/v1",
  "token": "esh_YOUR_TOKEN_HERE",
  "email": "gauthamrkrishna8@gmail.com"
}
EOF

# Test it
envshield whoami
```

---

## 🎯 Create Your First Project

1. Go to the **Projects** page (click "Projects" in nav)
2. Click **"New Project"** button
3. Enter project details:
   - **Name:** My First Project
   - **Description:** Testing EnvShield (optional)
4. Click **"Create Project"**

✅ **Your first project is created!**

---

## 📝 Complete Workflow Example

Let's create a complete workflow:

### 1. Create Project (Web Dashboard)
```
Dashboard → Projects → New Project
Name: "My App"
Description: "Production secrets"
→ Create
```

### 2. Create Environment (Web Dashboard)
```
Projects → My App → (should auto-create 'development' environment)
Or create new environment if needed
```

### 3. Add Variables (Web Dashboard)
```
Projects → My App → Development → Add Variable
Key: DATABASE_URL
Value: postgres://localhost/myapp
Description: Main database connection
→ Add
```

### 4. Pull Variables with CLI
```bash
# Initialize CLI for this project
cd ~/my-app
envshield init
# Select: My App
# Select: development

# Pull variables to .env file
envshield pull
# ✅ Pulled 1 variable(s) to .env

# Check the file
cat .env
# DATABASE_URL=postgres://localhost/myapp
```

### 5. Push Changes with CLI
```bash
# Edit .env file
echo "API_KEY=sk_test_12345" >> .env

# Push changes
envshield push
# Shows diff:
#   1 new variable(s) to create
#     + API_KEY
# ? Continue? Yes
# ✅ Successfully pushed 1 variable(s)
```

### 6. View in Dashboard
```
Refresh dashboard → should see API_KEY variable
```

---

## 🔐 Token Management

### Create Additional Tokens
You can create multiple tokens for different devices:

1. Settings → API Tokens
2. Create tokens like:
   - "Work Laptop"
   - "Home Desktop"
   - "CI/CD Pipeline"

### Revoke Tokens
When you no longer use a device:

1. Settings → API Tokens → Active Tokens
2. Find the token (e.g., "Old Laptop")
3. Click **"Revoke"**
4. Confirm → Token is immediately invalidated

**Security Tip:** Revoke tokens from lost or stolen devices immediately!

---

## 🐛 Troubleshooting

### Problem: "Unauthorized" Error in CLI
**Solution:**
```bash
# Clear old token
envshield logout

# Login again
envshield login
# Use updated email: gauthamrkrishna8@gmail.com
```

### Problem: Profile Not Updating
**Solution:**
- Check if email is already taken by another account
- Ensure both fields are filled out
- Check browser console for errors

### Problem: Token Not Working
**Solution:**
```bash
# Verify token exists
envshield whoami

# If fails, create new token in dashboard
# Then login again with new credentials
```

### Problem: CLI Can't Connect
**Solution:**
```bash
# Make sure dev server is running
npm run dev

# Check API URL in config
cat ~/.envshield/config.json
# Should show: "apiUrl": "http://localhost:3000/api/v1"
```

---

## 📚 What's Next?

1. **Explore the dashboard:**
   - View audit logs (Settings → Security tab)
   - Manage project members (Project → Settings)
   - Create multiple environments

2. **Try the CLI:**
   - `envshield list` - See all projects
   - `envshield pull --help` - View options
   - `envshield push --file .env.production` - Push from different file

3. **Read the docs:**
   - `CLI_IMPLEMENTATION_COMPLETE.md` - CLI features
   - `DASHBOARD_FEATURES_ADDED.md` - Dashboard features
   - `docs/MAIN_DOC.md` - Complete specification

---

## 🎉 You're All Set!

You now have:
- ✅ Updated profile (Gautham / gauthamrkrishna8@gmail.com)
- ✅ API token for CLI access
- ✅ Ability to create projects from dashboard
- ✅ Full CLI workflow (pull/push)
- ✅ Token management capabilities

**Happy coding!** 🚀
