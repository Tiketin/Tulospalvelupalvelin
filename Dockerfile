FROM node:22-alpine

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (ignoring local scripts temporarily)
RUN npm ci

# Copy application source code
COPY . .

# Generate Prisma Client specifically for the Alpine (linux-musl) container environment
RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]