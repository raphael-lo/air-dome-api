# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages
RUN npm install

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN npm run build

# --- DEBUGGING STEP ---
# Verify that the main file exists. If not, list the directory and exit with an error.
RUN if [ ! -f dist/index.js ]; then \
      echo "Error: dist/index.js not found after build." && \
      ls -lR dist && \
      exit 1; \
    fi
# --- END DEBUGGING STEP ---

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Run the app when the container launches
CMD ["npm", "start"]
