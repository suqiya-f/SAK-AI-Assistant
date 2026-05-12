# SAK AI Assistant — Test Credentials

Backend tests self-register unique users per run with the pattern:
- Email: `test_<uuid>@example.com`
- Password: `Test@12345`

No persistent shared test account is required. To create one manually:
```
POST /api/auth/register
{ "name": "Suqiya Demo", "email": "demo@sak.ai", "password": "password123" }
```
