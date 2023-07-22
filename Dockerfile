# Define the base image. The 16.5-buster image comes with some common tools and the LTS version of Node.js installed.
FROM node:16.5-buster

# Set the working directory in the container
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# If you are using npm
RUN npm install

# If you are using yarn
# RUN yarn install

# Bundle app source
COPY . .

# Transpile Typescript to Javascript
RUN npx esbuild ./src/index.ts --outfile=./dist/index.js --bundle --platform=node --target=node16

# Your app listens on port 3000 (Replace this port with the one your app uses)
EXPOSE 3000

# Define the command to run your app using CMD which defines your runtime
# Here we are using node command to run the server
CMD [ "node", "./dist/index.js" ]
