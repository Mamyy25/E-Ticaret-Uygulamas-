using System.ComponentModel.DataAnnotations;

namespace ECommerce.Models
{
    public class Report
    {
        public int Id { get; set; }

        public int ReporterId { get; set; }

        [Required]
        [StringLength(20)]
        public string TargetType { get; set; } = string.Empty; // "User" | "Store" | "Product"

        public int TargetId { get; set; }

        [Required]
        [StringLength(100)]
        public string Reason { get; set; } = string.Empty; // Spam | UygunsuzIcerik | Sahtekarlık | Diger

        [StringLength(1000)]
        public string? Description { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "Open"; // Open | Resolved | Dismissed

        [StringLength(1000)]
        public string? AdminNote { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? ResolvedAt { get; set; }

        public User? Reporter { get; set; }
    }
}
