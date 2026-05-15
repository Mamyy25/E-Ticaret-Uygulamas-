namespace ECommerce.Models.Enums
{
    public enum InvoiceType
    {
        Standard = 0,   // Standart fatura
        EInvoice = 1,   // e-Fatura (GİB)
        EArchive = 2    // e-Arşiv Fatura (GİB)
    }

    public enum InvoiceStatus
    {
        Draft = 0,
        Sent = 1,
        Paid = 2,
        Cancelled = 3
    }
}
