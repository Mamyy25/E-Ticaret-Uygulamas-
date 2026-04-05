using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Models
{
    public class Store
    {
        public int Id { get; set; }

        [Required]
        public int SellerId { get; set; }

        [Required(ErrorMessage = "Mağaza adı zorunludur")]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(2000)]
        public string? Description { get; set; }

        [StringLength(500)]
        public string? ProfileImageUrl { get; set; }

        [StringLength(500)]
        public string? BannerImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [ForeignKey("SellerId")]
        public User? Seller { get; set; }

        public ICollection<StoreCategory> StoreCategories { get; set; } = new List<StoreCategory>();
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
