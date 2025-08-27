#!/bin/bash

echo "🚀 DayBrief Deployment Script"
echo "============================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing Git repository..."
    git init
    git branch -M main
fi

# Check if remote is set
if ! git remote get-url origin &> /dev/null; then
    echo "🔗 Please set your GitHub repository URL:"
    read -p "GitHub repository URL (https://github.com/username/daybrief.git): " repo_url
    git remote add origin "$repo_url"
fi

# Build and test before deployment
echo "🏗️  Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

echo "🧪 Running tests..."
npm run test:run

if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Please fix tests before deploying."
    exit 1
fi

# Commit and push
echo "📦 Committing changes..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit."
else
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo "⬆️  Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "Next steps for Vercel deployment:"
echo "1. Go to https://vercel.com"
echo "2. Click 'New Project'"
echo "3. Import your GitHub repository"
echo "4. Configure environment variables:"
echo "   - NEXTAUTH_URL=https://your-app.vercel.app"
echo "   - NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>"
echo "   - DATABASE_URL=<your production database URL>"
echo "   - OPENAI_API_KEY=<your OpenAI key>"
echo "   - GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET"
echo "   - (Optional) MS_CLIENT_ID & MS_CLIENT_SECRET"
echo "   - (Optional) RESEND_API_KEY"
echo "   - (Optional) SLACK_BOT_TOKEN & SLACK_SIGNING_SECRET"
echo ""
echo "5. Update OAuth redirect URLs:"
echo "   - Google: https://your-app.vercel.app/api/auth/callback/google"
echo "   - Microsoft: https://your-app.vercel.app/api/auth/callback/microsoft"
echo ""
echo "6. Click Deploy!"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
