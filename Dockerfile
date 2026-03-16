# Use Node.js 18 (LTS) as the base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY backend/package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY backend/ .

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["npm", "start"]