using System.Globalization;
using Microsoft.EntityFrameworkCore;
using SweetDrip.Api.Data;
using SweetDrip.Api.DTOs;
using SweetDrip.Api.Models;

namespace SweetDrip.Api.Services;

public class PricingService(SweetDripDbContext db)
{
    public async Task<(List<OrderItem> Items, decimal Subtotal, decimal TaxRate, decimal Tax, decimal Total)> BuildOrderAsync(
        IEnumerable<CartLineDto> lines,
        decimal tip,
        CancellationToken ct = default)
    {
        var productIds = lines.Select(l => l.ProductId).Distinct().ToList();
        var products = await db.Products.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
        var offers = await db.Offers.Where(o => productIds.Contains(o.Id)).ToDictionaryAsync(o => o.Id, ct);

        var orderItems = new List<OrderItem>();
        decimal subtotal = 0;

        foreach (var line in lines)
        {
            decimal unitPrice;
            if (products.TryGetValue(line.ProductId, out var product))
            {
                unitPrice = product.Price;
                if (!string.IsNullOrWhiteSpace(line.NoteChoice))
                {
                    var match = NoteChoicesParser.Parse(product.NoteChoicesJson)
                        .FirstOrDefault(c => string.Equals(c.Label, line.NoteChoice, StringComparison.OrdinalIgnoreCase));
                    if (match != null)
                        unitPrice += match.ExtraPrice;
                }
            }
            else if (offers.TryGetValue(line.ProductId, out var offer))
                unitPrice = offer.Price;
            else if (line.ProductId.StartsWith("offer:", StringComparison.OrdinalIgnoreCase))
            {
                var offerId = line.ProductId["offer:".Length..];
                if (!offers.TryGetValue(offerId, out var linkedOffer))
                    throw new InvalidOperationException($"Unknown offer: {line.ProductId}");
                unitPrice = linkedOffer.Price;
            }
            else
                throw new InvalidOperationException($"Unknown product: {line.ProductId}");

            var lineTotal = unitPrice * line.Qty;
            subtotal += lineTotal;
            orderItems.Add(new OrderItem
            {
                ProductId = line.ProductId,
                Name = line.Name,
                Price = unitPrice,
                Qty = line.Qty,
                Note = line.Note,
                NoteChoice = line.NoteChoice,
                Image = line.Image,
            });
        }

        subtotal = Math.Round(subtotal, 2);
        tip = Math.Round(Math.Max(0, tip), 2);
        var taxRate = await GetTaxRateAsync(ct);
        var tax = Math.Round(subtotal * (taxRate / 100m), 2);
        var total = Math.Round(subtotal + tax + tip, 2);
        return (orderItems, subtotal, taxRate, tax, total);
    }

    public async Task<decimal> GetTaxRateAsync(CancellationToken ct = default)
    {
        var setting = await db.AppSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Key == "TaxRatePercent", ct);
        if (setting == null || !decimal.TryParse(setting.Value, NumberStyles.Number, CultureInfo.InvariantCulture, out var rate))
            return 10.25m;
        return Math.Clamp(Math.Round(rate, 2), 0, 100);
    }
}
