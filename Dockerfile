FROM node:lts-alpine3.14

RUN apk update
RUN apk add git docker docker-compose

WORKDIR /app

COPY package.json .

RUN npm i

COPY . .

CMD ["npm", "start"]