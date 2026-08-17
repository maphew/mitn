Tested this PR headless against a live Keycloak (35s access-token lifespan, refresh-token rotation on: revokeRefreshToken=true, maxReuse=0), using the IdP event log as ground truth.

What works, verified live:

- Expired token is refreshed in place; session survives (single REFRESH_TOKEN event per expiry).
- Rotation is handled correctly: the new refresh token is stored and the next cycle succeeds; coalesced requests receive the rotated tokens too.
- 8 parallel requests at expiry produce exactly one refresh; all return 200.
- Revoked refresh token fails gracefully: 401 plus re-login redirect in 22ms, no 500 or hang.
- IdP outage: request stalls oauthHttpTimeout (30s) once, then continues on the expired token; session survives.

Two findings maintainers may want to weigh:

1. Near-miss race: a request carrying the stale cookie that arrives just after the coalesced refresh completes (40ms later in my test) replays the consumed refresh token, hits invalid_grant, and force-logs-out the whole session; Keycloak reuse detection also revokes the fresh tokens. The in-flight map entry is cleared when the token call resolves, not when the initiator's Set-Cookie reaches the client, so the window is response-latency wide. Main never kills a session, so this is a new, though narrow, failure mode.

2. The "no refresh token without offline_access, so this is a no-op" assumption does not hold for Keycloak-family providers: they issue a session-bound refresh token on the default scope, the middleware refreshes with it, and once the SSO idle timeout (default 30 min) lapses the session is forced to re-auth, where current main kept its 21-day local session. Arguably correct SSO behavior, but worth documenting.

Also: base is 3166 commits behind main and conflicting; PR 10348 touches open_id.ts too.

_claude-fable-5-high on behalf of matt wilkie_
