# Convessa: WhatsApp API

Convessa is a platform for sending WhatsApp messages via a REST API. You connect your own WhatsApp number, get an API key, and send messages from any application with a single HTTP call.

No proprietary SDK to install. One header, one endpoint, one JSON payload.

## What you can do

- Send text messages to one or several recipients
- Send images, videos, audio, and documents
- Create WhatsApp groups and broadcast messages to them
- Track the status of each message in real time via Socket.io or webhook
- View your sending history

## How it works

Each Convessa account is linked to a WhatsApp number that you connect by scanning a QR code from your dashboard. This number becomes the sender for all your messages. Your API key uniquely identifies this session.

All sending endpoints use the `X-Api-Key` header. The sender is automatically deduced from your key — you don't need to specify it.

## Before you start

Read the [terms of service](/docs?section=legal) before integrating the API into a high-volume use case. Unsolicited sending exposes your number to being banned by WhatsApp.
