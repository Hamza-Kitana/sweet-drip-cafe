using Microsoft.AspNetCore.Mvc;
using SweetDrip.Api.Services;

namespace SweetDrip.Api.Controllers;

[ApiController]
[Route("api")]
public class CatalogController(CatalogCacheService catalogCache) : ControllerBase
{
    [HttpGet("catalog")]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any, VaryByHeader = "Accept-Encoding")]
    public async Task<IActionResult> GetCatalog(CancellationToken ct)
    {
        var catalog = await catalogCache.GetCatalogAsync(ct);
        Response.Headers.CacheControl = "public, max-age=60, s-maxage=180, stale-while-revalidate=300";
        return Ok(catalog);
    }
}
