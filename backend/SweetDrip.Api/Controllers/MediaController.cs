using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCaching;
using SweetDrip.Api.Services;

namespace SweetDrip.Api.Controllers;

[ApiController]
[Route("api/media")]
public class MediaController(SiteImageService images) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("{id}")]
    [ResponseCache(Duration = 31536000, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> Get(string id, CancellationToken ct)
    {
        var row = await images.GetAsync(id, ct);
        if (row == null) return NotFound();
        return File(row.Data, row.ContentType, enableRangeProcessing: true);
    }
}
