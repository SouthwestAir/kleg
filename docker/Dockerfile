# Check README for info on running with Docker
FROM node:20-alpine3.18

# Set the working directory inside the container
WORKDIR /app

# Install kleg
RUN npm install -g kafka-lambda-event-generator

# Set kleg as entrypoint
ENTRYPOINT ["node", "/usr/local/lib/node_modules/kafka-lambda-event-generator/dist/kleg.js"]
