using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Models
{
    public class CartItem
    {
        public int Id { get; set; }
        
        [Required]
        public int CartId { get; set; }
        
        [Required]
        public int ProductId { get; set; }
        
        [Required]
        [Range(1, 999)]
        public int Quantity { get; set; }
        
        public DateTime AddedAt { get; set; } = DateTime.Now;
        
        [ForeignKey("CartId")]
        public Cart Cart { get; set; } = default!;

        [ForeignKey("ProductId")]
        public Product Product { get; set; } = default!;
        
        [NotMapped]
        public decimal SubTotal => Quantity * Product.Price;
    }
}
