using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Models
{
    public class WorkArea
    {
        public int Id { get; set; }

        [Required]
        public int StoreId { get; set; }

        [Required, StringLength(100)]
        public string City { get; set; } = string.Empty;

        [StringLength(100)]
        public string? District { get; set; }

        public int? RadiusKm { get; set; }

        [ForeignKey("StoreId")]
        public Store? Store { get; set; }
    }
}
