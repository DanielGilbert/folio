namespace Folio.Api.Services;

public class LocalFileStorageProvider : IFileStorageProvider
{
    private readonly string _path;

    public LocalFileStorageProvider(IConfiguration config)
    {
        _path = config["Local:FilePath"]
            ?? throw new InvalidOperationException("Local:FilePath fehlt.");
    }

    public Task<string> ReadAsync(CancellationToken ct = default) =>
        File.ReadAllTextAsync(_path, ct);

    public Task WriteAsync(string content, CancellationToken ct = default) =>
        File.WriteAllTextAsync(_path, content, ct);
}
