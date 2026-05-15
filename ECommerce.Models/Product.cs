using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ECommerce.Models.Enums;

namespace ECommerce.Models
{
    public class Product
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Ürün adı zorunludur")]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 999999.99)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        // ─── Dijital Ürün Alanları ───────────────────────────────────────
        [StringLength(1000)]
        public string? FileUrl { get; set; }       // İndirme dosyası (zip, pdf, figma, vs.)

        [StringLength(1000)]
        public string? PreviewUrl { get; set; }    // Demo link veya önizleme görseli

        public int DownloadCount { get; set; } = 0;

        public LicenseType LicenseType { get; set; } = LicenseType.Personal;

        // ─── Ortak Alanlar ───────────────────────────────────────────────
        [StringLength(500)]
        public string? ImageUrl { get; set; }      // Kapak görseli

        public int? CategoryId { get; set; }

        public int? StoreId { get; set; }

        public int? StoreCategoryId { get; set; }

        [StringLength(500)]
        public string? Keywords { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
        public bool IsFeatured { get; set; } = false;

        // ─── Faz4: Admin Askıya Alma ─────────────────────────────────────
        public DateTime? SuspendedAt { get; set; }
        [StringLength(500)]
        public string? SuspensionReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        // ─── İlişkiler ───────────────────────────────────────────────────
        [ForeignKey("CategoryId")]
        public Category? Category { get; set; }

        [ForeignKey("StoreId")]
        public Store? Store { get; set; }

        [ForeignKey("StoreCategoryId")]
        public StoreCategory? StoreCategory { get; set; }

        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    }
}
