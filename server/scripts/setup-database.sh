#!/bin/bash

echo "🚀 Setting up StudyGenius Database..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
if ! sudo service postgresql status > /dev/null 2>&1; then
    echo -e "${YELLOW}📡 Starting PostgreSQL service...${NC}"
    sudo service postgresql start
    sleep 2
fi

# Check PostgreSQL status
if sudo service postgresql status > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    exit 1
fi

# Database configuration
DB_NAME="studygenius"
DB_USER="postgres"
DB_ENCODING="UTF8"
DB_LOCALE="C.UTF-8"

echo -e "${BLUE}📊 Database Configuration:${NC}"
echo "  Database Name: $DB_NAME"
echo "  Encoding: $DB_ENCODING"
echo "  Locale: $DB_LOCALE"
echo "  Port: 5432"

# Check if database already exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🗑️  Dropping existing database...${NC}"
        sudo -u postgres dropdb $DB_NAME
    else
        echo -e "${GREEN}✅ Using existing database${NC}"
        exit 0
    fi
fi

# Create database
echo -e "${BLUE}🔨 Creating database '$DB_NAME'...${NC}"
sudo -u postgres createdb $DB_NAME -E $DB_ENCODING -l $DB_LOCALE -T template0

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create database${NC}"
    exit 1
fi

# Enable extensions
echo -e "${BLUE}🔧 Enabling PostgreSQL extensions...${NC}"

extensions=("uuid-ossp" "pg_trgm" "unaccent")

for ext in "${extensions[@]}"; do
    echo "  - Enabling $ext..."
    sudo -u postgres psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"$ext\";" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "    ${GREEN}✅ $ext enabled${NC}"
    else
        echo -e "    ${YELLOW}⚠️  $ext may already exist or failed to enable${NC}"
    fi
done

# Verify database
echo -e "${BLUE}🔍 Verifying database setup...${NC}"
sudo -u postgres psql -d $DB_NAME -c "
SELECT 
    current_database() as database_name,
    current_setting('server_encoding') as encoding,
    current_setting('lc_collate') as collate,
    current_setting('lc_ctype') as ctype;
" 2>/dev/null

# Create .env entry
echo -e "${BLUE}📝 Database connection string:${NC}"
echo -e "${GREEN}DATABASE_URL=postgresql://postgres@localhost:5432/$DB_NAME${NC}"

echo ""
echo -e "${GREEN}🎉 StudyGenius database setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Add the DATABASE_URL to your server/.env file"
echo "2. Run: cd server && npm run db:migrate"
echo "3. Start the server: npm run dev"
echo ""
echo -e "${YELLOW}💡 Tip: Save this connection string in your .env file${NC}"