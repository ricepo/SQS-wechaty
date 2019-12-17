# base image
FROM node:10.16.3
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

ARG DEFAULT_AWS_ACCESS_KEY_ID
ENV AWS_ACCESS_KEY_ID=$DEFAULT_AWS_ACCESS_KEY_ID

ARG DEFAULT_AWS_SECRET_ACCESS_KEY
ENV AWS_SECRET_ACCESS_KEY=$DEFAULT_AWS_SECRET_ACCESS_KEY

ENV AWS_DEFAULT_REGION=us-east-1

# copy application to docker container

COPY . /SQS-wechaty
WORKDIR /SQS-wechaty

#npm install
RUN npm install

# # execute command to start server
CMD ["npm","run","start"]