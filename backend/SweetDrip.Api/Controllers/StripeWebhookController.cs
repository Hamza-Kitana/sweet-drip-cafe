using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using SweetDrip.Api.Data;
using SweetDrip.Api.Models;

namespace SweetDrip.Api.Controllers;

[ApiController]
[Route("api/stripe")]
public class StripeWebhookController(SweetDripDbContext db, IConfiguration config, ILogger<StripeWebhookController> logger) : ControllerBase
{
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook(CancellationToken ct)
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync(ct);
        var webhookSecret = config["Stripe:WebhookSecret"];
        Event stripeEvent;

        try
        {
            stripeEvent = string.IsNullOrWhiteSpace(webhookSecret)
                ? EventUtility.ParseEvent(json)
                : EventUtility.ConstructEvent(json, Request.Headers["Stripe-Signature"], webhookSecret);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Invalid Stripe webhook");
            return BadRequest();
        }

        if (stripeEvent.Type == EventTypes.PaymentIntentSucceeded)
        {
            var intent = (PaymentIntent)stripeEvent.Data.Object;
            await UpdateOrderFromIntent(intent, paid: true, ct);
        }
        else if (stripeEvent.Type == EventTypes.PaymentIntentPaymentFailed)
        {
            var intent = (PaymentIntent)stripeEvent.Data.Object;
            await UpdateOrderFromIntent(intent, paid: false, ct);
        }

        return Ok();
    }

    private async Task UpdateOrderFromIntent(PaymentIntent intent, bool paid, CancellationToken ct)
    {
        if (!intent.Metadata.TryGetValue("order_id", out var orderId)) return;
        var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == orderId, ct);
        if (order == null) return;

        if (paid)
        {
            order.PaymentStatus = PaymentStatus.Paid;
            order.Status = OrderStatus.New;
            order.PaymentFailureReason = null;
        }
        else
        {
            order.PaymentStatus = PaymentStatus.Failed;
            order.PaymentFailureReason = intent.LastPaymentError?.Message ?? "Payment failed";
        }

        order.StripePaymentIntentId = intent.Id;
        await db.SaveChangesAsync(ct);
    }
}
