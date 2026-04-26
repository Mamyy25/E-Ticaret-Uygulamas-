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
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Message> Messages { get; set; }

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

            // Yeni Modeller İlişkileri
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Customer)
                .WithMany()
                .HasForeignKey(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Store)
                .WithMany(s => s.Appointments)
                .HasForeignKey(a => a.StoreId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Product)
                .WithMany(p => p.Appointments)
                .HasForeignKey(a => a.ProductId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Review>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Review>()
                .HasOne(r => r.Product)
                .WithMany(p => p.Reviews)
                .HasForeignKey(r => r.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Review>()
                .HasOne(r => r.Store)
                .WithMany(s => s.Reviews)
                .HasForeignKey(r => r.StoreId)
                .OnDelete(DeleteBehavior.Restrict);

            // Seed Data - Kategoriler
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Elektronik", Description = "Elektronik ürünler" },
                new Category { Id = 2, Name = "Giyim", Description = "Giyim ürünleri" },
                new Category { Id = 3, Name = "Kitap", Description = "Kitaplar" },
                new Category { Id = 4, Name = "Ev & Yaşam", Description = "Ev eşyaları" }
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