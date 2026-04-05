using Microsoft.EntityFrameworkCore;
using ECommerce.Models;

namespace ECommerce.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Store> Stores { get; set; }
        public DbSet<StoreCategory> StoreCategories { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // İlişkileri yapılandır
            modelBuilder.Entity<Product>()
                .HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<Product>()
                .HasOne(p => p.Store)
                .WithMany(s => s.Products)
                .HasForeignKey(p => p.StoreId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Product>()
                .HasOne(p => p.StoreCategory)
                .WithMany(sc => sc.Products)
                .HasForeignKey(p => p.StoreCategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Store>()
                .HasOne(s => s.Seller)
                .WithOne(u => u.Store)
                .HasForeignKey<Store>(s => s.SellerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<StoreCategory>()
                .HasOne(sc => sc.Store)
                .WithMany(s => s.StoreCategories)
                .HasForeignKey(sc => sc.StoreId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Order>()
                .HasOne(o => o.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Cart>()
                .HasOne(c => c.User)
                .WithOne(u => u.Cart)
                .HasForeignKey<Cart>(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed Data - Kategoriler
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Elektronik", Description = "Elektronik ürünler" },
                new Category { Id = 2, Name = "Giyim", Description = "Giyim ürünleri" },
                new Category { Id = 3, Name = "Kitap", Description = "Kitaplar" },
                new Category { Id = 4, Name = "Ev & Yaşam", Description = "Ev eşyaları" }
            );

            // Seed Data - Test Ürünleri
            modelBuilder.Entity<Product>().HasData(
                new Product { Id = 1, Name = "Laptop", Description = "15.6 inch ekran, 16GB RAM", Price = 15000, Stock = 10, CategoryId = 1, IsActive = true },
                new Product { Id = 2, Name = "Wireless Mouse", Description = "Kablosuz optik mouse", Price = 250, Stock = 50, CategoryId = 1, IsActive = true },
                new Product { Id = 3, Name = "T-Shirt", Description = "Pamuklu tişört", Price = 150, Stock = 100, CategoryId = 2, IsActive = true },
                new Product { Id = 4, Name = "Roman Kitabı", Description = "Bestseller roman", Price = 75, Stock = 30, CategoryId = 3, IsActive = true }
            );
        }

        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateTimestamps()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

            foreach (var entry in entries)
            {
                // CreatedAt kontrolü
                var createdAtProp = entry.Metadata.FindProperty("CreatedAt");
                if (createdAtProp != null && entry.State == EntityState.Added)
                {
                    entry.Property("CreatedAt").CurrentValue = DateTime.Now;
                }

                // UpdatedAt kontrolü
                var updatedAtProp = entry.Metadata.FindProperty("UpdatedAt");
                if (updatedAtProp != null && entry.State == EntityState.Modified)
                {
                    entry.Property("UpdatedAt").CurrentValue = DateTime.Now;
                }
            }
        }
    }
}