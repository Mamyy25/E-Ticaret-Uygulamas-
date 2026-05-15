using System.ComponentModel.DataAnnotations;

namespace ECommerce.Models
{
    public class SuspensionAppeal
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int? StoreId { get; set; }

        [Required]
        [StringLength(2000)]
        public string Message { get; set; } = string.Empty;

        [StringLength(2000)]
        public string? AdminResponse { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending | Approved | Denied

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? RespondedAt { get; set; }

        public User? User { get; set; }
        public Store? Store { get; set; }
    }
}
