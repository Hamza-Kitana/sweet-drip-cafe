using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SweetDrip.Api.Data;
using SweetDrip.Api.DTOs;
using SweetDrip.Api.Models;
using SweetDrip.Api.Services;

namespace SweetDrip.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController(
    SweetDripDbContext db,
    PricingService pricing,
    StripePaymentService stripe,
    CatalogMapper mapper) : ControllerBase
{
    [HttpPost("checkout")]
    public async Task<ActionResult<CheckoutResponseDto>> Checkout([FromBody] CheckoutRequestDto body, CancellationToken ct)
    {
        if (body.Items.Length == 0) return BadRequest(new { error = "Cart is empty" });

        try
        {
            var (items, subtotal, taxRate, tax, total) = await pricing.BuildOrderAsync(body.Items, body.Tip, ct);
            if (total < 0.5m) return BadRequest(new { error = "Order total must be at least $0.50" });

            var orderId = "SD-" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString()[^6..];
            var order = new Order
            {
                Id = orderId,
                CreatedAt = DateTime.UtcNow,
                CustomerName = body.Customer.Name.Trim(),
                CustomerEmail = body.Customer.Email.Trim(),
                CustomerPhone = body.Customer.Phone.Trim(),
                PickupDate = body.Customer.Date,
                PickupTime = body.Customer.Time,
                Message = body.Customer.Message,
                Subtotal = subtotal,
                Tip = body.Tip,
                Tax = tax,
                TaxRate = taxRate,
                Total = total,
                Status = OrderStatus.AwaitingPayment,
                PaymentStatus = PaymentStatus.Pending,
            };

            foreach (var item in items) item.OrderId = orderId;
            order.Items = items;
            db.Orders.Add(order);
            await db.SaveChangesAsync(ct);

            if (!stripe.IsConfigured)
                return StatusCode(503, new { error = "Stripe is not configured on the server" });

            var amountCents = (int)Math.Round(total * 100);
            var (clientSecret, paymentIntentId) = await stripe.CreatePaymentIntentAsync(
                orderId, amountCents, order.CustomerEmail, order.CustomerName, ct);

            order.StripePaymentIntentId = paymentIntentId;
            await db.SaveChangesAsync(ct);

            return Ok(new CheckoutResponseDto(orderId, clientSecret, paymentIntentId, subtotal, body.Tip, tax, taxRate, total));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id}/confirm-payment")]
    public async Task<ActionResult<OrderDto>> ConfirmPayment(string id, [FromBody] ConfirmPaymentRequestDto body, CancellationToken ct)
    {
        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id, ct);
        if (order == null) return NotFound();

        if (!stripe.IsConfigured) return StatusCode(503, new { error = "Stripe is not configured" });

        var intent = await stripe.GetPaymentIntentAsync(body.PaymentIntentId, ct);
        if (intent.Metadata.TryGetValue("order_id", out var metaOrderId) && metaOrderId != id)
            return BadRequest(new { error = "Payment does not match this order" });

        if (intent.Status == "succeeded")
        {
            order.PaymentStatus = PaymentStatus.Paid;
            order.Status = OrderStatus.New;
            order.PaymentFailureReason = null;
            order.StripePaymentIntentId = intent.Id;
            await db.SaveChangesAsync(ct);
            return Ok(Map(order));
        }

        order.PaymentStatus = PaymentStatus.Failed;
        order.PaymentFailureReason = intent.LastPaymentError?.Message ?? "Payment was not completed";
        await db.SaveChangesAsync(ct);
        return BadRequest(new { error = order.PaymentFailureReason, order = Map(order) });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetOrder(string id, CancellationToken ct)
    {
        var order = await db.Orders.AsNoTracking().Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id, ct);
        return order == null ? NotFound() : Ok(Map(order));
    }

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<OrderDto[]>> ListOrders(CancellationToken ct)
    {
        var orders = await db.Orders.AsNoTracking().Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt).ToListAsync(ct);
        return Ok(orders.Select(Map).ToArray());
    }

    [Authorize]
    [HttpPatch("{id}/status")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(string id, [FromBody] UpdateOrderStatusDto body, CancellationToken ct)
    {
        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id, ct);
        if (order == null) return NotFound();
        if (order.PaymentStatus != PaymentStatus.Paid)
            return BadRequest(new { error = "Cannot update status until payment is completed" });

        order.Status = body.Status.ToLowerInvariant() switch
        {
            "new" => OrderStatus.New,
            "preparing" => OrderStatus.Preparing,
            "ready" => OrderStatus.Ready,
            "done" => OrderStatus.Done,
            "cancelled" => OrderStatus.Cancelled,
            _ => order.Status,
        };
        await db.SaveChangesAsync(ct);
        return Ok(Map(order));
    }

    private static OrderDto Map(Order o)
    {
        var dto = CatalogMapper.MapOrder(o);
        return dto with
        {
            Status = o.Status switch
            {
                OrderStatus.AwaitingPayment => "awaiting_payment",
                OrderStatus.New => "new",
                OrderStatus.Preparing => "preparing",
                OrderStatus.Ready => "ready",
                OrderStatus.Done => "done",
                OrderStatus.Cancelled => "cancelled",
                _ => "new",
            },
            PaymentStatus = o.PaymentStatus switch
            {
                PaymentStatus.Pending => "pending",
                PaymentStatus.Paid => "paid",
                PaymentStatus.Failed => "failed",
                _ => "pending",
            },
        };
    }
}
