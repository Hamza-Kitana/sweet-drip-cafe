using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SweetDrip.Api.Data;
using SweetDrip.Api.DTOs;
using SweetDrip.Api.Models;
using SweetDrip.Api.Services;

namespace SweetDrip.Api.Controllers;

[ApiController]
[Route("api/catering")]
public class CateringController(
    SweetDripDbContext db,
    EmailNotificationService email,
    LiveRevisionService revisions,
    ILogger<CateringController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CateringDto>> Create([FromBody] CateringRequestDto body, CancellationToken ct)
    {
        var request = new CateringRequest
        {
            Id = "LO-" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString()[^6..],
            CreatedAt = DateTime.UtcNow,
            Name = body.Name.Trim(),
            Email = body.Email.Trim(),
            Phone = body.Phone.Trim(),
            Guests = body.Guests,
            Date = body.Date,
            Time = body.Time,
            Message = body.Message,
            Status = CateringStatus.New,
        };
        db.CateringRequests.Add(request);
        await db.SaveChangesAsync(ct);
        revisions.BumpAdmin();

        try
        {
            await email.SendCateringRequestAsync(request, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Catering request {RequestId} saved but notification email failed", request.Id);
        }

        return Ok(Map(request));
    }

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<CateringDto[]>> List(CancellationToken ct)
    {
        var rows = await db.CateringRequests.AsNoTracking().OrderByDescending(r => r.CreatedAt).ToListAsync(ct);
        return Ok(rows.Select(Map).ToArray());
    }

    [Authorize]
    [HttpPatch("{id}/status")]
    public async Task<ActionResult<CateringDto>> UpdateStatus(string id, [FromBody] UpdateCateringStatusDto body, CancellationToken ct)
    {
        var row = await db.CateringRequests.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (row == null) return NotFound();
        row.Status = body.Status.ToLowerInvariant() switch
        {
            "contacted" => CateringStatus.Contacted,
            "done" => CateringStatus.Done,
            _ => CateringStatus.New,
        };
        await db.SaveChangesAsync(ct);
        revisions.BumpAdmin();
        return Ok(Map(row));
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        var row = await db.CateringRequests.FindAsync([id], ct);
        if (row == null) return NotFound();
        db.CateringRequests.Remove(row);
        await db.SaveChangesAsync(ct);
        revisions.BumpAdmin();
        return Ok();
    }

    private static CateringDto Map(CateringRequest r) =>
        new(r.Id, r.CreatedAt.ToString("o"), r.Name, r.Email, r.Phone, r.Guests, r.Date, r.Time, r.Message,
            r.Status.ToString().ToLowerInvariant());
}
