using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Models
{
    public class CustomerRequest
    {
        public int Id { get; set; }

        [Required]
        public int CustomerId { get; set; }

        [Required, StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required, StringLength(2000)]
        public string Description { get; set; } = string.Empty;

        [StringLength(100)]
        public string? CategoryHint { get; set; }

        public decimal? Budget { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? ExpiresAt { get; set; }

        [ForeignKey("CustomerId")]
        public User? Customer { get; set; }

        public ICollection<RequestOffer> Offers { get; set; } = new List<RequestOffer>();
    }
}
