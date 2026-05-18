using Folio.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Folio.Api.Controllers;

[ApiController]
[Route("auth/onedrive")]
public class AuthController : ControllerBase
{
    private readonly OneDriveFileStorageProvider? _oneDrive;

    public AuthController(IFileStorageProvider storage)
    {
        _oneDrive = storage as OneDriveFileStorageProvider;
    }

    [HttpGet("login")]
    public IActionResult Login()
    {
        if (_oneDrive == null)
            return BadRequest("OneDrive ist nicht als Storage-Provider konfiguriert.");

        var redirectUri = BuildRedirectUri();
        var authUrl = _oneDrive.BuildAuthUrl(redirectUri);
        return Redirect(authUrl);
    }

    [HttpGet("callback")]
    public async Task<ContentResult> Callback([FromQuery] string code, CancellationToken ct)
    {
        if (_oneDrive == null)
            return Content("OneDrive ist nicht konfiguriert.", "text/plain");

        var redirectUri = BuildRedirectUri();
        var (_, _, refreshToken) = await _oneDrive.ExchangeCodeAsync(code, redirectUri, ct);

        var html = $"""
            <!DOCTYPE html>
            <html lang="de">
            <head><meta charset="UTF-8"><title>Folio – Auth erfolgreich</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"/>
            </head>
            <body><main class="container" style="max-width:640px;margin-top:4rem">
              <h2>Authentifizierung erfolgreich</h2>
              <p>Trage diesen Refresh Token als Umgebungsvariable ein und starte den Container neu:</p>
              <pre><code>ONEDRIVE__REFRESHTOKEN={refreshToken}</code></pre>
              <p><small>Danach ist dieser Schritt nicht mehr nötig.</small></p>
            </main></body></html>
            """;

        return Content(html, "text/html");
    }

    private string BuildRedirectUri()
    {
        var req = Request;
        return $"{req.Scheme}://{req.Host}/auth/onedrive/callback";
    }
}
