This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy to Google Cloud Run

To deploy this application to Google Cloud Run, follow these steps:

1.  **Install Google Cloud SDK:** If you haven't already, install the Google Cloud SDK:
    `curl https://sdk.cloud.google.com | bash`
    Then initialize it:
    `gcloud init`

2.  **Authenticate Docker:**
    `gcloud auth configure-docker`

3.  **Build the Docker Image:**
    First, create a `Dockerfile` in the root of your project:

    ```dockerfile
    # Install dependencies
    FROM node:18-alpine AS deps
    WORKDIR /app
    COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
    RUN \
        if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
        elif [ -f package.json ]; then npm install --frozen-lockfile; \
        elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
        else npm install; \
        fi

    # Rebuild the source code only when needed
    FROM node:18-alpine AS builder
    WORKDIR /app
    COPY --from=deps /app/node_modules ./
    COPY . .
    RUN npx prisma generate --schema=./prisma/schema.prisma || true
    ENV NEXT_TELEMETRY_DISABLED 1
    RUN npm run build

    # Production image, copy all the files and run next
    FROM node:18-alpine AS runner
    WORKDIR /app

    ENV NODE_ENV production
    # Uncomment the following line in case you want to disable telemetry during runtime.
    ENV NEXT_TELEMETRY_DISABLED 1

    RUN addgroup --system --gid 1001 nodejs
    RUN adduser --system --uid 1001 nextjs

    COPY --from=builder /app/public ./
    COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
    COPY --from=builder /app/node_modules ./
    COPY --from=builder /app/package.json ./

    USER nextjs

    EXPOSE 3000

    ENV PORT 3000

    CMD ["npm", "start"]
    ```

    Then, build your Docker image. Replace `your-project-id` and `your-service-name` with your Google Cloud Project ID and desired service name:
    `docker build -t gcr.io/your-project-id/your-service-name:latest .`

4.  **Push the Docker Image:**
    `docker push gcr.io/your-project-id/your-service-name:latest`

5.  **Deploy to Cloud Run:**
    `gcloud run deploy your-service-name --image gcr.io/your-project-id/your-service-name:latest --platform managed --region us-central1 --allow-unauthenticated`
    (Adjust `--region` and other parameters as needed.)

Remember to set your environment variables (like `GEMINI_API_KEY`) in the Cloud Run service settings after deployment.

## Environment Variables

This project uses the following environment variables:

- `GEMINI_API_KEY`: Your Google Gemini API key.