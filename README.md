# SQS-WECHATY

Powered by [wechaty-puppet-padplus](https://github.com/botorange/wechaty-puppet-padplus)

## Introduction
This project is based on our business scenario (for notifications only)

Here are the major packages
- slack (Send qrcode)
- mongoose (Save login info)
- sqs-consumer (We pull messages from sqs(aws) and send them to others)

## Environment
You should new a file witch name is `.env` to set the environment variables 

```
# mongodb url
MONGO_URI="xxxxxx" 

# aws sqs url
SQS_WECHATY_URL="xxxxxx" (aws sqs)

WECHATY_PADPLUS_TOKEN="xxxx"

NODE_ENV=production

QRCODE_IMAGE_URL=https://api.qrserver.com/v1/create-qr-code/?data=

#slack url
SLACK_TOKEN="xxxx"

```
## Install

```
$ npm install
```
## Usage

```
# start
$ npm run start

# development
$ npm run dev
```
## Docker 
```
# build
$ docker build  --build-arg DEFAULT_AWS_ACCESS_KEY_ID="xxx" --build-arg DEFAULT_AWS_SECRET_ACCESS_KEY="xxx" -t sqs-wechaty .

# run  
$ docker run -d --restart=always --net="host" -v ~/.wechaty:/root/.wechaty --name bot sqs-wechaty:latest
```
