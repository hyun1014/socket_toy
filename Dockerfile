FROM node:12

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

RUN apt-get update

RUN apt-get -y install curl gnupg

RUN curl -sL https://deb.nodesource.com/setup_11.x  | bash -

RUN apt-get -y install nodejs

RUN npm install

COPY --chown=node:node . .

EXPOSE 3000

CMD [ "node", "app.js" ]