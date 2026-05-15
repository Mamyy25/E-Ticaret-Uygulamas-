using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ECommerce.Models.Enums;

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

        public StoreType StoreType { get; set; } = StoreType.Physical;

        public int? YearsOfExperience { get; set; }

        [StringLength(500)]
        public string? DiplomaUrl { get; set; }

        public bool IsActive { get; set; } = true;

        // ─── Faz4: Başvuru Durumu + Askıya Alma ─────────────────────────
        public string Status { get; set; } = "Active";  // Pending | Active | Rejected | Suspended
        [StringLength(500)]
        public string? RejectionReason { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? SuspendedAt { get; set; }
        [StringLength(500)]
        public string? SuspensionReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [ForeignKey("SellerId")]
        public User? Seller { get; set; }

        public ICollection<StoreCategory> StoreCategories { get; set; } = new List<StoreCategory>();
        public ICollection<Product> Products { get; set; } = new List<Product>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<ServicePackage> ServicePackages { get; set; } = new List<ServicePackage>();
        public ICollection<WorkArea> WorkAreas { get; set; } = new List<WorkArea>();
        public ICollection<RequestOffer> RequestOffers { get; set; } = new List<RequestOffer>();
    }
}
