using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Models
{
    public class Order
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public DateTime OrderDate { get; set; } = DateTime.Now;
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pending";
        
        [Required]
        [StringLength(500)]
        public string ShippingAddress { get; set; } = string.Empty; // <--- initialize to avoid CS8618
        
        [StringLength(100)]
        public string? ShippingCity { get; set; }
        
        [StringLength(20)]
        public string? ShippingZipCode { get; set; }
        
        [Phone]
        [StringLength(20)]
        public string? ShippingPhone { get; set; }
        
        [StringLength(1000)]
        public string? Notes { get; set; }
        
        [StringLength(100)]
        public string? TrackingNumber { get; set; }
        
        public DateTime? ShippedDate { get; set; }
        public DateTime? DeliveredDate { get; set; }
        
        [ForeignKey("UserId")]
        public User? User { get; set; }
        
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>(); // <--- initialize
    }
}
