using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Models
{
    public class ServicePackage
    {
        public int Id { get; set; }

        [Required]
        public int StoreId { get; set; }

        [Required]
        [StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 999999.99)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        // Tahmini süre (dakika)
        [Range(1, 10000)]
        public int DurationMinutes { get; set; } = 60;

        [StringLength(500)]
        public string? ImageUrl { get; set; }

        // Etiketler — virgülle ayrılmış (paint, ceramic, interior gibi)
        [StringLength(500)]
        public string? Tags { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsFeatured { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("StoreId")]
        public Store? Store { get; set; }

        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    }
}
