using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ECommerce.Models.Enums;

namespace ECommerce.Models
{
    /// <summary>
    /// Satıcının ödeme takip kaydı — nakit, havale, kart, vb. (Premium)
    /// </summary>
    public class PaymentRecord
    {
        public int Id { get; set; }

        [Required]
        public int StoreId { get; set; }

        public int? CustomerRecordId { get; set; }

        public int? JobRecordId { get; set; }

        public int? OrderId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public PaymentMethod Method { get; set; } = PaymentMethod.Cash;

        public PaymentDirection Direction { get; set; } = PaymentDirection.Incoming;

        [StringLength(500)]
        public string? Description { get; set; }

        public DateTime PaidAt { get; set; } = DateTime.Now;
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [ForeignKey("StoreId")]
        public Store? Store { get; set; }

        [ForeignKey("CustomerRecordId")]
        public CustomerRecord? CustomerRecord { get; set; }

        [ForeignKey("JobRecordId")]
        public JobRecord? JobRecord { get; set; }
    }
}
