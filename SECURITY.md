# Security Policy

## Supported Versions

Security fixes target the latest release of itchlib.

## Reporting a Vulnerability

Please report security vulnerabilities through GitHub's private vulnerability reporting feature, if enabled. Avoid disclosing vulnerabilities in public issues.

Never include API keys, access tokens, purchase keys, cookies, or private download URLs in public reports or logs. If credentials have been exposed, revoke or rotate them before sharing diagnostics.

## Credential Handling

Authenticated API requests send bearer tokens only to `https://api.itch.io`. itchlib does not intentionally log credentials or response bodies.
