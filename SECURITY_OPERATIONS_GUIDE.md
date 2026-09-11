# BotShield Security Operations Guide

## Safe rollout

Create a project in **shadow mode** before enabling active blocking. Observe score distributions, blocked-request reasons, legitimate conversion rates, and support reports for several days. Change one threshold or policy at a time, record the change owner, and keep a rollback path. Use the `strict`, `balanced`, and `loose` presets as starting points rather than permanent guarantees.

## Decision boundary

A challenge token means that telemetry was scored; it does not mean that the visitor is human. Only a server-side response with `status: "human"` should authorize a protected action. Tokens are short-lived and single-use. Never accept a client-supplied score, status, or allow decision.

## Signal and privacy policy

Mouse movement is one weak signal among timing, typing cadence, focus and scroll activity, device automation indicators, fingerprint continuity, and network hints. Do not use any one signal as an automatic denial rule. Hash IP addresses before analytics storage, avoid collecting form contents, document the purpose of telemetry, and define a retention period for logs and challenge records.

## Accessibility and borderline traffic

Some legitimate users cannot provide normal pointer or typing telemetry, including keyboard-only users, assistive-technology users, privacy-focused browsers, and users on constrained devices. Offer an accessible alternative or a review/challenge path for borderline scores. Do not make mouse movement a required interaction and do not deny solely because a device lacks a particular browser API.

## Abuse controls

Keep exact HTTPS origin allowlists in production. Keep secret keys on servers, rotate them through the dashboard, and revoke exposed keys immediately. Monitor per-IP, per-key, per-account, and per-endpoint rate limits. Alert on sudden score shifts, repeated replay attempts, origin violations, and unusual blocked-request spikes.

## Incident response

For a suspected key leak, revoke the key, issue a replacement, inspect verification logs, and notify affected customers. For a false-positive spike, switch the affected project to shadow mode, lower enforcement, preserve the telemetry summary, and review representative requests. For a bot surge, keep token verification active, tighten rate limits carefully, and avoid changing all customers at once.

## What still requires production authority

Deployment, production secret rotation, external IP/ASN reputation feeds, email or webhook notification wiring, and legal/privacy-policy approval require customer-owned credentials, provider configuration, or an explicit operational decision. The repository includes the code and guidance for those steps but does not perform them automatically.
