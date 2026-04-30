# Event Reminder Integration

## What Was Added
The landing page now includes an email reminder signup form that collects:
- First name
- Email
- Neighborhood or area
- Reminder frequency
- Event interests

## Current Behavior
- Submissions are saved in browser local storage under `connect-my-tribe-event-reminders`.
- The page is also ready to send the same submission payload to a real endpoint.

## How to Connect It
Inside `landing-page-preview.html`, find this line:

`const EVENT_REMINDER_WEBHOOK = "";`

Replace the empty string with your real endpoint URL.

## Good Options
- Supabase Edge Function that inserts contacts into a reminders table
- Mailchimp or Brevo form webhook endpoint
- A small backend route that stores contacts and triggers reminder campaigns later

## Example Payload
```json
{
  "name": "Jordan",
  "email": "jordan@example.com",
  "area": "Logan Square",
  "frequency": "weekly",
  "interests": "Music, volunteering",
  "createdAt": "2026-04-23T12:00:00.000Z"
}
```

## Recommended Next Step
Connect this form to the same system you plan to use for event reminder emails so signups begin flowing into a real audience list immediately.
