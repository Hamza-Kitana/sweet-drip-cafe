namespace SweetDrip.Api.DTOs;

using System.Globalization;
using System.Text.Json.Serialization;

public record CategoryDto(string? Id, string Name, string Image, bool Visible);
public record ProductDto(string? Id, string CategoryId, string Name, string Description, decimal Price, string Image, string Notes, string[]? NoteChoices);
public record OfferDto(string? Id, string Title, string Description, decimal Price, string Image, string[]? ProductIds, string? StartAt, string? EndAt, bool Active);
public record BackgroundSlideDto(string Image, string Caption);
public record HeroDto(string Tagline, string Image, string[] FloatingImages, string AboutImage, BackgroundSlideDto[] BackgroundSlides, string HeroBadge, string HeroTitleBefore, string HeroTitleAccent, string HeroTitleAfter);
public record CatalogDto(CategoryDto[] Categories, ProductDto[] Products, OfferDto[] Offers, HeroDto Hero, decimal TaxRatePercent, bool OffersSectionVisible);

public record CartLineDto(string ProductId, string Name, decimal Price, int Qty, string? Note, string? NoteChoice, string? Image);
public record CheckoutCustomerDto(string Name, string Email, string Phone, string Date, string Time, string? Message);
public record CheckoutRequestDto(CartLineDto[] Items, decimal Tip, CheckoutCustomerDto Customer);
public record CheckoutResponseDto(string OrderId, string ClientSecret, string PaymentIntentId, decimal Subtotal, decimal Tip, decimal Tax, decimal TaxRatePercent, decimal Total);

public record ConfirmPaymentRequestDto(string PaymentIntentId);
public record OrderItemDto(string ProductId, string Name, decimal Price, int Qty, string? Note, string? NoteChoice, string? Image);
public record OrderCustomerDto(string Name, string Email, string Phone, string Date, string Time, string? Message);
public record OrderDto(string Id, string CreatedAt, OrderItemDto[] Items, OrderCustomerDto Customer, decimal Subtotal, decimal Tip, decimal Tax, decimal? TaxRate, decimal Total, string Status, string PaymentStatus, string? PaymentFailureReason, string? StripePaymentIntentId);

public record CateringRequestDto(string Name, string Email, string Phone, int Guests, string Date, string Time, string? Message);
public record CateringDto(string Id, string CreatedAt, string Name, string Email, string Phone, int Guests, string Date, string Time, string? Message, string Status);

public record LoginRequestDto(string Username, string Password);
public record LoginResponseDto(string Token, string Username);
public record UpdateCredentialsDto(string Username, string Password, string CurrentPassword);

public record OverviewStatsDto(decimal Revenue, int OrderCount, int NewOrders, int UnpaidOrders, decimal AverageOrder);

public record UpdateOrderStatusDto(string Status);
public record UpdateCateringStatusDto(string Status);
public record TaxRateSettingDto(decimal TaxRatePercent);
public record UpdateTaxRateDto(
    [property: JsonPropertyName("taxRatePercent")] decimal TaxRatePercent);
public record UpdateOffersVisibilityDto(bool Visible);
