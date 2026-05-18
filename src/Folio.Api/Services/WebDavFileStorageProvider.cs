using System.Net.Http.Headers;
using System.Text;

namespace Folio.Api.Services;

public class WebDavFileStorageProvider : IFileStorageProvider
{
    private readonly HttpClient _http;
    private readonly string _fileUrl;

    public WebDavFileStorageProvider(IConfiguration config)
    {
        var url = config["WebDav:Url"] ?? throw new InvalidOperationException("WebDav:Url is required");
        var username = config["WebDav:Username"] ?? "";
        var password = config["WebDav:Password"] ?? "";

        _fileUrl = url;

        _http = new HttpClient();
        if (!string.IsNullOrEmpty(username))
        {
            var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{username}:{password}"));
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        }
    }

    public async Task<string> ReadAsync(CancellationToken ct = default)
    {
        var response = await _http.GetAsync(_fileUrl, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(ct);
    }

    public async Task WriteAsync(string content, CancellationToken ct = default)
    {
        var httpContent = new StringContent(content, Encoding.UTF8, "text/plain");
        var request = new HttpRequestMessage(HttpMethod.Put, _fileUrl) { Content = httpContent };
        var response = await _http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
    }
}
