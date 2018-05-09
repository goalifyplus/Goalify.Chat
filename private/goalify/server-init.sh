#!/bin/bash
# NOTE: The commands here only applicable for Ubuntu 16.04 Xenial, do not use it for other distros

while true; do
    read -p "IMPORTANT: Have you mapped domain to this VPS instance first? (y|n)" yn
    case $yn in
        [Yy]* ) break;;
        [Nn]* ) exit;;
        * ) echo "Please answer (y)es or (n)o.";;
    esac
done

# Directly set goalify chat bot gitlab token here or export to ENV
GITLAB_TOKEN=$GITLAB_TOKEN_ENV
GITLAB_PASS=$GITLAB_PASS_ENV
SUBDOMAIN=public
SITE_NAME="Goalify Chat"
ADMIN_USER=admin
ADMIN_PASS=supersecret
ADMIN_EMAIL=admin@goalify.chat

# Update server to latest packages
sudo apt update && sudo apt upgrade -y

# Install prerequisite software
sudo apt install -y software-properties-common nginx git graphicsmagick

# Add Mongo DB app source
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list

# Add NodeJS app source (which already include npm)
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

# Add certbot app source
sudo add-apt-repository -y ppa:certbot/certbot

# Install needed software
sudo apt update && sudo apt install -y python-certbot-nginx mongodb-org nodejs

# Install this package to allow switching Node version
sudo npm install --global n

# Install stable version of Node for Meteor & Goalify Chat
sudo n 8.9.3

# mongo replica set guide: https://rocket.chat/docs/installation/manual-installation/ubuntu/
# Enable replication for mongodb for better concurrency
echo "replication:" | sudo tee -a /etc/mongod.conf
echo "  replSetName: \"rs0\"" | sudo tee -a /etc/mongod.conf

# Start mongod service
sudo systemctl start mongod
# Enable mongod service auto restart
sudo systemctl enable mongod

# Create app user
sudo useradd goalifychat

# Download prebuilt Goalify Chat server
# adapted from https://github.com/RocketChat/Rocket.Chat/blob/develop/.docker/Dockerfile
set -x \
 && curl -SLf "https://s3-ap-southeast-1.amazonaws.com/goalify.chat/downloads/beta/goalify-chat-server.tar.gz" -o goalify.chat.tgz \
 && sudo mkdir -p /app \
 && sudo chown -R `whoami` /app \
 && tar -zxf goalify.chat.tgz -C /app \
 && rm goalify.chat.tgz \
 && cd /app/bundle/programs/server \
 && npm install \
 && npm cache clear --force

# Create systemd service file for rocketchat server
NODE_PATH=`n bin 8.9.3`
APP_PATH="/app/bundle"

cd ~

cat > goalifychat.service <<EOF
[Unit]
Description=A Goalify chat app
Requires=mongod.service
After=mongod.service

[Service]
ExecStart=$NODE_PATH ${APP_PATH}/main.js
Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=goalifychat
User=goalifychat
Group=goalifychat
Environment=MONGO_OPLOG_URL=mongodb://localhost:27017/local?replicaSet=rs0
Environment=MONGO_URL=mongodb://localhost:27017/goalifychat?replicaSet=rs0
Environment=ROOT_URL=https://$SUBDOMAIN.goalify.chat
Environment=SUBDOMAIN=$SUBDOMAIN
Environment=SITE_NAME=$SITE_NAME
Environment=PORT=3000
Environment=ADMIN_USERNAME=$ADMIN_USER
Environment=ADMIN_PASS=$ADMIN_PASS
Environment=ADMIN_EMAIL=$ADMIN_EMAIL

[Install]
WantedBy=multi-user.target
EOF

sudo cp goalifychat.service /etc/systemd/system/goalifychat.service
rm goalifychat.service

# Create Nginx reversed proxy config:
cat > nginx-site.conf <<EOF
# Fix websocket proxying
map \$http_upgrade \$connection_upgrade {
	default upgrade;
	''      close;
}

server {
	listen 80;
	listen [::]:80;

	index index.html index.htm;

	server_name $SUBDOMAIN.goalify.chat;

	location / {
		proxy_redirect     off;
		proxy_set_header   X-Real-IP         \$remote_addr;
		proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
		proxy_set_header   X-Forwarded-Proto \$scheme;
		proxy_set_header   Host              \$http_host;
		proxy_set_header   X-NginX-Proxy     true;
		proxy_http_version 1.1;
		proxy_pass         http://127.0.0.1:3000;
		# Websocket proxying
		proxy_set_header   Upgrade           \$http_upgrade;
		proxy_set_header   Connection        \$connection_upgrade;
	}
}
EOF

sudo cp nginx-site.conf /etc/nginx/sites-available/default
rm nginx-site.conf

# Enable web proxies with secured SSL certificate from let's encrypt
echo NOTE: Mannual, interactive inputs ahead for certbot
sudo certbot --nginx

# Restart nginx with new config
sudo systemctl restart nginx

# Install chatbot
mkdir -p /app/goalify-chat-bot
# NOTE: /app is still owned by `whoami`

# Make sure GITLAB_TOKEN & GITLAB_PASS variables are exported
git clone https://$GITLAB_TOKEN:$GITLAB_PASS@gitlab.com/goalify/chat/goalify-chat-bot.git /app/goalify-chat-bot
cd /app/goalify-chat-bot
npm install

# change /app folders to custom user for security sake
sudo chown -R goalifychat:goalifychat /app

# Initiate mongodb replica set feature
mongo --eval 'rs.initiate()'

# Start goalifychat service
sudo systemctl start goalifychat.service
echo "Goalifychat Service STARTED!"
# Enable auto start
sudo systemctl enable goalifychat.service

echo "Note: Remember to enable HTTP2 at /etc/nginx/sites-available/default"
echo "GOALIFYCHAT SERVER SYSTEM INITIALIZATION COMPLETE!"
