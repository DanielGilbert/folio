using Folio.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Folio.Api.Controllers;

[Route("auth/login")]
public class LoginController : ControllerBase
{
    private readonly IConfiguration _config;

    public LoginController(IConfiguration config)
    {
        _config = config;
    }

    [HttpGet]
    public ContentResult LoginPage([FromQuery] bool error = false)
    {
        var html = $$"""
            <!DOCTYPE html>
            <html lang="de">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>Folio – Anmelden</title>
              <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"/>
            </head>
            <body>
              <main class="container" style="max-width:360px;margin-top:6rem">
                <h2>Folio</h2>
                {{(error ? "<p style=\"color:var(--pico-del-color)\">Falsches Passwort.</p>" : "")}}
                <form method="post">
                  <label>Passwort<input type="password" name="password" autofocus /></label>
                  <button type="submit">Anmelden</button>
                </form>
              </main>
            </body>
            </html>
            """;
        return Content(html, "text/html");
    }

    [HttpPost]
    public IActionResult DoLogin([FromForm] string password)
    {
        var configured = _config["Auth:Password"];
        if (string.IsNullOrEmpty(configured) || password == configured)
        {
            Response.Cookies.Append("folio_session", AuthMiddleware.Hash(configured ?? ""), new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(90)
            });
            return Redirect("/");
        }
        return Redirect("/auth/login?error=true");
    }

    [HttpGet("/auth/logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("folio_session");
        return Redirect("/auth/login");
    }
}
