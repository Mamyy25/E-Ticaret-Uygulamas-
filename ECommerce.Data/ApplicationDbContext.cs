using Microsoft.EntityFrameworkCore;
using ECommerce.Models;
using ECommerce.Models.Enums;

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
        public DbSet<ServicePackage> ServicePackages { get; set; }
        public DbSet<WorkArea> WorkAreas { get; set; }
        public DbSet<CustomerRequest> CustomerRequests { get; set; }
        public DbSet<RequestOffer> RequestOffers { get; set; }

        // ─── Faz 3: SaaS İş Araçları ─────────────────────────────────────
        public DbSet<CustomerRecord> CustomerRecords { get; set; }
        public DbSet<JobRecord> JobRecords { get; set; }
        public DbSet<PaymentRecord> PaymentRecords { get; set; }
        public DbSet<Invoice> Invoices { get; set; }

        // ─── Faz 4: Admin Governance ──────────────────────────────────────
        public DbSet<Report> Reports { get; set; }
        public DbSet<SuspensionAppeal> SuspensionAppeals { get; set; }

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

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.ServicePackage)
                .WithMany(sp => sp.Appointments)
                .HasForeignKey(a => a.ServicePackageId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ServicePackage>()
                .HasOne(sp => sp.Store)
                .WithMany(s => s.ServicePackages)
                .HasForeignKey(sp => sp.StoreId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WorkArea>()
                .HasOne(wa => wa.Store)
                .WithMany(s => s.WorkAreas)
                .HasForeignKey(wa => wa.StoreId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CustomerRequest>()
                .HasOne(cr => cr.Customer)
                .WithMany()
                .HasForeignKey(cr => cr.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RequestOffer>()
                .HasOne(ro => ro.Request)
                .WithMany(cr => cr.Offers)
                .HasForeignKey(ro => ro.RequestId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RequestOffer>()
                .HasOne(ro => ro.Store)
                .WithMany(s => s.RequestOffers)
                .HasForeignKey(ro => ro.StoreId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CustomerRequest>()
                .Property(cr => cr.Budget)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<RequestOffer>()
                .Property(ro => ro.Price)
                .HasColumnType("decimal(18,2)");

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

            // ─── Faz 3 İlişkileri ─────────────────────────────────────────────
            modelBuilder.Entity<CustomerRecord>()
                .HasOne(cr => cr.Store)
                .WithMany()
                .HasForeignKey(cr => cr.StoreId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<JobRecord>()
                .HasOne(jr => jr.Store)
                .WithMany()
                .HasForeignKey(jr => jr.StoreId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<JobRecord>()
                .HasOne(jr => jr.CustomerRecord)
                .WithMany(cr => cr.JobRecords)
                .HasForeignKey(jr => jr.CustomerRecordId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<JobRecord>()
                .HasOne(jr => jr.Appointment)
                .WithMany()
                .HasForeignKey(jr => jr.AppointmentId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<PaymentRecord>()
                .HasOne(pr => pr.Store)
                .WithMany()
                .HasForeignKey(pr => pr.StoreId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PaymentRecord>()
                .HasOne(pr => pr.CustomerRecord)
                .WithMany(cr => cr.PaymentRecords)
                .HasForeignKey(pr => pr.CustomerRecordId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<PaymentRecord>()
                .HasOne(pr => pr.JobRecord)
                .WithMany(jr => jr.PaymentRecords)
                .HasForeignKey(pr => pr.JobRecordId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.Store)
                .WithMany()
                .HasForeignKey(i => i.StoreId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.CustomerRecord)
                .WithMany()
                .HasForeignKey(i => i.CustomerRecordId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.JobRecord)
                .WithMany()
                .HasForeignKey(i => i.JobRecordId)
                .OnDelete(DeleteBehavior.NoAction);

            // ─── Faz 4 İlişkileri ─────────────────────────────────────────────
            modelBuilder.Entity<Report>()
                .HasOne(r => r.Reporter)
                .WithMany()
                .HasForeignKey(r => r.ReporterId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SuspensionAppeal>()
                .HasOne(sa => sa.User)
                .WithMany()
                .HasForeignKey(sa => sa.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SuspensionAppeal>()
                .HasOne(sa => sa.Store)
                .WithMany()
                .HasForeignKey(sa => sa.StoreId)
                .OnDelete(DeleteBehavior.Restrict);

            // Seed Data - Platform Admin
            modelBuilder.Entity<User>().HasData(new User
            {
                Id               = 9999,
                FullName         = "Platform Admin",
                Email            = "superadmin@platform.com",
                Password         = "PrP+ZrMeO00Q+nC1ytSccRIpSvauTkdqHEBRVdRaoSE=", // Admin123!
                UserType         = UserType.Admin,
                SubscriptionPlan = SubscriptionPlan.Free,
                IsActive         = true,
                CreatedAt        = new DateTime(2026, 1, 1)
            });

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