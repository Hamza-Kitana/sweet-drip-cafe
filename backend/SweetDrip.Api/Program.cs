using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SweetDrip.Api.Data;
using SweetDrip.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<SweetDripDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<PricingService>();
builder.Services.AddScoped<CatalogMapper>();
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddSingleton<StripePaymentService>();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "SweetDrip-Dev-Key-Change-In-Production-32chars!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "SweetDrip",
            ValidAudience = builder.Configuration["Jwt:Issuer"] ?? "SweetDrip",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ??
                      ["http://localhost:5173", "https://sweet-drip-cafe-weld.vercel.app"];
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SweetDripDbContext>();
    await DbSeeder.SeedAsync(db);
}

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.Run();
