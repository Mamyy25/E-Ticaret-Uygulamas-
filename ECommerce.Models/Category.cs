using System.ComponentModel.DataAnnotations;

namespace ECommerce.Models
{
    public class Category
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Kategori adý zorunludur")]
        [StringLength(100, ErrorMessage = "Kategori adý en fazla 100 karakter olabilir")]
        public string Name { get; set; }

        [StringLength(500, ErrorMessage = "Açýklama en fazla 500 karakter olabilir")]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }

        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}