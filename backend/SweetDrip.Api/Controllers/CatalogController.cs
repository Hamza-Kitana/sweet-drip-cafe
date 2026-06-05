using Microsoft.AspNetCore.Mvc;
using SweetDrip.Api.Services;

namespace SweetDrip.Api.Controllers;

[ApiController]
[Route("api")]
public class CatalogController(CatalogMapper mapper) : ControllerBase
{
    [HttpGet("catalog")]
    public async Task<IActionResult> GetCatalog(CancellationToken ct) =>
        Ok(await mapper.GetCatalogAsync(ct));
}
