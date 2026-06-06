namespace SweetDrip.Api.Services;

/// <summary>
/// Lightweight revision counters for live sync — clients poll and refresh when these change.
/// </summary>
public class LiveRevisionService
{
    private long _catalogRevision = 1;
    private long _adminRevision = 1;

    public long CatalogRevision => Interlocked.Read(ref _catalogRevision);
    public long AdminRevision => Interlocked.Read(ref _adminRevision);

    public long BumpCatalog() => Interlocked.Increment(ref _catalogRevision);
    public long BumpAdmin() => Interlocked.Increment(ref _adminRevision);
}
