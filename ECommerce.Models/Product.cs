using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Models
{
    public class Product
    {
        public int Id { get; set; }
        
        [Required(ErrorMessage = "Ürün adı zorunludur")]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty; // <--- initialize to avoid CS8618
        
        [Required]
        [StringLength(2000)]
        public string Description { get; set; } = string.Empty; // <--- initialize to avoid CS8618
        
        [Required]
        [Range(0.01, 999999.99)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }
        
        [Required]
        [Range(0, int.MaxValue)]
        public int Stock { get; set; }
        
        [StringLength(500)]
        public string? ImageUrl { get; set; }
        
        [Required]
        public int CategoryId { get; set; }
        
        public int? StoreId { get; set; }
        
        public int? StoreCategoryId { get; set; }

        [StringLength(500)]
        public string? Keywords { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
        public bool IsFeatured { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
        
        // İlişkiler
        [ForeignKey("CategoryId")]
        public Category? Category { get; set; }
        
        [ForeignKey("StoreId")]
        public Store? Store { get; set; }

        [ForeignKey("StoreCategoryId")]
        public StoreCategory? StoreCategory { get; set; }
        
        // Başlangıç koleksiyonları ekledim -> ThenInclude/nullability uyarılarını azaltır
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
    }
}
