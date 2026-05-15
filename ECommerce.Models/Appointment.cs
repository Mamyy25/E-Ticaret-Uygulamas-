using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Models
{
    public class Appointment
    {
        public int Id { get; set; }

        [Required]
        public int CustomerId { get; set; }

        [Required]
        public int StoreId { get; set; }

        public int? ProductId { get; set; }

        public int? ServicePackageId { get; set; }

        [Required]
        public DateTime AppointmentDate { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Approved, Completed, Cancelled

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [ForeignKey("CustomerId")]
        public User? Customer { get; set; }

        [ForeignKey("StoreId")]
        public Store? Store { get; set; }

        [ForeignKey("ProductId")]
        public Product? Product { get; set; }

        [ForeignKey("ServicePackageId")]
        public ServicePackage? ServicePackage { get; set; }
    }
}
