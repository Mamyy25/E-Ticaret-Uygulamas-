using ECommerce.Models;

namespace ECommerce.Models
{
    public class CheckoutViewModel
    {
        public Cart Cart { get; set; } = new Cart();
        public User? User { get; set; }
        public Order Order { get; set; } = new Order();
    }

    public class OrderReviewViewModel
    {
        public Cart Cart { get; set; } = new Cart();
        public string ShippingAddress { get; set; } = string.Empty;
        public string? ShippingCity { get; set; }
        public string? ShippingZipCode { get; set; }
        public string? ShippingPhone { get; set; }
        public string? Notes { get; set; }
    }
}