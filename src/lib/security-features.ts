export const SECURITY_FEATURES = [
  { key: "adaptive_thresholds", name: "Adaptive thresholds", description: "Tune strict, balanced, and permissive thresholds from observed traffic." },
  { key: "shadow_mode", name: "Shadow mode", description: "Log would-block decisions before enforcing them." },
  { key: "replay_protection", name: "Replay protection", description: "Consume challenge tokens once and expire them quickly." },
  { key: "origin_allowlist", name: "Origin allowlist", description: "Reject browser challenges from unapproved origins." },
  { key: "ip_controls", name: "IP controls", description: "Maintain project IP allow and block lists." },
  { key: "rate_limits", name: "Rate limits", description: "Limit verification, signup, login, and challenge abuse." },
  { key: "risk_reasons", name: "Risk reasons", description: "Explain the high-level signals behind a score without storing content." },
  { key: "request_correlation", name: "Request correlation", description: "Trace challenge, verification, and support events safely." },
  { key: "retention_controls", name: "Retention controls", description: "Set bounded deletion windows for security telemetry." },
  { key: "privacy_modes", name: "Privacy modes", description: "Choose minimal, standard, or strict telemetry collection." },
  { key: "consent_gate", name: "Consent gate", description: "Allow customers to require their own consent before telemetry." },
  { key: "accessibility_review", name: "Accessibility review path", description: "Route borderline users to review or alternate challenge flows." },
  { key: "webhook_alerts", name: "Webhook alerts", description: "Send selected security events to a customer HTTPS endpoint." },
  { key: "secret_rotation", name: "Secret rotation", description: "Rotate project secrets with a bounded migration window." },
  { key: "fail_open_policy", name: "Fail-open policy", description: "Choose availability behavior for internal control-plane outages." },
  { key: "audit_log", name: "Security audit log", description: "Record policy, key, access, and administrative changes." },
  { key: "country_policy", name: "Country policy", description: "Support explicit country allow and block policy inputs." },
  { key: "device_signals", name: "Device automation signals", description: "Use webdriver and capability signals as one component, never alone." },
  { key: "network_signals", name: "Network signals", description: "Use coarse connection hints without collecting payload content." },
  { key: "data_export_delete", name: "Export and delete controls", description: "Support verified customer requests for data access and deletion." },
] as const;

export type SecurityFeatureKey = (typeof SECURITY_FEATURES)[number]["key"];
export const isSecurityFeatureKey = (value: string): value is SecurityFeatureKey => SECURITY_FEATURES.some((feature) => feature.key === value);
