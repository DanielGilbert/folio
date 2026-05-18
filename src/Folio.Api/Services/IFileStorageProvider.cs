namespace Folio.Api.Services;

public interface IFileStorageProvider
{
    Task<string> ReadAsync(CancellationToken ct = default);
    Task WriteAsync(string content, CancellationToken ct = default);
}
