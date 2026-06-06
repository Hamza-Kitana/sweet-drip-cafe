using System.Text.Json;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using SweetDrip.Api.Data;
using SweetDrip.Api.DTOs;
using SweetDrip.Api.Models;

namespace SweetDrip.Api.Services;

public class CatalogMapper(SweetDripDbContext db)
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task<CatalogDto> GetCatalogAsync(CancellationToken ct = default)
    {
        var categories = await db.Categories.AsNoTracking().OrderBy(c => c.SortOrder).ToListAsync(ct);
        var products = await db.Products.AsNoTracking().ToListAsync(ct);
        var offers = await db.Offers.AsNoTracking().ToListAsync(ct);
        var hero = await db.HeroContents.AsNoTracking().FirstAsync(ct);
        var taxRate = await db.AppSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Key == "TaxRatePercent", ct);
        var offersVisible = await db.AppSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Key == "OffersSectionVisible", ct);

        return new CatalogDto(
            categories.Select(c => new CategoryDto(c.Id, c.Name, c.Image, c.Visible)).ToArray(),
            products.Select(MapProduct).ToArray(),
            offers.Select(MapOffer).ToArray(),
            MapHero(hero),
            decimal.TryParse(taxRate?.Value, NumberStyles.Number, CultureInfo.InvariantCulture, out var tr) ? tr : 10.25m,
            offersVisible?.Value != "false"
        );
    }

    public static ProductDto MapProduct(Product p) =>
        new(p.Id, p.CategoryId, p.Name, p.Description, p.Price, p.Image, p.Notes,
            JsonSerializer.Deserialize<string[]>(p.NoteChoicesJson, JsonOpts) ?? []);

    public static OfferDto MapOffer(Offer o) =>
        new(o.Id, o.Title, o.Description, o.Price, o.Image,
            JsonSerializer.Deserialize<string[]>(o.ProductIdsJson, JsonOpts),
            o.StartAt?.ToString("o"), o.EndAt?.ToString("o"), o.Active);

    public static HeroDto MapHero(HeroContent h) =>
        new(h.Tagline, h.Image,
            JsonSerializer.Deserialize<string[]>(h.FloatingImagesJson, JsonOpts) ?? [],
            h.AboutImage,
            JsonSerializer.Deserialize<BackgroundSlideDto[]>(h.BackgroundSlidesJson, JsonOpts) ?? [],
            h.HeroBadge, h.HeroTitleBefore, h.HeroTitleAccent, h.HeroTitleAfter);

    public static OrderDto MapOrder(Order o) =>
        new(o.Id, o.CreatedAt.ToString("o"),
            o.Items.Select(i => new OrderItemDto(i.ProductId, i.Name, i.Price, i.Qty, i.Note, i.NoteChoice, i.Image)).ToArray(),
            new OrderCustomerDto(o.CustomerName, o.CustomerEmail, o.CustomerPhone, o.PickupDate, o.PickupTime, o.Message),
            o.Subtotal, o.Tip, o.Tax, o.TaxRate, o.Total,
            MapOrderStatusForClient(o.Status),
            o.PaymentStatus switch
            {
                PaymentStatus.Pending => "pending",
                PaymentStatus.Paid => "paid",
                PaymentStatus.Failed => "failed",
                _ => "pending",
            },
            o.PaymentFailureReason, o.StripePaymentIntentId);

    public static string MapOrderStatusForClient(OrderStatus status) => status switch
    {
        OrderStatus.AwaitingPayment => "awaiting_payment",
        OrderStatus.New => "new",
        OrderStatus.Preparing => "preparing",
        OrderStatus.Ready => "ready",
        OrderStatus.Done => "done",
        OrderStatus.Cancelled => "cancelled",
        _ => "new",
    };
}
