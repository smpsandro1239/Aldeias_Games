"use client";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline-variant/10 bg-background/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl font-bold text-accent">Aldeias Games API</h1>
            <p className="text-xs text-muted-foreground">Documentacao interativa — OpenAPI 3.0</p>
          </div>
          <a
            href="/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Descarregar OpenAPI JSON
          </a>
        </div>
      </header>
      <div id="swagger-ui" />
      <script
        src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"
        charSet="UTF-8"
        onLoad={() => {
          // @ts-expect-error — SwaggerUIBundle is loaded from CDN
          if (typeof window !== "undefined" && window.SwaggerUIBundle) {
            // @ts-expect-error — SwaggerUIBundle loaded from CDN
            window.SwaggerUIBundle({
              url: "/openapi.json",
              dom_id: "#swagger-ui",
              deepLinking: true,
              docExpansion: "list",
              defaultModelsExpandDepth: 0,
              tryItOutEnabled: false,
              presets: [
                // @ts-expect-error — SwaggerUIBundle presets loaded from CDN
                window.SwaggerUIBundle.presets.apis,
                // @ts-expect-error — SwaggerUIBundle presets loaded from CDN
                window.SwaggerUIBundle.SwaggerUIStandalonePreset,
              ],
              layout: "BaseLayout",
            });
          }
        }}
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css"
      />
    </div>
  );
}
