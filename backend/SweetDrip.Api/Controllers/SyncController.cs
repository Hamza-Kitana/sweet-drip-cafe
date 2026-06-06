using Microsoft.AspNetCore.Mvc;
using SweetDrip.Api.Services;

namespace SweetDrip.Api.Controllers;

[ApiController]
[Route("api/sync")]
public class SyncController(LiveRevisionService revisions) : ControllerBase
{
    [HttpGet("revision")]
    public IActionResult GetRevision()
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(new
        {
            catalogRevision = revisions.CatalogRevision,
            adminRevision = revisions.AdminRevision,
        });
    }
}
