using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Models
{
    public class StoreCategory
    {
        public int Id { get; set; }

        [Required]
        public int StoreId { get; set; }

        [Required(ErrorMessage = "Kategori adı zorunludur")]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [ForeignKey("StoreId")]
        public Store? Store { get; set; }

        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
