FROM node:12

RUN mkdir -p /home/node/app/node_modules

WORKDIR /home/node/app

COPY . .

RUN apt-get update

RUN apt-get -y install curl gnupg

RUN npm install

EXPOSE 3000

CMD ["node", "app.js"]