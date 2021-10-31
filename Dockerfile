FROM node:14-alpine AS build

RUN apk update && apk upgrade && \
    apk add --no-cache git

COPY server/package.json /app/server/
WORKDIR /app/server
RUN npm install

COPY client/package.json /app/client/
COPY client/bower.json /app/client/
WORKDIR /app/client
RUN npm install -g bower
RUN bower --allow-root install

COPY server/src /app/server/src

COPY client/3rdparty /app/client/3rdparty
COPY client/img /app/client/img
COPY client/print /app/client/print
COPY client/src /app/client/src
COPY client/styles /app/client/styles
COPY client/ui /app/client/ui
COPY client/index.html /app/client/

FROM node:14-alpine AS release

COPY --from=build /app/client /app/client
COPY --from=build /app/server /app/server

WORKDIR /app/server
RUN ls /app/server

EXPOSE 3100

ENTRYPOINT node src/main.js

