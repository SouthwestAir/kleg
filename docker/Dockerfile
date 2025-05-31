# Check README for info on running with Docker
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Install kleg
RUN npm install -g @southwestair/kleg

# Set kleg as entrypoint
ENTRYPOINT ["node", "/usr/local/lib/node_modules/kleg/dist/kleg.js"]
