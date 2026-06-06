using System.Text.Json;

namespace SweetDrip.Api.Services;

public record ProductNoteChoice(string Label, decimal ExtraPrice);

public static class NoteChoicesParser
{
    public static List<ProductNoteChoice> Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];

        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return [];

            var list = new List<ProductNoteChoice>();
            foreach (var el in doc.RootElement.EnumerateArray())
            {
                if (el.ValueKind == JsonValueKind.String)
                {
                    var label = el.GetString()?.Trim();
                    if (!string.IsNullOrEmpty(label))
                        list.Add(new ProductNoteChoice(label, 0));
                    continue;
                }

                if (el.ValueKind != JsonValueKind.Object) continue;

                var choiceLabel = ReadString(el, "label") ?? ReadString(el, "Label");
                if (string.IsNullOrWhiteSpace(choiceLabel)) continue;

                var extra = ReadDecimal(el, "extraPrice");
                if (extra == null) extra = ReadDecimal(el, "ExtraPrice");
                list.Add(new ProductNoteChoice(choiceLabel.Trim(), Math.Max(0, extra ?? 0)));
            }

            return list;
        }
        catch
        {
            return [];
        }
    }

    private static string? ReadString(JsonElement obj, string name) =>
        obj.TryGetProperty(name, out var prop) && prop.ValueKind == JsonValueKind.String
            ? prop.GetString()
            : null;

    private static decimal? ReadDecimal(JsonElement obj, string name)
    {
        if (!obj.TryGetProperty(name, out var prop)) return null;
        if (prop.ValueKind == JsonValueKind.Number && prop.TryGetDecimal(out var n)) return n;
        if (prop.ValueKind == JsonValueKind.String &&
            decimal.TryParse(prop.GetString(), System.Globalization.NumberStyles.Number,
                System.Globalization.CultureInfo.InvariantCulture, out var parsed))
            return parsed;
        return null;
    }
}
