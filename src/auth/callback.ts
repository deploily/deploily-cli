import http from "http"
import { URL } from "url"
import { AUTH_CONFIG } from "../config/constants.js"
import { CallbackResult } from "../types/index.js"

// Start local HTTP server to listen for OAuth callback
export async function startCallbackServer(
  expectedState: string,
): Promise<CallbackResult> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url) {
        res.writeHead(400)
        res.end("Bad request")
        return
      }

      const url = new URL(
        req.url,
        `http://localhost:${AUTH_CONFIG.CALLBACK_PORT}`,
      )
      const code = url.searchParams.get("code")
      const state = url.searchParams.get("state")
      const error = url.searchParams.get("error")
      const errorDescription = url.searchParams.get("error_description")

      // Handle errors from Keycloak
      if (error) {
        const errorMsg = errorDescription || error
        res.writeHead(400, { "Content-Type": "text/html" })
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authentication Failed</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                max-width: 500px;
                text-align: center;
              }
              h1 { color: #e74c3c; margin-top: 0; }
              p { color: #555; line-height: 1.6; }
              code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Authentication Failed</h1>
              <p>Error: <code>${escapeHtml(errorMsg)}</code></p>
              <p>Please try again with: <code>deploily login</code></p>
            </div>
          </body>
          </html>
        `)
        server.close()
        reject(new Error(`Authentication failed: ${errorMsg}`))
        return
      }

      // Validate callback
      if (!code || !state) {
        res.writeHead(400)
        res.end("Missing code or state parameter")
        server.close()
        reject(new Error("Missing code or state parameter"))
        return
      }

      // Validate state parameter (CSRF protection)
      if (state !== expectedState) {
        res.writeHead(403)
        res.end("Invalid state parameter")
        server.close()
        reject(new Error("State parameter mismatch"))
        return
      }

      // Success response
      res.writeHead(200, { "Content-Type": "text/html" })
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
              max-width: 500px;
              text-align: center;
            }
            h1 { color: #27ae60; margin-top: 0; }
            p { color: #555; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Authentication Successful</h1>
            <p>You have successfully authenticated with Deploily.</p>
            <p>You can close this window and return to your terminal.</p>
          </div>
        </body>
        </html>
      `)

      server.close()
      resolve({ code, state })
    })

    server.listen(AUTH_CONFIG.CALLBACK_PORT, "localhost", () => {
      // Server is listening
    })

    // Set a timeout for the callback
    const timeout = setTimeout(() => {
      server.close()
      reject(new Error("Callback timeout: No response from Keycloak"))
    }, 300000) // 5 minutes

    server.on("close", () => {
      clearTimeout(timeout)
    })
  })
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
