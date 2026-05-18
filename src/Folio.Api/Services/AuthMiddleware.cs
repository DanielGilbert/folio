using System.Security.Cryptography;
using System.Text;

namespace Folio.Api.Services;

public class AuthMiddleware : IMiddleware
{
    private readonly string? _passwordHash;

    public AuthMiddleware(IConfiguration config)
    {
        var pw = config["Auth:Password"];
        _passwordHash = string.IsNullOrEmpty(pw) ? null : Hash(pw);
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        if (_passwordHash == null)
        {
            await next(context);
            return;
        }

        if (context.Request.Path.StartsWithSegments("/auth/login"))
        {
            await next(context);
            return;
        }

        if (context.Request.Cookies.TryGetValue("folio_session", out var token) && token == _passwordHash)
        {
            await next(context);
            return;
        }

        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = 401;
            return;
        }

        context.Response.Redirect("/auth/login");
    }

    public static string Hash(string password) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(password)));
}
