using System.ComponentModel.DataAnnotations;

namespace ECommerce.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        [StringLength(200)]
        public string FullName { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Phone { get; set; } // telefon nullable ise ? koyabilirsin
        
        [StringLength(500)]
        public string? Address { get; set; }
        
        [StringLength(100)]
        public string? City { get; set; }
        
        [StringLength(20)]
        public string? ZipCode { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public bool IsAdmin { get; set; } = false;
        public bool IsSeller { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public DateTime? LastLoginDate { get; set; }
        
        public ICollection<Order>? Orders { get; set; }
        public Cart? Cart { get; set; }
        public Store? Store { get; set; }
    }
}