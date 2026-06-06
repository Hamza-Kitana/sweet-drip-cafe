namespace SweetDrip.Api.Models;

public class Category
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Image { get; set; } = "";
    public bool Visible { get; set; } = true;
    public int SortOrder { get; set; }
    public ICollection<Product> Products { get; set; } = [];
}

public class Product
{
    public string Id { get; set; } = "";
    public string CategoryId { get; set; } = "";
    public Category Category { get; set; } = null!;
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string Image { get; set; } = "";
    public string Notes { get; set; } = "";
    public string NoteChoicesJson { get; set; } = "[]";
}

public class Offer
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string Image { get; set; } = "";
    public string ProductIdsJson { get; set; } = "[]";
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public bool Active { get; set; } = true;
}

public class Order
{
    public string Id { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public string CustomerName { get; set; } = "";
    public string CustomerEmail { get; set; } = "";
    public string CustomerPhone { get; set; } = "";
    public string PickupDate { get; set; } = "";
    public string PickupTime { get; set; } = "";
    public string? Message { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Tip { get; set; }
    public decimal Tax { get; set; }
    public decimal TaxRate { get; set; }
    public decimal Total { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.AwaitingPayment;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public string? StripePaymentIntentId { get; set; }
    public string? PaymentFailureReason { get; set; }
    public ICollection<OrderItem> Items { get; set; } = [];
}

public class OrderItem
{
    public int Id { get; set; }
    public string OrderId { get; set; } = "";
    public Order Order { get; set; } = null!;
    public string ProductId { get; set; } = "";
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public int Qty { get; set; }
    public string? Note { get; set; }
    public string? NoteChoice { get; set; }
    public string? Image { get; set; }
}

public class CateringRequest
{
    public string Id { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public int Guests { get; set; }
    public string Date { get; set; } = "";
    public string Time { get; set; } = "";
    public string? Message { get; set; }
    public CateringStatus Status { get; set; } = CateringStatus.New;
}

public class AdminUser
{
    public int Id { get; set; }
    public string Username { get; set; } = "admin";
    public string PasswordHash { get; set; } = "";
    public DateTime UpdatedAt { get; set; }
}

public class AppSetting
{
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
}

public class HeroContent
{
    public int Id { get; set; }
    public string Tagline { get; set; } = "";
    public string Image { get; set; } = "";
    public string FloatingImagesJson { get; set; } = "[]";
    public string AboutImage { get; set; } = "";
    public string BackgroundSlidesJson { get; set; } = "[]";
    public string HeroBadge { get; set; } = "";
    public string HeroTitleBefore { get; set; } = "";
    public string HeroTitleAccent { get; set; } = "";
    public string HeroTitleAfter { get; set; } = "";
}
