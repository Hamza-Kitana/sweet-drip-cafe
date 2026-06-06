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
public class AdminController(SweetDripDbContext db) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    [HttpGet("overview")]
    public async Task<ActionResult<OverviewStatsDto>> Overview(CancellationToken ct)
    {
        var paid = await db.Orders.AsNoTracking().Where(o => o.PaymentStatus == PaymentStatus.Paid).ToListAsync(ct);
        var revenue = paid.Sum(o => o.Total);
        var count = paid.Count;
        var newCount = paid.Count(o => o.Status == OrderStatus.New);
        var unpaid = await db.Orders.CountAsync(o => o.PaymentStatus != PaymentStatus.Paid, ct);
        var avg = count > 0 ? Math.Round(revenue / count, 2) : 0;
        return Ok(new OverviewStatsDto(revenue, count, newCount, unpaid, avg));
    }

    [HttpPut("settings/tax-rate")]
    public async Task<IActionResult> SetTaxRate([FromBody] UpdateTaxRateDto body, CancellationToken ct)
    {
        await UpsertSetting("TaxRatePercent", Math.Clamp(body.TaxRatePercent, 0, 100).ToString("0.##"), ct);
        return Ok();
    }

    [HttpPut("settings/offers-visible")]
    public async Task<IActionResult> SetOffersVisible([FromBody] UpdateOffersVisibilityDto body, CancellationToken ct)
    {
        await UpsertSetting("OffersSectionVisible", body.Visible ? "true" : "false", ct);
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
        return Ok();
    }

    [HttpPost("categories")]
    public async Task<ActionResult<CategoryDto>> AddCategory([FromBody] CategoryDto body, CancellationToken ct)
    {
        var id = string.IsNullOrWhiteSpace(body.Id) ? "cat-" + Guid.NewGuid().ToString("N")[..8] : body.Id;
        var row = new Category { Id = id, Name = body.Name, Image = body.Image, Visible = body.Visible };
        db.Categories.Add(row);
        await db.SaveChangesAsync(ct);
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
        return Ok();
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(string id, CancellationToken ct)
    {
        var row = await db.Categories.FindAsync([id], ct);
        if (row == null) return NotFound();
        db.Categories.Remove(row);
        await db.SaveChangesAsync(ct);
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
            Notes = body.Notes,
            NoteChoicesJson = JsonSerializer.Serialize(body.NoteChoices ?? [], JsonOpts),
        };
        db.Products.Add(row);
        await db.SaveChangesAsync(ct);
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
        row.NoteChoicesJson = JsonSerializer.Serialize(body.NoteChoices ?? [], JsonOpts);
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(string id, CancellationToken ct)
    {
        var row = await db.Products.FindAsync([id], ct);
        if (row == null) return NotFound();
        db.Products.Remove(row);
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpPost("offers")]
    public async Task<ActionResult<OfferDto>> AddOffer([FromBody] OfferDto body, CancellationToken ct)
    {
        var id = string.IsNullOrWhiteSpace(body.Id) ? "o-" + Guid.NewGuid().ToString("N")[..8] : body.Id;
        var row = new Offer
        {
            Id = id,
            Title = body.Title,
            Description = body.Description,
            Price = body.Price,
            Image = body.Image,
            ProductIdsJson = JsonSerializer.Serialize(body.ProductIds ?? [], JsonOpts),
            StartAt = string.IsNullOrEmpty(body.StartAt) ? null : DateTime.Parse(body.StartAt),
            EndAt = string.IsNullOrEmpty(body.EndAt) ? null : DateTime.Parse(body.EndAt),
            Active = body.Active,
        };
        db.Offers.Add(row);
        await db.SaveChangesAsync(ct);
        return Ok(CatalogMapper.MapOffer(row));
    }

    [HttpPut("offers/{id}")]
    public async Task<IActionResult> UpdateOffer(string id, [FromBody] OfferDto body, CancellationToken ct)
    {
        var row = await db.Offers.FindAsync([id], ct);
        if (row == null) return NotFound();
        row.Title = body.Title;
        row.Description = body.Description;
        row.Price = body.Price;
        row.Image = body.Image;
        row.ProductIdsJson = JsonSerializer.Serialize(body.ProductIds ?? [], JsonOpts);
        row.StartAt = string.IsNullOrEmpty(body.StartAt) ? null : DateTime.Parse(body.StartAt);
        row.EndAt = string.IsNullOrEmpty(body.EndAt) ? null : DateTime.Parse(body.EndAt);
        row.Active = body.Active;
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpDelete("offers/{id}")]
    public async Task<IActionResult> DeleteOffer(string id, CancellationToken ct)
    {
        var row = await db.Offers.FindAsync([id], ct);
        if (row == null) return NotFound();
        db.Offers.Remove(row);
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    private async Task UpsertSetting(string key, string value, CancellationToken ct)
    {
        var row = await db.AppSettings.FirstOrDefaultAsync(s => s.Key == key, ct);
        if (row == null) db.AppSettings.Add(new AppSetting { Key = key, Value = value });
        else row.Value = value;
        await db.SaveChangesAsync(ct);
    }
}
