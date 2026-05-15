using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ECommerce.Models.Enums;

namespace ECommerce.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        [StringLength(200)]
        public string FullName { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(500)]
        public string? Address { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(20)]
        public string? ZipCode { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public UserType UserType { get; set; } = UserType.Consumer;

        public SubscriptionPlan SubscriptionPlan { get; set; } = SubscriptionPlan.Free;

        public DateTime? SubscriptionExpiresAt { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime? LastLoginDate { get; set; }

        // ─── Faz4: Askıya Alma ───────────────────────────────────────────
        public DateTime? SuspendedAt { get; set; }
        [StringLength(500)]
        public string? SuspensionReason { get; set; }
        public int? SuspendedByAdminId { get; set; }
        [NotMapped] public bool IsSuspended => SuspendedAt.HasValue;

        public ICollection<Order>? Orders { get; set; }
        public Cart? Cart { get; set; }
        public Store? Store { get; set; }
    }
}
