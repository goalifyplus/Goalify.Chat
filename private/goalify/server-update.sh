#!/bin/bash

# Download built Goalify Chat server and update
set -x \
 && curl -SLf "https://s3-ap-southeast-1.amazonaws.com/goalify.chat/downloads/beta/goalify-chat-server.tar.gz" -o goalify.chat.tgz \
 && sudo tar -zxf goalify.chat.tgz -C /app \
 && rm goalify.chat.tgz \
 && cd /app/bundle/programs/server \
 && sudo npm install \
 && sudo npm cache clear --force \
 && sudo chown -R goalifychat:goalifychat /app

sudo systemctl restart goalifychat.service

echo "Goalify Chat server updated and restarted!"
