#!/bin/bash

# Download built Rocket Chat server and install
# adapted from https://github.com/RocketChat/Rocket.Chat/blob/develop/.docker/Dockerfile
set -x \
 && curl -SLf "https://s3-ap-southeast-1.amazonaws.com/goalify.chat/downloads/beta/goalify-chat-server.tar.gz" -o goalify.chat.tgz \
 && sudo mkdir -p /app \
 && sudo tar -zxf goalify.chat.tgz -C /app \
 && rm goalify.chat.tgz \
 && cd /app/bundle/programs/server \
 && sudo npm install \
 && sudo npm cache clear --force \
 && sudo chown -R goalifychat:goalifychat /app
