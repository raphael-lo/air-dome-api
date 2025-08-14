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

# --- DEBUGGING STEP ---
# List all files immediately after copy to see what is in the build context
RUN echo "--- Files after COPY . . ---" && ls -lR
# --- END DEBUGGING STEP ---

# Creates a "dist" folder with the production build
RUN npm run build

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Run the app when the container launches
CMD [ "tail", "-f", "/dev/null" ]
