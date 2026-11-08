export default async function handler(req, res) {
  const rawSlug = req.query.slug || "";
  const slug = String(rawSlug).trim().split("?")[0].split("/")[0];

  let title = "Catálogo Digital";
  let description = "Explora nuestro catálogo de productos y haz tu pedido directamente por WhatsApp.";
  let logoUrl = "https://app.pegasus-nexus.com/vite.svg";
  const cleanSlug = encodeURIComponent(slug || "");
  const publicCatalogUrl = `https://app.pegasus-nexus.com/c/${cleanSlug}`;

  if (slug) {
    const candidates = [
      `https://sales-system-aptb.onrender.com/api/v1/catalogo/public/${cleanSlug}`,
      `https://app.pegasus-nexus.com/api/v1/catalogo/public/${cleanSlug}`,
    ];

    const configuredApiUrl = process.env.VITE_API_URL || process.env.BACKEND_API_URL;
    if (configuredApiUrl) {
      candidates.unshift(`${configuredApiUrl.replace(/\/+$/, "")}/catalogo/public/${cleanSlug}`);
    }

    for (const url of candidates) {
      try {
        const apiRes = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        });

        const contentType = apiRes.headers.get("content-type") || "";
        if (apiRes.ok && contentType.includes("application/json")) {
          const data = await apiRes.json();
          if (data && data.config) {
            if (data.config.business_name) {
              title = data.config.business_name;
            }
            if (data.config.description) {
              description = data.config.description;
            } else {
              description = `Catálogo digital de ${title}. Explora los productos disponibles y realiza tu pedido en línea por WhatsApp.`;
            }
            if (data.config.logo_url) {
              logoUrl = data.config.logo_url;
            } else if (data.config.banner_url) {
              logoUrl = data.config.banner_url;
            }
            break;
          }
        }
      } catch {
        // Fallback to next endpoint or default branding
      }
    }
  }

  // Ensure logo is absolute HTTPS
  if (logoUrl.startsWith("/")) {
    logoUrl = `https://app.pegasus-nexus.com${logoUrl}`;
  } else if (logoUrl.startsWith("http://")) {
    logoUrl = logoUrl.replace("http://", "https://");
  }

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeLogo = escapeHtml(logoUrl);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} | Catálogo Digital</title>
  <meta name="description" content="${safeDesc}">

  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${safeTitle}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:url" content="${publicCatalogUrl}">
  <meta property="og:image" content="${safeLogo}">
  <meta property="og:image:secure_url" content="${safeLogo}">
  <meta property="og:image:alt" content="${safeTitle}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeLogo}">

  <!-- Canonical link -->
  <link rel="canonical" href="${publicCatalogUrl}">

  <!-- Redirection for regular browsers that hit this endpoint -->
  <meta http-equiv="refresh" content="0; url=${publicCatalogUrl}">
  <script>window.location.replace("${publicCatalogUrl}");</script>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; padding: 2rem; text-align: center; background: #0a0a0a; color: #fff;">
  <h1>${safeTitle}</h1>
  <p>${safeDesc}</p>
  <p><a href="${publicCatalogUrl}" style="color: #6366f1;">Abrir Catálogo</a></p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=86400");
  return res.status(200).send(html);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
