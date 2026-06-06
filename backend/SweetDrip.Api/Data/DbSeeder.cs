using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SweetDrip.Api.Models;

namespace SweetDrip.Api.Data;

public static class DbSeeder
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public static async Task SeedAsync(SweetDripDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        if (!await db.Categories.AnyAsync())
        {
            db.Categories.AddRange(
                new Category { Id = "cakes", Name = "Cakes", Image = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800", SortOrder = 0 },
                new Category { Id = "icecream", Name = "Ice Cream", Image = "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800", SortOrder = 1 },
                new Category { Id = "drinks", Name = "Drinks", Image = "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800", SortOrder = 2 },
                new Category { Id = "pastries", Name = "Pastries", Image = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800", SortOrder = 3 }
            );
        }

        if (!await db.Products.AnyAsync())
        {
            db.Products.AddRange(
                Product("p1", "cakes", "Belgian Chocolate Cake", "Rich layered cake with Belgian chocolate ganache and fresh berries.", 8.5m, "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=900", "Sweetness", ["Regular sugar", "Less sugar", "No sugar"]),
                Product("p2", "cakes", "Pistachio Dream", "Layers of pistachio cream with a hint of rose.", 7.5m, "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=900", "Sweetness", ["Regular", "Less sweet", "Extra sweet"]),
                Product("p3", "icecream", "Triple Scoop Cone", "Three premium scoops in a fresh waffle cone.", 6.0m, "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=900", "Flavors", ["Choco/Vanilla/Pistachio", "Strawberry/Vanilla/Choco", "Surprise me"]),
                Product("p4", "icecream", "Chocolate Sundae", "Vanilla ice cream drowned in warm chocolate sauce.", 5.5m, "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=900", "Toppings", ["With nuts", "Without nuts", "Extra chocolate"]),
                Product("p5", "drinks", "Iced Caramel Latte", "Espresso, milk, caramel and ice. Smooth and sweet.", 4.5m, "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=900", "Sugar", ["Regular", "Less sugar", "No sugar"]),
                Product("p6", "drinks", "Hot Chocolate", "Velvety dark hot chocolate with whipped cream.", 4.0m, "https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=900", "Style", ["Classic", "With marshmallows", "Spicy"]),
                Product("p7", "pastries", "Butter Croissant", "Flaky, golden, perfectly buttery.", 3.5m, "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=900", "Filling", ["Plain", "Chocolate", "Almond"]),
                Product("p8", "pastries", "Cinnamon Roll", "Warm, gooey, swirled with cinnamon glaze.", 4.0m, "https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=900", "Glaze", ["Regular", "Extra glaze", "No glaze"])
            );
        }

        if (!await db.Offers.AnyAsync())
        {
            db.Offers.AddRange(
                new Offer
                {
                    Id = "o1", Title = "Sweet Trio", Description = "1 Cake slice + 1 Drink + 1 Ice cream scoop", Price = 12m,
                    Image = "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=900",
                    ProductIdsJson = JsonSerializer.Serialize(new[] { "p1", "p5", "p3" }, JsonOpts), Active = true,
                },
                new Offer
                {
                    Id = "o2", Title = "Coffee & Croissant", Description = "Any hot drink + butter croissant", Price = 6m,
                    Image = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900",
                    ProductIdsJson = JsonSerializer.Serialize(new[] { "p6", "p7" }, JsonOpts), Active = true,
                }
            );
        }

        if (!await db.HeroContents.AnyAsync())
        {
            var slides = Enumerable.Range(0, 5).Select(i => new { image = i switch
            {
                0 => "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1400&q=80",
                1 => "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1400&q=80",
                2 => "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1400&q=80",
                3 => "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=1400&q=80",
                _ => "",
            }, caption = "" }).ToArray();

            db.HeroContents.Add(new HeroContent
            {
                Tagline = "Where every bite is a sweet escape.",
                Image = "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1200&q=80",
                AboutImage = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80",
                FloatingImagesJson = JsonSerializer.Serialize(new[] { "", "", "" }, JsonOpts),
                BackgroundSlidesJson = JsonSerializer.Serialize(slides, JsonOpts),
                HeroBadge = "Dessert Cafe · Chicago",
                HeroTitleBefore = "Sweet",
                HeroTitleAccent = "Drip",
                HeroTitleAfter = "Every Day.",
            });
        }

        if (!await db.AppSettings.AnyAsync())
        {
            db.AppSettings.AddRange(
                new AppSetting { Key = "TaxRatePercent", Value = "10.25" },
                new AppSetting { Key = "OffersSectionVisible", Value = "true" }
            );
        }

        if (!await db.AdminUsers.AnyAsync())
        {
            db.AdminUsers.Add(new AdminUser
            {
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                UpdatedAt = DateTime.UtcNow,
            });
        }

        await db.SaveChangesAsync();
    }

    private static Product Product(string id, string catId, string name, string desc, decimal price, string image, string notes, string[] choices) =>
        new()
        {
            Id = id,
            CategoryId = catId,
            Name = name,
            Description = desc,
            Price = price,
            Image = image,
            Notes = notes,
            NoteChoicesJson = JsonSerializer.Serialize(choices, JsonOpts),
        };
}
