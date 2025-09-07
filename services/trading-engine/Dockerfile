FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY services/trading-engine/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY services/trading-engine/src ./src
COPY services/trading-engine/*.js ./

# Create non-root user
RUN addgroup -g 1001 -S trader && \
    adduser -S trader -u 1001

# Switch to non-root user
USER trader

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

EXPOSE 8080

CMD ["node", "index.js"]