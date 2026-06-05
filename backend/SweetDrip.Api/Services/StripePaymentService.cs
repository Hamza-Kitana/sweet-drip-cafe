using Stripe;

namespace SweetDrip.Api.Services;

public class StripePaymentService(IConfiguration config)
{
    public bool IsConfigured => !string.IsNullOrWhiteSpace(config["Stripe:SecretKey"]);

    private StripeClient Client => new(config["Stripe:SecretKey"]!);

    public async Task<(string ClientSecret, string PaymentIntentId)> CreatePaymentIntentAsync(
        string orderId,
        int amountCents,
        string customerEmail,
        string customerName,
        CancellationToken ct = default)
    {
        if (!IsConfigured) throw new InvalidOperationException("Stripe is not configured");

        var service = new PaymentIntentService(Client);
        var intent = await service.CreateAsync(new PaymentIntentCreateOptions
        {
            Amount = amountCents,
            Currency = "usd",
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions { Enabled = true },
            ReceiptEmail = customerEmail,
            Metadata = new Dictionary<string, string>
            {
                ["order_id"] = orderId,
                ["customer_name"] = customerName,
                ["customer_email"] = customerEmail,
            },
        }, cancellationToken: ct);

        if (string.IsNullOrEmpty(intent.ClientSecret))
            throw new InvalidOperationException("Stripe did not return a client secret");

        return (intent.ClientSecret, intent.Id);
    }

    public async Task<PaymentIntent> GetPaymentIntentAsync(string paymentIntentId, CancellationToken ct = default)
    {
        var service = new PaymentIntentService(Client);
        return await service.GetAsync(paymentIntentId, cancellationToken: ct);
    }
}
