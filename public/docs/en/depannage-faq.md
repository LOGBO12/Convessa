# Frequently Asked Questions (FAQ) & Troubleshooting Guide

Here you will find answers to the most common questions and solutions to frequent issues when using CONVESSA.

---

## Connection Issues

### The QR code does not appear or loops endlessly

- Check your internet connection.
- Refresh your browser page.
- Make sure no ad-blocker or browser extension is blocking WebSocket requests (`Socket.io`).
- Try using another browser (Chrome or Firefox recommended).

### WhatsApp disconnects frequently

- Your smartphone must remain connected to a stable internet network (Wi-Fi or 4G/5G). Convessa relies on WhatsApp's official linked devices technology.
- On Android, disable battery optimization for WhatsApp to prevent the OS from closing the app in the background.
- Never disconnect the **Convessa / Linked Device** session from the mobile WhatsApp app — always manage the connection from the **Sessions** tab in your dashboard.

### Where is my API key?

Your API key (`pk_convessa_...`) is available in the **Sessions** tab of your dashboard as soon as your number is connected. For security reasons, copy it immediately: it is only shown in plain text during the first view. If lost, disconnect and reconnect your session to generate a new one.

### Can I use my own WhatsApp Business account?

Yes. CONVESSA works equally well with a standard WhatsApp account or a WhatsApp Business account.

---

## Sending Issues

### Error `401 Unauthorized`

- **Cause**: The API key passed in the `X-Api-Key` header is missing, invalid, or revoked.
- **Solution**: Check the spelling of your key in your code or `.env` file. The key must start with `pk_convessa_`. If lost or compromised, generate a new one from the **Sessions** tab.

### Error `429 Too Many Requests / Quota Exceeded`

- **Cause**: You have reached the message limit allocated to your plan.
- **Solution**: Upgrade to a higher plan or top up credits in the **[View Plans](/pricing)** section. Quota update is instant and your API key remains unchanged.

### Error `503 WhatsApp Disconnected`

- **Cause**: Your WhatsApp session is disconnected or offline.
- **Solution**: Go back to the **[Access My Sessions](/sessions)** tab, click **Reconnect**, and scan the QR code again.

### Messages remain in "Pending" status

- Make sure the smartphone is powered on and connected to the internet.
- Open the WhatsApp app on your phone to force synchronization if it was in prolonged standby.

### Recipient does not receive messages

- Ensure the number is entered in international format without spaces or `+` — examples: `33612345678` (France), `2250700000000` (Ivory Coast), `22961000000` (Benin).
- Verify that the recipient has an active WhatsApp account on that number.

---

## WhatsApp Banning

### My number was banned. What should I do?

WhatsApp may temporarily or permanently ban a number that violates its Terms of Service (unsolicited mass messaging, spam, abusive automated behavior). CONVESSA cannot be held responsible for a ban.

To minimize risks:

- Only send messages to people who have given explicit **consent (opt-in)**.
- Space out broadcast messages and avoid repeating identical messages.
- Review the [Terms of Service](/docs?section=legal) for allowed and forbidden uses.

If your number is banned, you will need to use another number and create a new session from the **Sessions** tab.
