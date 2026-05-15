namespace ECommerce.Models.Enums
{
    public enum PaymentMethod
    {
        Cash = 0,
        BankTransfer = 1,
        CreditCard = 2,
        DebitCard = 3,
        OnlinePlatform = 4  // İyzico, PayTR vs.
    }

    public enum PaymentDirection
    {
        Incoming = 0,  // Tahsilat
        Outgoing = 1   // Ödeme (gider)
    }
}
