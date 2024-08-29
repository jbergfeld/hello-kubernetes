FROM cgr.dev/chainguard/wolfi-base

ARG version=3.11

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN apk update && apk add nodejs && apk add npm

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

ENV PORT 5000

USER nonroot
CMD [ "npm", "start" ]

