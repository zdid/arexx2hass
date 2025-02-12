FROM node:18-alpine

WORKDIR /app
COPY package.json .
RUN npm install
COPY ./dist ./dist
COPY ./config_default ./config_default 
COPY ./linux ./linux
COPY ./src ./src
COPY ./LICENSE .

CMD ["node", "dist/index.js"]