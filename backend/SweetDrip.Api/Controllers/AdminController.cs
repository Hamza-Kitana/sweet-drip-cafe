using System.Globalization;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SweetDrip.Api.Data;
using SweetDrip.Api.DTOs;
using SweetDrip.Api.Models;
using SweetDrip.Api.Services;

namespace SweetDrip.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/admin")]
public class AdminController(SweetDripDbContext db, CatalogCacheService catalogCache, SiteImageService siteImages) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private void InvalidateCatalogCache() => catalogCache.Invalidate();

    [HttpGet("overview")]
    public async Task<ActionResult<OverviewStatsDto>> Overview(CancellationToken ct)
    {
        var paidQuery = db.Orders.AsNoTracking().Where(o => o.PaymentStatus == PaymentStatus.Paid);
        var revenue = await paidQuery.SumAsync(o => o.Total, ct);
        var count = await paidQuery.CountAsync(ct);
        var newCount = await paidQuery.CountAsync(o => o.Status == OrderStatus.New, ct);
        var unpaid = await db.Orders.CountAsync(o => o.PaymentStatus != PaymentStatus.Paid, ct);
        var avg = count > 0 ? Math.Round(revenue / count, 2) : 0;
        return Ok(new OverviewStatsDto(revenue, count, newCount, unpaid, avg));
    }

    [HttpGet("settings/tax-rate")]
    public async Task<ActionResult<TaxRateSettingDto>> GetTaxRate(CancellationToken ct)
    {
        return Ok(new TaxRateSettingDto(await ReadTaxRateAsync(ct)));
    }

    [HttpPut("settings/tax-rate")]
    public async Task<ActionResult<TaxRateSettingDto>> SetTaxRate([FromBody] UpdateTaxRateDto? body, CancellationToken ct)
    {
        if (body == null) return BadRequest(new { error = "Tax rate is required" });

        var rate = Math.Clamp(Math.Round(body.TaxRatePercent, 2), 0, 100);
        await UpsertSetting(
            "TaxRatePercent",
            rate.ToString("0.##", CultureInfo.InvariantCulture),
            ct);
        InvalidateCatalogCache();
        return Ok(new TaxRateSettingDto(rate));
    }

    [HttpPut("settings/offers-visible")]
    public async Task<IActionResult> SetOffersVisible([FromBody] UpdateOffersVisibilityDto body, CancellationToken ct)
    {
        await UpsertSetting("OffersSectionVisible", body.Visible ? "true" : "false", ct);
        InvalidateCatalogCache();
        return Ok();
    }

    [HttpPut("hero")]
    public async Task<IActionResult> UpdateHero([FromBody] HeroDto body, CancellationToken ct)
    {
        var hero = await db.HeroContents.FirstAsync(ct);
        hero.Tagline = body.Tagline;
        hero.Image = body.Image;
        hero.AboutImage = body.AboutImage;
        hero.FloatingImagesJson = JsonSerializer.Serialize(body.FloatingImages, JsonOpts);
        hero.BackgroundSlidesJson = JsonSerializer.Serialize(body.BackgroundSlides, JsonOpts);
        hero.HeroBadge = body.HeroBadge;
        hero.HeroTitleBefore = body.HeroTitleBefore;
        hero.HeroTitleAccent = body.HeroTitleAccent;
        hero.HeroTitleAfter = body.HeroTitleAfter;
        await db.SaveChangesAsync(ct);
        InvalidateCatalogCache();
        return Ok();
    }

    [HttpPost("media")]
    public async Task<ActionResult<MediaUploadDto>> UploadMedia([FromBody] UploadMediaDto body, CancellationToken ct)
    {
        if (body == null || string.IsNullOrWhiteSpace(body.DataUrl))
            return BadRequest(new { error = "Image data is required" });

        try
        {
            var (id, url) = await siteImages.SaveDataUrlAsync(body.DataUrl, body.FileName, ct);
            return Ok(new MediaUploadDto(id, url));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("media/upload")]
    [RequestFormLimits(MultipartBodyLengthLimit = 52_428_800)]
    public async Task<ActionResult<MediaUploadDto>> UploadMediaFile(IFormFile? file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "Image file is required" });

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Please choose an image file (JPG, PNG, WebP…)" });

        try
        {
            await using var stream = file.OpenReadStream();
            using var ms = new MemoryStream();
            await stream.CopyToAsync(ms, ct);
            var (id, url) = await siteImages.SaveBytesAsync(ms.ToArray(), file.ContentType, file.FileName, ct);
            return Ok(new MediaUploadDto(id, url));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("media/{id}")]
    public async Task<IActionResult> DeleteMedia(string id, CancellationToken ct)
    {
        if (!await siteImages.DeleteAsync(id, ct)) return NotFound();
        return Ok();
    }

    [HttpPost("categories")]
    public async Task<ActionResult<CategoryDto>> AddCategory([FromBody] CategoryDto body, CancellationToken ct)
    {
        var id = string.IsNullOrWhiteSpace(body.Id) ? "cat-" + Guid.NewGuid().ToString("N")[..8] : body.Id;
        var row = new Category { Id = id, Name = body.Name, Image = body.Image, Visible = body.Visible };
        db.Categories.Add(row);
        await db.SaveChangesAsync(ct);
        InvalidateCatalogCache();
        return Ok(new CategoryDto(row.Id, row.Name, row.Image, row.Visible));
    }

    [HttpPut("categories/{id}")]
    public async Task<IActionResult> UpdateCategory(string id, [FromBody] CategoryDto body, CancellationToken ct)
    {
        var row = await db.Categories.FindAsync([id], ct);
        if (row == null) return NotFound();
        row.Name = body.Name;
        row.Image = body.Image;
        row.Visible = body.Visible;
        await db.SaveChangesAsync(ct);
        InvalidateCatalogCache();
        return Ok();
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(string id, CancellationToken ct)
    {
        var row = await db.Categories.FindAsync([id], ct);
        if (row == null) return NotFound();
        db.Categories.Remove(row);
        await db.SaveChangesAsync(ct);
        InvalidateCatalogCache();
        return Ok();
    }

    [HttpPost("products")]
    public async Task<ActionResult<ProductDto>> AddProduct([FromBody] ProductDto body, CancellationToken ct)
    {
        var id = string.IsNullOrWhiteSpace(body.Id) ? "p-" + Guid.NewGuid().ToString("N")[..8] : body.Id;
        var row = new Product
        {
            Id = id,
            CategoryId = body.CategoryId,
            Name = body.Name,
            Description = body.Description,
            Price = body.Price,
            Image = body.Image,
            Notes = body.OptionGroups?.FirstOrDefault()?.Label ?? body.Notes ?? "",
            NoteChoicesJson = JsonSerializer.Serialize(body.OptionGroups ?? [], JsonOpts),
        };
        db.Products.Add(row);
        await db.SaveChangesAsync(ct);
        InvalidateCatalogCache();
        return Ok(CatalogMapper.MapProduct(row));
    }

    [HttpPut("products/{id}")]
    public async Task<IActionResult> UpdateProduct(string id, [FromBody] ProductDto body, CancellationToken ct)
    {
        var row = await db.Products.FindAsync([id], ct);
        if (row == null) return NotFound();
        row.CategoryId = body.CategoryId;
        row.Name = body.Name;
        row.Description = body.Description;
        row.Price = body.Price;
        row.Image = body.Image;
        row.Notes = body.Notes;
        row.NoteChoicesJson = JsonSerializer.Serialize(body.OptionGroups ?? [], JsonOpts);
        row.Notes = body.OptionGroups?.FirstOrDefault()?.Label ?? body.Notes ?? "";
        await db.SaveChangesAsync(ct);
        InvalidateCatalogCache();
        return Ok();
    }

    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(string id, CancellationToken ct)
    {
        var row = await db.Products.FindAsync([id], ct);
        if (row == null) return NotFound();
        db.Products.Remove(row);
        await db.SaveChangesAsync(ct);
        InvalidateCatalogCache();
        return Ok();
    }

    [HttpPost("offers")]
    public async Task<ActionResult<OfferDto>> AddOffer([FromBody] OfferDto body, CancellationToken ct)
    {
        if (!TryParseOptionalDate(body.StartAt, out var startAt, out var dateError)
            || !TryParseOptionalDate(body.EndAt, out var endAt, out dateError))
            return BadRequest(new { error = dateError });

        var id = string.IsNullOrWhiteSpace(body.Id) ? "o-" + Guid.NewGuid().ToString("N")[..8] : body.Id;
        var row = new Offer
        {
            Id = id,
            Title = body.Title,
            Description = body.Description,
            Price = body.Price,
            Image = body.Image,
            ProductIdsJson = JsonSerializer.Serialize(body.ProductIds ?? [], JsonOpts),
            StartAt = startAt,
            EndAt = endAt,
            Active = body.Active,
        };
        db.Offers.Add(row);
        await db.SaveChangesAsync(ct);
        InvalidateCatalogCache();
        return Ok(CatalogMapper.MapOffer(row));
    }

    [HttpPut("offers/{id}")]
    public async Task<ActionResult<OfferDto>> UpdateOffer(string id, [FromBody] OfferDto body, CancellationToken ct)
    {
        var row = await db.Offers.FindAsync([id], ct);
        if (row == null) return NotFound();

        if (!TryParseOptionalDate(body.StartAt, out var startAt, out var dateError)
            || !TryParseOptionalDate(body.EndAt, out var endAt, out dateError))
            return BadRequest(new { error = dateError });

        row.Title = body.Title;
        row.Description = body.Description;
        row.Price = body.Price;
        row.Image = body.Image;
        row.ProductIdsJson = JsonSerializer.Serialize(body.ProductIds ?? [], JsonOpts);
        row.StartAt = startAt;
        row.EndAt = endAt;
        row.Active = body.Active;
        await db.SaveChangesAsync(ct);
        InvalidateCatalogCache();
        return Ok(CatalogMapper.MapOffer(row));
    }

    [HttpDelete("offers/{id}")]
    public async Task<IActionResult> DeleteOffer(string id, CancellationToken ct)
    {
        var row = await db.Offers.FindAsync([id], ct);
        if (row == null) return NotFound();
        db.Offers.Remove(row);
        await db.SaveChangesAsync(ct);
        InvalidateCatalogCache();
        return Ok();
    }

    private async Task UpsertSetting(string key, string value, CancellationToken ct)
    {
        var row = await db.AppSettings.FirstOrDefaultAsync(s => s.Key == key, ct);
        if (row == null) db.AppSettings.Add(new AppSetting { Key = key, Value = value });
        else row.Value = value;
        await db.SaveChangesAsync(ct);
    }

    private async Task<decimal> ReadTaxRateAsync(CancellationToken ct)
    {
        var row = await db.AppSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Key == "TaxRatePercent", ct);
        if (row == null || !decimal.TryParse(row.Value, NumberStyles.Number, CultureInfo.InvariantCulture, out var rate))
            return 10.25m;
        return Math.Clamp(Math.Round(rate, 2), 0, 100);
    }

    private static bool TryParseOptionalDate(string? value, out DateTime? parsed, out string error)
    {
        parsed = null;
        error = "";
        if (string.IsNullOrWhiteSpace(value)) return true;

        if (DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var dt)
            || DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out dt))
        {
            parsed = dt;
            return true;
        }

        error = "Invalid start/end date — check the schedule fields.";
        return false;
    }
}
