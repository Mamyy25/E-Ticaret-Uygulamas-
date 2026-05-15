using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Models
{
    public class RequestOffer
    {
        public int Id { get; set; }

        [Required]
        public int RequestId { get; set; }

        [Required]
        public int StoreId { get; set; }

        [Required]
        public decimal Price { get; set; }

        [Required, StringLength(1000)]
        public string Message { get; set; } = string.Empty;

        [StringLength(20)]
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [ForeignKey("RequestId")]
        public CustomerRequest? Request { get; set; }

        [ForeignKey("StoreId")]
        public Store? Store { get; set; }
    }
}
