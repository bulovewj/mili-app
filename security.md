# security.md - MIRI API Key Security Rules

> This document defines the security rules for the MIRI project.
> All future Claude API integration work must follow these rules.

---

## 1. Core Principle

Never put a real API key in frontend code.

The following locations are public or user-accessible and must not contain secrets:

- `index.html`
- Inline JavaScript
- Browser bundled JavaScript
- `localStorage`
- `sessionStorage`
- Query strings or URL hashes
- HTML comments
- Public Git repositories
- Netlify static deploy files

If an API key is placed in `index.html`, anyone can read it through browser developer tools, page source, or the network panel.

---

## 2. Current Risk In This Project

The current app is designed as a single static HTML file. This is fine for UI and local learning data, but it is not safe for direct Claude API calls.

These patterns must not be used in production:

```javascript
const CLAUDE_API_KEY = "real_api_key_here";
```

```javascript
fetch("https://api.anthropic.com/v1/messages", {
  headers: {
    "x-api-key": CLAUDE_API_KEY,
    "anthropic-dangerous-direct-browser-access": "true"
  }
});
```

The `anthropic-dangerous-direct-browser-access` header is only for browser-side experimentation. It must not be used for a deployed classroom app.

---

## 3. Required Secure Architecture

Use a backend proxy or serverless function for all Claude API calls.

Recommended deployment structure for Netlify:

```text
Browser index.html
  -> /.netlify/functions/grade
  -> Claude API
```

The browser should call only the project-owned endpoint:

```javascript
fetch("/.netlify/functions/grade", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    activityId,
    studentAnswer
  })
});
```

The serverless function should:

- Read the API key from `process.env.ANTHROPIC_API_KEY`
- Validate `activityId` against an allowlist
- Limit student answer length
- Build the rubric/system prompt on the server
- Call Claude API from the server
- Return only `{ grade, score, feedback, question }` to the browser

---

## 4. Environment Variable Rules

Store the real API key only in the deployment environment.

For Netlify:

1. Go to Site configuration
2. Open Environment variables
3. Add `ANTHROPIC_API_KEY`
4. Add `ALLOWED_ORIGIN` with the deployed site origin, for example `https://your-site.netlify.app`
5. Redeploy the site

Do not commit `.env` files unless they contain placeholder values only.

Allowed:

```text
ANTHROPIC_API_KEY=replace_me
ALLOWED_ORIGIN=https://your-netlify-site.netlify.app
```

Not allowed:

```text
ANTHROPIC_API_KEY=sk-ant-real-secret-value
```

---

## 5. Data Privacy Rules

This app is used by elementary school students, so minimize data sent to AI services.

Do:

- Send only the answer text needed for grading
- Avoid sending student names when possible
- Keep feedback educational and age-appropriate
- Store classroom progress locally only when server storage is not required

Do not:

- Send unnecessary personal information
- Store API responses containing sensitive data
- Log student answers in production server logs
- Put student names or answers in URLs

---

## 6. Abuse Prevention

The serverless API must include basic abuse controls:

- Reject unsupported `activityId` values
- Reject empty answers
- Reject overly long answers
- Use a fixed model name on the server
- Use fixed `max_tokens` and `temperature`
- Return a friendly fallback message if Claude API fails

Recommended limits:

```text
studentAnswer max length: 1000 characters
activityId allowed values: youtube, news, ad, ai, cardnews, summary
temperature: 0
max_tokens: 1000
```

---

## 7. Implementation Checklist

Before enabling real Claude API grading:

- [ ] Remove any real API key from `index.html`
- [ ] Remove direct browser calls to `https://api.anthropic.com/v1/messages`
- [ ] Create a serverless function for grading
- [ ] Store `ANTHROPIC_API_KEY` in Netlify environment variables
- [ ] Validate request body on the server
- [ ] Keep rubric prompts on the server
- [ ] Do not send student names unless required
- [ ] Test API failure handling
- [ ] Confirm browser network tab never exposes `x-api-key`

---

## 8. If A Key Is Accidentally Exposed

If a real API key is committed, uploaded, or deployed in frontend code:

1. Revoke the exposed key immediately in the provider dashboard
2. Create a new API key
3. Store the new key only as an environment variable
4. Remove the exposed key from all files
5. Redeploy the app
6. Check usage logs for unexpected activity

Do not keep using a key after it has been exposed, even if the file was later deleted.
