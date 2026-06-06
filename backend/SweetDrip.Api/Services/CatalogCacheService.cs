using Microsoft.Extensions.Caching.Memory;
using SweetDrip.Api.DTOs;

namespace SweetDrip.Api.Services;

/// <summary>
/// In-memory catalog cache — avoids hammering SQL when many visitors load the site at once.
/// Invalidated whenever admin changes menu, hero, tax, or offers visibility.
/// </summary>
public class CatalogCacheService(IMemoryCache cache, CatalogMapper mapper, LiveRevisionService revisions)
{
    private const string CacheKey = "catalog:snapshot:v1";
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(3);

    public async Task<CatalogDto> GetCatalogAsync(CancellationToken ct = default)
    {
        if (cache.TryGetValue(CacheKey, out CatalogDto? hit) && hit != null)
            return hit;

        var catalog = await mapper.GetCatalogAsync(ct);
        cache.Set(CacheKey, catalog, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = Ttl,
            Size = 1,
        });
        return catalog;
    }

    public void Invalidate()
    {
        cache.Remove(CacheKey);
        revisions.BumpCatalog();
    }
}
