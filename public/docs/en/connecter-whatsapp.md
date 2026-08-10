# Connect and Manage Your WhatsApp Session

To send messages via CONVESSA, you need to connect your personal or business WhatsApp number to your account. This number becomes the sender for all your messages.

---

## Accessing Sessions

From your CONVESSA dashboard, click on **Sessions** in the sidebar menu. This is where you manage all your WhatsApp connections and retrieve your API key.

---

## Generating the QR Code

1. In the **Sessions** tab, click the **Connect a Number** button.
2. A **unique QR Code** will appear on the screen. It is valid for **60 seconds**.
3. If the QR code expires before you scan it, simply refresh the page to generate a new one.

> If the QR code does not display or loads indefinitely, check your internet connection and ensure no ad-blocker or browser extension is blocking WebSocket requests.

---

## Scanning the QR Code

Open **WhatsApp** or **WhatsApp Business** on your phone, then open linked devices:

- **On Android**: Menu (3 dots top right) > **Linked devices**
- **On iPhone**: Settings (bottom right) > **Linked devices**

Tap **Link a device** and scan the QR code displayed on your computer screen.

In a few seconds, your session status will change to **Connected** (`connected`) and your API key will be available in the Sessions tab.

---

## Session Statuses

| Status | Meaning | Recommended Action |
| :--- | :--- | :--- |
| **Pending** (`pending_qr`) | The QR code was generated and is waiting to be scanned. | Scan within 60 seconds. If expired, refresh the page. |
| **Connected** (`connected`) | The session is active. Your API key is ready to use. | You can start sending messages via the API. |
| **Disconnected** (`disconnected`) | The connection was closed (phone disconnection or expiration). | Click **Reconnect** and scan a new QR code. |

---

## Reconnecting or Changing Sender Number

- **Reconnect the same number**: In the **Sessions** tab, click **Reconnect** and scan the QR code again. Your API key remains unchanged.
- **Change sender number**: First disconnect the active session, then click **Link a new number**. A new API key will be generated.

---

## Stability Best Practices

- Keep your smartphone connected to a stable internet network (Wi-Fi or 4G/5G).
- On Android, disable battery optimization for WhatsApp to prevent the system from closing the app in the background.
- Never disconnect the **Convessa / Linked Device** session from the mobile WhatsApp app — always manage the connection from your dashboard.
