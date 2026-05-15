using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ECommerce.Models.Enums;

namespace ECommerce.Models
{
    /// <summary>
    /// Satıcının gerçekleştirdiği iş/hizmet kaydı. (Premium)
    /// </summary>
    public class JobRecord
    {
        public int Id { get; set; }

        [Required]
        public int StoreId { get; set; }

        public int? CustomerRecordId { get; set; }

        public int? AppointmentId { get; set; }

        [Required, StringLength(300)]
        public string Title { get; set; } = string.Empty;

        [StringLength(2000)]
        public string? Description { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Amount { get; set; }

        public JobStatus Status { get; set; } = JobStatus.Pending;

        public DateTime? ScheduledAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("StoreId")]
        public Store? Store { get; set; }

        [ForeignKey("CustomerRecordId")]
        public CustomerRecord? CustomerRecord { get; set; }

        [ForeignKey("AppointmentId")]
        public Appointment? Appointment { get; set; }

        public ICollection<PaymentRecord> PaymentRecords { get; set; } = new List<PaymentRecord>();
    }
}
