using System.IO.Compression;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SweetDrip.Api.Data;
using SweetDrip.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 52_428_800;
    options.Limits.MaxConcurrentConnections = 2000;
    options.Limits.MaxConcurrentUpgradedConnections = 2000;
});

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 52_428_800;
});

builder.Services.AddDbContextPool<SweetDripDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 64;
});

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(["application/json"]);
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

builder.Services.AddResponseCaching();

builder.Services.AddSingleton<LiveRevisionService>();
builder.Services.AddScoped<PricingService>();
builder.Services.AddScoped<CatalogMapper>();
builder.Services.AddScoped<CatalogCacheService>();
builder.Services.AddScoped<SiteImageService>();
builder.Services.AddScoped<EmailNotificationService>();
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddSingleton<StripePaymentService>();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "SweetDrip-Dev-Key-Change-In-Production-32chars!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "SweetDrip",
            ValidAudience = builder.Configuration["Jwt:Issuer"] ?? "SweetDrip",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var configuredOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ??
                                ["http://localhost:3000", "https://sweetdrip.cafe", "https://www.sweetdrip.cafe"];
        var allowedOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var origin in configuredOrigins)
        {
            if (string.IsNullOrWhiteSpace(origin)) continue;
            allowedOrigins.Add(NormalizeCorsOrigin(origin));
        }

        policy.SetIsOriginAllowed(origin =>
                !string.IsNullOrWhiteSpace(origin) && allowedOrigins.Contains(NormalizeCorsOrigin(origin)))
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

static string NormalizeCorsOrigin(string origin) =>
    origin.Trim().TrimEnd('/');

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SweetDripDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    try
    {
        await DbSeeder.SeedAsync(db);
        await DbSeeder.EnsureSiteImagesTableAsync(db);
        await DbSeeder.EnsureOrderItemSelectedOptionsColumnAsync(db);
        var images = scope.ServiceProvider.GetRequiredService<SiteImageService>();
        var migrated = await images.MigrateEmbeddedImagesAsync(CancellationToken.None);
        if (migrated > 0)
        {
            scope.ServiceProvider.GetRequiredService<CatalogCacheService>().Invalidate();
            logger.LogInformation("Migrated {Count} embedded site image(s) into the database.", migrated);
        }
    }
    catch (SqlException ex)
    {
        logger.LogCritical(ex,
            "Cannot connect to SQL Server. Install SQL Server Express LocalDB or update ConnectionStrings:DefaultConnection in appsettings.json.");
        throw;
    }
}

app.UseResponseCompression();
app.UseResponseCaching();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.Run();
