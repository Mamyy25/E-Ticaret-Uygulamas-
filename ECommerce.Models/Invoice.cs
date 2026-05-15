using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ECommerce.Models.Enums;

namespace ECommerce.Models
{
    /// <summary>
    /// Fatura kaydı — manuel veya e-fatura entegrasyon ile. (Pro)
    /// </summary>
    public class Invoice
    {
        public int Id { get; set; }

        [Required]
        public int StoreId { get; set; }

        public int? CustomerRecordId { get; set; }

        public int? JobRecordId { get; set; }

        public int? OrderId { get; set; }

        [Required, StringLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxRate { get; set; } = 20;      // KDV %20

        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public InvoiceType Type { get; set; } = InvoiceType.Standard;

        public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

        // E-fatura alanları (gelecek entegrasyon için)
        [StringLength(100)]
        public string? EInvoiceUUID { get; set; }

        [StringLength(50)]
        public string? GibStatus { get; set; }

        [StringLength(1000)]
        public string? PdfUrl { get; set; }

        // Alıcı bilgileri
        [StringLength(150)]
        public string? ReceiverName { get; set; }

        [StringLength(20)]
        public string? ReceiverTaxNumber { get; set; }  // TCKN veya VKN

        [StringLength(300)]
        public string? ReceiverAddress { get; set; }

        public DateTime IssuedAt { get; set; } = DateTime.Now;
        public DateTime? DueAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [ForeignKey("StoreId")]
        public Store? Store { get; set; }

        [ForeignKey("CustomerRecordId")]
        public CustomerRecord? CustomerRecord { get; set; }

        [ForeignKey("JobRecordId")]
        public JobRecord? JobRecord { get; set; }
    }
}
