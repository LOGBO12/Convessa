# Getting your API key

Your API key is generated automatically when you connect a WhatsApp number to your account.

## 1. Create an account

Create an account on the platform with your email address, your Google account, or your phone number.

## 2. Connect your number

From your dashboard, go to the **Sessions** section. Click **Connect a number**, then scan the QR code with the WhatsApp app on your phone:

1. Open WhatsApp on your phone
2. Go to **Settings > Linked devices**
3. Tap **Link a device**
4. Scan the QR code shown on your dashboard

Once the connection is established, your session switches to the **Connected** state.

## 3. Retrieve your API key

Your API key is available in the **Sessions** section of your dashboard. It looks like this:

```
pk_convessa_xxxxxx...xxxxxx
```

Copy it immediately: for security reasons, it will no longer be shown in full after this first display.

## Storing the key

Store your key in an environment variable, never hardcoded in your source code.

```bash
# .env
CONVESSA_API_KEY=pk_convessa_xxxxxx...xxxxxx
```

Never commit your `.env` file to a Git repository. Add it to your `.gitignore`.

## Validity period

The API key is tied to your active subscription. Depending on the plan chosen, it is valid for a set duration or for a defined number of messages. Check the **Sessions** section of your dashboard to see the expiration date and your remaining quota.

## Renewing or revoking

- **Renew**: subscribe to a new plan from the **Pricing** section — a new key is assigned to you immediately.
- **Revoke**: from the **Sessions** section, disconnect your session. This immediately invalidates the associated key.

If you suspect a compromise, disconnect your session without delay.
