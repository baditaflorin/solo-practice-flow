# Deployment

Live app: https://baditaflorin.github.io/solo-practice-flow/

Repository: https://github.com/baditaflorin/solo-practice-flow

## Publishing

GitHub Pages serves the `main` branch from `/docs`.

```bash
make test
make build
make smoke
git add .
git commit -m "feat: describe change"
git push
```

## Rollback

Revert the publishing commit and push `main`.

```bash
git revert <commit>
git push
```

## Custom Domain

No custom domain is configured in v1. To add one, create `docs/CNAME` with the full domain and configure the DNS records GitHub Pages requires:

https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## Pages Gotchas

The app uses `base: "/solo-practice-flow/"`. GitHub Pages does not support `_headers` or `_redirects`, so the build copies `index.html` to `404.html` for client-side fallback.
