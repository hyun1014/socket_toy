FROM node:12

RUN mkdir -p /home/node/app/node_modules

WORKDIR /home/node/app

COPY . .

RUN npm install

CMD ["node", "app.js"]