using System.Text.Json;

namespace SweetDrip.Api.Services;

public record ProductOptionChoice(string Label, decimal ExtraPrice);

public record ProductOptionGroup(
    string Id,
    string Label,
    string SelectionType,
    bool Required,
    IReadOnlyList<ProductOptionChoice> Choices);

public record CartSelectedOption(string GroupId, string GroupLabel, string[] Choices);

public static class ProductOptionsParser
{
    public static List<ProductOptionGroup> ParseGroups(string? json, string? legacyNotes = null)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];

        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return [];

            var first = doc.RootElement.EnumerateArray().FirstOrDefault();
            if (first.ValueKind == JsonValueKind.Object && LooksLikeGroup(first))
                return ParseGroupArray(doc.RootElement);

            var flatChoices = ParseFlatChoices(doc.RootElement);
            if (flatChoices.Count == 0) return [];

            return
            [
                new ProductOptionGroup(
                    "legacy",
                    string.IsNullOrWhiteSpace(legacyNotes) ? "Options" : legacyNotes.Trim(),
                    "single",
                    true,
                    flatChoices),
            ];
        }
        catch
        {
            return [];
        }
    }

    public static decimal SumExtras(ProductOptionGroup group, IEnumerable<string> selectedLabels)
    {
        decimal total = 0;
        foreach (var label in selectedLabels)
        {
            var match = group.Choices.FirstOrDefault(c =>
                string.Equals(c.Label, label, StringComparison.OrdinalIgnoreCase));
            if (match != null) total += match.ExtraPrice;
        }

        return total;
    }

    public static decimal CalculateUnitPrice(decimal basePrice, string? noteChoicesJson, string? legacyNotes, IEnumerable<CartSelectedOption>? selections)
    {
        var groups = ParseGroups(noteChoicesJson, legacyNotes);
        if (groups.Count == 0) return basePrice;

        decimal extras = 0;
        var selected = selections?.ToList() ?? [];

        if (selected.Count == 0 && groups.Count == 1 && groups[0].SelectionType == "single")
        {
            // Legacy checkout lines only stored NoteChoice for the first flat choice.
            return basePrice;
        }

        foreach (var group in groups)
        {
            var pick = selected.FirstOrDefault(s =>
                string.Equals(s.GroupId, group.Id, StringComparison.OrdinalIgnoreCase)
                || string.Equals(s.GroupLabel, group.Label, StringComparison.OrdinalIgnoreCase));
            if (pick?.Choices is { Length: > 0 })
                extras += SumExtras(group, pick.Choices);
        }

        return basePrice + extras;
    }

    public static string FormatSelectionSummary(IEnumerable<CartSelectedOption>? selections)
    {
        if (selections == null) return "";
        return string.Join("; ", selections
            .Where(s => s.Choices.Length > 0)
            .Select(s => $"{s.GroupLabel}: {string.Join(", ", s.Choices)}"));
    }

    private static bool LooksLikeGroup(JsonElement el) =>
        el.TryGetProperty("choices", out _) || el.TryGetProperty("Choices", out _)
        || el.TryGetProperty("selectionType", out _) || el.TryGetProperty("SelectionType", out _);

    private static List<ProductOptionGroup> ParseGroupArray(JsonElement array)
    {
        var groups = new List<ProductOptionGroup>();
        foreach (var el in array.EnumerateArray())
        {
            if (el.ValueKind != JsonValueKind.Object) continue;

            var label = ReadString(el, "label") ?? ReadString(el, "Label") ?? "Options";
            var id = ReadString(el, "id") ?? ReadString(el, "Id") ?? Slugify(label);
            var selectionType = (ReadString(el, "selectionType") ?? ReadString(el, "SelectionType") ?? "single")
                .Trim()
                .ToLowerInvariant();
            if (selectionType != "multiple") selectionType = "single";

            var required = ReadBool(el, "required") ?? ReadBool(el, "Required") ?? (selectionType == "single");

            JsonElement choicesEl;
            if (!el.TryGetProperty("choices", out choicesEl) && !el.TryGetProperty("Choices", out choicesEl))
                continue;

            var choices = ParseFlatChoices(choicesEl);
            if (choices.Count == 0) continue;

            groups.Add(new ProductOptionGroup(id, label.Trim(), selectionType, required, choices));
        }

        return groups;
    }

    private static List<ProductOptionChoice> ParseFlatChoices(JsonElement array)
    {
        if (array.ValueKind != JsonValueKind.Array) return [];

        var list = new List<ProductOptionChoice>();
        foreach (var el in array.EnumerateArray())
        {
            if (el.ValueKind == JsonValueKind.String)
            {
                var label = el.GetString()?.Trim();
                if (!string.IsNullOrEmpty(label))
                    list.Add(new ProductOptionChoice(label, 0));
                continue;
            }

            if (el.ValueKind != JsonValueKind.Object) continue;

            var choiceLabel = ReadString(el, "label") ?? ReadString(el, "Label");
            if (string.IsNullOrWhiteSpace(choiceLabel)) continue;

            var extra = ReadDecimal(el, "extraPrice") ?? ReadDecimal(el, "ExtraPrice") ?? 0;
            list.Add(new ProductOptionChoice(choiceLabel.Trim(), Math.Max(0, extra)));
        }

        return list;
    }

    private static string Slugify(string value)
    {
        var chars = value.Trim().ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : '-')
            .ToArray();
        var slug = new string(chars).Trim('-');
        while (slug.Contains("--", StringComparison.Ordinal)) slug = slug.Replace("--", "-", StringComparison.Ordinal);
        return string.IsNullOrEmpty(slug) ? "group" : slug;
    }

    private static string? ReadString(JsonElement obj, string name) =>
        obj.TryGetProperty(name, out var prop) && prop.ValueKind == JsonValueKind.String
            ? prop.GetString()
            : null;

    private static bool? ReadBool(JsonElement obj, string name)
    {
        if (!obj.TryGetProperty(name, out var prop)) return null;
        if (prop.ValueKind == JsonValueKind.True) return true;
        if (prop.ValueKind == JsonValueKind.False) return false;
        return null;
    }

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

// Backward-compatible alias for older call sites.
public static class NoteChoicesParser
{
    public static List<ProductNoteChoice> Parse(string? json) =>
        ProductOptionsParser.ParseGroups(json)
            .SelectMany(g => g.Choices)
            .Select(c => new ProductNoteChoice(c.Label, c.ExtraPrice))
            .ToList();
}

public record ProductNoteChoice(string Label, decimal ExtraPrice);
