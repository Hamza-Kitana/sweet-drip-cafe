using Microsoft.AspNetCore.Mvc;
using SweetDrip.Api.Services;

namespace SweetDrip.Api.Controllers;

[ApiController]
[Route("api")]
public class CatalogController(CatalogCacheService catalogCache) : ControllerBase
{
    [HttpGet("catalog")]
    public async Task<IActionResult> GetCatalog(CancellationToken ct)
    {
        var catalog = await catalogCache.GetCatalogAsync(ct);
        Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
        Response.Headers.Pragma = "no-cache";
        return Ok(catalog);
    }
}
