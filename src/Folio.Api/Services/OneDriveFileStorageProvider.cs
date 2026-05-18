using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Folio.Api.Services;

public class OneDriveFileStorageProvider : IFileStorageProvider
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<OneDriveFileStorageProvider> _logger;
    private readonly SemaphoreSlim _tokenLock = new(1, 1);
    private string _accessToken = "";
    private DateTime _tokenExpiry = DateTime.MinValue;

    public OneDriveFileStorageProvider(IConfiguration config, ILogger<OneDriveFileStorageProvider> logger)
    {
        _config = config;
        _logger = logger;
        _http = new HttpClient();
    }

    public async Task<string> ReadAsync(CancellationToken ct = default)
    {
        var token = await GetAccessTokenAsync(ct);
        var url = BuildFileUrl();
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(ct);
    }

    public async Task WriteAsync(string content, CancellationToken ct = default)
    {
        var token = await GetAccessTokenAsync(ct);
        var url = BuildFileUrl();
        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = new StringContent(content, Encoding.UTF8, "text/plain");
        var response = await _http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
    }

    internal async Task<string> GetAccessTokenAsync(CancellationToken ct = default)
    {
        await _tokenLock.WaitAsync(ct);
        try
        {
            if (DateTime.UtcNow < _tokenExpiry.AddMinutes(-5))
                return _accessToken;

            var refreshToken = _config["OneDrive:RefreshToken"]
                ?? throw new InvalidOperationException("OneDrive:RefreshToken fehlt. Führe /auth/onedrive/login aus.");

            (_accessToken, _tokenExpiry) = await ExchangeRefreshTokenAsync(refreshToken, ct);
            return _accessToken;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    internal async Task<(string AccessToken, DateTime Expiry, string RefreshToken)> ExchangeCodeAsync(string code, string redirectUri, CancellationToken ct = default)
    {
        var form = BuildTokenForm(new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = redirectUri
        });

        return await FetchTokensAsync(form, ct);
    }

    private async Task<(string AccessToken, DateTime Expiry)> ExchangeRefreshTokenAsync(string refreshToken, CancellationToken ct)
    {
        var form = BuildTokenForm(new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["refresh_token"] = refreshToken
        });

        var (accessToken, expiry, newRefreshToken) = await FetchTokensAsync(form, ct);

        if (newRefreshToken != refreshToken)
            _logger.LogWarning("OneDrive Refresh Token hat sich geändert. Aktualisiere ONEDRIVE__REFRESHTOKEN auf: {Token}", newRefreshToken);

        return (accessToken, expiry);
    }

    private async Task<(string AccessToken, DateTime Expiry, string RefreshToken)> FetchTokensAsync(FormUrlEncodedContent form, CancellationToken ct)
    {
        var tenant = _config["OneDrive:Tenant"] ?? "consumers";
        var response = await _http.PostAsync(
            $"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token", form, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        var accessToken = json.GetProperty("access_token").GetString()!;
        var expiresIn = json.GetProperty("expires_in").GetInt32();
        var refreshToken = json.TryGetProperty("refresh_token", out var rt) ? rt.GetString()! : "";

        return (accessToken, DateTime.UtcNow.AddSeconds(expiresIn), refreshToken);
    }

    private FormUrlEncodedContent BuildTokenForm(Dictionary<string, string> extra)
    {
        var clientId = _config["OneDrive:ClientId"]
            ?? throw new InvalidOperationException("OneDrive:ClientId fehlt.");
        var clientSecret = _config["OneDrive:ClientSecret"]
            ?? throw new InvalidOperationException("OneDrive:ClientSecret fehlt.");

        var fields = new Dictionary<string, string>
        {
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret,
            ["scope"] = "Files.ReadWrite offline_access"
        };
        foreach (var kv in extra) fields[kv.Key] = kv.Value;
        return new FormUrlEncodedContent(fields);
    }

    internal string BuildAuthUrl(string redirectUri)
    {
        var clientId = _config["OneDrive:ClientId"]
            ?? throw new InvalidOperationException("OneDrive:ClientId fehlt.");
        var tenant = _config["OneDrive:Tenant"] ?? "consumers";
        var scopes = Uri.EscapeDataString("Files.ReadWrite offline_access");
        var redirect = Uri.EscapeDataString(redirectUri);
        return $"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize" +
               $"?client_id={clientId}&response_type=code&redirect_uri={redirect}&scope={scopes}";
    }

    private string BuildFileUrl()
    {
        var path = _config["OneDrive:FilePath"] ?? "journal.md";
        return $"https://graph.microsoft.com/v1.0/me/drive/root:/{path}:/content";
    }
}
