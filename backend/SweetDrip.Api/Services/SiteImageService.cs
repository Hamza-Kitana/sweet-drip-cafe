using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SweetDrip.Api.Data;
using SweetDrip.Api.Models;

namespace SweetDrip.Api.Services;

public partial class SiteImageService(SweetDripDbContext db, IConfiguration config)
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public string PublicBaseUrl =>
        (config["Media:PublicBaseUrl"] ?? config["PublicApiUrl"] ?? "").TrimEnd('/');

    public string BuildPublicUrl(string id)
    {
        var path = $"/api/media/{id}";
        return string.IsNullOrEmpty(PublicBaseUrl) ? path : $"{PublicBaseUrl}{path}";
    }

    public static bool IsManagedMediaUrl(string? value, string? publicBaseUrl = null)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        if (value.Contains("/api/media/", StringComparison.OrdinalIgnoreCase)) return true;
        if (!string.IsNullOrEmpty(publicBaseUrl))
            return value.StartsWith(publicBaseUrl.TrimEnd('/') + "/api/media/", StringComparison.OrdinalIgnoreCase);
        return false;
    }

    public static string? ExtractMediaId(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var match = MediaIdRegex().Match(value);
        return match.Success ? match.Groups["id"].Value : null;
    }

    public async Task<(string Id, string Url)> SaveDataUrlAsync(string dataUrl, string? fileName, CancellationToken ct)
    {
        if (!TryParseDataUrl(dataUrl, out var contentType, out var bytes))
            throw new InvalidOperationException("Invalid image data");

        var id = Guid.NewGuid().ToString("N")[..12];
        var safeName = SanitizeFileName(fileName, contentType);
        db.SiteImages.Add(new SiteImage
        {
            Id = id,
            FileName = safeName,
            ContentType = contentType,
            Data = bytes,
            CreatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync(ct);
        return (id, BuildPublicUrl(id));
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        var row = await db.SiteImages.FindAsync([id], ct);
        if (row == null) return false;
        db.SiteImages.Remove(row);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<SiteImage?> GetAsync(string id, CancellationToken ct) =>
        await db.SiteImages.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);

    public async Task<int> MigrateEmbeddedImagesAsync(CancellationToken ct)
    {
        var changed = 0;
        var cache = new Dictionary<string, string>(StringComparer.Ordinal);

        async Task<string?> MigrateValueAsync(string? value, string label)
        {
            if (string.IsNullOrWhiteSpace(value)) return value;
            if (!value.StartsWith("data:image", StringComparison.OrdinalIgnoreCase)) return value;
            if (cache.TryGetValue(value, out var cachedUrl)) return cachedUrl;
            var (_, url) = await SaveDataUrlAsync(value, label, ct);
            cache[value] = url;
            changed++;
            return url;
        }

        foreach (var category in await db.Categories.ToListAsync(ct))
        {
            var next = await MigrateValueAsync(category.Image, $"category-{category.Id}");
            if (next != category.Image) category.Image = next ?? "";
        }

        foreach (var product in await db.Products.ToListAsync(ct))
        {
            var next = await MigrateValueAsync(product.Image, $"product-{product.Id}");
            if (next != product.Image) product.Image = next ?? "";
        }

        foreach (var offer in await db.Offers.ToListAsync(ct))
        {
            var next = await MigrateValueAsync(offer.Image, $"offer-{offer.Id}");
            if (next != offer.Image) offer.Image = next ?? "";
        }

        var hero = await db.HeroContents.FirstOrDefaultAsync(ct);
        if (hero != null)
        {
            hero.Image = await MigrateValueAsync(hero.Image, "hero-main") ?? "";
            hero.AboutImage = await MigrateValueAsync(hero.AboutImage, "hero-about") ?? "";

            var floats = JsonSerializer.Deserialize<string[]>(hero.FloatingImagesJson, JsonOpts) ?? [];
            for (var i = 0; i < floats.Length; i++)
            {
                floats[i] = await MigrateValueAsync(floats[i], $"hero-float-{i + 1}") ?? "";
            }
            hero.FloatingImagesJson = JsonSerializer.Serialize(floats, JsonOpts);

            var slides = JsonSerializer.Deserialize<List<BackgroundSlideModel>>(hero.BackgroundSlidesJson, JsonOpts) ?? [];
            for (var i = 0; i < slides.Count; i++)
            {
                slides[i].Image = await MigrateValueAsync(slides[i].Image, $"hero-slide-{i + 1}") ?? "";
            }
            hero.BackgroundSlidesJson = JsonSerializer.Serialize(slides, JsonOpts);
        }

        if (changed > 0)
            await db.SaveChangesAsync(ct);

        return changed;
    }

    private static string SanitizeFileName(string? fileName, string contentType)
    {
        var baseName = string.IsNullOrWhiteSpace(fileName) ? "image" : Path.GetFileNameWithoutExtension(fileName);
        baseName = InvalidFileCharsRegex().Replace(baseName, "-").Trim('-');
        if (string.IsNullOrWhiteSpace(baseName)) baseName = "image";
        var ext = contentType switch
        {
            "image/png" => ".png",
            "image/webp" => ".webp",
            "image/gif" => ".gif",
            _ => ".jpg",
        };
        return baseName + ext;
    }

    public static bool TryParseDataUrl(string input, out string contentType, out byte[] data)
    {
        contentType = "image/jpeg";
        data = [];
        if (string.IsNullOrWhiteSpace(input) || !input.StartsWith("data:image", StringComparison.OrdinalIgnoreCase))
            return false;

        var comma = input.IndexOf(',');
        if (comma < 0) return false;

        var meta = input[..comma];
        var payload = input[(comma + 1)..];

        var typeMatch = Regex.Match(meta, @"data:(?<type>image/[\w.+-]+)", RegexOptions.IgnoreCase);
        if (typeMatch.Success) contentType = typeMatch.Groups["type"].Value.ToLowerInvariant();

        try
        {
            data = Convert.FromBase64String(payload);
            return data.Length > 0;
        }
        catch
        {
            return false;
        }
    }

    private sealed class BackgroundSlideModel
    {
        public string Image { get; set; } = "";
        public string Caption { get; set; } = "";
    }

    [GeneratedRegex(@"/api/media/(?<id>[a-zA-Z0-9]+)", RegexOptions.IgnoreCase)]
    private static partial Regex MediaIdRegex();

    [GeneratedRegex(@"[^\w\-]+")]
    private static partial Regex InvalidFileCharsRegex();
}
