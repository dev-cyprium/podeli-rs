# Deployments

## Production

Vercel project: `httpstef-v2/podeli-rs`. The production domain is `www.podeli.rs`. Production uses the EU Convex deployment `amiable-hawk-248` and Clerk production keys.

## Pull request previews

Every PR branch gets a Vercel preview and a separate Convex preview backend in the `stefan-vg/podeli-rs-eu` project. Convex chooses the backend from the Git branch and injects its URL into `NEXT_PUBLIC_CONVEX_URL` during the build.

Vercel Preview environment variables:

- `CONVEX_DEPLOY_KEY`: a project preview deploy key, never a production or developer deployment key.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`: Clerk development instance keys.

Convex project defaults, scoped only to Preview:

- `CLERK_JWT_ISSUER_DOMAIN`: the matching Clerk development issuer, with the `convex` JWT template enabled.
- `CLERK_SECRET_KEY`: the matching development secret key.
- `DISABLE_EMAILS=true`: prevents preview booking/message emails from being sent.

Vercel build command:

```sh
npx convex deploy --cmd "npm run build" --preview-run plans:initializeDefaults
```

The seed creates required plan configuration idempotently. The preview-run flag is ignored for production. Preview databases start without production users, listings, bookings or outreach contacts. Sign in with a Clerk development account; it is separate from production accounts.

The GitHub Vercel check must finish successfully before promoting changes. View the preview URL from the PR check or Vercel bot comment. A failed earlier build remains in deployment history; a successful latest build replaces the PR check state.

References: [Convex previews](https://docs.convex.dev/production/hosting/vercel#preview-deployments), [Clerk on Vercel](https://clerk.com/docs/guides/development/deployment/vercel).
