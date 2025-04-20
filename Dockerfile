FROM node:16-alpine

WORKDIR /app

COPY websocket-server.js .
COPY package.json .

RUN npm install

EXPOSE 8081

CMD ["node", "websocket-server.js"]
