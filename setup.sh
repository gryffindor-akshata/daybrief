#!/bin/bash

echo "🚀 Setting up DayBrief..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be 20 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment file
if [ ! -f .env.local ]; then
    echo "📝 Creating environment file..."
    cp .env.local.example .env.local
    echo "⚠️  Please edit .env.local with your OAuth credentials and API keys"
else
    echo "✅ Environment file already exists"
fi

# Generate Prisma client and setup database
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push

# Run tests
echo "🧪 Running tests..."
npm run test:run

# Build the project
echo "🏗️  Building project..."
npm run build

echo ""
echo "🎉 DayBrief setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your credentials:"
echo "   - Google OAuth (CLIENT_ID, CLIENT_SECRET)"
echo "   - Microsoft OAuth (optional)"
echo "   - OpenAI API key"
echo "   - Resend API key (optional, for email recaps)"
echo "   - Slack tokens (optional, for Slack recaps)"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Visit http://localhost:3000 to access DayBrief"
echo ""
echo "📖 For detailed setup instructions, see README.md"
