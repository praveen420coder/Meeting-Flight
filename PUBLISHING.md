# Publishing Meeting Flight so anyone can use it

End users never touch the Google Cloud Console. You (the developer) set up OAuth
once; users just install and click **Connect calendar**. This is the path from
"works on my machine" to "anyone can install it."

## Stable extension ID (already done)

The `key` field in `manifest.json` pins the unpacked extension ID to:

```
lkebkpighnokbkobmimgdlchmpekeopb
```

- Create your OAuth **Chrome Extension** client with this as the Application ID.
- `key.pem` in this folder backs that ID. Keep it safe, never commit it publicly,
  and never include it in the ZIP you upload to the store.

## Option A — Private / small group (no store review)

Best if it's just you and a few people.

1. Keep the OAuth consent screen in **Testing** mode.
2. Add each person's Gmail under **OAuth consent screen -> Test users** (max 100).
3. Share the extension folder; each person loads it unpacked via
   `chrome://extensions` -> Developer mode -> Load unpacked.

Downside: everyone must load it unpacked, which is clunky for non-technical users.

## Option B — Public via Chrome Web Store

1. **Register as a developer**: one-time US$5 fee at
   https://chrome.google.com/webstore/devconsole
2. **Zip the extension**: include everything EXCEPT `key.pem`, `README.md`,
   `PUBLISHING.md`, and any dev files. Required: `manifest.json`, `icons/`, `src/`.
3. **Upload the ZIP** in the Developer Dashboard -> New item.
4. **Confirm the assigned extension ID.** The store shows the published item's ID.
   If it differs from the local ID above, update your OAuth client's Application ID
   to match the published ID (the store's ID is authoritative once published).
5. **Store listing**: add a description, at least one screenshot (1280x800 or
   640x400), a small promo tile, and a category. A privacy policy URL is required
   because the app reads calendar data.
6. **Verify the OAuth consent screen for production:**
   - Switch the consent screen from Testing to **Production**.
   - The `calendar.events.readonly` scope is "sensitive," so Google requires
     **app verification**: describe the app, justify the scope, and verify domain
     ownership. Until verified, external users see an "unverified app" warning and
     you're capped at 100 users. After verification, the warning disappears and
     the user cap is lifted.
7. **Submit for review.** Chrome Web Store review typically takes a few days.

## What the end user experiences

Install from the Web Store -> click the icon -> **Connect calendar** ->
approve on Google's screen -> done. They sign in with their own Google account
and grant access to their own calendar. They never create a Client ID.

## Handy commands

Re-derive the extension ID from the key (should match the ID above):

```bash
openssl rsa -in key.pem -pubout -outform DER 2>/dev/null \
  | openssl dgst -sha256 -binary | head -c16 | xxd -p | tr '0-9a-f' 'a-p'
```

Build a store-ready ZIP (run from this folder):

```bash
zip -r meeting-flight.zip manifest.json icons src -x '*.DS_Store'
```
