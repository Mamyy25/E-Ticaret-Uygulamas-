using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Models
{
    /// <summary>
    /// Satıcının kendi müşteri defteri — Platform dışı veya içi müşterileri kaydeder. (Premium)
    /// </summary>
    public class CustomerRecord
    {
        public int Id { get; set; }

        [Required]
        public int StoreId { get; set; }

        [Required, StringLength(150)]
        public string FullName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(200)]
        public string? Address { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("StoreId")]
        public Store? Store { get; set; }

        public ICollection<JobRecord> JobRecords { get; set; } = new List<JobRecord>();
        public ICollection<PaymentRecord> PaymentRecords { get; set; } = new List<PaymentRecord>();
    }
}
