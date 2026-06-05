namespace SweetDrip.Api.Models;

public enum OrderStatus
{
    AwaitingPayment = 0,
    New = 1,
    Preparing = 2,
    Ready = 3,
    Done = 4,
    Cancelled = 5,
}

public enum PaymentStatus
{
    Pending = 0,
    Paid = 1,
    Failed = 2,
}

public enum CateringStatus
{
    New = 0,
    Contacted = 1,
    Done = 2,
}
