using Folio.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddTransient<AuthMiddleware>();

var storageType = builder.Configuration["Storage:Type"] ?? "webdav";
if (storageType.Equals("onedrive", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddSingleton<IFileStorageProvider, OneDriveFileStorageProvider>();
else if (storageType.Equals("local", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddSingleton<IFileStorageProvider, LocalFileStorageProvider>();
else
    builder.Services.AddSingleton<IFileStorageProvider, WebDavFileStorageProvider>();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseMiddleware<AuthMiddleware>();
app.MapControllers();

app.Run();
