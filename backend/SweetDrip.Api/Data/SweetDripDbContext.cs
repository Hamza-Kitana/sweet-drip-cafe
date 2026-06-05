using Microsoft.EntityFrameworkCore;
using SweetDrip.Api.Models;

namespace SweetDrip.Api.Data;

public class SweetDripDbContext(DbContextOptions<SweetDripDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<CateringRequest> CateringRequests => Set<CateringRequest>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<AppSetting> AppSettings => Set<AppSetting>();
    public DbSet<HeroContent> HeroContents => Set<HeroContent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(120);
            e.Property(x => x.Image).HasColumnType("nvarchar(max)");
        });

        modelBuilder.Entity<Product>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(160);
            e.Property(x => x.Price).HasPrecision(10, 2);
            e.Property(x => x.Image).HasColumnType("nvarchar(max)");
            e.Property(x => x.NoteChoicesJson).HasColumnType("nvarchar(max)");
            e.HasOne(x => x.Category).WithMany(x => x.Products).HasForeignKey(x => x.CategoryId);
        });

        modelBuilder.Entity<Offer>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(160);
            e.Property(x => x.Price).HasPrecision(10, 2);
            e.Property(x => x.Image).HasColumnType("nvarchar(max)");
            e.Property(x => x.ProductIdsJson).HasColumnType("nvarchar(max)");
        });

        modelBuilder.Entity<Order>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Subtotal).HasPrecision(10, 2);
            e.Property(x => x.Tip).HasPrecision(10, 2);
            e.Property(x => x.Tax).HasPrecision(10, 2);
            e.Property(x => x.TaxRate).HasPrecision(5, 2);
            e.Property(x => x.Total).HasPrecision(10, 2);
            e.HasIndex(x => x.CreatedAt);
            e.HasIndex(x => x.PaymentStatus);
        });

        modelBuilder.Entity<OrderItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Price).HasPrecision(10, 2);
            e.HasOne(x => x.Order).WithMany(x => x.Items).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CateringRequest>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.CreatedAt);
        });

        modelBuilder.Entity<AdminUser>(e => e.HasKey(x => x.Id));
        modelBuilder.Entity<AppSetting>(e => e.HasKey(x => x.Key));
        modelBuilder.Entity<HeroContent>(e => e.HasKey(x => x.Id));
    }
}
