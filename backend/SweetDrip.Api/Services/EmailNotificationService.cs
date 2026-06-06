using System.Net;
using System.Text;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using SweetDrip.Api.Models;

namespace SweetDrip.Api.Services;

public class EmailNotificationService(IConfiguration config, ILogger<EmailNotificationService> logger)
{
    public bool IsConfigured =>
        config.GetValue("Email:Enabled", false) &&
        !string.IsNullOrWhiteSpace(config["Email:SmtpHost"]) &&
        !string.IsNullOrWhiteSpace(config["Email:NotifyAddress"]);

    public async Task SendCateringRequestAsync(CateringRequest request, CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            logger.LogInformation(
                "Catering email skipped for {RequestId} — Email:Enabled is false or SMTP is not configured.",
                request.Id);
            return;
        }

        var notifyAddress = config["Email:NotifyAddress"]!.Trim();
        var fromAddress = (config["Email:FromAddress"] ?? notifyAddress).Trim();
        var fromName = config["Email:FromName"] ?? "Sweet Drip Cafe";
        var adminUrl = (config["Email:AdminUrl"] ?? "https://sweetdrip.cafe/admin").Trim();

        var subject = $"New catering request · {request.Name} · {request.Guests} guests";
        var textBody = BuildCateringPlainText(request, adminUrl);
        var htmlBody = BuildCateringHtml(request, adminUrl);

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromAddress));
        message.To.Add(MailboxAddress.Parse(notifyAddress));
        message.Subject = subject;
        message.ReplyTo.Add(MailboxAddress.Parse(request.Email));
        message.Body = new BodyBuilder { TextBody = textBody, HtmlBody = htmlBody }.ToMessageBody();

        var host = config["Email:SmtpHost"]!.Trim();
        var port = config.GetValue("Email:SmtpPort", 587);
        var username = config["Email:Username"]?.Trim();
        var password = config["Email:Password"];
        var useSsl = config.GetValue("Email:UseSsl", true);

        using var client = new SmtpClient();
        var secure = useSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;
        await client.ConnectAsync(host, port, secure, ct);

        if (!string.IsNullOrWhiteSpace(username))
            await client.AuthenticateAsync(username, password, ct);

        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);

        logger.LogInformation("Catering notification email sent for {RequestId} to {NotifyAddress}", request.Id, notifyAddress);
    }

    private static string BuildCateringPlainText(CateringRequest request, string adminUrl)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Sweet Drip — New catering request");
        sb.AppendLine(new string('─', 40));
        sb.AppendLine($"Request ID: {request.Id}");
        sb.AppendLine($"Submitted: {request.CreatedAt:MMMM d, yyyy · h:mm tt} UTC");
        sb.AppendLine();
        sb.AppendLine($"Name: {request.Name}");
        sb.AppendLine($"Email: {request.Email}");
        sb.AppendLine($"Phone: {request.Phone}");
        sb.AppendLine($"Event date: {request.Date}");
        sb.AppendLine($"Event time: {request.Time}");
        sb.AppendLine($"Guests: {request.Guests}");
        if (!string.IsNullOrWhiteSpace(request.Message))
        {
            sb.AppendLine();
            sb.AppendLine("Message:");
            sb.AppendLine(request.Message);
        }
        sb.AppendLine();
        sb.AppendLine($"Open admin: {adminUrl}");
        return sb.ToString();
    }

    private static string BuildCateringHtml(CateringRequest request, string adminUrl)
    {
        var submitted = request.CreatedAt.ToString("MMMM d, yyyy · h:mm tt") + " UTC";
        var messageBlock = string.IsNullOrWhiteSpace(request.Message)
            ? ""
            : $"""
              <tr>
                <td colspan="2" style="padding:16px 0 8px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#9a6b73;">Message</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:14px 16px;background:#fff8fa;border:1px solid #f0d4dc;border-radius:12px;color:#4a2f35;line-height:1.55;">
                  {Encode(request.Message).Replace("\n", "<br/>", StringComparison.Ordinal)}
                </td>
              </tr>
              """;

        return $$"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>New catering request</title>
            </head>
            <body style="margin:0;padding:0;background:#f9f3f0;font-family:Georgia,'Times New Roman',serif;color:#3d2a2f;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9f3f0;padding:32px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(120,45,70,0.12);">
                      <tr>
                        <td style="height:5px;background:linear-gradient(90deg,#c8956c,#d4a574,#e8c4a0);"></td>
                      </tr>
                      <tr>
                        <td style="padding:28px 28px 8px;text-align:center;">
                          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:#b07a84;">Sweet Drip Cafe</p>
                          <h1 style="margin:0;font-size:28px;font-weight:400;color:#5c2f3a;">New catering request</h1>
                          <p style="margin:12px 0 0;font-size:14px;color:#8a6670;">Someone just submitted a large-order inquiry on your website.</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 28px 24px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fdf8f9;border:1px solid #f0d4dc;border-radius:16px;">
                            <tr>
                              <td style="padding:18px 20px;">
                                <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#9a6b73;">Request</p>
                                <p style="margin:0;font-size:18px;color:#5c2f3a;">#{{Encode(request.Id)}}</p>
                                <p style="margin:6px 0 0;font-size:12px;color:#8a6670;">{{Encode(submitted)}}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 28px 8px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            {{Row("Customer", Encode(request.Name))}}
                            {{Row("Email", $"""<a href="mailto:{EncodeAttr(request.Email)}" style="color:#8b4a58;text-decoration:none;">{Encode(request.Email)}</a>""")}}
                            {{Row("Phone", $"""<a href="tel:{EncodeAttr(request.Phone)}" style="color:#8b4a58;text-decoration:none;">{Encode(request.Phone)}</a>""")}}
                            {{Row("Event date", Encode(request.Date))}}
                            {{Row("Event time", Encode(request.Time))}}
                            {{Row("Guests", Encode(request.Guests.ToString()))}}
                            {{messageBlock}}
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 28px 32px;text-align:center;">
                          <a href="{{EncodeAttr(adminUrl)}}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:linear-gradient(135deg,#5c2f3a,#7a3f4d);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.04em;">
                            Open admin panel
                          </a>
                          <p style="margin:16px 0 0;font-size:12px;color:#a08088;">Reply directly to this email to reach the customer.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
    }

    private static string Row(string label, string valueHtml) =>
        $"""
          <tr>
            <td style="padding:10px 0 4px;width:38%;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#9a6b73;vertical-align:top;">{Encode(label)}</td>
            <td style="padding:10px 0 4px;font-size:15px;color:#3d2a2f;vertical-align:top;">{valueHtml}</td>
          </tr>
          """;

    private static string Encode(string? value) => WebUtility.HtmlEncode(value ?? "");

    private static string EncodeAttr(string? value) => WebUtility.HtmlEncode(value ?? "");
}
