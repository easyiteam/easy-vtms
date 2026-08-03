FROM node:20-alpine

# Install GDAL
RUN apk add --no-cache gdal gdal-tools gdal-dev

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["npm", "run", "dev"]
