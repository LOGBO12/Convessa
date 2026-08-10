# Pricing, Plans and Sending Limits

CONVESSA offers flexible plans tailored to all WhatsApp messaging needs, from freelancers to high-volume teams.

---

## Available Plans

| Plan | Target Usage | Included |
| :--- | :--- | :--- |
| **Starter / Discovery** | Testing, occasional alerts, early projects | Limited message quota, full REST API access |
| **Pro / Business** | Regular volume, automations, teams | High quota, real-time webhooks, group management |
| **Enterprise / Unlimited** | High volume, multi-account | Guaranteed volume, priority support, multi-session management |

To view current prices and subscribe to a plan, go to the **[View Plans](/pricing)** section of the application.

---

## Quotas and Renewal

Each account comes with an included message quota depending on the subscribed plan.

### How to Check Your Remaining Messages

1. Log in to your CONVESSA dashboard.
2. Go to the **Sessions** or **My Account** tab.
3. You will find your indicator for **sent messages** and **remaining messages** for the current billing period.

Tip: The AI chatbot assistant can also tell you your remaining quota in real time — just ask it directly.

### What Happens When You Exceed Your Quota?

When you reach your plan limit, API sending calls return an error `HTTP 429 ACCESS_DENIED` (Quota exceeded). The API key remains valid, but sending is blocked until renewal.

To top up your messages, go to the **Pricing & Plans** section in the dashboard and choose your new plan or top-up. Your quota is updated instantly and your API key remains unchanged.

---

## Payment Methods

Accepted payment methods are displayed during the subscription process in the app. Your subscription is activated immediately upon payment confirmation — no manual intervention is required.

---

## Anti-Ban Best Practices

WhatsApp applies strict anti-spam policies. Respecting these practices protects your number:

- **Prior Consent (Opt-in)**: Only send messages to people who have given explicit consent.
- **Sending Pace**: Space out broadcast messages when sending to a large list. Avoid sending hundreds of messages within seconds.
- **Reports**: If too many recipients block or report your number, WhatsApp may suspend your line.
- **Content**: Avoid messages that look like spam (suspicious shortened links, identical messages repeated at scale).

Check the [Terms of Service](/docs?section=legal) for more information on allowed and forbidden uses.
