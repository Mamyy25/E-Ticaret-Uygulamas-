using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Models
{
    public class Cart
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
        
        [ForeignKey("UserId")]
        public User? User { get; set; }
        
        public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
        
        [NotMapped]
        public decimal TotalAmount => CartItems?.Sum(x => x.Quantity * x.Product.Price) ?? 0;
        
        [NotMapped]
        public int TotalItems => CartItems?.Sum(x => x.Quantity) ?? 0;
    }
}